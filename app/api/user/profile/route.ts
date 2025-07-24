import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("🔍 [PROFILE] User data:", {
      id: user.id,
      email: user.email,
      is_admin: user.is_admin,
      admin_role: user.admin_role,
      admin_permissions: user.admin_permissions,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        isAdmin: user.is_admin, // This is the key field!
        is_admin: user.is_admin, // Also provide this format
        admin_role: user.admin_role,
        admin_permissions: user.admin_permissions,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error("❌ [PROFILE] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
