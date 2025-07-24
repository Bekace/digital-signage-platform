import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company: string
  plan: string
  created_at: string
  is_admin: boolean
  admin_role?: string
  admin_permissions?: any
}

export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | null = null

    if (request) {
      // Try to get token from Authorization header
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }

      // If no Authorization header, try cookies
      if (!token) {
        token = request.cookies.get("auth-token")?.value || null
      }
    } else {
      // Server-side: try to get from cookies
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      token = cookieStore.get("auth-token")?.value || null
    }

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    const sql = neon(process.env.DATABASE_URL!)

    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.company,
        u.plan,
        u.created_at,
        CASE 
          WHEN au.role IS NOT NULL THEN true 
          ELSE false 
        END as is_admin,
        au.role as admin_role,
        au.permissions as admin_permissions
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      WHERE u.id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    return users[0] as User
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    const sql = neon(process.env.DATABASE_URL!)

    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.company,
        u.plan,
        u.created_at,
        CASE 
          WHEN au.role IS NOT NULL THEN true 
          ELSE false 
        END as is_admin,
        au.role as admin_role,
        au.permissions as admin_permissions
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      WHERE u.id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    return users[0] as User
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}
