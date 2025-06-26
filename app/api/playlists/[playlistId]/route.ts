import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🎵 [PLAYLIST API] Starting GET request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("❌ [PLAYLIST API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const sql = getDb()

    // Get playlist details
    const playlists = await sql`
      SELECT 
        p.*,
        COUNT(pi.id) as item_count,
        COALESCE(SUM(COALESCE(pi.duration, 30)), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.id = ${playlistId} AND p.user_id = ${user.id}
      GROUP BY p.id
    `

    if (playlists.length === 0) {
      console.log("❌ [PLAYLIST API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlists[0]
    console.log("✅ [PLAYLIST API] Found playlist:", playlist.name)

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
        scale_image: playlist.scale_image || "fit",
        scale_video: playlist.scale_video || "fit",
        scale_document: playlist.scale_document || "fit",
        shuffle: playlist.shuffle || false,
        default_transition: playlist.default_transition || "fade",
        transition_speed: playlist.transition_speed || "medium",
        auto_advance: playlist.auto_advance !== false,
        background_color: playlist.background_color || "black",
        text_overlay: playlist.text_overlay || false,
        item_count: Number(playlist.item_count) || 0,
        total_duration: Number(playlist.total_duration) || 0,
        created_at: playlist.created_at,
        updated_at: playlist.updated_at,
      },
    })
  } catch (error) {
    console.error("❌ [PLAYLIST API] Error:", error)
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
  console.log("📝 [PLAYLIST API] Starting PUT request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLIST API] Update data:", body)

    const sql = getDb()

    // Verify ownership
    const existing = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update playlist
    const updated = await sql`
      UPDATE playlists SET
        name = ${body.name || existing[0].name},
        description = ${body.description !== undefined ? body.description : existing[0].description},
        status = ${body.status || existing[0].status},
        loop_enabled = ${body.loop_enabled !== undefined ? body.loop_enabled : existing[0].loop_enabled},
        schedule_enabled = ${body.schedule_enabled !== undefined ? body.schedule_enabled : existing[0].schedule_enabled},
        start_time = ${body.start_time !== undefined ? body.start_time : existing[0].start_time},
        end_time = ${body.end_time !== undefined ? body.end_time : existing[0].end_time},
        selected_days = ${body.selected_days || existing[0].selected_days},
        scale_image = ${body.scale_image || existing[0].scale_image},
        scale_video = ${body.scale_video || existing[0].scale_video},
        scale_document = ${body.scale_document || existing[0].scale_document},
        shuffle = ${body.shuffle !== undefined ? body.shuffle : existing[0].shuffle},
        default_transition = ${body.default_transition || existing[0].default_transition},
        transition_speed = ${body.transition_speed || existing[0].transition_speed},
        auto_advance = ${body.auto_advance !== undefined ? body.auto_advance : existing[0].auto_advance},
        background_color = ${body.background_color || existing[0].background_color},
        text_overlay = ${body.text_overlay !== undefined ? body.text_overlay : existing[0].text_overlay},
        updated_at = NOW()
      WHERE id = ${playlistId}
      RETURNING *
    `

    console.log("✅ [PLAYLIST API] Updated playlist:", updated[0].name)

    return NextResponse.json({
      success: true,
      playlist: updated[0],
    })
  } catch (error) {
    console.error("❌ [PLAYLIST API] Error:", error)
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
  console.log("🗑️ [PLAYLIST API] Starting DELETE request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const sql = getDb()

    // Verify ownership and delete
    const deleted = await sql`
      DELETE FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING *
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log("✅ [PLAYLIST API] Deleted playlist:", deleted[0].name)

    return NextResponse.json({
      success: true,
      message: "Playlist deleted successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
