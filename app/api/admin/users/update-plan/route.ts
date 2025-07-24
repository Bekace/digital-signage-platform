import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    console.log("👥 [ADMIN USERS] Updating user plan...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { userId, planType } = await request.json()

    if (!userId || !planType) {
      return NextResponse.json({ error: "User ID and plan type are required" }, { status: 400 })
    }

    // Verify the plan exists
    const planExists = await sql`
      SELECT id FROM plans WHERE plan_type = ${planType}
    `

    if (planExists.length === 0) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    // Update user's plan
    const updatedUser = await sql`
      UPDATE users 
      SET plan_type = ${planType}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, first_name, last_name, plan_type
    `

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("👥 [ADMIN USERS] User plan updated:", userId, "->", planType)

    return NextResponse.json({
      success: true,
      message: `User plan updated to ${planType}`,
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        firstName: updatedUser[0].first_name,
        lastName: updatedUser[0].last_name,
        plan: updatedUser[0].plan_type,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN USERS] Update plan error:", error)
    return NextResponse.json(
      {
        error: "Failed to update user plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
