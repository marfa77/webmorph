export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PlanTier = 'free' | 'pro' | 'scale'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'
