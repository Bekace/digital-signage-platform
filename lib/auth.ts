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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
    return decoded
  } catch (error) {
    console.error("🔐 [AUTH] Token verification failed:", error)
    return null
  }
}

export function generateToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" })
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
    console.log("🔐 [AUTH] Starting getCurrentUser...")

    let token: string | null = null

    if (request) {
      // For API routes - check Authorization header first
      const authHeader = request.headers.get("authorization")
      console.log("🔐 [AUTH] Authorization header:", authHeader ? "Bearer ***" : "not found")

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7)
        console.log("🔐 [AUTH] Extracted Bearer token from header")
      } else {
        // Fallback to cookies for API routes
        const cookieStore = request.cookies
        token = cookieStore.get("auth-token")?.value || null
        console.log("🔐 [AUTH] Cookie token found:", !!token)
      }
    } else {
      // For server components - use cookies
      const cookieStore = await cookies()
      token = cookieStore.get("auth-token")?.value || null
      console.log("🔐 [AUTH] Server component cookie token found:", !!token)
    }

    if (!token) {
      console.log("❌ [AUTH] No token found")
      return null
    }

    console.log("🔐 [AUTH] Verifying token...")
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("❌ [AUTH] Token verification failed")
      return null
    }

    console.log(`🔐 [AUTH] Token verified for user ID: ${decoded.userId}`)

    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at, is_admin
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log(`❌ [AUTH] User ${decoded.userId} not found in database`)
      return null
    }

    const user = users[0] as User
    console.log(`✅ [AUTH] User found: ${user.email} (ID: ${user.id})`)
    return user
  } catch (error) {
    console.error("❌ [AUTH] Error:", error)
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
