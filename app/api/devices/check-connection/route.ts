import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔗 [CHECK CONNECTION] Starting connection check...")

    const body = await request.json()
    const { pairingCode } = body

    console.log("🔗 [CHECK CONNECTION] Checking code:", pairingCode)

    if (!pairingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code is required",
        },
        { status: 400 },
      )
    }

    // Check if a device has registered with this pairing code
    const deviceCheck = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.used_at,
        dpc.completed_at,
        d.id as device_id,
        d.name as device_name,
        d.status
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.id = dpc.device_id
      WHERE dpc.code = ${pairingCode}
      AND dpc.expires_at > NOW()
      ORDER BY dpc.created_at DESC
      LIMIT 1
    `

    console.log("🔗 [CHECK CONNECTION] Device check result:", deviceCheck)

    if (deviceCheck.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid or expired pairing code",
      })
    }

    const pairingData = deviceCheck[0]

    // Check if device is connected (has used_at but not completed_at)
    const isConnected = pairingData.used_at && !pairingData.completed_at
    const isCompleted = pairingData.completed_at

    console.log("🔗 [CHECK CONNECTION] Status:", {
      isConnected,
      isCompleted,
      used_at: pairingData.used_at,
      completed_at: pairingData.completed_at,
      device_id: pairingData.device_id,
    })

    return NextResponse.json({
      success: true,
      isConnected,
      isCompleted,
      deviceInfo: pairingData.device_id
        ? {
            id: pairingData.device_id,
            name: pairingData.device_name,
            type: pairingData.device_type,
            status: pairingData.status,
          }
        : null,
      screenName: pairingData.screen_name,
      deviceType: pairingData.device_type,
    })
  } catch (error) {
    console.error("🔗 [CHECK CONNECTION] Error:", error)
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
