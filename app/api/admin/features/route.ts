import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin using admin_users table
    const adminCheck = await sql`
      SELECT au.role 
      FROM admin_users au 
      WHERE au.user_id = ${user.id}
    `

    if (adminCheck.length === 0) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all plan features
    const features = await sql`
      SELECT 
        id,
        plan_type,
        feature_name,
        feature_value,
        is_enabled,
        created_at,
        updated_at
      FROM plan_features
      ORDER BY plan_type, feature_name
    `

    return NextResponse.json({
      success: true,
      features: features,
    })
  } catch (error) {
    console.error("Admin features API error:", error)
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

    const { plan_type, feature_name, feature_value, is_enabled } = await request.json()

    const result = await sql`
      INSERT INTO plan_features (plan_type, feature_name, feature_value, is_enabled)
      VALUES (${plan_type}, ${feature_name}, ${feature_value}, ${is_enabled})
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      feature: result[0],
    })
  } catch (error) {
    console.error("Admin create feature API error:", error)
    return NextResponse.json(
      {
        error: "Failed to create feature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
