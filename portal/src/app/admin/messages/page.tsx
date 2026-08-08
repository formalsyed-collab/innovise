'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { MessageCircle, Search, User, Send, CheckCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  phone_number: string
  profile_id: string | null
  status: 'bot' | 'human_requested' | 'human_active'
  created_at: string
  updated_at: string
  profiles?: { full_name: string }
}

interface Message {
  id: string
  conversation_id: string
  sender: 'user' | 'bot' | 'admin'
  content: string
  created_at: string
}

export default function MessagesAdmin() {
  const router = useRouter()
  const supabase = createClient()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuthAndFetch()
    
    // Subscribe to new messages
    const channel = supabase
      .channel('whatsapp_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => {
         if (selectedConv) fetchMessages(selectedConv.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id)
    }
  }, [selectedConv])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    await fetchConversations()
    setLoading(false)
  }

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        profiles(full_name)
      `)
      .order('updated_at', { ascending: false })
    
    if (data) {
      setConversations(data)
    }
  }

  const fetchMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    
    if (data) {
      setMessages(data)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConv) return

    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          message: messageInput
        })
      })

      if (res.ok) {
        setMessageInput('')
        fetchMessages(selectedConv.id)
        
        // Optimistically update conversation status if needed
        if (selectedConv.status !== 'human_active') {
            setSelectedConv({ ...selectedConv, status: 'human_active' })
            fetchConversations()
        }
      } else {
        const err = await res.json()
        alert('Failed to send: ' + err.error)
      }
    } catch (err) {
      alert('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'human_requested':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1"><Clock size={12}/> Needs Reply</span>
      case 'human_active':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"><User size={12}/> Handled by Staff</span>
      case 'bot':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex items-center gap-1"><RefreshCw size={12}/> Handled by Bot</span>
      default:
        return null
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading messages...</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/admin" className="text-gray-500 hover:text-gray-900 mr-4">
                <ArrowLeft size={20} />
              </Link>
              <MessageCircle className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">WhatsApp Inbox</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Conversations List */}
        <div className="w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-800">Conversations</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">No conversations yet.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900">
                      {conv.profiles?.full_name || conv.phone_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(conv.status)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConv.profiles?.full_name || 'Unknown Client'}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedConv.phone_number}</p>
                </div>
                <div>
                  {getStatusBadge(selectedConv.status)}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">No messages yet.</p>
                ) : (
                  messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div 
                        className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm' 
                            : msg.sender === 'admin'
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-800 text-gray-100 rounded-br-sm' // Bot
                        }`}
                      >
                        {msg.sender === 'bot' && <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Bot</div>}
                        {msg.sender === 'admin' && <div className="text-[10px] uppercase font-bold text-blue-200 mb-1">Staff</div>}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-gray-400' : 'text-blue-100/70'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type a message to reply..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {sending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
              <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
