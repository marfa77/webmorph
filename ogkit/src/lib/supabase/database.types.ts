export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PlanTier = 'free' | 'pro' | 'scale'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          plan: PlanTier
          lemon_customer_id: string | null
          crypto_paid_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          plan?: PlanTier
          lemon_customer_id?: string | null
          crypto_paid_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan?: PlanTier
          lemon_customer_id?: string | null
          crypto_paid_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crypto_billing_orders: {
        Row: {
          order_id: string
          user_id: string
          plan: 'pro' | 'scale'
          status: 'pending' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: {
          order_id: string
          user_id: string
          plan: 'pro' | 'scale'
          status?: 'pending' | 'paid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          order_id?: string
          user_id?: string
          plan?: 'pro' | 'scale'
          status?: 'pending' | 'paid'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'crypto_billing_orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          prefix: string
          hash: string
          allowed_domains: string[]
          require_signed_urls: boolean
          last_used_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          prefix: string
          hash: string
          allowed_domains?: string[]
          require_signed_urls?: boolean
          last_used_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          prefix?: string
          hash?: string
          allowed_domains?: string[]
          require_signed_urls?: boolean
          last_used_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          id: number
          user_id: string
          api_key_id: string | null
          template: string
          cache_hit: boolean
          status: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          api_key_id?: string | null
          template: string
          cache_hit?: boolean
          status?: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          api_key_id?: string | null
          template?: string
          cache_hit?: boolean
          status?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usage_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      funnel_events: {
        Row: {
          id: number
          user_id: string | null
          email: string | null
          event_name: string
          source: string
          properties: Json
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          email?: string | null
          event_name: string
          source?: string
          properties?: Json
          notified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          email?: string | null
          event_name?: string
          source?: string
          properties?: Json
          notified_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'funnel_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          lemon_subscription_id: string
          lemon_variant_id: string
          lemon_customer_id: string
          plan: PlanTier
          status: SubscriptionStatus
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lemon_subscription_id: string
          lemon_variant_id: string
          lemon_customer_id: string
          plan: PlanTier
          status: SubscriptionStatus
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lemon_subscription_id?: string
          lemon_variant_id?: string
          lemon_customer_id?: string
          plan?: PlanTier
          status?: SubscriptionStatus
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      subscription_waitlist: {
        Row: {
          id: string
          email: string
          plan_interest: 'pro' | 'scale'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          plan_interest: 'pro' | 'scale'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan_interest?: 'pro' | 'scale'
          created_at?: string
        }
        Relationships: []
      }
    }
    /* `Views` and `Functions` must not use `Record<string, _>` — that widens `keyof` to `string` and breaks table `.update()` inference. */
    Views: Record<never, never>
    Functions: Record<never, never>
  }
}
