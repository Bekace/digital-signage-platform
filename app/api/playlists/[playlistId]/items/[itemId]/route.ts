import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)
    const { duration, transition_type } = await request.json()

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    // Update the playlist item
    const updatedItem = await sql`
      UPDATE playlist_items 
      SET 
        duration = ${duration || 30},
        transition_type = ${transition_type || "fade"}
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (updatedItem.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

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
      WHERE pi.id = ${itemId}
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

    return NextResponse.json(transformedItem)
  } catch (error) {
    console.error("Error updating playlist item:", error)
    return NextResponse.json({ error: "Failed to update playlist item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    // Get the item position before deleting
    const itemToDelete = await sql`
      SELECT position FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    if (itemToDelete.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    const deletedPosition = itemToDelete[0].position

    // Delete the item
    await sql`
      DELETE FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    // Reorder remaining items
    await sql`
      UPDATE playlist_items 
      SET position = position - 1
      WHERE playlist_id = ${playlistId} AND position > ${deletedPosition}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playlist item:", error)
    return NextResponse.json({ error: "Failed to delete playlist item" }, { status: 500 })
  }
}
