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

    console.log("🔍 Looking for reset token...")

    // Find user with this token
    const users = await sql`
      SELECT id, email, reset_token, reset_token_expires
      FROM users 
      WHERE reset_token = ${token}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 })
    }

    const user = users[0]
    console.log("👤 Found user ID:", user.id)

    // Check if token is expired
    const expiresAt = new Date(user.reset_token_expires)
    const now = new Date()

    if (expiresAt < now) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    console.log("✅ Token is valid, updating password...")

    // Try the UPDATE step by step
    try {
      // First, let's see the current user data
      const beforeUpdate = await sql`
        SELECT id, email, password, reset_token 
        FROM users 
        WHERE id = ${user.id}
      `
      console.log("📋 Before update:", {
        id: beforeUpdate[0]?.id,
        email: beforeUpdate[0]?.email,
        hasPassword: !!beforeUpdate[0]?.password,
        hasResetToken: !!beforeUpdate[0]?.reset_token,
      })

      // Try a simple update first - just the password
      const updateResult = await sql`
        UPDATE users 
        SET password = ${password}
        WHERE id = ${user.id}
      `
      console.log("✅ Password updated, affected rows:", updateResult.length)

      // Now clear the reset token
      await sql`
        UPDATE users 
        SET reset_token = NULL,
            reset_token_expires = NULL
        WHERE id = ${user.id}
      `
      console.log("✅ Reset token cleared")

      // Verify the update worked
      const afterUpdate = await sql`
        SELECT id, email, password, reset_token 
        FROM users 
        WHERE id = ${user.id}
      `
      console.log("📋 After update:", {
        id: afterUpdate[0]?.id,
        email: afterUpdate[0]?.email,
        passwordChanged: afterUpdate[0]?.password === password,
        resetTokenCleared: !afterUpdate[0]?.reset_token,
      })

      return NextResponse.json({ message: "Password reset successfully" })
    } catch (updateError) {
      console.error("❌ Update error details:", {
        message: updateError.message,
        code: updateError.code,
        detail: updateError.detail,
        hint: updateError.hint,
      })

      return NextResponse.json(
        {
          error: "Password update failed",
          details: updateError.message,
          code: updateError.code,
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
