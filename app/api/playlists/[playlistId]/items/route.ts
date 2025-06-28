import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const playlistId = Number.parseInt(params.playlistId)

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${decoded.userId}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items with media file details
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        mf.id as media_id,
        mf.filename,
        mf.original_filename,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.created_at as media_created_at
      FROM playlist_items pi
      JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    // Format the response to match expected structure
    const formattedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_file_id: item.media_file_id,
      position: item.position,
      duration: item.duration || 30,
      transition_type: item.transition_type || "fade",
      media: {
        id: item.media_id,
        filename: item.filename,
        original_filename: item.original_filename,
        file_type: item.file_type,
        file_size: item.file_size,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        created_at: item.media_created_at,
      },
      media_file: {
        id: item.media_id,
        filename: item.filename,
        original_filename: item.original_filename,
        file_type: item.file_type,
        file_size: item.file_size,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        created_at: item.media_created_at,
      },
    }))

    return NextResponse.json(formattedItems)
  } catch (error) {
    console.error("Error fetching playlist items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const playlistId = Number.parseInt(params.playlistId)
    const { media_file_id, duration = 30, transition_type = "fade" } = await request.json()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${decoded.userId}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media file ownership
    const mediaFile = await sql`
      SELECT id FROM media_files 
      WHERE id = ${media_file_id} AND user_id = ${decoded.userId}
    `

    if (mediaFile.length === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get the next position
    const maxPosition = await sql`
      SELECT COALESCE(MAX(position), 0) as max_pos 
      FROM playlist_items 
      WHERE playlist_id = ${playlistId}
    `

    const nextPosition = (maxPosition[0]?.max_pos || 0) + 1

    // Add item to playlist
    const newItem = await sql`
      INSERT INTO playlist_items (playlist_id, media_file_id, position, duration, transition_type)
      VALUES (${playlistId}, ${media_file_id}, ${nextPosition}, ${duration}, ${transition_type})
      RETURNING *
    `

    // Get the complete item with media details
    const itemWithMedia = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        mf.id as media_id,
        mf.filename,
        mf.original_filename,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.created_at as media_created_at
      FROM playlist_items pi
      JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.id = ${newItem[0].id}
    `

    const item = itemWithMedia[0]
    const formattedItem = {
      id: item.id,
      playlist_id: item.playlist_id,
      media_file_id: item.media_file_id,
      position: item.position,
      duration: item.duration,
      transition_type: item.transition_type,
      media: {
        id: item.media_id,
        filename: item.filename,
        original_filename: item.original_filename,
        file_type: item.file_type,
        file_size: item.file_size,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        created_at: item.media_created_at,
      },
      media_file: {
        id: item.media_id,
        filename: item.filename,
        original_filename: item.original_filename,
        file_type: item.file_type,
        file_size: item.file_size,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        created_at: item.media_created_at,
      },
    }

    return NextResponse.json(formattedItem, { status: 201 })
  } catch (error) {
    console.error("Error adding playlist item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
