import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    console.log("🔍 [PROFILE API] Starting profile request")

    const user = await getCurrentUser(request)
    console.log("🔍 [PROFILE API] User from getCurrentUser:", user)

    if (!user) {
      console.log("🔍 [PROFILE API] No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Return user with proper admin fields
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
        isAdmin: user.is_admin || false,
        is_admin: user.is_admin || false, // Both formats for compatibility
        adminRole: user.admin_role,
        admin_role: user.admin_role, // Both formats for compatibility
        adminPermissions: user.admin_permissions,
      },
    }

    console.log("🔍 [PROFILE API] Returning user data:", responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ [PROFILE API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
