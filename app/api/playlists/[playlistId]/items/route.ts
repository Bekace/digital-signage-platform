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

    // Get playlist items with complete media details - using media_file_id instead of media_id
    console.log("🔍 [PLAYLIST ITEMS API] Fetching playlist items with media details...")
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        -- Complete media file information
        mf.id as media_file_id,
        mf.filename as media_filename,
        mf.original_name as media_original_name,
        mf.file_type as media_file_type,
        mf.file_size as media_file_size,
        mf.url as media_url,
        mf.thumbnail_url as media_thumbnail_url,
        mf.mime_type as media_mime_type,
        mf.dimensions as media_dimensions,
        mf.duration as media_duration,
        mf.created_at as media_created_at
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    console.log(`✅ [PLAYLIST ITEMS API] Found ${items.length} items for playlist ${playlistId}`)
    console.log("📋 [PLAYLIST ITEMS API] Sample item data:", items[0])

    // Transform the results to include nested media object
    const transformedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_id,
      position: item.position,
      duration: item.duration,
      transition_type: item.transition_type,
      created_at: item.created_at,
      media: item.media_file_id
        ? {
            id: item.media_file_id,
            filename: item.media_filename,
            original_name: item.media_original_name,
            file_type: item.media_file_type,
            file_size: item.media_file_size,
            url: item.media_url,
            thumbnail_url: item.media_thumbnail_url,
            mime_type: item.media_mime_type,
            dimensions: item.media_dimensions,
            duration: item.media_duration,
            created_at: item.media_created_at,
          }
        : null,
    }))

    console.log(`📋 [PLAYLIST ITEMS API] Found ${transformedItems.length} items for playlist ${playlistId}`)

    return NextResponse.json({
      success: true,
      items: transformedItems,
      count: transformedItems.length,
    })
  } catch (error) {
    console.error("Error fetching playlist items:", error)
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
    const { media_id, duration = 30, transition_type = "fade" } = body

    if (!media_id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media ownership
    const mediaFile = await sql`
      SELECT id FROM media_files 
      WHERE id = ${media_id} AND user_id = ${user.id}
    `

    if (mediaFile.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Media file not found or not owned by user")
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get next position
    const maxPosition = await sql`
      SELECT COALESCE(MAX(position), 0) as max_pos 
      FROM playlist_items 
      WHERE playlist_id = ${playlistId}
    `

    const nextPosition = (maxPosition[0]?.max_pos || 0) + 1

    // Add item to playlist - using media_file_id instead of media_id
    const newItem = await sql`
      INSERT INTO playlist_items (playlist_id, media_id, position, duration, transition_type)
      VALUES (${playlistId}, ${media_id}, ${nextPosition}, ${duration}, ${transition_type})
      RETURNING *
    `

    console.log(`✅ [PLAYLIST ITEMS API] Added media ${media_id} to playlist ${playlistId} at position ${nextPosition}`)

    return NextResponse.json({
      success: true,
      item: newItem[0],
      message: "Media added to playlist successfully",
    })
  } catch (error) {
    console.error("Error adding item to playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to add item to playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
