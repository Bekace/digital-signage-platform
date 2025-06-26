import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// DELETE - Remove an item from playlist
export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("🎵 [PLAYLIST ITEM DELETE API] Starting DELETE request:", params)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEM DELETE API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      console.log("❌ [PLAYLIST ITEM DELETE API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get item position before deletion
    const items = await sql`
      SELECT position FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    if (items.length === 0) {
      console.log("❌ [PLAYLIST ITEM DELETE API] Item not found")
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const deletedPosition = items[0].position

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

    console.log(`✅ [PLAYLIST ITEM DELETE API] Deleted item ${itemId}`)

    return NextResponse.json({
      success: true,
      message: "Item removed from playlist",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM DELETE API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to remove item from playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
