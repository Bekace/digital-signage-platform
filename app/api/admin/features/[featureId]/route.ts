import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: Request, { params }: { params: { featureId: string } }) {
  try {
    console.log("🎛️ [ADMIN FEATURES] Updating feature:", params.featureId)

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { name, description, defaultValue } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Update feature
    const updatedFeature = await sql`
      UPDATE plan_features 
      SET 
        name = ${name},
        description = ${description || ""},
        default_value = ${defaultValue || null},
        updated_at = NOW()
      WHERE id = ${params.featureId}
      RETURNING id, name, description, feature_key, feature_type, default_value, updated_at
    `

    if (updatedFeature.length === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    console.log("🎛️ [ADMIN FEATURES] Feature updated:", params.featureId)

    return NextResponse.json({
      success: true,
      feature: {
        id: updatedFeature[0].id,
        name: updatedFeature[0].name,
        description: updatedFeature[0].description,
        key: updatedFeature[0].feature_key,
        type: updatedFeature[0].feature_type,
        defaultValue: updatedFeature[0].default_value,
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
    console.log("🎛️ [ADMIN FEATURES] Deleting feature:", params.featureId)

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete feature
    const deletedFeature = await sql`
      DELETE FROM plan_features 
      WHERE id = ${params.featureId}
      RETURNING id, name
    `

    if (deletedFeature.length === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    console.log("🎛️ [ADMIN FEATURES] Feature deleted:", params.featureId)

    return NextResponse.json({
      success: true,
      message: `Feature "${deletedFeature[0].name}" deleted successfully`,
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
