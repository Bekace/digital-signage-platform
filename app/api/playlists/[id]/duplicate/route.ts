import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number.parseInt(params.id)

    // Get the original playlist
    const originalResult = await query("SELECT * FROM playlists WHERE id = $1", [playlistId])

    if (originalResult.rows.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const original = originalResult.rows[0]

    // Create the duplicate
    const duplicateResult = await query(
      `
      INSERT INTO playlists (name, description, status, user_id, created_at, updated_at)
      VALUES ($1, $2, 'draft', $3, NOW(), NOW())
      RETURNING *
    `,
      [`${original.name} (Copy)`, original.description, original.user_id],
    )

    const duplicate = duplicateResult.rows[0]

    // Copy playlist items
    await query(
      `
      INSERT INTO playlist_items (playlist_id, media_id, duration, order_index, created_at)
      SELECT $1, media_id, duration, order_index, NOW()
      FROM playlist_items
      WHERE playlist_id = $2
    `,
      [duplicate.id, playlistId],
    )

    return NextResponse.json({ playlist: duplicate })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to duplicate playlist" }, { status: 500 })
  }
}
