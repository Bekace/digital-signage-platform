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

    // Find user with valid reset token
    console.log("Looking for user with reset token...")
    const users = await sql`
      SELECT id, email, reset_token, reset_token_expires
      FROM users 
      WHERE reset_token = ${token} 
      AND reset_token_expires > CURRENT_TIMESTAMP
    `

    console.log("Users found with valid token:", users.length)

    if (users.length === 0) {
      console.log("No valid reset token found")
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const user = users[0]
    console.log("Valid token found for user:", user.id)

    // Hash new password
    console.log("Hashing new password...")
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log("Password hashed successfully")

    // Update user password and clear reset token
    console.log("Updating user password and clearing reset token...")
    await sql`
      UPDATE users 
      SET password = ${hashedPassword},
          reset_token = NULL,
          reset_token_expires = NULL
      WHERE id = ${user.id}
    `
    console.log("Password updated and reset token cleared")

    console.log("Password reset completed successfully")
    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
