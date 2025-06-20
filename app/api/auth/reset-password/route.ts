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

    console.log("🔍 Searching for token:", token.substring(0, 10) + "...")

    // First, let's see what users exist and their reset token status
    try {
      const allUsers = await sql`SELECT id, email, reset_token, reset_token_expires FROM users LIMIT 5`
      console.log("📋 Sample users in database:", allUsers.map(u => ({
        id: u.id,
        email: u.email,
        hasResetToken: !!u.reset_token,
        tokenExpires: u.reset_token_expires
      })))
    } catch (debugError) {
      console.log("⚠️ Debug query failed:", debugError.message)
    }

    // Check if the specific token exists (without time check first)
    try {
      const tokenCheck = await sql`
        SELECT id, email, reset_token, reset_token_expires
        FROM users 
        WHERE reset_token = ${token}
      `
      console.log("🎯 Users with this exact token:", tokenCheck.length)
      
      if (tokenCheck.length > 0) {
        const user = tokenCheck[0]
        console.log("📅 Token expires at:", user.reset_token_expires)
        console.log("🕐 Current time:", new Date().toISOString())
        
        // Check if token is expired
        const isExpired = new Date(user.reset_token_expires) < new Date()
        console.log("⏰ Token expired?", isExpired)
        
        if (isExpired) {
          return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
        }
        
        // Token is valid, update password
        console.log("✅ Updating password for user:", user.id)
        
        await sql`
          UPDATE users 
          SET password = ${password},
              reset_token = NULL,
              reset_token_expires = NULL
          WHERE id = ${user.id}
        `
        
        console.log("✅ Password updated successfully")
        return NextResponse.json({ message: "Password reset successfully" })
        
      } else {
        return NextResponse.json({ error: "Reset token not found" }, { status: 400 })
      }
      
    } catch (queryError) {
      console.error("❌ Query error:", queryError)
      return NextResponse.json({ 
        error: "Database query failed", 
        details: queryError.message 
      }, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error.message,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Reset password endpoint is working",
    method: "POST required", 
    status: "OK",
  })
}
