import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log("🎵 [PLAYLIST ITEMS API] Starting GET request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("❌ [PLAYLIST ITEMS API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    console.log("📋 [API] Fetching playlist items for playlist:", playlistId)

    // Get playlist items with media file details
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id as media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        mf.id as media_file_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.mime_type,
        mf.dimensions,
        mf.duration as media_duration,
        mf.created_at as media_created_at
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC, pi.created_at ASC
    `

    console.log("📋 [API] Found playlist items:", items.length)

    // Transform the data to include media file info
    const transformedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_id,
      position: item.position,
      duration: item.duration || 30,
      transition_type: item.transition_type || "fade",
      created_at: item.created_at,
      media: item.media_file_id
        ? {
            id: item.media_file_id,
            filename: item.filename,
            original_name: item.original_name,
            file_type: item.file_type,
            file_size: item.file_size,
            url: item.url,
            thumbnail_url: item.thumbnail_url,
            mime_type: item.mime_type,
            dimensions: item.dimensions,
            duration: item.media_duration,
            created_at: item.media_created_at,
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      items: transformedItems,
    })
  } catch (error) {
    console.error("Error fetching playlist items:", error)
    return NextResponse.json({ error: "Failed to fetch playlist items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log("➕ [PLAYLIST ITEMS API] Starting POST request for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEMS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("❌ [PLAYLIST ITEMS API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const body = await request.json()
    const { media_id, duration = 30, transition_type = "fade" } = body

    console.log("➕ [API] Adding item to playlist:", { playlistId, media_id, duration, transition_type })

    // Validate required fields
    if (!media_id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // Check if media file exists
    const mediaFile = await sql`
      SELECT id FROM media_files WHERE id = ${media_id}
    `

    if (mediaFile.length === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get the next position
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM playlist_items
      WHERE playlist_id = ${playlistId}
    `
    const nextPosition = positionResult[0]?.next_position || 1

    // Insert the new playlist item
    const newItem = await sql`
      INSERT INTO playlist_items (
        playlist_id, 
        media_file_id, 
        position, 
        duration, 
        transition_type
      )
      VALUES (${playlistId}, ${media_id}, ${nextPosition}, ${duration}, ${transition_type})
      RETURNING *
    `

    console.log("➕ [API] Created playlist item:", newItem[0])

    return NextResponse.json({
      success: true,
      item: newItem[0],
    })
  } catch (error) {
    console.error("Error adding item to playlist:", error)
    return NextResponse.json({ error: "Failed to add item to playlist" }, { status: 500 })
  }
}
