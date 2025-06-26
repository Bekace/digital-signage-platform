import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🎵 [PLAYLIST ITEMS API] Starting GET request for playlist items:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    // Verify playlist ownership first
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
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
        m.id as media_id,
        m.filename,
        m.original_filename,
        m.file_type,
        m.file_size,
        m.url,
        m.thumbnail_url
      FROM playlist_items pi
      JOIN media_files m ON pi.media_id = m.id
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
      media: {
        id: item.media_id,
        filename: item.filename,
        original_filename: item.original_filename,
        file_type: item.file_type,
        file_size: item.file_size,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
      },
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

    const body = await request.json()
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

    // Verify media exists and belongs to user
    const mediaFiles = await sql`
      SELECT id FROM media_files 
      WHERE id = ${body.media_id} AND user_id = ${user.id}
    `

    if (mediaFiles.length === 0) {
      console.log("❌ [PLAYLIST ITEMS API] Media file not found or not owned by user")
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get the next position
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM playlist_items 
      WHERE playlist_id = ${playlistId}
    `
    const nextPosition = positionResult[0].next_position

    // Add item to playlist
    const newItems = await sql`
      INSERT INTO playlist_items (playlist_id, media_id, position, duration)
      VALUES (${playlistId}, ${body.media_id}, ${nextPosition}, ${body.duration || 30})
      RETURNING *
    `

    console.log(`✅ [PLAYLIST ITEMS API] Added item to playlist: ${newItems[0].id}`)

    return NextResponse.json({
      success: true,
      item: newItems[0],
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
