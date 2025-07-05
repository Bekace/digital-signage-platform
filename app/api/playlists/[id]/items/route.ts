import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = params.id

    const items = await sql`
      SELECT 
        pi.*,
        m.name as media_name,
        m.type as media_type,
        m.size as media_size,
        m.url as media_url,
        m.thumbnail_url as media_thumbnail_url,
        m.duration as media_duration
      FROM playlist_items pi
      LEFT JOIN media m ON pi.media_id = m.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.order_index ASC
    `

    const formattedItems = items.map((item) => ({
      id: item.id,
      media_id: item.media_id,
      duration: item.duration,
      order_index: item.order_index,
      media: item.media_name
        ? {
            id: item.media_id,
            name: item.media_name,
            type: item.media_type,
            size: item.media_size,
            url: item.media_url,
            thumbnail_url: item.media_thumbnail_url,
            duration: item.media_duration,
          }
        : null,
    }))

    return NextResponse.json(formattedItems)
  } catch (error) {
    console.error("Error fetching playlist items:", error)
    return NextResponse.json({ error: "Failed to fetch playlist items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { media_id, duration = 10 } = await request.json()
    const playlistId = params.id

    // Get the next order index
    const [{ max_order }] = await sql`
      SELECT COALESCE(MAX(order_index), -1) + 1 as max_order
      FROM playlist_items
      WHERE playlist_id = ${playlistId}
    `

    // Insert the new item
    const [newItem] = await sql`
      INSERT INTO playlist_items (playlist_id, media_id, duration, order_index)
      VALUES (${playlistId}, ${media_id}, ${duration}, ${max_order})
      RETURNING *
    `

    return NextResponse.json(newItem)
  } catch (error) {
    console.error("Error adding playlist item:", error)
    return NextResponse.json({ error: "Failed to add playlist item" }, { status: 500 })
  }
}

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
    console.error("Error updating playlist items:", error)
    return NextResponse.json({ error: "Failed to update playlist items" }, { status: 500 })
  }
}
