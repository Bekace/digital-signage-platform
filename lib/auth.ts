import { cookies } from "next/headers"
import { getDb } from "@/lib/db"

export interface User {
  id: number
  email: string
  name: string
  role: string
  company_name?: string
  plan_type?: string
  is_admin?: boolean
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const sql = getDb()

    // Verify token and get user
    const users = await sql`
      SELECT u.*, up.plan_type 
      FROM users u
      LEFT JOIN user_plans up ON u.id = up.user_id
      WHERE u.auth_token = ${token}
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
      company_name: user.company_name,
      plan_type: user.plan_type || "free",
      is_admin: user.is_admin || false,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function verifyAuth(request: Request): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization")
    const token =
      authHeader?.replace("Bearer ", "") || request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]

    if (!token) {
      return null
    }

    const sql = getDb()

    const users = await sql`
      SELECT u.*, up.plan_type 
      FROM users u
      LEFT JOIN user_plans up ON u.id = up.user_id
      WHERE u.auth_token = ${token}
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
      company_name: user.company_name,
      plan_type: user.plan_type || "free",
      is_admin: user.is_admin || false,
    }
  } catch (error) {
    console.error("Error verifying auth:", error)
    return null
  }
}
