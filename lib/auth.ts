import jwt from "jsonwebtoken"

export interface DecodedToken {
  userId: number
  email: string
  iat?: number
  exp?: number
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
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
