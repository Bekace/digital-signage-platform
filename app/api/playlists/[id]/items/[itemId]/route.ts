import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const playlistId = params.id
    const itemId = params.itemId

    // Delete the item
    await sql`
      DELETE FROM playlist_items 
      WHERE id = ${itemId} 
      AND playlist_id = ${playlistId}
    `

    // Reorder remaining items
    await sql`
      UPDATE playlist_items 
      SET order_index = order_index - 1
      WHERE playlist_id = ${playlistId}
      AND order_index > (
        SELECT COALESCE(MAX(order_index), 0)
        FROM playlist_items 
        WHERE playlist_id = ${playlistId}
      )
    `

    // Update playlist's updated_at timestamp
    await sql`
      UPDATE playlists 
      SET updated_at = NOW() 
      WHERE id = ${playlistId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playlist item:", error)
    return NextResponse.json({ error: "Failed to delete playlist item" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const { duration } = await request.json()
    const playlistId = params.id
    const itemId = params.itemId

    // Update the item
    const [updatedItem] = await sql`
      UPDATE playlist_items 
      SET duration = ${duration}, updated_at = NOW()
      WHERE id = ${itemId} 
      AND playlist_id = ${playlistId}
      RETURNING *
    `

    // Update playlist's updated_at timestamp
    await sql`
      UPDATE playlists 
      SET updated_at = NOW() 
      WHERE id = ${playlistId}
    `

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error updating playlist item:", error)
    return NextResponse.json({ error: "Failed to update playlist item" }, { status: 500 })
  }
}
