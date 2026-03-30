import { useEffect, useState } from 'react'
import { listFolders, createFolder } from '../api/folders'
import FolderCard from '../components/FolderCard'
import ChatBot from '../components/ChatBot'

export default function FoldersPage() {
  const [folders, setFolders] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    listFolders().then((r) => setFolders(r.data.folders || []))
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await createFolder({ name: newName.trim() })
      setFolders((prev) => [res.data, ...prev])
      setNewName('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create folder.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleted = (id) => setFolders((prev) => prev.filter((f) => f.id !== id))
  const handleRenamed = (id, name) => setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f))

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white">Folders</h1>
        <p className="text-white/40 text-sm mt-1">Organise your images into folders.</p>
      </div>

      {/* Create folder */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New folder name..."
          className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg"
        >
          + Create
        </button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Folder grid */}
      {folders.length === 0
        ? <p className="text-white/40 text-sm">No folders yet. Create one above!</p>
        : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {folders.map((f) => (
              <FolderCard key={f.id} folder={f} onDeleted={handleDeleted} onRenamed={handleRenamed} />
            ))}
          </div>
        )
      }

      <ChatBot />
    </div>
  )
}