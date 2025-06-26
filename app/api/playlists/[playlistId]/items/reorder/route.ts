import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🔄 [PLAYLIST REORDER API] Starting PUT request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST REORDER API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      console.log("❌ [PLAYLIST REORDER API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update positions for all items
    for (const item of body.items) {
      await sql`
        UPDATE playlist_items 
        SET position = ${item.position}
        WHERE id = ${item.id} AND playlist_id = ${playlistId}
      `
    }

    console.log(`✅ [PLAYLIST REORDER API] Reordered ${body.items.length} items`)

    return NextResponse.json({
      success: true,
      message: "Items reordered successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST REORDER API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to reorder items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
