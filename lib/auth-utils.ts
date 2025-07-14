export interface AuthHeaders {
  Authorization?: string
  "Content-Type"?: string
}

export function getAuthHeaders(): AuthHeaders {
  const token = localStorage.getItem("token")

  if (!token) {
    console.warn("🔐 [AUTH UTILS] No token found in localStorage")
    return {}
  }

  // Validate token format (JWT should have 3 parts)
  const tokenParts = token.split(".")
  if (tokenParts.length !== 3) {
    console.error("🔐 [AUTH UTILS] Invalid token format - expected 3 parts, got", tokenParts.length)
    console.error("🔐 [AUTH UTILS] Token preview:", token.substring(0, 50) + "...")

    // Clear invalid token
    localStorage.removeItem("token")

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }

    return {}
  }

  // Validate token expiration
  try {
    const payload = JSON.parse(atob(tokenParts[1]))
    const isExpired = Date.now() > payload.exp * 1000

    if (isExpired) {
      console.error("🔐 [AUTH UTILS] Token is expired")
      localStorage.removeItem("token")

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      return {}
    }

    console.log("🔐 [AUTH UTILS] Valid token found for user:", payload.userId)
  } catch (error) {
    console.error("🔐 [AUTH UTILS] Error parsing token payload:", error)
    localStorage.removeItem("token")

    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }

    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function clearAuthToken(): void {
  localStorage.removeItem("token")
  console.log("🔐 [AUTH UTILS] Token cleared from localStorage")
}

export function isTokenValid(): boolean {
  const token = localStorage.getItem("token")

  if (!token) {
    return false
  }

  // Check format
  const tokenParts = token.split(".")
  if (tokenParts.length !== 3) {
    return false
  }

  // Check expiration
  try {
    const payload = JSON.parse(atob(tokenParts[1]))
    const isExpired = Date.now() > payload.exp * 1000
    return !isExpired
  } catch (error) {
    return false
  }
}

export function getTokenInfo(): {
  exists: boolean
  valid: boolean
  parts: number
  length: number
  userId?: number
  email?: string
  expiresAt?: string
  isExpired?: boolean
} {
  const token = localStorage.getItem("token")

  if (!token) {
    return {
      exists: false,
      valid: false,
      parts: 0,
      length: 0,
    }
  }

  const tokenParts = token.split(".")
  const info = {
    exists: true,
    valid: false,
    parts: tokenParts.length,
    length: token.length,
  }

  if (tokenParts.length === 3) {
    try {
      const payload = JSON.parse(atob(tokenParts[1]))
      const isExpired = Date.now() > payload.exp * 1000

      return {
        ...info,
        valid: !isExpired,
        userId: payload.userId,
        email: payload.email,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        isExpired,
      }
    } catch (error) {
      console.error("Error parsing token:", error)
    }
  }

  return info
}
