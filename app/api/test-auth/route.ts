import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [TEST AUTH] Starting authentication test...")

    const user = await getCurrentUser(request)

    if (user) {
      console.log("✅ [TEST AUTH] Authentication successful")
      return NextResponse.json({
        success: true,
        message: "Authentication successful",
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
          error: "Authentication failed",
          debug: "No user found in getCurrentUser()",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("❌ [TEST AUTH] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
