import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [CHECK CONNECTION] Starting connection check...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🔍 [CHECK CONNECTION] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("🔍 [CHECK CONNECTION] Checking pairing code:", pairingCode)

    if (!pairingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code is required",
        },
        { status: 400 },
      )
    }

    // Check if pairing code exists and is valid
    const pairingCodeRecord = await sql`
      SELECT 
        id,
        code,
        screen_name,
        device_type,
        expires_at,
        completed_at,
        user_id
      FROM device_pairing_codes 
      WHERE code = ${pairingCode} 
      AND user_id = ${user.id}
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (pairingCodeRecord.length === 0) {
      console.log("🔍 [CHECK CONNECTION] Pairing code not found or expired")
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Pairing code not found or expired",
      })
    }

    const record = pairingCodeRecord[0]

    // Check if already completed (device connected)
    if (record.completed_at) {
      console.log("🔍 [CHECK CONNECTION] Device already connected")

      // Find the connected device
      const device = await sql`
        SELECT id, name, device_type, status
        FROM devices
        WHERE user_id = ${user.id}
        AND name = ${record.screen_name}
        ORDER BY created_at DESC
        LIMIT 1
      `

      return NextResponse.json({
        success: true,
        connected: true,
        device: device[0] || null,
        message: "Device is connected",
      })
    }

    console.log("🔍 [CHECK CONNECTION] Device not yet connected")
    return NextResponse.json({
      success: true,
      connected: false,
      message: "Waiting for device connection",
    })
  } catch (error) {
    console.error("🔍 [CHECK CONNECTION] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
