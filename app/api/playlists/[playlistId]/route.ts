import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("📋 [PLAYLIST API] Starting GET request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    // Get playlist with stats
    const playlists = await sql`
      SELECT 
        p.*,
        COUNT(pi.id) as item_count,
        COALESCE(SUM(m.file_size), 0) as total_size,
        COALESCE(SUM(pi.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      LEFT JOIN media m ON pi.media_id = m.id
      WHERE p.id = ${playlistId} AND p.user_id = ${user.id}
      GROUP BY p.id
    `

    if (playlists.length === 0) {
      console.log("❌ [PLAYLIST API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlists[0]

    console.log(`✅ [PLAYLIST API] Found playlist: ${playlist.name}`)

    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        status: playlist.status,
        item_count: Number(playlist.item_count),
        total_size: Number(playlist.total_size),
        total_duration: Number(playlist.total_duration),
        scale_image: playlist.scale_image || "fit",
        scale_video: playlist.scale_video || "fit",
        scale_document: playlist.scale_document || "fit",
        shuffle: playlist.shuffle || false,
        default_transition: playlist.default_transition || "fade",
        transition_speed: playlist.transition_speed || "medium",
        auto_advance: playlist.auto_advance || true,
        background_color: playlist.background_color || "black",
        text_overlay: playlist.text_overlay || false,
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
      console.log("❌ [PLAYLIST API] No user authenticated")
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
      console.log("❌ [PLAYLIST API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update playlist
    const updatedPlaylists = await sql`
      UPDATE playlists 
      SET 
        name = COALESCE(${body.name}, name),
        description = COALESCE(${body.description}, description),
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

    console.log(`✅ [PLAYLIST API] Updated playlist: ${updatedPlaylists[0].name}`)

    return NextResponse.json({
      success: true,
      playlist: updatedPlaylists[0],
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
