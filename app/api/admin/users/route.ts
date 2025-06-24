import { NextResponse } from "next/server"
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

    // Get all users with their usage stats
    const users = await sql`
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.company, 
        u.plan, 
        u.created_at, 
        u.is_admin,
        COALESCE(media_stats.media_count, 0) as media_count,
        COALESCE(media_stats.storage_used, 0) as storage_used
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as media_count,
          SUM(file_size) as storage_used
        FROM media_files 
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) media_stats ON u.id = media_stats.user_id
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        createdAt: user.created_at,
        isAdmin: user.is_admin || false,
        mediaCount: Number(user.media_count) || 0,
        storageUsed: Number(user.storage_used) || 0,
      })),
    })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
