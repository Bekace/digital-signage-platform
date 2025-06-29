import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = Number.parseInt(params.deviceId)
    const body = await request.json()

    const { status = "online", currentItem, progress = 0, performanceMetrics = {} } = body

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
    }

    // Update device last_seen
    await sql`
      UPDATE devices 
      SET last_seen = CURRENT_TIMESTAMP, status = ${status}
      WHERE id = ${deviceId}
    `

    // Insert heartbeat record
    await sql`
      INSERT INTO device_heartbeats (
        device_id, 
        status, 
        current_item, 
        progress, 
        performance_metrics
      )
      VALUES (
        ${deviceId}, 
        ${status}, 
        ${currentItem || null}, 
        ${progress}, 
        ${JSON.stringify(performanceMetrics)}
      )
    `

    // Clean up old heartbeats (keep only last 100 per device)
    await sql`
      DELETE FROM device_heartbeats 
      WHERE device_id = ${deviceId} 
      AND id NOT IN (
        SELECT id FROM device_heartbeats 
        WHERE device_id = ${deviceId} 
        ORDER BY timestamp DESC 
        LIMIT 100
      )
    `

    return NextResponse.json({
      success: true,
      message: "Heartbeat recorded",
    })
  } catch (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json(
      {
        error: "Failed to record heartbeat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
