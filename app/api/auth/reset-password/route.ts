import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    console.log("🔍 Looking for reset token:", token.substring(0, 10) + "...")

    // Step 1: Make sure columns exist
    try {
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
      `
      console.log("✅ Columns ensured")
    } catch (alterError) {
      console.log("⚠️ Column alter:", alterError.message)
    }

    // Step 2: Find user with this token (simple query first)
    let user
    try {
      const users = await sql`
        SELECT id, email, reset_token, reset_token_expires::text as expires_text
        FROM users 
        WHERE reset_token = ${token}
      `

      console.log("📊 Users found with token:", users.length)

      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid reset token" }, { status: 400 })
      }

      user = users[0]
      console.log("👤 Found user:", user.id, "expires:", user.expires_text)
    } catch (findError) {
      console.error("❌ Find user error:", findError.message)
      return NextResponse.json(
        {
          error: "Database find error",
          details: findError.message,
        },
        { status: 500 },
      )
    }

    // Step 3: Check if token is expired
    try {
      const expiresAt = new Date(user.expires_text)
      const now = new Date()

      console.log("⏰ Token expires:", expiresAt.toISOString())
      console.log("⏰ Current time:", now.toISOString())

      if (expiresAt < now) {
        return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
      }

      console.log("✅ Token is still valid")
    } catch (timeError) {
      console.error("❌ Time check error:", timeError.message)
      return NextResponse.json(
        {
          error: "Time validation error",
          details: timeError.message,
        },
        { status: 500 },
      )
    }

    // Step 4: Update password
    try {
      await sql`
        UPDATE users 
        SET password = ${password},
            reset_token = NULL,
            reset_token_expires = NULL
        WHERE id = ${user.id}
      `

      console.log("✅ Password updated for user:", user.id)

      return NextResponse.json({ message: "Password reset successfully" })
    } catch (updateError) {
      console.error("❌ Update error:", updateError.message)
      return NextResponse.json(
        {
          error: "Password update failed",
          details: updateError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Reset password endpoint is working",
    method: "POST required",
    status: "OK",
  })
}
