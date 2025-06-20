import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("=== RESET PASSWORD START ===")

    // Step 1: Parse request body
    let body
    try {
      body = await request.json()
      console.log("✅ Request body parsed")
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { token, password } = body

    // Step 2: Validate input
    if (!token || !password) {
      console.log("❌ Missing token or password")
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      console.log("❌ Password too short")
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    console.log("✅ Input validation passed")

    // Step 3: Test database connection
    try {
      await sql`SELECT 1 as test`
      console.log("✅ Database connection working")
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Step 4: Check if reset token columns exist
    try {
      const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('reset_token', 'reset_token_expires')
      `
      console.log(`✅ Found ${columns.length} reset token columns`)

      if (columns.length < 2) {
        console.log("⚠️ Adding missing reset token columns...")
        await sql`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
        `
        console.log("✅ Reset token columns added")
      }
    } catch (columnError) {
      console.error("❌ Column check/add failed:", columnError)
      return NextResponse.json(
        {
          error: "Database schema error",
          details: columnError.message,
        },
        { status: 500 },
      )
    }

    // Step 5: Find user with valid reset token
    try {
      const users = await sql`
        SELECT id, email, reset_token, reset_token_expires
        FROM users 
        WHERE reset_token = ${token} 
        AND reset_token_expires > CURRENT_TIMESTAMP
      `
      console.log(`✅ Found ${users.length} users with valid token`)

      if (users.length === 0) {
        console.log("❌ No valid token found")
        return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
      }

      const user = users[0]
      console.log(`✅ Valid token found for user: ${user.id}`)

      // Step 6: Update password (simple approach - just store the new password)
      await sql`
        UPDATE users 
        SET password = ${password},
            reset_token = NULL,
            reset_token_expires = NULL
        WHERE id = ${user.id}
      `
      console.log("✅ Password updated successfully")

      return NextResponse.json({ message: "Password reset successfully" })
    } catch (userError) {
      console.error("❌ User lookup/update failed:", userError)
      return NextResponse.json(
        {
          error: "User operation failed",
          details: userError.message,
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
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
