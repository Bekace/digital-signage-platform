import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { extractTokenFromRequest } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("🔐 [AUTH TEST] Testing authentication...")

    // Extract token from multiple sources
    let token = extractTokenFromRequest(request)
    const authHeader = request.headers.get("authorization")
    const cookieHeader = request.headers.get("cookie")

    // Try to extract token from cookies if not found in Authorization header
    if (!token && cookieHeader) {
      const authTokenMatch = cookieHeader.match(/auth-token=([^;]+)/)
      if (authTokenMatch) {
        token = authTokenMatch[1]
      }
    }

    const debugInfo = {
      authHeader: {
        present: !!authHeader,
        format: authHeader?.startsWith("Bearer ") ? "correct" : "incorrect",
        value: authHeader ? authHeader.substring(0, 20) + "..." : null,
      },
      cookieHeader: {
        present: !!cookieHeader,
        hasAuthToken: cookieHeader?.includes("auth-token=") || false,
      },
      token: {
        extracted: !!token,
        length: token?.length || 0,
        source: token === extractTokenFromRequest(request) ? "header" : "cookie",
      },
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: "No authentication token found",
        debug: debugInfo,
      })
    }

    // Test user authentication
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: "Invalid or expired token",
        debug: {
          ...debugInfo,
          tokenValid: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        plan: user.plan,
        isAdmin: user.isAdmin,
      },
      debug: {
        ...debugInfo,
        tokenValid: true,
        userFound: true,
      },
    })
  } catch (error) {
    console.error("🔐 [AUTH TEST] Error:", error)

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
