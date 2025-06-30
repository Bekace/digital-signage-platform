import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface DecodedToken {
  userId: number
  email: string
  iat?: number
  exp?: number
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company?: string
  plan: string
  created_at: string
  is_admin?: boolean
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    console.log("🔐 [AUTH] Starting token verification...")
    console.log("🔐 [AUTH] Token length:", token.length)
    console.log("🔐 [AUTH] Token preview:", `${token.substring(0, 20)}...${token.substring(token.length - 20)}`)

    const jwtSecret = process.env.JWT_SECRET
    console.log("🔐 [AUTH] JWT_SECRET exists:", !!jwtSecret)
    console.log("🔐 [AUTH] JWT_SECRET length:", jwtSecret?.length || 0)

    if (!jwtSecret) {
      console.error("❌ [AUTH] JWT_SECRET is not configured!")
      return null
    }

    // First try to decode without verification to see token structure
    let decodedWithoutVerification
    try {
      decodedWithoutVerification = jwt.decode(token)
      console.log("🔐 [AUTH] Token decoded without verification:", decodedWithoutVerification)
    } catch (decodeError) {
      console.error("❌ [AUTH] Failed to decode token:", decodeError)
      return null
    }

    // Now verify the token
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken
    console.log("✅ [AUTH] Token verified successfully:", decoded)
    return decoded
  } catch (error) {
    console.error("❌ [AUTH] Token verification failed:", error)
    console.error("❌ [AUTH] Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("❌ [AUTH] Error message:", error instanceof Error ? error.message : "Unknown")
    return null
  }
}

export function generateToken(payload: { userId: number; email: string }): string {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured")
  }
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" })
}

export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    console.log("🔐 [AUTH] ===== STARTING getCurrentUser =====")

    let token: string | null = null

    if (request) {
      // For API routes - check Authorization header first
      const authHeader = request.headers.get("authorization")
      console.log("🔐 [AUTH] Authorization header exists:", !!authHeader)
      console.log("🔐 [AUTH] Authorization header value:", authHeader ? `${authHeader.substring(0, 30)}...` : "none")

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7)
        console.log("🔐 [AUTH] Extracted Bearer token from header, length:", token.length)
      } else {
        console.log("🔐 [AUTH] No Bearer token in Authorization header, checking cookies...")
        // Fallback to cookies for API routes
        const cookieStore = request.cookies
        token = cookieStore.get("auth-token")?.value || null
        console.log("🔐 [AUTH] Cookie token found:", !!token)
        if (token) {
          console.log("🔐 [AUTH] Cookie token length:", token.length)
        }
      }
    } else {
      // For server components - use cookies
      console.log("🔐 [AUTH] Server component mode, checking cookies...")
      const cookieStore = await cookies()
      token = cookieStore.get("auth-token")?.value || null
      console.log("🔐 [AUTH] Server component cookie token found:", !!token)
    }

    if (!token) {
      console.log("❌ [AUTH] No token found anywhere")
      return null
    }

    console.log("🔐 [AUTH] Token found, verifying...")
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("❌ [AUTH] Token verification failed")
      return null
    }

    console.log(`🔐 [AUTH] Token verified successfully for user ID: ${decoded.userId}`)
    console.log(`🔐 [AUTH] Token email: ${decoded.email}`)

    // Get user from database
    console.log("🔐 [AUTH] Fetching user from database...")
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at, is_admin
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    console.log(`🔐 [AUTH] Database query returned ${users.length} users`)

    if (users.length === 0) {
      console.log(`❌ [AUTH] User ${decoded.userId} not found in database`)
      return null
    }

    const user = users[0] as User
    console.log(`✅ [AUTH] User found: ${user.email} (ID: ${user.id})`)
    console.log("🔐 [AUTH] ===== getCurrentUser COMPLETE =====")
    return user
  } catch (error) {
    console.error("❌ [AUTH] Critical error in getCurrentUser:", error)
    console.error("❌ [AUTH] Error stack:", error instanceof Error ? error.stack : "No stack")
    return null
  }
}

export async function requireAuth(request?: NextRequest): Promise<User> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}
