import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const playlistId = Number.parseInt(params.playlistId)
    const { items } = await request.json()

    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items must be an array" }, { status: 400 })
    }

    // Update positions for all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await sql`
        UPDATE playlist_items 
        SET position = ${i + 1}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    // Return updated items
    const updatedItems = await sql`
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

    const transformedItems = updatedItems.map((item: any) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_file_id,
      position: item.position,
      duration: item.duration,
      transition_type: item.transition_type,
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
    console.error("Error reordering playlist items:", error)
    return NextResponse.json({ error: "Failed to reorder playlist items" }, { status: 500 })
  }
}
