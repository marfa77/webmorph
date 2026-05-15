import { relations } from 'drizzle-orm'
import {
  bigint,
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

export const planTierEnum = mysqlEnum('plan_tier', ['free', 'pro', 'scale'])
export const subscriptionStatusEnum = mysqlEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
])

/** Auth.js user table (SQL name `user`) + OGKit profile columns */
export const users = mysqlTable('user', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: varchar('image', { length: 255 }),
  plan: planTierEnum.notNull().default('free'),
  lemonCustomerId: varchar('lemon_customer_id', { length: 255 }),
  cryptoPaidUntil: timestamp('crypto_paid_until', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
})

export const accounts = mysqlTable(
  'account',
  {
    userId: varchar('userId', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: varchar('refresh_token', { length: 255 }),
    access_token: varchar('access_token', { length: 255 }),
    expires_at: int('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: varchar('id_token', { length: 2048 }),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  }),
)

export const sessions = mysqlTable('session', {
  sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
  userId: varchar('userId', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = mysqlTable(
  'verificationToken',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
)

export const apiKeys = mysqlTable(
  'api_keys',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull().default('default'),
    prefix: varchar('prefix', { length: 64 }).notNull(),
    hash: varchar('hash', { length: 255 }).notNull(),
    allowedDomains: json('allowed_domains').$type<string[]>().notNull(),
    requireSignedUrls: boolean('require_signed_urls').notNull().default(false),
    lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_api_keys_user_id').on(t.userId),
    prefixIdx: index('idx_api_keys_prefix').on(t.prefix),
  }),
)

export const usageEvents = mysqlTable(
  'usage_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    apiKeyId: varchar('api_key_id', { length: 36 }).references(() => apiKeys.id, { onDelete: 'set null' }),
    template: varchar('template', { length: 512 }).notNull(),
    cacheHit: boolean('cache_hit').notNull().default(false),
    status: int('status').notNull().default(200),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('idx_usage_events_user_id_created_at').on(t.userId, t.createdAt),
  }),
)

export const subscriptions = mysqlTable(
  'subscriptions',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lemonSubscriptionId: varchar('lemon_subscription_id', { length: 255 }).notNull().unique(),
    lemonVariantId: varchar('lemon_variant_id', { length: 255 }).notNull(),
    lemonCustomerId: varchar('lemon_customer_id', { length: 255 }).notNull(),
    plan: planTierEnum.notNull(),
    status: subscriptionStatusEnum.notNull(),
    currentPeriodStart: timestamp('current_period_start', { mode: 'date' }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    userIdx: index('idx_subscriptions_user_id').on(t.userId),
  }),
)

export const funnelEvents = mysqlTable(
  'funnel_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    email: varchar('email', { length: 255 }),
    eventName: varchar('event_name', { length: 128 }).notNull(),
    source: varchar('source', { length: 128 }).notNull().default('server'),
    properties: json('properties').$type<Record<string, unknown>>().notNull(),
    notifiedAt: timestamp('notified_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    eventCreatedIdx: index('idx_funnel_events_event_name_created_at').on(t.eventName, t.createdAt),
    userCreatedIdx: index('idx_funnel_events_user_id_created_at').on(t.userId, t.createdAt),
    emailCreatedIdx: index('idx_funnel_events_email_created_at').on(t.email, t.createdAt),
  }),
)

export const subscriptionWaitlist = mysqlTable(
  'subscription_waitlist',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: varchar('email', { length: 255 }).notNull(),
    planInterest: mysqlEnum('plan_interest', ['pro', 'scale']).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    emailPlanUniq: uniqueIndex('subscription_waitlist_email_plan').on(t.email, t.planInterest),
  }),
)

export const cryptoBillingOrders = mysqlTable(
  'crypto_billing_orders',
  {
    orderId: varchar('order_id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: mysqlEnum('plan', ['pro', 'scale']).notNull(),
    status: mysqlEnum('status', ['pending', 'paid']).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    userIdx: index('idx_crypto_billing_orders_user_id').on(t.userId),
  }),
)

/** One Gumroad Pro license → one account; `license_key_hash` is sha256(pepper:key) (see `hashGumroadLicenseKey`). */
export const gumroadRedemptions = mysqlTable(
  'gumroad_redemptions',
  {
    licenseKeyHash: varchar('license_key_hash', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    redeemedAt: timestamp('redeemed_at', { mode: 'date' }).notNull().defaultNow(),
    gumroadSaleId: varchar('gumroad_sale_id', { length: 255 }),
  },
  (t) => ({
    userIdx: index('idx_gumroad_redemptions_user_id').on(t.userId),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  usageEvents: many(usageEvents),
}))

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
  usageEvents: many(usageEvents),
}))
