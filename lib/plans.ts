export interface Plan {
  id: string
  name: string
  price: number
  interval: "monthly" | "annual"
  features: string[]
  maxScreens: number
  maxStorage: number // in GB
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "monthly",
    features: ["1 screen", "1GB storage", "Basic templates", "Email support"],
    maxScreens: 1,
    maxStorage: 1,
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: 15,
    interval: "monthly",
    features: [
      "Unlimited screens",
      "10GB storage per screen",
      "Premium templates",
      "Priority support",
      "Custom branding",
      "Analytics",
    ],
    maxScreens: -1, // unlimited
    maxStorage: 10,
  },
  {
    id: "annual",
    name: "Pro Annual",
    price: 150,
    interval: "annual",
    features: [
      "Unlimited screens",
      "20GB storage per screen",
      "Premium templates",
      "Priority support",
      "Custom branding",
      "Advanced analytics",
      "2 months free",
    ],
    maxScreens: -1, // unlimited
    maxStorage: 20,
  },
]

export function getPlanById(planId: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === planId)
}

export function calculatePlanCost(planId: string, screenCount: number): number {
  const plan = getPlanById(planId)
  if (!plan) return 0

  if (plan.id === "free") return 0
  if (plan.maxScreens === -1) return plan.price // unlimited screens

  return plan.price * Math.min(screenCount, plan.maxScreens)
}

export function canAddScreen(planId: string, currentScreenCount: number): boolean {
  const plan = getPlanById(planId)
  if (!plan) return false

  if (plan.maxScreens === -1) return true // unlimited
  return currentScreenCount < plan.maxScreens
}

export function getStorageLimit(planId: string, screenCount: number): number {
  const plan = getPlanById(planId)
  if (!plan) return 0

  if (plan.maxScreens === -1) {
    return plan.maxStorage * screenCount // per screen
  }

  return plan.maxStorage
}
