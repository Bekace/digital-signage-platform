import { cookies } from "next/headers"
import { getDb } from "@/lib/db"
import jwt from "jsonwebtoken"

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  plan: string
  created_at: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("No auth token found")
      return null
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set")
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; email: string }
    console.log("Token decoded:", { userId: decoded.userId })

    const sql = getDb()

    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at
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
