import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function IntroPage() {
  const [mode, setMode]       = useState('landing') // 'landing' | 'login' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin }  = useAuth()
  const navigate              = useNavigate()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? login : register
      const res = await fn({ email, password })
      authLogin(res.data.token, res.data.email)
      navigate('/overview')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (mode !== 'landing') return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white text-center">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
        />

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
        </button>

        <p className="text-center text-sm text-gray-400">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-indigo-400 hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>

        <button onClick={() => setMode('landing')} className="text-xs text-gray-600 hover:text-gray-400 text-center">
          ← Back
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-6 text-center gap-10">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl font-bold text-white">
          Pix<span className="text-indigo-400">Vault</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          AI-powered image management. Upload photos, generate descriptions, and search your library using natural language.
        </p>
        <button
          onClick={() => setMode('register')}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold text-base transition"
        >
          Get Started
        </button>
        <button
          onClick={() => setMode('login')}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Already have an account? Login →
        </button>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl w-full">
        {[
          { icon: '🖼️', title: 'Smart Upload',      desc: 'AI generates descriptions automatically' },
          { icon: '🔍', title: 'Semantic Search',   desc: 'Find images by describing them naturally' },
          { icon: '📁', title: 'Folder Organiser',  desc: 'Group your images into folders' },
          { icon: '🤖', title: 'AI Chatbot',        desc: 'Ask questions about your photo library' },
          { icon: '🗑️', title: 'Recycle Bin',       desc: 'Restore deleted images within 24 hours' },
          { icon: '☁️', title: 'Cloud Storage',     desc: 'All images stored securely on Cloudinary' },
        ].map((f) => (
          <div key={f.title} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-left">
            <div className="text-2xl mb-2">{f.icon}</div>
            <p className="text-white font-medium text-sm">{f.title}</p>
            <p className="text-gray-500 text-xs mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}