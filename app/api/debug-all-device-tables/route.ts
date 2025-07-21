import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG ALL DEVICE TABLES] Starting comprehensive analysis...")

    // Get all device-related tables
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%device%'
      ORDER BY table_name
    `

    // Get table details for each device table
    const tableDetails = {}
    for (const table of tables) {
      try {
        const tableData = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`
        tableDetails[table.table_name] = {
          rowCount: tableData[0].count,
          success: true,
        }
      } catch (error) {
        tableDetails[table.table_name] = {
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        }
      }
    }

    // Get device relationships
    const devicePairingRelationship = await sql`
      SELECT 
        d.id as device_id,
        d.name as device_name,
        dpc.code as pairing_code,
        dpc.user_id,
        dpc.used_at
      FROM devices d
      LEFT JOIN device_pairing_codes dpc ON d.id = dpc.device_id
    `

    const deviceHeartbeatRelationship = await sql`
      SELECT 
        d.id as device_id,
        d.name as device_name,
        d.status as device_status,
        dh.status as heartbeat_status,
        dh.updated_at as last_heartbeat
      FROM devices d
      LEFT JOIN device_heartbeats dh ON d.id = dh.device_id
    `

    // Orphaned analysis
    const orphanedPairingCodes = await sql`
      SELECT COUNT(*) as count
      FROM device_pairing_codes
      WHERE device_id IS NOT NULL
      AND device_id NOT IN (SELECT id FROM devices)
    `

    const devicesWithoutPairing = await sql`
      SELECT COUNT(*) as count
      FROM devices
      WHERE id NOT IN (SELECT COALESCE(device_id, 0) FROM device_pairing_codes WHERE device_id IS NOT NULL)
    `

    console.log("🔍 [DEBUG ALL DEVICE TABLES] Analysis complete")

    return NextResponse.json({
      success: true,
      data: {
        tables,
        tableDetails,
        relationships: [
          {
            type: "device_pairing",
            data: devicePairingRelationship,
          },
          {
            type: "device_heartbeat",
            data: deviceHeartbeatRelationship,
          },
        ],
        orphanedAnalysis: {
          orphanedPairingCodes: orphanedPairingCodes[0].count,
          devicesWithoutPairing: devicesWithoutPairing[0].count,
        },
        summary: {
          totalTables: tables.length,
          tablesWithData: Object.values(tableDetails).filter((t: any) => t.success && t.rowCount > 0).length,
          totalDevices: tableDetails.devices?.rowCount || 0,
          totalPairingCodes: tableDetails.device_pairing_codes?.rowCount || 0,
          totalHeartbeats: tableDetails.device_heartbeats?.rowCount || 0,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG ALL DEVICE TABLES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze all device tables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
