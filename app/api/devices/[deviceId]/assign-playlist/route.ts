import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎬 [ASSIGN PLAYLIST] Starting playlist assignment for device:", params.deviceId)

    // Get auth token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      console.log("❌ [ASSIGN PLAYLIST] No auth token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("👤 [ASSIGN PLAYLIST] User ID from token:", decoded.userId)

    // Get request body
    const body = await request.json()
    const { playlistId } = body
    console.log("📋 [ASSIGN PLAYLIST] Playlist ID to assign:", playlistId)

    if (!playlistId) {
      console.log("❌ [ASSIGN PLAYLIST] No playlist ID provided")
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    // Verify device ownership
    const deviceResult = await sql`
      SELECT id, name, user_id, status 
      FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      console.log("❌ [ASSIGN PLAYLIST] Device not found or not owned by user")
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]
    console.log("📱 [ASSIGN PLAYLIST] Device found:", device.name)

    // Verify playlist ownership
    const playlistResult = await sql`
      SELECT id, name, user_id 
      FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${decoded.userId}
    `

    if (playlistResult.length === 0) {
      console.log("❌ [ASSIGN PLAYLIST] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlistResult[0]
    console.log("📋 [ASSIGN PLAYLIST] Playlist found:", playlist.name)

    // Assign playlist to device
    const updateResult = await sql`
      UPDATE devices 
      SET 
        assigned_playlist_id = ${playlistId},
        playlist_status = 'assigned',
        last_control_action = 'assign',
        last_control_time = NOW(),
        updated_at = NOW()
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
      RETURNING id, name, assigned_playlist_id, playlist_status
    `

    if (updateResult.length === 0) {
      console.log("❌ [ASSIGN PLAYLIST] Failed to update device")
      return NextResponse.json({ error: "Failed to assign playlist" }, { status: 500 })
    }

    console.log("✅ [ASSIGN PLAYLIST] Successfully assigned playlist to device")
    console.log("📊 [ASSIGN PLAYLIST] Updated device:", updateResult[0])

    return NextResponse.json({
      success: true,
      message: `Playlist "${playlist.name}" assigned to device "${device.name}"`,
      device: updateResult[0],
      playlist: {
        id: playlist.id,
        name: playlist.name,
      },
    })
  } catch (error) {
    console.error("💥 [ASSIGN PLAYLIST] Error:", error)
    return NextResponse.json({ error: "Failed to assign playlist to device" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🗑️ [UNASSIGN PLAYLIST] Starting playlist unassignment for device:", params.deviceId)

    // Get auth token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      console.log("❌ [UNASSIGN PLAYLIST] No auth token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("👤 [UNASSIGN PLAYLIST] User ID from token:", decoded.userId)

    // Verify device ownership
    const deviceResult = await sql`
      SELECT id, name, user_id, assigned_playlist_id 
      FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      console.log("❌ [UNASSIGN PLAYLIST] Device not found or not owned by user")
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]
    console.log("📱 [UNASSIGN PLAYLIST] Device found:", device.name)

    // Unassign playlist from device
    const updateResult = await sql`
      UPDATE devices 
      SET 
        assigned_playlist_id = NULL,
        playlist_status = 'stopped',
        last_control_action = 'unassign',
        last_control_time = NOW(),
        updated_at = NOW()
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
      RETURNING id, name, assigned_playlist_id, playlist_status
    `

    if (updateResult.length === 0) {
      console.log("❌ [UNASSIGN PLAYLIST] Failed to update device")
      return NextResponse.json({ error: "Failed to unassign playlist" }, { status: 500 })
    }

    console.log("✅ [UNASSIGN PLAYLIST] Successfully unassigned playlist from device")
    console.log("📊 [UNASSIGN PLAYLIST] Updated device:", updateResult[0])

    return NextResponse.json({
      success: true,
      message: `Playlist unassigned from device "${device.name}"`,
      device: updateResult[0],
    })
  } catch (error) {
    console.error("💥 [UNASSIGN PLAYLIST] Error:", error)
    return NextResponse.json({ error: "Failed to unassign playlist from device" }, { status: 500 })
  }
}
