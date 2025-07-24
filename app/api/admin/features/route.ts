import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("🎛️ [ADMIN FEATURES] Starting features fetch...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      console.log("🎛️ [ADMIN FEATURES] Access denied - not admin")
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log("🎛️ [ADMIN FEATURES] Admin verified, fetching features...")

    // Get all plan features
    const features = await sql`
      SELECT 
        id,
        name,
        description,
        feature_key,
        feature_type,
        default_value,
        created_at,
        updated_at
      FROM plan_features
      ORDER BY name ASC
    `

    console.log("🎛️ [ADMIN FEATURES] Found features:", features.length)

    return NextResponse.json({
      success: true,
      features: features.map((feature) => ({
        id: feature.id,
        name: feature.name,
        description: feature.description,
        key: feature.feature_key,
        type: feature.feature_type,
        defaultValue: feature.default_value,
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
    console.log("🎛️ [ADMIN FEATURES] Creating new feature...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { name, description, key, type, defaultValue } = await request.json()

    if (!name || !key || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if feature key already exists
    const existingFeature = await sql`
      SELECT id FROM plan_features WHERE feature_key = ${key}
    `

    if (existingFeature.length > 0) {
      return NextResponse.json({ error: "Feature key already exists" }, { status: 409 })
    }

    // Create new feature
    const newFeature = await sql`
      INSERT INTO plan_features (name, description, feature_key, feature_type, default_value)
      VALUES (${name}, ${description || ""}, ${key}, ${type}, ${defaultValue || null})
      RETURNING id, name, description, feature_key, feature_type, default_value, created_at
    `

    console.log("🎛️ [ADMIN FEATURES] Feature created:", newFeature[0].id)

    return NextResponse.json({
      success: true,
      feature: {
        id: newFeature[0].id,
        name: newFeature[0].name,
        description: newFeature[0].description,
        key: newFeature[0].feature_key,
        type: newFeature[0].feature_type,
        defaultValue: newFeature[0].default_value,
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
