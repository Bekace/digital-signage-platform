import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("🔍 Looking for user with email:", email)

    // Check if user exists
    const users = await sql`SELECT id, email FROM users WHERE email = ${email}`

    if (users.length === 0) {
      console.log("❌ User not found")
      // Return success anyway for security (don't reveal if email exists)
      return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
    }

    const user = users[0]
    console.log("✅ User found:", user.id)

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    console.log("🎫 Generated reset token:", resetToken.substring(0, 10) + "...")
    console.log("⏰ Token expires at:", expiresAt)

    // Make sure reset token columns exist
    try {
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
      `
      console.log("✅ Reset token columns ensured")
    } catch (alterError) {
      console.log("⚠️ Column alter warning:", alterError.message)
    }

    // Save reset token to database
    await sql`
      UPDATE users 
      SET reset_token = ${resetToken}, 
          reset_token_expires = ${expiresAt.toISOString()}
      WHERE id = ${user.id}
    `
    console.log("✅ Reset token saved to database")

    // Create reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://britelitedigital.com"}/reset-password?token=${resetToken}`
    console.log("🔗 Reset link:", resetLink)

    // For now, just log the reset link (since we don't have email setup)
    console.log("📧 EMAIL WOULD BE SENT TO:", email)
    console.log("📧 RESET LINK:", resetLink)

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent",
      // For testing only - remove in production
      resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined,
    })
  } catch (error) {
    console.error("❌ Forgot password error:", error)
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
    message: "Forgot password endpoint is working",
    method: "POST required",
    status: "OK",
  })
}
