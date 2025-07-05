import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number.parseInt(params.id)

    const result = await query(
      `
      SELECT pi.*, m.name, m.type, m.url, m.file_size, m.duration
      FROM playlist_items pi
      LEFT JOIN media m ON pi.media_id = m.id
      WHERE pi.playlist_id = $1
      ORDER BY pi.order_index ASC
    `,
      [playlistId],
    )

    return NextResponse.json({ items: result.rows })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number.parseInt(params.id)
    const { media_id, duration = 10 } = await request.json()

    if (!media_id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // Get the next order index
    const orderResult = await query(
      "SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM playlist_items WHERE playlist_id = $1",
      [playlistId],
    )
    const nextOrder = orderResult.rows[0].next_order

    const result = await query(
      `
      INSERT INTO playlist_items (playlist_id, media_id, duration, order_index, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `,
      [playlistId, media_id, duration, nextOrder],
    )

    return NextResponse.json({ item: result.rows[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to add item to playlist" }, { status: 500 })
  }
}
