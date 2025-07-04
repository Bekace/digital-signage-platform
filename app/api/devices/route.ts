import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("Devices API: Starting request")

    const user = await getCurrentUser()
    console.log("Devices API: User check result:", user ? `User ${user.email}` : "No user")

    if (!user) {
      console.log("Devices API: Authentication failed")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const sql = getDb()
    console.log("Devices API: Database connection established")

    // First check if the required columns exist
    try {
      const devices = await sql`
        SELECT 
          id,
          name,
          COALESCE(type, 'monitor') as type,
          COALESCE(status, 'offline') as status,
          COALESCE(location, 'Office') as location,
          COALESCE(resolution, '1920x1080') as resolution,
          COALESCE(last_seen, created_at) as last_seen,
          created_at,
          user_id
        FROM devices 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `

      console.log(`Devices API: Found ${devices.length} devices for user ${user.id}`)

      return NextResponse.json({
        success: true,
        devices: devices.map((device) => ({
          id: device.id.toString(),
          name: device.name,
          type: device.type,
          status: device.status,
          location: device.location,
          resolution: device.resolution,
          lastSeen: device.last_seen,
          createdAt: device.created_at,
        })),
      })
    } catch (columnError) {
      console.error("Column error - database schema needs fixing:", columnError)
      return NextResponse.json(
        {
          success: false,
          error: "Database schema needs updating. Please run the database fix at /fix-database",
          schemaError: true,
          details: columnError instanceof Error ? columnError.message : "Column missing",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Devices API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch devices",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
