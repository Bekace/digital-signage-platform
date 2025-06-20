import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("=== RESET PASSWORD START ===")

    // Test database connection first
    try {
      const dbTest = await sql`SELECT 1 as test`
      console.log("Database connection OK:", dbTest)
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const body = await request.json()
    console.log("Request body received:", Object.keys(body))

    const { token, password } = body

    if (!token || !password) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      console.log("Password too short")
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Check if bcrypt is available
    try {
      const bcrypt = require("bcryptjs")
      console.log("bcrypt loaded successfully")

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12)
      console.log("Password hashed successfully")

      // For now, let's just return success without database operations
      return NextResponse.json({
        message: "Password reset test successful",
        hashedLength: hashedPassword.length,
      })
    } catch (bcryptError) {
      console.error("bcrypt error:", bcryptError)
      return NextResponse.json({ error: "Password hashing failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("=== RESET PASSWORD ERROR ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Error name:", error?.name)
    console.error("Full error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
        type: typeof error,
      },
      { status: 500 },
    )
  }
}
