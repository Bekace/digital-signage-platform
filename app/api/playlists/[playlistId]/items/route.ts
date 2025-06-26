import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = params.playlistId

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items with media details
    const items = await sql`
      SELECT 
        pi.id,
        pi.position,
        pi.duration,
        pi.created_at,
        mf.id as media_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.mime_type,
        mf.url,
        mf.thumbnail_url
      FROM playlist_items pi
      JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching playlist items:", error)
    return NextResponse.json({ error: "Failed to fetch playlist items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mediaId, duration } = await request.json()
    const sql = getDb()
    const playlistId = params.playlistId

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media ownership
    const mediaFiles = await sql`
      SELECT id FROM media_files 
      WHERE id = ${mediaId} AND user_id = ${user.id}
    `

    if (mediaFiles.length === 0) {
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
    const result = await sql`
      INSERT INTO playlist_items (playlist_id, media_id, position, duration, created_at)
      VALUES (${playlistId}, ${mediaId}, ${nextPosition}, ${duration || 10}, NOW())
      RETURNING *
    `

    return NextResponse.json({ item: result[0] })
  } catch (error) {
    console.error("Error adding item to playlist:", error)
    return NextResponse.json({ error: "Failed to add item to playlist" }, { status: 500 })
  }
}
