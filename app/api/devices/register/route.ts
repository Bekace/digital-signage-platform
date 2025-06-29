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
    const [pairingCode] = await sql`
      SELECT * FROM device_pairing_codes 
      WHERE code = ${deviceCode} 
      AND expires_at > CURRENT_TIMESTAMP 
      AND used_at IS NULL
    `

    if (!pairingCode) {
      return NextResponse.json({ success: false, message: "Invalid or expired device code" }, { status: 400 })
    }

    // Check if device already exists for this pairing code
    let device
    if (pairingCode.device_id) {
      // Update existing device
      const [existingDevice] = await sql`
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
        RETURNING *
      `
      device = existingDevice
    } else {
      // Create new device - we need a user_id, so we'll create a temporary one or use a default
      // For testing purposes, we'll create a device without a specific user
      const [newDevice] = await sql`
        INSERT INTO devices (
          name, 
          device_type, 
          platform, 
          capabilities, 
          screen_resolution, 
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
          'online',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
      device = newDevice

      // Link the pairing code to the device
      await sql`
        UPDATE device_pairing_codes 
        SET device_id = ${device.id}, used_at = CURRENT_TIMESTAMP
        WHERE code = ${deviceCode}
      `
    }

    console.log("Device registered successfully:", device.id)

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        type: device.device_type,
        status: device.status,
        capabilities: device.capabilities,
      },
      message: "Device registered successfully",
    })
  } catch (error) {
    console.error("Device registration error:", error)
    return NextResponse.json({ success: false, message: "Failed to register device" }, { status: 500 })
  }
}
