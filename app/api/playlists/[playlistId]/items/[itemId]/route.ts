import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("🗑️ [PLAYLIST ITEM API] Starting DELETE request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get item position before deletion
    const item = await sql`
      SELECT position FROM playlist_items WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    if (item.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const deletedPosition = item[0].position

    // Delete the item
    await sql`
      DELETE FROM playlist_items WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    // Reorder remaining items
    await sql`
      UPDATE playlist_items 
      SET position = position - 1
      WHERE playlist_id = ${playlistId} AND position > ${deletedPosition}
    `

    console.log(`✅ [PLAYLIST ITEM API] Deleted item ${itemId} and reordered remaining items`)

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("📝 [PLAYLIST ITEM API] Starting PUT request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLIST ITEM API] Request body:", body)

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update item
    const updated = await sql`
      UPDATE playlist_items 
      SET duration = ${body.duration || 30}
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (updated.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST ITEM API] Updated item ${itemId}`)

    return NextResponse.json({
      success: true,
      item: updated[0],
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
