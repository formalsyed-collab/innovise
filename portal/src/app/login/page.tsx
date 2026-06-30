'use client'

import { useState, useEffect } from 'react'
import { createClient, setSessionInitialized } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Award, User, Phone, MapPin, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const normalizePhone = (phone: string) => {
  return phone.replace(/[^\d+]/g, '')
}

const getAuthEmail = (identifier: string) => {
  const normalized = normalizePhone(identifier)
  
  // Admin phone number mappings
  if (normalized === '+919506166560' || normalized === '9506166560' || normalized === '919506166560') {
    return 'officialtaxinn@gmail.com'
  }
  
  // Seed Demo Client mapping
  if (normalized === '+919876543210' || normalized === '9876543210' || normalized === '919876543210') {
    return 'client@innovise.in'
  }

  // If it's already an email, return it
  if (identifier.includes('@')) {
    return identifier.trim()
  }

  // Otherwise, use virtual email
  return `phone_${normalized}@innovise.local`
}

const TRANSLATIONS = {
  en: {
    portalTitle: "SECURE CLIENT PORTAL",
    signInTitle: "Sign In to Your Account",
    signUpTitle: "Create a Client Account",
    fullNameLabel: "Full Name *",
    fullNamePlaceholder: "e.g. Rahul Sharma",
    phoneLabel: "Mobile Number *",
    phoneEmailLabel: "Mobile Number or Email *",
    phonePlaceholder: "e.g. +91 99999 99999",
    passwordLabel: "Password *",
    forgotPassword: "Forgot Password?",
    emailLabel: "Email Address (Optional)",
    emailPlaceholder: "name@company.com",
    addressLabel: "Billing Address",
    addressPlaceholder: "e.g. 13/396, Merchant Chamber, Kanpur",
    signInBtn: "Sign In",
    registerBtn: "Register Account",
    newCustomer: "New customer? ",
    createAccount: "Create an Account",
    alreadyAccount: "Already have an account? ",
    signInInstead: "Sign In Instead",
    registrationSubmitted: "Registration Submitted",
    regSuccessDesc: "Your portal access registration is successful! If email verification is enabled, check your inbox to confirm your email. Otherwise, you can now log in using your credentials.",
    goToSignIn: "Go to Sign In",
    signingIn: "Signing In...",
    registering: "Registering..."
  },
  hi: {
    portalTitle: "सुरक्षित क्लाइंट पोर्टल",
    signInTitle: "अपने खाते में लॉग इन करें",
    signUpTitle: "नया क्लाइंट खाता बनाएं",
    fullNameLabel: "पूरा नाम *",
    fullNamePlaceholder: "जैसे: राहुल शर्मा",
    phoneLabel: "मोबाइल नंबर *",
    phoneEmailLabel: "मोबाइल नंबर या ईमेल *",
    phonePlaceholder: "जैसे: +91 99999 99999",
    passwordLabel: "पासवर्ड *",
    forgotPassword: "पासवर्ड भूल गए?",
    emailLabel: "ईमेल पता (वैकल्पिक)",
    emailPlaceholder: "name@company.com",
    addressLabel: "बिलिंग पता",
    addressPlaceholder: "जैसे: 13/396, मर्चेंट चैंबर, कानपुर",
    signInBtn: "लॉग इन करें",
    registerBtn: "खाता बनाएं",
    newCustomer: "नए ग्राहक हैं? ",
    createAccount: "नया खाता बनाएं",
    alreadyAccount: "पहले से खाता है? ",
    signInInstead: "लॉग इन करें",
    registrationSubmitted: "पंजीकरण सफल हुआ",
    regSuccessDesc: "आपका पोर्टल पंजीकरण सफल हो गया है! यदि ईमेल सत्यापन सक्रिय है, तो कृपया अपना ईमेल देखें। अन्यथा अब आप लॉग इन कर सकते हैं।",
    goToSignIn: "लॉग इन पर जाएं",
    signingIn: "लॉग इन हो रहा है...",
    registering: "पंजीकरण हो रहा है..."
  }
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  // Language state
  const [lang, setLang] = useState<'en' | 'hi'>('en')

  useEffect(() => {
    const savedLang = localStorage.getItem('portal_lang') as 'en' | 'hi'
    if (savedLang === 'hi' || savedLang === 'en') {
      setLang(savedLang)
    }
  }, [])

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en'
    setLang(nextLang)
    localStorage.setItem('portal_lang', nextLang)
  }

  const t = TRANSLATIONS[lang]

  // Common Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sign Up Mode States
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phoneVal, setPhoneVal] = useState('')
  const [addressVal, setAddressVal] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSignUpSuccess(false)

    try {
      if (isSignUp) {
        // Sign Up Flow via Server Action / API Route to bypass email confirmation checks on local email addresses
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email || undefined,
            password,
            fullName,
            phone: phoneVal,
            address: addressVal
          })
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Registration failed. Please try again.')
          setLoading(false)
          return
        }

        setSignUpSuccess(true)
        setLoading(false)
      } else {
        // Sign In Flow
        const authEmail = getAuthEmail(phoneVal)

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          setLoading(false)
          return
        }

        // Set session as initialized for this tab session
        setSessionInitialized(true)

        // Router refresh triggers middleware execution to redirect to dashboard/admin
        router.refresh()
        router.push('/')
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setSignUpSuccess(false)
    // Clear inputs
    setFullName('')
    setPhoneVal('')
    setAddressVal('')
    setEmail('')
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-ink px-4 py-12 relative overflow-hidden select-none">
      {/* Background abstract gradient circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-fire opacity-[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky opacity-[0.08] blur-[120px] pointer-events-none" />

      {/* Language Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer backdrop-blur-sm shadow-sm"
        >
          🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </div>

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
            {t.portalTitle}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 border border-white/15 bg-ink2/90 backdrop-blur-md shadow-fire/5">
          
          {signUpSuccess ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-jade/20 text-jade mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">{t.registrationSubmitted}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.regSuccessDesc}
              </p>
              <button
                onClick={toggleAuthMode}
                className="w-full mt-4 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-fire to-fire2 hover:opacity-95 shadow-lg shadow-fire/20 transition-all cursor-pointer"
              >
                {t.goToSignIn}
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-6 text-center">
                {isSignUp ? t.signUpTitle : t.signInTitle}
              </h2>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose/10 border border-rose/20 text-rose text-sm flex items-start gap-3 animate-fade-in">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                
                {/* Full Name field (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      {t.fullNameLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.fullNamePlaceholder}
                        className="block w-full pl-11 pr-4 py-3 bg-ink/75 border border-white/15 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile Number / Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    {isSignUp ? t.phoneLabel : t.phoneEmailLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      {isSignUp || !phoneVal.includes('@') ? (
                        <Phone className="w-5 h-5" />
                      ) : (
                        <Mail className="w-5 h-5" />
                      )}
                    </div>
                    <input
                      type={isSignUp ? 'tel' : 'text'}
                      required
                      value={phoneVal}
                      onChange={(e) => setPhoneVal(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="block w-full pl-11 pr-4 py-3 bg-ink/75 border border-white/15 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      {t.passwordLabel}
                    </label>
                    {!isSignUp && (
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-fire3 hover:text-fire hover:underline transition-all"
                      >
                        {t.forgotPassword}
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-11 py-3 bg-ink/75 border border-white/15 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-all"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Email field (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="block w-full pl-11 pr-4 py-3 bg-ink/75 border border-white/15 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Address field (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      {t.addressLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 pt-3 items-start pointer-events-none text-gray-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <textarea
                        rows={2}
                        value={addressVal}
                        onChange={(e) => setAddressVal(e.target.value)}
                        placeholder={t.addressPlaceholder}
                        className="block w-full pl-11 pr-4 py-2.5 bg-ink/75 border border-white/15 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-fire to-fire2 hover:opacity-95 shadow-lg shadow-fire/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    isSignUp ? t.registerBtn : t.signInBtn
                  )}
                </button>
              </form>

              {/* Toggler Trigger Link */}
              <div className="mt-6 text-center text-xs">
                <span className="text-gray-300">
                  {isSignUp ? t.alreadyAccount : t.newCustomer}
                </span>
                <button
                  onClick={toggleAuthMode}
                  className="text-fire3 hover:text-fire font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                >
                  {isSignUp ? t.signInInstead : t.createAccount}
                </button>
              </div>
            </>
          )}

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} Innovise Consultant. All Rights Reserved.<br />
          Kanpur, Uttar Pradesh, India.
        </p>
      </div>
    </main>
  )
}
