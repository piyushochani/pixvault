import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, recentImages } from '../api/images'
import { listFolders } from '../api/folders'
import ImageCard from '../components/ImageCard'
import ImageModal from '../components/ImageModal'
import ChatBot from '../components/ChatBot'

export default function OverviewPage() {
  const [stats, setStats]       = useState({ total_images: 0 })
  const [folders, setFolders]   = useState([])
  const [recent, setRecent]     = useState([])
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getStats().then((r) => setStats(r.data))
    listFolders().then((r) => setFolders(r.data.folders || []))
    recentImages().then((r) => setRecent(r.data.results || []))
  }, [])

  const handleDeleted = (id) => setRecent((prev) => prev.filter((img) => img.id !== id))
  const handleUpdated = (updated) => setRecent((prev) => prev.map((img) => img.id === updated.id ? updated : img))

  return (
    <div className="flex flex-col gap-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-white/40 text-sm mt-1">Welcome back to PixVault.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Images',  value: stats.total_images, icon: '🖼️' },
          { label: 'Total Folders', value: folders.length,     icon: '📁' },
          { label: 'Recent Uploads',value: recent.length,      icon: '🕐' },
        ].map((s) => (
          <div key={s.label} className="bg-[#111] border border-white/10 rounded-xl p-5 flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent images */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Images</h2>
        {recent.length === 0
          ? <p className="text-white/40 text-sm">No images yet. Upload your first photo!</p>
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {recent.map((img) => (
                <ImageCard key={img.id} image={img} onClick={setSelected} onDeleted={handleDeleted} />
              ))}
            </div>
          )
        }
      </div>

      {/* See all button */}
      <button
        onClick={() => navigate('/images')}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
      >
        See All Images →
      </button>

      {selected && (
        <ImageModal
          image={selected}
          onClose={() => setSelected(null)}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      )}

      <ChatBot />
    </div>
  )
}