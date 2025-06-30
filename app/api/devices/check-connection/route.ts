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

    console.log("🔍 [CHECK CONNECTION] Checking code:", pairingCode)

    if (!pairingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code is required",
        },
        { status: 400 },
      )
    }

    // Check if the pairing code exists and is valid
    const pairingRecord = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.expires_at,
        dpc.used_at,
        d.id as device_id,
        d.name as device_name,
        d.status as device_status
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.pairing_code = dpc.code
      WHERE dpc.code = ${pairingCode}
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > NOW()
    `

    if (pairingRecord.length === 0) {
      console.log("🔍 [CHECK CONNECTION] Pairing code not found or expired")
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Pairing code not found or expired",
      })
    }

    const record = pairingRecord[0]
    const isConnected = !!record.device_id

    console.log("🔍 [CHECK CONNECTION] Connection status:", {
      code: record.code,
      connected: isConnected,
      deviceId: record.device_id,
      deviceName: record.device_name,
    })

    return NextResponse.json({
      success: true,
      connected: isConnected,
      device: isConnected
        ? {
            id: record.device_id,
            name: record.device_name,
            status: record.device_status,
          }
        : null,
      pairingCode: record.code,
      screenName: record.screen_name,
      deviceType: record.device_type,
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
