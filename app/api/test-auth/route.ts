import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { extractTokenFromRequest, getTokenInfo } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("🔐 [TEST AUTH] Request received")

    // Extract token from request
    const token = extractTokenFromRequest(request)
    const authHeader = request.headers.get("authorization")

    console.log("🔐 [TEST AUTH] Auth header:", authHeader)
    console.log("🔐 [TEST AUTH] Token extracted:", !!token)

    // Analyze token
    const tokenInfo = getTokenInfo(token || undefined)
    console.log("🔐 [TEST AUTH] Token analysis:", tokenInfo)

    // Try to get current user
    let user = null
    let userError = null
    try {
      user = await getCurrentUser(request)
      console.log("🔐 [TEST AUTH] User found:", user?.id, user?.email)
    } catch (error) {
      userError = error instanceof Error ? error.message : "Unknown error"
      console.log("🔐 [TEST AUTH] User error:", userError)
    }

    return NextResponse.json({
      success: true,
      auth: {
        header_present: !!authHeader,
        header_format: authHeader?.startsWith("Bearer ") ? "correct" : "incorrect",
        token_extracted: !!token,
        token_analysis: tokenInfo,
        user_found: !!user,
        user_data: user ? { id: user.id, email: user.email } : null,
        user_error: userError,
      },
      debug: {
        timestamp: new Date().toISOString(),
        headers: {
          authorization: authHeader ? `${authHeader.substring(0, 20)}...` : null,
          "content-type": request.headers.get("content-type"),
          "user-agent": request.headers.get("user-agent")?.substring(0, 50),
        },
      },
    })
  } catch (error) {
    console.error("🔐 [TEST AUTH] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test auth failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
