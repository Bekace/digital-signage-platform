import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [PROFILE] Getting user profile...")

    const user = await getCurrentUser(request)

    if (!user) {
      console.log("🔍 [PROFILE] No user found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("🔍 [PROFILE] User data:", {
      id: user.id,
      email: user.email,
      is_admin: user.is_admin,
      admin_role: user.admin_role,
      admin_permissions: user.admin_permissions,
    })

    // Return user data with admin status determined from admin_users table
    const responseData = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        createdAt: user.created_at,
        isAdmin: user.is_admin, // This is now determined from admin_users table
        is_admin: user.is_admin, // For backward compatibility
        adminRole: user.admin_role,
        admin_role: user.admin_role, // For backward compatibility
        adminPermissions: user.admin_permissions,
      },
    }

    console.log("🔍 [PROFILE] Returning response:", responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ [PROFILE] Error:", error)
    return NextResponse.json({ error: "Failed to get user profile" }, { status: 500 })
  }
}
