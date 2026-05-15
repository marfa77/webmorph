'use server'

import { signOut as authSignOut } from '@/auth'
import { withBasePath } from '@/config/paths'

export async function signOut() {
  await authSignOut({ redirectTo: withBasePath('/') })
}
