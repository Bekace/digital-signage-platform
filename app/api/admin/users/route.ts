import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return false

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const result = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`

    return result.length > 0 && result[0].is_admin
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.company_name,
        u.plan_id,
        u.media_files_count,
        u.storage_used_bytes,
        u.created_at,
        u.is_admin,
        p.name as plan_name,
        p.price as plan_price
      FROM users u
      LEFT JOIN subscription_plans p ON u.plan_id = p.id
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Admin users GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 },
    )
  }
}
