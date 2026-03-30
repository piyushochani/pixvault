import { useState, useRef, useEffect } from 'react'
import { textChat } from '../api/chat'

export default function ChatBot() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about your photo library 📸' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    const history = messages.slice(-6)
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await textChat({ query: userMsg.content, history })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-2xl shadow-lg transition"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 text-white font-semibold text-sm">
            PixVault AI Assistant
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-h-80">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white self-end'
                    : 'bg-white/10 text-gray-200 self-start'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-400 self-start animate-pulse">Thinking...</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about your photos..."
              className="flex-1 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}