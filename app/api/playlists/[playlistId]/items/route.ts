import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log("📋 [PLAYLIST ITEMS API] Starting GET request for playlist items:", params.playlistId)

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📋 [PLAYLIST ITEMS API] No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("📋 [PLAYLIST ITEMS API] Authenticated user:", user.id)

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("❌ [PLAYLIST ITEMS API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST ITEMS API] Found playlist ${playlistId}`)

    // Get playlist items with media information - using correct column names
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id as media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        mf.id as media_file_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.mime_type,
        mf.dimensions,
        mf.duration as media_duration,
        mf.media_source,
        mf.external_url,
        mf.embed_settings,
        mf.created_at as media_created_at
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC, pi.created_at ASC
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
      // Also add media_file for compatibility
      media_file: item.media_file_id
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
      total: formattedItems.length,
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log("➕ [PLAYLIST ITEMS API] Starting POST request for playlist items:", params.playlistId)

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("➕ [PLAYLIST ITEMS API] No authenticated user found for POST")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("➕ [PLAYLIST ITEMS API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const body = await request.json()
    const { media_id, duration = 30, transition_type = "fade" } = body

    if (!media_id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("➕ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log(`➕ [PLAYLIST ITEMS API] Playlist verified: ${playlistId}`)

    // Verify media ownership - using correct table name media_files
    const media = await sql`
      SELECT id FROM media_files WHERE id = ${media_id} AND user_id = ${user.id}
    `

    if (media.length === 0) {
      console.log("➕ [PLAYLIST ITEMS API] Media not found or not owned by user")
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    console.log(`➕ [PLAYLIST ITEMS API] Media verified: ${media_id}`)

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

    console.log(`➕ [PLAYLIST ITEMS API] Added item to playlist ${playlistId}`)

    const newItem = result[0]

    // Update playlist timestamp
    await sql`
      UPDATE playlists 
      SET updated_at = NOW() 
      WHERE id = ${playlistId}
    `

    return NextResponse.json({
      success: true,
      item: newItem,
      message: "Item added to playlist",
    })
  } catch (error) {
    console.error("➕ [PLAYLIST ITEMS API] Error adding item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add item to playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
