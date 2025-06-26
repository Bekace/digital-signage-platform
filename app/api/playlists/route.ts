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
      return NextResponse.json({ error: "Unauthorized", playlists: [] }, { status: 401 })
    }

    const sql = getDb()

    // Get playlists with item counts and total duration
    const playlists = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
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
      GROUP BY p.id, p.name, p.description, p.status, p.created_at, p.updated_at,
               p.scale_image, p.scale_video, p.scale_document, p.shuffle,
               p.default_transition, p.transition_speed, p.auto_advance,
               p.background_color, p.text_overlay
      ORDER BY p.updated_at DESC
    `

    console.log(`✅ [PLAYLISTS API] Found ${playlists.length} playlists for user ${user.id}`)

    const formattedPlaylists = playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      status: playlist.status,
      item_count: Number(playlist.item_count),
      total_duration: Number(playlist.total_duration),
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
      scale_image: playlist.scale_image,
      scale_video: playlist.scale_video,
      scale_document: playlist.scale_document,
      shuffle: playlist.shuffle,
      default_transition: playlist.default_transition,
      transition_speed: playlist.transition_speed,
      auto_advance: playlist.auto_advance,
      background_color: playlist.background_color,
      text_overlay: playlist.text_overlay,
    }))

    return NextResponse.json({
      success: true,
      playlists: formattedPlaylists,
      total: formattedPlaylists.length,
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
        playlists: [],
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

    // Create new playlist
    const newPlaylist = await sql`
      INSERT INTO playlists (
        user_id, 
        name, 
        description, 
        status,
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
        ${description?.trim() || ""}, 
        'draft',
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

    console.log(`✅ [PLAYLISTS API] Created playlist with ID: ${newPlaylist[0].id}`)

    const playlist = {
      id: newPlaylist[0].id,
      name: newPlaylist[0].name,
      description: newPlaylist[0].description,
      status: newPlaylist[0].status,
      item_count: 0,
      total_duration: 0,
      created_at: newPlaylist[0].created_at,
      updated_at: newPlaylist[0].updated_at,
      scale_image: newPlaylist[0].scale_image,
      scale_video: newPlaylist[0].scale_video,
      scale_document: newPlaylist[0].scale_document,
      shuffle: newPlaylist[0].shuffle,
      default_transition: newPlaylist[0].default_transition,
      transition_speed: newPlaylist[0].transition_speed,
      auto_advance: newPlaylist[0].auto_advance,
      background_color: newPlaylist[0].background_color,
      text_overlay: newPlaylist[0].text_overlay,
    }

    return NextResponse.json(
      {
        success: true,
        playlist,
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
