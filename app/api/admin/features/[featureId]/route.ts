import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: Request, { params }: { params: { featureId: string } }) {
  try {
    console.log("🎯 [ADMIN FEATURES] Updating feature:", params.featureId)

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, featureKey, isActive } = body

    // Update feature
    const updatedFeature = await sql`
      UPDATE plan_features 
      SET 
        name = ${name},
        description = ${description},
        feature_key = ${featureKey},
        is_active = ${isActive},
        updated_at = NOW()
      WHERE id = ${params.featureId}
      RETURNING id, name, description, feature_key, is_active, updated_at
    `

    if (updatedFeature.length === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    console.log("🎯 [ADMIN FEATURES] Feature updated:", updatedFeature[0].id)

    return NextResponse.json({
      success: true,
      feature: {
        id: updatedFeature[0].id,
        name: updatedFeature[0].name,
        description: updatedFeature[0].description,
        featureKey: updatedFeature[0].feature_key,
        isActive: updatedFeature[0].is_active,
        updatedAt: updatedFeature[0].updated_at,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN FEATURES] Update error:", error)
    return NextResponse.json(
      {
        error: "Failed to update feature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { featureId: string } }) {
  try {
    console.log("🎯 [ADMIN FEATURES] Deleting feature:", params.featureId)

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Delete feature
    const deletedFeature = await sql`
      DELETE FROM plan_features 
      WHERE id = ${params.featureId}
      RETURNING id
    `

    if (deletedFeature.length === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    console.log("🎯 [ADMIN FEATURES] Feature deleted:", deletedFeature[0].id)

    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN FEATURES] Delete error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete feature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
