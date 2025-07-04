import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📤 [UNPUBLISH PLAYLIST] Starting unpublish process...")

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

    // Update playlist status to draft
    await sql`
      UPDATE playlists 
      SET status = 'draft', updated_at = NOW()
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    console.log("📤 [UNPUBLISH PLAYLIST] Playlist unpublished successfully")

    return NextResponse.json({
      success: true,
      message: "Playlist unpublished successfully",
    })
  } catch (error) {
    console.error("📤 [UNPUBLISH PLAYLIST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to unpublish playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
