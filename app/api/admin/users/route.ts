import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("Admin users API: Starting request")

    const user = await getCurrentUser()
    console.log("Admin users API: Current user:", user?.id, user?.email)

    if (!user) {
      console.log("Admin users API: No user authenticated")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin - handle case where is_admin column might not exist
    let adminCheck
    try {
      adminCheck = await sql`
        SELECT is_admin FROM users WHERE id = ${user.id}
      `
      console.log("Admin users API: Admin check result:", adminCheck)
    } catch (err) {
      console.log("Admin users API: is_admin column might not exist, checking error:", err.message)

      // If is_admin column doesn't exist, check if this is the first user (make them admin)
      try {
        const userCount = await sql`SELECT COUNT(*) as count FROM users`
        if (userCount[0].count === 1) {
          // First user, make them admin
          try {
            await sql`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`
            await sql`UPDATE users SET is_admin = true WHERE id = ${user.id}`
            console.log("Admin users API: Made first user admin")
          } catch (alterErr) {
            console.log("Admin users API: Error adding is_admin column:", alterErr.message)
          }
        }

        // Try admin check again
        adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${user.id}`
      } catch (fallbackErr) {
        console.log("Admin users API: Fallback error:", fallbackErr.message)
        return NextResponse.json(
          {
            success: false,
            message: "Database schema error - is_admin column missing",
          },
          { status: 500 },
        )
      }
    }

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      console.log("Admin users API: Access denied - not admin")
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Get all users with their usage stats
    try {
      const users = await sql`
        SELECT 
          u.id, 
          u.email, 
          u.first_name, 
          u.last_name, 
          u.company, 
          u.plan, 
          u.created_at, 
          COALESCE(u.is_admin, false) as is_admin,
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

      console.log("Admin users API: Found", users.length, "users")

      return NextResponse.json({
        success: true,
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          company: user.company || "",
          plan: user.plan || "free",
          createdAt: user.created_at,
          isAdmin: user.is_admin || false,
          mediaCount: Number(user.media_count) || 0,
          storageUsed: Number(user.storage_used) || 0,
        })),
      })
    } catch (queryErr) {
      console.error("Admin users API: Query error:", queryErr)
      return NextResponse.json(
        {
          success: false,
          message: "Database query error: " + queryErr.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Admin users API: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + error.message,
      },
      { status: 500 },
    )
  }
}
