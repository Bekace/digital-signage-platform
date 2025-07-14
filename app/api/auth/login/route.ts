import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { generateToken } from "@/lib/auth"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    console.log("🔐 [LOGIN] Login attempt started")

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    console.log("🔐 [LOGIN] Attempting login for:", email)

    // Get user from database
    const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, company, plan, is_admin, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("🔐 [LOGIN] User not found:", email)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]
    console.log("🔐 [LOGIN] User found:", user.id, user.email)

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      console.log("🔐 [LOGIN] Invalid password for:", email)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    console.log("🔐 [LOGIN] Token generated for user:", user.id)

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    // Prepare user data for response (excluding sensitive info)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      companyName: user.company || "",
      plan: user.plan || "free",
      isAdmin: Boolean(user.is_admin),
      createdAt: user.created_at,
    }

    console.log("🔐 [LOGIN] Login successful for:", user.email)

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token, // Still return token for localStorage compatibility
      user: userData,
    })
  } catch (error) {
    console.error("🔐 [LOGIN] Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
