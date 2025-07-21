import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: false,
    error: "This endpoint must be called from the client to access cookies.",
  })
}
