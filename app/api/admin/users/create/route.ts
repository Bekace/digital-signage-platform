import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${user.id}`
    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, company, plan, password, isAdmin } = body

    // Validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim() || !plan) {
      return NextResponse.json(
        { success: false, message: "First name, last name, email, password, and plan are required" },
        { status: 400 },
      )
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
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, message: "A user with this email already exists" }, { status: 400 })
    }

    // Verify plan exists
    const planCheck = await sql`SELECT id FROM plan_templates WHERE plan_type = ${plan} AND is_active = true`
    if (planCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid plan selected" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const newUser = await sql`
      INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        company, 
        password, 
        plan, 
        is_admin,
        created_at
      ) VALUES (
        ${firstName.trim()}, 
        ${lastName.trim()}, 
        ${email.toLowerCase()}, 
        ${company?.trim() || null}, 
        ${hashedPassword}, 
        ${plan},
        ${isAdmin || false},
        NOW()
      ) RETURNING id, first_name, last_name, email, company, plan, is_admin, created_at
    `

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser[0].id,
        firstName: newUser[0].first_name,
        lastName: newUser[0].last_name,
        email: newUser[0].email,
        company: newUser[0].company,
        plan: newUser[0].plan,
        isAdmin: newUser[0].is_admin,
        createdAt: newUser[0].created_at,
        mediaCount: 0,
        storageUsed: 0,
      },
    })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ success: false, message: "Internal server error: " + error.message }, { status: 500 })
  }
}
