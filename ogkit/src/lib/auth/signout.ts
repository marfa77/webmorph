'use server'

import { signOut as authSignOut } from '@/auth'
import { publicPath } from '@/config/paths'

export async function signOut() {
  await authSignOut({ redirectTo: publicPath('/') })
}
