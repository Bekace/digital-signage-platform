import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceCode, name, deviceType, platform, userAgent, screenResolution, capabilities } = body

    if (!deviceCode) {
      return NextResponse.json({ success: false, error: "Device code is required" }, { status: 400 })
    }

    // Validate the device code
    const codeResult = await sql`
      SELECT * FROM device_pairing_codes 
      WHERE code = ${deviceCode} 
      AND used = false 
      AND expires_at > NOW()
    `

    if (codeResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or expired device code" }, { status: 400 })
    }

    const pairingCode = codeResult.rows[0]
    const userId = pairingCode.user_id

    // Register the device - IMPORTANT: Don't include updated_at, created_at, or last_seen fields
    // Let the database handle these with default values or triggers
    const deviceResult = await sql`
      INSERT INTO devices (
        name, 
        device_type, 
        user_id, 
        status,
        platform,
        user_agent,
        screen_resolution,
        capabilities
      ) 
      VALUES (
        ${name || `Device ${deviceCode}`}, 
        ${deviceType || "unknown"}, 
        ${userId}, 
        ${"online"},
        ${platform || null},
        ${userAgent || null},
        ${screenResolution || null},
        ${capabilities ? JSON.stringify(capabilities) : null}
      )
      RETURNING *
    `

    if (deviceResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to register device" }, { status: 500 })
    }

    const device = deviceResult.rows[0]

    // Mark the pairing code as used
    await sql`
      UPDATE device_pairing_codes 
      SET used = true, device_id = ${device.id}
      WHERE id = ${pairingCode.id}
    `

    // Log the device registration
    console.log(`Device registered: ${device.id} with code ${deviceCode}`)

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        type: device.device_type,
        status: device.status,
        created_at: device.created_at,
      },
    })
  } catch (error) {
    console.error("Error registering device:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
