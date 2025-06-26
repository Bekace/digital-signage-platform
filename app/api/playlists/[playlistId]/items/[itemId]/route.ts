import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("🗑️ [PLAYLIST ITEM API] Starting DELETE request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEM API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      console.log("❌ [PLAYLIST ITEM API] Invalid IDs:", params.playlistId, params.itemId)
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Delete the item
    const deletedItem = await sql`
      DELETE FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (deletedItem.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Item not found")
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST ITEM API] Deleted item: ${itemId}`)

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM API] Error:", error)
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
  console.log("✏️ [PLAYLIST ITEM API] Starting PUT request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEM API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      console.log("❌ [PLAYLIST ITEM API] Invalid IDs:", params.playlistId, params.itemId)
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLIST ITEM API] Request body:", body)

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update the item
    const updatedItem = await sql`
      UPDATE playlist_items 
      SET 
        duration = COALESCE(${body.duration}, duration),
        position = COALESCE(${body.position}, position)
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (updatedItem.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Item not found")
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST ITEM API] Updated item: ${itemId}`)

    return NextResponse.json({
      success: true,
      item: updatedItem[0],
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update playlist item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
