import { createBrowserClient } from '@supabase/ssr'

let sessionInitialized = false

export function isSessionInitialized() {
  return sessionInitialized
}

export function setSessionInitialized(val: boolean) {
  sessionInitialized = val
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
