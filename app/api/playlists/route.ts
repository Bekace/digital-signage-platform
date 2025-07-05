import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        p.*,
        COUNT(pi.id) as item_count
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `)

    return NextResponse.json({ playlists: result.rows })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // For now, we'll use a default user_id of 1
    // In a real app, this would come from the authenticated user
    const result = await query(
      `
      INSERT INTO playlists (name, description, status, user_id, created_at, updated_at)
      VALUES ($1, $2, 'draft', 1, NOW(), NOW())
      RETURNING *
    `,
      [name.trim(), description?.trim() || ""],
    )

    return NextResponse.json({ playlist: result.rows[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
