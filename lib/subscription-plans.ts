import type { SubscriptionPlan } from "./types"

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Basic deduplication",
    price: 0,
    interval: "monthly",
    credits: 1000,
    features: ["Remove duplicates from files", "Basic file processing", "1,000 credits/month"],
  },
  {
    id: "starter-monthly",
    name: "Starter",
    description: "For small businesses",
    price: 19,
    interval: "monthly",
    credits: 20000,
    features: [
      "Everything in Free plan",
      "Custom suppression lists",
      "Scrub against your lists",
      "20,000 credits/month",
    ],
  },
  {
    id: "pro-monthly",
    name: "Professional",
    description: "For growing businesses",
    price: 49,
    interval: "monthly",
    credits: 100000,
    features: ["Everything in Starter plan", "Priority support", "Advanced analytics", "100,000 credits/month"],
    popular: true,
  },
  {
    id: "business-monthly",
    name: "Business",
    description: "For larger organizations",
    price: 99,
    interval: "monthly",
    credits: 250000,
    features: ["Everything in Professional plan", "Dedicated account manager", "API access", "250,000 credits/month"],
  },
  {
    id: "starter-yearly",
    name: "Starter",
    description: "For small businesses",
    price: 190,
    interval: "yearly",
    credits: 20000,
    features: [
      "Everything in Free plan",
      "Custom suppression lists",
      "Scrub against your lists",
      "20,000 credits/month",
      "Save 17% with annual billing",
    ],
  },
  {
    id: "pro-yearly",
    name: "Professional",
    description: "For growing businesses",
    price: 490,
    interval: "yearly",
    credits: 100000,
    features: [
      "Everything in Starter plan",
      "Priority support",
      "Advanced analytics",
      "100,000 credits/month",
      "Save 17% with annual billing",
    ],
    popular: true,
  },
  {
    id: "business-yearly",
    name: "Business",
    description: "For larger organizations",
    price: 990,
    interval: "yearly",
    credits: 250000,
    features: [
      "Everything in Professional plan",
      "Dedicated account manager",
      "API access",
      "250,000 credits/month",
      "Save 17% with annual billing",
    ],
  },
]

export const PAY_PER_USE_PACKAGES = [
  { id: "20k", name: "Basic", credits: 20000, price: 10 },
  { id: "50k", name: "Standard", credits: 50000, price: 22, savings: "10%" },
  { id: "100k", name: "Premium", credits: 100000, price: 40, savings: "20%" },
  { id: "500k", name: "Enterprise", credits: 500000, price: 175, savings: "30%" },
]

export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)
}

export function getMonthlyPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.interval === "monthly" && plan.id !== "free")
}

export function getYearlyPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.interval === "yearly")
}

export function getFreePlan(): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === "free")!
}
