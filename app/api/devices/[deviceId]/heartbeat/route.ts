import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { deviceId } = params
    const body = await request.json()
    const { status = "online", currentItem = null, progress = 0, performanceMetrics = {}, timestamp } = body

    console.log(`Heartbeat from device ${deviceId}:`, { status, currentItem, progress })

    // Update device status and last seen
    await sql`
      UPDATE devices 
      SET 
        status = ${status},
        last_seen = CURRENT_TIMESTAMP,
        current_media_id = ${currentItem},
        playback_progress = ${progress},
        performance_metrics = ${JSON.stringify(performanceMetrics)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number.parseInt(deviceId)}
    `

    // Log heartbeat for monitoring
    await sql`
      INSERT INTO device_heartbeats (device_id, status, current_media_id, progress, metrics, created_at)
      VALUES (${Number.parseInt(deviceId)}, ${status}, ${currentItem}, ${progress}, ${JSON.stringify(performanceMetrics)}, CURRENT_TIMESTAMP)
    `

    return NextResponse.json({
      success: true,
      message: "Heartbeat received",
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json({ success: false, message: "Failed to process heartbeat" }, { status: 500 })
  }
}
