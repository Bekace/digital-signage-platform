import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${user.id} AND is_admin = true
    `

    if (adminCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Get all features grouped by category
    const features = await sql`
      SELECT * FROM plan_features 
      ORDER BY category, feature_name
    `

    // Group features by category
    const groupedFeatures = features.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = []
      }
      acc[feature.category].push(feature)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      features: features,
      groupedFeatures: groupedFeatures,
    })
  } catch (error) {
    console.error("Get features error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${user.id} AND is_admin = true
    `

    if (adminCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const { feature_name, description, category, is_active } = await request.json()

    // Create new feature
    const newFeature = await sql`
      INSERT INTO plan_features (feature_name, description, category, is_active)
      VALUES (${feature_name}, ${description}, ${category || "general"}, ${is_active !== false})
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      feature: newFeature[0],
      message: "Feature created successfully",
    })
  } catch (error) {
    console.error("Create feature error:", error)
    return NextResponse.json({ success: false, message: "Failed to create feature" }, { status: 500 })
  }
}
