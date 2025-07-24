import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: { params: { featureId: string } }) {
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

    const { feature_value, is_enabled } = await request.json()
    const featureId = params.featureId

    const result = await sql`
      UPDATE plan_features 
      SET 
        feature_value = ${feature_value},
        is_enabled = ${is_enabled},
        updated_at = NOW()
      WHERE id = ${featureId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      feature: result[0],
    })
  } catch (error) {
    console.error("Admin update feature API error:", error)
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

    const featureId = params.featureId

    const result = await sql`
      DELETE FROM plan_features 
      WHERE id = ${featureId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully",
    })
  } catch (error) {
    console.error("Admin delete feature API error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete feature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
