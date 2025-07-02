import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const userId = decoded.userId

    // Get user's current usage and plan
    const userResult = await sql`
      SELECT 
        u.media_files_count,
        u.storage_used_bytes,
        u.plan_id,
        p.name as plan_name,
        p.max_media_files,
        p.max_storage_gb,
        p.max_screens,
        p.max_playlists
      FROM users u
      LEFT JOIN subscription_plans p ON u.plan_id = p.id
      WHERE u.id = ${userId}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = userResult[0]

    // Get actual counts from database
    const countsResult = await sql`
      SELECT 
        (SELECT COUNT(*) FROM media_files WHERE user_id = ${userId} AND deleted_at IS NULL) as actual_media_count,
        (SELECT COUNT(*) FROM devices WHERE user_id = ${userId}) as screen_count,
        (SELECT COUNT(*) FROM playlists WHERE user_id = ${userId}) as playlist_count,
        (SELECT COALESCE(SUM(file_size), 0) FROM media_files WHERE user_id = ${userId} AND deleted_at IS NULL) as actual_storage_bytes
    `

    const counts = countsResult[0]

    // Convert storage to GB
    const storageUsedGB = Math.round((counts.actual_storage_bytes / (1024 * 1024 * 1024)) * 100) / 100

    const usage = {
      mediaFiles: {
        current: Number.parseInt(counts.actual_media_count),
        limit: user.max_media_files || 5,
      },
      storage: {
        current: storageUsedGB,
        limit: user.max_storage_gb || 1,
      },
      screens: {
        current: Number.parseInt(counts.screen_count),
        limit: user.max_screens || 2,
      },
      playlists: {
        current: Number.parseInt(counts.playlist_count),
        limit: user.max_playlists || 3,
      },
      plan: {
        name: user.plan_name || "Free",
        id: user.plan_id || 1,
      },
    }

    return NextResponse.json({
      success: true,
      usage,
    })
  } catch (error) {
    console.error("Usage API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch usage data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
