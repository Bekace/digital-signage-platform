import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("✏️ [PLAYLIST ITEM API] Starting PUT request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEM API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { playlistId, itemId } = params
    const body = await request.json()
    const { duration, transition_type } = body

    console.log("📝 [PLAYLIST ITEM API] Update body:", body)

    // Validate input
    if (duration !== undefined && (duration < 1 || duration > 3600)) {
      return NextResponse.json({ error: "Duration must be between 1 and 3600 seconds" }, { status: 400 })
    }

    const validTransitions = ["fade", "slide", "zoom", "flip", "none"]
    if (transition_type && !validTransitions.includes(transition_type)) {
      return NextResponse.json({ error: "Invalid transition type" }, { status: 400 })
    }

    // Check if item exists and belongs to the playlist
    const existingItem = await sql`
      SELECT id FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    if (existingItem.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Item not found")
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    // Build update query dynamically
    const updates = []
    const values = []

    if (duration !== undefined) {
      updates.push("duration = $" + (values.length + 1))
      values.push(duration)
    }

    if (transition_type !== undefined) {
      updates.push("transition_type = $" + (values.length + 1))
      values.push(transition_type)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Add WHERE clause parameters
    updates.push("updated_at = NOW()")
    const whereClause = `WHERE id = $${values.length + 1} AND playlist_id = $${values.length + 2}`
    values.push(itemId, playlistId)

    // Execute update
    const updateQuery = `
      UPDATE playlist_items 
      SET ${updates.join(", ")} 
      ${whereClause}
      RETURNING *
    `

    const result = await sql.unsafe(updateQuery, values)

    if (result.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Failed to update item")
      return NextResponse.json({ error: "Failed to update playlist item" }, { status: 500 })
    }

    console.log(`✅ [PLAYLIST ITEM API] Updated item ${itemId}`)

    return NextResponse.json({
      success: true,
      item: result[0],
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

export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("🗑️ [PLAYLIST ITEM API] Starting DELETE request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEM API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { playlistId, itemId } = params

    console.log("🗑️ [PLAYLIST ITEM API] Deleting playlist item:", { playlistId, itemId })

    // Check if item exists and belongs to the playlist
    const existingItem = await sql`
      SELECT id, position FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    if (existingItem.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Item not found")
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    const deletedPosition = existingItem[0].position

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

    console.log("🗑️ [PLAYLIST ITEM API] Successfully deleted playlist item and reordered remaining items")

    return NextResponse.json({
      success: true,
      message: "Playlist item deleted successfully",
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
