import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = params.deviceId
    const body = await request.json()
    const { status, currentItem, progress, performanceMetrics, timestamp } = body

    console.log("Heartbeat received for device:", deviceId, { status, currentItem, progress })

    // Update device last_seen
    await sql`
      UPDATE devices 
      SET last_seen = CURRENT_TIMESTAMP, status = ${status || "online"}
      WHERE id = ${deviceId}
    `

    // Insert or update heartbeat
    await sql`
      INSERT INTO device_heartbeats (
        device_id, 
        status, 
        current_item_id, 
        progress, 
        performance_metrics, 
        created_at,
        updated_at
      )
      VALUES (
        ${deviceId}, 
        ${status || "online"}, 
        ${currentItem || null}, 
        ${progress || 0}, 
        ${JSON.stringify(performanceMetrics || {})}, 
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (device_id) DO UPDATE SET
        status = ${status || "online"},
        current_item_id = ${currentItem || null},
        progress = ${progress || 0},
        performance_metrics = ${JSON.stringify(performanceMetrics || {})},
        updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({
      success: true,
      message: "Heartbeat recorded",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record heartbeat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
