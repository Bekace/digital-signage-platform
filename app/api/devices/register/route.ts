import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { deviceCode, deviceType, platform } = await request.json()

    if (!deviceCode || !deviceType || !platform) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Validate code format
    if (deviceCode.length !== 6 || !/^\d+$/.test(deviceCode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid device code format",
        },
        { status: 400 },
      )
    }

    const sql = getDb()

    // Check if code exists and is valid
    const codeResult = await sql`
      SELECT user_id, screen_name, device_type, location
      FROM device_codes 
      WHERE code = ${deviceCode} 
      AND expires_at > NOW() 
      AND used = FALSE
    `

    if (codeResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired device code",
        },
        { status: 400 },
      )
    }

    const codeData = codeResult[0]

    // Mark code as used
    await sql`UPDATE device_codes SET used = TRUE WHERE code = ${deviceCode}`

    // Generate device credentials
    const deviceId = "device_" + Math.random().toString(36).substr(2, 9)
    const apiKey = "api_" + Math.random().toString(36).substr(2, 16)
    const screenName =
      codeData.screen_name || `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Screen ${deviceId.slice(-4)}`

    // Insert device into database
    await sql`
      INSERT INTO devices (device_id, user_id, screen_name, device_type, platform, api_key, status, location) 
      VALUES (${deviceId}, ${codeData.user_id}, ${screenName}, ${codeData.device_type || deviceType}, ${platform}, ${apiKey}, 'online', ${codeData.location})
    `

    return NextResponse.json({
      success: true,
      deviceId: deviceId,
      apiKey: apiKey,
      screenName: screenName,
      message: "Device registered successfully",
    })
  } catch (error) {
    console.error("Device registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
