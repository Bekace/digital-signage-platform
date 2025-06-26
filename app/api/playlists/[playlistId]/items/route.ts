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

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items with media details
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_id,
        pi.position,
        pi.duration,
        pi.created_at,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.metadata
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    console.log(`✅ [PLAYLIST ITEMS API] Found ${items.length} items for playlist ${playlistId}`)

    const formattedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_id,
      position: item.position,
      duration: item.duration,
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
            metadata: item.metadata,
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
  console.log("➕ [PLAYLIST ITEMS API] Starting POST request for playlist:", params.playlistId)

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
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media ownership
    const media = await sql`
      SELECT id FROM media_files WHERE id = ${media_id} AND user_id = ${user.id}
    `

    if (media.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Get next position
    const maxPosition = await sql`
      SELECT COALESCE(MAX(position), 0) as max_pos FROM playlist_items WHERE playlist_id = ${playlistId}
    `

    const nextPosition = (maxPosition[0]?.max_pos || 0) + 1

    // Add item to playlist
    const newItem = await sql`
      INSERT INTO playlist_items (playlist_id, media_id, position, duration)
      VALUES (${playlistId}, ${media_id}, ${nextPosition}, ${duration || 30})
      RETURNING *
    `

    console.log(`✅ [PLAYLIST ITEMS API] Added item to playlist at position ${nextPosition}`)

    // Get the full item with media details
    const fullItem = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_id,
        pi.position,
        pi.duration,
        pi.created_at,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.metadata
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.id = ${newItem[0].id}
    `

    const item = fullItem[0]

    return NextResponse.json(
      {
        success: true,
        item: {
          id: item.id,
          playlist_id: item.playlist_id,
          media_id: item.media_id,
          position: item.position,
          duration: item.duration,
          created_at: item.created_at,
          media: {
            id: item.media_id,
            filename: item.filename,
            original_name: item.original_name,
            file_type: item.file_type,
            file_size: item.file_size,
            url: item.url,
            thumbnail_url: item.thumbnail_url,
            metadata: item.metadata,
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
