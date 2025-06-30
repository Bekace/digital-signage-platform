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

    // Check if pairing code exists and get its details
    const pairingCodeRecord = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.user_id,
        dpc.expires_at,
        dpc.used_at,
        dpc.device_id,
        dpc.completed_at,
        d.id as linked_device_id,
        d.name as device_name,
        d.status as device_status,
        d.last_seen,
        d.created_at as device_created_at
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

    // Check if device is already linked and we have the device record
    if (record.device_id && record.linked_device_id) {
      console.log("🔍 [CHECK CONNECTION] Device already connected:", {
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
          id: record.linked_device_id,
          name: record.device_name,
          type: record.device_type,
          status: record.device_status,
          lastSeen: record.last_seen,
          createdAt: record.device_created_at,
        },
        message: "Device is connected",
      })
    }

    // Look for recently created devices that might match this pairing code
    // Check for devices created in the last 10 minutes
    const recentDevices = await sql`
      SELECT id, name, device_type, status, last_seen, created_at
      FROM devices 
      WHERE user_id = ${user.id}
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
      AND (
        name ILIKE ${`%${record.screen_name}%`} OR
        device_type = ${record.device_type} OR
        name ILIKE ${`%Device-${record.code}%`} OR
        name ILIKE ${`%${record.code}%`}
      )
      ORDER BY created_at DESC
      LIMIT 5
    `

    console.log("🔍 [CHECK CONNECTION] Recent devices found:", recentDevices)

    // Also check for any devices created with the pairing code in the name
    const devicesByCode = await sql`
      SELECT id, name, device_type, status, last_seen, created_at
      FROM devices 
      WHERE user_id = ${user.id}
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
      AND (
        name ILIKE ${`%${pairingCode}%`} OR
        name = ${record.screen_name}
      )
      ORDER BY created_at DESC
      LIMIT 1
    `

    console.log("🔍 [CHECK CONNECTION] Devices by code:", devicesByCode)

    const matchedDevice = recentDevices[0] || devicesByCode[0]

    if (matchedDevice) {
      console.log("🔍 [CHECK CONNECTION] Found matching recent device:", matchedDevice)

      // Link this device to the pairing code
      await sql`
        UPDATE device_pairing_codes 
        SET 
          device_id = ${matchedDevice.id},
          used_at = CURRENT_TIMESTAMP,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${record.id}
      `

      console.log("🔍 [CHECK CONNECTION] Linked device to pairing code:", matchedDevice.id)

      return NextResponse.json({
        success: true,
        connected: true,
        device: {
          id: matchedDevice.id,
          name: matchedDevice.name,
          type: matchedDevice.device_type,
          status: matchedDevice.status,
          lastSeen: matchedDevice.last_seen,
          createdAt: matchedDevice.created_at,
        },
        message: "Device connected successfully",
      })
    }

    // No device connected yet
    console.log("🔍 [CHECK CONNECTION] No device connected yet")
    return NextResponse.json({
      success: true,
      connected: false,
      message: "Waiting for device connection",
      expiresAt: record.expires_at,
      timeRemaining: Math.max(0, Math.floor((new Date(record.expires_at).getTime() - Date.now()) / 1000)),
    })
  } catch (error) {
    console.error("🔍 [CHECK CONNECTION] Error:", error)
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
