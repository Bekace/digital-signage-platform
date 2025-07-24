import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🎛️ [ADMIN FEATURES] GET request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all plan features
    const features = await sql`
      SELECT 
        pf.id,
        pf.plan_type,
        pf.feature_name,
        pf.feature_value,
        pf.created_at,
        pf.updated_at
      FROM plan_features pf
      ORDER BY pf.plan_type, pf.feature_name
    `

    console.log("🎛️ [ADMIN FEATURES] Found features:", features.length)

    return NextResponse.json({
      success: true,
      features,
    })
  } catch (error) {
    console.error("❌ [ADMIN FEATURES] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🎛️ [ADMIN FEATURES] POST request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { planType, featureName, featureValue } = await request.json()

    if (!planType || !featureName || featureValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert or update feature
    const features = await sql`
      INSERT INTO plan_features (plan_type, feature_name, feature_value)
      VALUES (${planType}, ${featureName}, ${featureValue})
      ON CONFLICT (plan_type, feature_name) 
      DO UPDATE SET 
        feature_value = EXCLUDED.feature_value,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    console.log("🎛️ [ADMIN FEATURES] Feature updated:", featureName)

    return NextResponse.json({
      success: true,
      feature: features[0],
    })
  } catch (error) {
    console.error("❌ [ADMIN FEATURES] Create/Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
