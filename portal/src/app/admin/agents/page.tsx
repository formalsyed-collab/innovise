'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, IndianRupee, CheckCircle, Clock } from 'lucide-react'

export default function AdminAgentsPage() {
  const supabase = createClient()
  const [agents, setAgents] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState<'agents' | 'payouts'>('payouts')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch Agents
      const { data: agentsData, error: agentsErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false })
      
      if (agentsErr) throw agentsErr

      // Fetch Commissions
      const { data: commsData, error: commsErr } = await supabase
        .from('commissions')
        .select(`
          *,
          agent:profiles!commissions_agent_id_fkey(id, full_name, email, bank_details),
          client:profiles!commissions_client_id_fkey(id, full_name, email),
          invoice:invoices(id, description, status, professional_fees)
        `)
        .order('created_at', { ascending: false })

      if (commsErr) throw commsErr

      setAgents(agentsData || [])
      setCommissions(commsData || [])
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleMarkPaid = async (commissionId: string) => {
    try {
      setUpdating(commissionId)
      const res = await fetch('/api/admin/commissions/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId, status: 'paid' })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to update commission status')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return <div className="p-8 animate-pulse text-gray-500">Loading agent data...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Agents Management</h1>
          <p className="text-sm text-gray-500">Manage referral agents and their payouts.</p>
        </div>
        <div className="mt-4 md:mt-0 bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'payouts' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending Payouts
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'agents' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Agent Directory
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600">{error}</div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissions.map((comm) => (
                <tr key={comm.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{comm.agent?.full_name}</div>
                    <div className="text-sm text-gray-500">{comm.agent?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{comm.client?.full_name}</div>
                    <div className="text-sm text-gray-500">Inv: {comm.invoice?.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ₹{comm.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comm.agent?.bank_details ? (
                      <div className="text-xs text-gray-600">
                        <div>Bank: {comm.agent.bank_details.bank_name}</div>
                        <div>A/c: {comm.agent.bank_details.account_number}</div>
                        <div>IFSC: {comm.agent.bank_details.ifsc_code}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500">Missing</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {comm.status === 'paid' ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" /> Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkPaid(comm.id)}
                        disabled={updating === comm.id}
                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs disabled:opacity-50"
                      >
                        {updating === comm.id ? 'Updating...' : 'Mark as Paid'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No commissions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white shadow rounded-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{agent.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{agent.full_name}</h3>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 text-sm text-gray-600">
                <p><strong>Phone:</strong> {agent.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {agent.address || 'N/A'}</p>
                <div className="pt-2 border-t mt-2">
                  <p className="font-semibold mb-1">Bank Details:</p>
                  {agent.bank_details ? (
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                      <p>Name: {agent.bank_details.bank_name}</p>
                      <p>A/C: {agent.bank_details.account_number}</p>
                      <p>IFSC: {agent.bank_details.ifsc_code}</p>
                    </div>
                  ) : (
                    <span className="text-red-400 text-xs">Not provided</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg shadow">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              No agents registered yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
