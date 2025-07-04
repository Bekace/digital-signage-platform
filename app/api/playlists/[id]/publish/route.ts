import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📢 [PUBLISH PLAYLIST] Starting publish process...")

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.id)
    if (isNaN(playlistId)) {
      return NextResponse.json({ success: false, error: "Invalid playlist ID" }, { status: 400 })
    }

    const sql = getDb()

    // Check if playlist exists and belongs to user
    const playlist = await sql`
      SELECT id, name, status FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    // Check if playlist has items (we'll implement this later when we have playlist_items table)
    // For now, we'll allow publishing empty playlists

    // Update playlist status to active
    await sql`
      UPDATE playlists 
      SET status = 'active', updated_at = NOW()
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    console.log("📢 [PUBLISH PLAYLIST] Playlist published successfully")

    return NextResponse.json({
      success: true,
      message: "Playlist published successfully",
    })
  } catch (error) {
    console.error("📢 [PUBLISH PLAYLIST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to publish playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
