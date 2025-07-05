import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.id)
    const sql = getDb()

    // Get original playlist
    const original = await sql`
      SELECT name, description FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (original.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    // Create duplicate
    const result = await sql`
      INSERT INTO playlists (user_id, name, description, status, created_at, updated_at)
      VALUES (${user.id}, ${original[0].name + " (Copy)"}, ${original[0].description}, 'draft', NOW(), NOW())
      RETURNING id, name, description, status, created_at, updated_at
    `

    return NextResponse.json({
      success: true,
      playlist: result[0],
    })
  } catch (error) {
    console.error("Duplicate playlist error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to duplicate playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
