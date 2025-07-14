import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { extractTokenFromRequest } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔐 [TEST AUTH] Request received")

    // Test token extraction
    const token = extractTokenFromRequest(request)
    console.log("🔐 [TEST AUTH] Token extracted:", token ? "Yes" : "No")

    // Test getCurrentUser
    const user = await getCurrentUser(request)
    console.log("🔐 [TEST AUTH] User found:", user ? user.email : "None")

    return NextResponse.json({
      success: true,
      hasToken: !!token,
      hasUser: !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          }
        : null,
    })
  } catch (error) {
    console.error("🔐 [TEST AUTH] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
