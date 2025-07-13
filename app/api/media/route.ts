import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("📁 [MEDIA API] Starting GET request for media files")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [MEDIA API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Get media files - using correct table name media_files
    const mediaFiles = await sql`
      SELECT 
        id,
        filename,
        original_name,
        file_type,
        file_size,
        url,
        thumbnail_url,
        mime_type,
        dimensions,
        duration,
        media_source,
        external_url,
        embed_settings,
        created_at,
        updated_at
      FROM media_files 
      WHERE user_id = ${user.id}
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    console.log(`✅ [MEDIA API] Found ${mediaFiles.length} media files for user ${user.id}`)

    // Format for frontend compatibility
    const formattedFiles = mediaFiles.map((file) => ({
      id: Number(file.id),
      filename: String(file.filename || ""),
      original_name: String(file.original_name || ""),
      original_filename: String(file.original_name || file.filename || ""),
      file_type: String(file.file_type || ""),
      file_size: Number(file.file_size) || 0,
      url: String(file.url || ""),
      thumbnail_url: file.thumbnail_url ? String(file.thumbnail_url) : undefined,
      mime_type: file.mime_type ? String(file.mime_type) : undefined,
      dimensions: file.dimensions ? String(file.dimensions) : undefined,
      duration: file.duration ? Number(file.duration) : undefined,
      media_source: file.media_source ? String(file.media_source) : undefined,
      external_url: file.external_url ? String(file.external_url) : undefined,
      embed_settings: file.embed_settings ? String(file.embed_settings) : undefined,
      created_at: file.created_at,
      updated_at: file.updated_at,
    }))

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      media: formattedFiles, // Also provide as 'media' for compatibility
      total: formattedFiles.length,
    })
  } catch (error) {
    console.error("❌ [MEDIA API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch media files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("📁 [MEDIA API] Starting POST request for media upload")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [MEDIA API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Here you would implement file upload logic
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      message: "File upload endpoint - implementation needed",
    })
  } catch (error) {
    console.error("❌ [MEDIA API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload media file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
