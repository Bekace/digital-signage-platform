import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [TEST AUTH] Starting authentication test...")

    const user = await getCurrentUser(request)

    if (!user) {
      console.log("🧪 [TEST AUTH] Authentication failed")
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        debug: "getCurrentUser returned null",
      })
    }

    console.log("🧪 [TEST AUTH] Authentication successful")
    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        plan: user.plan,
      },
    })
  } catch (error) {
    console.error("🧪 [TEST AUTH] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
