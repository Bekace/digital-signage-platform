import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // For now, we'll just return the code without database storage
    // This will work for testing the device pairing flow
    return NextResponse.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
      message: "Device code generated successfully",
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
