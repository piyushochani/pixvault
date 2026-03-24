import { useState, useEffect, useCallback } from "react";
import { Images, Upload, SortAsc, SortDesc, Loader2, X } from "lucide-react";
import { imageModel } from "../models/imageModel";
import ImageCard from "../components/ImageCard";
import ImageModal from "../components/ImageModal";
import SearchBar from "../components/SearchBar";
import UploadZone from "../components/UploadZone";
import { getErrorMessage } from "../utils/helpers";

export default function AllImagesPage() {
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [sort, setSort]           = useState("desc");
  const [selected, setSelected]   = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchResults, setSearchResults] = useState(null);  // null = not searching
  const [searchMessage, setSearchMessage] = useState(null);

  const load = useCallback(async (sortDir = sort) => {
    setLoading(true);
    setError(null);
    setSearchResults(null);
    setSearchMessage(null);
    try {
      const data = await imageModel.list(sortDir);
      setImages(data.results || []);
      if (data.message) setSearchMessage(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => { load(); }, []);

  function toggleSort() {
    const next = sort === "desc" ? "asc" : "desc";
    setSort(next);
    if (!searchResults) load(next);
  }

  function handleUploaded() {
    setShowUpload(false);
    load();
  }

  function handleSearchResults(data) {
    setSearchResults(data.results || []);
    setSearchMessage(data.message || null);
  }

  function clearSearch() {
    setSearchResults(null);
    setSearchMessage(null);
  }

  function handleDeleted(id) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (searchResults) setSearchResults((prev) => prev.filter((img) => img.id !== id));
    setSelected(null);
  }

  function handleUpdated(updated) {
    setImages((prev) => prev.map((img) => img.id === updated.id ? updated : img));
    if (searchResults) setSearchResults((prev) => prev.map((img) => img.id === updated.id ? updated : img));
    setSelected(updated);
  }

  const displayImages = searchResults !== null ? searchResults : images;
  const isSearching   = searchResults !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Images</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSearching
              ? `${displayImages.length} search result${displayImages.length !== 1 ? "s" : ""}`
              : `${images.length} image${images.length !== 1 ? "s" : ""} in your library`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSort}
            title={sort === "desc" ? "Newest first" : "Oldest first"}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {sort === "desc" ? <SortDesc size={15} /> : <SortAsc size={15} />}
            {sort === "desc" ? "Newest" : "Oldest"}
          </button>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Upload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Upload new images</h2>
            <button onClick={() => setShowUpload(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
          </div>
          <UploadZone onUploaded={handleUploaded} />
        </div>
      )}

      {/* Search */}
      <div className="card p-5">
        <SearchBar onResults={handleSearchResults} onClear={clearSearch} />
      </div>

      {/* Search result message */}
      {searchMessage && displayImages.length === 0 && (
        <div className="card p-8 text-center">
          <Images size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{searchMessage}</p>
          {isSearching && (
            <button onClick={clearSearch} className="mt-4 text-sm text-brand-500 hover:underline">
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      )}

      {/* Grid */}
      {!loading && displayImages.length > 0 && (
        <>
          {isSearching && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing search results
              </p>
              <button onClick={clearSearch} className="text-sm text-brand-500 hover:underline flex items-center gap-1">
                <X size={13} /> Clear search
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayImages.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                onClick={() => setSelected(img)}
                onDelete={async (id) => {
                  await imageModel.delete(id);
                  handleDeleted(id);
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state (not searching) */}
      {!loading && !isSearching && images.length === 0 && !searchMessage && (
        <div className="card p-16 text-center">
          <Images size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No images yet</p>
          <p className="text-gray-400 text-sm mt-2">Upload your first image using the button above.</p>
        </div>
      )}

      {/* Modal */}
      <ImageModal
        image={selected}
        onClose={() => setSelected(null)}
        onDeleted={handleDeleted}
        onUpdated={handleUpdated}
      />
    </div>
  );
}