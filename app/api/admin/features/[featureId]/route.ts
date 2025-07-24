import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { featureId: string } }) {
  try {
    console.log("🎛️ [ADMIN FEATURES] DELETE request received for:", params.featureId)

    const currentUser = await getCurrentUser(request)
    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const featureId = Number.parseInt(params.featureId)
    if (isNaN(featureId)) {
      return NextResponse.json({ error: "Invalid feature ID" }, { status: 400 })
    }

    // Delete feature
    const result = await sql`
      DELETE FROM plan_features 
      WHERE id = ${featureId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    console.log("🎛️ [ADMIN FEATURES] Feature deleted:", result[0].feature_name)

    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN FEATURES] Delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
