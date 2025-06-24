import { NextResponse } from "next/server"
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

    // Get all users with their plan information and usage stats
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.company,
        u.plan_type,
        u.created_at,
        u.is_admin,
        COALESCE(media_stats.media_files_count, 0) as media_files_count,
        COALESCE(media_stats.storage_used_bytes, 0) as storage_used_bytes,
        0 as screens_count,
        pl.max_media_files,
        pl.max_storage_bytes,
        pl.max_screens,
        pl.price_monthly
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as media_files_count,
          SUM(file_size) as storage_used_bytes
        FROM media_files 
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) media_stats ON u.id = media_stats.user_id
      LEFT JOIN plan_limits pl ON u.plan_type = pl.plan_type
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
