import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pairingCode } = body

    console.log("[CHECK CONNECTION] Checking connection for code:", pairingCode)

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Check if device is connected for this pairing code
    const result = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.used_at,
        dpc.completed_at,
        d.id as device_id,
        d.name as device_name,
        d.status as device_status,
        d.last_seen,
        d.created_at as device_created
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.id = dpc.device_id
      WHERE dpc.code = ${pairingCode}
      AND dpc.expires_at > NOW()
      ORDER BY dpc.created_at DESC
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: "Invalid or expired pairing code",
      })
    }

    const record = result[0]

    // Check if device is connected
    const isConnected = record.device_id && record.completed_at && record.device_status !== "offline"

    console.log("[CHECK CONNECTION] Connection status:", {
      pairingCode,
      isConnected,
      deviceId: record.device_id,
      deviceStatus: record.device_status,
    })

    return NextResponse.json({
      success: true,
      connected: isConnected,
      pairingCode: record.code,
      screenName: record.screen_name,
      deviceType: record.device_type,
      device: isConnected
        ? {
            id: record.device_id,
            name: record.device_name,
            status: record.device_status,
            lastSeen: record.last_seen,
            createdAt: record.device_created,
          }
        : null,
    })
  } catch (error) {
    console.error("[CHECK CONNECTION] Error:", error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: "Failed to check connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
