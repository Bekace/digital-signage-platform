import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] Starting playlist fetch...")
    console.log("🎵 [PLAYLISTS API] Request headers:", Object.fromEntries(request.headers.entries()))

    const user = await getCurrentUser()
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No valid session found",
        },
        { status: 401 },
      )
    }

    console.log("🎵 [PLAYLISTS API] User authenticated:", user.email, "ID:", user.id)
    const sql = getDb()

    // Test database connection first
    try {
      const testResult = await sql`SELECT 1 as test`
      console.log("🎵 [PLAYLISTS API] Database connection test:", testResult)
    } catch (dbError) {
      console.error("🎵 [PLAYLISTS API] Database connection failed:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
        },
        { status: 500 },
      )
    }

    // Fetch playlists with item count
    console.log("🎵 [PLAYLISTS API] Querying playlists for user_id:", user.id)

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
        COALESCE(COUNT(pi.id), 0) as item_count
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `

    console.log("🎵 [PLAYLISTS API] Raw query result:", playlists)
    console.log("🎵 [PLAYLISTS API] Found playlists count:", playlists.length)

    // Format playlists for frontend
    const formattedPlaylists = playlists.map((playlist) => {
      const itemCount =
        typeof playlist.item_count === "string" ? Number.parseInt(playlist.item_count) : playlist.item_count || 0

      const formatted = {
        id: Number(playlist.id),
        name: String(playlist.name || "Untitled Playlist"),
        description: String(playlist.description || ""),
        items: itemCount,
        duration: "0:00", // TODO: Calculate actual duration based on playlist items
        status: String(playlist.status || "draft"),
        screens: [], // TODO: Get actual screen assignments from device_playlists table
        lastModified: playlist.updated_at ? new Date(playlist.updated_at).toLocaleDateString() : "Unknown",
      }
      console.log("🎵 [PLAYLISTS API] Formatted playlist:", formatted)
      return formatted
    })

    const response = {
      success: true,
      playlists: formattedPlaylists,
      debug: {
        user_id: user.id,
        raw_count: playlists.length,
        formatted_count: formattedPlaylists.length,
      },
    }

    console.log("🎵 [PLAYLISTS API] Final response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Unexpected error:", error)
    console.error("🎵 [PLAYLISTS API] Error stack:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          error_type: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString(),
        },
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
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Playlist name is required",
        },
        { status: 400 },
      )
    }

    const sql = getDb()

    // Create new playlist
    const result = await sql`
      INSERT INTO playlists (user_id, name, description, status, created_at, updated_at)
      VALUES (${user.id}, ${name.trim()}, ${description || ""}, 'draft', NOW(), NOW())
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
