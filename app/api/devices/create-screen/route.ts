import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

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

    // Check if pairing code exists and is completed (device connected)
    const pairingRecord = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.user_id,
        dpc.device_id,
        dpc.completed_at,
        d.id as device_exists,
        d.name as device_name,
        d.status as device_status
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      WHERE dpc.code = ${pairingCode}
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > CURRENT_TIMESTAMP
    `

    console.log("📺 [CREATE SCREEN] Pairing record:", pairingRecord)

    if (pairingRecord.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired pairing code",
        },
        { status: 400 },
      )
    }

    const record = pairingRecord[0]

    if (!record.device_id || !record.device_exists) {
      return NextResponse.json(
        {
          success: false,
          error: "No device connected with this pairing code",
        },
        { status: 400 },
      )
    }

    // Mark the pairing process as fully completed
    await sql`
      UPDATE device_pairing_codes 
      SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${record.id}
    `

    // Update device status to ensure it's active
    await sql`
      UPDATE devices 
      SET 
        status = 'online',
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${record.device_id}
    `

    console.log("📺 [CREATE SCREEN] Screen created successfully for device:", record.device_id)

    return NextResponse.json({
      success: true,
      screen: {
        id: record.device_id,
        name: record.device_name || record.screen_name,
        type: record.device_type,
        status: record.device_status || "online",
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
