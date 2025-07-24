import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("👥 [ADMIN USERS] Starting users fetch...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      console.log("👥 [ADMIN USERS] Authentication failed")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!authResult.isAdmin) {
      console.log("👥 [ADMIN USERS] User is not admin:", authResult.userId)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("👥 [ADMIN USERS] Admin verified:", authResult.userId)

    // Get all users with admin status
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.company,
        u.plan_type as plan,
        u.created_at,
        u.updated_at,
        CASE 
          WHEN au.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_admin,
        au.role as admin_role,
        au.permissions as admin_permissions
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      ORDER BY u.created_at DESC
    `

    console.log("👥 [ADMIN USERS] Found users:", users.length)

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        isAdmin: user.is_admin || false,
        adminRole: user.admin_role,
        adminPermissions: user.admin_permissions,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
    })
  } catch (error) {
    console.error("❌ [ADMIN USERS] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("👥 [ADMIN USERS] Creating new user...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { email, firstName, lastName, company, plan, password } = body

    // Create new user
    const newUser = await sql`
      INSERT INTO users (email, first_name, last_name, company, plan_type, password_hash)
      VALUES (${email}, ${firstName}, ${lastName}, ${company}, ${plan}, ${password})
      RETURNING id, email, first_name, last_name, company, plan_type as plan, created_at
    `

    console.log("👥 [ADMIN USERS] User created:", newUser[0].id)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        firstName: newUser[0].first_name,
        lastName: newUser[0].last_name,
        company: newUser[0].company,
        plan: newUser[0].plan,
        createdAt: newUser[0].created_at,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN USERS] Create error:", error)
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
