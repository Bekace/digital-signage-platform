import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, deviceInfo } = body

    console.log("[DEVICE REGISTER] Registration attempt with code:", code)
    console.log("[DEVICE REGISTER] Device info:", deviceInfo)

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Device code is required",
        },
        { status: 400 },
      )
    }

    // For now, we'll accept any 6-digit code as valid
    // In a real implementation, you'd store generated codes in a database with expiry times
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid device code format",
        },
        { status: 400 },
      )
    }

    // Generate a unique device ID
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log("[DEVICE REGISTER] Generated device ID:", deviceId)

    // In a real implementation, you would:
    // 1. Verify the code exists and hasn't expired
    // 2. Get the user who generated the code
    // 3. Store the device registration in the database
    // 4. Return device configuration

    const deviceData = {
      deviceId,
      name: deviceInfo?.name || "New Device",
      type: deviceInfo?.type || "unknown",
      location: deviceInfo?.location || "",
      status: "online",
      lastSeen: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
    }

    console.log("[DEVICE REGISTER] Registration successful:", deviceData)

    return NextResponse.json({
      success: true,
      device: deviceData,
      message: "Device registered successfully",
      config: {
        apiEndpoint: process.env.NEXT_PUBLIC_APP_URL || "https://www.britelitedigital.com",
        heartbeatInterval: 30000, // 30 seconds
        contentRefreshInterval: 300000, // 5 minutes
      },
    })
  } catch (error) {
    console.error("[DEVICE REGISTER] Registration error:", error)
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
