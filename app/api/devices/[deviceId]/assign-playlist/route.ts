import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎬 [DEVICE ASSIGNMENT] Starting playlist assignment...")

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ [DEVICE ASSIGNMENT] No authorization header")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { playlistId } = await request.json()
    const deviceId = params.deviceId

    console.log(`🎬 [DEVICE ASSIGNMENT] Device: ${deviceId}, Playlist: ${playlistId}`)

    if (!playlistId) {
      return NextResponse.json({ success: false, message: "Playlist ID is required" }, { status: 400 })
    }

    const sql = getDb()
    const userId = 1 // For demo, use user ID 1

    // Verify device belongs to user
    const deviceCheck = await sql`
      SELECT device_id FROM devices 
      WHERE device_id = ${deviceId} AND user_id = ${userId}
    `

    if (deviceCheck.length === 0) {
      console.log("❌ [DEVICE ASSIGNMENT] Device not found or not owned by user")
      return NextResponse.json({ success: false, message: "Device not found" }, { status: 404 })
    }

    // Verify playlist belongs to user
    const playlistCheck = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${userId}
    `

    if (playlistCheck.length === 0) {
      console.log("❌ [DEVICE ASSIGNMENT] Playlist not found or not owned by user")
      return NextResponse.json({ success: false, message: "Playlist not found" }, { status: 404 })
    }

    // Update device with assigned playlist
    await sql`
      UPDATE devices 
      SET assigned_playlist_id = ${playlistId},
          playlist_status = 'assigned',
          updated_at = NOW()
      WHERE device_id = ${deviceId} AND user_id = ${userId}
    `

    console.log("✅ [DEVICE ASSIGNMENT] Playlist assigned successfully")

    return NextResponse.json({
      success: true,
      message: "Playlist assigned successfully",
    })
  } catch (error) {
    console.error("❌ [DEVICE ASSIGNMENT] Error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
