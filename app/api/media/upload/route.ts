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

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `${timestamp}-${randomString}.${fileExtension}`

    // Upload original file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const blob = await put(filename, fileBuffer, {
      access: "public",
    })

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (file.type.startsWith("image/")) {
      try {
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize(300, 200, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailFilename = `thumb-${filename.replace(/\.[^/.]+$/, ".jpg")}`
        const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
          access: "public",
        })
        thumbnailUrl = thumbnailBlob.url
      } catch (error) {
        console.error("Error generating thumbnail:", error)
        // Continue without thumbnail
      }
    }

    // Get image dimensions for images
    let dimensions = null
    if (file.type.startsWith("image/")) {
      try {
        const metadata = await sharp(fileBuffer).metadata()
        dimensions = `${metadata.width}x${metadata.height}`
      } catch (error) {
        console.error("Error getting image dimensions:", error)
      }
    }

    // Save to database
    const sql = getDb()
    const result = await sql`
      INSERT INTO media_files (
        user_id, filename, original_name, file_type, file_size, 
        mime_type, url, thumbnail_url, dimensions
      ) VALUES (
        ${user.id}, ${filename}, ${file.name || filename}, ${file.type}, ${file.size},
        ${file.type}, ${blob.url}, ${thumbnailUrl}, ${dimensions}
      )
      RETURNING *
    `

    const mediaFile = result[0]

    return NextResponse.json({
      success: true,
      file: {
        id: mediaFile.id,
        filename: mediaFile.filename,
        original_name: mediaFile.original_name,
        file_type: mediaFile.file_type,
        file_size: mediaFile.file_size,
        mime_type: mediaFile.mime_type,
        url: mediaFile.url,
        thumbnail_url: mediaFile.thumbnail_url,
        dimensions: mediaFile.dimensions,
        created_at: mediaFile.created_at,
      },
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
