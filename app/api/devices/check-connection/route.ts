import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

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

    console.log("🔍 [CHECK CONNECTION] Checking code:", { pairingCode, userId: user.id })

    if (!pairingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code is required",
        },
        { status: 400 },
      )
    }

    // Check if there's a device connected to this pairing code
    const connectionCheck = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.device_id,
        dpc.expires_at,
        d.id as device_id,
        d.name as device_name,
        d.status as device_status,
        d.last_heartbeat,
        d.created_at as device_created
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.id = dpc.device_id
      WHERE dpc.code = ${pairingCode}
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > NOW()
      ORDER BY dpc.created_at DESC
      LIMIT 1
    `

    console.log("🔍 [CHECK CONNECTION] Connection check result:", connectionCheck)

    if (connectionCheck.length === 0) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Pairing code not found or expired",
      })
    }

    const record = connectionCheck[0]
    const isConnected = !!record.device_id

    console.log("🔍 [CHECK CONNECTION] Connection status:", {
      isConnected,
      deviceId: record.device_id,
      deviceName: record.device_name,
    })

    return NextResponse.json({
      success: true,
      connected: isConnected,
      device: isConnected
        ? {
            id: record.device_id,
            name: record.device_name || record.screen_name,
            status: record.device_status || "connected",
            type: record.device_type,
            lastSeen: record.last_heartbeat,
            connectedAt: record.device_created,
          }
        : null,
      message: isConnected ? "Device connected" : "Waiting for device connection",
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
