import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

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

    const { action, featureIds } = await request.json()

    if (!action || !featureIds || !Array.isArray(featureIds) || featureIds.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid request data" }, { status: 400 })
    }

    let result
    let message

    switch (action) {
      case "activate":
        result = await sql`
          UPDATE plan_features 
          SET is_active = true 
          WHERE id = ANY(${featureIds})
          RETURNING *
        `
        message = `${result.length} features activated successfully`
        break

      case "deactivate":
        result = await sql`
          UPDATE plan_features 
          SET is_active = false 
          WHERE id = ANY(${featureIds})
          RETURNING *
        `
        message = `${result.length} features deactivated successfully`
        break

      case "delete":
        // Check if any features are used in plans
        const usedFeatures = await sql`
          SELECT DISTINCT pf.id, pf.feature_name
          FROM plan_features pf
          JOIN plan_templates pt ON pt.features::text LIKE '%' || pf.feature_name || '%'
          WHERE pf.id = ANY(${featureIds})
        `

        if (usedFeatures.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot delete features that are used in plans: ${usedFeatures.map((f) => f.feature_name).join(", ")}`,
            },
            { status: 400 },
          )
        }

        result = await sql`
          DELETE FROM plan_features 
          WHERE id = ANY(${featureIds})
          RETURNING *
        `
        message = `${result.length} features deleted successfully`
        break

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: message,
      affectedFeatures: result,
    })
  } catch (error) {
    console.error("Bulk features operation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform bulk operation: " + error.message,
      },
      { status: 500 },
    )
  }
}
