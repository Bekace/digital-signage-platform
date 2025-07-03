import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Code expires in 10 minutes from NOW - add extra buffer
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 11 * 60 * 1000) // 11 minutes to account for any timing issues

    return NextResponse.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
      message: "Device code generated successfully",
      serverTime: now.toISOString(), // Include server time for comparison
    })
  } catch (error) {
    console.error("Generate code error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
