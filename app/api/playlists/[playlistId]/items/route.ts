import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🎵 [PLAYLIST ITEMS API] Starting GET request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser(request)
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

    // Get playlist items with media information
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        m.id as media_id,
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
      LEFT JOIN media_files m ON pi.media_id = m.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    // Format the response to match expected structure
    const formattedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_id,
      position: item.position,
      duration: item.duration,
      transition_type: item.transition_type || "fade",
      created_at: item.created_at,
      media: item.media_id
        ? {
            id: item.media_id,
            filename: item.filename,
            original_name: item.original_name,
            file_type: item.file_type,
            file_size: item.file_size,
            url: item.url,
            thumbnail_url: item.thumbnail_url,
            mime_type: item.mime_type,
            dimensions: item.dimensions,
            duration: item.media_duration,
            media_source: item.media_source,
            external_url: item.external_url,
            embed_settings: item.embed_settings,
            created_at: item.media_created_at,
          }
        : null,
    }))

    console.log(`✅ [PLAYLIST ITEMS API] Found ${formattedItems.length} items`)

    return NextResponse.json({
      success: true,
      items: formattedItems,
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

export async function POST(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("➕ [PLAYLIST ITEMS API] Starting POST request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser(request)
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

    const { media_id, duration = 10 } = body

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
      console.log("❌ [PLAYLIST ITEMS API] Media not found or not owned by user")
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Get next position
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM playlist_items
      WHERE playlist_id = ${playlistId}
    `

    const nextPosition = positionResult[0].next_position

    // Create playlist item
    const newItem = await sql`
      INSERT INTO playlist_items (
        playlist_id,
        media_id,
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
        'fade',
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    // Update playlist updated_at
    await sql`
      UPDATE playlists 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${playlistId}
    `

    console.log(`✅ [PLAYLIST ITEMS API] Created item: ${newItem[0].id}`)

    return NextResponse.json({
      success: true,
      item: newItem[0],
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS API] Error:", error)
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
