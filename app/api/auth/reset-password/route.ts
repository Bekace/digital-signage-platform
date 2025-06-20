import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("=== RESET PASSWORD START ===")

    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Check if user table has reset token columns
    try {
      const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('reset_token', 'reset_token_expires')
      `
      console.log("Reset token columns found:", columns.length)

      if (columns.length < 2) {
        console.log("Missing reset token columns, adding them...")
        await sql`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
        `
        console.log("Reset token columns added")
      }
    } catch (columnError) {
      console.error("Column check/add error:", columnError)
      return NextResponse.json({ error: "Database schema error" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const user = users[0]
    console.log("Valid token found for user:", user.id)

    // Simple password hashing using Node.js crypto (no external dependencies)
    console.log("Hashing new password...")
    const salt = crypto.randomBytes(16).toString("hex")
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")
    const finalPassword = `${salt}:${hashedPassword}`
    console.log("Password hashed successfully")

    // Update user password and clear reset token
    console.log("Updating user password...")
    await sql`
      UPDATE users 
      SET password = ${finalPassword},
          reset_token = NULL,
          reset_token_expires = NULL
      WHERE id = ${user.id}
    `
    console.log("Password updated successfully")

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    message: "Reset password endpoint is working",
    method: "POST required",
    status: "OK",
  })
}
