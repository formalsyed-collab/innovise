'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { LayoutDashboard, Users, IndianRupee, LogOut, Menu, X } from 'lucide-react'

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Rely on middleware.ts for authentication and role protection
    setIsChecking(false)
  }, [pathname])

  if (pathname.includes('/login') || pathname.includes('/register')) {
    return <>{children}</>
  }

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-ink text-white"><div className="w-8 h-8 border-2 border-fire border-t-transparent rounded-full animate-spin"></div></div>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/agent/login')
  }

  const navItems = [
    { name: 'Dashboard', href: '/agent/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/agent/clients', icon: Users },
    { name: 'Payouts', href: '/agent/payouts', icon: IndianRupee },
  ]

  return (
    <div className="min-h-screen bg-ink flex text-white select-none relative">
      {/* Background abstract gradient circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-fire opacity-[0.05] blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky opacity-[0.05] blur-[120px] pointer-events-none z-0" />

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-ink2/95 backdrop-blur-md border-r border-white/10 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out`}>
        <div className="h-full flex flex-col relative z-10">
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <span className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
              <span className="text-fire">Innovise</span> Partner
            </span>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            <nav className="px-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all ${
                      isActive ? 'bg-fire/10 text-fire border border-fire/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                  >
                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${isActive ? 'text-fire' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center px-3 py-3 text-sm font-medium rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-rose-500/70 group-hover:text-rose-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <div className="md:hidden flex items-center justify-between bg-ink2/90 backdrop-blur-md border-b border-white/10 px-6 py-4 z-20">
          <span className="text-lg font-bold text-white tracking-wider"><span className="text-fire">Innovise</span> Partner</span>
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
