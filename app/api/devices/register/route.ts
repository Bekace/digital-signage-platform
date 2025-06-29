import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      deviceCode,
      deviceName = "Web Player Device",
      deviceType = "web-player",
      platform = "Unknown",
      capabilities = [],
      screenResolution = "",
    } = body

    if (!deviceCode) {
      return NextResponse.json({ error: "Device code is required" }, { status: 400 })
    }

    // Validate the pairing code
    const pairingCodeResult = await sql`
      SELECT id, user_id, expires_at, used_at 
      FROM device_pairing_codes 
      WHERE code = ${deviceCode}
    `

    if (pairingCodeResult.length === 0) {
      return NextResponse.json({ error: "Invalid device code" }, { status: 400 })
    }

    const pairingCode = pairingCodeResult[0]

    // Check if code has expired
    if (new Date(pairingCode.expires_at) < new Date()) {
      return NextResponse.json({ error: "Device code has expired" }, { status: 400 })
    }

    // Check if code has already been used
    if (pairingCode.used_at) {
      return NextResponse.json({ error: "Device code has already been used" }, { status: 400 })
    }

    // Create the device
    const deviceResult = await sql`
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
        ${deviceName}, 
        ${deviceType}, 
        ${platform}, 
        ${JSON.stringify(capabilities)}, 
        ${screenResolution}, 
        ${pairingCode.user_id},
        'online',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, name, device_type, status, created_at
    `

    if (deviceResult.length === 0) {
      return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
    }

    const device = deviceResult[0]

    // Mark the pairing code as used
    await sql`
      UPDATE device_pairing_codes 
      SET used_at = CURRENT_TIMESTAMP, device_id = ${device.id}
      WHERE id = ${pairingCode.id}
    `

    // Create initial heartbeat entry
    await sql`
      INSERT INTO device_heartbeats (device_id, status, performance_metrics)
      VALUES (${device.id}, 'online', '{"connected": true}')
    `

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        type: device.device_type,
        status: device.status,
        createdAt: device.created_at,
      },
      message: "Device registered successfully",
    })
  } catch (error) {
    console.error("Device registration error:", error)
    return NextResponse.json(
      {
        error: "Failed to register device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
