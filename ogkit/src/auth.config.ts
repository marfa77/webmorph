import type { NextAuthConfig } from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { withBasePath } from '@/config/paths'

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: withBasePath('/login'),
  },
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? 'OGKit <onboarding@resend.dev>',
      apiKey: process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
