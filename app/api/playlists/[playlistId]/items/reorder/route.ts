import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🔄 [PLAYLIST ITEMS REORDER API] Starting PUT request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS REORDER API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("❌ [PLAYLIST ITEMS REORDER API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLIST ITEMS REORDER API] Request body:", body)

    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEMS REORDER API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update positions for each item
    console.log(`🔄 [PLAYLIST ITEMS REORDER API] Updating positions for ${items.length} items`)

    for (const item of items) {
      if (!item.id || typeof item.position !== "number") {
        console.log("❌ [PLAYLIST ITEMS REORDER API] Invalid item data:", item)
        continue
      }

      await sql`
        UPDATE playlist_items 
        SET position = ${item.position}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    console.log(`✅ [PLAYLIST ITEMS REORDER API] Successfully reordered items for playlist ${playlistId}`)

    return NextResponse.json({
      success: true,
      message: "Items reordered successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEMS REORDER API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to reorder playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
