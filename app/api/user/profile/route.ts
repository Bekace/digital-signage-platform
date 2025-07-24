import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Return user data with admin status determined from admin_users table
    return NextResponse.json({
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
        adminPermissions: user.admin_permissions,
      },
    })
  } catch (error) {
    console.error("❌ [PROFILE] Error:", error)
    return NextResponse.json({ error: "Failed to get user profile" }, { status: 500 })
  }
}
