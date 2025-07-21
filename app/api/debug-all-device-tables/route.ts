import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG ALL DEVICE TABLES] Starting comprehensive device tables analysis...")

    // Get all device-related tables
    const deviceTables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_name LIKE '%device%' 
      OR table_name LIKE '%pairing%'
      OR table_name LIKE '%heartbeat%'
      ORDER BY table_name
    `

    // Get detailed info for each table
    const tableDetails = {}

    for (const table of deviceTables) {
      const tableName = table.table_name

      try {
        // Get columns
        const columns = await sql`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `

        // Get row count
        const countResult = await sql`
          SELECT COUNT(*) as count FROM ${sql(tableName)}
        `

        // Get constraints
        const constraints = await sql`
          SELECT 
            constraint_name,
            constraint_type
          FROM information_schema.table_constraints 
          WHERE table_name = ${tableName}
        `

        // Get foreign keys
        const foreignKeys = await sql`
          SELECT 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.constraint_column_usage ccu 
            ON kcu.constraint_name = ccu.constraint_name
          JOIN information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
          WHERE kcu.table_name = ${tableName}
          AND tc.constraint_type = 'FOREIGN KEY'
        `

        tableDetails[tableName] = {
          columns,
          rowCount: countResult[0].count,
          constraints,
          foreignKeys,
        }
      } catch (error) {
        tableDetails[tableName] = {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Analyze relationships
    const relationships = []

    // Check device -> pairing relationship
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
      relationships.push({
        type: "device_pairing",
        data: devicePairingRelation,
      })
    } catch (error) {
      relationships.push({
        type: "device_pairing",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check device -> heartbeat relationship
    try {
      const deviceHeartbeatRelation = await sql`
        SELECT 
          d.id as device_id,
          d.name as device_name,
          d.status as device_status,
          dh.status as heartbeat_status,
          dh.updated_at as last_heartbeat
        FROM devices d
        LEFT JOIN device_heartbeats dh ON d.id = dh.device_id
        ORDER BY d.id
      `
      relationships.push({
        type: "device_heartbeat",
        data: deviceHeartbeatRelation,
      })
    } catch (error) {
      relationships.push({
        type: "device_heartbeat",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check for orphaned records
    let orphanedAnalysis = {}

    try {
      // Pairing codes without devices
      const orphanedPairingCodes = await sql`
        SELECT COUNT(*) as count
        FROM device_pairing_codes 
        WHERE device_id IS NULL AND used_at IS NOT NULL
      `

      // Devices without pairing codes
      const devicesWithoutPairing = await sql`
        SELECT COUNT(*) as count
        FROM devices d
        WHERE NOT EXISTS (
          SELECT 1 FROM device_pairing_codes dpc 
          WHERE dpc.device_id = d.id
        )
      `

      orphanedAnalysis = {
        orphanedPairingCodes: orphanedPairingCodes[0].count,
        devicesWithoutPairing: devicesWithoutPairing[0].count,
      }
    } catch (error) {
      orphanedAnalysis.error = error instanceof Error ? error.message : "Unknown error"
    }

    console.log("🔍 [DEBUG ALL DEVICE TABLES] Found tables:", deviceTables.length)

    return NextResponse.json({
      success: true,
      data: {
        tables: deviceTables,
        tableDetails,
        relationships,
        orphanedAnalysis,
        summary: {
          totalTables: deviceTables.length,
          tablesWithData: Object.values(tableDetails).filter((t: any) => t.rowCount > 0).length,
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
