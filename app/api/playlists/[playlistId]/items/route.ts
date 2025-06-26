import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch playlist items
export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log(`🎵 [PLAYLIST ITEMS API] Getting items for playlist: ${params.playlistId}`)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items with media details
    const items = await sql`
      SELECT 
        pi.*,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.mime_type,
        mf.duration as media_duration,
        mf.url,
        mf.thumbnail_url
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    const formattedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_file_id: item.media_file_id,
      position: item.position,
      duration: item.duration,
      transition_type: item.transition_type || "fade",
      media: {
        id: item.media_file_id,
        filename: item.filename,
        original_name: item.original_name,
        file_type: item.file_type,
        file_size: item.file_size,
        mime_type: item.mime_type,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        duration: item.media_duration,
      },
    }))

    console.log(`✅ [PLAYLIST ITEMS API] Found ${formattedItems.length} items`)

    return NextResponse.json({
      success: true,
      items: formattedItems,
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS API] Error fetching items:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Add item to playlist
export async function POST(request: Request, { params }: { params: { playlistId: string } }) {
  console.log(`🎵 [PLAYLIST ITEMS API] Adding item to playlist: ${params.playlistId}`)

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
    const { media_file_id, duration, transition_type } = body

    if (!media_file_id) {
      return NextResponse.json({ error: "Media file ID is required" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media file ownership
    const mediaFile = await sql`
      SELECT * FROM media_files 
      WHERE id = ${media_file_id} AND user_id = ${user.id}
    `

    if (mediaFile.length === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get next position
    const maxPosition = await sql`
      SELECT COALESCE(MAX(position), -1) as max_pos 
      FROM playlist_items 
      WHERE playlist_id = ${playlistId}
    `

    const nextPosition = (maxPosition[0]?.max_pos || -1) + 1

    // Add item to playlist
    const newItem = await sql`
      INSERT INTO playlist_items (
        playlist_id, 
        media_file_id, 
        position, 
        duration, 
        transition_type
      )
      VALUES (
        ${playlistId}, 
        ${media_file_id}, 
        ${nextPosition}, 
        ${duration || mediaFile[0].duration || 30}, 
        ${transition_type || "fade"}
      )
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
        mf.duration as media_duration,
        mf.url,
        mf.thumbnail_url
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.id = ${newItem[0].id}
    `

    const formattedItem = {
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
        duration: itemWithMedia[0].media_duration,
      },
    }

    console.log(`✅ [PLAYLIST ITEMS API] Added item: ${formattedItem.media.original_name}`)

    return NextResponse.json({
      success: true,
      item: formattedItem,
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS API] Error adding item:", error)
    return NextResponse.json(
      {
        error: "Failed to add item to playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
