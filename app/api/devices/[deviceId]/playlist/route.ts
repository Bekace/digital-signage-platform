import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = params.deviceId
    const sql = getDb()

    // Get current playlist for device
    const result = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        COUNT(pi.id)::text as items,
        p.created_at,
        p.updated_at
      FROM device_playlists dp
      JOIN playlists p ON dp.playlist_id = p.id
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE dp.device_id = ${deviceId} 
        AND dp.user_id = ${user.id}
        AND p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.created_at, p.updated_at
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({
        success: true,
        playlist: null,
      })
    }

    const playlist = result[0]
    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        status: playlist.status,
        items: Number.parseInt(playlist.items) || 0,
        duration: "0:00", // Calculate based on media items
        lastModified: new Date(playlist.updated_at).toLocaleDateString(),
      },
    })
  } catch (error) {
    console.error("Get device playlist error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = params.deviceId
    const body = await request.json()
    const { playlistId } = body

    if (!playlistId) {
      return NextResponse.json({ success: false, error: "Playlist ID is required" }, { status: 400 })
    }

    const sql = getDb()

    // Verify device belongs to user
    const deviceCheck = await sql`
      SELECT id FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (deviceCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found or access denied" }, { status: 404 })
    }

    // Verify playlist belongs to user
    const playlistCheck = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (playlistCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found or access denied" }, { status: 404 })
    }

    // Remove existing assignment
    await sql`
      DELETE FROM device_playlists 
      WHERE device_id = ${deviceId} AND user_id = ${user.id}
    `

    // Create new assignment
    await sql`
      INSERT INTO device_playlists (device_id, playlist_id, user_id, assigned_at)
      VALUES (${deviceId}, ${playlistId}, ${user.id}, NOW())
    `

    return NextResponse.json({
      success: true,
      message: "Playlist assigned successfully",
    })
  } catch (error) {
    console.error("Assign playlist error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = params.deviceId
    const sql = getDb()

    // Remove playlist assignment
    const result = await sql`
      DELETE FROM device_playlists 
      WHERE device_id = ${deviceId} AND user_id = ${user.id}
      RETURNING device_id
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "No assignment found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Playlist unassigned successfully",
    })
  } catch (error) {
    console.error("Unassign playlist error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
