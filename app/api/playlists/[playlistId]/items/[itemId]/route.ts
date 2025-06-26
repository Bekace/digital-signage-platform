import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("🗑️ [DELETE ITEM API] Starting delete request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [DELETE ITEM API] No user authenticated")
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
      console.log("❌ [DELETE ITEM API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Delete the item
    const deletedItems = await sql`
      DELETE FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (deletedItems.length === 0) {
      console.log("❌ [DELETE ITEM API] Item not found")
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log(`✅ [DELETE ITEM API] Deleted item with ID: ${itemId}`)

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
    })
  } catch (error) {
    console.error("❌ [DELETE ITEM API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
