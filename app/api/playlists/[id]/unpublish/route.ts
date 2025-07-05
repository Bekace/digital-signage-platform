import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number.parseInt(params.id)

    // Check if playlist exists
    const playlistResult = await query("SELECT * FROM playlists WHERE id = $1", [playlistId])

    if (playlistResult.rows.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update status to draft (unpublished)
    const result = await query("UPDATE playlists SET status = 'draft', updated_at = NOW() WHERE id = $1 RETURNING *", [
      playlistId,
    ])

    return NextResponse.json({ playlist: result.rows[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to unpublish playlist" }, { status: 500 })
  }
}
