import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { deviceId } = params

    console.log(`Getting playlist for device ${deviceId}`)

    // Get device with assigned playlist
    const [device] = await sql`
      SELECT d.*, p.id as playlist_id, p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.id = ${Number.parseInt(deviceId)}
    `

    if (!device) {
      return NextResponse.json({ success: false, message: "Device not found" }, { status: 404 })
    }

    if (!device.playlist_id) {
      return NextResponse.json({
        success: true,
        playlist: null,
        message: "No playlist assigned",
      })
    }

    // Get full playlist with items and media
    const playlist = await sql`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pi.id,
            'media_id', pi.media_id,
            'position', pi.position,
            'duration', pi.duration,
            'transition_type', pi.transition_type,
            'media', json_build_object(
              'id', m.id,
              'filename', m.filename,
              'original_name', m.original_name,
              'file_type', m.file_type,
              'url', m.url,
              'thumbnail_url', m.thumbnail_url,
              'mime_type', m.mime_type,
              'dimensions', m.dimensions,
              'duration', m.duration,
              'media_source', m.media_source,
              'external_url', m.external_url
            )
          ) ORDER BY pi.position
        ) as items
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      LEFT JOIN media_files m ON pi.media_id = m.id
      WHERE p.id = ${device.playlist_id}
      GROUP BY p.id
    `

    if (!playlist.length) {
      return NextResponse.json({ success: false, message: "Playlist not found" }, { status: 404 })
    }

    const playlistData = playlist[0]

    // Filter out null items (in case of missing media)
    const validItems = playlistData.items.filter((item: any) => item.media_id !== null)

    return NextResponse.json({
      success: true,
      playlist: {
        ...playlistData,
        items: validItems,
      },
    })
  } catch (error) {
    console.error("Get playlist error:", error)
    return NextResponse.json({ success: false, message: "Failed to get playlist" }, { status: 500 })
  }
}
