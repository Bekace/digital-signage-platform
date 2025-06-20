import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Find valid reset token
    const resetTokens = await sql`
      SELECT rt.*, u.id as user_id, u.email
      FROM password_reset_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = ${token} 
      AND rt.expires_at > CURRENT_TIMESTAMP 
      AND rt.used_at IS NULL
    `

    if (resetTokens.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const resetToken = resetTokens[0]

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE id = ${resetToken.user_id}
    `

    // Mark token as used
    await sql`
      UPDATE password_reset_tokens 
      SET used_at = CURRENT_TIMESTAMP
      WHERE token = ${token}
    `

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
