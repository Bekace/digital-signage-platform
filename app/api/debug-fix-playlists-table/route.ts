import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [DEBUG FIX] Starting playlists table fix...")

    // Add missing columns to playlists table
    const missingColumns = [
      { name: "scale_image", type: "VARCHAR(20)", default: "'fit'" },
      { name: "scale_video", type: "VARCHAR(20)", default: "'fit'" },
      { name: "scale_document", type: "VARCHAR(20)", default: "'fit'" },
      { name: "shuffle", type: "BOOLEAN", default: "false" },
      { name: "default_transition", type: "VARCHAR(50)", default: "'fade'" },
      { name: "transition_speed", type: "VARCHAR(20)", default: "'normal'" },
      { name: "auto_advance", type: "BOOLEAN", default: "true" },
      { name: "background_color", type: "VARCHAR(7)", default: "'#000000'" },
      { name: "text_overlay", type: "BOOLEAN", default: "false" },
    ]

    const results = []

    for (const column of missingColumns) {
      try {
        // Check if column exists
        const columnCheck = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'playlists' 
          AND column_name = ${column.name}
        `

        if (columnCheck.length === 0) {
          // Add the missing column
          await sql.unsafe(`
            ALTER TABLE playlists 
            ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}
          `)

          results.push({
            column: column.name,
            status: "added",
            message: `Column ${column.name} added successfully`,
          })

          console.log(`✅ Added column: ${column.name}`)
        } else {
          results.push({
            column: column.name,
            status: "exists",
            message: `Column ${column.name} already exists`,
          })

          console.log(`ℹ️ Column already exists: ${column.name}`)
        }
      } catch (error) {
        results.push({
          column: column.name,
          status: "error",
          message: `Failed to add ${column.name}: ${error.message}`,
        })

        console.error(`❌ Error adding column ${column.name}:`, error)
      }
    }

    // Update existing playlists with default values
    try {
      await sql`
        UPDATE playlists 
        SET 
          scale_image = COALESCE(scale_image, 'fit'),
          scale_video = COALESCE(scale_video, 'fit'),
          scale_document = COALESCE(scale_document, 'fit'),
          shuffle = COALESCE(shuffle, false),
          default_transition = COALESCE(default_transition, 'fade'),
          transition_speed = COALESCE(transition_speed, 'normal'),
          auto_advance = COALESCE(auto_advance, true),
          background_color = COALESCE(background_color, '#000000'),
          text_overlay = COALESCE(text_overlay, false)
        WHERE id IS NOT NULL
      `

      results.push({
        column: "update_existing",
        status: "success",
        message: "Updated existing playlists with default values",
      })

      console.log("✅ Updated existing playlists with default values")
    } catch (error) {
      results.push({
        column: "update_existing",
        status: "error",
        message: `Failed to update existing playlists: ${error.message}`,
      })

      console.error("❌ Error updating existing playlists:", error)
    }

    console.log("🔧 [DEBUG FIX] Playlists table fix completed")

    return NextResponse.json({
      success: true,
      message: "Playlists table fix completed",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🔧 [DEBUG FIX] Error fixing playlists table:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix playlists table",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
