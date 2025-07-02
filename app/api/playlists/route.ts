import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] Starting playlist fetch...")

    // Get user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      console.log("🎵 [PLAYLISTS API] No auth token found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const userId = decoded.userId
    console.log("🎵 [PLAYLISTS API] User ID:", userId)

    // Fetch playlists with item count
    const playlists = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.loop_enabled,
        p.schedule_enabled,
        p.start_time,
        p.end_time,
        p.selected_days,
        p.created_at,
        p.updated_at,
        COALESCE(COUNT(pi.id), 0)::text as item_count
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${userId}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `

    console.log("🎵 [PLAYLISTS API] Found playlists:", playlists.length)

    return NextResponse.json({
      success: true,
      playlists: playlists,
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] Creating new playlist...")

    // Get user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const userId = decoded.userId

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Playlist name is required",
        },
        { status: 400 },
      )
    }

    // Create new playlist
    const result = await sql`
      INSERT INTO playlists (user_id, name, description, status, created_at, updated_at)
      VALUES (${userId}, ${name}, ${description || ""}, 'draft', NOW(), NOW())
      RETURNING id, name, description, status, created_at, updated_at
    `

    console.log("🎵 [PLAYLISTS API] Created playlist:", result[0])

    return NextResponse.json({
      success: true,
      playlist: result[0],
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Create error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
