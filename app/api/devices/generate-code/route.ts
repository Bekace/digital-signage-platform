import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 },
      )
    }

    console.log("Generating device code for user:", user.email)

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Code expires in 10 minutes from NOW
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)

    console.log("Generated code:", code, "expires at:", expiresAt.toISOString())

    return NextResponse.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
      message: "Device code generated successfully",
      serverTime: now.toISOString(),
    })
  } catch (error) {
    console.error("Generate code error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to generate device code",
      },
      { status: 500 },
    )
  }
}
