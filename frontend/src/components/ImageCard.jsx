import { useState } from 'react'
import { softDelete } from '../api/images'

export default function ImageCard({ image, onClick, onDeleted }) {
  const [hovered, setHovered] = useState(false)

  const handleDownload = async (e) => {
    e.stopPropagation()
    const res = await fetch(image.image_url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pixvault-${image.id}.jpg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer bg-[#1a1a1a] aspect-square"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(image)}
    >
      <img
        src={image.image_url}
        alt={image.user_description || 'Image'}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      />

      {/* Hover overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 transition-all">
          <button
            onClick={handleDownload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg w-28"
          >
            ⬇ Download
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(image) }}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-lg w-28"
          >
            ✏ Edit
          </button>
        </div>
      )}

      {/* Description tag */}
      {image.user_description && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-gray-300 px-2 py-1 truncate">
          {image.user_description}
        </div>
      )}
    </div>
  )
}