import { useState } from 'react'
import { uploadImage } from '../api/images'

export default function UploadModal({ onClose, onUploaded }) {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [desc, setDesc]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file) return setError('Please select an image.')
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      if (desc.trim()) form.append('user_description', desc.trim())
      const res = await uploadImage(form)
      onUploaded(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Upload Image</h2>

        {/* File picker */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition">
          {preview
            ? <img src={preview} className="max-h-48 rounded-lg object-contain" alt="preview" />
            : <span className="text-gray-400 text-sm">Click to select image (JPEG, PNG, WEBP, GIF — max 10MB)</span>
          }
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>

        {/* Description */}
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Add a description (optional)"
          className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        />

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-2 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}