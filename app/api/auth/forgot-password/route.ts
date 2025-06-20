import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: "If an account with that email exists, we have sent a password reset link.",
      })
    }

    const user = users[0]

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
    `

    // In a real app, you would send an email here
    // For demo purposes, we'll log the reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`

    console.log("Password Reset Link:", resetUrl)
    console.log("User:", user.email, user.first_name, user.last_name)

    return NextResponse.json({
      message: "If an account with that email exists, we have sent a password reset link.",
      resetUrl, // Remove this in production
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
