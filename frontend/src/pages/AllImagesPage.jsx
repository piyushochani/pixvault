import { useEffect, useState } from 'react'
import { listImages } from '../api/images'
import { keywordSearch, semanticSearch } from '../api/search'
import ImageCard from '../components/ImageCard'
import ImageModal from '../components/ImageModal'
import UploadModal from '../components/UploadModal'
import ChatBot from '../components/ChatBot'
import { useDebounce } from '../hooks/useDebounce'

export default function AllImagesPage() {
  const [images, setImages]         = useState([])
  const [results, setResults]       = useState(null)
  const [selected, setSelected]     = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [sort, setSort]             = useState('desc')
  const [query, setQuery]           = useState('')
  const [searchMode, setSearchMode] = useState('keyword')
  const [loading, setLoading]       = useState(false)
  const debouncedQuery              = useDebounce(query, 500)

  useEffect(() => {
    listImages(sort).then((r) => setImages(r.data.results || []))
  }, [sort])

  useEffect(() => {
    if (!debouncedQuery.trim()) return setResults(null)
    setLoading(true)
    const fn = searchMode === 'keyword' ? keywordSearch : semanticSearch
    fn(debouncedQuery)
      .then((r) => setResults(r.data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery, searchMode])

  const displayed = results !== null ? results : images

  const handleDeleted = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    setResults((prev) => prev ? prev.filter((img) => img.id !== id) : null)
  }
  const handleUpdated = (updated) => {
    const update = (list) => list.map((img) => img.id === updated.id ? updated : img)
    setImages(update)
    setResults((prev) => prev ? update(prev) : null)
  }
  const handleUploaded = (newImage) => setImages((prev) => [newImage, ...prev])

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Images</h1>
          <p className="text-white/40 text-sm mt-1">Browse and search your photo library.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#111] border border-white/10 text-sm text-white/60 rounded-lg px-3 py-2 outline-none"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            + Upload
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex bg-[#111] border border-white/10 rounded-lg overflow-hidden text-sm">
          <button
            onClick={() => setSearchMode('keyword')}
            className={`px-4 py-2 transition ${searchMode === 'keyword' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
          >
            Keyword
          </button>
          <button
            onClick={() => setSearchMode('semantic')}
            className={`px-4 py-2 transition ${searchMode === 'semantic' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
          >
            Describe Photo
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchMode === 'keyword' ? 'Search by description...' : 'Describe your photo...'}
          className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null) }}
            className="text-sm text-white/40 hover:text-white px-3"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {results !== null && (
        <p className="text-sm text-white/40">
          {loading ? 'Searching...' : `${results.length} result(s) for "${debouncedQuery}"`}
        </p>
      )}

      {displayed.length === 0
        ? <p className="text-white/40 text-sm">{results !== null ? 'No images found.' : 'No images yet. Upload your first photo!'}</p>
        : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayed.map((img) => (
              <ImageCard key={img.id} image={img} onClick={setSelected} onDeleted={handleDeleted} />
            ))}
          </div>
        )
      }

      {selected && (
        <ImageModal image={selected} onClose={() => setSelected(null)} onDeleted={handleDeleted} onUpdated={handleUpdated} />
      )}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
      )}
      <ChatBot />
    </div>
  )
}