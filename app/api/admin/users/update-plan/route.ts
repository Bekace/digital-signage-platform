import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("📋 [ADMIN UPDATE PLAN] POST request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, planType } = await request.json()

    if (!userId || !planType) {
      return NextResponse.json({ error: "Missing userId or planType" }, { status: 400 })
    }

    // Update user plan
    const result = await sql`
      UPDATE users 
      SET plan_type = ${planType}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id, email, first_name, last_name, plan_type as plan
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("📋 [ADMIN UPDATE PLAN] Plan updated for user:", result[0].email)

    return NextResponse.json({
      success: true,
      user: result[0],
      message: `Plan updated to ${planType}`,
    })
  } catch (error) {
    console.error("❌ [ADMIN UPDATE PLAN] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
