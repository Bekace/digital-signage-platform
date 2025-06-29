import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Generate a 6-digit pairing code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Store the code in database with expiration (30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now

    await sql`
      INSERT INTO device_pairing_codes (code, expires_at, created_at)
      VALUES (${code}, ${expiresAt.toISOString()}, ${new Date().toISOString()})
      ON CONFLICT (code) DO UPDATE SET
        expires_at = ${expiresAt.toISOString()},
        created_at = ${new Date().toISOString()}
    `

    return NextResponse.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Error generating pairing code:", error)
    return NextResponse.json({ success: false, message: "Failed to generate pairing code" }, { status: 500 })
  }
}
