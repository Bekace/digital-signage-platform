import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = params.playlistId
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    const sql = getDb()

    console.log("🔄 [PLAYLIST REORDER API] Reordering items:", items.length)

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update positions in a transaction
    await sql.begin(async (sql) => {
      for (const item of items) {
        await sql`
          UPDATE playlist_items 
          SET position = ${item.position}
          WHERE id = ${item.id} AND playlist_id = ${playlistId}
        `
      }
    })

    console.log("🔄 [PLAYLIST REORDER API] Reorder complete")

    return NextResponse.json({
      success: true,
      message: "Playlist items reordered successfully",
    })
  } catch (error) {
    console.error("Error reordering playlist items:", error)
    return NextResponse.json({ error: "Failed to reorder playlist items" }, { status: 500 })
  }
}
