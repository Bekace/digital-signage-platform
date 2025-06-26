import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("📋 [SINGLE PLAYLIST API] Starting GET request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [SINGLE PLAYLIST API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    if (isNaN(playlistId)) {
      console.log("❌ [SINGLE PLAYLIST API] Invalid playlist ID")
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    // Get playlist with stats
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
        p.scale_image,
        p.scale_video,
        p.scale_document,
        p.shuffle,
        p.default_transition,
        p.transition_speed,
        p.auto_advance,
        p.background_color,
        p.text_overlay,
        p.created_at,
        p.updated_at,
        COUNT(pi.id) as item_count,
        COALESCE(SUM(COALESCE(pi.duration, 30)), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.id = ${playlistId} AND p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.scale_image, p.scale_video, 
               p.scale_document, p.shuffle, p.default_transition, p.transition_speed, 
               p.auto_advance, p.background_color, p.text_overlay, p.created_at, p.updated_at
    `

    if (playlists.length === 0) {
      console.log("❌ [SINGLE PLAYLIST API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlists[0]

    console.log(`✅ [SINGLE PLAYLIST API] Found playlist: ${playlist.name}`)

    return NextResponse.json({
      success: true,
      playlist: {
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
        // Playlist options
        scale_image: playlist.scale_image || "fit",
        scale_video: playlist.scale_video || "fit",
        scale_document: playlist.scale_document || "fit",
        shuffle: playlist.shuffle || false,
        default_transition: playlist.default_transition || "fade",
        transition_speed: playlist.transition_speed || "medium",
        auto_advance: playlist.auto_advance || true,
        background_color: playlist.background_color || "black",
        text_overlay: playlist.text_overlay || false,
      },
    })
  } catch (error) {
    console.error("❌ [SINGLE PLAYLIST API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("📝 [SINGLE PLAYLIST API] Starting PUT request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [SINGLE PLAYLIST API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      console.log("❌ [SINGLE PLAYLIST API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update playlist
    const updatedPlaylist = await sql`
      UPDATE playlists SET
        name = COALESCE(${body.name}, name),
        description = COALESCE(${body.description}, description),
        status = COALESCE(${body.status}, status),
        loop_enabled = COALESCE(${body.loop_enabled}, loop_enabled),
        schedule_enabled = COALESCE(${body.schedule_enabled}, schedule_enabled),
        start_time = COALESCE(${body.start_time}, start_time),
        end_time = COALESCE(${body.end_time}, end_time),
        selected_days = COALESCE(${body.selected_days}, selected_days),
        scale_image = COALESCE(${body.scale_image}, scale_image),
        scale_video = COALESCE(${body.scale_video}, scale_video),
        scale_document = COALESCE(${body.scale_document}, scale_document),
        shuffle = COALESCE(${body.shuffle}, shuffle),
        default_transition = COALESCE(${body.default_transition}, default_transition),
        transition_speed = COALESCE(${body.transition_speed}, transition_speed),
        auto_advance = COALESCE(${body.auto_advance}, auto_advance),
        background_color = COALESCE(${body.background_color}, background_color),
        text_overlay = COALESCE(${body.text_overlay}, text_overlay),
        updated_at = NOW()
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING *
    `

    console.log(`✅ [SINGLE PLAYLIST API] Updated playlist: ${updatedPlaylist[0].name}`)

    return NextResponse.json({
      success: true,
      playlist: updatedPlaylist[0],
    })
  } catch (error) {
    console.error("❌ [SINGLE PLAYLIST API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🗑️ [SINGLE PLAYLIST API] Starting DELETE request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [SINGLE PLAYLIST API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      console.log("❌ [SINGLE PLAYLIST API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Delete playlist items first
    await sql`
      DELETE FROM playlist_items 
      WHERE playlist_id = ${playlistId}
    `

    // Delete playlist
    await sql`
      DELETE FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    console.log(`✅ [SINGLE PLAYLIST API] Deleted playlist: ${playlistId}`)

    return NextResponse.json({
      success: true,
      message: "Playlist deleted successfully",
    })
  } catch (error) {
    console.error("❌ [SINGLE PLAYLIST API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
