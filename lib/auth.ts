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
  role?: string
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

export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | null = null

    if (request) {
      // For API routes - check Authorization header first
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7)
        console.log("🔐 [AUTH] Found token in Authorization header")
      } else {
        // Fallback to cookies for API routes
        const cookieStore = request.cookies
        token = cookieStore.get("auth-token")?.value || null
        if (token) {
          console.log("🔐 [AUTH] Found token in cookies")
        }
      }
    } else {
      // For server components - use cookies
      const cookieStore = await cookies()
      token = cookieStore.get("auth-token")?.value || null
      if (token) {
        console.log("🔐 [AUTH] Found token in server cookies")
      }
    }

    if (!token) {
      console.log("🔐 [AUTH] No token found")
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("🔐 [AUTH] Token verification failed")
      return null
    }

    console.log("🔐 [AUTH] Token verified for user:", decoded.userId)

    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at, role
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("🔐 [AUTH] User not found in database")
      return null
    }

    console.log("🔐 [AUTH] User found:", users[0].email)
    return users[0] as User
  } catch (error) {
    console.error("❌ [AUTH] Error in getCurrentUser:", error)
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
