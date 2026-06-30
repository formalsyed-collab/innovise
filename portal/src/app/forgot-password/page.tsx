'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mail, ShieldAlert, ArrowLeft, CheckCircle2, Award } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-ink px-4 py-12 relative overflow-hidden select-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-fire opacity-[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky opacity-[0.08] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Identity */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-fire/10 mb-3 overflow-hidden">
            <img src="/logo.png" alt="Innovise Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            INNOVISE
          </h1>
          <p className="text-sm text-dim mt-1 font-medium tracking-wide text-gray-400">
            SECURE CLIENT PORTAL
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 border border-white/10 bg-white/[0.04] backdrop-blur-md">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Reset Your Password
          </h2>
          <p className="text-xs text-gray-400 text-center mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose/10 border border-rose/20 text-rose text-sm flex items-start gap-3 animate-fade-in">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-jade/20 text-jade mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white">Reset Link Sent</h3>
              <p className="text-xs text-gray-400">
                Check your inbox for a message from Innovise containing instructions to reset your password.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-fire3 hover:text-fire transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-11 pr-4 py-3 bg-ink2/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-fire to-fire2 hover:opacity-95 shadow-lg shadow-fire/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} Innovise Consultant. All Rights Reserved.
        </p>
      </div>
    </main>
  )
}
