import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { getDb } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  company: string
  role: string
  plan: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("No auth token found")
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("Token decoded:", decoded)

    const sql = getDb()
    const users = await sql`
      SELECT id, email, first_name, last_name, company, role, plan
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("User not found in database")
      return null
    }

    const user = users[0]
    console.log("User found:", user.email)
    return user
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET)
}
