import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDb } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log("🔐 [LOGIN] Login attempt for:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const sql = getDb()

    // Get user from database
    const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, company, plan_type as plan, created_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("🔐 [LOGIN] User not found:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      console.log("🔐 [LOGIN] Invalid password for:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    })

    console.log("🔐 [LOGIN] Login successful for:", email)

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token: token, // Include token in response body for localStorage
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        createdAt: user.created_at,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ [LOGIN] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
