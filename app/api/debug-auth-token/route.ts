import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG AUTH] Starting token debug...")

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🔍 [DEBUG AUTH] Authorization header:", authHeader ? `${authHeader.substring(0, 30)}...` : "NOT FOUND")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({
        success: false,
        error: "No Bearer token found",
        authHeader: authHeader || "null",
      })
    }

    const token = authHeader.substring(7)
    console.log("🔍 [DEBUG AUTH] Token extracted, length:", token.length)
    console.log("🔍 [DEBUG AUTH] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 20)}`)

    // Check if JWT_SECRET exists
    const jwtSecret = process.env.JWT_SECRET
    console.log("🔍 [DEBUG AUTH] JWT_SECRET exists:", !!jwtSecret)
    console.log("🔍 [DEBUG AUTH] JWT_SECRET length:", jwtSecret?.length || 0)

    if (!jwtSecret) {
      return NextResponse.json({
        success: false,
        error: "JWT_SECRET not configured",
      })
    }

    // Try to decode without verification first
    let decodedWithoutVerification
    try {
      decodedWithoutVerification = jwt.decode(token)
      console.log("🔍 [DEBUG AUTH] Decoded without verification:", decodedWithoutVerification)
    } catch (error) {
      console.log("🔍 [DEBUG AUTH] Failed to decode token:", error)
      return NextResponse.json({
        success: false,
        error: "Token is not valid JWT format",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Try to verify token
    let verified
    try {
      verified = jwt.verify(token, jwtSecret)
      console.log("🔍 [DEBUG AUTH] Token verified successfully:", verified)
    } catch (error) {
      console.log("🔍 [DEBUG AUTH] Token verification failed:", error)
      return NextResponse.json({
        success: false,
        error: "Token verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
        decodedWithoutVerification,
      })
    }

    return NextResponse.json({
      success: true,
      tokenValid: true,
      decoded: verified,
      decodedWithoutVerification,
    })
  } catch (error) {
    console.error("🔍 [DEBUG AUTH] Critical error:", error)
    return NextResponse.json({
      success: false,
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
