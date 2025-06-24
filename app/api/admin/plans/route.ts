import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${currentUser.id}
    `

    if (!adminCheck[0]?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all plan limits
    const plans = await sql`
      SELECT 
        plan_type,
        max_media_files,
        max_storage_bytes,
        max_screens,
        price_monthly,
        features
      FROM plan_limits
      ORDER BY 
        CASE plan_type 
          WHEN 'free' THEN 1
          WHEN 'pro' THEN 2
          WHEN 'enterprise' THEN 3
          ELSE 4
        END
    `

    return NextResponse.json({ success: true, plans })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${currentUser.id}
    `

    if (!adminCheck[0]?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { plan_type, max_media_files, max_storage_bytes, max_screens, price_monthly } = await request.json()

    // Update plan limits
    await sql`
      UPDATE plan_limits 
      SET 
        max_media_files = ${max_media_files},
        max_storage_bytes = ${max_storage_bytes},
        max_screens = ${max_screens},
        price_monthly = ${price_monthly}
      WHERE plan_type = ${plan_type}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
