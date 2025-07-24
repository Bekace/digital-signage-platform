import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("🎯 [ADMIN FEATURES] Starting features fetch...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all plan features
    const features = await sql`
      SELECT 
        id,
        name,
        description,
        feature_key,
        is_active,
        created_at,
        updated_at
      FROM plan_features
      ORDER BY name ASC
    `

    console.log("🎯 [ADMIN FEATURES] Found features:", features.length)

    return NextResponse.json({
      success: true,
      features: features.map((feature) => ({
        id: feature.id,
        name: feature.name,
        description: feature.description,
        featureKey: feature.feature_key,
        isActive: feature.is_active,
        createdAt: feature.created_at,
        updatedAt: feature.updated_at,
      })),
    })
  } catch (error) {
    console.error("❌ [ADMIN FEATURES] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch features",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("🎯 [ADMIN FEATURES] Creating new feature...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, featureKey, isActive = true } = body

    // Create new feature
    const newFeature = await sql`
      INSERT INTO plan_features (name, description, feature_key, is_active)
      VALUES (${name}, ${description}, ${featureKey}, ${isActive})
      RETURNING id, name, description, feature_key, is_active, created_at
    `

    console.log("🎯 [ADMIN FEATURES] Feature created:", newFeature[0].id)

    return NextResponse.json({
      success: true,
      feature: {
        id: newFeature[0].id,
        name: newFeature[0].name,
        description: newFeature[0].description,
        featureKey: newFeature[0].feature_key,
        isActive: newFeature[0].is_active,
        createdAt: newFeature[0].created_at,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN FEATURES] Create error:", error)
    return NextResponse.json(
      {
        error: "Failed to create feature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
