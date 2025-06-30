import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [TEST AUTH] Starting authentication test...")

    // Log all headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log("🧪 [TEST AUTH] Request headers:", headers)

    // Test getCurrentUser
    const user = await getCurrentUser(request)

    if (user) {
      console.log("✅ [TEST AUTH] Authentication successful")
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          plan: user.plan,
        },
      })
    } else {
      console.log("❌ [TEST AUTH] Authentication failed")
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "No user found",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("❌ [TEST AUTH] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
