import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Get user's current usage and plan
    const userResult = await sql`
      SELECT plan_type, media_files_count, storage_used_bytes, screens_count, plan_expires_at
      FROM users 
      WHERE id = ${user.id}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userResult[0]

    // Get plan limits
    const planResult = await sql`
      SELECT * FROM plan_limits 
      WHERE plan_type = ${userData.plan_type}
    `

    if (planResult.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const planLimits = planResult[0]

    return NextResponse.json({
      usage: {
        media_files_count: userData.media_files_count || 0,
        storage_used_bytes: userData.storage_used_bytes || 0,
        screens_count: userData.screens_count || 0,
        plan_type: userData.plan_type,
      },
      limits: planLimits,
      plan_expires_at: userData.plan_expires_at,
    })
  } catch (error) {
    console.error("Error fetching user plan:", error)
    return NextResponse.json({ error: "Failed to fetch plan information" }, { status: 500 })
  }
}
