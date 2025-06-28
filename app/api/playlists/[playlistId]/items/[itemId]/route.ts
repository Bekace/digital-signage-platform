import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { playlistId, itemId } = params
    const { duration, transition_type } = await request.json()

    const sql = getDb()

    console.log("✏️ [PLAYLIST ITEM UPDATE API] Updating item:", { itemId, duration, transition_type })

    // Verify playlist ownership and item exists
    const item = await sql`
      SELECT pi.id 
      FROM playlist_items pi
      JOIN playlists p ON pi.playlist_id = p.id
      WHERE pi.id = ${itemId} 
      AND pi.playlist_id = ${playlistId}
      AND p.user_id = ${user.id}
    `

    if (item.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    // Update the item
    const updatedItem = await sql`
      UPDATE playlist_items 
      SET 
        duration = ${duration || 30},
        transition_type = ${transition_type || "fade"}
      WHERE id = ${itemId}
      RETURNING *
    `

    console.log("✏️ [PLAYLIST ITEM UPDATE API] Updated item:", updatedItem[0])

    return NextResponse.json({
      success: true,
      item: updatedItem[0],
      message: "Playlist item updated successfully",
    })
  } catch (error) {
    console.error("Error updating playlist item:", error)
    return NextResponse.json({ error: "Failed to update playlist item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { playlistId, itemId } = params
    const sql = getDb()

    console.log("🗑️ [PLAYLIST ITEM DELETE API] Deleting item:", itemId)

    // Verify playlist ownership and item exists
    const item = await sql`
      SELECT pi.id, pi.position
      FROM playlist_items pi
      JOIN playlists p ON pi.playlist_id = p.id
      WHERE pi.id = ${itemId} 
      AND pi.playlist_id = ${playlistId}
      AND p.user_id = ${user.id}
    `

    if (item.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    const deletedPosition = item[0].position

    // Delete the item and reorder remaining items
    await sql.begin(async (sql) => {
      // Delete the item
      await sql`
        DELETE FROM playlist_items 
        WHERE id = ${itemId}
      `

      // Reorder remaining items
      await sql`
        UPDATE playlist_items 
        SET position = position - 1
        WHERE playlist_id = ${playlistId} 
        AND position > ${deletedPosition}
      `
    })

    console.log("🗑️ [PLAYLIST ITEM DELETE API] Item deleted and positions updated")

    return NextResponse.json({
      success: true,
      message: "Playlist item deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting playlist item:", error)
    return NextResponse.json({ error: "Failed to delete playlist item" }, { status: 500 })
  }
}
