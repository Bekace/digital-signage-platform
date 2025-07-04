import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    console.log("Auth check API called")

    const user = await getCurrentUser()

    if (!user) {
      console.log("Auth check: No user found")
      return NextResponse.json(
        {
          authenticated: false,
          error: "Not authenticated",
        },
        { status: 401 },
      )
    }

    console.log("Auth check: User authenticated:", user.email)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        role: user.role,
        plan: user.plan,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: "Authentication check failed",
      },
      { status: 500 },
    )
  }
}
