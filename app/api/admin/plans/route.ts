import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📋 [ADMIN PLANS] GET request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get plan statistics
    const planStats = await sql`
      SELECT 
        plan_type,
        COUNT(*) as user_count
      FROM users 
      GROUP BY plan_type
      ORDER BY user_count DESC
    `

    // Get all plan features grouped by plan
    const features = await sql`
      SELECT 
        plan_type,
        feature_name,
        feature_value
      FROM plan_features
      ORDER BY plan_type, feature_name
    `

    // Group features by plan
    const planFeatures = features.reduce((acc: any, feature: any) => {
      if (!acc[feature.plan_type]) {
        acc[feature.plan_type] = []
      }
      acc[feature.plan_type].push({
        name: feature.feature_name,
        value: feature.feature_value,
      })
      return acc
    }, {})

    console.log("📋 [ADMIN PLANS] Plan data compiled")

    return NextResponse.json({
      success: true,
      plans: {
        statistics: planStats,
        features: planFeatures,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN PLANS] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
