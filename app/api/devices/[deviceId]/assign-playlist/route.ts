import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { deviceId } = params
    const body = await request.json()
    const { playlistId } = body

    console.log(`Assigning playlist ${playlistId} to device ${deviceId}`)

    if (!playlistId) {
      return NextResponse.json({ success: false, message: "Playlist ID is required" }, { status: 400 })
    }

    // Verify playlist exists
    const [playlist] = await sql`
      SELECT id, name FROM playlists WHERE id = ${Number.parseInt(playlistId)}
    `

    if (!playlist) {
      return NextResponse.json({ success: false, message: "Playlist not found" }, { status: 404 })
    }

    // Assign playlist to device
    await sql`
      UPDATE devices 
      SET 
        assigned_playlist_id = ${Number.parseInt(playlistId)},
        playlist_status = 'assigned',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number.parseInt(deviceId)}
    `

    return NextResponse.json({
      success: true,
      message: `Playlist "${playlist.name}" assigned to device`,
      playlist: {
        id: playlist.id,
        name: playlist.name,
      },
    })
  } catch (error) {
    console.error("Assign playlist error:", error)
    return NextResponse.json({ success: false, message: "Failed to assign playlist" }, { status: 500 })
  }
}
