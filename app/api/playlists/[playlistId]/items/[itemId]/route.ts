import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const { playlistId, itemId } = params
    const body = await request.json()
    const { duration, transition_type } = body

    console.log("✏️ [PLAYLIST ITEM API] Updating item:", { playlistId, itemId, duration, transition_type })

    // Validate input
    if (duration !== undefined && (duration < 1 || duration > 3600)) {
      return NextResponse.json({ error: "Duration must be between 1 and 3600 seconds" }, { status: 400 })
    }

    // Build update query dynamically
    const updates = []
    const values = []

    if (duration !== undefined) {
      updates.push(`duration = $${updates.length + 1}`)
      values.push(duration)
    }

    if (transition_type !== undefined) {
      updates.push(`transition_type = $${updates.length + 1}`)
      values.push(transition_type)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Update the item
    const result = await sql`
      UPDATE playlist_items 
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    console.log("✏️ [PLAYLIST ITEM API] Updated item:", result[0])

    return NextResponse.json({
      success: true,
      item: result[0],
    })
  } catch (error) {
    console.error("Error updating playlist item:", error)
    return NextResponse.json({ error: "Failed to update playlist item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const { playlistId, itemId } = params

    console.log("🗑️ [PLAYLIST ITEM API] Deleting item:", { playlistId, itemId })

    // Get the item's position before deleting
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

    // Reorder remaining items to fill the gap
    await sql`
      UPDATE playlist_items 
      SET position = position - 1
      WHERE playlist_id = ${playlistId} AND position > ${deletedPosition}
    `

    console.log("🗑️ [PLAYLIST ITEM API] Deleted item and reordered remaining items")

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting playlist item:", error)
    return NextResponse.json({ error: "Failed to delete playlist item" }, { status: 500 })
  }
}
