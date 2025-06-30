import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceCode, deviceType, deviceName, capabilities = [], screenResolution, userAgent } = body

    console.log("Device registration attempt:", { deviceCode, deviceType, deviceName })

    if (!deviceCode) {
      return NextResponse.json({ success: false, message: "Device code is required" }, { status: 400 })
    }

    // Check if pairing code exists and is valid
    const pairingCodeResult = await sql`
      SELECT id, user_id, expires_at, used_at, device_id
      FROM device_pairing_codes 
      WHERE code = ${deviceCode} 
      AND expires_at > CURRENT_TIMESTAMP 
      AND used_at IS NULL
    `

    if (pairingCodeResult.length === 0) {
      console.log("Invalid or expired device code:", deviceCode)
      return NextResponse.json({ success: false, message: "Invalid or expired device code" }, { status: 400 })
    }

    const pairingCode = pairingCodeResult[0]
    console.log("Found pairing code:", pairingCode)

    let device

    // Check if device already exists for this pairing code
    if (pairingCode.device_id) {
      // Update existing device
      const existingDeviceResult = await sql`
        UPDATE devices 
        SET 
          name = ${deviceName || "Web Browser Device"},
          device_type = ${deviceType || "web_browser"},
          platform = ${userAgent || "Unknown"},
          capabilities = ${JSON.stringify(capabilities)},
          screen_resolution = ${screenResolution || ""},
          status = 'online',
          last_seen = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${pairingCode.device_id}
        RETURNING id, name, device_type, status, capabilities, created_at
      `

      if (existingDeviceResult.length > 0) {
        device = existingDeviceResult[0]
        console.log("Updated existing device:", device.id)
      }
    }

    // If no existing device or update failed, create new device
    if (!device) {
      const newDeviceResult = await sql`
        INSERT INTO devices (
          name, 
          device_type, 
          platform, 
          capabilities, 
          screen_resolution, 
          user_id,
          status, 
          last_seen, 
          created_at, 
          updated_at
        )
        VALUES (
          ${deviceName || "Web Browser Device"},
          ${deviceType || "web_browser"},
          ${userAgent || "Unknown"},
          ${JSON.stringify(capabilities)},
          ${screenResolution || ""},
          ${pairingCode.user_id || null},
          'online',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING id, name, device_type, status, capabilities, created_at
      `

      if (newDeviceResult.length === 0) {
        console.error("Failed to create device")
        return NextResponse.json({ success: false, message: "Failed to create device" }, { status: 500 })
      }

      device = newDeviceResult[0]
      console.log("Created new device:", device.id)

      // Link the pairing code to the device
      await sql`
        UPDATE device_pairing_codes 
        SET device_id = ${device.id}, used_at = CURRENT_TIMESTAMP
        WHERE code = ${deviceCode}
      `
    }

    // Create initial heartbeat entry
    try {
      await sql`
        INSERT INTO device_heartbeats (device_id, status, performance_metrics, created_at)
        VALUES (${device.id}, 'online', '{"connected": true}', CURRENT_TIMESTAMP)
        ON CONFLICT (device_id) DO UPDATE SET
          status = 'online',
          performance_metrics = '{"connected": true}',
          updated_at = CURRENT_TIMESTAMP
      `
    } catch (heartbeatError) {
      console.warn("Failed to create heartbeat entry:", heartbeatError)
      // Don't fail the registration if heartbeat creation fails
    }

    console.log("Device registered successfully:", device.id)

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        type: device.device_type,
        status: device.status,
        capabilities: typeof device.capabilities === "string" ? JSON.parse(device.capabilities) : device.capabilities,
        createdAt: device.created_at,
      },
      message: "Device registered successfully",
    })
  } catch (error) {
    console.error("Device registration error:", error)

    // Return more detailed error information for debugging
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register device",
        error: error instanceof Error ? error.message : "Unknown error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
