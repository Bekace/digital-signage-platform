import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    const mediaFiles = await sql`
      SELECT 
        id, filename, original_name, file_type, file_size, 
        mime_type, storage_url, thumbnail_url, duration, 
        dimensions, created_at
      FROM media_files 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    // Format file sizes and dates for display
    const formattedFiles = mediaFiles.map((file) => ({
      ...file,
      size: formatFileSize(file.file_size),
      uploadDate: new Date(file.created_at).toLocaleDateString(),
      thumbnail: file.thumbnail_url || file.storage_url, // Use actual file if no thumbnail
    }))

    return NextResponse.json({
      files: formattedFiles,
      total: mediaFiles.length,
    })
  } catch (error) {
    console.error("Error fetching media files:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
