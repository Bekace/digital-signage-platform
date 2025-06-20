import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code

    if (!code || code.length !== 6) {
      return NextResponse.json({ success: false, message: "Invalid code" }, { status: 400 })
    }

    const sql = getDb()

    // Check if a device has been registered with this code
    const result = await sql`
      SELECT d.device_id, d.screen_name, d.status, dc.used
      FROM device_codes dc
      LEFT JOIN devices d ON dc.code = ${code} AND dc.user_id = d.user_id
      WHERE dc.code = ${code}
      ORDER BY dc.created_at DESC
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, registered: false })
    }

    const codeData = result[0]
    const isRegistered = codeData.used && codeData.device_id

    return NextResponse.json({
      success: true,
      registered: isRegistered,
      device: isRegistered
        ? {
            id: codeData.device_id,
            name: codeData.screen_name,
            status: codeData.status,
          }
        : null,
    })
  } catch (error) {
    console.error("Check registration error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
