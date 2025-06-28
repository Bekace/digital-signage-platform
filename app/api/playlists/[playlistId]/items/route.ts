import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const playlistId = Number.parseInt(params.playlistId)

    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
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
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.mime_type,
        mf.dimensions,
        mf.duration as media_duration
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    // Transform the data to match the expected format
    const transformedItems = items.map((item: any) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_file_id,
      position: item.position,
      duration: item.duration || 30,
      transition_type: item.transition_type || "fade",
      media_file: {
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
      },
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error("Error fetching playlist items:", error)
    return NextResponse.json({ error: "Failed to fetch playlist items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const playlistId = Number.parseInt(params.playlistId)
    const { media_file_id, duration = 30, transition_type = "fade" } = await request.json()

    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    if (!media_file_id) {
      return NextResponse.json({ error: "Media file ID is required" }, { status: 400 })
    }

    // Get the next position
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM playlist_items
      WHERE playlist_id = ${playlistId}
    `
    const nextPosition = positionResult[0]?.next_position || 1

    // Insert the new playlist item
    const newItem = await sql`
      INSERT INTO playlist_items (playlist_id, media_file_id, position, duration, transition_type)
      VALUES (${playlistId}, ${media_file_id}, ${nextPosition}, ${duration}, ${transition_type})
      RETURNING *
    `

    // Get the full item with media details
    const fullItem = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        mf.id as media_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.mime_type,
        mf.dimensions,
        mf.duration as media_duration
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.id = ${newItem[0].id}
    `

    const transformedItem = {
      id: fullItem[0].id,
      playlist_id: fullItem[0].playlist_id,
      media_id: fullItem[0].media_file_id,
      position: fullItem[0].position,
      duration: fullItem[0].duration,
      transition_type: fullItem[0].transition_type,
      media_file: {
        id: fullItem[0].media_id,
        filename: fullItem[0].filename,
        original_name: fullItem[0].original_name,
        file_type: fullItem[0].file_type,
        file_size: fullItem[0].file_size,
        url: fullItem[0].url,
        thumbnail_url: fullItem[0].thumbnail_url,
        mime_type: fullItem[0].mime_type,
        dimensions: fullItem[0].dimensions,
        duration: fullItem[0].media_duration,
      },
    }

    return NextResponse.json(transformedItem, { status: 201 })
  } catch (error) {
    console.error("Error adding playlist item:", error)
    return NextResponse.json({ error: "Failed to add playlist item" }, { status: 500 })
  }
}
