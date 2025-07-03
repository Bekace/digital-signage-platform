import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("🎬 [MEDIA API] Fetching media files...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("🎬 [MEDIA API] No authenticated user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🎬 [MEDIA API] User authenticated:", user.email)
    const sql = getDb()

    const mediaFiles = await sql`
      SELECT 
        id, filename, original_name, file_type, file_size, 
        mime_type, url, storage_url, thumbnail_url, duration, 
        dimensions, created_at
      FROM media_files 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    console.log("🎬 [MEDIA API] Found media files:", mediaFiles.length)

    // Format files for the frontend
    const formattedFiles = mediaFiles.map((file) => ({
      id: file.id,
      filename: file.filename,
      original_name: file.original_name,
      file_type: file.file_type,
      file_size: file.file_size,
      mime_type: file.mime_type,
      url: file.url || file.storage_url || `https://blob.vercel-storage.com/${file.filename}`,
      thumbnail_url: file.thumbnail_url,
      duration: file.duration,
      dimensions: file.dimensions,
      created_at: file.created_at,
    }))

    return NextResponse.json({
      files: formattedFiles,
      total: mediaFiles.length,
    })
  } catch (error) {
    console.error("🎬 [MEDIA API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}
