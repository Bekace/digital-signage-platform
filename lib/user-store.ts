// Simple in-memory user store for demo purposes
// In production, this would be replaced with a proper database

interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  company?: string
  plan: string
  createdAt: string
  companyAddress?: string
  companyPhone?: string
  resetToken?: string
  resetTokenExpiry?: Date
}

interface Session {
  token: string
  userId: string
  expiresAt: Date
}

interface Device {
  id: string
  name: string
  code: string
  status: "online" | "offline"
  lastSeen: string
  userId: string
  registeredAt: string
}

// In-memory stores
const users: Map<string, User> = new Map()
const sessions: Map<string, Session> = new Map()
const devices: Map<string, Device> = new Map()
const deviceCodes: Map<string, { userId: string; expiresAt: Date }> = new Map()

// Demo user for testing
users.set("demo@signagecloud.com", {
  id: "demo-user-1",
  email: "demo@signagecloud.com",
  password: "password123",
  firstName: "Demo",
  lastName: "User",
  company: "SignageCloud Demo",
  plan: "monthly",
  createdAt: new Date().toISOString(),
})

// User management
export function createUser(userData: Omit<User, "id" | "createdAt">): User {
  const user: User = {
    ...userData,
    id: Math.random().toString(36).substring(2, 15),
    createdAt: new Date().toISOString(),
  }
  users.set(user.id, user)
  return user
}

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find((user) => user.email === email)
}

export function getUserById(id: string): User | undefined {
  return users.get(id)
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const user = users.get(id)
  if (!user) return null

  const updatedUser = { ...user, ...updates }
  users.set(id, updatedUser)
  return updatedUser
}

// Device management
export function generateDeviceCode(userId: string): string {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  deviceCodes.set(code, { userId, expiresAt })

  // Clean up expired codes
  setTimeout(
    () => {
      deviceCodes.delete(code)
    },
    10 * 60 * 1000,
  )

  return code
}

export function validateDeviceCode(code: string): { userId: string } | null {
  const codeData = deviceCodes.get(code)
  if (!codeData || codeData.expiresAt < new Date()) {
    deviceCodes.delete(code)
    return null
  }
  return { userId: codeData.userId }
}

export function registerDevice(code: string, deviceName: string): Device | null {
  const codeData = validateDeviceCode(code)
  if (!codeData) return null

  const device: Device = {
    id: Math.random().toString(36).substring(2, 15),
    name: deviceName,
    code,
    status: "online",
    lastSeen: new Date().toISOString(),
    userId: codeData.userId,
    registeredAt: new Date().toISOString(),
  }

  devices.set(device.id, device)
  deviceCodes.delete(code) // Remove used code

  return device
}

export function getDevicesByUserId(userId: string): Device[] {
  return Array.from(devices.values()).filter((device) => device.userId === userId)
}

export function getDeviceById(id: string): Device | undefined {
  return devices.get(id)
}

export function updateDeviceHeartbeat(deviceId: string): boolean {
  const device = devices.get(deviceId)
  if (!device) return false

  device.status = "online"
  device.lastSeen = new Date().toISOString()
  devices.set(deviceId, device)

  return true
}

export class UserStore {
  static createUser(userData: {
    firstName: string
    lastName: string
    email: string
    company?: string
    password: string
    plan: string
  }): { success: boolean; message: string; user?: Omit<User, "password"> } {
    const { firstName, lastName, email, company, password, plan } = userData

    // Validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
      return { success: false, message: "All required fields must be filled" }
    }

    if (!email.includes("@") || !email.includes(".")) {
      return { success: false, message: "Please enter a valid email address" }
    }

    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long" }
    }

    // Check if user already exists
    if (users.has(email.toLowerCase())) {
      return { success: false, message: "An account with this email already exists" }
    }

    // Create new user
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company?.trim() || undefined,
      password, // In production, hash this
      plan,
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    users.set(user.email, user)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return {
      success: true,
      message: "Account created successfully",
      user: userWithoutPassword,
    }
  }

  static authenticateUser(
    email: string,
    password: string,
  ): {
    success: boolean
    message: string
    user?: Omit<User, "password">
    token?: string
  } {
    const user = users.get(email.toLowerCase())

    if (!user) {
      return { success: false, message: "Invalid email or password" }
    }

    if (user.password !== password) {
      return { success: false, message: "Invalid email or password" }
    }

    if (!user.isActive) {
      return { success: false, message: "Account is deactivated" }
    }

    // Create session token
    const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`
    const session: Session = {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    sessions.set(token, session)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return {
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    }
  }

  static validateToken(token: string): {
    valid: boolean
    user?: Omit<User, "password">
  } {
    const session = sessions.get(token)

    if (!session || session.expiresAt < new Date()) {
      if (session) sessions.delete(token) // Clean up expired session
      return { valid: false }
    }

    const user = Array.from(users.values()).find((u) => u.id === session.userId)
    if (!user || !user.isActive) {
      return { valid: false }
    }

    const { password: _, ...userWithoutPassword } = user
    return { valid: true, user: userWithoutPassword }
  }

  static getAllUsers(): Omit<User, "password">[] {
    return Array.from(users.values()).map(({ password, ...user }) => user)
  }

  static getUserCount(): number {
    return users.size
  }
}

// Initialize with some demo data
const demoUser = createUser({
  email: "demo@example.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm", // 'password123'
  firstName: "Demo",
  lastName: "User",
  company: "Demo Company",
  plan: "monthly",
})

// Add some demo devices
const demoDevice1: Device = {
  id: "demo-device-1",
  name: "Lobby Display",
  code: "DEMO01",
  status: "online",
  lastSeen: new Date().toISOString(),
  userId: demoUser.id,
  registeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
}

const demoDevice2: Device = {
  id: "demo-device-2",
  name: "Conference Room",
  code: "DEMO02",
  status: "offline",
  lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  userId: demoUser.id,
  registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
}

devices.set(demoDevice1.id, demoDevice1)
devices.set(demoDevice2.id, demoDevice2)
