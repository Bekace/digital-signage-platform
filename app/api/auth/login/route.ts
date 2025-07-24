import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("🔐 [LOGIN] Login attempt for:", email)

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Get user from database
    const result = await sql`
      SELECT id, email, password_hash, first_name, last_name, company, plan, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    if (result.length === 0) {
      console.log("🔐 [LOGIN] User not found:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const user = result[0]

    // Simple password check (for demo - in production you'd use bcrypt)
    if (user.password_hash !== password) {
      console.log("🔐 [LOGIN] Invalid password for:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    )

    console.log("🔐 [LOGIN] Token created for user:", user.id)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token: token, // Include token in response for localStorage
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("🔐 [LOGIN] Cookie set and response ready")

    return response
  } catch (error) {
    console.error("🔐 [LOGIN] Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
