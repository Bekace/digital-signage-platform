import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎬 [ASSIGN PLAYLIST API] POST request for device:", params.deviceId)

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("❌ [ASSIGN PLAYLIST API] No token provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("✅ [ASSIGN PLAYLIST API] Token verified for user:", decoded.userId)

    const { playlistId } = await request.json()
    console.log("🎬 [ASSIGN PLAYLIST API] Assigning playlist:", playlistId, "to device:", params.deviceId)

    // Verify device ownership
    const deviceResult = await sql`
      SELECT id, name FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      console.log("❌ [ASSIGN PLAYLIST API] Device not found or not owned by user")
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    if (playlistId) {
      // Verify playlist ownership
      const playlistResult = await sql`
        SELECT id, name FROM playlists 
        WHERE id = ${playlistId} AND user_id = ${decoded.userId}
      `

      if (playlistResult.length === 0) {
        console.log("❌ [ASSIGN PLAYLIST API] Playlist not found or not owned by user")
        return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
      }

      // Assign playlist
      await sql`
        UPDATE devices 
        SET assigned_playlist_id = ${playlistId}, 
            playlist_status = 'assigned',
            last_control_action = 'assigned',
            last_control_time = NOW(),
            updated_at = NOW()
        WHERE id = ${params.deviceId}
      `

      console.log("✅ [ASSIGN PLAYLIST API] Playlist assigned successfully")
      return NextResponse.json({
        success: true,
        message: `Playlist "${playlistResult[0].name}" assigned to "${deviceResult[0].name}"`,
      })
    } else {
      // Unassign playlist
      await sql`
        UPDATE devices 
        SET assigned_playlist_id = NULL, 
            playlist_status = 'none',
            last_control_action = 'unassigned',
            last_control_time = NOW(),
            updated_at = NOW()
        WHERE id = ${params.deviceId}
      `

      console.log("✅ [ASSIGN PLAYLIST API] Playlist unassigned successfully")
      return NextResponse.json({
        success: true,
        message: `Playlist unassigned from "${deviceResult[0].name}"`,
      })
    }
  } catch (error) {
    console.error("💥 [ASSIGN PLAYLIST API] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to assign playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🗑️ [ASSIGN PLAYLIST API] DELETE request for device:", params.deviceId)

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    // Verify device ownership
    const deviceResult = await sql`
      SELECT id, name FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    // Unassign playlist
    await sql`
      UPDATE devices 
      SET assigned_playlist_id = NULL, 
          playlist_status = 'none',
          last_control_action = 'unassigned',
          last_control_time = NOW(),
          updated_at = NOW()
      WHERE id = ${params.deviceId}
    `

    console.log("✅ [ASSIGN PLAYLIST API] Playlist unassigned successfully")
    return NextResponse.json({
      success: true,
      message: `Playlist unassigned from "${deviceResult[0].name}"`,
    })
  } catch (error) {
    console.error("💥 [ASSIGN PLAYLIST API] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to unassign playlist" }, { status: 500 })
  }
}
