import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 [LOGIN API] Starting login request...")

    const body = await request.json()
    const { email, password } = body

    console.log("🔐 [LOGIN API] Login attempt for:", email)

    if (!email || !password) {
      console.log("🔐 [LOGIN API] Missing email or password")
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    // Find user in database - check both possible password field names
    const users = await sql`
      SELECT id, email, first_name, last_name, company, password_hash, plan, is_admin, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    console.log("🔐 [LOGIN API] Database query result:", users.length > 0 ? "User found" : "No user found")

    if (users.length === 0) {
      console.log("🔐 [LOGIN API] User not found:", email)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]
    console.log("🔐 [LOGIN API] User found:", {
      id: user.id,
      email: user.email,
      hasPasswordHash: !!user.password_hash,
      plan: user.plan,
    })

    // Try different password verification methods
    let isValidPassword = false

    if (user.password_hash) {
      // Try bcrypt first (proper hashing)
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash)
        console.log("🔐 [LOGIN API] Bcrypt comparison result:", isValidPassword)
      } catch (bcryptError) {
        console.log("🔐 [LOGIN API] Bcrypt failed, trying plain text comparison")
        // Fallback to plain text comparison for demo/development
        isValidPassword = user.password_hash === password
        console.log("🔐 [LOGIN API] Plain text comparison result:", isValidPassword)
      }
    }

    if (!isValidPassword) {
      console.log("🔐 [LOGIN API] Invalid password for:", email)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    )

    console.log("🔐 [LOGIN API] Login successful for:", user.email)

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        isAdmin: user.is_admin || false,
      },
      token,
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
    console.error("🔐 [LOGIN API] Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
