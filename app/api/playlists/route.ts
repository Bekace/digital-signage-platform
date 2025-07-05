import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] Starting playlist fetch...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("🎵 [PLAYLISTS API] User authenticated:", user.email, "ID:", user.id)
    const sql = getDb()

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
        COALESCE(COUNT(pi.id), 0)::int as item_count
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `

    console.log("🎵 [PLAYLISTS API] Raw query result:", playlists)
    console.log("🎵 [PLAYLISTS API] Found playlists:", playlists.length)

    // Format playlists for frontend
    const formattedPlaylists = playlists.map((playlist) => {
      const formatted = {
        id: playlist.id,
        name: playlist.name || "Untitled Playlist",
        description: playlist.description || "",
        items: playlist.item_count || 0,
        duration: "0:00", // TODO: Calculate actual duration
        status: playlist.status || "draft",
        screens: [], // TODO: Get actual screen assignments
        lastModified: playlist.updated_at ? new Date(playlist.updated_at).toLocaleDateString() : "Unknown",
      }
      console.log("🎵 [PLAYLISTS API] Formatted playlist:", formatted)
      return formatted
    })

    const response = {
      success: true,
      playlists: formattedPlaylists,
    }

    console.log("🎵 [PLAYLISTS API] Final response:", response)
    return NextResponse.json(response)
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

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 })
    }

    const sql = getDb()

    // Create new playlist
    const result = await sql`
      INSERT INTO playlists (user_id, name, description, status, created_at, updated_at)
      VALUES (${user.id}, ${name}, ${description || ""}, 'draft', NOW(), NOW())
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
