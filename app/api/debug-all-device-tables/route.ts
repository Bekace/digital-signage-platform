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

    // Get table details and sample data
    const tableDetails = {}

    for (const table of tables) {
      try {
        // Get table structure
        const structure = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${table.table_name}
          ORDER BY ordinal_position
        `

        // Get row count
        const countResult = await sql`
          SELECT COUNT(*) as count FROM ${sql(table.table_name)}
        `

        // Get sample data (first 5 rows)
        const sampleData = await sql`
          SELECT * FROM ${sql(table.table_name)} 
          ORDER BY id DESC 
          LIMIT 5
        `

        tableDetails[table.table_name] = {
          structure,
          rowCount: countResult[0]?.count || 0,
          sampleData,
        }
      } catch (error) {
        tableDetails[table.table_name] = {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Analyze relationships between devices and pairing codes
    const relationships = []

    try {
      const devicePairingRelation = await sql`
        SELECT 
          d.id as device_id,
          d.name as device_name,
          dpc.code as pairing_code,
          dpc.user_id,
          dpc.used_at
        FROM devices d
        LEFT JOIN device_pairing_codes dpc ON d.id = dpc.device_id
        ORDER BY d.id
      `
      relationships.push({ type: "device_pairing", data: devicePairingRelation })
    } catch (error) {
      relationships.push({ type: "device_pairing", error: error.message })
    }

    try {
      const deviceHeartbeatRelation = await sql`
        SELECT 
          d.id as device_id,
          d.name as device_name,
          d.status as device_status,
          dh.status as heartbeat_status,
          dh.last_heartbeat
        FROM devices d
        LEFT JOIN device_heartbeats dh ON d.id = dh.device_id
        ORDER BY d.id
      `
      relationships.push({ type: "device_heartbeat", data: deviceHeartbeatRelation })
    } catch (error) {
      relationships.push({ type: "device_heartbeat", error: error.message })
    }

    // Check for orphaned records
    const orphanedAnalysis = {}

    try {
      const orphanedPairingCodes = await sql`
        SELECT COUNT(*) as count
        FROM device_pairing_codes dpc
        LEFT JOIN devices d ON dpc.device_id = d.id
        WHERE dpc.device_id IS NOT NULL AND d.id IS NULL
      `
      orphanedAnalysis.orphanedPairingCodes = orphanedPairingCodes[0]?.count || "0"

      const devicesWithoutPairing = await sql`
        SELECT COUNT(*) as count
        FROM devices d
        LEFT JOIN device_pairing_codes dpc ON d.id = dpc.device_id
        WHERE dpc.device_id IS NULL
      `
      orphanedAnalysis.devicesWithoutPairing = devicesWithoutPairing[0]?.count || "0"
    } catch (error) {
      orphanedAnalysis.error = error.message
    }

    // Summary statistics
    const summary = {
      totalTables: tables.length,
      tablesWithData: Object.values(tableDetails).filter((table: any) => table.rowCount > 0).length,
      totalDevices: tableDetails.devices?.rowCount || 0,
      totalPairingCodes: tableDetails.device_pairing_codes?.rowCount || 0,
      totalHeartbeats: tableDetails.device_heartbeats?.rowCount || 0,
    }

    console.log("🔍 [DEBUG ALL DEVICE TABLES] Analysis complete:", {
      tables: tables.length,
      relationships: relationships.length,
      summary,
    })

    return NextResponse.json({
      success: true,
      data: {
        tables,
        tableDetails,
        relationships,
        orphanedAnalysis,
        summary,
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG ALL DEVICE TABLES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze device tables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
