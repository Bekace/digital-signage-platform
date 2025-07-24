import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("👥 [ADMIN USERS] GET request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      console.log("👥 [ADMIN USERS] No authenticated user")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!currentUser.is_admin) {
      console.log("👥 [ADMIN USERS] User is not admin:", currentUser.email)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("👥 [ADMIN USERS] Admin user authenticated:", currentUser.email)

    // Get all users with their admin status
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.company,
        u.plan_type as plan,
        u.created_at,
        au.role as admin_role,
        au.permissions as admin_permissions,
        CASE WHEN au.user_id IS NOT NULL THEN true ELSE false END as is_admin
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      ORDER BY u.created_at DESC
    `

    console.log("👥 [ADMIN USERS] Found users:", users.length)

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        ...user,
        is_admin: Boolean(user.is_admin),
      })),
    })
  } catch (error) {
    console.error("❌ [ADMIN USERS] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("👥 [ADMIN USERS] POST request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { email, firstName, lastName, company, plan, makeAdmin, adminRole } = await request.json()

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create user
    const newUsers = await sql`
      INSERT INTO users (email, first_name, last_name, company, plan_type, password_hash)
      VALUES (${email}, ${firstName}, ${lastName}, ${company || ""}, ${plan || "free"}, 'temp_password')
      RETURNING id, email, first_name, last_name, company, plan_type as plan, created_at
    `

    const newUser = newUsers[0]

    // Make admin if requested
    if (makeAdmin && adminRole) {
      await sql`
        INSERT INTO admin_users (user_id, role, permissions)
        VALUES (${newUser.id}, ${adminRole}, ${JSON.stringify({})})
      `
    }

    console.log("👥 [ADMIN USERS] User created:", newUser.email)

    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        is_admin: Boolean(makeAdmin),
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN USERS] Create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
