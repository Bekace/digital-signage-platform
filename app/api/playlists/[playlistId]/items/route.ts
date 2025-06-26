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

    // Get playlist items with media details
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_id,
        pi.position,
        pi.duration,
        pi.created_at,
        m.filename,
        m.original_filename,
        m.file_type,
        m.file_size,
        m.url,
        m.thumbnail_url
      FROM playlist_items pi
      LEFT JOIN media m ON pi.media_id = m.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    console.log(`✅ [PLAYLIST ITEMS API] Found ${items.length} items`)

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        id: item.id,
        playlist_id: item.playlist_id,
        media_id: item.media_id,
        position: item.position,
        duration: item.duration || 30,
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
    const { media_id, duration = 30 } = body

    if (!media_id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
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

    // Verify media ownership
    const media = await sql`
      SELECT id FROM media 
      WHERE id = ${media_id} AND user_id = ${user.id}
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

    // Add item to playlist
    const newItem = await sql`
      INSERT INTO playlist_items (playlist_id, media_id, position, duration)
      VALUES (${playlistId}, ${media_id}, ${nextPosition}, ${duration})
      RETURNING *
    `

    console.log(`✅ [PLAYLIST ITEMS API] Added item with ID: ${newItem[0].id}`)

    return NextResponse.json(
      {
        success: true,
        item: newItem[0],
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
