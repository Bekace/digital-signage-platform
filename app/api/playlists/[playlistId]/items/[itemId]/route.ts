import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    const sql = getDb()

    // Verify the playlist belongs to the user
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get the item to delete (for position reordering)
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

    // Reorder remaining items (shift positions down)
    await sql`
      UPDATE playlist_items 
      SET position = position - 1
      WHERE playlist_id = ${playlistId} AND position > ${deletedPosition}
    `

    console.log(`🗑️ [PLAYLIST ITEMS API] Deleted item ${itemId} from playlist ${playlistId}`)

    return NextResponse.json({
      success: true,
      message: "Playlist item deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting playlist item:", error)
    return NextResponse.json(
      {
        error: "Failed to delete playlist item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    const body = await request.json()
    const { duration, transition_type } = body

    const sql = getDb()

    // Verify the playlist belongs to the user
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update the item
    const updatedItem = await sql`
      UPDATE playlist_items 
      SET 
        duration = COALESCE(${duration}, duration),
        transition_type = COALESCE(${transition_type}, transition_type),
        updated_at = NOW()
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (updatedItem.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    console.log(`✏️ [PLAYLIST ITEMS API] Updated item ${itemId} in playlist ${playlistId}`)

    return NextResponse.json({
      success: true,
      item: updatedItem[0],
      message: "Playlist item updated successfully",
    })
  } catch (error) {
    console.error("Error updating playlist item:", error)
    return NextResponse.json(
      {
        error: "Failed to update playlist item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
