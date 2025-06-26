import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("📋 [PLAYLISTS API] Starting GET request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Get all playlists for the user with item counts
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
        COUNT(pi.id) as item_count,
        COALESCE(SUM(COALESCE(pi.duration, 30)), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `

    console.log(`✅ [PLAYLISTS API] Found ${playlists.length} playlists for user ${user.id}`)

    const formattedPlaylists = playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      status: playlist.status,
      loop_enabled: playlist.loop_enabled,
      schedule_enabled: playlist.schedule_enabled,
      start_time: playlist.start_time,
      end_time: playlist.end_time,
      selected_days: playlist.selected_days || [],
      item_count: Number(playlist.item_count) || 0,
      total_duration: Number(playlist.total_duration) || 0,
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
    }))

    return NextResponse.json({
      success: true,
      playlists: formattedPlaylists,
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    const sql = getDb()

    // Create new playlist
    const newPlaylists = await sql`
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
        ${name}, 
        ${description || ""}, 
        'draft',
        false,
        false,
        'fit',
        'fit',
        'fit',
        false,
        'fade',
        'medium',
        true,
        'black',
        false
      )
      RETURNING *
    `

    console.log(`✅ [PLAYLISTS API] Created playlist: ${newPlaylists[0].name}`)

    return NextResponse.json(
      {
        success: true,
        playlist: newPlaylists[0],
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
