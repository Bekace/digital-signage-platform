import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          company: user.company,
          plan: user.plan,
          isAdmin: user.is_admin || false,
        },
      })
    } else {
      return NextResponse.json({
        authenticated: false,
        user: null,
      })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: "Authentication check failed",
    })
  }
}
