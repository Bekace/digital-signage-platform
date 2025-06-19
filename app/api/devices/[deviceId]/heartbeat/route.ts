import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = params.deviceId
    const heartbeatData = await request.json()
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Invalid device credentials" }, { status: 401 })
    }

    // Demo heartbeat - always succeeds
    return NextResponse.json({
      success: true,
      message: "Heartbeat received",
      serverTime: new Date().toISOString(),
      commands: [], // No pending commands in demo
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
