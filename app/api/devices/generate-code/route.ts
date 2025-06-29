import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify JWT token
    let userId: number
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Generate unique 6-character alphanumeric code
    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let code = ""
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    let code: string
    let attempts = 0
    const maxAttempts = 10

    // Try to generate a unique code
    do {
      code = generateCode()
      attempts++

      if (attempts > maxAttempts) {
        return NextResponse.json({ error: "Unable to generate unique code" }, { status: 500 })
      }

      // Check if code already exists
      const existing = await sql`
        SELECT id FROM device_pairing_codes 
        WHERE code = ${code} AND expires_at > CURRENT_TIMESTAMP
      `

      if (existing.length === 0) break
    } while (true)

    // Insert the new pairing code
    const result = await sql`
      INSERT INTO device_pairing_codes (code, user_id, expires_at)
      VALUES (${code}, ${userId}, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
      RETURNING id, code, expires_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to create pairing code" }, { status: 500 })
    }

    const pairingCode = result[0]

    return NextResponse.json({
      success: true,
      code: pairingCode.code,
      expiresAt: pairingCode.expires_at,
      message: "Pairing code generated successfully",
    })
  } catch (error) {
    console.error("Generate code error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate pairing code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
