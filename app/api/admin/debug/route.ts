import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("🐛 [ADMIN DEBUG] Starting debug info fetch...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      console.log("🐛 [ADMIN DEBUG] Authentication failed")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!authResult.isAdmin) {
      console.log("🐛 [ADMIN DEBUG] User is not admin:", authResult.userId)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("🐛 [ADMIN DEBUG] Admin verified:", authResult.userId)

    // Get system debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      requestingUser: {
        id: authResult.userId,
        email: authResult.email,
        isAdmin: authResult.isAdmin,
        adminRole: authResult.adminRole,
      },
    }

    // Get table counts
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      const adminCount = await sql`SELECT COUNT(*) as count FROM admin_users`
      const mediaCount = await sql`SELECT COUNT(*) as count FROM media`
      const playlistCount = await sql`SELECT COUNT(*) as count FROM playlists`
      const deviceCount = await sql`SELECT COUNT(*) as count FROM devices`

      debugInfo.tableCounts = {
        users: userCount[0].count,
        admins: adminCount[0].count,
        media: mediaCount[0].count,
        playlists: playlistCount[0].count,
        devices: deviceCount[0].count,
      }
    } catch (error) {
      debugInfo.tableCounts = { error: error instanceof Error ? error.message : "Unknown error" }
    }

    // Get recent admin users
    try {
      const recentAdmins = await sql`
        SELECT 
          u.email,
          au.role,
          au.created_at
        FROM admin_users au
        JOIN users u ON au.user_id = u.id
        ORDER BY au.created_at DESC
        LIMIT 5
      `
      debugInfo.recentAdmins = recentAdmins
    } catch (error) {
      debugInfo.recentAdmins = { error: error instanceof Error ? error.message : "Unknown error" }
    }

    console.log("🐛 [ADMIN DEBUG] Debug info compiled")

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("❌ [ADMIN DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database error in admin check",
        error: error instanceof Error ? error.message : "Unknown error",
        step: "admin_check_error",
      },
      { status: 500 },
    )
  }
}
