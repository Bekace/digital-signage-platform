import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  company?: string
  plan: string
  createdAt: string
  companyAddress?: string
  companyPhone?: string
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
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

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) return null

    // In a real app, you'd fetch the user from the database
    // For now, return the decoded token data
    return decoded as User
  } catch (error) {
    return null
  }
}

export function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
