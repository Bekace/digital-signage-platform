import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { deviceId } = params
    console.log("🎵 [DEVICE PLAYLIST API] Fetching playlist for device:", deviceId)

    // Get device and user info
    const deviceResult = await sql`
      SELECT user_id FROM devices WHERE device_id = ${deviceId}
    `

    if (deviceResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Device not found",
        },
        { status: 404 },
      )
    }

    const userId = deviceResult[0].user_id

    // Get active playlists for this user
    const playlistsResult = await sql`
      SELECT 
        p.id,
        p.name,
        p.status,
        p.loop_enabled,
        p.schedule_enabled,
        p.start_time,
        p.end_time,
        p.selected_days,
        p.background_color,
        p.default_transition,
        p.transition_speed,
        p.auto_advance,
        p.shuffle
      FROM playlists p
      WHERE p.user_id = ${userId} 
      AND p.status = 'active'
      ORDER BY p.updated_at DESC
      LIMIT 1
    `

    if (playlistsResult.length === 0) {
      return NextResponse.json({
        success: true,
        playlist: null,
        message: "No active playlist found",
      })
    }

    const playlist = playlistsResult[0]

    // Get playlist items with media files
    const itemsResult = await sql`
      SELECT 
        pi.id,
        pi.position,
        pi.duration,
        pi.transition_type,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.mime_type,
        mf.url,
        mf.file_size
      FROM playlist_items pi
      JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlist.id}
      AND mf.deleted_at IS NULL
      ORDER BY pi.position ASC
    `

    const playlistData = {
      ...playlist,
      items: itemsResult,
    }

    console.log("🎵 [DEVICE PLAYLIST API] Returning playlist with", itemsResult.length, "items")

    return NextResponse.json({
      success: true,
      playlist: playlistData,
    })
  } catch (error) {
    console.error("🎵 [DEVICE PLAYLIST API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
