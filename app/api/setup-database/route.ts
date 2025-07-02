import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "DATABASE_URL environment variable is not set",
        },
        { status: 500 },
      )
    }

    const sql = getDb()

    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(255),
        company_address TEXT,
        company_phone VARCHAR(50),
        plan VARCHAR(50) DEFAULT 'free',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create devices table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        device_code VARCHAR(10) UNIQUE,
        status VARCHAR(50) DEFAULT 'offline',
        last_heartbeat TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create media table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration INTEGER,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully",
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database setup failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        message: "DATABASE_URL environment variable is not set",
      })
    }

    const sql = getDb()

    // Test database connection
    const result = await sql`SELECT 1 as test`

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      result,
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
