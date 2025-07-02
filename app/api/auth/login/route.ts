import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    console.log("Login attempt for:", email)

    // Get user from database
    const result = await sql`
      SELECT id, email, password_hash, first_name, last_name, company, plan, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    if (result.length === 0) {
      console.log("User not found:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const user = result[0]
    console.log("User found:", user.email)

    // Simple password check (for demo - in production you'd use bcrypt)
    if (user.password_hash !== password) {
      console.log("Password mismatch for:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Create JWT token
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not set")
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error",
        },
        { status: 500 },
      )
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    )

    console.log("Login successful for:", email)

    // Create response
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
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
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
