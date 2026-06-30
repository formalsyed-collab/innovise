'use client'

import { use, useState, useEffect } from 'react'
import { createClient, isSessionInitialized } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Award, 
  Clock, FileText, IndianRupee, Plus, Edit, Check, 
  Trash2, Upload, Download, AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface ClientProfile {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
}

interface Service {
  id: string
  service_name: string
  status: 'consultation' | 'docs_pending' | 'in_progress' | 'filed' | 'completed'
  start_date: string
  expected_completion: string | null
  notes: string | null
}

interface DocumentItem {
  id: string
  file_name: string
  storage_path: string
  doc_type: string
  status: 'submitted' | 'verified' | 'pending'
  uploaded_by: 'client' | 'admin'
  created_at: string
}

interface DocumentRequest {
  id: string
  title: string
  description: string | null
  fulfilled: boolean
}

interface Invoice {
  id: string
  description: string
  professional_fees: number
  government_fees: number
  total: number
  status: 'paid' | 'pending' | 'partial'
  due_date: string
  paid_date: string | null
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  // App states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'services' | 'documents' | 'payments'>('services')

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // Modal / Form States
  const [actionError, setActionError] = useState<string | null>(null)

  // Service form
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [expectedCompletion, setExpectedCompletion] = useState('')
  const [serviceNotes, setServiceNotes] = useState('')
  const [serviceFormLoading, setServiceFormLoading] = useState(false)

  // Service Edit/Status form
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<Service['status']>('consultation')
  const [editNotes, setEditNotes] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Invoice form
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [invDesc, setInvDesc] = useState('')
  const [invProfFee, setInvProfFee] = useState('')
  const [invGovFee, setInvGovFee] = useState('')
  const [invDueDate, setInvDueDate] = useState('')
  const [invoiceFormLoading, setInvoiceFormLoading] = useState(false)

  // Document Request form
  const [showReqForm, setShowReqForm] = useState(false)
  const [reqTitle, setReqTitle] = useState('')
  const [reqDesc, setReqDesc] = useState('')
  const [reqFormLoading, setReqFormLoading] = useState(false)

  // Admin Direct Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadingCol, setUploadingCol] = useState<string | null>(null)
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [replySubmittingId, setReplySubmittingId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Edit client profile and deletion states
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editModalLoading, setEditModalLoading] = useState(false)
  const [editModalError, setEditModalError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      // Fetch all client details concurrently in parallel to maximize performance
      const [profRes, servsRes, docsRes, reqsRes, invsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).eq('role', 'client').single(),
        supabase.from('services').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('document_requests').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('client_id', id).order('due_date', { ascending: true })
      ])

      if (profRes.error || !profRes.data) {
        router.push('/admin')
        return
      }

      setClient(profRes.data)
      setServices(servsRes.data || [])
      
      const documentsList = docsRes.data || []
      setDocuments(documentsList)

      // Fetch avatar image in the background if it exists (non-blocking)
      const avatarDoc = documentsList.find(d => d.doc_type === 'AVATAR')
      if (avatarDoc) {
        supabase.storage
          .from('documents')
          .createSignedUrl(avatarDoc.storage_path, 3600)
          .then(({ data }) => {
            if (data?.signedUrl) setAvatarUrl(data.signedUrl)
          })
          .catch(err => console.error('Error fetching signed avatar:', err))
      } else {
        setAvatarUrl(null)
      }

      setRequests(reqsRes.data || [])
      setInvoices(invsRes.data || [])

    } catch (err) {
      console.error('Error loading client files:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isSessionInitialized()) {
      const cleanSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
      }
      cleanSignOut()
      return
    }
    loadData()
  }, [id])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // --- ACTIONS ---

  // 1. Create Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    setServiceFormLoading(true)
    setActionError(null)

    const { error } = await supabase
      .from('services')
      .insert({
        client_id: id,
        service_name: serviceName,
        expected_completion: expectedCompletion || null,
        notes: serviceNotes || null,
        status: 'consultation'
      })

    if (error) {
      setActionError(error.message)
    } else {
      setServiceName('')
      setExpectedCompletion('')
      setServiceNotes('')
      setShowServiceForm(false)
      await loadData()
    }
    setServiceFormLoading(false)
  }

  // 2. Update Service Status / Notes
  const handleUpdateServiceStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingServiceId) return
    setEditLoading(true)
    setActionError(null)

    const { error } = await supabase
      .from('services')
      .update({
        status: editStatus,
        notes: editNotes || null
      })
      .eq('id', editingServiceId)

    if (error) {
      setActionError(error.message)
    } else {
      setEditingServiceId(null)
      setEditNotes('')
      await loadData()
    }
    setEditLoading(false)
  }

  // 3. Create Invoice
  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoiceFormLoading(true)
    setActionError(null)

    const prof = Number(invProfFee) || 0
    const gov = Number(invGovFee) || 0
    const totalVal = prof + gov

    const { error } = await supabase
      .from('invoices')
      .insert({
        client_id: id,
        description: invDesc,
        professional_fees: prof,
        government_fees: gov,
        total: totalVal,
        due_date: invDueDate,
        status: 'pending'
      })

    if (error) {
      setActionError(error.message)
    } else {
      setInvDesc('')
      setInvProfFee('')
      setInvGovFee('')
      setInvDueDate('')
      setShowInvoiceForm(false)
      await loadData()
    }
    setInvoiceFormLoading(false)
  }

  // 4. Toggle Invoice Status
  const handleToggleInvoice = async (invoiceId: string, currentStatus: Invoice['status']) => {
    let nextStatus: Invoice['status'] = 'paid'
    if (currentStatus === 'paid') nextStatus = 'pending'
    else if (currentStatus === 'pending') nextStatus = 'partial'
    else if (currentStatus === 'partial') nextStatus = 'paid'

    const { error } = await supabase
      .from('invoices')
      .update({
        status: nextStatus,
        paid_date: nextStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', invoiceId)

    if (error) {
      alert(error.message)
    } else {
      await loadData()
    }
  }

  // 5. Create Document Request
  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setReqFormLoading(true)
    setActionError(null)

    const { error } = await supabase
      .from('document_requests')
      .insert({
        client_id: id,
        title: reqTitle,
        description: reqDesc || null,
        fulfilled: false
      })

    if (error) {
      setActionError(error.message)
    } else {
      setReqTitle('')
      setReqDesc('')
      setShowReqForm(false)
      await loadData()
    }
    setReqFormLoading(false)
  }

  // 6. Direct Admin Upload
  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string = 'OTHER') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCol(docType)
    setActionError(null)

    try {
      const storagePath = `${id}/${crypto.randomUUID()}-${file.name}`

      // Upload to Storage
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file)

      if (uploadErr) throw uploadErr

      // Insert Documents row
      const { error: dbErr } = await supabase
        .from('documents')
        .insert({
          client_id: id,
          file_name: file.name,
          storage_path: storagePath,
          doc_type: docType,
          status: 'verified',
          uploaded_by: 'admin'
        })

      if (dbErr) throw dbErr

      await loadData()
    } catch (err: any) {
      setActionError(err.message || 'Error uploading file.')
    } finally {
      setUploadingCol(null)
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG and PNG images are allowed.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('File size must be less than 2MB.')
      return
    }

    setRefreshing(true)
    setActionError(null)

    try {
      // Find and delete old avatar documents
      const oldAvatars = documents.filter(d => d.doc_type === 'AVATAR')
      for (const old of oldAvatars) {
        await supabase.from('documents').delete().eq('id', old.id)
        await supabase.storage.from('documents').remove([old.storage_path])
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const storagePath = `${id}/avatar-${crypto.randomUUID()}.${fileExt}`

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file)

      if (uploadErr) throw uploadErr

      // Insert document row
      const { error: dbErr } = await supabase
        .from('documents')
        .insert({
          client_id: id,
          file_name: file.name,
          storage_path: storagePath,
          doc_type: 'AVATAR',
          status: 'verified',
          uploaded_by: 'admin'
        })

      if (dbErr) throw dbErr

      await loadData()
    } catch (err: any) {
      setActionError(err.message || 'Error uploading profile photo.')
    } finally {
      setRefreshing(false)
    }
  }

  // Delete Vault document or query
  const handleDeleteDoc = async (docId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to permanently delete this document?')) return
    try {
      // 1. Delete database record
      const { error: dbErr } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (dbErr) throw dbErr

      // 2. Delete storage file if not a mock query path
      if (storagePath && storagePath !== 'text_query') {
        const { error: storageErr } = await supabase.storage
          .from('documents')
          .remove([storagePath])
        if (storageErr) console.warn('Storage deletion warning:', storageErr)
      }

      await loadData()
    } catch (err: any) {
      alert(err.message || 'Error deleting document.')
    }
  }

  // CA/CS Team Query Reply submission
  const handleQueryReply = async (doc: any, replyText: string) => {
    if (!replyText.trim()) return
    setReplySubmittingId(doc.id)
    try {
      let queryData = { query: doc.file_name, reply: null }
      try {
        if (doc.file_name.startsWith('{')) {
          queryData = JSON.parse(doc.file_name)
        }
      } catch (e) {}

      queryData.reply = replyText.trim() as any

      const { error } = await supabase
        .from('documents')
        .update({
          file_name: JSON.stringify(queryData),
          status: 'verified'
        })
        .eq('id', doc.id)

      if (error) throw error

      setReplyTextMap(prev => ({ ...prev, [doc.id]: '' }))
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Error sending reply.')
    } finally {
      setReplySubmittingId(null)
    }
  }

  // 7. Verify Client Upload
  const handleVerifyDoc = async (docId: string) => {
    const { error } = await supabase
      .from('documents')
      .update({ status: 'verified' })
      .eq('id', docId)

    if (error) {
      alert(error.message)
    } else {
      await loadData()
    }
  }

  // 8. Delete Document Request or Service (Optional Admin controls)
  const handleDeleteRequest = async (reqId: string) => {
    if (!confirm('Are you sure you want to remove this document request?')) return
    await supabase.from('document_requests').delete().eq('id', reqId)
    await loadData()
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? All linked records will be affected.')) return
    await supabase.from('services').delete().eq('id', serviceId)
    await loadData()
  }

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this invoice?')) return
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
      if (error) throw error
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Error deleting invoice.')
    }
  }

  // Delete client account
  const handleDeleteClient = async () => {
    if (!confirm(`Are you sure you want to permanently delete this client (${client?.full_name})? This will delete all of their data, files, services, and invoices permanently from Supabase. This action cannot be undone.`)) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/delete-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete client account.')
      
      alert('Client account deleted successfully.')
      router.push('/admin')
    } catch (err: any) {
      alert(err.message || 'Error deleting client.')
      setDeleteLoading(false)
    }
  }

  const openEditModal = () => {
    if (!client) return
    setEditFullName(client.full_name || '')
    setEditPhone(client.phone || '')
    setEditEmail(client.email || '')
    setEditAddress(client.address || '')
    setEditModalError(null)
    setShowEditModal(true)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditModalLoading(true)
    setEditModalError(null)
    try {
      const res = await fetch('/api/admin/update-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          fullName: editFullName,
          phone: editPhone,
          email: editEmail,
          address: editAddress
        })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update client account.')

      setShowEditModal(false)
      await loadData()
    } catch (err: any) {
      setEditModalError(err.message || 'Error updating client.')
    } finally {
      setEditModalLoading(false)
    }
  }

  // Signed download url resolver
  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 60, {
          download: fileName
        })

      if (error) throw error

      if (data?.signedUrl) {
        const a = document.createElement('a')
        a.href = data.signedUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err: any) {
      alert(err.message || 'Error getting signed download link.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pearl flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-fire border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-dim font-medium">Fetching client configuration details...</p>
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
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              title="Refresh Client details"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3.5 py-2 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Client Registry
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8">
        {/* Error notification banner */}
        {actionError && (
          <div className="p-4 bg-rose/10 border border-rose/20 text-rose text-xs rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Client Profile Box */}
        <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative group w-14 h-14 rounded-2xl border border-line overflow-hidden bg-pearl flex items-center justify-center flex-shrink-0 animate-fade-in">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-extrabold text-fire select-none">
                  {(client?.full_name || 'C').charAt(0).toUpperCase()}
                </span>
              )}
              {/* Hover upload overlay */}
              <label 
                htmlFor="admin-avatar-upload" 
                className="absolute inset-0 bg-ink/75 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-bold text-center p-1 leading-normal"
              >
                Change Photo
              </label>
              <input 
                type="file" 
                id="admin-avatar-upload" 
                className="hidden" 
                accept="image/jpeg,image/png" 
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-ink leading-none">{client?.full_name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim pt-1.5">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {client?.email || 'No email registered'}</span>
                {client?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {client.phone}</span>}
              </div>
              {client?.address && (
                <p className="text-xs text-dim pt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{client.address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <button
              onClick={openEditModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-line hover:border-ink rounded-xl text-xs font-bold text-dim hover:text-ink transition-all bg-white cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={handleDeleteClient}
              disabled={deleteLoading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-rose/30 hover:bg-rose/5 hover:border-rose rounded-xl text-xs font-bold text-rose transition-all bg-white cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleteLoading ? 'Deleting...' : 'Delete Client'}
            </button>
          </div>
        </section>

        {/* Switch Tabs menu */}
        <div className="flex border-b border-line gap-6 overflow-x-auto scrollbar-none pb-0.5 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
              activeTab === 'services' ? 'text-fire border-b-2 border-fire' : 'text-dim hover:text-ink'
            }`}
          >
            Manage Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
              activeTab === 'documents' ? 'text-fire border-b-2 border-fire' : 'text-dim hover:text-ink'
            }`}
          >
            Vault &amp; Checklist ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
              activeTab === 'payments' ? 'text-fire border-b-2 border-fire' : 'text-dim hover:text-ink'
            }`}
          >
            Invoices &amp; Invoicing ({invoices.length})
          </button>
        </div>

        {/* Tab content displays */}

        {/* TAB 1: SERVICES MANAGEMENT */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-ink">Client Service Engagements</h2>
                <p className="text-xs text-dim mt-0.5">Start new client engagements or update progress milestones on existing ones.</p>
              </div>
              
              {!showServiceForm && !editingServiceId && (
                <button
                  onClick={() => setShowServiceForm(true)}
                  className="inline-flex items-center justify-center gap-1 px-3.5 py-2 bg-ink hover:bg-ink2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Initiate Service
                </button>
              )}
            </div>

            {/* Initiate new service layout form */}
            {showServiceForm && (
              <form onSubmit={handleAddService} className="bg-pearl border border-line rounded-2xl p-5 space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-ink">Initiate New Service Engagement</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Service Type *</label>
                    <select
                      required
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                    >
                      <option value="">-- Select Template Service --</option>
                      <option value="Pvt Ltd Company Registration">Pvt Ltd Company Registration</option>
                      <option value="LLP Registration India">LLP Registration India</option>
                      <option value="GST Registration &amp; Onboarding">GST Registration &amp; Onboarding</option>
                      <option value="GST Quarterly Filing">GST Quarterly Filing</option>
                      <option value="Income Tax Return Filing">Income Tax Return Filing</option>
                      <option value="Trademark Filing">Trademark Filing</option>
                      <option value="ROC Compliance Package">ROC Compliance Package</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Expected Completion Date</label>
                    <input
                      type="date"
                      value={expectedCompletion}
                      onChange={(e) => setExpectedCompletion(e.target.value)}
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Timeline Initial Notes / Directions</label>
                    <textarea
                      rows={2}
                      value={serviceNotes}
                      onChange={(e) => setServiceNotes(e.target.value)}
                      placeholder="Add compliance context or details needed from client..."
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowServiceForm(false)}
                    className="px-4 py-2 border border-line rounded-xl text-xs font-bold text-dim hover:bg-pearl2 transition-all cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={serviceFormLoading}
                    className="px-5 py-2 bg-fire hover:bg-fire2 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {serviceFormLoading ? 'Adding...' : 'Add Engagement'}
                  </button>
                </div>
              </form>
            )}

            {/* List Services */}
            {services.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-line rounded-3xl bg-pearl/30">
                <Clock className="w-12 h-12 text-dim mx-auto mb-3" />
                <h3 className="text-base font-bold text-ink">No Registered Services</h3>
                <p className="text-xs text-dim mt-1">This client does not have any active service engagements.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {services.map((service) => (
                  <div key={service.id} className="border border-line rounded-2xl p-6 hover:border-line2 transition-all bg-pearl/5">
                    
                    {/* Render Edit view inline inside card */}
                    {editingServiceId === service.id ? (
                      <form onSubmit={handleUpdateServiceStatus} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-line pb-3">
                          <h3 className="text-sm font-bold text-ink">Updating status: {service.service_name}</h3>
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="text-xs text-dim hover:text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Timeline Stage Status *</label>
                            <select
                              required
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as Service['status'])}
                              className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                            >
                              <option value="consultation">Consultation</option>
                              <option value="docs_pending">Docs Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="filed">Filed</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Status Update Notes / Tasks Checklist</label>
                            <textarea
                              rows={2}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="px-4 py-2 border border-line rounded-xl text-xs font-bold text-dim hover:bg-pearl transition-all cursor-pointer bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="px-5 py-2 bg-ink hover:bg-ink2 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            {editLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold text-ink">{service.service_name}</h3>
                            <span className="text-[10px] text-gray-400 block mt-1">
                              Filing Started: {new Date(service.start_date).toLocaleDateString('en-IN')}
                              {service.expected_completion && ` | Expected Date: ${new Date(service.expected_completion).toLocaleDateString('en-IN')}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              service.status === 'completed' ? 'bg-jade/10 text-jade' :
                              service.status === 'filed' ? 'bg-sky/10 text-sky' :
                              service.status === 'docs_pending' ? 'bg-gold/10 text-gold' :
                              'bg-pearl2 text-dim'
                            }`}>
                              {service.status.replace('_', ' ')}
                            </span>
                            
                            <button
                              onClick={() => {
                                setEditingServiceId(service.id)
                                setEditStatus(service.status)
                                setEditNotes(service.notes || '')
                              }}
                              className="p-1.5 border border-line hover:border-ink rounded-lg text-dim hover:text-ink transition-all bg-white"
                              title="Update Status"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="p-1.5 border border-line hover:border-rose rounded-lg text-dim hover:text-rose transition-all bg-white"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {service.notes && (
                          <div className="p-3.5 rounded-xl bg-pearl border border-line text-xs text-dim">
                            <span className="font-bold text-ink block mb-0.5">Timeline Notes:</span>
                            <p>{service.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENTS VAULT & REQUESTS */}
        {activeTab === 'documents' && (
          <div className="space-y-8 animate-fade-in">
            {/* Direct Upload bar */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Private Vault Documents</h2>
                <p className="text-xs text-dim mt-0.5">Upload certified incorporation outputs or invoices receipts directly to the client vault.</p>
              </div>

              <div className="relative overflow-hidden flex-shrink-0">
                <input
                  type="file"
                  id="admin-vault-upload"
                  className="hidden"
                  onChange={handleAdminUpload}
                  disabled={uploading}
                />
                <label
                  htmlFor="admin-vault-upload"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink hover:bg-ink2 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading File...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload to Client Vault
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Document Requests Checklist Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider text-gray-400">Document Upload Checklist</h3>
                  <p className="text-xs text-dim">Track documents the client needs to submit for ongoing filings.</p>
                </div>

                {!showReqForm && (
                  <button
                    onClick={() => setShowReqForm(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-fire hover:text-fire2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Request File
                  </button>
                )}
              </div>

              {/* Request File form */}
              {showReqForm && (
                <form onSubmit={handleAddRequest} className="bg-pearl border border-line rounded-2xl p-5 space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider text-gray-400">Raise File Submission Request</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Document Needed *</label>
                      <input
                        type="text"
                        required
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                        placeholder="e.g. Aadhaar Card, GSTIN Registration Proof"
                        className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Notes / Instructions</label>
                      <input
                        type="text"
                        value={reqDesc}
                        onChange={(e) => setReqDesc(e.target.value)}
                        placeholder="e.g. Self-attested copy in PDF format"
                        className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReqForm(false)}
                      className="px-4 py-2 border border-line rounded-xl text-xs font-bold text-dim hover:bg-pearl2 transition-all cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reqFormLoading}
                      className="px-5 py-2 bg-fire hover:bg-fire2 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      {reqFormLoading ? 'Requesting...' : 'Add to Checklist'}
                    </button>
                  </div>
                </form>
              )}

              {/* List of Requests */}
              {requests.length === 0 ? (
                <div className="text-center py-6 border border-line border-dashed rounded-2xl bg-pearl/10">
                  <p className="text-xs text-dim">No pending documents requested yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {requests.map((req) => (
                    <div key={req.id} className="border border-line rounded-xl p-4 bg-pearl/5 flex justify-between items-center gap-4 hover:border-line2 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                            req.fulfilled ? 'bg-jade text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {req.fulfilled && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <h4 className="text-xs font-bold text-ink">{req.title}</h4>
                        </div>
                        {req.description && (
                          <p className="text-[11px] text-dim pl-5.5 pt-0.5">{req.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        className="p-1 hover:bg-rose/10 hover:text-rose border border-transparent hover:border-rose/10 rounded text-dim transition-all flex-shrink-0"
                        title="Delete Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Board Columns for GSTR1, RETURNS, NOTICES, Queries */}
            {(() => {
              const saleDocs = documents.filter(d => d.doc_type === 'SALE_BILL' || d.doc_type?.startsWith('SALE_BILL:'))
              const purchaseDocs = documents.filter(d => d.doc_type === 'PURCHASE_BILL' || d.doc_type?.startsWith('PURCHASE_BILL:'))
              const gstr1Docs = documents.filter(d => d.doc_type === 'GSTR1')
              const returnsDocs = documents.filter(d => d.doc_type === 'RETURNS')
              const noticesDocs = documents.filter(d => d.doc_type === 'NOTICES')
              const queriesDocs = documents.filter(d => d.doc_type && (d.doc_type === 'QUERY' || d.doc_type.startsWith('QUERY_REPLY:')))

              const renderAdminDocCard = (doc: any) => {
                const hasMonthSuffix = doc.doc_type && doc.doc_type.includes(':')
                const monthString = hasMonthSuffix ? doc.doc_type.split(':')[1] : null

                return (
                  <div key={doc.id} className="p-3 bg-white rounded-xl border border-line space-y-2 shadow-sm text-xs">
                    <div>
                      <h4 className="font-bold text-ink truncate" title={doc.file_name}>{doc.file_name}</h4>
                      <span className="text-[9px] text-gray-400 block mt-0.5">
                        {new Date(doc.created_at).toLocaleDateString('en-IN')} by {doc.uploaded_by}
                      </span>
                      {monthString && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-fire/10 text-fire text-[9px] font-bold rounded">
                          Bill Month: {monthString}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-line">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        doc.status === 'verified' ? 'bg-jade/10 text-jade' : 'bg-gold/10 text-gold'
                      }`}>
                        {doc.status}
                      </span>

                      <div className="flex items-center gap-1">
                        {doc.status === 'submitted' && (
                          <button
                            onClick={() => handleVerifyDoc(doc.id)}
                            className="p-1 hover:bg-jade/10 text-jade rounded transition-all"
                            title="Verify Document"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                          className="p-1 hover:bg-fire/10 text-fire rounded transition-all"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.storage_path)}
                          className="p-1 hover:bg-rose/10 text-rose rounded transition-all"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div className="flex flex-col lg:flex-row flex-wrap gap-6 pt-4 border-t border-line">
                  {/* Board Column 1: Sale Bills */}
                  <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-line">
                      <h3 className="font-bold text-ink text-xs uppercase tracking-wider">Sale Bills ({saleDocs.length})</h3>
                      <div className="relative overflow-hidden">
                        <input
                          type="file"
                          id="upload-sale-admin"
                          className="hidden"
                          onChange={(e) => handleAdminUpload(e, 'SALE_BILL')}
                          disabled={uploadingCol !== null}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label
                          htmlFor="upload-sale-admin"
                          className="p-1.5 text-[10px] font-bold text-fire hover:text-fire2 cursor-pointer inline-flex items-center gap-1 bg-white border border-line rounded-lg"
                        >
                          {uploadingCol === 'SALE_BILL' ? '...' : '+ Upload'}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                      {saleDocs.length === 0 ? (
                        <p className="text-[11px] text-dim text-center py-4">No Sale Bills.</p>
                      ) : (
                        saleDocs.map(doc => renderAdminDocCard(doc))
                      )}
                    </div>
                  </div>

                  {/* Board Column 2: Purchase Bills */}
                  <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-line">
                      <h3 className="font-bold text-ink text-xs uppercase tracking-wider">Purchase Bills ({purchaseDocs.length})</h3>
                      <div className="relative overflow-hidden">
                        <input
                          type="file"
                          id="upload-purchase-admin"
                          className="hidden"
                          onChange={(e) => handleAdminUpload(e, 'PURCHASE_BILL')}
                          disabled={uploadingCol !== null}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label
                          htmlFor="upload-purchase-admin"
                          className="p-1.5 text-[10px] font-bold text-fire hover:text-fire2 cursor-pointer inline-flex items-center gap-1 bg-white border border-line rounded-lg"
                        >
                          {uploadingCol === 'PURCHASE_BILL' ? '...' : '+ Upload'}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                      {purchaseDocs.length === 0 ? (
                        <p className="text-[11px] text-dim text-center py-4">No Purchase Bills.</p>
                      ) : (
                        purchaseDocs.map(doc => renderAdminDocCard(doc))
                      )}
                    </div>
                  </div>

                  {/* Board Column 3: GSTR1 & 3B */}
                  <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-line">
                      <h3 className="font-bold text-ink text-xs uppercase tracking-wider">GSTR1 &amp; 3B ({gstr1Docs.length})</h3>
                      <div className="relative overflow-hidden">
                        <input
                          type="file"
                          id="upload-gstr1-admin"
                          className="hidden"
                          onChange={(e) => handleAdminUpload(e, 'GSTR1')}
                          disabled={uploadingCol !== null}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label
                          htmlFor="upload-gstr1-admin"
                          className="p-1.5 text-[10px] font-bold text-fire hover:text-fire2 cursor-pointer inline-flex items-center gap-1 bg-white border border-line rounded-lg"
                        >
                          {uploadingCol === 'GSTR1' ? '...' : '+ Upload'}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                      {gstr1Docs.length === 0 ? (
                        <p className="text-[11px] text-dim text-center py-4">No GSTR1 or 3B files.</p>
                      ) : (
                        gstr1Docs.map(doc => renderAdminDocCard(doc))
                      )}
                    </div>
                  </div>

                  {/* Board Column 4: RETURNS */}
                  <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-line">
                      <h3 className="font-bold text-ink text-xs uppercase tracking-wider">RETURNS ({returnsDocs.length})</h3>
                      <div className="relative overflow-hidden">
                        <input
                          type="file"
                          id="upload-returns-admin"
                          className="hidden"
                          onChange={(e) => handleAdminUpload(e, 'RETURNS')}
                          disabled={uploadingCol !== null}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label
                          htmlFor="upload-returns-admin"
                          className="p-1.5 text-[10px] font-bold text-fire hover:text-fire2 cursor-pointer inline-flex items-center gap-1 bg-white border border-line rounded-lg"
                        >
                          {uploadingCol === 'RETURNS' ? '...' : '+ Upload'}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                      {returnsDocs.length === 0 ? (
                        <p className="text-[11px] text-dim text-center py-4">No Return files.</p>
                      ) : (
                        returnsDocs.map(doc => renderAdminDocCard(doc))
                      )}
                    </div>
                  </div>

                  {/* Board Column 5: NOTICES */}
                  <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-line">
                      <h3 className="font-bold text-ink text-xs uppercase tracking-wider">NOTICES ({noticesDocs.length})</h3>
                      <div className="relative overflow-hidden">
                        <input
                          type="file"
                          id="upload-notices-admin"
                          className="hidden"
                          onChange={(e) => handleAdminUpload(e, 'NOTICES')}
                          disabled={uploadingCol !== null}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label
                          htmlFor="upload-notices-admin"
                          className="p-1.5 text-[10px] font-bold text-fire hover:text-fire2 cursor-pointer inline-flex items-center gap-1 bg-white border border-line rounded-lg"
                        >
                          {uploadingCol === 'NOTICES' ? '...' : '+ Upload'}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                      {noticesDocs.length === 0 ? (
                        <p className="text-[11px] text-dim text-center py-4">No Notice files.</p>
                      ) : (
                        noticesDocs.map(doc => renderAdminDocCard(doc))
                      )}
                    </div>
                  </div>

                  {/* Board Column 6: Queries & Reporting */}
                  <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                    <div className="pb-2 border-b border-line">
                      <h3 className="font-bold text-ink text-xs uppercase tracking-wider">Queries &amp; Reporting ({queriesDocs.length})</h3>
                    </div>

                    <div className="flex-grow flex flex-col justify-between space-y-4 max-h-[400px] overflow-hidden">
                      <div className="space-y-3 overflow-y-auto flex-grow pr-1 max-h-[250px]">
                        {queriesDocs.length === 0 ? (
                          <p className="text-[11px] text-dim text-center py-4">No active client queries.</p>
                        ) : (
                          queriesDocs.map(doc => {
                            let qData = { query: doc.file_name, reply: null }
                            try {
                              if (doc.file_name.startsWith('{')) {
                                qData = JSON.parse(doc.file_name)
                              }
                            } catch (e) {}

                            return (
                              <div key={doc.id} className="p-3 bg-white rounded-xl border border-line space-y-3 shadow-sm text-xs">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-dim block font-medium">
                                    Query on {new Date(doc.created_at).toLocaleDateString('en-IN')}:
                                  </span>
                                  <p className="font-bold text-ink leading-normal">{qData.query}</p>
                                </div>

                                {qData.reply ? (
                                  <div className="p-2.5 rounded-lg bg-jade/5 border border-jade/10 space-y-0.5 animate-fade-in">
                                    <span className="text-[9px] text-jade block uppercase tracking-wide font-bold">CA/CS Team Response:</span>
                                    <p className="text-dim leading-relaxed">{qData.reply}</p>
                                  </div>
                                ) : (
                                  <span className="text-[9px] bg-rose/10 text-rose font-bold px-2 py-0.5 rounded-full inline-block uppercase tracking-wide">
                                    Pending Response
                                  </span>
                                )}

                                {/* Reply Form */}
                                <div className="pt-2 border-t border-line space-y-2">
                                  <textarea
                                    rows={2}
                                    value={replyTextMap[doc.id] || ''}
                                    onChange={(e) => setReplyTextMap(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                    placeholder={qData.reply ? "Update your reply..." : "Type reply to client..."}
                                    className="block w-full p-2 bg-pearl border border-line rounded-lg text-[11px] text-ink focus:outline-none"
                                  />
                                  <div className="flex justify-between items-center pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDoc(doc.id, doc.storage_path)}
                                      className="text-[10px] text-rose hover:underline"
                                    >
                                      Delete Query
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleQueryReply(doc, replyTextMap[doc.id] || '')}
                                      disabled={replySubmittingId === doc.id || !(replyTextMap[doc.id] || '').trim()}
                                      className="px-2.5 py-1 bg-ink hover:bg-ink2 text-white font-bold text-[10px] rounded-lg transition-all disabled:opacity-50"
                                    >
                                      {replySubmittingId === doc.id ? 'Sending...' : 'Send Reply'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* TAB 3: INVOICES & PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-ink">Invoices &amp; Accounts</h2>
                <p className="text-xs text-dim mt-0.5">Raise professional/government fees invoices, verify dues, and mark invoices as Paid.</p>
              </div>

              {!showInvoiceForm && (
                <button
                  onClick={() => setShowInvoiceForm(true)}
                  className="inline-flex items-center justify-center gap-1 px-3.5 py-2 bg-ink hover:bg-ink2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Raise Invoice
                </button>
              )}
            </div>

            {/* Raise Invoice Form */}
            {showInvoiceForm && (
              <form onSubmit={handleAddInvoice} className="bg-pearl border border-line rounded-2xl p-5 space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-ink">Raise Professional Fee Invoice</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Billing Description *</label>
                    <input
                      type="text"
                      required
                      value={invDesc}
                      onChange={(e) => setInvDesc(e.target.value)}
                      placeholder="e.g. Pvt Ltd Registration Filing Dues"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Professional Fees (₹) *</label>
                    <input
                      type="number"
                      required
                      value={invProfFee}
                      onChange={(e) => setInvProfFee(e.target.value)}
                      placeholder="e.g. 5000"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Government Fees (₹)</label>
                    <input
                      type="number"
                      value={invGovFee}
                      onChange={(e) => setInvGovFee(e.target.value)}
                      placeholder="e.g. 1500 (Set to 0 if none)"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-dim uppercase tracking-wider mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={invDueDate}
                      onChange={(e) => setInvDueDate(e.target.value)}
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceForm(false)}
                    className="px-4 py-2 border border-line rounded-xl text-xs font-bold text-dim hover:bg-pearl2 transition-all cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={invoiceFormLoading}
                    className="px-5 py-2 bg-fire hover:bg-fire2 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {invoiceFormLoading ? 'Raising...' : 'Raise Invoice'}
                  </button>
                </div>
              </form>
            )}

            {/* List Invoices Raised */}
            {invoices.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-line rounded-3xl bg-pearl/30">
                <IndianRupee className="w-12 h-12 text-dim mx-auto mb-3" />
                <h3 className="text-base font-bold text-ink">No Invoices Issued</h3>
                <p className="text-xs text-dim mt-1">This client does not have any billing details generated.</p>
              </div>
            ) : (
              <div className="border border-line rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-line text-left text-xs">
                    <thead className="bg-pearl text-dim uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Prof. Fee</th>
                        <th className="px-6 py-4">Gov. Fee</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white text-ink">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-pearl/10 transition-all">
                          <td className="px-6 py-4 font-bold">{invoice.description}</td>
                          <td className="px-6 py-4">₹{Number(invoice.professional_fees).toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4">₹{Number(invoice.government_fees).toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 font-bold">₹{Number(invoice.total).toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              invoice.status === 'paid' ? 'bg-jade/10 text-jade' :
                              invoice.status === 'pending' ? 'bg-rose/10 text-rose' :
                              'bg-gold/10 text-gold'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleInvoice(invoice.id, invoice.status)}
                              className="px-3 py-1 border border-line hover:border-ink rounded-lg text-xs font-semibold bg-white cursor-pointer transition-all hover:bg-pearl"
                            >
                              Toggle Paid
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="p-2 border border-line hover:border-rose rounded-lg text-dim hover:text-rose bg-white transition-all cursor-pointer inline-flex items-center"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
      
      {/* Admin Footer */}
      <footer className="bg-ink2 text-gray-500 py-6 border-t border-white/5 mt-auto text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Innovise Consultant. Authorized CA &amp; CS Staff Console.</p>
      </footer>
      {/* Edit Client Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-white border border-line rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-line bg-pearl flex justify-between items-center">
              <h3 className="text-lg font-bold text-ink">Edit Client Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-dim hover:text-ink text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {editModalError && (
                <div className="mb-4 p-4 rounded-xl bg-rose/10 border border-rose/20 text-rose text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{editModalError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateClient} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +91 9506166560"
                    className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. rahul@company.com"
                    className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-1">Billing Address</label>
                  <textarea
                    rows={3}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Corporate or billing address"
                    className="block w-full px-3 py-2 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-line rounded-xl text-xs font-bold text-dim hover:bg-pearl transition-all cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editModalLoading}
                    className="px-5 py-2 bg-ink hover:bg-ink2 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {editModalLoading ? 'Saving...' : 'Save Profile'}
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
