export interface Plan {
  id: string
  name: string
  price: number
  interval: "monthly" | "yearly"
  features: string[]
  limits: {
    devices: number
    storage: number // in GB
    bandwidth: number // in GB
  }
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "monthly",
    features: ["1 device", "1GB storage", "Basic templates", "Community support"],
    limits: {
      devices: 1,
      storage: 1,
      bandwidth: 5,
    },
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    interval: "monthly",
    features: ["5 devices", "10GB storage", "All templates", "Email support", "Custom branding"],
    limits: {
      devices: 5,
      storage: 10,
      bandwidth: 50,
    },
  },
  {
    id: "professional",
    name: "Professional",
    price: 79,
    interval: "monthly",
    features: [
      "25 devices",
      "100GB storage",
      "All templates",
      "Priority support",
      "Custom branding",
      "Advanced analytics",
      "API access",
    ],
    limits: {
      devices: 25,
      storage: 100,
      bandwidth: 500,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    interval: "monthly",
    features: [
      "Unlimited devices",
      "1TB storage",
      "All templates",
      "24/7 phone support",
      "Custom branding",
      "Advanced analytics",
      "API access",
      "White-label solution",
      "Custom integrations",
    ],
    limits: {
      devices: -1, // unlimited
      storage: 1000,
      bandwidth: 5000,
    },
  },
]

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id)
}

export function getDefaultPlan(): Plan {
  return PLANS[0] // Free plan
}

export function isFeatureAvailable(planId: string, feature: string): boolean {
  const plan = getPlanById(planId)
  return plan ? plan.features.includes(feature) : false
}

export function canAddDevice(planId: string, currentDeviceCount: number): boolean {
  const plan = getPlanById(planId)
  if (!plan) return false

  return plan.limits.devices === -1 || currentDeviceCount < plan.limits.devices
}

export function canUploadMedia(planId: string, currentStorageUsed: number, fileSize: number): boolean {
  const plan = getPlanById(planId)
  if (!plan) return false

  const newTotal = currentStorageUsed + fileSize / (1024 * 1024 * 1024) // Convert to GB
  return newTotal <= plan.limits.storage
}
