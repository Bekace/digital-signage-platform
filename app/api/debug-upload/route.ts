import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Get user's current usage
    const userUsage = await sql`
      SELECT media_files_count, storage_used_bytes, plan
      FROM users 
      WHERE id = ${user.id}
    `

    // Get plan limits
    const planLimits = await sql`
      SELECT max_files, max_storage_gb
      FROM plan_limits 
      WHERE plan_type = ${userUsage[0]?.plan || "free"}
    `

    // Get recent uploads
    const recentUploads = await sql`
      SELECT original_name, file_size, mime_type, created_at
      FROM media_files 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        plan: userUsage[0]?.plan || "unknown",
      },
      usage: {
        files: userUsage[0]?.media_files_count || 0,
        storage_bytes: userUsage[0]?.storage_used_bytes || 0,
        storage_mb: Math.round(((userUsage[0]?.storage_used_bytes || 0) / (1024 * 1024)) * 100) / 100,
      },
      limits: planLimits[0] || { max_files: 0, max_storage_gb: 0 },
      recent_uploads: recentUploads,
      debug_info: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
      },
    })
  } catch (error) {
    console.error("Debug upload error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
