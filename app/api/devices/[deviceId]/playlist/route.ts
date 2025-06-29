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

    // Get playlist with items and media details
    const playlistResult = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.loop_playlist,
        p.shuffle_items,
        p.transition_duration,
        p.background_color,
        p.text_color,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pi.id,
            'order_index', pi.order_index,
            'duration', pi.duration,
            'media', JSON_BUILD_OBJECT(
              'id', mf.id,
              'filename', mf.filename,
              'file_type', mf.file_type,
              'file_size', mf.file_size,
              'url', mf.url,
              'thumbnail_url', mf.thumbnail_url,
              'metadata', mf.metadata
            )
          ) ORDER BY pi.order_index
        ) as items
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      LEFT JOIN media_files mf ON pi.media_id = mf.id
      WHERE p.id = ${device.assigned_playlist_id}
      GROUP BY p.id, p.name, p.description, p.loop_playlist, p.shuffle_items, p.transition_duration, p.background_color, p.text_color
    `

    if (playlistResult.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlistResult[0]

    // Filter out items with null media (deleted media files)
    const validItems = playlist.items.filter((item: any) => item.media && item.media.id)

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
        settings: {
          loop: playlist.loop_playlist,
          shuffle: playlist.shuffle_items,
          transitionDuration: playlist.transition_duration,
          backgroundColor: playlist.background_color,
          textColor: playlist.text_color,
        },
        items: validItems,
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
