import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    console.log("Edit user API: Starting request for user", params.userId)

    const currentUser = await getCurrentUser()
    console.log("Edit user API: Current user:", currentUser?.id, currentUser?.email)

    if (!currentUser) {
      console.log("Edit user API: No user authenticated")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if current user is admin
    let adminCheck
    try {
      adminCheck = await sql`
        SELECT is_admin FROM users WHERE id = ${currentUser.id}
      `
      console.log("Edit user API: Admin check result:", adminCheck)
    } catch (err) {
      console.log("Edit user API: Error checking admin status:", err.message)
      return NextResponse.json(
        {
          success: false,
          message: "Database error - unable to verify admin status",
        },
        { status: 500 },
      )
    }

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      console.log("Edit user API: Access denied - not admin")
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const userId = params.userId
    const body = await request.json()
    const { firstName, lastName, email, company, plan, password, isAdmin } = body

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !plan) {
      return NextResponse.json(
        { success: false, message: "First name, last name, email, and plan are required" },
        { status: 400 },
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id, email FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      console.log("Edit user API: User not found")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    const emailCheck = await sql`
      SELECT id FROM users WHERE email = ${email.trim()} AND id != ${userId}
    `

    if (emailCheck.length > 0) {
      return NextResponse.json({ success: false, message: "Email is already taken by another user" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      company: company?.trim() || null,
      plan: plan,
      is_admin: isAdmin || false,
    }

    // Hash password if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 6 characters long" },
          { status: 400 },
        )
      }
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    // Update user
    const updatedUser = await sql`
      UPDATE users 
      SET 
        first_name = ${updateData.first_name},
        last_name = ${updateData.last_name},
        email = ${updateData.email},
        company = ${updateData.company},
        plan = ${updateData.plan},
        is_admin = ${updateData.is_admin}
        ${password && password.trim() ? sql`, password_hash = ${updateData.password_hash}` : sql``}
      WHERE id = ${userId}
      RETURNING id, first_name, last_name, email, company, plan, is_admin, created_at
    `

    if (updatedUser.length === 0) {
      return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 })
    }

    console.log("Edit user API: Successfully updated user", updatedUser[0].email)

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser[0].first_name} ${updatedUser[0].last_name} updated successfully`,
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
    console.error("Edit user API: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + error.message,
      },
      { status: 500 },
    )
  }
}
