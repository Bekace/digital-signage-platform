import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db" // Declare the getDb variable

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] Starting playlist fetch...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("🎵 [PLAYLISTS API] User authenticated:", user.email, "ID:", user.id)
    const db = getDb() // Use the declared getDb variable

    // Test database connection first
    try {
      const testResult = await db`SELECT 1 as test`
      console.log("🎵 [PLAYLISTS API] Database connection test passed")
    } catch (dbError) {
      console.error("🎵 [PLAYLISTS API] Database connection failed:", dbError)
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 })
    }

    // Fetch playlists with item count
    const playlists = await db`
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
        COALESCE(COUNT(pi.id), 0) as item_count
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `

    console.log("🎵 [PLAYLISTS API] Found playlists:", playlists.length)

    // Format playlists for frontend
    const formattedPlaylists = playlists.map((playlist) => {
      const itemCount =
        typeof playlist.item_count === "string" ? Number.parseInt(playlist.item_count) : playlist.item_count || 0

      return {
        id: Number(playlist.id),
        name: String(playlist.name || "Untitled Playlist"),
        description: String(playlist.description || ""),
        items: itemCount,
        duration: "0:00",
        status: String(playlist.status || "draft"),
        screens: [],
        lastModified: playlist.updated_at ? new Date(playlist.updated_at).toLocaleDateString() : "Unknown",
      }
    })

    console.log("🎵 [PLAYLISTS API] Returning", formattedPlaylists.length, "formatted playlists")

    return NextResponse.json({
      success: true,
      playlists: formattedPlaylists,
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
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 })
    }

    const db = getDb() // Use the declared getDb variable
    const result = await db`
      INSERT INTO playlists (user_id, name, description, status, created_at, updated_at)
      VALUES (${user.id}, ${name}, ${description || ""}, 'draft', NOW(), NOW())
      RETURNING id, name, description, status, created_at, updated_at
    `

    const newPlaylist = result[0]

    return NextResponse.json({
      success: true,
      playlist: {
        id: newPlaylist.id,
        name: newPlaylist.name,
        description: newPlaylist.description,
        items: 0,
        duration: "0:00",
        status: newPlaylist.status,
        screens: [],
        lastModified: new Date(newPlaylist.updated_at).toLocaleDateString(),
      },
    })
  } catch (error) {
    console.error("🎵 [API] Error creating playlist:", error)
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
