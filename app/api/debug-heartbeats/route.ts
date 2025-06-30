import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG HEARTBEATS] Fetching heartbeat data...")

    // Get all heartbeats with device info
    const heartbeats = await sql`
      SELECT 
        h.id,
        h.device_id,
        d.name as device_name,
        d.device_type,
        h.status,
        h.current_item_id,
        h.progress,
        h.performance_metrics,
        h.created_at,
        h.updated_at,
        d.last_seen as device_last_seen,
        d.status as device_status
      FROM device_heartbeats h
      LEFT JOIN devices d ON h.device_id = d.id
      ORDER BY h.updated_at DESC
      LIMIT 50
    `

    // Get heartbeat statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_heartbeats,
        COUNT(DISTINCT device_id) as active_devices,
        AVG(progress) as avg_progress,
        COUNT(CASE WHEN status = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_count,
        COUNT(CASE WHEN updated_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN 1 END) as recent_heartbeats
      FROM device_heartbeats
    `

    // Get recent heartbeat activity (last 24 hours)
    const recentActivity = await sql`
      SELECT 
        DATE_TRUNC('hour', updated_at) as hour,
        COUNT(*) as heartbeat_count,
        COUNT(DISTINCT device_id) as unique_devices
      FROM device_heartbeats
      WHERE updated_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', updated_at)
      ORDER BY hour DESC
    `

    // Check for devices without heartbeats
    const devicesWithoutHeartbeats = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.last_seen,
        d.created_at
      FROM devices d
      LEFT JOIN device_heartbeats h ON d.id = h.device_id
      WHERE h.device_id IS NULL
    `

    console.log("🔍 [DEBUG HEARTBEATS] Results:", {
      heartbeats: heartbeats.length,
      stats: stats[0],
      recentActivity: recentActivity.length,
      devicesWithoutHeartbeats: devicesWithoutHeartbeats.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        heartbeats,
        statistics: stats[0] || {},
        recentActivity,
        devicesWithoutHeartbeats,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG HEARTBEATS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch heartbeat data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
