import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = authHeader.substring(7)
    const { deviceId } = params

    // Verify device and API key
    const deviceResult = await sql`
      SELECT id, name, assigned_playlist_id, playlist_status
      FROM devices 
      WHERE id = ${deviceId} AND api_key = ${apiKey}
    `

    if (deviceResult.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]

    if (!device.assigned_playlist_id) {
      return NextResponse.json({
        playlist: null,
        message: "No playlist assigned",
      })
    }

    // Get playlist with items and media
    const playlistResult = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.loop_playlist,
        p.shuffle_items,
        p.transition_type,
        p.transition_duration
      FROM playlists p
      WHERE p.id = ${device.assigned_playlist_id}
    `

    if (playlistResult.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlistResult[0]

    // Get playlist items with media
    const itemsResult = await sql`
      SELECT 
        pi.id,
        pi.media_id,
        pi.duration,
        pi.position,
        m.id as media_id,
        m.filename,
        m.file_type,
        m.file_url,
        m.thumbnail_url
      FROM playlist_items pi
      JOIN media m ON pi.media_id = m.id
      WHERE pi.playlist_id = ${device.assigned_playlist_id}
      ORDER BY pi.position ASC
    `

    const items = itemsResult.map((item) => ({
      id: item.id,
      media_id: item.media_id,
      duration: item.duration,
      position: item.position,
      media: {
        id: item.media_id,
        filename: item.filename,
        file_type: item.file_type,
        file_url: item.file_url,
        thumbnail_url: item.thumbnail_url,
      },
    }))

    return NextResponse.json({
      playlist: {
        ...playlist,
        items,
      },
    })
  } catch (error) {
    console.error("Error fetching device playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}
