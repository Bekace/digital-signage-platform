import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = Number.parseInt(params.deviceId)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
    }

    // Get device and its assigned playlist
    const deviceResult = await sql`
      SELECT d.id, d.name, d.assigned_playlist_id, d.status
      FROM devices d
      WHERE d.id = ${deviceId}
    `

    if (deviceResult.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]

    if (!device.assigned_playlist_id) {
      return NextResponse.json({
        device: {
          id: device.id,
          name: device.name,
          status: device.status,
        },
        playlist: null,
        message: "No playlist assigned",
      })
    }

    // Get playlist details
    const playlistResult = await sql`
      SELECT id, name, description, loop_enabled, shuffle, background_color
      FROM playlists
      WHERE id = ${device.assigned_playlist_id}
    `

    if (playlistResult.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlistResult[0]

    // Get playlist items with media details
    const itemsResult = await sql`
      SELECT 
        pi.id,
        pi.media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        mf.id as media_file_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.url,
        mf.thumbnail_url,
        mf.mime_type,
        mf.dimensions,
        mf.media_source,
        mf.external_url
      FROM playlist_items pi
      JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.playlist_id = ${device.assigned_playlist_id}
      AND pi.deleted_at IS NULL
      AND mf.deleted_at IS NULL
      ORDER BY pi.position ASC
    `

    const items = itemsResult.map((item) => ({
      id: item.id,
      media_id: item.media_id,
      position: item.position,
      duration: item.duration || 8,
      transition_type: item.transition_type || "fade",
      media: {
        id: item.media_file_id,
        filename: item.filename,
        original_name: item.original_name,
        file_type: item.file_type,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        mime_type: item.mime_type,
        dimensions: item.dimensions,
        media_source: item.media_source,
        external_url: item.external_url,
      },
    }))

    return NextResponse.json({
      device: {
        id: device.id,
        name: device.name,
        status: device.status,
      },
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        loop_enabled: playlist.loop_enabled || false,
        shuffle: playlist.shuffle || false,
        background_color: playlist.background_color,
        items: items,
      },
    })
  } catch (error) {
    console.error("Get playlist error:", error)
    return NextResponse.json(
      {
        error: "Failed to get playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
