import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎵 [ASSIGN PLAYLIST] Starting playlist assignment...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [ASSIGN PLAYLIST] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { deviceId } = params
    const body = await request.json()
    const { playlistId } = body

    console.log("🎵 [ASSIGN PLAYLIST] Request:", { deviceId, playlistId, userId: user.id })

    // Verify device belongs to user
    const deviceCheck = await sql`
      SELECT id, name FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    if (deviceCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    const device = deviceCheck[0]

    if (playlistId === null || playlistId === undefined) {
      // Remove playlist assignment
      await sql`
        UPDATE devices 
        SET 
          assigned_playlist_id = NULL,
          playlist_status = 'none',
          updated_at = NOW()
        WHERE id = ${deviceId} AND user_id = ${user.id}
      `

      console.log("🎵 [ASSIGN PLAYLIST] Playlist removed from device:", device.name)

      return NextResponse.json({
        success: true,
        message: `Playlist removed from ${device.name}`,
        device: {
          id: deviceId,
          name: device.name,
          assignedPlaylistId: null,
          playlistStatus: "none",
        },
      })
    }

    // Verify playlist belongs to user
    const playlistCheck = await sql`
      SELECT id, name FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlistCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlistCheck[0]

    // Assign playlist to device
    await sql`
      UPDATE devices 
      SET 
        assigned_playlist_id = ${playlistId},
        playlist_status = 'assigned',
        updated_at = NOW()
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    console.log("🎵 [ASSIGN PLAYLIST] Playlist assigned successfully:", {
      deviceName: device.name,
      playlistName: playlist.name,
    })

    return NextResponse.json({
      success: true,
      message: `Playlist "${playlist.name}" assigned to ${device.name}`,
      device: {
        id: deviceId,
        name: device.name,
        assignedPlaylistId: playlistId,
        assignedPlaylistName: playlist.name,
        playlistStatus: "assigned",
      },
    })
  } catch (error) {
    console.error("🎵 [ASSIGN PLAYLIST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to assign playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
