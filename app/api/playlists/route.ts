import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    // Get user's playlists
    const playlists = await sql`
      SELECT 
        id,
        name,
        description,
        is_active as "isActive",
        loop_playlist as "loopPlaylist",
        shuffle_items as "shuffleItems",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM playlists 
      WHERE user_id = ${decoded.userId} AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      playlists: playlists,
    })
  } catch (error) {
    console.error("Playlists fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    // Create new playlist
    const newPlaylist = await sql`
      INSERT INTO playlists (user_id, name, description, is_active, created_at, updated_at)
      VALUES (${decoded.userId}, ${name}, ${description || ""}, true, NOW(), NOW())
      RETURNING id, name, description, is_active as "isActive", created_at as "createdAt"
    `

    return NextResponse.json({
      success: true,
      playlist: newPlaylist[0],
    })
  } catch (error) {
    console.error("Playlist creation error:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
