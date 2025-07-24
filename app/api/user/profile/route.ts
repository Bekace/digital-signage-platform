import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("👤 [USER PROFILE] Starting profile fetch...")

    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      console.log("👤 [USER PROFILE] Authentication failed")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("👤 [USER PROFILE] User authenticated:", authResult.userId)

    // Get user profile with admin status
    const userProfile = await sql`
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
        au.role as admin_role
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      WHERE u.id = ${authResult.userId}
      LIMIT 1
    `

    if (userProfile.length === 0) {
      console.log("👤 [USER PROFILE] User not found:", authResult.userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userProfile[0]
    const isAdmin = user.is_admin || false
    const adminRole = user.admin_role || null

    console.log("👤 [USER PROFILE] Profile loaded:", {
      userId: user.id,
      email: user.email,
      isAdmin,
      adminRole,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        isAdmin: isAdmin,
        is_admin: isAdmin, // For compatibility
        adminRole: adminRole,
        admin_role: adminRole, // For compatibility
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    })
  } catch (error) {
    console.error("❌ [USER PROFILE] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
