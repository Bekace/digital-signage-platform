import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  plan: string
  created_at: string
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return null
    }

    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

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

export function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function createUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
  company?: string
}): Promise<User> {
  const hashedPassword = await hashPassword(userData.password)

  const users = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, company, plan)
    VALUES (${userData.email}, ${hashedPassword}, ${userData.firstName}, ${userData.lastName}, ${userData.company || ""}, 'free')
    RETURNING id, email, first_name, last_name, company, plan, created_at
  `

  return users[0] as User
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, company, plan, created_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      company: user.company,
      plan: user.plan,
      created_at: user.created_at,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}
