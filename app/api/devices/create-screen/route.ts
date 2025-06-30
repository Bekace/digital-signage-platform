import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔗 [CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🔗 [CREATE SCREEN] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode, screenName } = body

    console.log("🔗 [CREATE SCREEN] Request:", { pairingCode, screenName, userId: user.id })

    if (!pairingCode || !screenName) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code and screen name are required",
        },
        { status: 400 },
      )
    }

    // Find the pairing code and associated device
    const pairingData = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.device_id,
        dpc.user_id as pairing_user_id,
        dpc.used_at,
        dpc.completed_at,
        d.id as device_id,
        d.name as device_name,
        d.device_type,
        d.user_id as device_user_id
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.id = dpc.device_id
      WHERE dpc.code = ${pairingCode}
      AND dpc.expires_at > NOW()
      ORDER BY dpc.created_at DESC
      LIMIT 1
    `

    if (pairingData.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid or expired pairing code",
      })
    }

    const pairing = pairingData[0]

    if (!pairing.device_id) {
      return NextResponse.json({
        success: false,
        error: "No device connected with this pairing code",
      })
    }

    if (pairing.completed_at) {
      return NextResponse.json({
        success: false,
        error: "This pairing code has already been used",
      })
    }

    // Update the device to assign it to the current user and set the screen name
    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        user_id = ${user.id},
        name = ${screenName},
        status = 'idle'
      WHERE id = ${pairing.device_id}
      RETURNING id, name, device_type, status, created_at
    `

    // Mark the pairing as completed
    await sql`
      UPDATE device_pairing_codes 
      SET 
        completed_at = NOW(),
        user_id = ${user.id}
      WHERE id = ${pairing.pairing_id}
    `

    console.log("🔗 [CREATE SCREEN] Screen created successfully:", updatedDevice[0])

    return NextResponse.json({
      success: true,
      screen: {
        id: updatedDevice[0].id,
        name: updatedDevice[0].name,
        type: updatedDevice[0].device_type,
        status: updatedDevice[0].status,
        createdAt: updatedDevice[0].created_at,
      },
    })
  } catch (error) {
    console.error("🔗 [CREATE SCREEN] Error:", error)
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
