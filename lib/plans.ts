export interface Plan {
  id: string
  name: string
  price: number
  maxScreens: number
  maxStorage: number // in GB
  features: string[]
}

export const PLANS: Record<string, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 9,
    maxScreens: 3,
    maxStorage: 1,
    features: ["Up to 3 screens", "1GB storage", "Basic templates", "Email support"],
  },
  professional: {
    id: "professional",
    name: "Professional",
    price: 29,
    maxScreens: 15,
    maxStorage: 10,
    features: ["Up to 15 screens", "10GB storage", "Premium templates", "Advanced scheduling", "Priority support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    maxScreens: -1, // unlimited
    maxStorage: 100,
    features: ["Unlimited screens", "100GB storage", "Custom templates", "API access", "24/7 phone support"],
  },
}

export function getPlan(planId: string): Plan | null {
  return PLANS[planId] || null
}

export function getDefaultPlan(): Plan {
  return PLANS.starter
}

export function canUploadFile(currentUsage: number, fileSize: number, planId: string): boolean {
  const plan = getPlan(planId)
  if (!plan) return false

  const maxBytes = plan.maxStorage * 1024 * 1024 * 1024 // Convert GB to bytes
  return currentUsage + fileSize <= maxBytes
}

export function canAddScreen(currentScreens: number, planId: string): boolean {
  const plan = getPlan(planId)
  if (!plan) return false

  if (plan.maxScreens === -1) return true // unlimited
  return currentScreens < plan.maxScreens
}
