import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { items } = await request.json()
    const playlistId = params.id

    // Update each item's order and duration
    for (const item of items) {
      await sql`
        UPDATE playlist_items 
        SET order_index = ${item.order_index}, 
            duration = ${item.duration},
            updated_at = NOW()
        WHERE id = ${item.id} 
        AND playlist_id = ${playlistId}
      `
    }

    // Update playlist's updated_at timestamp
    await sql`
      UPDATE playlists 
      SET updated_at = NOW() 
      WHERE id = ${playlistId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering playlist items:", error)
    return NextResponse.json({ error: "Failed to reorder playlist items" }, { status: 500 })
  }
}
