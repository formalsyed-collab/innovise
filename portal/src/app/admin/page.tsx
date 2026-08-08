'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Users, UserPlus, Search, Mail, Phone, MapPin, 
  Award, LogOut, CheckCircle2, ShieldAlert, ArrowRight, RefreshCw 
} from 'lucide-react'
import Link from 'next/link'

interface ClientProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  // State Management
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adminName, setAdminName] = useState('')

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSuccess, setModalSuccess] = useState(false)

  const fetchAdminSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setAdminName(profile?.full_name || 'Admin User')
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    Promise.all([fetchAdminSession(), fetchClients()])
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchClients()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  // Handle Client Creation
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError(null)
    setModalSuccess(false)

    try {
      const response = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          fullName: newFullName,
          phone: newPhone,
          address: newAddress,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client.')
      }

      setModalSuccess(true)
      // Clear fields
      setNewEmail('')
      setNewPassword('')
      setNewFullName('')
      setNewPhone('')
      setNewAddress('')

      // Reload client directory
      await fetchClients()

      setTimeout(() => {
        setIsModalOpen(false)
        setModalSuccess(false)
      }, 1500)

    } catch (err: any) {
      setModalError(err.message || 'An unexpected error occurred.')
    } finally {
      setModalLoading(false)
    }
  }

  // Filter clients based on search query
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase()
    return (
      (client.full_name && client.full_name.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.phone && client.phone.toLowerCase().includes(query))
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-pearl flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-fire border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-dim font-medium">Securing admin workspace environment...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pearl flex flex-col">
      {/* Admin Navbar */}
      <header className="bg-ink text-white border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-fire/15 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider block leading-none">INNOVISE</span>
              <span className="text-[10px] text-gray-400 tracking-widest font-semibold">ADMIN CONSOLE</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold">{adminName}</span>
              <span className="text-[10px] text-rose font-bold bg-rose/10 px-2 py-0.5 rounded-full inline-block self-end mt-1 uppercase tracking-wide">Firm Staff</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              title="Refresh Client List"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-rose/10 hover:border-rose/20 hover:text-rose transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-fire" />
              Client Registry
            </h1>
            <p className="text-xs text-dim mt-1">Manage client profiles, invoices, filings status, and verification checklist.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-fire to-fire2 text-white text-xs font-bold rounded-xl shadow-lg shadow-fire/15 hover:opacity-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Onboard New Client
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center bg-white border border-line rounded-2xl p-4 shadow-sm">
          <div className="sm:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, email address, phone..."
              className="block w-full pl-10 pr-4 py-2.5 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
            />
          </div>

          <div className="text-right sm:pr-4">
            <span className="text-xs text-dim">Total Clients: </span>
            <strong className="text-lg font-bold text-ink">{clients.length}</strong>
          </div>
        </div>

        {/* Client Grid */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-16 bg-white border border-line rounded-3xl shadow-sm">
            <Users className="w-12 h-12 text-dim mx-auto mb-3" />
            <h3 className="text-base font-bold text-ink">No Clients Found</h3>
            <p className="text-xs text-dim mt-1">Try refining your search or click 'Onboard New Client' to register one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div 
                key={client.id} 
                className="bg-white border border-line hover:border-line2 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-ink leading-tight hover:text-fire transition-all">
                      <Link href={`/admin/clients/${client.id}`}>{client.full_name}</Link>
                    </h3>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Registered: {new Date(client.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-dim">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{client.email || 'No email registered'}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-line mt-5 flex justify-end">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fire hover:text-fire2 transition-all"
                  >
                    Manage Account
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Onboard Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-white border border-line rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-line bg-pearl flex justify-between items-center">
              <h3 className="text-lg font-bold text-ink">Register Client Account</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-dim hover:text-ink text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="mb-4 p-4 rounded-xl bg-rose/10 border border-rose/20 text-rose text-xs flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-jade/20 text-jade flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-ink">Client Onboarded Successfully</h4>
                  <p className="text-xs text-dim">Authentication details saved, database record generated.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. +91 9506166560"
                      className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. rahul@company.com"
                      className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Temp Password *</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Billing Address</label>
                    <textarea
                      rows={2}
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Corporate or billing address"
                      className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-line rounded-xl text-xs font-bold text-dim hover:bg-pearl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-5 py-2 bg-ink hover:bg-ink2 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {modalLoading ? 'Onboarding...' : 'Onboard Client'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Footer */}
      <footer className="bg-ink2 text-gray-500 py-6 border-t border-white/5 mt-auto text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Innovise Consultant. Authorized CA &amp; CS Staff Console.</p>
      </footer>
    </div>
  )
}
