import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, company, password, plan } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ success: false, message: "All required fields must be filled" }, { status: 400 })
    }

    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 },
      )
    }

    // Create new user
    const result = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, company, plan)
      VALUES (${email.toLowerCase()}, ${password}, ${firstName}, ${lastName}, ${company || ""}, ${plan || "free"})
      RETURNING id, email, first_name, last_name, company, plan, created_at
    `

    const user = result[0]

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 })
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
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
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
