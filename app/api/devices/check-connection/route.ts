import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { pairingCode } = await request.json()

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    console.log("🔍 [CHECK CONNECTION] Checking for code:", pairingCode)

    // Check if device has been registered with this pairing code
    const devices = await sql`
      SELECT d.*, dpc.screen_name, dpc.device_type as pairing_device_type
      FROM devices d
      JOIN device_pairing_codes dpc ON d.pairing_code_id = dpc.id
      WHERE dpc.code = ${pairingCode.toUpperCase()}
      AND dpc.expires_at > NOW()
      ORDER BY d.created_at DESC
      LIMIT 1
    `

    if (devices.length > 0) {
      const device = devices[0]
      console.log("🔍 [CHECK CONNECTION] Found connected device:", device.id)

      return NextResponse.json({
        success: true,
        connected: true,
        device: {
          id: device.id,
          name: device.screen_name,
          deviceType: device.pairing_device_type,
          status: device.status,
          connectedAt: device.created_at,
        },
      })
    }

    console.log("🔍 [CHECK CONNECTION] No device found for code:", pairingCode)
    return NextResponse.json({
      success: true,
      connected: false,
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
