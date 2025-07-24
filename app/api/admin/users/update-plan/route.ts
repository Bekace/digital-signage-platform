import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT au.role 
      FROM admin_users au 
      WHERE au.user_id = ${user.id}
    `

    if (adminCheck.length === 0) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, planType } = await request.json()

    if (!userId || !planType) {
      return NextResponse.json({ error: "User ID and plan type are required" }, { status: 400 })
    }

    // Update user's plan
    const result = await sql`
      UPDATE users 
      SET plan_type = ${planType}
      WHERE id = ${userId}
      RETURNING id, email, first_name, last_name, plan_type
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details)
      VALUES (
        ${user.id}, 
        'update_user_plan', 
        'user', 
        ${userId}, 
        ${JSON.stringify({ old_plan: null, new_plan: planType })}
      )
    `

    return NextResponse.json({
      success: true,
      user: result[0],
      message: "User plan updated successfully",
    })
  } catch (error) {
    console.error("Admin update user plan API error:", error)
    return NextResponse.json(
      {
        error: "Failed to update user plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
