import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🎵 [PLAYLIST ITEMS API] Starting GET request for playlist:", params.playlistId)

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

    // First verify playlist ownership
    console.log("🔍 [PLAYLIST ITEMS API] Verifying playlist ownership...")
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log("✅ [PLAYLIST ITEMS API] Playlist ownership verified")

    // Get playlist items with complete media details
    console.log("🔍 [PLAYLIST ITEMS API] Fetching playlist items with media details...")
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        mf.id as media_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.mime_type,
        mf.url,
        mf.storage_url,
        mf.thumbnail_url,
        mf.metadata,
        mf.dimensions,
        mf.duration as media_duration,
        mf.created_at as media_created_at
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    console.log(`✅ [PLAYLIST ITEMS API] Found ${items.length} items for playlist ${playlistId}`)
    if (items.length > 0) {
      console.log("📋 [PLAYLIST ITEMS API] Sample item data:", items[0])
    }

    const formattedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_file_id, // Map media_file_id to media_id for frontend compatibility
      position: item.position,
      duration: item.duration,
      transition_type: item.transition_type,
      created_at: item.created_at,
      media: item.media_file_id
        ? {
            id: item.media_id,
            filename: item.filename || "",
            original_filename: item.original_name || item.filename || "Untitled",
            original_name: item.original_name || item.filename || "Untitled",
            file_type: item.file_type || "unknown",
            file_size: item.file_size || 0,
            mime_type: item.mime_type || "application/octet-stream",
            url: item.url || item.storage_url || "",
            thumbnail_url: item.thumbnail_url,
            metadata: item.metadata,
            dimensions: item.dimensions,
            duration: item.media_duration,
            created_at: item.media_created_at,
          }
        : null,
      // Also include media_file for backward compatibility
      media_file: item.media_file_id
        ? {
            id: item.media_id,
            filename: item.filename || "",
            original_filename: item.original_name || item.filename || "Untitled",
            original_name: item.original_name || item.filename || "Untitled",
            file_type: item.file_type || "unknown",
            file_size: item.file_size || 0,
            mime_type: item.mime_type || "application/octet-stream",
            url: item.url || item.storage_url || "",
            thumbnail_url: item.thumbnail_url,
            metadata: item.metadata,
            dimensions: item.dimensions,
            duration: item.media_duration,
            created_at: item.media_created_at,
          }
        : null,
    }))

    console.log("📋 [PLAYLIST ITEMS API] Formatted items:", formattedItems.length)

    return NextResponse.json({
      success: true,
      items: formattedItems,
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS API] Error:", error)
    console.error("❌ [PLAYLIST ITEMS API] Error stack:", error instanceof Error ? error.stack : "No stack")
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
  console.log("➕ [PLAYLIST ITEMS API] Starting POST request for playlist:", params.playlistId)

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
    console.log("📝 [PLAYLIST ITEMS API] Request body:", body)

    const { media_id, duration } = body

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
      SELECT id FROM media_files WHERE id = ${media_id} AND user_id = ${user.id}
    `

    if (media.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Media file not found or not owned by user")
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get next position
    const maxPosition = await sql`
      SELECT COALESCE(MAX(position), 0) as max_pos FROM playlist_items WHERE playlist_id = ${playlistId}
    `

    const nextPosition = (maxPosition[0]?.max_pos || 0) + 1

    // Add item to playlist - using media_file_id column
    const newItem = await sql`
      INSERT INTO playlist_items (playlist_id, media_file_id, position, duration, transition_type)
      VALUES (${playlistId}, ${media_id}, ${nextPosition}, ${duration || 30}, 'fade')
      RETURNING *
    `

    console.log(`✅ [PLAYLIST ITEMS API] Added item to playlist at position ${nextPosition}`)

    // Get the full item with media details
    const fullItem = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        mf.id as media_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.mime_type,
        mf.url,
        mf.storage_url,
        mf.thumbnail_url,
        mf.metadata,
        mf.dimensions,
        mf.duration as media_duration,
        mf.created_at as media_created_at
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.id = ${newItem[0].id}
    `

    const item = fullItem[0]

    return NextResponse.json(
      {
        success: true,
        item: {
          id: item.id,
          playlist_id: item.playlist_id,
          media_id: item.media_file_id, // Map media_file_id to media_id for frontend compatibility
          position: item.position,
          duration: item.duration,
          transition_type: item.transition_type,
          created_at: item.created_at,
          media: {
            id: item.media_id,
            filename: item.filename || "",
            original_filename: item.original_name || item.filename || "Untitled",
            original_name: item.original_name || item.filename || "Untitled",
            file_type: item.file_type || "unknown",
            file_size: item.file_size || 0,
            mime_type: item.mime_type || "application/octet-stream",
            url: item.url || item.storage_url || "",
            thumbnail_url: item.thumbnail_url,
            metadata: item.metadata,
            dimensions: item.dimensions,
            duration: item.media_duration,
            created_at: item.media_created_at,
          },
          media_file: {
            id: item.media_id,
            filename: item.filename || "",
            original_filename: item.original_name || item.filename || "Untitled",
            original_name: item.original_name || item.filename || "Untitled",
            file_type: item.file_type || "unknown",
            file_size: item.file_size || 0,
            mime_type: item.mime_type || "application/octet-stream",
            url: item.url || item.storage_url || "",
            thumbnail_url: item.thumbnail_url,
            metadata: item.metadata,
            dimensions: item.dimensions,
            duration: item.media_duration,
            created_at: item.media_created_at,
          },
        },
      },
      { status: 201 },
    )
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
