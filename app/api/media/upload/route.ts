import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
]

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Starting file upload...")

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("✅ User authenticated:", user.email)

    // Get form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("❌ No file in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("✅ File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log("❌ Invalid file type:", file.type)
      return NextResponse.json({ error: `File type ${file.type} not supported` }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log("❌ File too large:", file.size)
      return NextResponse.json({ error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 })
    }

    console.log("✅ File validation passed")

    // Check database connection
    const sql = getDb()
    console.log("✅ Database connection established")

    // Get user's current usage
    console.log("🔍 Checking user plan...")
    const userResult = await sql`
      SELECT plan_type, media_files_count, storage_used_bytes
      FROM users 
      WHERE id = ${user.id}
    `

    if (userResult.length === 0) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userResult[0]
    console.log("✅ User data:", userData)

    // Simple plan limit check (free plan: 5 files, 100MB)
    const currentFiles = userData.media_files_count || 0
    const currentStorage = userData.storage_used_bytes || 0

    if (currentFiles >= 5) {
      console.log("❌ File limit exceeded:", currentFiles)
      return NextResponse.json(
        {
          error: "Upload limit exceeded",
          message: "Free plan allows 5 media files. Upgrade to upload more.",
          upgrade_required: true,
        },
        { status: 403 },
      )
    }

    if (currentStorage + file.size > MAX_FILE_SIZE) {
      console.log("❌ Storage limit exceeded")
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: "Free plan allows 100MB total storage. Upgrade for more space.",
          upgrade_required: true,
        },
        { status: 403 },
      )
    }

    console.log("✅ Plan limits check passed")

    // For now, let's simulate file storage without Vercel Blob
    // We'll store file info in database with a placeholder URL
    const timestamp = Date.now()
    const uniqueFilename = `${user.id}/${timestamp}-${file.name}`
    const mockUrl = `/api/media/file/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    console.log("🔍 Saving to database...")

    // Save to database
    const mediaResult = await sql`
      INSERT INTO media_files (
        user_id, filename, original_name, file_type, file_size, 
        mime_type, storage_url, created_at
      ) VALUES (
        ${user.id}, 
        ${uniqueFilename}, 
        ${file.name}, 
        ${file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document"}, 
        ${file.size}, 
        ${file.type}, 
        ${mockUrl}, 
        NOW()
      )
      RETURNING *
    `

    console.log("✅ Media file saved:", mediaResult[0])

    // Update user's usage counters
    await sql`
      UPDATE users 
      SET 
        media_files_count = COALESCE(media_files_count, 0) + 1,
        storage_used_bytes = COALESCE(storage_used_bytes, 0) + ${file.size}
      WHERE id = ${user.id}
    `

    console.log("✅ User usage updated")

    return NextResponse.json({
      success: true,
      file: mediaResult[0],
      message: "File uploaded successfully (demo mode)",
    })
  } catch (error) {
    console.error("❌ Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
