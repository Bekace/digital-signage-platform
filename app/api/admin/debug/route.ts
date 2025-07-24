import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [ADMIN DEBUG] GET request received")

    const currentUser = await getCurrentUser(request)
    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get system information
    const [userCount, deviceCount, playlistCount, mediaCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM devices`,
      sql`SELECT COUNT(*) as count FROM playlists`,
      sql`SELECT COUNT(*) as count FROM media`,
    ])

    // Get recent activity
    const recentUsers = await sql`
      SELECT email, created_at FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    const recentDevices = await sql`
      SELECT name, created_at FROM devices 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    const debugInfo = {
      system: {
        users: Number.parseInt(userCount[0].count),
        devices: Number.parseInt(deviceCount[0].count),
        playlists: Number.parseInt(playlistCount[0].count),
        media: Number.parseInt(mediaCount[0].count),
      },
      recent: {
        users: recentUsers,
        devices: recentDevices,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      },
    }

    console.log("🔍 [ADMIN DEBUG] Debug info compiled")

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("❌ [ADMIN DEBUG] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
