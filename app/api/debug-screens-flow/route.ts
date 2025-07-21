import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "This endpoint must be called from the client to access request headers.",
  })
}
