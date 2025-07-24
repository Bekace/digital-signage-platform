import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("👤 [USER PROFILE] GET request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile with admin status from admin_users table
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
      WHERE u.id = ${currentUser.id}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    console.log("👤 [USER PROFILE] Profile retrieved for:", user.email)

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        is_admin: Boolean(user.is_admin),
      },
    })
  } catch (error) {
    console.error("❌ [USER PROFILE] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("👤 [USER PROFILE] PUT request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { firstName, lastName, company } = await request.json()

    // Update user profile
    const result = await sql`
      UPDATE users 
      SET 
        first_name = ${firstName || currentUser.first_name},
        last_name = ${lastName || currentUser.last_name},
        company = ${company || currentUser.company || ""},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${currentUser.id}
      RETURNING id, email, first_name, last_name, company, plan_type as plan, created_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("👤 [USER PROFILE] Profile updated for:", result[0].email)

    return NextResponse.json({
      success: true,
      user: result[0],
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("❌ [USER PROFILE] Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
