import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
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

    // Get plan statistics
    const planStats = await sql`
      SELECT 
        plan_type as plan,
        COUNT(*) as user_count,
        SUM(COALESCE(media_files_count, 0)) as total_media_files,
        SUM(COALESCE(storage_used_bytes, 0)) as total_storage_used
      FROM users
      GROUP BY plan_type
      ORDER BY plan_type
    `

    // Get plan features
    const planFeatures = await sql`
      SELECT 
        plan_type,
        feature_name,
        feature_value,
        is_enabled
      FROM plan_features
      ORDER BY plan_type, feature_name
    `

    // Group features by plan
    const featuresGrouped = planFeatures.reduce((acc, feature) => {
      if (!acc[feature.plan_type]) {
        acc[feature.plan_type] = []
      }
      acc[feature.plan_type].push({
        name: feature.feature_name,
        value: feature.feature_value,
        enabled: feature.is_enabled,
      })
      return acc
    }, {})

    // Combine stats with features
    const plans = planStats.map((stat) => ({
      ...stat,
      features: featuresGrouped[stat.plan] || [],
    }))

    return NextResponse.json({
      success: true,
      plans: plans,
    })
  } catch (error) {
    console.error("Admin plans API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
