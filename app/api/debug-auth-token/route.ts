import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG AUTH TOKEN] Starting token debug...")

    // Check for token in Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🔍 [DEBUG AUTH TOKEN] Authorization header:", authHeader ? "Present" : "Missing")

    // Check for token in cookies
    const cookieToken = request.cookies.get("auth-token")?.value
    console.log("🔍 [DEBUG AUTH TOKEN] Cookie token:", cookieToken ? "Present" : "Missing")

    if (cookieToken) {
      console.log("🔍 [DEBUG AUTH TOKEN] Cookie token length:", cookieToken.length)
      console.log("🔍 [DEBUG AUTH TOKEN] Cookie token preview:", `${cookieToken.substring(0, 20)}...`)
    }

    // Try to get current user
    const user = await getCurrentUser(request)
    console.log("🔍 [DEBUG AUTH TOKEN] getCurrentUser result:", user ? "Success" : "Failed")

    if (user) {
      return NextResponse.json({
        success: true,
        message: "Token is valid",
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          plan: user.plan,
        },
        debug: {
          hasAuthHeader: !!authHeader,
          hasCookieToken: !!cookieToken,
          tokenSource: cookieToken ? "cookie" : authHeader ? "header" : "none",
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Token validation failed",
        debug: {
          hasAuthHeader: !!authHeader,
          hasCookieToken: !!cookieToken,
          tokenSource: "none",
        },
      })
    }
  } catch (error) {
    console.error("❌ [DEBUG AUTH TOKEN] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
