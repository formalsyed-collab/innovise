'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, IndianRupee, Clock, CheckCircle, Plus } from 'lucide-react'

export default function AgentDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ totalEarned: 0, totalPending: 0, totalPaid: 0, totalClients: 0 })
  const [commissions, setCommissions] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState('')
  const [referralError, setReferralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({ fullName: '', phone: '', service: '', address: '' })

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch commissions stats
      const res = await fetch('/api/agent/commissions')
      const data = await res.json()
      
      // Fetch total clients
      const { data: clientsData, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('referred_by', session.user.id)
        .order('created_at', { ascending: false })

      if (data.success) {
        setStats({
          ...data.stats,
          totalClients: count || 0
        })
        setCommissions(data.commissions || [])
      }
      
      if (clientsData) {
        setClients(clientsData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleReferClient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fullName || !formData.phone || !formData.service) {
      setReferralError('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    setReferralError('')
    setReferralSuccess('')

    try {
      const res = await fetch('/api/agent/refer-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to refer client')

      setReferralSuccess('Client referred successfully! They will appear in your clients list.')
      setFormData({ fullName: '', phone: '', service: '', address: '' })
      fetchDashboardData()
      setTimeout(() => setIsModalOpen(false), 3000)
    } catch (err: any) {
      setReferralError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome to your partner dashboard.</p>
        </div>
        <button
          onClick={() => {
             setIsModalOpen(true)
             setReferralSuccess('')
             setReferralError('')
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-lg shadow-fire/20 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-fire to-fire2 hover:opacity-95 transition-all transform hover:scale-[1.02]"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Refer Client
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-ink2/90 backdrop-blur-md overflow-hidden shadow-lg border border-white/10 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Referred</dt>
                  <dd className="text-2xl font-bold text-white mt-1">{stats.totalClients}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-ink2/90 backdrop-blur-md overflow-hidden shadow-lg border border-white/10 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IndianRupee className="h-6 w-6 text-jade" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Earned</dt>
                  <dd className="text-2xl font-bold text-white mt-1">₹{stats.totalEarned.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-ink2/90 backdrop-blur-md overflow-hidden shadow-lg border border-white/10 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Payout</dt>
                  <dd className="text-2xl font-bold text-white mt-1">₹{stats.totalPending.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-ink2/90 backdrop-blur-md overflow-hidden shadow-lg border border-white/10 rounded-2xl">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-fire" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid Out</dt>
                  <dd className="text-2xl font-bold text-white mt-1">₹{stats.totalPaid.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Referred Clients List */}
        <div className="bg-ink2/90 backdrop-blur-md shadow-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-lg font-bold text-white tracking-wide">Your Referred Clients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/20">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Mobile Number</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">No clients referred yet.</td>
                  </tr>
                ) : (
                  clients.map(client => (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{client.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{client.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commissions List */}
        <div className="bg-ink2/90 backdrop-blur-md shadow-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-lg font-bold text-white tracking-wide">Recent Commissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/20">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">No commissions yet.</td>
                  </tr>
                ) : (
                  commissions.map(comm => (
                    <tr key={comm.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{comm.client?.full_name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-jade">₹{Number(comm.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${comm.status === 'paid' ? 'bg-jade/10 text-jade border border-jade/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                          {comm.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Refer Client Modal */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-ink2/95 border border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl shadow-fire/10 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleReferClient}>
                <div className="px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                  <h3 className="text-xl font-bold text-white mb-6">Refer a New Client</h3>
                  
                  {referralSuccess && (
                    <div className="mb-6 p-4 rounded-xl bg-jade/10 border border-jade/20 text-jade text-sm flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>{referralSuccess}</span>
                    </div>
                  )}
                  {referralError && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-3">
                      <span>{referralError}</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Full Name *</label>
                      <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="block w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire focus:bg-white/10 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Mobile Number (Format: +91...) *</label>
                      <input type="tel" placeholder="+91..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="block w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire focus:bg-white/10 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Service Requested *</label>
                      <select value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="block w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire focus:bg-white/10 transition-all text-sm">
                        <option value="" disabled className="text-gray-900">Select a service...</option>
                        <option value="Income Tax Return (ITR)" className="text-gray-900">Income Tax Return (ITR)</option>
                        <option value="GST Registration & Filing" className="text-gray-900">GST Registration & Filing</option>
                        <option value="Company Incorporation" className="text-gray-900">Company Incorporation</option>
                        <option value="Trademark Registration" className="text-gray-900">Trademark Registration</option>
                        <option value="Accounting & Bookkeeping" className="text-gray-900">Accounting & Bookkeeping</option>
                        <option value="FSSAI / Food License" className="text-gray-900">FSSAI / Food License</option>
                        <option value="Other" className="text-gray-900">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={isSubmitting || !!referralSuccess} className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg shadow-fire/20 px-6 py-2.5 bg-gradient-to-r from-fire to-fire2 text-sm font-semibold text-white hover:opacity-95 focus:outline-none sm:ml-4 sm:w-auto transition-all disabled:opacity-50">
                    {isSubmitting ? 'Submitting...' : 'Refer Client'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-white/10 shadow-sm px-6 py-2.5 bg-white/5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white focus:outline-none sm:mt-0 sm:ml-4 sm:w-auto transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
