'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Activity } from 'lucide-react'

export default function AgentClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            created_at,
            services (
              id,
              service_name,
              status
            )
          `)
          .eq('referred_by', session.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setClients(data || [])
      } catch (err) {
        console.error('Error fetching clients:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'filed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading clients...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referred Clients</h1>
        <p className="text-sm text-gray-500">View your referred clients and their service progress.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't referred any clients yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {clients.map((client) => (
              <li key={client.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-lg">
                            {client.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600 truncate">{client.full_name}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                      <p className="text-sm text-gray-500">
                        Joined on {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Services related to client */}
                  {client.services && client.services.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-1" /> Active Services
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {client.services.map((service: any) => (
                          <span key={service.id} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                            {service.service_name} - {service.status.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
