import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { deviceCode, deviceInfo } = await request.json()

    if (!deviceCode) {
      return NextResponse.json({ success: false, message: "Device code is required" }, { status: 400 })
    }

    // Accept both formats:
    // - 6-digit numeric codes (123456)
    // - Longer alphanumeric codes (ABC123DEF456)
    const isValidCode = /^(\d{6}|[A-Z0-9]{8,15})$/i.test(deviceCode)

    if (isValidCode) {
      // Simulate successful registration
      const deviceId = `device_${Date.now()}`
      const apiKey = `api_${Math.random().toString(36).substring(2, 15)}`
      const screenName = `Screen ${Math.floor(Math.random() * 1000)}`

      return NextResponse.json({
        success: true,
        message: "Device registered successfully",
        deviceId,
        apiKey,
        screenName,
        deviceInfo: deviceInfo || { name: "Test Device" },
      })
    }

    return NextResponse.json({ success: false, message: "Invalid or expired device code" }, { status: 400 })
  } catch (error) {
    console.error("Register device error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
