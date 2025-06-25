import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
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

    const userId = Number.parseInt(params.userId)
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("Received edit user data:", body) // Debug log
    const { firstName, lastName, email, company, plan, password, isAdmin } = body

    // Validation with detailed messages
    if (!firstName?.trim()) {
      return NextResponse.json({ success: false, message: "First name is required" }, { status: 400 })
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ success: false, message: "Last name is required" }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }
    if (!plan) {
      return NextResponse.json({ success: false, message: "Plan is required" }, { status: 400 })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmedEmail = email.trim()
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid email format: "${trimmedEmail}". Please enter a valid email like user@example.com`,
        },
        { status: 400 },
      )
    }

    // Password validation (only if provided)
    if (password && password.trim() && password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    // Check if user exists
    const existingUser = await sql`SELECT id, email FROM users WHERE id = ${userId}`
    if (existingUser.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    const emailCheck = await sql`SELECT id FROM users WHERE email = ${trimmedEmail.toLowerCase()} AND id != ${userId}`
    if (emailCheck.length > 0) {
      return NextResponse.json({ success: false, message: "A user with this email already exists" }, { status: 400 })
    }

    // Verify plan exists - check both plan_templates and fallback to hardcoded plans
    let planExists = false
    try {
      const planCheck = await sql`SELECT id FROM plan_templates WHERE plan_type = ${plan} AND is_active = true`
      planExists = planCheck.length > 0
    } catch (err) {
      // Fallback to hardcoded plan validation if table doesn't exist
      const validPlans = ["free", "pro", "enterprise"]
      planExists = validPlans.includes(plan)
    }

    if (!planExists) {
      return NextResponse.json({ success: false, message: `Invalid plan selected: "${plan}"` }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: trimmedEmail.toLowerCase(),
      company: company?.trim() || null,
      plan: plan,
      is_admin: isAdmin || false,
    }

    // Hash password if provided
    if (password && password.trim()) {
      updateData.password_hash = await bcrypt.hash(password, 12)
    }

    // Build dynamic update query
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = $${key}`)
      .join(", ")

    // Update user
    const updatedUser = await sql`
      UPDATE users 
      SET ${sql(updateData)}
      WHERE id = ${userId}
      RETURNING id, first_name, last_name, email, company, plan, is_admin, created_at
    `

    console.log("User updated successfully:", updatedUser[0]) // Debug log

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: updatedUser[0].id,
        firstName: updatedUser[0].first_name,
        lastName: updatedUser[0].last_name,
        email: updatedUser[0].email,
        company: updatedUser[0].company,
        plan: updatedUser[0].plan,
        isAdmin: updatedUser[0].is_admin,
        createdAt: updatedUser[0].created_at,
      },
    })
  } catch (error) {
    console.error("Edit user error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}
