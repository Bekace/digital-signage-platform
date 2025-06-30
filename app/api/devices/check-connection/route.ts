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
        dpc.id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.expires_at,
        dpc.used_at,
        dpc.device_id,
        dpc.completed_at,
        dpc.user_id,
        d.id as device_exists,
        d.name as device_name,
        d.status as device_status
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      WHERE dpc.code = ${pairingCode} 
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > CURRENT_TIMESTAMP
      ORDER BY dpc.created_at DESC
      LIMIT 1
    `

    console.log("🔍 [CHECK CONNECTION] Pairing code lookup result:", pairingCodeRecord)

    if (pairingCodeRecord.length === 0) {
      console.log("🔍 [CHECK CONNECTION] Pairing code not found or expired")
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Pairing code not found or expired",
      })
    }

    const record = pairingCodeRecord[0]

    // Check if device has been registered with this pairing code
    if (record.device_id && record.device_exists) {
      console.log("🔍 [CHECK CONNECTION] Device found and connected:", {
        deviceId: record.device_id,
        deviceName: record.device_name,
        status: record.device_status,
      })

      // Mark as completed if not already done
      if (!record.completed_at) {
        await sql`
          UPDATE device_pairing_codes 
          SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${record.id}
        `
        console.log("🔍 [CHECK CONNECTION] Marked pairing code as completed")
      }

      return NextResponse.json({
        success: true,
        connected: true,
        device: {
          id: record.device_id,
          name: record.device_name || record.screen_name,
          type: record.device_type,
          status: record.device_status || "online",
        },
        message: "Device is connected",
      })
    }

    // Also check if any device was recently registered that matches this pairing code
    // (in case the device_id wasn't properly linked)
    const recentDevices = await sql`
      SELECT id, name, device_type, status, created_at
      FROM devices
      WHERE user_id = ${user.id}
      AND name = ${record.screen_name}
      AND created_at > (CURRENT_TIMESTAMP - INTERVAL '10 minutes')
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (recentDevices.length > 0) {
      const device = recentDevices[0]
      console.log("🔍 [CHECK CONNECTION] Found matching recent device:", device)

      // Link the device to the pairing code
      await sql`
        UPDATE device_pairing_codes 
        SET 
          device_id = ${device.id}, 
          used_at = CURRENT_TIMESTAMP,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${record.id}
      `

      return NextResponse.json({
        success: true,
        connected: true,
        device: {
          id: device.id,
          name: device.name,
          type: device.device_type,
          status: device.status,
        },
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
