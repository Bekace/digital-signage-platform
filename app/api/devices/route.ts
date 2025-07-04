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

    const devices = await sql`
      SELECT 
        id,
        name,
        type,
        status,
        last_seen,
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
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
      })),
    })
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
