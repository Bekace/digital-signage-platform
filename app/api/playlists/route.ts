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

    // Get playlists with only existing columns
    const playlists = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        p.updated_at,
        COUNT(pi.id) as item_count,
        COALESCE(SUM(pi.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.created_at, p.updated_at
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
      // Default values for missing columns
      scale_image: "fit",
      scale_video: "fit",
      scale_document: "fit",
      shuffle: false,
      default_transition: "fade",
      transition_speed: "normal",
      auto_advance: true,
      background_color: "#000000",
      text_overlay: false,
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

    // Create new playlist with only existing columns
    const newPlaylist = await sql`
      INSERT INTO playlists (
        user_id, 
        name, 
        description, 
        status
      )
      VALUES (
        ${user.id}, 
        ${name.trim()}, 
        ${description?.trim() || ""}, 
        'draft'
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
      // Default values for missing columns
      scale_image: "fit",
      scale_video: "fit",
      scale_document: "fit",
      shuffle: false,
      default_transition: "fade",
      transition_speed: "normal",
      auto_advance: true,
      background_color: "#000000",
      text_overlay: false,
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
