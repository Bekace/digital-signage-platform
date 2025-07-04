import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Generate Code API: Starting request")

    // Check authentication
    const user = await getCurrentUser()
    console.log("Generate Code API: User check result:", user ? `User ${user.email}` : "No user")

    if (!user) {
      console.log("Generate Code API: Authentication failed")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type } = body

    if (!name || !type) {
      return NextResponse.json({ success: false, error: "Name and type are required" }, { status: 400 })
    }

    console.log("Generating device code for user:", user.email)

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`Generate Code API: Generated code ${code} for device ${name}`)

    const sql = getDb()

    // Insert device with pending status
    const result = await sql`
      INSERT INTO devices (name, type, code, status, user_id, created_at)
      VALUES (${name}, ${type}, ${code}, 'pending', ${user.id}, NOW())
      RETURNING id, name, type, code, status, created_at
    `

    const device = result[0]
    console.log(`Generate Code API: Device created with ID ${device.id}`)

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        type: device.type,
        code: device.code,
        status: device.status,
        createdAt: device.created_at,
      },
      code: device.code,
      message: "Device code generated successfully",
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Generate Code API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate code",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
