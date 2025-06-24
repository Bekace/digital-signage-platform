export interface PlanLimits {
  plan_type: string
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
  features: string[]
}

export interface UserUsage {
  media_files_count: number
  storage_used_bytes: number
  screens_count: number
  plan_type: string
}

export const PLAN_NAMES = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
} as const

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  if (bytes === -1) return "Unlimited"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatNumber(num: number): string {
  if (num === -1) return "Unlimited"
  return num.toLocaleString()
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0 // Unlimited
  return Math.min((used / limit) * 100, 100)
}

export function canUploadFile(
  currentUsage: UserUsage,
  planLimits: PlanLimits,
  fileSize: number,
): { allowed: boolean; reason?: string } {
  // Check file count limit
  if (planLimits.max_media_files !== -1 && currentUsage.media_files_count >= planLimits.max_media_files) {
    return {
      allowed: false,
      reason: `You've reached your plan's limit of ${formatNumber(planLimits.max_media_files)} media files. Upgrade to upload more.`,
    }
  }

  // Check storage limit
  if (
    planLimits.max_storage_bytes !== -1 &&
    currentUsage.storage_used_bytes + fileSize > planLimits.max_storage_bytes
  ) {
    return {
      allowed: false,
      reason: `This file would exceed your storage limit of ${formatBytes(planLimits.max_storage_bytes)}. Upgrade for more storage.`,
    }
  }

  return { allowed: true }
}

export const PLAN_LIMITS = {
  free: {
    max_media_files: 5,
    max_storage_bytes: 100 * 1024 * 1024, // 100MB
    max_screens: 1,
    price_monthly: 0,
    features: ["Basic media management", "1 screen", "Email support"],
  },
  pro: {
    max_media_files: 500,
    max_storage_bytes: 5 * 1024 * 1024 * 1024, // 5GB
    max_screens: 10,
    price_monthly: 29,
    features: ["Advanced media management", "10 screens", "Priority support", "Analytics"],
  },
  enterprise: {
    max_media_files: -1, // Unlimited
    max_storage_bytes: -1, // Unlimited
    max_screens: -1, // Unlimited
    price_monthly: 99,
    features: ["Unlimited everything", "Priority support", "Advanced analytics", "Custom branding"],
  },
} as const

export function getPlanLimits(planType: string): PlanLimits {
  const plan = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
  return {
    plan_type: planType,
    max_media_files: plan.max_media_files,
    max_storage_bytes: plan.max_storage_bytes,
    max_screens: plan.max_screens,
    price_monthly: plan.price_monthly,
    features: plan.features,
  }
}
