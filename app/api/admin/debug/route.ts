import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("🔍 [ADMIN DEBUG] Starting debug info fetch...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      console.log("🔍 [ADMIN DEBUG] Access denied - not admin")
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log("🔍 [ADMIN DEBUG] Admin verified, fetching debug info...")

    // Get system statistics
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const adminCount = await sql`SELECT COUNT(*) as count FROM admin_users`
    const mediaCount = await sql`SELECT COUNT(*) as count FROM media`
    const playlistCount = await sql`SELECT COUNT(*) as count FROM playlists`
    const deviceCount = await sql`SELECT COUNT(*) as count FROM devices`

    // Get recent activity
    const recentUsers = await sql`
      SELECT id, email, first_name, last_name, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    // Get admin users
    const adminUsers = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        au.role,
        au.created_at as admin_since
      FROM users u
      JOIN admin_users au ON u.id = au.user_id
      ORDER BY au.created_at DESC
    `

    // Get table information
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log("🔍 [ADMIN DEBUG] Debug info compiled successfully")

    return NextResponse.json({
      success: true,
      statistics: {
        users: Number.parseInt(userCount[0].count),
        admins: Number.parseInt(adminCount[0].count),
        media: Number.parseInt(mediaCount[0].count),
        playlists: Number.parseInt(playlistCount[0].count),
        devices: Number.parseInt(deviceCount[0].count),
      },
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        createdAt: user.created_at,
      })),
      adminUsers: adminUsers.map((admin) => ({
        id: admin.id,
        email: admin.email,
        name: `${admin.first_name} ${admin.last_name}`,
        role: admin.role,
        adminSince: admin.admin_since,
      })),
      tables: tables.map((table) => ({
        name: table.table_name,
        type: table.table_type,
      })),
      timestamp: new Date().toISOString(),
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
