import { useState } from 'react'
import { renameFolder, deleteFolder } from '../api/folders'
import { useNavigate } from 'react-router-dom'

export default function FolderCard({ folder, onDeleted, onRenamed }) {
  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState(folder.name)
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const handleRename = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await renameFolder(folder.id, { name })
      onRenamed(folder.id, name)
      setEditing(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm(`Delete folder "${folder.name}"? Images will stay in your library.`)) return
    setLoading(true)
    try {
      await deleteFolder(folder.id)
      onDeleted(folder.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-indigo-500 transition"
      onClick={() => navigate(`/folders/${folder.id}`)}
    >
      <div className="text-3xl">📁</div>

      {editing ? (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-[#111] border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleRename}
            disabled={loading}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg text-white"
          >
            Save
          </button>
        </div>
      ) : (
        <p className="text-white font-medium truncate">{folder.name}</p>
      )}

      <p className="text-xs text-gray-500">{folder.image_count ?? 0} images</p>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-gray-400 hover:text-white transition"
        >
          ✏ Rename
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-red-400 hover:text-red-300 transition ml-auto"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  )
}