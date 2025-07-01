import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { deviceId } = params
    const body = await request.json()
    const { playlistId } = body

    console.log(`🎬 [ASSIGN PLAYLIST] Assigning playlist ${playlistId} to device ${deviceId}`)

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Validate device exists and belongs to user
    const [device] = await sql`
      SELECT id, name FROM devices WHERE id = ${Number.parseInt(deviceId)} AND user_id = ${user.id}
    `

    if (!device) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    if (playlistId === null || playlistId === "none") {
      // Remove playlist assignment
      await sql`
        UPDATE devices 
        SET 
          assigned_playlist_id = NULL,
          playlist_status = 'none',
          updated_at = NOW()
        WHERE id = ${Number.parseInt(deviceId)}
      `

      return NextResponse.json({
        success: true,
        message: "Playlist removed from device",
      })
    }

    // Validate playlist exists and belongs to user
    const [playlist] = await sql`
      SELECT id, name FROM playlists WHERE id = ${Number.parseInt(playlistId)} AND user_id = ${user.id}
    `

    if (!playlist) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    // Assign playlist to device
    await sql`
      UPDATE devices 
      SET 
        assigned_playlist_id = ${Number.parseInt(playlistId)},
        playlist_status = 'assigned',
        updated_at = NOW()
      WHERE id = ${Number.parseInt(deviceId)}
    `

    console.log(`✅ [ASSIGN PLAYLIST] Successfully assigned "${playlist.name}" to device ${deviceId}`)

    return NextResponse.json({
      success: true,
      message: `Playlist "${playlist.name}" assigned to device`,
      playlist: {
        id: playlist.id,
        name: playlist.name,
      },
    })
  } catch (error) {
    console.error("❌ [ASSIGN PLAYLIST] Error:", error)
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
