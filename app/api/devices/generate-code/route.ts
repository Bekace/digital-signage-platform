import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { screenName, deviceType, location } = await request.json()
    const sql = getDb()

    // For demo, we'll use a simple user ID
    const userId = 1 // Demo user ID

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Store code in database with screen info
    await sql`
      INSERT INTO device_codes (code, user_id, expires_at, screen_name, device_type, location) 
      VALUES (${code}, ${userId}, ${expiresAt.toISOString()}, ${screenName}, ${deviceType}, ${location || null})
    `

    return NextResponse.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
      message: "Device code generated successfully",
    })
  } catch (error) {
    console.error("Generate code error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
