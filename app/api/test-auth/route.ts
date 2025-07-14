import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔐 [TEST AUTH] Testing authentication...")

    // Check authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🔐 [TEST AUTH] Auth header present:", !!authHeader)
    console.log(
      "🔐 [TEST AUTH] Auth header format:",
      authHeader?.startsWith("Bearer ") ? "Bearer format" : "Invalid format",
    )

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "No authorization header provided",
          debug: {
            authHeader: false,
            expectedFormat: "Bearer <token>",
          },
        },
        { status: 401 },
      )
    }

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authorization header format",
          debug: {
            authHeader: true,
            receivedFormat: authHeader.substring(0, 20) + "...",
            expectedFormat: "Bearer <token>",
          },
        },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)
    console.log("🔐 [TEST AUTH] Token length:", token.length)
    console.log("🔐 [TEST AUTH] Token parts:", token.split(".").length)

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
          debug: {
            authHeader: true,
            tokenLength: token.length,
            tokenParts: token.split(".").length,
            expectedParts: 3,
          },
        },
        { status: 401 },
      )
    }

    console.log("🔐 [TEST AUTH] Authentication successful for user:", user.id, user.email)

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        plan: user.plan,
        is_admin: user.is_admin,
      },
      debug: {
        authHeader: true,
        tokenLength: token.length,
        tokenParts: token.split(".").length,
      },
    })
  } catch (error) {
    console.error("🔐 [TEST AUTH] Error:", error)
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
