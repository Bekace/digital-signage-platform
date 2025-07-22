import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { screenName, deviceType } = body

    if (!screenName) {
      return NextResponse.json({ success: false, error: "Screen name is required" }, { status: 400 })
    }

    console.log("📱 [GENERATE CODE] Creating pairing code for:", { screenName, deviceType, userId: user.id })

    // Generate a unique 6-character code
    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let result = ""
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let code = generateCode()
    let attempts = 0
    const maxAttempts = 10

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const existing = await sql`
        SELECT id FROM device_pairing_codes 
        WHERE code = ${code} AND expires_at > NOW()
      `

      if (existing.length === 0) {
        break
      }

      code = generateCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({ success: false, error: "Failed to generate unique code" }, { status: 500 })
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const result = await sql`
      INSERT INTO device_pairing_codes (
        code,
        screen_name,
        device_type,
        user_id,
        expires_at
      ) VALUES (
        ${code},
        ${screenName},
        ${deviceType || "web_browser"},
        ${user.id},
        ${expiresAt.toISOString()}
      )
      RETURNING id, code, screen_name, device_type, expires_at, created_at
    `

    console.log("📱 [GENERATE CODE] Pairing code created:", code)

    return NextResponse.json({
      success: true,
      pairingCode: {
        id: result[0].id,
        code: result[0].code,
        screenName: result[0].screen_name,
        deviceType: result[0].device_type,
        expiresAt: result[0].expires_at,
        createdAt: result[0].created_at,
      },
      message: "Pairing code generated successfully",
    })
  } catch (error) {
    console.error("📱 [GENERATE CODE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate pairing code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
