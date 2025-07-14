import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🔐 [LOGOUT] Logout request received")

    // Clear the auth cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")

    console.log("🔐 [LOGOUT] Auth cookie cleared")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("🔐 [LOGOUT] Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
