import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("🔧 [MAKE SUPER ADMIN] Request for email:", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // First, check if user exists
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      console.log("🔧 [MAKE SUPER ADMIN] User not found:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]
    console.log("🔧 [MAKE SUPER ADMIN] User found:", user.id, user.email)

    // Check if user is already an admin
    const existingAdmin = await sql`
      SELECT * FROM admin_users WHERE user_id = ${user.id}
    `

    if (existingAdmin.length > 0) {
      console.log("🔧 [MAKE SUPER ADMIN] User is already an admin")
      return NextResponse.json({
        success: true,
        message: "User is already a super admin",
        user: {
          id: user.id,
          email: user.email,
          role: existingAdmin[0].role,
        },
      })
    }

    // Make user a super admin
    await sql`
      INSERT INTO admin_users (user_id, role, permissions, created_at)
      VALUES (
        ${user.id}, 
        'super_admin', 
        '{"all": true, "users": true, "plans": true, "features": true, "debug": true}',
        NOW()
      )
    `

    console.log("🔧 [MAKE SUPER ADMIN] Super admin created successfully")

    return NextResponse.json({
      success: true,
      message: "User has been made a super admin",
      user: {
        id: user.id,
        email: user.email,
        role: "super_admin",
      },
    })
  } catch (error) {
    console.error("🔧 [MAKE SUPER ADMIN] Error:", error)
    return NextResponse.json({ error: "Failed to make user super admin" }, { status: 500 })
  }
}
