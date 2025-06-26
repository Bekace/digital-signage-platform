import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// PUT - Reorder playlist items
export async function PUT(request: Request, { params }: { params: { playlistId: string } }) {
  console.log(`🎵 [PLAYLIST REORDER API] Reordering items for playlist: ${params.playlistId}`)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
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

    // Update positions for all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await sql`
        UPDATE playlist_items 
        SET position = ${i}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    console.log(`✅ [PLAYLIST REORDER API] Reordered ${items.length} items`)

    return NextResponse.json({
      success: true,
      message: "Items reordered successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST REORDER API] Error reordering items:", error)
    return NextResponse.json(
      {
        error: "Failed to reorder playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
