import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("📺 [CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📺 [CREATE SCREEN] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("📺 [CREATE SCREEN] Request:", { pairingCode, userId: user.id })

    if (!pairingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code is required",
        },
        { status: 400 },
      )
    }

    // Check if the pairing code exists and has a connected device
    const pairingRecord = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.user_id as pairing_user_id,
        dpc.device_id,
        dpc.expires_at,
        dpc.completed_at,
        d.id as device_id,
        d.name as device_name,
        d.status as device_status,
        d.user_id as device_user_id
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.id = dpc.device_id
      WHERE dpc.code = ${pairingCode}
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > NOW()
      ORDER BY dpc.created_at DESC
      LIMIT 1
    `

    console.log("📺 [CREATE SCREEN] Pairing record found:", pairingRecord)

    if (pairingRecord.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code not found or expired",
        },
        { status: 400 },
      )
    }

    const record = pairingRecord[0]

    if (!record.device_id) {
      return NextResponse.json(
        {
          success: false,
          error: "No device connected to this pairing code",
        },
        { status: 400 },
      )
    }

    // Update the device to assign it to the user and set the screen name
    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        user_id = ${user.id},
        name = ${record.screen_name},
        status = 'online'
      WHERE id = ${record.device_id}
      RETURNING id, name, device_type, status, created_at, last_heartbeat
    `

    if (updatedDevice.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update device",
        },
        { status: 500 },
      )
    }

    // Mark the pairing code as used/completed
    await sql`
      UPDATE device_pairing_codes 
      SET completed_at = NOW()
      WHERE id = ${record.pairing_id}
    `

    const device = updatedDevice[0]

    console.log("📺 [CREATE SCREEN] Screen created successfully:", {
      deviceId: device.id,
      screenName: device.name,
      deviceType: device.device_type,
    })

    return NextResponse.json({
      success: true,
      screen: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        status: device.status,
        createdAt: device.created_at,
        lastSeen: device.last_heartbeat,
      },
      message: "Screen created successfully",
    })
  } catch (error) {
    console.error("📺 [CREATE SCREEN] Error:", error)
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
