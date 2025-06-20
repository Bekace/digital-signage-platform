import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("Reset password request received")

    const { token, password } = await request.json()
    console.log("Token received:", token ? "Yes" : "No")
    console.log("Password received:", password ? "Yes" : "No")

    if (!token || !password) {
      console.log("Missing token or password")
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      console.log("Password too short")
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // First, let's check if the table exists and create it if it doesn't
    try {
      console.log("Creating password_reset_tokens table if not exists...")
      await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          used_at TIMESTAMP NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `
      console.log("Table creation/check completed")
    } catch (tableError) {
      console.error("Table creation error:", tableError)
    }

    // Find valid reset token
    console.log("Looking for reset token...")
    const resetTokens = await sql`
      SELECT rt.*, u.id as user_id, u.email
      FROM password_reset_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = ${token} 
      AND rt.expires_at > CURRENT_TIMESTAMP 
      AND rt.used_at IS NULL
    `

    console.log("Reset tokens found:", resetTokens.length)

    if (resetTokens.length === 0) {
      console.log("No valid reset token found")
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const resetToken = resetTokens[0]
    console.log("Valid token found for user:", resetToken.user_id)

    // Hash new password
    console.log("Hashing new password...")
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log("Password hashed successfully")

    // Update user password
    console.log("Updating user password...")
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE id = ${resetToken.user_id}
    `
    console.log("Password updated successfully")

    // Mark token as used
    console.log("Marking token as used...")
    await sql`
      UPDATE password_reset_tokens 
      SET used_at = CURRENT_TIMESTAMP
      WHERE token = ${token}
    `
    console.log("Token marked as used")

    console.log("Password reset completed successfully")
    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    // Return more specific error in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "Reset failed",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
