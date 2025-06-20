import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
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

    const sql = getDb()

    // Get user from database
    const result = await sql`
      SELECT id, email, password_hash, first_name, last_name, company 
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const user = result[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Generate session token
    const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
