import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔗 [DEVICE REGISTER] Starting device registration...")

    const body = await request.json()
    const { pairingCode, deviceInfo } = body

    console.log("🔗 [DEVICE REGISTER] Request data:", { pairingCode, deviceInfo })

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Test database connection
    try {
      await sql`SELECT 1`
      console.log("🔗 [DEVICE REGISTER] Database connection successful")
    } catch (dbError) {
      console.error("🔗 [DEVICE REGISTER] Database connection failed:", dbError)
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 })
    }

    // Verify pairing code exists and is not expired
    console.log("🔗 [DEVICE REGISTER] Looking up pairing code:", pairingCode)

    const pairingResult = await sql`
      SELECT id, screen_name, device_type, user_id, expires_at, completed_at, device_id
      FROM device_pairing_codes 
      WHERE code = ${pairingCode}
    `

    console.log("🔗 [DEVICE REGISTER] Pairing code query result:", pairingResult)

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

    // Create device record
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

    // Insert new device
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
        created_at
      ) VALUES (
        ${deviceData.name},
        ${deviceData.device_type},
        ${deviceData.platform},
        ${deviceData.capabilities},
        ${deviceData.screen_resolution},
        ${deviceData.user_id},
        ${deviceData.status},
        NOW(),
        NOW()
      )
      RETURNING id, name, device_type, platform, screen_resolution, status, user_id, created_at
    `

    const device = deviceResult[0]
    console.log("🔗 [DEVICE REGISTER] Device created successfully:", device)

    // Mark pairing code as completed and link to device
    const updateResult = await sql`
      UPDATE device_pairing_codes 
      SET completed_at = NOW(), device_id = ${device.id}, used_at = NOW()
      WHERE code = ${pairingCode}
      RETURNING id, completed_at, device_id
    `

    console.log("🔗 [DEVICE REGISTER] Pairing code updated:", updateResult)

    // Verify the device was created by querying back
    const verification = await sql`
      SELECT * FROM devices WHERE id = ${device.id}
    `
    console.log("🔗 [DEVICE REGISTER] Device verification:", verification)

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        platform: device.platform,
        screenResolution: device.screen_resolution,
        status: device.status,
        userId: device.user_id,
        createdAt: device.created_at,
      },
      message: "Device registered successfully",
      debug: {
        deviceId: device.id,
        pairingCodeId: pairing.id,
        timestamp: new Date().toISOString(),
      },
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
