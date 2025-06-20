import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const token = "553fb9568c61aec1647ea4d61431aa2cb21b11d108b723c736d5e05ee41909d6"

    console.log("🔍 Testing token:", token.substring(0, 10) + "...")

    // Step 1: Find the user
    const users = await sql`
      SELECT id, email, reset_token, reset_token_expires, password
      FROM users 
      WHERE reset_token = ${token}
    `

    console.log("📊 Users found:", users.length)

    if (users.length === 0) {
      return NextResponse.json({
        error: "No user found with that token",
        token: token.substring(0, 10) + "...",
      })
    }

    const user = users[0]
    console.log("👤 User found:", {
      id: user.id,
      email: user.email,
      idType: typeof user.id,
      hasPassword: !!user.password,
      tokenExpires: user.reset_token_expires,
    })

    // Step 2: Try the simplest possible update
    try {
      console.log("🔄 Attempting update for user ID:", user.id)

      const result = await sql`
        UPDATE users 
        SET password = 'newpassword123'
        WHERE id = ${user.id}
        RETURNING id, email, password
      `

      console.log("✅ Update successful:", result.length, "rows affected")

      // Also clear the reset token
      await sql`
        UPDATE users 
        SET reset_token = NULL, reset_token_expires = NULL
        WHERE id = ${user.id}
      `

      return NextResponse.json({
        success: true,
        message: "Password reset successful!",
        user: {
          id: result[0]?.id,
          email: result[0]?.email,
          passwordSet: !!result[0]?.password,
        },
      })
    } catch (updateError) {
      console.error("❌ Update failed:", updateError)

      return NextResponse.json({
        error: "Update failed",
        details: {
          message: updateError.message,
          code: updateError.code,
          detail: updateError.detail,
          hint: updateError.hint,
          constraint: updateError.constraint,
        },
      })
    }
  } catch (error) {
    console.error("❌ General error:", error)
    return NextResponse.json({
      error: "General error",
      details: error.message,
    })
  }
}
