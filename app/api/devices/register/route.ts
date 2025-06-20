import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, deviceInfo } = await request.json()

    if (!code) {
      return NextResponse.json({ success: false, message: "Device code is required" }, { status: 400 })
    }

    // For demo purposes, accept any 6-digit code that's not obviously expired
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      // Simulate successful registration
      const deviceId = `device_${Date.now()}`

      return NextResponse.json({
        success: true,
        message: "Device registered successfully",
        deviceId,
        deviceInfo: deviceInfo || { name: "Test Device" },
      })
    }

    return NextResponse.json({ success: false, message: "Invalid or expired device code" }, { status: 400 })
  } catch (error) {
    console.error("Register device error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
