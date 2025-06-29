import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎬 [ASSIGN PLAYLIST] Starting playlist assignment for device:", params.deviceId)

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ [ASSIGN PLAYLIST] No valid authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("✅ [ASSIGN PLAYLIST] User authenticated:", decoded.userId)

    const { playlistId } = await request.json()
    console.log("🎬 [ASSIGN PLAYLIST] Playlist ID to assign:", playlistId)

    // Verify device ownership
    const deviceResult = await sql`
      SELECT id, name, user_id 
      FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      console.log("❌ [ASSIGN PLAYLIST] Device not found or not owned by user")
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    console.log("✅ [ASSIGN PLAYLIST] Device verified:", deviceResult[0].name)

    // Verify playlist ownership if playlistId is provided
    if (playlistId) {
      const playlistResult = await sql`
        SELECT id, name, user_id 
        FROM playlists 
        WHERE id = ${playlistId} AND user_id = ${decoded.userId}
      `

      if (playlistResult.length === 0) {
        console.log("❌ [ASSIGN PLAYLIST] Playlist not found or not owned by user")
        return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
      }

      console.log("✅ [ASSIGN PLAYLIST] Playlist verified:", playlistResult[0].name)
    }

    // Update device with assigned playlist
    const updateResult = await sql`
      UPDATE devices 
      SET assigned_playlist_id = ${playlistId || null},
          playlist_status = ${playlistId ? "assigned" : "none"},
          last_control_action = ${playlistId ? "assigned" : "unassigned"},
          last_control_time = NOW(),
          updated_at = NOW()
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
      RETURNING id, name, assigned_playlist_id, playlist_status
    `

    if (updateResult.length === 0) {
      console.log("❌ [ASSIGN PLAYLIST] Failed to update device")
      return NextResponse.json({ error: "Failed to assign playlist" }, { status: 500 })
    }

    console.log("✅ [ASSIGN PLAYLIST] Device updated successfully:", updateResult[0])

    return NextResponse.json({
      success: true,
      message: playlistId ? "Playlist assigned successfully" : "Playlist unassigned successfully",
      device: updateResult[0],
    })
  } catch (error) {
    console.error("❌ [ASSIGN PLAYLIST] Error:", error)
    return NextResponse.json({ error: "Failed to assign playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🗑️ [UNASSIGN PLAYLIST] Starting playlist unassignment for device:", params.deviceId)

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ [UNASSIGN PLAYLIST] No valid authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("✅ [UNASSIGN PLAYLIST] User authenticated:", decoded.userId)

    // Update device to remove assigned playlist
    const updateResult = await sql`
      UPDATE devices 
      SET assigned_playlist_id = NULL,
          playlist_status = 'none',
          last_control_action = 'unassigned',
          last_control_time = NOW(),
          updated_at = NOW()
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
      RETURNING id, name, assigned_playlist_id, playlist_status
    `

    if (updateResult.length === 0) {
      console.log("❌ [UNASSIGN PLAYLIST] Device not found or not owned by user")
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    console.log("✅ [UNASSIGN PLAYLIST] Playlist unassigned successfully:", updateResult[0])

    return NextResponse.json({
      success: true,
      message: "Playlist unassigned successfully",
      device: updateResult[0],
    })
  } catch (error) {
    console.error("❌ [UNASSIGN PLAYLIST] Error:", error)
    return NextResponse.json({ error: "Failed to unassign playlist" }, { status: 500 })
  }
}
