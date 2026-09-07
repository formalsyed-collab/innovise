'use client'

import { use, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Award, 
  Clock, FileText, IndianRupee, Plus, Edit, Check, 
  Trash2, Upload, Download, AlertTriangle, CheckCircle, RefreshCw,
  Landmark, ShieldCheck, FileSpreadsheet, Sparkles, Save, CheckCircle2,
  Calendar, Hash, Building2, TrendingUp, AlertCircle, RefreshCcw
} from 'lucide-react'
import Link from 'next/link'

export interface GstCashHead {
  tax: number
  interest: number
  penalty: number
  fee: number
  others: number
  total: number
}

export interface GstLedgerData {
  gstin?: string
  trade_name?: string
  legal_name?: string
  taxpayer_type?: string
  status?: string
  cash_ledger: {
    igst: GstCashHead
    cgst: GstCashHead
    sgst: GstCashHead
    cess: GstCashHead
    total_cash: number
  }
  credit_ledger: {
    igst: number
    cgst: number
    sgst: number
    cess: number
    total_credit: number
  }
  liability_ledger?: {
    igst: number
    cgst: number
    sgst: number
    cess: number
    total_liability: number
  }
  return_status?: {
    gstr1?: {
      period: string
      status: 'Filed' | 'Pending' | 'Due' | 'Not Applicable'
      filing_date?: string
      arn?: string
    }
    gstr3b?: {
      period: string
      status: 'Filed' | 'Pending' | 'Due' | 'Not Applicable'
      filing_date?: string
      arn?: string
    }
    gstr9?: {
      period: string
      status: 'Filed' | 'Pending' | 'Due' | 'Optional'
      filing_date?: string
      arn?: string
    }
    next_due_date?: string
  }
  remarks?: string
  updated_at?: string
  updated_by_name?: string
}

interface ClientProfile {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  bank_details?: {
    gst_ledger?: GstLedgerData
    [key: string]: any
  } | null
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
  service_id: string | null
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
  refrens_invoice_id?: string | null
  refrens_pdf_url?: string | null
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  // App states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'services' | 'documents' | 'payments' | 'gst_ledger'>('services')

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // Modal / Form States
  const [actionError, setActionError] = useState<string | null>(null)

  // GST Ledger Form States
  const [gstin, setGstin] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [taxpayerType, setTaxpayerType] = useState('Regular')
  const [taxpayerStatus, setTaxpayerStatus] = useState('Active')

  // Cash Ledger Breakdown (Tax, Interest, Penalty, Fee, Others)
  const [cashIgstTax, setCashIgstTax] = useState('0')
  const [cashIgstInt, setCashIgstInt] = useState('0')
  const [cashIgstPen, setCashIgstPen] = useState('0')
  const [cashIgstFee, setCashIgstFee] = useState('0')
  const [cashIgstOth, setCashIgstOth] = useState('0')

  const [cashCgstTax, setCashCgstTax] = useState('0')
  const [cashCgstInt, setCashCgstInt] = useState('0')
  const [cashCgstPen, setCashCgstPen] = useState('0')
  const [cashCgstFee, setCashCgstFee] = useState('0')
  const [cashCgstOth, setCashCgstOth] = useState('0')

  const [cashSgstTax, setCashSgstTax] = useState('0')
  const [cashSgstInt, setCashSgstInt] = useState('0')
  const [cashSgstPen, setCashSgstPen] = useState('0')
  const [cashSgstFee, setCashSgstFee] = useState('0')
  const [cashSgstOth, setCashSgstOth] = useState('0')

  const [cashCessTax, setCashCessTax] = useState('0')
  const [cashCessInt, setCashCessInt] = useState('0')
  const [cashCessPen, setCashCessPen] = useState('0')
  const [cashCessFee, setCashCessFee] = useState('0')
  const [cashCessOth, setCashCessOth] = useState('0')

  // Credit Ledger (ITC) Breakdown
  const [creditIgst, setCreditIgst] = useState('0')
  const [creditCgst, setCreditCgst] = useState('0')
  const [creditSgst, setCreditSgst] = useState('0')
  const [creditCess, setCreditCess] = useState('0')

  // Electronic Liability / Dues
  const [liabilityIgst, setLiabilityIgst] = useState('0')
  const [liabilityCgst, setLiabilityCgst] = useState('0')
  const [liabilitySgst, setLiabilitySgst] = useState('0')
  const [liabilityCess, setLiabilityCess] = useState('0')

  // Returns Filing Snapshot
  const [gstr1Period, setGstr1Period] = useState('')
  const [gstr1Status, setGstr1Status] = useState<'Filed' | 'Pending' | 'Due' | 'Not Applicable'>('Filed')
  const [gstr1Date, setGstr1Date] = useState('')
  const [gstr1Arn, setGstr1Arn] = useState('')

  const [gstr3bPeriod, setGstr3bPeriod] = useState('')
  const [gstr3bStatus, setGstr3bStatus] = useState<'Filed' | 'Pending' | 'Due' | 'Not Applicable'>('Filed')
  const [gstr3bDate, setGstr3bDate] = useState('')
  const [gstr3bArn, setGstr3bArn] = useState('')

  const [gstr9Period, setGstr9Period] = useState('')
  const [gstr9Status, setGstr9Status] = useState<'Filed' | 'Pending' | 'Due' | 'Optional'>('Filed')
  const [gstr9Date, setGstr9Date] = useState('')
  const [gstr9Arn, setGstr9Arn] = useState('')

  const [nextDueDate, setNextDueDate] = useState('')
  const [gstRemarks, setGstRemarks] = useState('')

  const [gstSaveLoading, setGstSaveLoading] = useState(false)
  const [gstSaveMsg, setGstSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Populate GST state helper
  const populateGstFields = (ledger?: GstLedgerData | null, clientName?: string) => {
    if (!ledger) {
      setTradeName(clientName || '')
      setLegalName(clientName || '')
      return
    }
    setGstin(ledger.gstin || '')
    setTradeName(ledger.trade_name || clientName || '')
    setLegalName(ledger.legal_name || clientName || '')
    setTaxpayerType(ledger.taxpayer_type || 'Regular')
    setTaxpayerStatus(ledger.status || 'Active')

    // Cash Ledger
    if (ledger.cash_ledger) {
      const { igst, cgst, sgst, cess } = ledger.cash_ledger
      setCashIgstTax(String(igst?.tax ?? 0))
      setCashIgstInt(String(igst?.interest ?? 0))
      setCashIgstPen(String(igst?.penalty ?? 0))
      setCashIgstFee(String(igst?.fee ?? 0))
      setCashIgstOth(String(igst?.others ?? 0))

      setCashCgstTax(String(cgst?.tax ?? 0))
      setCashCgstInt(String(cgst?.interest ?? 0))
      setCashCgstPen(String(cgst?.penalty ?? 0))
      setCashCgstFee(String(cgst?.fee ?? 0))
      setCashCgstOth(String(cgst?.others ?? 0))

      setCashSgstTax(String(sgst?.tax ?? 0))
      setCashSgstInt(String(sgst?.interest ?? 0))
      setCashSgstPen(String(sgst?.penalty ?? 0))
      setCashSgstFee(String(sgst?.fee ?? 0))
      setCashSgstOth(String(sgst?.others ?? 0))

      setCashCessTax(String(cess?.tax ?? 0))
      setCashCessInt(String(cess?.interest ?? 0))
      setCashCessPen(String(cess?.penalty ?? 0))
      setCashCessFee(String(cess?.fee ?? 0))
      setCashCessOth(String(cess?.others ?? 0))
    }

    // Credit Ledger (ITC)
    if (ledger.credit_ledger) {
      setCreditIgst(String(ledger.credit_ledger.igst ?? 0))
      setCreditCgst(String(ledger.credit_ledger.cgst ?? 0))
      setCreditSgst(String(ledger.credit_ledger.sgst ?? 0))
      setCreditCess(String(ledger.credit_ledger.cess ?? 0))
    }

    // Liability
    if (ledger.liability_ledger) {
      setLiabilityIgst(String(ledger.liability_ledger.igst ?? 0))
      setLiabilityCgst(String(ledger.liability_ledger.cgst ?? 0))
      setLiabilitySgst(String(ledger.liability_ledger.sgst ?? 0))
      setLiabilityCess(String(ledger.liability_ledger.cess ?? 0))
    }

    // Returns
    if (ledger.return_status) {
      const { gstr1, gstr3b, gstr9, next_due_date } = ledger.return_status
      if (gstr1) {
        setGstr1Period(gstr1.period || '')
        setGstr1Status(gstr1.status || 'Filed')
        setGstr1Date(gstr1.filing_date || '')
        setGstr1Arn(gstr1.arn || '')
      }
      if (gstr3b) {
        setGstr3bPeriod(gstr3b.period || '')
        setGstr3bStatus(gstr3b.status || 'Filed')
        setGstr3bDate(gstr3b.filing_date || '')
        setGstr3bArn(gstr3b.arn || '')
      }
      if (gstr9) {
        setGstr9Period(gstr9.period || '')
        setGstr9Status(gstr9.status || 'Filed')
        setGstr9Date(gstr9.filing_date || '')
        setGstr9Arn(gstr9.arn || '')
      }
      setNextDueDate(next_due_date || '')
    }

    setGstRemarks(ledger.remarks || '')
  }

  // Load standard realistic demo data
  const handleLoadSampleGstData = () => {
    const defaultGstin = '09AAECI4589K1ZK'
    setGstin(defaultGstin)
    setTradeName(client?.full_name || 'Innovise Corporate Client')
    setLegalName(client?.full_name || 'Innovise Corporate Client')
    setTaxpayerType('Regular')
    setTaxpayerStatus('Active')

    // Cash Ledger sample
    setCashIgstTax('12500')
    setCashIgstInt('0')
    setCashIgstPen('0')
    setCashIgstFee('0')
    setCashIgstOth('0')

    setCashCgstTax('18450')
    setCashCgstInt('0')
    setCashCgstPen('0')
    setCashCgstFee('0')
    setCashCgstOth('0')

    setCashSgstTax('18450')
    setCashSgstInt('0')
    setCashSgstPen('0')
    setCashSgstFee('0')
    setCashSgstOth('0')

    setCashCessTax('0')
    setCashCessInt('0')
    setCashCessPen('0')
    setCashCessFee('0')
    setCashCessOth('0')

    // Credit Ledger (ITC) sample
    setCreditIgst('42800')
    setCreditCgst('65200')
    setCreditSgst('65200')
    setCreditCess('0')

    // Liability sample
    setLiabilityIgst('0')
    setLiabilityCgst('0')
    setLiabilitySgst('0')
    setLiabilityCess('0')

    // Return status
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    setGstr1Period(currentMonth)
    setGstr1Status('Filed')
    setGstr1Date(new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0])
    setGstr1Arn('AA09' + Math.floor(1000000000 + Math.random() * 9000000000))

    setGstr3bPeriod(currentMonth)
    setGstr3bStatus('Filed')
    setGstr3bDate(new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0])
    setGstr3bArn('AB09' + Math.floor(1000000000 + Math.random() * 9000000000))

    setGstr9Period('FY 2025-26')
    setGstr9Status('Filed')
    setGstr9Date('2026-03-15')
    setGstr9Arn('AC0987654321012')

    setNextDueDate(new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0])
    setGstRemarks('ITC balance has been fully reconciled against GSTR-2B. Total surplus input tax credit of ₹1,73,200 is safely carried forward to offset future outward tax liabilities.')

    setGstSaveMsg({ type: 'success', text: 'Loaded standard GST portal template. Click "Save & Sync to Client Portal" to apply.' })
  }

  // Save GST ledger
  const handleSaveGstLedger = async (e: React.FormEvent) => {
    e.preventDefault()
    setGstSaveLoading(true)
    setGstSaveMsg(null)

    try {
      const igstCashTotal = Number(cashIgstTax) + Number(cashIgstInt) + Number(cashIgstPen) + Number(cashIgstFee) + Number(cashIgstOth)
      const cgstCashTotal = Number(cashCgstTax) + Number(cashCgstInt) + Number(cashCgstPen) + Number(cashCgstFee) + Number(cashCgstOth)
      const sgstCashTotal = Number(cashSgstTax) + Number(cashSgstInt) + Number(cashSgstPen) + Number(cashSgstFee) + Number(cashSgstOth)
      const cessCashTotal = Number(cashCessTax) + Number(cashCessInt) + Number(cashCessPen) + Number(cashCessFee) + Number(cashCessOth)
      const totalCash = igstCashTotal + cgstCashTotal + sgstCashTotal + cessCashTotal

      const crIgst = Number(creditIgst) || 0
      const crCgst = Number(creditCgst) || 0
      const crSgst = Number(creditSgst) || 0
      const crCess = Number(creditCess) || 0
      const totalCredit = crIgst + crCgst + crSgst + crCess

      const liIgst = Number(liabilityIgst) || 0
      const liCgst = Number(liabilityCgst) || 0
      const liSgst = Number(liabilitySgst) || 0
      const liCess = Number(liabilityCess) || 0
      const totalLiability = liIgst + liCgst + liSgst + liCess

      const ledgerPayload: GstLedgerData = {
        gstin: gstin.trim().toUpperCase(),
        trade_name: tradeName.trim(),
        legal_name: legalName.trim(),
        taxpayer_type: taxpayerType,
        status: taxpayerStatus,
        cash_ledger: {
          igst: {
            tax: Number(cashIgstTax) || 0,
            interest: Number(cashIgstInt) || 0,
            penalty: Number(cashIgstPen) || 0,
            fee: Number(cashIgstFee) || 0,
            others: Number(cashIgstOth) || 0,
            total: igstCashTotal
          },
          cgst: {
            tax: Number(cashCgstTax) || 0,
            interest: Number(cashCgstInt) || 0,
            penalty: Number(cashCgstPen) || 0,
            fee: Number(cashCgstFee) || 0,
            others: Number(cashCgstOth) || 0,
            total: cgstCashTotal
          },
          sgst: {
            tax: Number(cashSgstTax) || 0,
            interest: Number(cashSgstInt) || 0,
            penalty: Number(cashSgstPen) || 0,
            fee: Number(cashSgstFee) || 0,
            others: Number(cashSgstOth) || 0,
            total: sgstCashTotal
          },
          cess: {
            tax: Number(cashCessTax) || 0,
            interest: Number(cashCessInt) || 0,
            penalty: Number(cashCessPen) || 0,
            fee: Number(cashCessFee) || 0,
            others: Number(cashCessOth) || 0,
            total: cessCashTotal
          },
          total_cash: totalCash
        },
        credit_ledger: {
          igst: crIgst,
          cgst: crCgst,
          sgst: crSgst,
          cess: crCess,
          total_credit: totalCredit
        },
        liability_ledger: {
          igst: liIgst,
          cgst: liCgst,
          sgst: liSgst,
          cess: liCess,
          total_liability: totalLiability
        },
        return_status: {
          gstr1: {
            period: gstr1Period,
            status: gstr1Status,
            filing_date: gstr1Date,
            arn: gstr1Arn
          },
          gstr3b: {
            period: gstr3bPeriod,
            status: gstr3bStatus,
            filing_date: gstr3bDate,
            arn: gstr3bArn
          },
          gstr9: {
            period: gstr9Period,
            status: gstr9Status,
            filing_date: gstr9Date,
            arn: gstr9Arn
          },
          next_due_date: nextDueDate
        },
        remarks: gstRemarks.trim()
      }

      const res = await fetch('/api/admin/update-gst-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          gstLedger: ledgerPayload
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update GST ledger.')
      }

      setGstSaveMsg({ type: 'success', text: '✅ GST portal ledger successfully updated & synced to client dashboard!' })
      await loadData()

    } catch (err: any) {
      setGstSaveMsg({ type: 'error', text: err.message || 'Error updating GST ledger.' })
    } finally {
      setGstSaveLoading(false)
    }
  }

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
  const [serviceUploadDocType, setServiceUploadDocType] = useState<{[serviceId: string]: string}>({})
  const [customDocTypeInput, setCustomDocTypeInput] = useState<{[serviceId: string]: string}>({})
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
      populateGstFields(profRes.data.bank_details?.gst_ledger, profRes.data.full_name)
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

    try {
      const res = await fetch('/api/admin/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          description: invDesc,
          professionalFees: invProfFee,
          governmentFees: invGovFee,
          dueDate: invDueDate
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invoice.')
      }

      setInvDesc('')
      setInvProfFee('')
      setInvGovFee('')
      setInvDueDate('')
      setShowInvoiceForm(false)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || 'Error creating invoice.')
    } finally {
      setInvoiceFormLoading(false)
    }
  }

  // Handle HTML print invoice generation (admin view fallback)
  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const res = await fetch('/api/payments/refrens/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id })
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url, '_blank')
        return
      }
    } catch (e) {
      console.warn('Refrens on-demand generation failed, falling back to local print:', e)
    }

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) {
      alert('Pop-up blocker is active. Please enable pop-ups to download invoices.')
      return
    }

    const professionalFees = Number(invoice.professional_fees)
    const governmentFees = Number(invoice.government_fees)
    const total = Number(invoice.total)
    const dueDate = new Date(invoice.due_date).toLocaleDateString('en-IN')
    const paidDate = invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString('en-IN') : null

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice.description}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1c2e45;
              background-color: #ffffff;
              margin: 0;
              padding: 40px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #d1dcf0;
              padding-bottom: 24px;
              margin-bottom: 32px;
            }

            .logo-title {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .company-name {
              font-size: 22px;
              font-weight: 800;
              color: #07111F;
              letter-spacing: 1px;
              margin: 0;
            }

            .company-sub {
              font-size: 10px;
              font-weight: 600;
              color: #566880;
              letter-spacing: 1.5px;
              margin: 2px 0 0 0;
            }

            .company-details {
              font-size: 11px;
              text-align: right;
              color: #566880;
              line-height: 1.6;
            }

            .details-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }

            .section-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #566880;
              letter-spacing: 1px;
              margin-bottom: 8px;
              border-bottom: 1px solid #d1dcf0;
              padding-bottom: 6px;
            }

            .detail-text {
              font-size: 13px;
              line-height: 1.6;
              margin: 0 0 4px 0;
            }

            .detail-text strong {
              color: #07111F;
            }

            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }

            .invoice-table th {
              background-color: #f8fafd;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #566880;
              padding: 12px 16px;
              text-align: left;
              border-bottom: 1px solid #d1dcf0;
            }

            .invoice-table td {
              font-size: 13px;
              padding: 16px;
              border-bottom: 1px solid #d1dcf0;
              color: #1c2e45;
            }

            .invoice-table td.amount-col {
              text-align: right;
            }

            .invoice-table th.amount-col {
              text-align: right;
            }

            .summary-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 20px;
            }

            .status-badge {
              display: inline-block;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 8px 16px;
              border-radius: 50px;
            }

            .status-paid {
              background-color: #d1f2e5;
              color: #059669;
              border: 1px solid #a7f3d0;
            }

            .status-pending {
              background-color: #fee2e2;
              color: #ef4444;
              border: 1px solid #fca5a5;
            }

            .summary-table {
              width: 320px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 13px;
              color: #566880;
            }

            .summary-row.total-row {
              font-size: 16px;
              font-weight: 800;
              color: #07111F;
              border-top: 2px solid #d1dcf0;
              padding-top: 12px;
              margin-top: 8px;
            }

            .invoice-footer {
              margin-top: 80px;
              text-align: center;
              font-size: 11px;
              color: #566880;
              border-top: 1px dashed #d1dcf0;
              padding-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="logo-title">
                <div style="width: 40px; height: 40px; background-color: #07111F; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <span style="color: white; font-weight: 900; font-size: 20px;">I</span>
                </div>
                <div>
                  <h1 class="company-name">INNOVISE</h1>
                  <p class="company-sub">CLIENT PORTAL</p>
                </div>
              </div>
              <div class="company-details">
                <strong>Innovise Consultant</strong><br />
                Civil Lines, Kanpur, Uttar Pradesh<br />
                Email: officialtaxinn@gmail.com<br />
                Phone: +91 80525 66560
              </div>
            </div>

            <div class="details-grid">
              <div>
                <h3 class="section-title">Billed To</h3>
                <p class="detail-text"><strong>${client?.full_name || 'Valued Client'}</strong></p>
                <p class="detail-text">${client?.phone || ''}</p>
                <p class="detail-text">${client?.email || ''}</p>
                ${client?.address ? `<p class="detail-text" style="white-space: pre-line;">${client.address}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <h3 class="section-title">Invoice Details</h3>
                <p class="detail-text">Invoice ID: <strong>#${invoice.id.substring(0, 8).toUpperCase()}</strong></p>
                <p class="detail-text">Due Date: <strong>${dueDate}</strong></p>
                ${paidDate ? `<p class="detail-text">Payment Date: <strong>${paidDate}</strong></p>` : ''}
              </div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount-col" style="width: 150px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Professional Fees for ${invoice.description}</td>
                  <td class="amount-col">₹${professionalFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Government Fees / Out of Pocket Expenses</td>
                  <td class="amount-col">₹${governmentFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary-section">
              <div>
                <span class="status-badge ${invoice.status === 'paid' ? 'status-paid' : 'status-pending'}">
                  ${invoice.status.toUpperCase()}
                </span>
              </div>
              <div class="summary-table">
                <div class="summary-row">
                  <span>Professional Fees:</span>
                  <span>₹${professionalFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="summary-row">
                  <span>Government Fees:</span>
                  <span>₹${governmentFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="summary-row total-row">
                  <span>Total Amount Due:</span>
                  <span>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div class="invoice-footer">
              Thank you for choosing Innovise. For any billing queries, write to officialtaxinn@gmail.com
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
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
  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string = 'OTHER', serviceId: string | null = null) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCol(serviceId || docType)
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
          service_id: serviceId,
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
          <button
            onClick={() => setActiveTab('gst_ledger')}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gst_ledger' ? 'text-fire border-b-2 border-fire' : 'text-dim hover:text-ink'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            GST Portal &amp; Ledger
            {client?.bank_details?.gst_ledger?.gstin ? (
              <span className="bg-jade/15 text-jade text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                {client.bank_details.gst_ledger.gstin.slice(0, 5)}...
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-gold inline-block" title="Ledger not configured"></span>
            )}
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
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Template Service --</option>
                      <optgroup label="🚀 Startup India">
                        <option value="Startup India Registration">Startup India Registration</option>
                        <option value="80-IAC Tax Exemption">80-IAC Tax Exemption</option>
                        <option value="Private Limited Company Registration">Private Limited Company Registration</option>
                        <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                        <option value="MSME / Udyam Registration">MSME / Udyam Registration</option>
                        <option value="Trademark Registration">Trademark Registration</option>
                      </optgroup>
                      <optgroup label="🏢 Business Registration">
                        <option value="Private Limited Company Registration">Private Limited Company Registration</option>
                        <option value="LLP Registration">LLP Registration</option>
                        <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                        <option value="Partnership Firm Registration">Partnership Firm Registration</option>
                        <option value="Sole Proprietorship Registration">Sole Proprietorship Registration</option>
                        <option value="Section 8 Company / NGO">Section 8 Company / NGO</option>
                        <option value="Trust Registration">Trust Registration</option>
                        <option value="Society Registration">Society Registration</option>
                        <option value="Indian Subsidiary Registration">Indian Subsidiary Registration</option>
                        <option value="Digital Signature (DSC)">Digital Signature (DSC)</option>
                        <option value="MSME / Udyam Registration">MSME / Udyam Registration</option>
                        <option value="IEC / Import Export Code">IEC / Import Export Code</option>
                        <option value="Barcode Registration">Barcode Registration</option>
                        <option value="Virtual Office for Registration">Virtual Office for Registration</option>
                      </optgroup>
                      <optgroup label="📊 GST &amp; Tax">
                        <option value="GST Registration">GST Registration</option>
                        <option value="GST Return Filing">GST Return Filing</option>
                        <option value="GSTR-9 Annual Return">GSTR-9 Annual Return</option>
                        <option value="GST Cancellation / Surrender">GST Cancellation / Surrender</option>
                        <option value="GST E-Invoice Setup">GST E-Invoice Setup</option>
                        <option value="E-Way Bill Registration">E-Way Bill Registration</option>
                        <option value="Income Tax Return (ITR) Filing">Income Tax Return (ITR) Filing</option>
                        <option value="TDS Return Filing">TDS Return Filing</option>
                        <option value="PF Return Filing">PF Return Filing</option>
                        <option value="Input Tax Credit (ITC) Claim">Input Tax Credit (ITC) Claim</option>
                      </optgroup>
                      <optgroup label="📋 Compliance &amp; MCA">
                        <option value="Annual Compliance – Private Limited">Annual Compliance – Private Limited</option>
                        <option value="Annual Compliance – LLP">Annual Compliance – LLP</option>
                        <option value="Bookkeeping &amp; Accounting">Bookkeeping &amp; Accounting</option>
                        <option value="Director KYC (DIR-3 KYC)">Director KYC (DIR-3 KYC)</option>
                        <option value="Change Company Name">Change Company Name</option>
                        <option value="Change Registered Office">Change Registered Office</option>
                        <option value="Issue / Transfer of Shares">Issue / Transfer of Shares</option>
                        <option value="Company Winding Up / Strike Off">Company Winding Up / Strike Off</option>
                        <option value="12A &amp; 80G Registration">12A &amp; 80G Registration</option>
                        <option value="FCRA Registration">FCRA Registration</option>
                      </optgroup>
                      <optgroup label="™️ Trademark &amp; IPR">
                        <option value="Trademark Registration">Trademark Registration</option>
                        <option value="Trademark Renewal">Trademark Renewal</option>
                        <option value="Trademark Objection Reply">Trademark Objection Reply</option>
                        <option value="International Trademark (Madrid)">International Trademark (Madrid)</option>
                        <option value="Copyright Registration">Copyright Registration</option>
                        <option value="Patent Registration">Patent Registration</option>
                        <option value="Design Registration">Design Registration</option>
                        <option value="IP Dispute Resolution">IP Dispute Resolution</option>
                      </optgroup>
                      <optgroup label="🏛️ Licenses">
                        <option value="FSSAI Food License">FSSAI Food License</option>
                        <option value="Drug License">Drug License</option>
                        <option value="ISO Certification">ISO Certification</option>
                        <option value="AYUSH License">AYUSH License</option>
                        <option value="Factory License">Factory License</option>
                        <option value="Shop &amp; Establishment License">Shop &amp; Establishment License</option>
                        <option value="RERA Registration">RERA Registration</option>
                        <option value="BIS Certification">BIS Certification</option>
                        <option value="Medical Device Registration">Medical Device Registration</option>
                        <option value="APEDA Registration">APEDA Registration</option>
                      </optgroup>
                      <optgroup label="🌍 International">
                        <option value="Company Registration in UAE / Dubai">Company Registration in UAE / Dubai</option>
                        <option value="Company Registration in UK">Company Registration in UK</option>
                        <option value="Company Registration in USA">Company Registration in USA</option>
                        <option value="Company Registration in Singapore">Company Registration in Singapore</option>
                        <option value="Company Registration in Canada">Company Registration in Canada</option>
                        <option value="Company Registration in Australia">Company Registration in Australia</option>
                        <option value="Dubai Free Zone Setup">Dubai Free Zone Setup</option>
                      </optgroup>
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

                        {/* Service Documents Upload & List (Admin view) */}
                        <div className="mt-6 pt-6 border-t border-line space-y-4 text-xs">
                          <h4 className="font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-fire" />
                            Uploaded Documents
                          </h4>

                          {/* Documents List */}
                          {(() => {
                            const serviceDocs = documents.filter(d => d.service_id === service.id)
                            if (serviceDocs.length === 0) {
                              return (
                                <p className="text-dim italic pl-1">No documents uploaded for this service yet.</p>
                              )
                            }
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {serviceDocs.map(doc => (
                                  <div key={doc.id} className="p-3 bg-pearl border border-line rounded-xl flex items-center justify-between hover:border-line2 transition-all">
                                    <div className="min-w-0 pr-2">
                                      <span className="font-bold text-ink block truncate" title={doc.file_name}>{doc.file_name}</span>
                                      <span className="text-[10px] text-dim block mt-0.5">
                                        Type: <strong>{doc.doc_type || 'General'}</strong> &bull; {new Date(doc.created_at).toLocaleDateString('en-IN')}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        doc.status === 'verified' ? 'bg-jade/10 text-jade' :
                                        doc.status === 'submitted' ? 'bg-sky/10 text-sky' :
                                        'bg-gold/10 text-gold'
                                      }`}>
                                        {doc.status}
                                      </span>
                                      <button
                                        onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                                        className="p-1.5 hover:bg-mist rounded-lg border border-line text-dim hover:text-ink transition-all cursor-pointer animate-fade-in"
                                        title="Download"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      {doc.status !== 'verified' && (
                                        <button
                                          onClick={() => handleVerifyDoc(doc.id)}
                                          className="p-1.5 hover:bg-jade/10 rounded-lg border border-line text-dim hover:text-jade transition-all cursor-pointer"
                                          title="Verify Document"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteDoc(doc.id, doc.storage_path)}
                                        className="p-1.5 hover:bg-rose/10 rounded-lg border border-line text-dim hover:text-rose transition-all cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })()}

                          {/* Upload Area for Admin */}
                          <div className="bg-pearl/30 border border-line rounded-xl p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                              {/* Document Type Selector */}
                              <div className="flex-grow">
                                <label className="text-[10px] font-bold text-dim block mb-1">Select Document Type</label>
                                <select
                                  value={serviceUploadDocType[service.id] || 'GST Certificate'}
                                  onChange={(e) => setServiceUploadDocType(prev => ({ ...prev, [service.id]: e.target.value }))}
                                  className="w-full text-xs font-medium bg-white border border-line rounded-lg p-2 text-ink outline-none focus:border-fire transition-all cursor-pointer"
                                >
                                  <option value="GST Certificate">GST Certificate</option>
                                  <option value="PAN Card">PAN Card</option>
                                  <option value="Aadhaar Card">Aadhaar Card</option>
                                  <option value="Electricity Bill">Electricity Bill (Address Proof)</option>
                                  <option value="Rent Agreement">Rent Agreement</option>
                                  <option value="MSME Certificate">MSME / Udyam Certificate</option>
                                  <option value="FSSAI License">FSSAI License</option>
                                  <option value="Trademark Certificate">Trademark Certificate</option>
                                  <option value="CUSTOM">Custom Document Type...</option>
                                </select>
                              </div>

                              {/* Custom Type Input if 'CUSTOM' selected */}
                              {serviceUploadDocType[service.id] === 'CUSTOM' && (
                                <div className="flex-grow">
                                  <label className="text-[10px] font-bold text-dim block mb-1">Enter Document Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. GST Certificate, Aadhaar Card"
                                    value={customDocTypeInput[service.id] || ''}
                                    onChange={(e) => setCustomDocTypeInput(prev => ({ ...prev, [service.id]: e.target.value }))}
                                    className="w-full text-xs font-medium bg-white border border-line rounded-lg p-2 text-ink outline-none focus:border-fire transition-all"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Direct File Input Selector */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-grow">
                                <label className="relative inline-flex items-center gap-2 px-3 py-2 bg-white border border-line hover:border-fire hover:text-fire text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>{uploadingCol === service.id ? 'Uploading...' : 'Choose File'}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png"
                                    onChange={(e) => {
                                      const selectedType = serviceUploadDocType[service.id] || 'GST Certificate';
                                      let finalDocType = selectedType;
                                      if (selectedType === 'CUSTOM') {
                                        finalDocType = customDocTypeInput[service.id]?.trim() || 'General Document';
                                      }
                                      handleAdminUpload(e, finalDocType, service.id);
                                    }}
                                    disabled={uploadingCol === service.id}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </label>
                              </div>
                              <span className="text-[10px] text-dim">PDF, JPG, or PNG (Max 10MB)</span>
                            </div>
                          </div>
                        </div>
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
                              onClick={() => handleDownloadInvoice(invoice)}
                              className="px-3 py-1 border border-line hover:border-ink hover:text-ink text-xs font-semibold rounded-lg bg-white cursor-pointer transition-all hover:bg-pearl inline-flex items-center gap-1.5"
                              title="Download Invoice"
                            >
                              <Download className="w-3.5 h-3.5 text-dim" />
                              <span>Download</span>
                            </button>

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

        {/* TAB 4: GST PORTAL & LEDGER MANAGEMENT */}
        {activeTab === 'gst_ledger' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header & Quick Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-ink via-ink2 to-ink3 text-white p-6 rounded-3xl shadow-xl shadow-ink/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/10 text-gold backdrop-blur-md">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">GST Portal Ledger Management</h2>
                  <span className="bg-fire/20 text-fire3 border border-fire3/30 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
                    Admin Console
                  </span>
                </div>
                <p className="text-xs text-gray-300 max-w-2xl">
                  Manually update and synchronize the client's electronic cash ledger, ITC credit balance, liability records, and return filing history shown on their portal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleLoadSampleGstData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer shadow-sm"
                  title="Auto-fill with standard active GST taxpayer values"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  Load Sample Preset
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
                  title="Reload from database"
                >
                  <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {gstSaveMsg && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
                gstSaveMsg.type === 'success' 
                  ? 'bg-jade/10 border-jade/30 text-jade' 
                  : 'bg-rose/10 border-rose/30 text-rose'
              }`}>
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  {gstSaveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{gstSaveMsg.text}</span>
                </div>
                <button
                  onClick={() => setGstSaveMsg(null)}
                  className="text-xs opacity-70 hover:opacity-100 font-bold px-2 py-0.5"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Top Quick Live Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-pearl border border-line flex flex-col justify-between">
                <span className="text-[10px] font-bold text-dim uppercase tracking-wider">Registered GSTIN</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-mono font-extrabold text-ink">
                    {gstin || 'Not Configured'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    taxpayerStatus === 'Active' ? 'bg-jade/15 text-jade' : 'bg-gold/15 text-gold'
                  }`}>
                    {taxpayerStatus}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-pearl border border-line flex flex-col justify-between">
                <span className="text-[10px] font-bold text-dim uppercase tracking-wider">Electronic Cash Ledger</span>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-ink flex items-center">
                    ₹{(
                      Number(cashIgstTax) + Number(cashIgstInt) + Number(cashIgstPen) + Number(cashIgstFee) + Number(cashIgstOth) +
                      Number(cashCgstTax) + Number(cashCgstInt) + Number(cashCgstPen) + Number(cashCgstFee) + Number(cashCgstOth) +
                      Number(cashSgstTax) + Number(cashSgstInt) + Number(cashSgstPen) + Number(cashSgstFee) + Number(cashSgstOth) +
                      Number(cashCessTax) + Number(cashCessInt) + Number(cashCessPen) + Number(cashCessFee) + Number(cashCessOth)
                    ).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-dim block mt-0.5">Live Available Cash</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-pearl border border-line flex flex-col justify-between">
                <span className="text-[10px] font-bold text-dim uppercase tracking-wider">Credit Ledger (ITC)</span>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-jade flex items-center">
                    ₹{(
                      Number(creditIgst) + Number(creditCgst) + Number(creditSgst) + Number(creditCess)
                    ).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-dim block mt-0.5">Available Input Credit</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-pearl border border-line flex flex-col justify-between">
                <span className="text-[10px] font-bold text-dim uppercase tracking-wider">Net Tax Offset Balance</span>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-sky flex items-center">
                    ₹{(
                      (Number(cashIgstTax) + Number(cashIgstInt) + Number(cashIgstPen) + Number(cashIgstFee) + Number(cashIgstOth) +
                       Number(cashCgstTax) + Number(cashCgstInt) + Number(cashCgstPen) + Number(cashCgstFee) + Number(cashCgstOth) +
                       Number(cashSgstTax) + Number(cashSgstInt) + Number(cashSgstPen) + Number(cashSgstFee) + Number(cashSgstOth) +
                       Number(cashCessTax) + Number(cashCessInt) + Number(cashCessPen) + Number(cashCessFee) + Number(cashCessOth)) +
                      (Number(creditIgst) + Number(creditCgst) + Number(creditSgst) + Number(creditCess))
                    ).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-dim block mt-0.5">Total Liquid &amp; ITC Power</span>
                </div>
              </div>
            </div>

            {/* Form to edit GST Ledger */}
            <form onSubmit={handleSaveGstLedger} className="space-y-8">
              
              {/* SECTION 1: Taxpayer Identification */}
              <div className="border border-line rounded-3xl p-6 sm:p-7 bg-white shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-line">
                  <div className="w-8 h-8 rounded-lg bg-sky/10 text-sky flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink uppercase tracking-wider">1. GST Registration &amp; Business Profile</h3>
                    <p className="text-xs text-dim">GST Identification Number and registered entity details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      GSTIN Number (15 Digits) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 09AAECI4589K1ZK"
                      className="block w-full px-3.5 py-2.5 bg-pearl border border-line rounded-xl text-ink font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      Trade Name / Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      placeholder="e.g. Acme Corporate Solutions"
                      className="block w-full px-3.5 py-2.5 bg-pearl border border-line rounded-xl text-ink font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      Legal Name as per PAN
                    </label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="e.g. Acme Corporate Solutions Pvt Ltd"
                      className="block w-full px-3.5 py-2.5 bg-pearl border border-line rounded-xl text-ink font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      Taxpayer Type
                    </label>
                    <select
                      value={taxpayerType}
                      onChange={(e) => setTaxpayerType(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-pearl border border-line rounded-xl text-ink font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all cursor-pointer"
                    >
                      <option value="Regular">Regular Taxpayer</option>
                      <option value="Composition">Composition Taxpayer</option>
                      <option value="SEZ Unit / Developer">SEZ Unit / Developer</option>
                      <option value="Input Service Distributor (ISD)">Input Service Distributor (ISD)</option>
                      <option value="Casual Taxable Person">Casual Taxable Person</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      Registration Status
                    </label>
                    <select
                      value={taxpayerStatus}
                      onChange={(e) => setTaxpayerStatus(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-pearl border border-line rounded-xl text-ink font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all cursor-pointer"
                    >
                      <option value="Active">Active (Compliant)</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Electronic Cash Ledger */}
              <div className="border border-line rounded-3xl p-6 sm:p-7 bg-white shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-bold">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wider">2. Electronic Cash Ledger Balance</h3>
                      <p className="text-xs text-dim">Cash available in GST portal by tax head</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-dim">Total Cash Balance</span>
                    <span className="block text-base font-extrabold text-ink">
                      ₹{(Number(cashIgstTax) + Number(cashCgstTax) + Number(cashSgstTax) + Number(cashCessTax)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      IGST Cash (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashIgstTax}
                      onChange={(e) => setCashIgstTax(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      CGST Cash (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashCgstTax}
                      onChange={(e) => setCashCgstTax(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      SGST Cash (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashSgstTax}
                      onChange={(e) => setCashSgstTax(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      CESS Cash (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashCessTax}
                      onChange={(e) => setCashCessTax(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Electronic Credit Ledger (ITC) */}
              <div className="border border-line rounded-3xl p-6 sm:p-7 bg-white shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-jade/10 text-jade flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wider">3. Electronic Credit Ledger (Input Tax Credit / ITC)</h3>
                      <p className="text-xs text-dim">ITC available in Credit Ledger for setting off GST liabilities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-dim">Total ITC Credit Balance</span>
                    <span className="block text-base font-extrabold text-jade">
                      ₹{(Number(creditIgst) + Number(creditCgst) + Number(creditSgst) + Number(creditCess)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      IGST Credit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditIgst}
                      onChange={(e) => setCreditIgst(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      CGST Credit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditCgst}
                      onChange={(e) => setCreditCgst(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      SGST Credit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditSgst}
                      onChange={(e) => setCreditSgst(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-pearl/60 border border-line">
                    <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">
                      CESS Credit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditCess}
                      onChange={(e) => setCreditCess(e.target.value)}
                      placeholder="0"
                      className="block w-full px-3 py-2 bg-white border border-line rounded-xl text-ink font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action Submit Bar */}
              <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-line shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-dim flex items-center gap-2">
                  <Clock className="w-4 h-4 text-dim flex-shrink-0" />
                  <span>
                    Last Updated: {client?.bank_details?.gst_ledger?.updated_at 
                      ? new Date(client.bank_details.gst_ledger.updated_at).toLocaleString('en-IN') 
                      : 'Never synchronized yet'}
                    {client?.bank_details?.gst_ledger?.updated_by_name && (
                      <span className="font-semibold text-ink"> ({client.bank_details.gst_ledger.updated_by_name})</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => populateGstFields(client?.bank_details?.gst_ledger, client?.full_name)}
                    className="px-4 py-2.5 border border-line hover:border-ink rounded-xl text-xs font-bold text-dim hover:text-ink bg-white transition-all cursor-pointer"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={gstSaveLoading}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-fire hover:bg-fire2 text-white text-xs font-bold rounded-xl shadow-lg shadow-fire/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {gstSaveLoading ? 'Saving & Syncing...' : 'Save & Sync to Client Portal'}
                  </button>
                </div>
              </div>
            </form>
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
                    placeholder="e.g. +91 8052566560"
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
