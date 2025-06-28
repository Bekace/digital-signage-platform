import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("✏️ [ITEM UPDATE API] Unauthorized - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { playlistId, itemId } = params
    const { duration, transition_type } = await request.json()

    console.log("✏️ [ITEM UPDATE API] Updating item:", { playlistId, itemId, duration, transition_type })
    console.log("✏️ [ITEM UPDATE API] User ID:", user.id)

    const sql = getDb()

    // Verify playlist ownership and item exists
    console.log("✏️ [ITEM UPDATE API] Verifying item ownership...")
    const item = await sql`
      SELECT pi.id 
      FROM playlist_items pi
      JOIN playlists p ON pi.playlist_id = p.id
      WHERE pi.id = ${itemId} 
      AND pi.playlist_id = ${playlistId}
      AND p.user_id = ${user.id}
    `

    if (item.length === 0) {
      console.log("✏️ [ITEM UPDATE API] Item not found or unauthorized")
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    console.log("✏️ [ITEM UPDATE API] Item verified, updating...")

    // Update the item
    const updatedItem = await sql`
      UPDATE playlist_items 
      SET 
        duration = ${duration || 30},
        transition_type = ${transition_type || "fade"}
      WHERE id = ${itemId}
      RETURNING *
    `

    console.log("✏️ [ITEM UPDATE API] Item updated successfully:", updatedItem[0])

    return NextResponse.json({
      success: true,
      item: updatedItem[0],
      message: "Playlist item updated successfully",
    })
  } catch (error) {
    console.error("✏️ [ITEM UPDATE API] Error updating playlist item:", error)
    return NextResponse.json(
      {
        error: "Failed to update playlist item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("🗑️ [ITEM DELETE API] Unauthorized - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { playlistId, itemId } = params

    console.log("🗑️ [ITEM DELETE API] Deleting item:", { playlistId, itemId })
    console.log("🗑️ [ITEM DELETE API] User ID:", user.id)

    const sql = getDb()

    // Verify playlist ownership and item exists
    console.log("🗑️ [ITEM DELETE API] Verifying item ownership...")
    const item = await sql`
      SELECT pi.id, pi.position
      FROM playlist_items pi
      JOIN playlists p ON pi.playlist_id = p.id
      WHERE pi.id = ${itemId} 
      AND pi.playlist_id = ${playlistId}
      AND p.user_id = ${user.id}
    `

    if (item.length === 0) {
      console.log("🗑️ [ITEM DELETE API] Item not found or unauthorized")
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    const deletedPosition = item[0].position
    console.log("🗑️ [ITEM DELETE API] Item found at position:", deletedPosition)

    // Delete the item first
    console.log("🗑️ [ITEM DELETE API] Deleting item from database...")
    try {
      await sql`
        DELETE FROM playlist_items 
        WHERE id = ${itemId}
      `
      console.log("🗑️ [ITEM DELETE API] Item deleted successfully")
    } catch (deleteError) {
      console.error("🗑️ [ITEM DELETE API] Failed to delete item:", deleteError)
      throw deleteError
    }

    // Then reorder remaining items
    console.log("🗑️ [ITEM DELETE API] Reordering remaining items...")
    try {
      await sql`
        UPDATE playlist_items 
        SET position = position - 1
        WHERE playlist_id = ${playlistId} 
        AND position > ${deletedPosition}
      `
      console.log("🗑️ [ITEM DELETE API] Positions updated successfully")
    } catch (reorderError) {
      console.error("🗑️ [ITEM DELETE API] Failed to reorder items:", reorderError)
      // Don't throw here - deletion was successful
    }

    console.log("🗑️ [ITEM DELETE API] Item deleted and positions updated successfully")

    return NextResponse.json({
      success: true,
      message: "Playlist item deleted successfully",
    })
  } catch (error) {
    console.error("🗑️ [ITEM DELETE API] Error deleting playlist item:", error)
    return NextResponse.json(
      {
        error: "Failed to delete playlist item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
