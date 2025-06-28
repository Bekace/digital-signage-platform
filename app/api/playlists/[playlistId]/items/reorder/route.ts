import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const playlistId = params.playlistId
    const body = await request.json()
    const { items } = body

    console.log("🔄 [API] Reordering playlist items:", { playlistId, itemCount: items?.length })

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    // Validate that all items belong to this playlist
    const playlistItems = await sql`
      SELECT id FROM playlist_items WHERE playlist_id = ${playlistId}
    `

    const validItemIds = new Set(playlistItems.map((item) => item.id))
    const requestedItemIds = items.map((item) => item.id)

    for (const itemId of requestedItemIds) {
      if (!validItemIds.has(itemId)) {
        return NextResponse.json({ error: `Item ${itemId} does not belong to this playlist` }, { status: 400 })
      }
    }

    // Update positions in a transaction-like manner
    // First, set all positions to negative values to avoid conflicts
    for (const item of items) {
      await sql`
        UPDATE playlist_items 
        SET position = ${-item.position}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    // Then set the correct positive positions
    for (const item of items) {
      await sql`
        UPDATE playlist_items 
        SET position = ${item.position}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    console.log("🔄 [API] Successfully reordered playlist items")

    return NextResponse.json({
      success: true,
      message: "Playlist items reordered successfully",
    })
  } catch (error) {
    console.error("Error reordering playlist items:", error)
    return NextResponse.json({ error: "Failed to reorder playlist items" }, { status: 500 })
  }
}
