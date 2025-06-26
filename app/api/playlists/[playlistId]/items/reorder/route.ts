import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items } = await request.json()
    const sql = getDb()
    const playlistId = params.playlistId

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update positions for all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await sql`
        UPDATE playlist_items 
        SET position = ${i + 1}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering playlist items:", error)
    return NextResponse.json({ error: "Failed to reorder playlist items" }, { status: 500 })
  }
}
