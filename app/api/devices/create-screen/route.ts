import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("📱 [CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📱 [CREATE SCREEN] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode, screenName } = body

    console.log("📱 [CREATE SCREEN] Request data:", { pairingCode, screenName, userId: user.id })

    if (!pairingCode || !screenName) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code and screen name are required",
        },
        { status: 400 },
      )
    }

    // Find the device that was registered with this pairing code
    const devices = await sql`
      SELECT d.*, dpc.screen_name as original_screen_name, dpc.device_type
      FROM devices d
      JOIN device_pairing_codes dpc ON d.pairing_code_id = dpc.id
      WHERE dpc.code = ${pairingCode.toUpperCase()}
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > NOW()
      ORDER BY d.created_at DESC
      LIMIT 1
    `

    if (devices.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No device found with this pairing code or code has expired",
        },
        { status: 404 },
      )
    }

    const device = devices[0]

    // Update the device with the final screen name and link to user
    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        name = ${screenName},
        user_id = ${user.id},
        status = 'active',
        updated_at = NOW()
      WHERE id = ${device.id}
      RETURNING *
    `

    // Mark the pairing code as completed
    await sql`
      UPDATE device_pairing_codes 
      SET completed_at = NOW()
      WHERE code = ${pairingCode.toUpperCase()}
      AND user_id = ${user.id}
    `

    console.log("📱 [CREATE SCREEN] Screen created successfully:", updatedDevice[0])

    return NextResponse.json({
      success: true,
      screen: {
        id: updatedDevice[0].id,
        name: updatedDevice[0].name,
        deviceType: device.device_type,
        status: updatedDevice[0].status,
        createdAt: updatedDevice[0].created_at,
        lastSeen: updatedDevice[0].last_heartbeat,
      },
    })
  } catch (error) {
    console.error("📱 [CREATE SCREEN] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create screen",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
