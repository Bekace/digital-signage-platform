import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("📁 [UPLOAD] Starting upload for:", file.name, "Size:", file.size, "Type:", file.type)

    // Check plan limits before upload
    const planResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/plan`, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    })

    if (planResponse.ok) {
      const planData = await planResponse.json()
      const { usage, limits } = planData

      // Check file count limit
      if (limits.max_media_files !== -1 && usage.media_files_count >= limits.max_media_files) {
        return NextResponse.json(
          {
            error: `You've reached your plan's limit of ${limits.max_media_files} media files. Upgrade to upload more.`,
          },
          { status: 403 },
        )
      }

      // Check storage limit
      if (limits.max_storage_bytes !== -1 && usage.storage_used_bytes + file.size > limits.max_storage_bytes) {
        const limitMB = Math.round(limits.max_storage_bytes / (1024 * 1024))
        return NextResponse.json(
          {
            error: `This file would exceed your storage limit of ${limitMB}MB. Upgrade for more storage.`,
          },
          { status: 403 },
        )
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`

    // Upload main file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const blob = await put(uniqueFilename, buffer, {
      access: "public",
      contentType: file.type,
    })

    console.log("☁️ [UPLOAD] File uploaded to blob:", blob.url)

    // Generate thumbnail for images
    let thumbnailUrl = null
    let dimensions = null
    const duration = null

    if (file.type.startsWith("image/")) {
      try {
        console.log("🖼️ [UPLOAD] Generating thumbnail for image...")

        // Get image metadata
        const metadata = await sharp(buffer).metadata()
        dimensions = `${metadata.width}x${metadata.height}`

        // Generate thumbnail
        const thumbnailBuffer = await sharp(buffer)
          .resize(300, 200, { fit: "cover", position: "center" })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailFilename = `thumb-${uniqueFilename.replace(/\.[^/.]+$/, ".jpg")}`
        const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
          access: "public",
          contentType: "image/jpeg",
        })

        thumbnailUrl = thumbnailBlob.url
        console.log("✅ [UPLOAD] Thumbnail generated:", thumbnailUrl)
      } catch (error) {
        console.error("❌ [UPLOAD] Thumbnail generation failed:", error)
        // Continue without thumbnail
      }
    }

    // Save to database
    const sql = getDb()
    const result = await sql`
      INSERT INTO media_files (
        user_id, filename, original_name, file_type, file_size, 
        mime_type, url, thumbnail_url, dimensions, duration
      ) VALUES (
        ${user.id}, ${uniqueFilename}, ${file.name}, ${file.type}, ${file.size},
        ${file.type}, ${blob.url}, ${thumbnailUrl}, ${dimensions}, ${duration}
      )
      RETURNING *
    `

    console.log("💾 [UPLOAD] Saved to database:", result[0])

    return NextResponse.json({
      success: true,
      file: {
        id: result[0].id,
        filename: result[0].filename,
        original_name: result[0].original_name,
        file_type: result[0].file_type,
        file_size: result[0].file_size,
        url: result[0].url,
        thumbnail_url: result[0].thumbnail_url,
        dimensions: result[0].dimensions,
        created_at: result[0].created_at,
      },
    })
  } catch (error) {
    console.error("❌ [UPLOAD] Upload failed:", error)
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
