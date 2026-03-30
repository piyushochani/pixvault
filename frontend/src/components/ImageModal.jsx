import { useState } from 'react'
import { updateDescription, softDelete } from '../api/images'

export default function ImageModal({ image, onClose, onDeleted, onUpdated }) {
  const [editMode, setEditMode]   = useState(false)
  const [desc, setDesc]           = useState(image.user_description || '')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleDownload = async () => {
    const res = await fetch(image.image_url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pixvault-${image.id}.jpg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!confirm('Move this image to recycle bin?')) return
    setLoading(true)
    try {
      await softDelete(image.id)
      onDeleted(image.id)
      onClose()
    } catch {
      setError('Failed to delete.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDesc = async () => {
    setLoading(true)
    try {
      await updateDescription(image.id, { user_description: desc })
      onUpdated({ ...image, user_description: desc })
      setEditMode(false)
    } catch {
      setError('Failed to update description.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 bg-[#1a1a1a] rounded-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image — 60% of container height */}
        <div className="w-full" style={{ height: '60vh' }}>
          <img
            src={image.image_url}
            alt={image.user_description || 'Image'}
            className="w-full h-full object-contain bg-black"
          />
        </div>

        {/* Bottom section */}
        <div className="p-5 flex flex-col gap-4">

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleDownload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
            >
              ⬇ Download
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg"
            >
              ✏ Edit Description
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg"
            >
              🗑 Delete
            </button>
            <button
              onClick={onClose}
              className="ml-auto bg-white/5 hover:bg-white/10 text-gray-400 text-sm px-4 py-2 rounded-lg"
            >
              ✕ Close
            </button>
          </div>

          {/* Edit description */}
          {editMode && (
            <div className="flex gap-2">
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="flex-1 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                placeholder="Update description..."
              />
              <button
                onClick={handleSaveDesc}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Descriptions */}
          <div className="text-sm text-gray-300 space-y-1">
            {image.user_description && (
              <p><span className="text-indigo-400 font-medium">Your description: </span>{image.user_description}</p>
            )}
            {image.ai_description && (
              <p><span className="text-purple-400 font-medium">AI description: </span>{image.ai_description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}