import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

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

    const sql = getDb()

    // Find user in database
    const users = await sql`
      SELECT id, email, first_name, last_name, company, password_hash, plan
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("🔐 [LOGIN API] User not found:", email)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]
    console.log("🔐 [LOGIN API] User found:", user.email)

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

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
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
