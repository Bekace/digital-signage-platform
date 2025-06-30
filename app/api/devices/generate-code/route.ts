import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Generate unique code
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = generateRandomCode()
      attempts++

      if (attempts > maxAttempts) {
        return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 })
      }

      // Check if code already exists
      const existingCode = await sql`
        SELECT id FROM device_pairing_codes 
        WHERE code = ${code} AND expires_at > CURRENT_TIMESTAMP
      `

      if (existingCode.length === 0) {
        break // Code is unique
      }
    } while (true)

    // Set expiration to 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // Insert the pairing code
    const result = await sql`
      INSERT INTO device_pairing_codes (code, user_id, expires_at, created_at)
      VALUES (${code}, ${user.id}, ${expiresAt.toISOString()}, CURRENT_TIMESTAMP)
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
      expiresIn: 30 * 60, // 30 minutes in seconds
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
