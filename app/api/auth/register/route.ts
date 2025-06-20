import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, company, password, plan } = await request.json()

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ success: false, message: "All required fields must be filled" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 })
    }

    const sql = getDb()

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 400 },
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, company, plan)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, ${company || null}, ${plan || "monthly"})
      RETURNING id, email, first_name, last_name, company, created_at
    `

    const newUser = result[0]

    // Generate session token
    const token = `token_${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      token: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        company: newUser.company,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
