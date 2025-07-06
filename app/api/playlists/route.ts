import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [API] GET /api/playlists - Starting...")

    const user = await getCurrentUser()
    console.log("🎵 [API] Current user:", user ? { id: user.id, email: user.email } : null)

    if (!user) {
      console.log("🎵 [API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("🎵 [API] Fetching playlists for user:", user.id)

    // Get playlists with item counts
    const playlistsResult = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        p.updated_at,
        COALESCE(COUNT(pi.id), 0)::int as item_count
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `

    console.log("🎵 [API] Raw playlists result:", playlistsResult)

    // Transform the data to match frontend expectations
    const playlists = playlistsResult.map((playlist: any) => {
      const itemCount = Number.parseInt(playlist.item_count) || 0
      const estimatedDuration = itemCount * 10 // 10 seconds per item average

      return {
        id: playlist.id,
        name: playlist.name || "Untitled Playlist",
        description: playlist.description || "",
        items: itemCount,
        duration: `${Math.floor(estimatedDuration / 60)}:${(estimatedDuration % 60).toString().padStart(2, "0")}`,
        status: playlist.status || "draft",
        screens: [], // TODO: Get actual screen assignments
        lastModified: new Date(playlist.updated_at).toLocaleDateString(),
      }
    })

    console.log("🎵 [API] Transformed playlists:", playlists)

    return NextResponse.json({
      success: true,
      playlists: playlists,
    })
  } catch (error) {
    console.error("🎵 [API] Error fetching playlists:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO playlists (user_id, name, description, status, created_at, updated_at)
      VALUES (${user.id}, ${name}, ${description || ""}, 'draft', NOW(), NOW())
      RETURNING id, name, description, status, created_at, updated_at
    `

    const newPlaylist = result[0]

    return NextResponse.json({
      success: true,
      playlist: {
        id: newPlaylist.id,
        name: newPlaylist.name,
        description: newPlaylist.description,
        items: 0,
        duration: "0:00",
        status: newPlaylist.status,
        screens: [],
        lastModified: new Date(newPlaylist.updated_at).toLocaleDateString(),
      },
    })
  } catch (error) {
    console.error("🎵 [API] Error creating playlist:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
