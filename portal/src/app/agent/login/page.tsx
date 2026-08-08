'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { lookupEmailByPhone } from './actions'

const normalizePhone = (phone: string) => {
  return phone.replace(/[^\d+]/g, '')
}

const getAuthEmail = (identifier: string) => {
  const normalized = normalizePhone(identifier)
  
  // Admin phone number mappings
  if (normalized === '+919506166560' || normalized === '9506166560' || normalized === '919506166560') {
    return 'officialtaxinn@gmail.com'
  }

  // If it's already an email, return it
  if (identifier.includes('@')) {
    return identifier.trim()
  }

  return `phone_${normalized}@innovise.local`
}

export default function AgentLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let signInError = null;

      // Check if phone string includes @, indicating an email
      if (phone.includes('@')) {
        const { error } = await supabase.auth.signInWithPassword({
          email: phone.trim(),
          password,
        })
        signInError = error;
      } else {
        // If it's a mobile number, lookup the email in profiles
        const normalizedPhone = normalizePhone(phone);
        const resolvedEmail = await lookupEmailByPhone(normalizedPhone);

        if (resolvedEmail) {
          // If we found their email, login using the email
          const { error } = await supabase.auth.signInWithPassword({
            email: resolvedEmail,
            password,
          })
          signInError = error;
        } else {
          // If email not found, attempt to use virtual email fallback or fail
          const authEmail = `phone_${normalizedPhone}@innovise.local`
          const { error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password,
          })
          signInError = error;
        }
      }

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw signInError
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      // Verify if the user is actually an agent
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
          
        if (profile?.role !== 'agent' && profile?.role !== 'admin') {
          await supabase.auth.signOut()
          throw new Error("You do not have agent access privileges.")
        }

        // Sync user_metadata role if it's out of sync
        if (user.user_metadata?.role !== profile?.role) {
          await supabase.auth.updateUser({
            data: { role: profile?.role }
          })
        }
      } else {
        throw new Error("Failed to authenticate user.")
      }

      router.push('/agent/dashboard')

    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-ink px-4 py-12 relative overflow-hidden select-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-fire opacity-[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky opacity-[0.08] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-fire/10 mb-3 overflow-hidden">
            <img src="/logo.png" alt="Innovise Logo" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white tracking-tight">
            Agent Partner Login (v2)
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Access your commissions and track client progress.
          </p>
        </div>

        <div className="rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 border border-white/15 bg-ink2/90 backdrop-blur-md shadow-fire/5">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email or Mobile Number</label>
              <input type="text" required placeholder="agent@email.com or +91..." value={phone} onChange={e => setPhone(e.target.value)} className="block w-full px-4 py-3 bg-ink/75 border border-white/15 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Password</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="block w-full px-4 py-3 bg-ink/75 border border-white/15 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-fire to-fire2 hover:opacity-95 shadow-lg shadow-fire/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
