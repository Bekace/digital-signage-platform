import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "This endpoint must be called from the client to access request headers and cookies.",
  })
}
