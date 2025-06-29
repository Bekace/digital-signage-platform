import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    // Get media files for this user
    const media = await sql`
      SELECT 
        id,
        filename,
        original_filename as "originalFilename",
        file_type as "fileType",
        file_size as "fileSize",
        url,
        thumbnail_url as "thumbnailUrl",
        created_at as "createdAt"
      FROM media_files 
      WHERE user_id = ${decoded.userId}
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      media: media,
    })
  } catch (error) {
    console.error("Media fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
