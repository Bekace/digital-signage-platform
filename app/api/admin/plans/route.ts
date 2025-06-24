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

    // Get all plan templates
    const plans = await sql`
      SELECT * FROM plan_templates 
      ORDER BY sort_order ASC, created_at ASC
    `

    return NextResponse.json({
      success: true,
      plans: plans,
    })
  } catch (error) {
    console.error("Get plans error:", error)
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

    const {
      plan_type,
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

    // Create new plan
    const newPlan = await sql`
      INSERT INTO plan_templates (
        plan_type, name, description, max_media_files, max_storage_bytes, 
        max_screens, price_monthly, price_yearly, features, is_active, sort_order
      ) VALUES (
        ${plan_type}, ${name}, ${description}, ${max_media_files}, ${max_storage_bytes},
        ${max_screens}, ${price_monthly}, ${price_yearly}, ${JSON.stringify(features)}, 
        ${is_active}, ${sort_order}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      plan: newPlan[0],
      message: "Plan created successfully",
    })
  } catch (error) {
    console.error("Create plan error:", error)
    return NextResponse.json({ success: false, message: "Failed to create plan" }, { status: 500 })
  }
}
