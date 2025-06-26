import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch all items in a playlist
export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🎵 [PLAYLIST ITEMS API] Starting GET request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items with media details - using correct table names
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.mime_type,
        mf.url,
        mf.thumbnail_url
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    console.log(`✅ [PLAYLIST ITEMS API] Found ${items.length} items`)

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        id: item.id,
        playlist_id: item.playlist_id,
        media_file_id: item.media_file_id,
        position: item.position,
        duration: item.duration || 30,
        transition_type: item.transition_type || "fade",
        created_at: item.created_at,
        media: {
          id: item.media_file_id,
          filename: item.filename,
          original_name: item.original_name,
          file_type: item.file_type,
          file_size: item.file_size,
          mime_type: item.mime_type,
          url: item.url,
          thumbnail_url: item.thumbnail_url,
        },
      })),
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

// POST - Add a media item to playlist
export async function POST(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🎵 [PLAYLIST ITEMS API] Starting POST request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { media_file_id, duration = 30, transition_type = "fade" } = body

    if (!media_file_id) {
      return NextResponse.json({ error: "Media file ID is required" }, { status: 400 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media file ownership
    const mediaFiles = await sql`
      SELECT id FROM media_files 
      WHERE id = ${media_file_id} AND user_id = ${user.id}
    `

    if (mediaFiles.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Media file not found or not owned by user")
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get next position
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM playlist_items 
      WHERE playlist_id = ${playlistId}
    `
    const nextPosition = positionResult[0].next_position

    // Add item to playlist
    const newItem = await sql`
      INSERT INTO playlist_items (playlist_id, media_file_id, position, duration, transition_type)
      VALUES (${playlistId}, ${media_file_id}, ${nextPosition}, ${duration}, ${transition_type})
      RETURNING *
    `

    // Get the complete item with media details
    const itemWithMedia = await sql`
      SELECT 
        pi.*,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.mime_type,
        mf.url,
        mf.thumbnail_url
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.id = ${newItem[0].id}
    `

    console.log(`✅ [PLAYLIST ITEMS API] Added item with ID: ${newItem[0].id}`)

    return NextResponse.json(
      {
        success: true,
        item: {
          id: itemWithMedia[0].id,
          playlist_id: itemWithMedia[0].playlist_id,
          media_file_id: itemWithMedia[0].media_file_id,
          position: itemWithMedia[0].position,
          duration: itemWithMedia[0].duration,
          transition_type: itemWithMedia[0].transition_type,
          media: {
            id: itemWithMedia[0].media_file_id,
            filename: itemWithMedia[0].filename,
            original_name: itemWithMedia[0].original_name,
            file_type: itemWithMedia[0].file_type,
            file_size: itemWithMedia[0].file_size,
            mime_type: itemWithMedia[0].mime_type,
            url: itemWithMedia[0].url,
            thumbnail_url: itemWithMedia[0].thumbnail_url,
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
