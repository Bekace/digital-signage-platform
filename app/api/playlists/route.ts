import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    // Get user's playlists with item counts
    const playlists = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.is_default as "isDefault",
        p.loop_playlist as "loopPlaylist",
        p.shuffle_items as "shuffleItems",
        p.transition_type as "transitionType",
        p.transition_duration as "transitionDuration",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        COUNT(pi.id) as "itemCount"
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${decoded.userId} AND p.deleted_at IS NULL
      GROUP BY p.id, p.name, p.description, p.is_default, p.loop_playlist, p.shuffle_items, p.transition_type, p.transition_duration, p.created_at, p.updated_at
      ORDER BY p.created_at DESC
    `

    return NextResponse.json({
      success: true,
      playlists: playlists.map((playlist) => ({
        ...playlist,
        itemCount: Number.parseInt(playlist.itemCount),
      })),
    })
  } catch (error) {
    console.error("Error fetching playlists:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    const body = await request.json()
    const {
      name,
      description,
      loopPlaylist = true,
      shuffleItems = false,
      transitionType = "fade",
      transitionDuration = 1000,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    // Create new playlist
    const result = await sql`
      INSERT INTO playlists (
        user_id, 
        name, 
        description, 
        loop_playlist, 
        shuffle_items, 
        transition_type, 
        transition_duration,
        created_at,
        updated_at
      )
      VALUES (
        ${decoded.userId}, 
        ${name}, 
        ${description || ""}, 
        ${loopPlaylist}, 
        ${shuffleItems}, 
        ${transitionType}, 
        ${transitionDuration},
        NOW(),
        NOW()
      )
      RETURNING id, name, description, loop_playlist as "loopPlaylist", shuffle_items as "shuffleItems", transition_type as "transitionType", transition_duration as "transitionDuration", created_at as "createdAt"
    `

    return NextResponse.json({
      success: true,
      playlist: result[0],
    })
  } catch (error) {
    console.error("Error creating playlist:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
