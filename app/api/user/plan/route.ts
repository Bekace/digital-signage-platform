import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 Fetching user plan...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User found:", user.email)

    const sql = getDb()

    // Get user's current usage and plan
    console.log("🔍 Querying user data...")
    const userResult = await sql`
      SELECT plan_type, media_files_count, storage_used_bytes, screens_count, plan_expires_at
      FROM users 
      WHERE id = ${user.id}
    `

    console.log("📊 User query result:", userResult)

    if (userResult.length === 0) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userResult[0]
    console.log("✅ User data:", userData)

    // Get plan limits
    console.log("🔍 Querying plan limits...")
    const planResult = await sql`
      SELECT * FROM plan_limits 
      WHERE plan_type = ${userData.plan_type || "free"}
    `

    console.log("📊 Plan query result:", planResult)

    if (planResult.length === 0) {
      console.log("❌ Plan not found, using default free plan")
      // Return default free plan if not found
      return NextResponse.json({
        usage: {
          media_files_count: userData.media_files_count || 0,
          storage_used_bytes: userData.storage_used_bytes || 0,
          screens_count: userData.screens_count || 0,
          plan_type: userData.plan_type || "free",
        },
        limits: {
          plan_type: "free",
          max_media_files: 5,
          max_storage_bytes: 104857600, // 100MB
          max_screens: 1,
          price_monthly: 0,
          features: ["Basic templates", "Limited storage", "Community support"],
        },
        plan_expires_at: userData.plan_expires_at,
      })
    }

    const planLimits = planResult[0]
    console.log("✅ Plan limits:", planLimits)

    const response = {
      usage: {
        media_files_count: userData.media_files_count || 0,
        storage_used_bytes: userData.storage_used_bytes || 0,
        screens_count: userData.screens_count || 0,
        plan_type: userData.plan_type || "free",
      },
      limits: planLimits,
      plan_expires_at: userData.plan_expires_at,
    }

    console.log("✅ Returning response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error fetching user plan:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch plan information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
