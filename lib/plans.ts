export const PLAN_LIMITS = {
  free: {
    maxMediaFiles: 5,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB
    maxScreens: 1,
    priceMonthly: 0,
    features: ["Basic media management", "1 screen", "Email support"],
  },
  pro: {
    maxMediaFiles: 100,
    maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10GB
    maxScreens: 10,
    priceMonthly: 29,
    features: ["Advanced media management", "10 screens", "Priority support", "Analytics"],
  },
  enterprise: {
    maxMediaFiles: 1000,
    maxStorageBytes: 100 * 1024 * 1024 * 1024, // 100GB
    maxScreens: 100,
    priceMonthly: 99,
    features: ["Unlimited media management", "100 screens", "24/7 support", "Advanced analytics", "Custom branding"],
  },
}

export const PLAN_NAMES = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export function canUploadFile(
  usage: { mediaFiles: number; storageBytes: number },
  limits: { maxMediaFiles: number; maxStorageBytes: number },
  fileSize: number,
): { allowed: boolean; reason?: string } {
  if (usage.mediaFiles >= limits.maxMediaFiles) {
    return {
      allowed: false,
      reason: `You have reached your file limit of ${limits.maxMediaFiles} files`,
    }
  }

  if (usage.storageBytes + fileSize > limits.maxStorageBytes) {
    return {
      allowed: false,
      reason: `This file would exceed your storage limit of ${formatBytes(limits.maxStorageBytes)}`,
    }
  }

  return { allowed: true }
}

export function getPlanLimits(planType: string) {
  return PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
}
