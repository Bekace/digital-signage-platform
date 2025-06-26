import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// DELETE - Remove item from playlist
export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log(`🎵 [PLAYLIST ITEM DELETE API] Removing item ${params.itemId} from playlist ${params.playlistId}`)

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

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get item position before deletion
    const item = await sql`
      SELECT position FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    if (item.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const deletedPosition = item[0].position

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

    console.log(`✅ [PLAYLIST ITEM DELETE API] Removed item and reordered remaining items`)

    return NextResponse.json({
      success: true,
      message: "Item removed successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM DELETE API] Error removing item:", error)
    return NextResponse.json(
      {
        error: "Failed to remove item from playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
