import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Code expires in 10 minutes from NOW
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    console.log("Generated code:", code)
    console.log("Current time:", new Date().toISOString())
    console.log("Expires at:", expiresAt.toISOString())
    console.log("Time until expiration (minutes):", (expiresAt.getTime() - Date.now()) / (1000 * 60))

    return NextResponse.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
      message: "Device code generated successfully",
      debug: {
        currentTime: new Date().toISOString(),
        expirationTime: expiresAt.toISOString(),
        minutesUntilExpiration: Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60)),
      },
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
