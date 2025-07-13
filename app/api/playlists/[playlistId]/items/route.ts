import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("📋 [PLAYLIST ITEMS API] Starting GET request for playlist items:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("❌ [PLAYLIST ITEMS API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items with media information - using correct column name media_file_id
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id as media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        m.id as media_file_id,
        m.filename,
        m.original_name,
        m.file_type,
        m.file_size,
        m.url,
        m.thumbnail_url,
        m.mime_type,
        m.dimensions,
        m.duration as media_duration,
        m.media_source,
        m.external_url,
        m.embed_settings,
        m.created_at as media_created_at
      FROM playlist_items pi
      LEFT JOIN media m ON pi.media_file_id = m.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    console.log(`✅ [PLAYLIST ITEMS API] Found ${items.length} items for playlist ${playlistId}`)

    // Format items for frontend
    const formattedItems = items.map((item) => ({
      id: Number(item.id),
      playlist_id: Number(item.playlist_id),
      media_id: Number(item.media_id),
      position: Number(item.position),
      duration: Number(item.duration) || 30,
      transition_type: String(item.transition_type || "fade"),
      created_at: item.created_at,
      media: item.media_file_id
        ? {
            id: Number(item.media_file_id),
            filename: String(item.filename || ""),
            original_name: String(item.original_name || ""),
            original_filename: String(item.original_name || item.filename || ""),
            file_type: String(item.file_type || ""),
            file_size: Number(item.file_size) || 0,
            url: String(item.url || ""),
            thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : undefined,
            mime_type: item.mime_type ? String(item.mime_type) : undefined,
            dimensions: item.dimensions ? String(item.dimensions) : undefined,
            duration: item.media_duration ? Number(item.media_duration) : undefined,
            media_source: item.media_source ? String(item.media_source) : undefined,
            external_url: item.external_url ? String(item.external_url) : undefined,
            embed_settings: item.embed_settings ? String(item.embed_settings) : undefined,
            created_at: item.media_created_at,
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      items: formattedItems,
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("➕ [PLAYLIST ITEMS API] Starting POST request for playlist items:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("❌ [PLAYLIST ITEMS API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const body = await request.json()
    const { media_id, duration = 30, transition_type = "fade" } = body

    if (!media_id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media ownership
    const media = await sql`
      SELECT id FROM media WHERE id = ${media_id} AND user_id = ${user.id}
    `

    if (media.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Media not found or not owned by user")
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Get next position
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM playlist_items
      WHERE playlist_id = ${playlistId}
    `

    const nextPosition = Number(positionResult[0].next_position)

    // Add item to playlist - using correct column name media_file_id
    const result = await sql`
      INSERT INTO playlist_items (
        playlist_id,
        media_file_id,
        position,
        duration,
        transition_type,
        created_at
      )
      VALUES (
        ${playlistId},
        ${media_id},
        ${nextPosition},
        ${duration},
        ${transition_type},
        NOW()
      )
      RETURNING id, playlist_id, media_file_id as media_id, position, duration, transition_type, created_at
    `

    console.log(`✅ [PLAYLIST ITEMS API] Added item to playlist ${playlistId}`)

    return NextResponse.json({
      success: true,
      item: result[0],
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to add item to playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
