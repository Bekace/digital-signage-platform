import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    console.log("👥 [ADMIN UPDATE PLAN] Starting plan update...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, planType } = body

    if (!userId || !planType) {
      return NextResponse.json({ error: "User ID and plan type are required" }, { status: 400 })
    }

    // Update user's plan
    const updatedUser = await sql`
      UPDATE users 
      SET 
        plan_type = ${planType},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, plan_type, updated_at
    `

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("👥 [ADMIN UPDATE PLAN] Plan updated for user:", userId, "to", planType)

    return NextResponse.json({
      success: true,
      message: "User plan updated successfully",
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        plan: updatedUser[0].plan_type,
        updatedAt: updatedUser[0].updated_at,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN UPDATE PLAN] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update user plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
