import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔗 [DEVICE REGISTER] Starting device registration...")

    const body = await request.json()
    const { pairingCode, deviceInfo } = body

    console.log("🔗 [DEVICE REGISTER] Request:", { pairingCode, deviceInfo })

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Verify pairing code exists and is not expired
    const pairingResult = await sql`
      SELECT id, screen_name, device_type, user_id, expires_at, completed_at
      FROM device_pairing_codes 
      WHERE code = ${pairingCode}
    `

    if (pairingResult.length === 0) {
      console.log("🔗 [DEVICE REGISTER] Pairing code not found:", pairingCode)
      return NextResponse.json({ success: false, error: "Invalid pairing code" }, { status: 400 })
    }

    const pairing = pairingResult[0]

    // Check if code is expired
    if (new Date(pairing.expires_at) < new Date()) {
      console.log("🔗 [DEVICE REGISTER] Pairing code expired:", pairingCode)
      return NextResponse.json({ success: false, error: "Pairing code has expired" }, { status: 400 })
    }

    // Check if code is already used
    if (pairing.completed_at) {
      console.log("🔗 [DEVICE REGISTER] Pairing code already used:", pairingCode)
      return NextResponse.json({ success: false, error: "Pairing code has already been used" }, { status: 400 })
    }

    console.log("🔗 [DEVICE REGISTER] Valid pairing code found for user:", pairing.user_id)

    // Create device record - ONLY use columns that exist in the database
    const deviceData = {
      name: pairing.screen_name,
      device_type: pairing.device_type || "web_browser",
      platform: deviceInfo?.platform || "Web",
      capabilities: JSON.stringify(deviceInfo?.capabilities || []),
      screen_resolution: deviceInfo?.screenResolution || "1920x1080",
      user_id: pairing.user_id,
      status: "online",
    }

    console.log("🔗 [DEVICE REGISTER] Creating device with data:", deviceData)

    // Insert new device - REMOVED updated_at field that doesn't exist
    const deviceResult = await sql`
      INSERT INTO devices (
        name, 
        device_type, 
        platform, 
        capabilities, 
        screen_resolution, 
        user_id, 
        status,
        last_seen
      ) VALUES (
        ${deviceData.name},
        ${deviceData.device_type},
        ${deviceData.platform},
        ${deviceData.capabilities},
        ${deviceData.screen_resolution},
        ${deviceData.user_id},
        ${deviceData.status},
        NOW()
      )
      RETURNING id, name, device_type, platform, screen_resolution, status, created_at
    `

    const device = deviceResult[0]
    console.log("🔗 [DEVICE REGISTER] Device created:", device)

    // Mark pairing code as completed
    await sql`
      UPDATE device_pairing_codes 
      SET completed_at = NOW(), device_id = ${device.id}
      WHERE code = ${pairingCode}
    `

    console.log("🔗 [DEVICE REGISTER] Pairing code marked as completed")

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        platform: device.platform,
        screenResolution: device.screen_resolution,
        status: device.status,
        createdAt: device.created_at,
      },
      message: "Device registered successfully",
    })
  } catch (error) {
    console.error("🔗 [DEVICE REGISTER] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to register device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
