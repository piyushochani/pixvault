import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { folderImages } from '../api/folders'
import Header from '../components/Header'
import ImageCard from '../components/ImageCard'
import ImageModal from '../components/ImageModal'

export default function FolderViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [images, setImages]     = useState([])
  const [selected, setSelected] = useState(null)
  const [empty, setEmpty]       = useState(false)

  useEffect(() => {
    folderImages(id)
      .then((r) => {
        const imgs = r.data.results || []
        setImages(imgs)
        if (imgs.length === 0) setEmpty(true)
      })
      .catch(() => setEmpty(true))
  }, [id])

  const handleDeleted = (imgId) => setImages((prev) => prev.filter((img) => img.id !== imgId))
  const handleUpdated = (updated) => setImages((prev) => prev.map((img) => img.id === updated.id ? updated : img))

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-10 px-6">
      <Header />

      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/folders')} className="text-gray-400 hover:text-white text-sm">
            ← Folders
          </button>
          <h1 className="text-xl font-bold text-white">Folder Images</h1>
        </div>

        {empty
          ? <p className="text-gray-500 text-sm">This folder has no images yet.</p>
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((img) => (
                <ImageCard key={img.id} image={img} onClick={setSelected} onDeleted={handleDeleted} />
              ))}
            </div>
          )
        }
      </div>

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