import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

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

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("No auth token found")
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; email: string }
    console.log("Token decoded:", { userId: decoded.userId })

    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at, is_admin
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("User not found in database")
      return null
    }

    console.log("User found:", users[0].email)
    return users[0] as User
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; email: string }
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function generateToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" })
}
