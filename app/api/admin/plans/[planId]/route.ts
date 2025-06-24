import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { planId: string } }) {
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

    const plan = await sql`
      SELECT * FROM plan_templates WHERE id = ${params.planId}
    `

    if (plan.length === 0) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: plan[0],
    })
  } catch (error) {
    console.error("Get plan error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { planId: string } }) {
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

    const {
      name,
      description,
      max_media_files,
      max_storage_bytes,
      max_screens,
      price_monthly,
      price_yearly,
      features,
      is_active,
      sort_order,
    } = await request.json()

    // Update plan
    const updatedPlan = await sql`
      UPDATE plan_templates SET
        name = ${name},
        description = ${description},
        max_media_files = ${max_media_files},
        max_storage_bytes = ${max_storage_bytes},
        max_screens = ${max_screens},
        price_monthly = ${price_monthly},
        price_yearly = ${price_yearly},
        features = ${JSON.stringify(features)},
        is_active = ${is_active},
        sort_order = ${sort_order},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.planId}
      RETURNING *
    `

    if (updatedPlan.length === 0) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan[0],
      message: "Plan updated successfully",
    })
  } catch (error) {
    console.error("Update plan error:", error)
    return NextResponse.json({ success: false, message: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { planId: string } }) {
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

    // Check if plan is in use
    const usersWithPlan = await sql`
      SELECT COUNT(*) as count FROM users WHERE plan = (
        SELECT plan_type FROM plan_templates WHERE id = ${params.planId}
      )
    `

    if (usersWithPlan[0].count > 0) {
      return NextResponse.json(
        { success: false, message: "Cannot delete plan that is currently assigned to users" },
        { status: 400 },
      )
    }

    // Delete plan
    const deletedPlan = await sql`
      DELETE FROM plan_templates WHERE id = ${params.planId}
      RETURNING *
    `

    if (deletedPlan.length === 0) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error) {
    console.error("Delete plan error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete plan" }, { status: 500 })
  }
}
