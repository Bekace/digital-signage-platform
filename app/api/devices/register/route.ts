import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("📱 [DEVICE REGISTER] Starting device registration...")

    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📱 [DEVICE REGISTER] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { deviceCode, pairingCode, name, deviceType, type, platform, userAgent, screenResolution, capabilities } =
      body

    // Support both deviceCode and pairingCode for backward compatibility
    const code = deviceCode || pairingCode

    console.log("📱 [DEVICE REGISTER] Registration request:", {
      code,
      name,
      deviceType: deviceType || type,
      platform,
      screenResolution,
      capabilities,
      userId: user.id,
    })

    if (!code || !name) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code and device name are required",
        },
        { status: 400 },
      )
    }

    // Find the pairing code for this user
    const pairingRecord = await sql`
      SELECT 
        id,
        code,
        screen_name,
        device_type,
        user_id,
        expires_at,
        device_id,
        used_at
      FROM device_pairing_codes 
      WHERE code = ${code.toUpperCase()}
      AND user_id = ${user.id}
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (pairingRecord.length === 0) {
      console.log("📱 [DEVICE REGISTER] No valid pairing code found for user")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired pairing code",
        },
        { status: 400 },
      )
    }

    const pairing = pairingRecord[0]

    // Check if device already exists for this pairing code
    if (pairing.device_id) {
      console.log("📱 [DEVICE REGISTER] Device already registered for this code:", pairing.device_id)

      // Get the existing device
      const existingDevice = await sql`
        SELECT id, name, device_type, status, created_at, last_seen
        FROM devices 
        WHERE id = ${pairing.device_id} AND user_id = ${user.id}
      `

      if (existingDevice.length > 0) {
        // Update existing device with latest info and mark as online
        const updatedDevice = await sql`
          UPDATE devices 
          SET 
            last_seen = NOW(),
            status = 'online',
            platform = ${platform || "unknown"},
            screen_resolution = ${screenResolution || "unknown"}
          WHERE id = ${pairing.device_id} AND user_id = ${user.id}
          RETURNING id, name, device_type, status, created_at, last_seen
        `

        console.log("📱 [DEVICE REGISTER] Device reconnected successfully:", updatedDevice[0])

        return NextResponse.json({
          success: true,
          device: {
            id: updatedDevice[0].id,
            name: updatedDevice[0].name,
            deviceType: updatedDevice[0].device_type,
            status: updatedDevice[0].status,
            createdAt: updatedDevice[0].created_at,
            lastSeen: updatedDevice[0].last_seen,
          },
          message: "Device reconnected successfully",
        })
      }
    }

    // Create new device record
    console.log("📱 [DEVICE REGISTER] Creating new device...")

    const deviceResult = await sql`
      INSERT INTO devices (
        name,
        device_type,
        status,
        platform,
        capabilities,
        screen_resolution,
        user_id
      ) VALUES (
        ${pairing.screen_name || name},
        ${deviceType || type || pairing.device_type || "web_browser"},
        'online',
        ${platform || "unknown"},
        ${JSON.stringify(capabilities || [])},
        ${screenResolution || "unknown"},
        ${user.id}
      )
      RETURNING id, name, device_type, status, created_at, last_seen
    `

    if (deviceResult.length === 0) {
      throw new Error("Failed to create device record")
    }

    const device = deviceResult[0]

    // Link the device to the pairing code
    await sql`
      UPDATE device_pairing_codes 
      SET 
        device_id = ${device.id},
        used_at = NOW()
      WHERE id = ${pairing.id}
    `

    console.log("📱 [DEVICE REGISTER] Device registered successfully:", {
      deviceId: device.id,
      deviceName: device.name,
      pairingCode: code,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        status: device.status,
        createdAt: device.created_at,
        lastSeen: device.last_seen,
      },
      message: "Device registered successfully",
    })
  } catch (error) {
    console.error("📱 [DEVICE REGISTER] Error:", error)
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
