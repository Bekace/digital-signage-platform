import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("🔍 [CHECK CONNECTION] Checking code:", pairingCode)

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Check if device has connected with this pairing code
    const result = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.used_at,
        dpc.device_id,
        d.id as device_id,
        d.name as device_name,
        d.status as device_status,
        d.last_seen
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      WHERE dpc.code = ${pairingCode} 
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > CURRENT_TIMESTAMP
    `

    console.log("🔍 [CHECK CONNECTION] Query result:", result)

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: "Invalid or expired pairing code",
      })
    }

    const pairingRecord = result[0]

    // Check if device is connected
    const isConnected = !!(pairingRecord.device_id && pairingRecord.used_at)
    const deviceInfo = isConnected
      ? {
          id: pairingRecord.device_id,
          name: pairingRecord.device_name,
          status: pairingRecord.device_status,
          lastSeen: pairingRecord.last_seen,
        }
      : null

    console.log("🔍 [CHECK CONNECTION] Connection status:", { isConnected, deviceInfo })

    return NextResponse.json({
      success: true,
      connected: isConnected,
      pairingCode: pairingRecord.code,
      screenName: pairingRecord.screen_name,
      deviceType: pairingRecord.device_type,
      device: deviceInfo,
      message: isConnected ? "Device connected successfully" : "Waiting for device connection",
    })
  } catch (error) {
    console.error("❌ [CHECK CONNECTION] Error:", error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: "Failed to check connection",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
