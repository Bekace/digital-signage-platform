import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { code, deviceName, deviceType, location } = body

    console.log("Device registration attempt:", { code, deviceName, deviceType, userId: user.id })

    if (!code || !deviceName || !deviceType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "Code, device name, and device type are required",
        },
        { status: 400 },
      )
    }

    const sql = getDb()

    // For now, we'll accept any 6-digit code since we don't have persistent storage for codes
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid code format",
          message: "Code must be 6 digits",
        },
        { status: 400 },
      )
    }

    // Generate device ID
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert device into database
    await sql`
      INSERT INTO devices (id, user_id, name, type, location, status, last_seen, created_at)
      VALUES (
        ${deviceId},
        ${user.id},
        ${deviceName},
        ${deviceType},
        ${location || null},
        'online',
        NOW(),
        NOW()
      )
    `

    console.log("Device registered successfully:", deviceId)

    return NextResponse.json({
      success: true,
      message: "Device registered successfully",
      device: {
        id: deviceId,
        name: deviceName,
        type: deviceType,
        location: location || null,
        status: "online",
      },
    })
  } catch (error) {
    console.error("Device registration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to register device",
      },
      { status: 500 },
    )
  }
}
