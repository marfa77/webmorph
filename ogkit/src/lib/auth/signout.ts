'use server'

import { createClient } from '@/lib/supabase/server'
import { withBasePath } from '@/config/paths'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(withBasePath('/'))
}
