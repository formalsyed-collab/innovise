'use client'

import { useState, useEffect } from 'react'
import { createClient, isSessionInitialized } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Phone, MapPin, Key, LogOut, CheckCircle2, 
  Clock, AlertTriangle, FileText, Upload, Download, Award,
  IndianRupee, ChevronRight, HelpCircle, Check, RefreshCw, CreditCard,
  Plus, X
} from 'lucide-react'

// Define typings
interface Profile {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  role: string
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
  service_id: string | null
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

const DASHBOARD_TRANSLATIONS = {
  en: {
    welcome: "Welcome back",
    overviewDesc: "Here is a summary of your compliance status and service filings.",
    activeServices: "Active Services",
    pendingDues: "Pending Dues",
    actionRequired: "Action Required",
    actionReqDesc: "Our compliance team requires some additional documents from you to process your filings.",
    uploadNow: "Upload Now",
    recentServices: "Recent Service Filings",
    noServices: "No registered services found. 🎉",
    tabOverview: "Dashboard Overview",
    tabServices: "My Services",
    tabDocuments: "Documents",
    tabPayments: "Invoices & Dues",
    tabProfile: "Profile Settings",
    logout: "Logout",
    subtabMonthlyBills: "Monthly Bills",
    subtabTaxFilings: "Tax Filings & Notices",
    subtabPendingRequests: "Pending Requests",
    subtabQueries: "Queries & Support",
    salesBills: "Sales Bills",
    salesBillsDesc: "Upload sales invoices or GST summary reports for the compliance team.",
    purchaseBills: "Purchase Bills",
    purchaseBillsDesc: "Upload purchase bills, utility bills, or business expense statements.",
    uploadSalesBillBtn: "+ Upload Sales Bill",
    uploadPurchaseBillBtn: "+ Upload Purchase Bill",
    download: "Download",
    reupload: "Re-upload",
    colMonthYear: "Month & Year",
    colFileName: "File Name",
    colUploadDate: "Upload Date",
    colStatus: "Status",
    colActions: "Actions",
    howToPay: "How to Pay",
    bankTransferTitle: "Bank Transfer Details",
    upiTransferTitle: "UPI Transfer Details",
    whatsappContact: "Contact to Pay via WhatsApp",
    docVault: "Documents Vault",
    docVaultDesc: "Upload files requested by the firm or download your verified registration certificates.",
    
    // Additional translations
    myRegisteredServices: "My Registered Services",
    servicesDesc: "Track the progress of your business registration and compliance filings.",
    noServicesFound: "No Services Found",
    noServicesEngagements: "You do not have any active engagements with Innovise at this moment.",
    started: "Started",
    expectedCompletion: "Expected Completion",
    updateFromConsultant: "Update from Consultant",
    firmUploads: "Firm Uploads",
    noGstrFiles: "No GSTR1 or 3B files.",
    noReturnFiles: "No Return files.",
    noNoticeFiles: "No Notice files.",
    queriesReporting: "Queries & Reporting",
    active: "Active",
    noQueries: "No queries submitted yet. Ask us anything about your tax filings!",
    myQuery: "My Query",
    teamResponse: "CA/CS Team Response",
    pendingReply: "Pending Reply",
    queryPlaceholder: "Describe your query, clarification needed, or request details...",
    sending: "Sending...",
    submitQuery: "Submit Query",
    noPendingRequests: "No Pending Requests 🎉",
    noPendingRequestsDesc: "We have all the files required for your ongoing services.",
    uploading: "Uploading...",
    uploadDoc: "Upload Document",
    noInvoices: "No Invoices Found 🎉",
    noInvoicesDesc: "All invoices are settled or none have been raised yet.",
    paymentsDesc: "View your professional fees, government fees, and payment instructions.",
    colDescription: "Description",
    colProfFee: "Prof. Fee",
    colGovFee: "Gov. Fee",
    colTotal: "Total",
    colDueDate: "Due Date",
    paying: "Paying...",
    payNow: "Pay Now",
    howToPayDesc: "To make a payment, please transfer the invoice amount to our bank account or scan the UPI details below. Once paid, share the transaction receipt with your consultant.",
    accountName: "Account Name",
    bank: "Bank",
    accountNumber: "Account Number",
    ifscCode: "IFSC Code",
    branch: "Branch",
    upiId: "UPI ID",
    gpayPhonePe: "GPAY / PhonePe",
    paymentHelp: "Need assistance or want to send receipt?",
    profileDesc: "Verify and update your basic contact details and address details.",
    fullName: "Full Name",
    emailLabel: "Email (Cannot Change)",
    phoneNumber: "Phone Number",
    billingAddress: "Billing Address",
    addressPlaceholder: "Your full billing address",
    saving: "Saving...",
    saveProfile: "Save Profile",
    changePassword: "Change Password",
    changePasswordDesc: "Keep your portal access secure by changing your password periodically.",
    newPassword: "New Password",
    passwordPlaceholder: "Min. 6 characters",
    updating: "Updating...",
    updatePassword: "Update Password",
    modalUploadTitleSales: "Upload Sales Bill",
    modalUploadTitlePurchase: "Upload Purchase Bill",
    modalUploadSub: "Secure Compliance Upload",
    selectMonthYear: "Select Month & Year",
    yearLabel: "Year:",
    uploadBillFile: "Upload Bill File",
    dragUpload: "Click or Drag to upload file",
    uploadLimits: "PDF, JPG, or PNG (Max 10MB)",
    uploadingSecure: "Uploading file securely...",
    uploadTarget: "Target",
    cancel: "Cancel",
    noBillsUploadedSales: 'No Sales bills uploaded yet. Click "+ Upload Sales Bill" to upload.',
    noBillsUploadedPurchase: 'No Purchase bills uploaded yet. Click "+ Upload Purchase Bill" to upload.',
    
    // Stages & status
    stageConsultation: "Consultation",
    stageDocsPending: "Docs Pending",
    stageInProgress: "In Progress",
    stageFiled: "Filed",
    stageCompleted: "Completed",
    
    statusSubmitted: "Submitted",
    statusVerified: "Verified",
    statusPending: "Pending",
    statusPaid: "Paid",
    statusPartial: "Partial",

    docRequestsPending: "Document Requests Pending",
    startDate: "Start Date",
    loadingPortal: "Loading your portal secure session...",

    selectPaymentMethod: "Select Payment Method",
    paymentMethodDesc: "Choose your preferred secure payment gateway to complete this transaction.",
    payWithRazorpay: "Pay with Razorpay",
    payWithPayU: "Pay with PayU",
    razorpayDesc: "Pay via Cards, Netbanking, UPI, and Wallet",
    payuDesc: "Pay securely via PayU checkout redirect",
    initiateNewService: "Initiate New Service",
    selectServiceCategory: "Select Category",
    selectServiceToStart: "Select Service to Start",
    requirementsPlaceholder: "Specify any custom requirements or comments (optional)...",
    uploadDocForService: "Upload Documents for this Service",
    selectDocType: "Select Document Type",
    customDocTypePlaceholder: "e.g. GST Certificate, Aadhaar Card, PAN Card",
    noDocsForService: "No documents uploaded for this service yet.",
    uploadedDocs: "Uploaded Documents",
    uploadSuccess: "Document uploaded successfully!",
    initiating: "Initiating..."
  },
  hi: {
    welcome: "स्वागत है",
    overviewDesc: "यहाँ आपकी अनुपालन स्थिति और सेवा फाइलिंग का संक्षिप्त विवरण है।",
    activeServices: "सक्रिय सेवाएं",
    pendingDues: "बकाया राशि",
    actionRequired: "आवश्यक कार्रवाई",
    actionReqDesc: "हमारी अनुपालन टीम को आपकी फाइलिंग को प्रोसेस करने के लिए कुछ अतिरिक्त दस्तावेज़ों की आवश्यकता है।",
    uploadNow: "अभी अपलोड करें",
    recentServices: "हाल की सेवा फाइलिंग",
    noServices: "कोई पंजीकृत सेवा नहीं मिली। 🎉",
    tabOverview: "डैशबोर्ड विवरण",
    tabServices: "मेरी सेवाएं",
    tabDocuments: "दस्तावेज़",
    tabPayments: "बिल और भुगतान",
    tabProfile: "प्रोफ़ाइल सेटिंग्स",
    logout: "लॉगआउट",
    subtabMonthlyBills: "मासिक बिल",
    subtabTaxFilings: "टैक्स फाइलिंग और नोटिस",
    subtabPendingRequests: "लंबित अनुरोध (Requests)",
    subtabQueries: "प्रश्न और सहायता",
    salesBills: "बिक्री बिल (Sales)",
    salesBillsDesc: "अनुपालन टीम के लिए बिक्री चालान (Sales invoices) या जीएसटी रिपोर्ट अपलोड करें।",
    purchaseBills: "खरीद बिल (Purchase)",
    purchaseBillsDesc: "खरीद बिल, उपयोगिता बिल (Utility bills) या व्यावसायिक खर्च विवरण अपलोड करें।",
    uploadSalesBillBtn: "+ बिक्री बिल अपलोड करें",
    uploadPurchaseBillBtn: "+ खरीद बिल अपलोड करें",
    download: "डाउनलोड",
    reupload: "पुनः अपलोड",
    colMonthYear: "महीना और वर्ष",
    colFileName: "फ़ाइल का नाम",
    colUploadDate: "अपलोड की तारीख",
    colStatus: "स्थिति (Status)",
    colActions: "कार्रवाई",
    howToPay: "भुगतान कैसे करें",
    bankTransferTitle: "बैंक ट्रांसफर विवरण",
    upiTransferTitle: "UPI ट्रांसफर विवरण",
    whatsappContact: "व्हाट्सएप के माध्यम से भुगतान के लिए संपर्क करें",
    docVault: "दस्तावेज़ तिजोरी (Vault)",
    docVaultDesc: "फर्म द्वारा अनुरोधित फाइलें अपलोड करें या अपने सत्यापित पंजीकरण प्रमाणपत्र डाउनलोड करें।",

    // Additional translations
    myRegisteredServices: "मेरी पंजीकृत सेवाएं",
    servicesDesc: "अपनी व्यावसायिक पंजीकरण और अनुपालन फाइलिंग की प्रगति को ट्रैक करें।",
    noServicesFound: "कोई सेवा नहीं मिली",
    noServicesEngagements: "इस समय आपका इनोवाइस (Innovise) के साथ कोई सक्रिय संबंध नहीं है।",
    started: "शुरू हुआ",
    expectedCompletion: "अपेक्षित पूर्णता तिथि",
    updateFromConsultant: "सलाहकार से अपडेट",
    firmUploads: "फर्म द्वारा अपलोड",
    noGstrFiles: "कोई GSTR1 या 3B फाइलें नहीं हैं।",
    noReturnFiles: "कोई रिटर्न फाइलें नहीं हैं।",
    noNoticeFiles: "कोई नोटिस फाइलें नहीं हैं।",
    queriesReporting: "प्रश्न और रिपोर्टिंग",
    active: "सक्रिय",
    noQueries: "अभी तक कोई प्रश्न सबमिट नहीं किया गया है। अपनी टैक्स फाइलिंग के बारे में हमसे कुछ भी पूछें!",
    myQuery: "मेरा प्रश्न",
    teamResponse: "CA/CS टीम का जवाब",
    pendingReply: "उत्तर लंबित है",
    queryPlaceholder: "अपने प्रश्न, स्पष्टीकरण या अनुरोध का विवरण लिखें...",
    sending: "भेजा जा रहा है...",
    submitQuery: "प्रश्न सबमिट करें",
    noPendingRequests: "कोई लंबित अनुरोध नहीं है 🎉",
    noPendingRequestsDesc: "हमारे पास आपकी चल रही सेवाओं के लिए आवश्यक सभी फाइलें हैं।",
    uploading: "अपलोड हो रहा है...",
    uploadDoc: "दस्तावेज़ अपलोड करें",
    noInvoices: "कोई बिल नहीं मिला 🎉",
    noInvoicesDesc: "सभी बिलों का भुगतान हो चुका है या अभी तक कोई बिल नहीं बना है।",
    paymentsDesc: "अपने प्रोफेशनल फीस, सरकारी फीस और भुगतान निर्देशों को देखें।",
    colDescription: "विवरण (Description)",
    colProfFee: "प्रोफेशनल फीस",
    colGovFee: "सरकारी फीस",
    colTotal: "कुल राशि",
    colDueDate: "देय तिथि",
    paying: "भुगतान हो रहा है...",
    payNow: "अभी भुगतान करें",
    howToPayDesc: "भुगतान करने के लिए, कृपया बिल राशि हमारे बैंक खाते में ट्रांसफर करें या नीचे दिए गए UPI विवरण को स्कैन करें। भुगतान के बाद, ट्रांजेक्शन रसीद अपने सलाहकार के साथ साझा करें।",
    accountName: "खाताधारक का नाम",
    bank: "बैंक का नाम",
    accountNumber: "खाता संख्या",
    ifscCode: "IFSC कोड",
    branch: "शाखा (Branch)",
    upiId: "UPI आईडी",
    gpayPhonePe: "GPAY / PhonePe",
    paymentHelp: "सहायता चाहिए या रसीद भेजना चाहते हैं?",
    profileDesc: "अपने मूल संपर्क विवरण और पते के विवरण की पुष्टि करें और अपडेट करें।",
    fullName: "पूरा नाम",
    emailLabel: "ईमेल (बदला नहीं जा सकता)",
    phoneNumber: "फ़ोन नंबर",
    billingAddress: "बिलिंग पता",
    addressPlaceholder: "आपका पूरा बिलिंग पता",
    saving: "सहेज रहा है...",
    saveProfile: "प्रोफ़ाइल सहेजें",
    changePassword: "पासवर्ड बदलें",
    changePasswordDesc: "समय-समय पर अपना पासवर्ड बदलकर अपने पोर्टल को सुरक्षित रखें।",
    newPassword: "नया पासवर्ड",
    passwordPlaceholder: "न्यूनतम 6 अक्षर",
    updating: "अपडेट हो रहा है...",
    updatePassword: "पासवर्ड अपडेट करें",
    modalUploadTitleSales: "बिक्री बिल अपलोड करें",
    modalUploadTitlePurchase: "खरीद बिल अपलोड करें",
    modalUploadSub: "सुरक्षित अनुपालन अपलोड",
    selectMonthYear: "महीना और वर्ष चुनें",
    yearLabel: "वर्ष:",
    uploadBillFile: "बिल फ़ाइल अपलोड करें",
    dragUpload: "फ़ाइल अपलोड करने के लिए क्लिक करें या यहाँ खींचें",
    uploadLimits: "PDF, JPG, या PNG (अधिकतम 10MB)",
    uploadingSecure: "फ़ाइल सुरक्षित रूप से अपलोड हो रही है...",
    uploadTarget: "लक्ष्य (Target)",
    cancel: "रद्द करें",
    noBillsUploadedSales: 'अभी तक कोई बिक्री बिल अपलोड नहीं किया गया है। अपलोड करने के लिए "+ बिक्री बिल अपलोड करें" पर क्लिक करें।',
    noBillsUploadedPurchase: 'अभी तक कोई खरीद बिल अपलोड नहीं किया गया है। अपलोड करने के लिए "+ खरीद बिल अपलोड करें" पर क्लिक करें।',
    
    // Stages & status
    stageConsultation: "परामर्श (Consultation)",
    stageDocsPending: "दस्तावेज़ लंबित (Docs Pending)",
    stageInProgress: "प्रगति पर (In Progress)",
    stageFiled: "दाखिल (Filed)",
    stageCompleted: "पूर्ण (Completed)",
    
    statusSubmitted: "जमा किया गया (Submitted)",
    statusVerified: "सत्यापित (Verified)",
    statusPending: "लंबित (Pending)",
    statusPaid: "भुगतान हो गया (Paid)",
    statusPartial: "आंशिक भुगतान (Partial)",

    docRequestsPending: "दस्तावेज़ अनुरोध लंबित हैं",
    startDate: "शुरू होने की तारीख",
    loadingPortal: "आपका सुरक्षित पोर्टल सत्र लोड हो रहा है...",

    selectPaymentMethod: "भुगतान विधि चुनें",
    paymentMethodDesc: "इस लेन-देन को पूरा करने के लिए अपनी पसंदीदा सुरक्षित भुगतान विधि चुनें।",
    payWithRazorpay: "रेज़रपे (Razorpay) से भुगतान करें",
    payWithPayU: "पेयू (PayU) से भुगतान करें",
    razorpayDesc: "कार्ड, नेटबैंकिंग, यूपीआई और वॉलेट के माध्यम से भुगतान करें",
    payuDesc: "पेयू सुरक्षित गेटवे के माध्यम से भुगतान करें",
    initiateNewService: "नई सेवा शुरू करें",
    selectServiceCategory: "श्रेणी चुनें",
    selectServiceToStart: "शुरू करने के लिए सेवा चुनें",
    requirementsPlaceholder: "कोई भी कस्टम आवश्यकताएं या टिप्पणियां निर्दिष्ट करें (वैकल्पिक)...",
    uploadDocForService: "इस सेवा के लिए दस्तावेज़ अपलोड करें",
    selectDocType: "दस्तावेज़ का प्रकार चुनें",
    customDocTypePlaceholder: "जैसे: जीएसटी प्रमाण पत्र, आधार कार्ड, पैन कार्ड",
    noDocsForService: "इस सेवा के लिए अभी तक कोई दस्तावेज़ अपलोड नहीं किया गया है।",
    uploadedDocs: "अपलोड किए गए दस्तावेज़",
    uploadSuccess: "दस्तावेज़ सफलतापूर्वक अपलोड हो गया!",
    initiating: "शुरू किया जा रहा है..."
  }
}

const LANDING_SERVICES_BY_CAT = {
  startup: {
    label: "Startup India",
    emoji: "🚀",
    services: [
      { key: "startup-india", name: "Startup India Registration" },
      { key: "80iac-startup-exemption", name: "80-IAC Tax Exemption" },
      { key: "private-limited-company", name: "Private Limited Company Registration" },
      { key: "one-person-company", name: "One Person Company (OPC)" },
      { key: "msme-udyam", name: "MSME / Udyam Registration" },
      { key: "trademark-registration", name: "Trademark Registration" }
    ]
  },
  registration: {
    label: "Business Registration",
    emoji: "🏢",
    services: [
      { key: "private-limited-company", name: "Private Limited Company Registration" },
      { key: "llp-registration", name: "LLP Registration" },
      { key: "one-person-company", name: "One Person Company (OPC)" },
      { key: "partnership-firm", name: "Partnership Firm Registration" },
      { key: "sole-proprietorship", name: "Sole Proprietorship Registration" },
      { key: "section-8-ngo", name: "Section 8 Company / NGO" },
      { key: "trust-registration", name: "Trust Registration" },
      { key: "society-registration", name: "Society Registration" },
      { key: "indian-subsidiary", name: "Indian Subsidiary Registration" },
      { key: "digital-signature", name: "Digital Signature (DSC)" },
      { key: "msme-udyam", name: "MSME / Udyam Registration" },
      { key: "iec-code", name: "IEC / Import Export Code" },
      { key: "barcode-registration", name: "Barcode Registration" },
      { key: "virtual-office", name: "Virtual Office for Registration" }
    ]
  },
  gst: {
    label: "GST & Tax",
    emoji: "📊",
    services: [
      { key: "gst-registration", name: "GST Registration" },
      { key: "gst-return-filing", name: "GST Return Filing" },
      { key: "gstr-9-annual-return", name: "GSTR-9 Annual Return" },
      { key: "gst-cancellation", name: "GST Cancellation / Surrender" },
      { key: "gst-einvoice", name: "GST E-Invoice Setup" },
      { key: "eway-bill", name: "E-Way Bill Registration" },
      { key: "income-tax-return", name: "Income Tax Return (ITR) Filing" },
      { key: "tds-return-filing", name: "TDS Return Filing" },
      { key: "pf-return-filing", name: "PF Return Filing" },
      { key: "input-tax-credit", name: "Input Tax Credit (ITC) Claim" }
    ]
  },
  compliance: {
    label: "Compliance & MCA",
    emoji: "📋",
    services: [
      { key: "annual-compliance-pvt", name: "Annual Compliance – Private Limited" },
      { key: "annual-compliance-llp", name: "Annual Compliance – LLP" },
      { key: "bookkeeping", name: "Bookkeeping & Accounting" },
      { key: "director-kyc", name: "Director KYC (DIR-3 KYC)" },
      { key: "change-company-name", name: "Change Company Name" },
      { key: "change-registered-office", name: "Change Registered Office" },
      { key: "share-transfer", name: "Issue / Transfer of Shares" },
      { key: "winding-up", name: "Company Winding Up / Strike Off" },
      { key: "12a-80g", name: "12A & 80G Registration" },
      { key: "fcra-registration", name: "FCRA Registration" }
    ]
  },
  trademark: {
    label: "Trademark & IPR",
    emoji: "™️",
    services: [
      { key: "trademark-registration", name: "Trademark Registration" },
      { key: "trademark-renewal", name: "Trademark Renewal" },
      { key: "trademark-objection", name: "Trademark Objection Reply" },
      { key: "international-trademark", name: "International Trademark (Madrid)" },
      { key: "copyright-registration", name: "Copyright Registration" },
      { key: "patent-registration", name: "Patent Registration" },
      { key: "design-registration", name: "Design Registration" },
      { key: "ip-dispute", name: "IP Dispute Resolution" }
    ]
  },
  license: {
    label: "Licenses",
    emoji: "🏛️",
    services: [
      { key: "fssai-registration", name: "FSSAI Food License" },
      { key: "drug-license", name: "Drug License" },
      { key: "iso-certification", name: "ISO Certification" },
      { key: "ayush-license", name: "AYUSH License" },
      { key: "factory-license", name: "Factory License" },
      { key: "shop-establishment", name: "Shop & Establishment License" },
      { key: "rera-registration", name: "RERA Registration" },
      { key: "bis-certification", name: "BIS Certification" },
      { key: "medical-device-reg", name: "Medical Device Registration" },
      { key: "apeda-registration", name: "APEDA Registration" }
    ]
  },
  international: {
    label: "International",
    emoji: "🌍",
    services: [
      { key: "company-in-uae", name: "Company Registration in UAE / Dubai" },
      { key: "company-in-uk", name: "Company Registration in UK" },
      { key: "company-in-usa", name: "Company Registration in USA" },
      { key: "company-in-singapore", name: "Company Registration in Singapore" },
      { key: "company-in-canada", name: "Company Registration in Canada" },
      { key: "company-in-australia", name: "Company Registration in Australia" },
      { key: "dubai-free-zone", name: "Dubai Free Zone Setup" }
    ]
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  // State Management
  const [showInitiateModal, setShowInitiateModal] = useState(false)
  const [selectedInitCategory, setSelectedInitCategory] = useState<keyof typeof LANDING_SERVICES_BY_CAT>('startup')
  const [selectedInitService, setSelectedInitService] = useState('')
  const [customInitNotes, setCustomInitNotes] = useState('')
  const [initiatingService, setInitiatingService] = useState(false)

  const [serviceUploadingId, setServiceUploadingId] = useState<string | null>(null)
  const [serviceUploadDocType, setServiceUploadDocType] = useState<{[serviceId: string]: string}>({})
  const [customDocTypeInput, setCustomDocTypeInput] = useState<{[serviceId: string]: string}>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'documents' | 'payments' | 'profile'>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // Razorpay and Payment states
  const [paymentLoadingId, setPaymentLoadingId] = useState<string | null>(null)
  const [showMockModal, setShowMockModal] = useState(false)
  const [mockPaymentData, setMockPaymentData] = useState<{
    invoiceId: string
    description: string
    amount: number
    orderId: string
  } | null>(null)

  // PayU states
  const [payuMockData, setPayuMockData] = useState<{
    invoiceId: string
    description: string
    amount: string
    txnid: string
  } | null>(null)
  const [showPayuMockModal, setShowPayuMockModal] = useState(false)

  // Profile update state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  // Upload state
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Board upload & Queries state
  const [uploadingCol, setUploadingCol] = useState<string | null>(null)
  const [queryText, setQueryText] = useState('')
  const [querySubmitting, setQuerySubmitting] = useState(false)

  // Document tab active state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [docSubTab, setDocSubTab] = useState<'submitted' | 'received' | 'requested' | 'queries'>('submitted')

  // Selected Month and Year for Bill Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [modalUploadType, setModalUploadType] = useState<'SALE_BILL' | 'PURCHASE_BILL'>('SALE_BILL')
  const [modalMonth, setModalMonth] = useState<number>(new Date().getMonth() + 1)
  const [modalYear, setModalYear] = useState<number>(2026)

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

  const t = DASHBOARD_TRANSLATIONS[lang]

  const getMonthYearString = (monthNum: number, yearNum: number) => {
    const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`
    return `${yearNum}-${monthStr}`
  }

  const parseDocType = (docType: string) => {
    if (docType.startsWith('SALE_BILL:')) {
      const monthYear = docType.substring('SALE_BILL:'.length);
      return { type: 'SALE_BILL', monthYear };
    }
    if (docType.startsWith('PURCHASE_BILL:')) {
      const monthYear = docType.substring('PURCHASE_BILL:'.length);
      return { type: 'PURCHASE_BILL', monthYear };
    }
    if (docType === 'SALE_BILL') {
      return { type: 'SALE_BILL', monthYear: null };
    }
    if (docType === 'PURCHASE_BILL') {
      return { type: 'PURCHASE_BILL', monthYear: null };
    }
    return null;
  }

  const formatMonthYearStr = (monthYearStr: string | null) => {
    if (!monthYearStr) return 'N/A';
    const parts = monthYearStr.split('-');
    if (parts.length !== 2) return monthYearStr;
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthsEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthsHi = [
      'जनवरी (January)', 'फरवरी (February)', 'मार्च (March)', 'अप्रैल (April)', 'मई (May)', 'जून (June)',
      'जुलाई (July)', 'अगस्त (August)', 'सितंबर (September)', 'अक्टूबर (October)', 'नवंबर (November)', 'दिसंबर (December)'
    ];
    const months = lang === 'en' ? monthsEn : monthsHi;
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
    return monthYearStr;
  }

  const getSortedBills = (type: 'SALE_BILL' | 'PURCHASE_BILL') => {
    const filtered = documents.filter(d => d.doc_type.startsWith(`${type}:`) || d.doc_type === type);
    return [...filtered].sort((a, b) => {
      const aMeta = parseDocType(a.doc_type);
      const bMeta = parseDocType(b.doc_type);
      const aMY = aMeta?.monthYear || '';
      const bMY = bMeta?.monthYear || '';
      if (aMY !== bMY) {
        return bMY.localeCompare(aMY);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  const handleReupload = (type: 'SALE_BILL' | 'PURCHASE_BILL', monthYear: string | null) => {
    setModalUploadType(type);
    if (monthYear) {
      const parts = monthYear.split('-');
      if (parts.length === 2) {
        setModalYear(Number(parts[0]));
        setModalMonth(Number(parts[1]));
      }
    } else {
      setModalYear(new Date().getFullYear());
      setModalMonth(new Date().getMonth() + 1);
    }
    setIsUploadModalOpen(true);
  }

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch profile and data in parallel to maximize loading speed
      const [profRes, servRes, docRes, reqRes, invRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('services').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('document_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('due_date', { ascending: true })
      ])

      if (profRes.data) {
        const profData = profRes.data
        setProfile(profData)
        setFullName(profData.full_name)
        setPhone(profData.phone || '')
        setAddress(profData.address || '')
      }

      setServices(servRes.data || [])
      
      const docs = docRes.data || []
      setDocuments(docs)

      // Fetch avatar signed URL asynchronously in background (non-blocking)
      const avatarDoc = docs.find(d => d.doc_type === 'AVATAR')
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

      setRequests(reqRes.data || [])
      setInvoices(invRes.data || [])

    } catch (err) {
      console.error('Error fetching data:', err)
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
    fetchData()

    // Listen to PayU redirect query parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const payment = params.get('payment')
      const reason = params.get('reason')
      const message = params.get('message')
      
      if (payment === 'success') {
        alert('Payment successful via PayU! Your invoice has been updated.')
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (payment === 'failed') {
        alert(`Payment failed or cancelled. Reason: ${reason || 'Transaction declined'}`)
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (payment === 'error') {
        alert(`An error occurred during payment processing: ${message || 'Error'}`)
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  // Handle Profile Update
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setProfileLoading(true)
    setProfileMsg(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        address: address
      })
      .eq('id', profile.id)

    if (error) {
      setProfileMsg({ type: 'error', text: error.message })
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
      setProfile({ ...profile, full_name: fullName, phone, address })
    }
    setProfileLoading(false)
  }

  // Handle Change Password
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdLoading(true)
    setPwdMsg(null)

    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      setPwdLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setPwdMsg({ type: 'error', text: error.message })
    } else {
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
    }
    setPwdLoading(false)
  }

  // Handle Document Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, requestItem: DocumentRequest) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingId(requestItem.id)
    setUploadError(null)

    // Validation checks
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, JPG, and PNG are allowed.')
      setUploadingId(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setUploadError('File is too large. Maximum size allowed is 10MB.')
      setUploadingId(null)
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const storagePath = `${profile.id}/${crypto.randomUUID()}.${fileExt}`

      // 1. Upload to Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file)

      if (storageErr) throw storageErr

      // 2. Insert record in Documents table
      const { error: insertErr } = await supabase
        .from('documents')
        .insert({
          client_id: profile.id,
          service_id: requestItem.service_id,
          file_name: file.name,
          storage_path: storagePath,
          doc_type: requestItem.title,
          status: 'submitted',
          uploaded_by: 'client'
        })

      if (insertErr) throw insertErr

      // 3. Mark the document request as fulfilled
      const { error: reqErr } = await supabase
        .from('document_requests')
        .update({ fulfilled: true })
        .eq('id', requestItem.id)

      if (reqErr) throw reqErr

      // Fetch fresh data
      await fetchData()
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.')
    } finally {
      setUploadingId(null)
    }
  }

  // Handle Document Download via Signed URL
  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 60, {
          download: fileName
        })

      if (error) throw error

      if (data?.signedUrl) {
        // Trigger browser download directly using signed URL with download option
        const a = document.createElement('a')
        a.href = data.signedUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err: any) {
      alert(err.message || 'Error obtaining signed download link.')
    }
  }

  // Handle direct file upload to specific columns (GSTR1, RETURNS, NOTICES)
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingCol(docType)
    setUploadError(null)

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, JPG, and PNG are allowed.')
      setUploadingCol(null)
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const storagePath = `${profile.id}/${crypto.randomUUID()}.${fileExt}`

      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file)

      if (storageErr) throw storageErr

      const { error: insertErr } = await supabase
        .from('documents')
        .insert({
          client_id: profile.id,
          file_name: file.name,
          storage_path: storagePath,
          doc_type: docType,
          status: 'submitted',
          uploaded_by: 'client'
        })

      if (insertErr) throw insertErr

      await fetchData()
      setIsUploadModalOpen(false)
    } catch (err: any) {
      alert(err.message || 'Error uploading file.')
    } finally {
      setUploadingCol(null)
    }
  }

  // Handle client-side Query submission
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryText.trim() || !profile) return
    setQuerySubmitting(true)
    try {
      const queryObj = {
        query: queryText.trim(),
        reply: null
      }
      
      const { error } = await supabase
        .from('documents')
        .insert({
          client_id: profile.id,
          file_name: JSON.stringify(queryObj),
          storage_path: 'text_query',
          doc_type: 'QUERY',
          status: 'pending',
          uploaded_by: 'client'
        })

      if (error) throw error
      setQueryText('')
      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Error submitting query.')
    } finally {
      setQuerySubmitting(false)
    }
  }

  // Handle client-side service initiation
  const handleInitiateService = async () => {
    if (!selectedInitService || !profile) return
    setInitiatingService(true)
    try {
      const res = await fetch('/api/services/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceName: selectedInitService,
          notes: customInitNotes.trim() || undefined
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      alert(lang === 'en' ? 'Service initiated successfully!' : 'सेवा सफलतापूर्वक शुरू की गई!')
      setShowInitiateModal(false)
      setSelectedInitService('')
      setCustomInitNotes('')
      // Refresh list
      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Error initiating service.')
    } finally {
      setInitiatingService(false)
    }
  }

  // Handle file upload linked to specific service_id
  const handleServiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, serviceId: string) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setServiceUploadingId(serviceId)

    // Validate type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert(lang === 'en' ? 'Invalid file type. Only PDF, JPG, and PNG are allowed.' : 'अमान्य फ़ाइल प्रकार। केवल PDF, JPG और PNG की अनुमति है।')
      setServiceUploadingId(null)
      return
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(lang === 'en' ? 'File is too large. Maximum size is 10MB.' : 'फ़ाइल बहुत बड़ी है। अधिकतम आकार 10MB है।')
      setServiceUploadingId(null)
      return
    }

    // Get selected doc type or custom input
    const selectedType = serviceUploadDocType[serviceId] || 'GST Certificate'
    let finalDocType = selectedType
    if (selectedType === 'CUSTOM') {
      finalDocType = customDocTypeInput[serviceId]?.trim() || 'General Document'
    }

    try {
      const fileExt = file.name.split('.').pop()
      const storagePath = `${profile.id}/${crypto.randomUUID()}.${fileExt}`

      // 1. Upload to Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file)

      if (storageErr) throw storageErr

      // 2. Insert record in Documents table
      const { error: insertErr } = await supabase
        .from('documents')
        .insert({
          client_id: profile.id,
          service_id: serviceId,
          file_name: file.name,
          storage_path: storagePath,
          doc_type: finalDocType,
          status: 'submitted',
          uploaded_by: 'client'
        })

      if (insertErr) throw insertErr

      alert(t.uploadSuccess || 'Document uploaded successfully!')
      // Clear input fields for this service
      setServiceUploadDocType(prev => ({ ...prev, [serviceId]: '' }))
      setCustomDocTypeInput(prev => ({ ...prev, [serviceId]: '' }))

      // Refresh data
      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Error uploading file.')
    } finally {
      setServiceUploadingId(null)
    }
  }

  // Render file card inside the board column
  const renderClientDocCard = (doc: any) => {
    return (
      <div key={doc.id} className="p-3 bg-white border border-line rounded-xl space-y-2 text-xs hover:border-line2 transition-all shadow-sm">
        <div className="space-y-0.5">
          <h4 className="font-bold text-ink truncate" title={doc.file_name}>{doc.file_name}</h4>
          <span className="text-[10px] text-gray-400 block">
            {new Date(doc.created_at).toLocaleDateString('en-IN')}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
            doc.status === 'verified' ? 'bg-jade/10 text-jade' :
            doc.status === 'submitted' ? 'bg-sky/10 text-sky' :
            'bg-gold/10 text-gold'
          }`}>
            {doc.status}
          </span>
          
          <button
            onClick={() => handleDownload(doc.storage_path, doc.file_name)}
            className="p-1.5 hover:bg-fire/10 text-fire rounded border border-transparent hover:border-line transition-all bg-white"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Load Razorpay Script dynamically on demand
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Handle Razorpay Payment flow
  const handleRazorpayPayment = async (invoiceId: string) => {
    setPaymentLoadingId(invoiceId)
    try {
      const res = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      })
      
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to initialize payment transaction.')
        setPaymentLoadingId(null)
        return
      }

      if (data.mock) {
        // Show custom simulated checkout modal
        setMockPaymentData({
          invoiceId: data.invoice.id,
          description: data.invoice.description,
          amount: data.amount,
          orderId: data.orderId
        })
        setShowMockModal(true)
      } else {
        // Live / Sandbox Razorpay flow
        const loaded = await loadRazorpayScript()
        if (!loaded) {
          alert('Failed to load Razorpay Checkout SDK. Please check your internet connection.')
          setPaymentLoadingId(null)
          return
        }

        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: 'Innovise Consultant',
          description: data.invoice.description,
          order_id: data.orderId,
          handler: async function (response: any) {
            try {
              setPaymentLoadingId(invoiceId)
              const verifyRes = await fetch('/api/payments/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  invoiceId: data.invoice.id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  mock: false
                })
              })
              const verifyData = await verifyRes.json()
              if (verifyRes.ok && verifyData.success) {
                alert('Payment successful!')
                await fetchData()
              } else {
                alert(verifyData.error || 'Payment verification failed.')
              }
            } catch (err: any) {
              alert(err.message || 'Payment verification error')
            } finally {
              setPaymentLoadingId(null)
            }
          },
          prefill: {
            name: profile?.full_name || '',
            email: profile?.email || '',
            contact: profile?.phone || ''
          },
          theme: {
            color: '#07111F'
          },
          modal: {
            ondismiss: function () {
              setPaymentLoadingId(null)
            }
          }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
    } catch (err: any) {
      alert(err.message || 'Error starting payment checkout.')
      setPaymentLoadingId(null)
    }
  }

  // Handle Simulated Mock Payment submit
  const handleMockPaymentSubmit = async () => {
    if (!mockPaymentData) return
    try {
      setPaymentLoadingId(mockPaymentData.invoiceId)
      setShowMockModal(false)
      const verifyRes = await fetch('/api/payments/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: mockPaymentData.invoiceId,
          razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          razorpayOrderId: mockPaymentData.orderId,
          mock: true
        })
      })
      const verifyData = await verifyRes.json()
      if (verifyRes.ok && verifyData.success) {
        alert('Mock Payment Successful!')
        await fetchData()
      } else {
        alert(verifyData.error || 'Mock verification failed.')
      }
    } catch (err: any) {
      alert(err.message || 'Mock payment error')
    } finally {
      setPaymentLoadingId(null)
      setMockPaymentData(null)
    }
  }

  // Handle PayU Payment flow
  const handlePayUPayment = async (invoice: Invoice) => {
    setPaymentLoadingId(invoice.id)
    try {
      const res = await fetch('/api/payments/payu/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to initialize PayU payment transaction.')
        setPaymentLoadingId(null)
        return
      }

      if (data.mock) {
        // Show PayU mock modal
        setPayuMockData({
          invoiceId: data.invoice.id,
          description: data.invoice.description,
          amount: data.amount,
          txnid: data.txnid
        })
        setShowPayuMockModal(true)
        setPaymentLoadingId(null)
      } else {
        // Build programmatically a secure form and submit it to redirect to PayU
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.actionUrl

        const fields: Record<string, string> = {
          key: data.key,
          txnid: data.txnid,
          amount: data.amount,
          productinfo: data.productinfo,
          firstname: data.firstname,
          email: data.email,
          phone: data.phone,
          udf1: data.udf1 || '',
          hash: data.hash,
          surl: `${window.location.origin}/api/payments/payu/verify-payment`,
          furl: `${window.location.origin}/api/payments/payu/verify-payment`
        }

        Object.keys(fields).forEach((key) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = fields[key]
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      }
    } catch (err: any) {
      alert(err.message || 'Error starting PayU checkout.')
      setPaymentLoadingId(null)
    }
  }

  // Handle Simulated Mock PayU Payment submit
  const handlePayuMockPaymentSubmit = async () => {
    if (!payuMockData) return
    try {
      setPaymentLoadingId(payuMockData.invoiceId)
      setShowPayuMockModal(false)
      const verifyRes = await fetch('/api/payments/payu/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: payuMockData.invoiceId,
          mock: true
        })
      })
      const verifyData = await verifyRes.json()
      if (verifyRes.ok && verifyData.success) {
        alert('Mock PayU Payment Successful!')
        await fetchData()
      } else {
        alert(verifyData.error || 'Mock verification failed.')
      }
    } catch (err: any) {
      alert(err.message || 'Verification connection error.')
    } finally {
      setPayuMockData(null)
      setPaymentLoadingId(null)
    }
  }

  // Handle HTML print invoice generation
  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.refrens_pdf_url) {
      window.open(invoice.refrens_pdf_url, '_blank')
      return
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
                Phone: +91 95061 66560
              </div>
            </div>

            <div class="details-grid">
              <div>
                <h3 class="section-title">Billed To</h3>
                <p class="detail-text"><strong>${profile?.full_name || 'Valued Client'}</strong></p>
                <p class="detail-text">${profile?.phone || ''}</p>
                <p class="detail-text">${profile?.email || ''}</p>
                ${profile?.address ? `<p class="detail-text" style="white-space: pre-line;">${profile.address}</p>` : ''}
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
              <p>Thank you for choosing Innovise Consultant for your business services.</p>
              <p style="margin-top: 8px; font-size: 9px; color: #a0aec0;">This is a computer generated document. No signature required.</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Calculate Overview Stats
  const activeServicesCount = services.filter(s => s.status !== 'completed').length
  const pendingDuesTotal = invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, item) => sum + Number(item.total), 0)
  const pendingDocsCount = requests.filter(r => !r.fulfilled).length

  // Helper for status timeline styling
  const timelineStages = [
    { key: 'consultation', label: t.stageConsultation },
    { key: 'docs_pending', label: t.stageDocsPending },
    { key: 'in_progress', label: t.stageInProgress },
    { key: 'filed', label: t.stageFiled },
    { key: 'completed', label: t.stageCompleted }
  ]

  const getStageIndex = (status: string) => {
    return timelineStages.findIndex(stage => stage.key === status)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pearl flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-fire border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-dim font-medium">{t.loadingPortal}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pearl flex flex-col">
      {/* Top Header */}
      <header className="bg-ink text-white border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-fire/15 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider block leading-none">INNOVISE</span>
              <span className="text-[10px] text-gray-400 tracking-widest font-semibold">CLIENT PORTAL</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold">{profile?.full_name}</span>
                <span className="text-xs text-jade2 font-medium bg-jade/10 px-2 py-0.5 rounded-full inline-block self-end mt-1 uppercase tracking-wide">Client</span>
              </div>
              <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center flex-shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Client Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-fire text-white flex items-center justify-center font-bold text-sm">
                    {(profile?.full_name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              title="Change Language / भाषा बदलें"
            >
              🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-rose/10 hover:border-rose/20 hover:text-rose transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-2 border-b border-line md:border-b-0 md:space-y-1.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-ink text-white shadow-lg shadow-ink/10'
                  : 'text-dim hover:bg-mist hover:text-ink'
              }`}
            >
              <Award className="w-5 h-5" />
              {t.tabOverview}
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-ink text-white shadow-lg shadow-ink/10'
                  : 'text-dim hover:bg-mist hover:text-ink'
              }`}
            >
              <Clock className="w-5 h-5" />
              {t.tabServices}
              {activeServicesCount > 0 && (
                <span className="ml-auto bg-fire text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {activeServicesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-ink text-white shadow-lg shadow-ink/10'
                  : 'text-dim hover:bg-mist hover:text-ink'
              }`}
            >
              <FileText className="w-5 h-5" />
              {t.tabDocuments}
              {pendingDocsCount > 0 && (
                <span className="ml-auto bg-gold text-ink text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingDocsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-ink text-white shadow-lg shadow-ink/10'
                  : 'text-dim hover:bg-mist hover:text-ink'
              }`}
            >
              <IndianRupee className="w-5 h-5" />
              {t.tabPayments}
              {pendingDuesTotal > 0 && (
                <span className="ml-auto bg-rose/10 text-rose text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Pending
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-ink text-white shadow-lg shadow-ink/10'
                  : 'text-dim hover:bg-mist hover:text-ink'
              }`}
            >
              <User className="w-5 h-5" />
              {t.tabProfile}
            </button>
          </nav>
        </aside>

        {/* Tab Contents */}
        <main className="flex-grow bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-ink tracking-tight">{t.welcome}, {profile?.full_name}!</h2>
                <p className="text-sm text-dim mt-1">{t.overviewDesc}</p>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-pearl border border-line flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-sky/10 text-sky flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dim uppercase tracking-wider">{t.activeServices}</span>
                    <span className="text-3xl font-extrabold text-ink mt-0.5 block">{activeServicesCount}</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-pearl border border-line flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-rose/10 text-rose flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dim uppercase tracking-wider">{t.pendingDues}</span>
                    <span className="text-3xl font-extrabold text-ink mt-0.5 block">₹{pendingDuesTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-pearl border border-line flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-dim uppercase tracking-wider">{t.actionRequired}</span>
                    <span className="text-3xl font-extrabold text-ink mt-0.5 block">{pendingDocsCount} {t.tabDocuments}</span>
                  </div>
                </div>
              </div>

              {/* Critical Alert Banner if documents are pending */}
              {pendingDocsCount > 0 && (
                <div className="p-5 rounded-2xl bg-gold/5 border border-gold/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-3 items-start">
                    <AlertTriangle className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-ink">{t.actionRequired}: {t.docRequestsPending}</h4>
                      <p className="text-xs text-dim mt-1">{t.actionReqDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveTab('documents'); setDocSubTab('requested') }}
                    className="px-4 py-2 bg-gold hover:bg-gold2 text-ink text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer"
                  >
                    {t.uploadNow}
                  </button>
                </div>
              )}

              {/* Quick Services Overview List */}
              <div className="border border-line rounded-2xl p-6">
                <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky" />
                  {t.recentServices}
                </h3>

                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-dim">{t.noServices}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {services.slice(0, 3).map((service) => (
                      <div key={service.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-ink">{service.service_name}</h4>
                          <span className="text-xs text-dim block mt-0.5">{t.startDate}: {new Date(service.start_date).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
                            service.status === 'completed' ? 'bg-jade/10 text-jade' :
                            service.status === 'filed' ? 'bg-sky/10 text-sky' :
                            service.status === 'docs_pending' ? 'bg-gold/10 text-gold' :
                            'bg-pearl2 text-dim'
                          }`}>
                            {service.status === 'completed' ? t.stageCompleted :
                             service.status === 'filed' ? t.stageFiled :
                             service.status === 'docs_pending' ? t.stageDocsPending :
                             service.status === 'consultation' ? t.stageConsultation :
                             service.status === 'in_progress' ? t.stageInProgress :
                             (service.status as string).replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => setActiveTab('services')}
                            className="p-1 rounded-full hover:bg-pearl border border-transparent hover:border-line text-dim transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-ink tracking-tight">{t.myRegisteredServices}</h2>
                  <p className="text-sm text-dim mt-1">{t.servicesDesc}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedInitCategory('startup')
                    setSelectedInitService(LANDING_SERVICES_BY_CAT.startup.services[0].name)
                    setShowInitiateModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-fire to-fire2 text-white font-bold text-xs rounded-xl shadow-md shadow-fire/15 transition-all inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-center hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.initiateNewService}</span>
                </button>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-line rounded-3xl bg-pearl/30">
                  <Clock className="w-12 h-12 text-dim mx-auto mb-3" />
                  <h3 className="text-base font-bold text-ink">{t.noServicesFound}</h3>
                  <p className="text-xs text-dim mt-1">{t.noServicesEngagements}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {services.map((service) => {
                    const currentStageIdx = getStageIndex(service.status)
                    
                    return (
                      <div key={service.id} className="border border-line rounded-2xl p-6 bg-pearl/20 hover:border-line2 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-ink">{service.service_name}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                              <span className="text-xs text-dim">
                                {t.started}: <strong>{new Date(service.start_date).toLocaleDateString('en-IN')}</strong>
                              </span>
                              {service.expected_completion && (
                                <span className="text-xs text-dim">
                                  {t.expectedCompletion}: <strong className="text-fire">{new Date(service.expected_completion).toLocaleDateString('en-IN')}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider self-start sm:self-center ${
                            service.status === 'completed' ? 'bg-jade/10 text-jade' :
                            service.status === 'filed' ? 'bg-sky/10 text-sky' :
                            service.status === 'docs_pending' ? 'bg-gold/10 text-gold' :
                            'bg-pearl2 text-dim'
                          }`}>
                            {service.status === 'completed' ? t.stageCompleted :
                             service.status === 'filed' ? t.stageFiled :
                             service.status === 'docs_pending' ? t.stageDocsPending :
                             service.status === 'consultation' ? t.stageConsultation :
                             service.status === 'in_progress' ? t.stageInProgress :
                             (service.status as string).replace('_', ' ')}
                          </span>
                        </div>

                        {/* Interactive Timeline Progress */}
                        <div className="mb-6">
                          {/* Mobile View Timeline */}
                          <div className="block sm:hidden space-y-4 pl-4 border-l-2 border-line relative">
                            {timelineStages.map((stage, idx) => {
                              const isPast = idx < currentStageIdx
                              const isCurrent = idx === currentStageIdx
                              
                              return (
                                <div key={stage.key} className="relative pl-6">
                                  <div className={`absolute left-[-26px] top-1 w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                                    isPast ? 'bg-jade border-jade text-white' :
                                    isCurrent ? 'bg-white border-fire' :
                                    'bg-white border-line'
                                  }`}>
                                    {isPast && <Check className="w-2.5 h-2.5" />}
                                    {isCurrent && <div className="w-1.5 h-1.5 bg-fire rounded-full" />}
                                  </div>
                                  <span className={`text-xs font-bold block ${isCurrent ? 'text-fire' : isPast ? 'text-ink' : 'text-gray-400'}`}>
                                    {stage.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Desktop View Timeline */}
                          <div className="hidden sm:block">
                            <div className="flex items-center justify-between relative">
                              {/* Background Line */}
                              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-line -translate-y-1/2 z-0" />
                              
                              {/* Filled Progress Line */}
                              <div 
                                className="absolute top-1/2 left-0 h-0.5 bg-jade -translate-y-1/2 z-0 transition-all duration-500" 
                                style={{ width: `${(currentStageIdx / (timelineStages.length - 1)) * 100}%` }}
                              />

                              {timelineStages.map((stage, idx) => {
                                const isPast = idx < currentStageIdx
                                const isCurrent = idx === currentStageIdx
                                const isPending = idx > currentStageIdx

                                return (
                                  <div key={stage.key} className="flex flex-col items-center relative z-10 w-24">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isPast ? 'bg-jade border-jade text-white shadow-md shadow-jade/10' :
                                      isCurrent ? 'bg-white border-fire text-fire shadow-md shadow-fire/10 scale-110' :
                                      'bg-white border-line text-gray-300'
                                    }`}>
                                      {isPast ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <span className="text-[10px] font-bold">{idx + 1}</span>
                                      )}
                                    </div>
                                    <span className={`text-[11px] font-bold mt-2 text-center leading-tight ${
                                      isCurrent ? 'text-fire' : isPast ? 'text-ink' : 'text-gray-400'
                                    }`}>
                                      {stage.label}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {service.notes && (
                          <div className="p-4 rounded-xl bg-pearl border border-line text-xs">
                            <span className="font-bold text-ink block mb-1">{t.updateFromConsultant}:</span>
                            <p className="text-dim leading-relaxed">{service.notes}</p>
                          </div>
                        )}

                        {/* Service Documents Upload & List */}
                        <div className="mt-6 pt-6 border-t border-line space-y-4">
                          <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-fire" />
                            {t.uploadedDocs}
                          </h4>

                          {/* Documents List */}
                          {(() => {
                            const serviceDocs = documents.filter(d => d.service_id === service.id)
                            if (serviceDocs.length === 0) {
                              return (
                                <p className="text-xs text-dim italic pl-1">{t.noDocsForService}</p>
                              )
                            }
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {serviceDocs.map(doc => (
                                  <div key={doc.id} className="p-3 bg-pearl border border-line rounded-xl flex items-center justify-between text-xs hover:border-line2 transition-all">
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
                                        title={t.download}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })()}

                          {/* Upload Area */}
                          <div className="bg-pearl/30 border border-line rounded-xl p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                              {/* Document Type Selector */}
                              <div className="flex-1">
                                <label className="text-[11px] font-bold text-dim block mb-1">{t.selectDocType}</label>
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
                                <div className="flex-1">
                                  <label className="text-[11px] font-bold text-dim block mb-1">Enter Document Name</label>
                                  <input
                                    type="text"
                                    placeholder={t.customDocTypePlaceholder}
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
                                  <span>{serviceUploadingId === service.id ? 'Uploading...' : 'Choose File'}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png"
                                    onChange={(e) => handleServiceFileUpload(e, service.id)}
                                    disabled={serviceUploadingId === service.id}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </label>
                              </div>
                              <span className="text-[10px] text-dim">{t.uploadLimits}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-ink tracking-tight">{t.docVault}</h2>
                <p className="text-sm text-dim mt-1">{t.docVaultDesc}</p>
              </div>

              {/* Sub tabs switcher */}
              <div className="flex border-b border-line gap-4 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  onClick={() => setDocSubTab('submitted')}
                  className={`pb-3 text-sm font-bold relative transition-all cursor-pointer whitespace-nowrap ${
                    docSubTab === 'submitted'
                      ? 'text-ink border-b-2 border-fire'
                      : 'text-dim hover:text-ink'
                  }`}
                >
                  {t.subtabMonthlyBills}
                </button>
                <button
                  onClick={() => setDocSubTab('received')}
                  className={`pb-3 text-sm font-bold relative transition-all cursor-pointer whitespace-nowrap ${
                    docSubTab === 'received'
                      ? 'text-ink border-b-2 border-fire'
                      : 'text-dim hover:text-ink'
                  }`}
                >
                  {t.subtabTaxFilings}
                </button>
                <button
                  onClick={() => setDocSubTab('requested')}
                  className={`pb-3 text-sm font-bold relative transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    docSubTab === 'requested'
                      ? 'text-ink border-b-2 border-fire'
                      : 'text-dim hover:text-ink'
                  }`}
                >
                  {t.subtabPendingRequests}
                  {pendingDocsCount > 0 && (
                    <span className="bg-gold text-ink text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingDocsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setDocSubTab('queries')}
                  className={`pb-3 text-sm font-bold relative transition-all cursor-pointer whitespace-nowrap ${
                    docSubTab === 'queries'
                      ? 'text-ink border-b-2 border-fire'
                      : 'text-dim hover:text-ink'
                  }`}
                >
                  {t.subtabQueries}
                </button>
              </div>

              {/* Sub tab 1: Monthly Bills (Sale Bills & Purchase Bills) */}
              {docSubTab === 'submitted' && (() => {
                const salesBills = getSortedBills('SALE_BILL')
                const purchaseBills = getSortedBills('PURCHASE_BILL')

                const renderBillsTable = (bills: any[], type: 'SALE_BILL' | 'PURCHASE_BILL') => {
                  if (bills.length === 0) {
                    return (
                      <div className="text-center py-10 border border-dashed border-line rounded-2xl bg-pearl/30">
                        <FileText className="w-10 h-10 text-dim/60 mx-auto mb-2.5" />
                        <p className="text-xs text-dim font-medium">
                          {type === 'SALE_BILL' ? t.noBillsUploadedSales : t.noBillsUploadedPurchase}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="overflow-hidden border border-line rounded-2xl bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-line text-left text-xs">
                          <thead className="bg-pearl text-dim uppercase font-bold tracking-wider">
                            <tr>
                              <th className="px-5 py-3">{t.colMonthYear}</th>
                              <th className="px-5 py-3">{t.colFileName}</th>
                              <th className="px-5 py-3">{t.colUploadDate}</th>
                              <th className="px-5 py-3">{t.colStatus}</th>
                              <th className="px-5 py-3 text-right">{t.colActions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line bg-white text-ink">
                            {bills.map((bill) => {
                              const meta = parseDocType(bill.doc_type)
                              const displayMonthYear = formatMonthYearStr(meta?.monthYear ?? null)
                              
                              return (
                                <tr key={bill.id} className="hover:bg-pearl/30 transition-all">
                                  <td className="px-5 py-3.5 font-bold text-ink whitespace-nowrap">
                                    {displayMonthYear}
                                  </td>
                                  <td className="px-5 py-3.5 max-w-[200px] truncate" title={bill.file_name}>
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-3.5 h-3.5 text-dim/70 flex-shrink-0" />
                                      <span className="truncate">{bill.file_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-dim whitespace-nowrap">
                                    {new Date(bill.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </td>
                                  <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      bill.status === 'verified' ? 'bg-jade/10 text-jade' :
                                      bill.status === 'submitted' ? 'bg-sky/10 text-sky' :
                                      'bg-gold/10 text-gold'
                                    }`}>
                                      {bill.status === 'verified' ? t.statusVerified :
                                       bill.status === 'submitted' ? t.statusSubmitted :
                                       bill.status === 'pending' ? t.statusPending :
                                       bill.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleDownload(bill.storage_path, bill.file_name)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-line hover:border-ink hover:text-ink text-[11px] font-bold rounded-lg transition-all bg-white cursor-pointer"
                                        title={t.download}
                                      >
                                        <Download className="w-3 h-3 text-dim" />
                                        <span>{t.download}</span>
                                      </button>
                                      <button
                                        onClick={() => handleReupload(type, meta?.monthYear || null)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-pearl hover:bg-mist text-ink border border-line text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                                        title={t.reupload}
                                      >
                                        <RefreshCw className="w-3 h-3 text-dim" />
                                        <span>{t.reupload}</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-8">
                    {/* Row 1: Sales Bills */}
                    <div className="space-y-4 border border-line rounded-3xl p-6 bg-pearl/10">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h3 className="text-base font-extrabold text-ink tracking-tight flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-jade" />
                            {t.salesBills}
                          </h3>
                          <p className="text-xs text-dim mt-0.5">{t.salesBillsDesc}</p>
                        </div>
                        <button
                          onClick={() => {
                            setModalUploadType('SALE_BILL')
                            setModalMonth(new Date().getMonth() + 1)
                            setModalYear(2026)
                            setIsUploadModalOpen(true)
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-fire to-fire2 text-white font-bold text-xs rounded-xl shadow-md shadow-fire/15 transition-all inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-center hover:shadow-lg"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{t.uploadSalesBillBtn}</span>
                        </button>
                      </div>

                      {renderBillsTable(salesBills, 'SALE_BILL')}
                    </div>

                    {/* Row 2: Purchase Bills */}
                    <div className="space-y-4 border border-line rounded-3xl p-6 bg-pearl/10">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h3 className="text-base font-extrabold text-ink tracking-tight flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky" />
                            {t.purchaseBills}
                          </h3>
                          <p className="text-xs text-dim mt-0.5">{t.purchaseBillsDesc}</p>
                        </div>
                        <button
                          onClick={() => {
                            setModalUploadType('PURCHASE_BILL')
                            setModalMonth(new Date().getMonth() + 1)
                            setModalYear(2026)
                            setIsUploadModalOpen(true)
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-fire to-fire2 text-white font-bold text-xs rounded-xl shadow-md shadow-fire/15 transition-all inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-center hover:shadow-lg"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{t.uploadPurchaseBillBtn}</span>
                        </button>
                      </div>

                      {renderBillsTable(purchaseBills, 'PURCHASE_BILL')}
                    </div>
                  </div>
                )
              })()}

              {/* Sub tab 2: Tax Filings & Notices (GSTR1 & 3B, RETURNS, NOTICES) */}
              {docSubTab === 'received' && (
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row flex-wrap gap-6">
                    
                    {/* 1. GSTR1 & 3B Column (Read Only) */}
                    <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-line">
                        <h3 className="font-bold text-ink text-xs uppercase tracking-wider">GSTR1 &amp; 3B ({documents.filter(d => d.doc_type === 'GSTR1').length})</h3>
                        <span className="text-[9px] font-bold text-dim bg-pearl px-2 py-0.5 rounded-full uppercase tracking-wider">{t.firmUploads}</span>
                      </div>
                      
                      <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                        {documents.filter(d => d.doc_type === 'GSTR1').length === 0 ? (
                          <p className="text-[11px] text-dim text-center py-4">{t.noGstrFiles}</p>
                        ) : (
                          documents.filter(d => d.doc_type === 'GSTR1').map(doc => renderClientDocCard(doc))
                        )}
                      </div>
                    </div>

                    {/* 2. RETURNS Column (Read Only) */}
                    <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-line">
                        <h3 className="font-bold text-ink text-xs uppercase tracking-wider">RETURNS ({documents.filter(d => d.doc_type === 'RETURNS').length})</h3>
                        <span className="text-[9px] font-bold text-dim bg-pearl px-2 py-0.5 rounded-full uppercase tracking-wider">{t.firmUploads}</span>
                      </div>
                      
                      <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                        {documents.filter(d => d.doc_type === 'RETURNS').length === 0 ? (
                          <p className="text-[11px] text-dim text-center py-4">{t.noReturnFiles}</p>
                        ) : (
                          documents.filter(d => d.doc_type === 'RETURNS').map(doc => renderClientDocCard(doc))
                        )}
                      </div>
                    </div>

                    {/* 3. NOTICES Column (Read Only) */}
                    <div className="flex-1 min-w-[280px] lg:min-w-[340px] lg:max-w-[400px] bg-pearl/30 border border-line rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-line">
                        <h3 className="font-bold text-ink text-xs uppercase tracking-wider">NOTICES ({documents.filter(d => d.doc_type === 'NOTICES').length})</h3>
                        <span className="text-[9px] font-bold text-dim bg-pearl px-2 py-0.5 rounded-full uppercase tracking-wider">{t.firmUploads}</span>
                      </div>
                      
                      <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                        {documents.filter(d => d.doc_type === 'NOTICES').length === 0 ? (
                          <p className="text-[11px] text-dim text-center py-4">{t.noNoticeFiles}</p>
                        ) : (
                          documents.filter(d => d.doc_type === 'NOTICES').map(doc => renderClientDocCard(doc))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Sub tab 4: Queries & Support */}
              {docSubTab === 'queries' && (
                <div className="max-w-2xl mx-auto bg-pearl/30 border border-line rounded-3xl p-6 flex flex-col space-y-4 shadow-sm">
                  <div className="pb-3 border-b border-line flex justify-between items-center">
                    <h3 className="font-bold text-ink text-sm uppercase tracking-wider">{t.queriesReporting}</h3>
                    <span className="text-[10px] bg-sky/10 text-sky font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {t.active}: {documents.filter(d => d.doc_type && (d.doc_type === 'QUERY' || d.doc_type.startsWith('QUERY_REPLY:'))).length}
                    </span>
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between space-y-4 max-h-[500px] overflow-hidden">
                    <div className="space-y-4 overflow-y-auto flex-grow pr-1 min-h-[250px] max-h-[350px]">
                      {documents.filter(d => d.doc_type && (d.doc_type === 'QUERY' || d.doc_type.startsWith('QUERY_REPLY:'))).length === 0 ? (
                        <div className="text-center py-12">
                          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs text-dim">{t.noQueries}</p>
                        </div>
                      ) : (
                        documents.filter(d => d.doc_type && (d.doc_type === 'QUERY' || d.doc_type.startsWith('QUERY_REPLY:'))).map((doc) => {
                          let queryData = { query: doc.file_name, reply: null }
                          try {
                            if (doc.file_name.startsWith('{')) {
                              queryData = JSON.parse(doc.file_name)
                            }
                          } catch (e) {}

                          return (
                            <div key={doc.id} className="p-4 bg-white border border-line rounded-2xl space-y-3 hover:border-line2 transition-all shadow-sm">
                              <div className="space-y-1">
                                <span className="text-[10px] text-gray-400 block font-medium">
                                  {t.myQuery} ({new Date(doc.created_at).toLocaleDateString('en-IN')}):
                                </span>
                                <p className="font-semibold text-ink text-sm leading-normal">{queryData.query}</p>
                              </div>

                              {queryData.reply ? (
                                <div className="p-3 rounded-xl bg-jade/5 border border-jade/10 space-y-1 animate-fade-in text-xs">
                                  <span className="text-[10px] text-jade block uppercase tracking-wide font-bold">{t.teamResponse}:</span>
                                  <p className="text-dim leading-relaxed">{queryData.reply}</p>
                                </div>
                              ) : (
                                <span className="text-[10px] bg-rose/10 text-rose font-bold px-2 py-0.5 rounded-full inline-block uppercase tracking-wide">
                                  {t.pendingReply}
                                </span>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Send query form */}
                    <form onSubmit={handleQuerySubmit} className="pt-4 border-t border-line space-y-3 flex-shrink-0">
                      <textarea
                        rows={3}
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        placeholder={t.queryPlaceholder}
                        className="block w-full p-3 bg-white border border-line rounded-2xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-fire/50 focus:border-fire transition-all"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={querySubmitting || !queryText.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-fire to-fire2 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          {querySubmitting ? t.sending : t.submitQuery}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Sub tab 2: Pending Requests */}
              {docSubTab === 'requested' && (
                <div className="space-y-4">
                  {uploadError && (
                    <div className="p-4 bg-rose/10 border border-rose/20 text-rose text-xs rounded-xl">
                      {uploadError}
                    </div>
                  )}

                  {requests.filter(r => !r.fulfilled).length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-line rounded-3xl bg-pearl/30">
                      <CheckCircle2 className="w-12 h-12 text-jade mx-auto mb-3" />
                      <h3 className="text-base font-bold text-ink">{t.noPendingRequests}</h3>
                      <p className="text-xs text-dim mt-1">{t.noPendingRequestsDesc}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.filter(r => !r.fulfilled).map((req) => (
                        <div key={req.id} className="border border-line rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-pearl/10">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-ink">{req.title}</h4>
                            {req.description && (
                              <p className="text-xs text-dim leading-relaxed">{req.description}</p>
                            )}
                          </div>

                          <div className="relative overflow-hidden flex-shrink-0 self-stretch sm:self-center">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              id={`upload-${req.id}`}
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, req)}
                              disabled={uploadingId !== null}
                            />
                            <label
                              htmlFor={`upload-${req.id}`}
                              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-fire to-fire2 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm shadow-fire/15 ${
                                uploadingId === req.id ? 'opacity-50 pointer-events-none' : ''
                              }`}
                            >
                              {uploadingId === req.id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                                  {t.uploading}
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  {t.uploadDoc}
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DUES & PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-ink tracking-tight">{t.tabPayments}</h2>
                <p className="text-sm text-dim mt-1">{t.paymentsDesc}</p>
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-line rounded-3xl bg-pearl/30">
                  <IndianRupee className="w-12 h-12 text-dim mx-auto mb-3" />
                  <h3 className="text-base font-bold text-ink">{t.noInvoices}</h3>
                  <p className="text-xs text-dim mt-1">{t.noInvoicesDesc}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Invoices List */}
                  <div className="border border-line rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-line text-left text-xs">
                        <thead className="bg-pearl text-dim uppercase font-bold tracking-wider">
                          <tr>
                            <th className="px-6 py-4">{t.colDescription}</th>
                            <th className="px-6 py-4">{t.colProfFee}</th>
                            <th className="px-6 py-4">{t.colGovFee}</th>
                            <th className="px-6 py-4">{t.colTotal}</th>
                            <th className="px-6 py-4">{t.colDueDate}</th>
                            <th className="px-6 py-4">{t.colStatus}</th>
                            <th className="px-6 py-4 text-right">{t.colActions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line bg-white text-ink">
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-pearl/10 transition-all">
                              <td className="px-6 py-4 font-bold">{invoice.description}</td>
                              <td className="px-6 py-4">₹{Number(invoice.professional_fees).toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4">₹{Number(invoice.government_fees).toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4 font-bold text-ink">₹{Number(invoice.total).toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  invoice.status === 'paid' ? 'bg-jade/10 text-jade' :
                                  invoice.status === 'pending' ? 'bg-rose/10 text-rose' :
                                  'bg-gold/10 text-gold'
                                }`}>
                                  {invoice.status === 'paid' ? t.statusPaid :
                                   invoice.status === 'pending' ? t.statusPending :
                                   invoice.status === 'partial' ? t.statusPartial :
                                   invoice.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleDownloadInvoice(invoice)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line hover:border-ink hover:text-ink text-xs font-semibold rounded-lg transition-all cursor-pointer bg-white"
                                    title={t.download}
                                  >
                                    <Download className="w-3.5 h-3.5 text-dim" />
                                    <span>{t.download}</span>
                                  </button>
                                  
                                  {invoice.status !== 'paid' && (
                                    <button
                                      onClick={() => handlePayUPayment(invoice)}
                                      disabled={paymentLoadingId !== null}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-fire to-fire2 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm shadow-fire/10 hover:shadow-md hover:shadow-fire/15 disabled:opacity-50"
                                    >
                                      {paymentLoadingId === invoice.id ? (
                                        <>
                                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                          <span>{t.paying}</span>
                                        </>
                                      ) : (
                                        <>
                                          <IndianRupee className="w-3.5 h-3.5" />
                                          <span>{t.payNow}</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>


                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              {/* Profile details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-ink tracking-tight">{t.tabProfile}</h2>
                  <p className="text-sm text-dim mt-1">{t.profileDesc}</p>
                </div>

                {profileMsg && (
                  <div className={`p-4 rounded-xl text-xs border ${
                    profileMsg.type === 'success' ? 'bg-jade/10 border-jade/20 text-jade' : 'bg-rose/10 border-rose/20 text-rose'
                  } animate-fade-in`}>
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={updateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-2">{t.fullName}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-2">{t.emailLabel}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        disabled
                        value={profile?.email || ''}
                        className="block w-full pl-10 pr-4 py-2.5 bg-pearl2 border border-line rounded-xl text-dim opacity-70 cursor-not-allowed text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-2">{t.phoneNumber}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 99999 99999"
                        className="block w-full pl-10 pr-4 py-2.5 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-2">{t.billingAddress}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 pt-3 items-start pointer-events-none text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t.addressPlaceholder}
                        className="block w-full pl-10 pr-4 py-2.5 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-6 py-2.5 bg-ink hover:bg-ink2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {profileLoading ? t.saving : t.saveProfile}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password update section */}
              <div className="pt-8 border-t border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">{t.changePassword}</h3>
                  <p className="text-xs text-dim">{t.changePasswordDesc}</p>
                </div>

                {pwdMsg && (
                  <div className={`p-4 rounded-xl text-xs border ${
                    pwdMsg.type === 'success' ? 'bg-jade/10 border-jade/20 text-jade' : 'bg-rose/10 border-rose/20 text-rose'
                  } animate-fade-in`}>
                    {pwdMsg.text}
                  </div>
                )}

                <form onSubmit={updatePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-dim uppercase tracking-wider mb-2">{t.newPassword}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        className="block w-full pl-10 pr-4 py-2.5 bg-pearl border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-fire/50 focus:border-fire transition-all text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-fire to-fire2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {pwdLoading ? t.updating : t.updatePassword}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Mock Payment Modal */}
      {showMockModal && mockPaymentData && (
        <div className="fixed inset-0 bg-ink/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-line shadow-2xl max-w-md w-full overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-fire/10 text-fire flex items-center justify-center flex-shrink-0">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-ink">Simulated Payment</h3>
                <p className="text-xs text-dim">Razorpay Demo Mode (No real charges)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pearl border border-line space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-dim">Invoice:</span>
                <span className="font-bold text-ink text-right">{mockPaymentData.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Invoice ID:</span>
                <span className="font-mono text-ink">#{mockPaymentData.invoiceId.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Order ID:</span>
                <span className="font-mono text-ink">{mockPaymentData.orderId}</span>
              </div>
              <div className="border-t border-line pt-3 flex justify-between text-sm font-bold">
                <span className="text-ink">Total Amount:</span>
                <span className="text-fire">₹{(mockPaymentData.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMockModal(false)
                  setMockPaymentData(null)
                  setPaymentLoadingId(null)
                }}
                className="flex-1 py-2.5 border border-line hover:border-rose hover:text-rose text-xs font-semibold rounded-xl transition-all cursor-pointer text-center bg-white"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleMockPaymentSubmit}
                disabled={paymentLoadingId !== null}
                className="flex-1 py-2.5 bg-gradient-to-r from-fire to-fire2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer text-center disabled:opacity-50"
              >
                Confirm Mock Payment
              </button>
            </div>
          </div>
        </div>
      )}



      {/* PayU Mock Payment Modal */}
      {showPayuMockModal && payuMockData && (
        <div className="fixed inset-0 bg-ink/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-line shadow-2xl max-w-md w-full overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-jade/10 text-jade flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-ink">Simulated PayU Checkout</h3>
                <p className="text-xs text-dim">PayU Demo Mode (No real charges)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pearl border border-line space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-dim">Invoice:</span>
                <span className="font-bold text-ink text-right">{payuMockData.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Invoice ID:</span>
                <span className="font-mono text-ink">#{payuMockData.invoiceId.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Transaction ID:</span>
                <span className="font-mono text-ink">{payuMockData.txnid}</span>
              </div>
              <div className="border-t border-line pt-3 flex justify-between text-sm font-bold">
                <span className="text-ink">Total Amount:</span>
                <span className="text-jade">₹{Number(payuMockData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPayuMockModal(false)
                  setPayuMockData(null)
                  setPaymentLoadingId(null)
                }}
                className="flex-1 py-2.5 border border-line hover:border-rose hover:text-rose text-xs font-semibold rounded-xl transition-all cursor-pointer text-center bg-white"
              >
                {t.cancel}
              </button>
              <button
                onClick={handlePayuMockPaymentSubmit}
                disabled={paymentLoadingId !== null}
                className="flex-1 py-2.5 bg-gradient-to-r from-jade to-jade2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer text-center disabled:opacity-50"
              >
                Confirm PayU Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-ink/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-line shadow-2xl max-w-md w-full overflow-hidden p-6 sm:p-8 space-y-6 relative animate-scale-up">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  modalUploadType === 'SALE_BILL' ? 'bg-jade/10 text-jade' : 'bg-sky/10 text-sky'
                }`}>
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ink">
                    {modalUploadType === 'SALE_BILL' ? t.modalUploadTitleSales : t.modalUploadTitlePurchase}
                  </h3>
                  <p className="text-xs text-dim">{t.modalUploadSub}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (uploadingCol === null) {
                    setIsUploadModalOpen(false)
                  }
                }}
                disabled={uploadingCol !== null}
                className="text-dim hover:text-ink hover:bg-pearl p-1.5 rounded-lg border border-transparent hover:border-line transition-all disabled:opacity-50"
              >
                <span className="text-sm font-bold">&times;</span>
              </button>
            </div>

            {/* Step 1: Select Year & Month */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dim uppercase tracking-wider">{t.selectMonthYear}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-dim">{t.yearLabel}</span>
                  <select 
                    value={modalYear} 
                    onChange={(e) => setModalYear(Number(e.target.value))}
                    className="px-2.5 py-1.5 text-xs font-bold text-ink bg-white border border-line rounded-xl focus:outline-none focus:ring-1 focus:ring-fire transition-all shadow-sm"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: lang === 'en' ? 'Jan' : 'जनवरी (Jan)', num: 1 },
                  { name: lang === 'en' ? 'Feb' : 'फरवरी (Feb)', num: 2 },
                  { name: lang === 'en' ? 'Mar' : 'मार्च (Mar)', num: 3 },
                  { name: lang === 'en' ? 'Apr' : 'अप्रैल (Apr)', num: 4 },
                  { name: lang === 'en' ? 'May' : 'मई (May)', num: 5 },
                  { name: lang === 'en' ? 'Jun' : 'जून (Jun)', num: 6 },
                  { name: lang === 'en' ? 'Jul' : 'जुलाई (Jul)', num: 7 },
                  { name: lang === 'en' ? 'Aug' : 'अगस्त (Aug)', num: 8 },
                  { name: lang === 'en' ? 'Sep' : 'सितंबर (Sep)', num: 9 },
                  { name: lang === 'en' ? 'Oct' : 'अक्टूबर (Oct)', num: 10 },
                  { name: lang === 'en' ? 'Nov' : 'नवंबर (Nov)', num: 11 },
                  { name: lang === 'en' ? 'Dec' : 'दिसंबर (Dec)', num: 12 }
                ].map((m) => {
                  const isSelected = modalMonth === m.num
                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => setModalMonth(m.num)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'bg-fire text-white shadow-md shadow-fire/10 scale-102' 
                          : 'bg-pearl border border-line hover:border-line2 text-ink hover:bg-mist/30'
                      }`}
                    >
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Drag/Select File */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-dim uppercase tracking-wider block">{t.uploadBillFile}</span>
              <div className="border-2 border-dashed border-line hover:border-fire/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all bg-pearl/30 hover:bg-mist/10 relative">
                <Upload className="w-8 h-8 text-fire/80 mb-3" />
                <span className="text-xs font-bold text-ink block">{t.dragUpload}</span>
                <span className="text-[10px] text-dim block mt-1">{t.uploadLimits}</span>
                
                {/* File Info / Selected indicator when uploading */}
                {uploadingCol !== null && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl z-10 space-y-2">
                    <div className="w-8 h-8 border-4 border-fire border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-ink">{t.uploadingSecure}</span>
                    <span className="text-[10px] text-dim bg-pearl px-2 py-0.5 rounded border border-line">
                      {t.uploadTarget}: {modalUploadType === 'SALE_BILL' ? 'Sales' : 'Purchase'} ({getMonthYearString(modalMonth, modalYear)})
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  id="modal-direct-upload"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDirectUpload(e, `${modalUploadType}:${getMonthYearString(modalMonth, modalYear)}`)}
                  disabled={uploadingCol !== null}
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (uploadingCol === null) {
                    setIsUploadModalOpen(false)
                  }
                }}
                disabled={uploadingCol !== null}
                className="flex-1 py-2.5 border border-line hover:border-rose hover:text-rose text-xs font-semibold rounded-xl transition-all cursor-pointer text-center bg-white disabled:opacity-50"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initiate New Service Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 bg-ink/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-line shadow-2xl max-w-2xl w-full overflow-hidden p-6 sm:p-8 space-y-6 relative animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fire/10 text-fire flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ink">
                    {t.initiateNewService}
                  </h3>
                  <p className="text-xs text-dim">
                    {lang === 'en' ? 'Select from all landing page services' : 'लैंडिंग पेज की सभी सेवाओं में से चुनें'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!initiatingService) {
                    setShowInitiateModal(false)
                    setSelectedInitService('')
                    setCustomInitNotes('')
                  }
                }}
                disabled={initiatingService}
                className="text-dim hover:text-ink hover:bg-pearl p-1.5 rounded-lg border border-transparent hover:border-line transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-6 pr-1">
              {/* Category selector */}
              <div>
                <label className="text-[11px] font-bold text-dim uppercase tracking-wider block mb-2">{t.selectServiceCategory}</label>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {(Object.keys(LANDING_SERVICES_BY_CAT) as Array<keyof typeof LANDING_SERVICES_BY_CAT>).map(catKey => {
                    const cat = LANDING_SERVICES_BY_CAT[catKey]
                    const isActive = selectedInitCategory === catKey
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => {
                          setSelectedInitCategory(catKey)
                          setSelectedInitService(cat.services[0].name)
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? 'bg-ink text-white shadow-md'
                            : 'bg-pearl border border-line text-dim hover:bg-mist/30 hover:text-ink'
                        }`}
                      >
                        <span className="mr-1.5">{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Service list selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-dim uppercase tracking-wider block">{t.selectServiceToStart}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LANDING_SERVICES_BY_CAT[selectedInitCategory].services.map(srv => {
                    const isSelected = selectedInitService === srv.name
                    return (
                      <button
                        key={srv.key}
                        type="button"
                        onClick={() => setSelectedInitService(srv.name)}
                        className={`p-4 rounded-2xl text-left transition-all border text-xs font-medium cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-fire/5 border-fire text-fire shadow-md shadow-fire/5'
                            : 'bg-white border-line hover:border-line2 text-ink'
                        }`}
                      >
                        <span>{srv.name}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-fire text-white flex items-center justify-center flex-shrink-0 animate-scale-up">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-dim uppercase tracking-wider block">
                  {lang === 'en' ? 'Notes / Requirements (Optional)' : 'टिप्पणियां / आवश्यकताएं (वैकल्पिक)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={t.requirementsPlaceholder}
                  value={customInitNotes}
                  onChange={(e) => setCustomInitNotes(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-line rounded-xl p-3 text-ink outline-none focus:border-fire transition-all resize-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-line flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowInitiateModal(false)
                  setSelectedInitService('')
                  setCustomInitNotes('')
                }}
                disabled={initiatingService}
                className="flex-1 py-2.5 border border-line hover:border-rose hover:text-rose text-xs font-semibold rounded-xl transition-all cursor-pointer text-center bg-white disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleInitiateService}
                disabled={initiatingService || !selectedInitService}
                className="flex-1 py-2.5 bg-gradient-to-r from-fire to-fire2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {initiatingService ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.initiating}</span>
                  </>
                ) : (
                  <span>{lang === 'en' ? 'Initiate Service' : 'सेवा शुरू करें'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="bg-ink2 text-gray-500 py-6 border-t border-white/5 mt-auto text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Innovise Consultant. Authorized CA &amp; CS Services, Kanpur.</p>
      </footer>
    </div>
  )
}
