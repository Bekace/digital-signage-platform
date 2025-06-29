import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🎵 [PLAYLISTS API] Starting GET request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Get playlists with item count
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
        p.scale_image,
        p.scale_video,
        p.scale_document,
        p.shuffle,
        p.default_transition,
        p.transition_speed,
        p.auto_advance,
        p.background_color,
        p.text_overlay,
        COUNT(pi.id) as item_count,
        COALESCE(SUM(pi.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at,
               p.scale_image, p.scale_video, p.scale_document, p.shuffle, p.default_transition,
               p.transition_speed, p.auto_advance, p.background_color, p.text_overlay
      ORDER BY p.updated_at DESC
    `

    console.log(`✅ [PLAYLISTS API] Found ${playlists.length} playlists for user ${user.id}`)

    // Ensure we always return an array
    const playlistsArray = Array.isArray(playlists) ? playlists : []

    return NextResponse.json({
      success: true,
      playlists: playlistsArray,
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
        playlists: [], // Always return empty array on error
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("➕ [PLAYLISTS API] Starting POST request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLISTS API] Request body:", body)

    const { name, description } = body

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    const sql = getDb()

    // Create new playlist with all default values
    const newPlaylist = await sql`
      INSERT INTO playlists (
        user_id, 
        name, 
        description,
        status,
        loop_enabled,
        schedule_enabled,
        scale_image,
        scale_video,
        scale_document,
        shuffle,
        default_transition,
        transition_speed,
        auto_advance,
        background_color,
        text_overlay
      )
      VALUES (
        ${user.id}, 
        ${name.trim()}, 
        ${description || ""},
        'draft',
        true,
        false,
        'fit',
        'fit',
        'fit',
        false,
        'fade',
        'normal',
        true,
        '#000000',
        false
      )
      RETURNING *
    `

    console.log(`✅ [PLAYLISTS API] Created playlist with ID ${newPlaylist[0].id}`)

    return NextResponse.json(
      {
        success: true,
        playlist: newPlaylist[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
