import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("🗑️ [PLAYLIST ITEM DELETE API] Starting DELETE request:", params.playlistId, params.itemId)

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

    // Delete the item
    const deletedItems = await sql`
      DELETE FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (deletedItems.length === 0) {
      console.log("❌ [PLAYLIST ITEM DELETE API] Item not found")
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST ITEM DELETE API] Deleted item: ${itemId}`)

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM DELETE API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
