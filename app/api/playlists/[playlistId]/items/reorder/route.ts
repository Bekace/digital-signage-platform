import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const playlistId = params.playlistId
    const body = await request.json()
    const { items } = body

    console.log("🔄 [PLAYLIST REORDER API] Reordering items for playlist:", playlistId)
    console.log("🔄 [PLAYLIST REORDER API] New order:", items)

    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    // Update positions in a transaction-like manner
    for (const item of items) {
      if (!item.id || !item.position) {
        continue
      }

      await sql`
        UPDATE playlist_items 
        SET position = ${item.position}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    console.log("🔄 [PLAYLIST REORDER API] Successfully reordered items")

    return NextResponse.json({
      success: true,
      message: "Items reordered successfully",
    })
  } catch (error) {
    console.error("Error reordering playlist items:", error)
    return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 })
  }
}
