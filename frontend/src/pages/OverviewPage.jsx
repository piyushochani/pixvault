import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Images, FolderOpen, ArrowRight, Upload, Loader2 } from "lucide-react";
import { imageModel } from "../models/imageModel";
import { folderModel } from "./models/Foldermodel";
import { imageModel as imgApi } from "../models/imageModel";
import ImageCard from "../components/ImageCard";
import ImageModal from "../components/ImageModal";
import UploadZone from "../components/UploadZone";
import { getErrorMessage } from "../utils/helpers";

export default function OverviewPage() {
  const [stats, setStats]         = useState({ total_images: 0 });
  const [folderCount, setFolderCount] = useState(0);
  const [recent, setRecent]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [statsData, recentData, foldersData] = await Promise.all([
        imageModel.stats(),
        imageModel.recent(),
        folderModel.list(),
      ]);
      setStats(statsData);
      setRecent(recentData.results || []);
      setFolderCount(foldersData.count || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleUploaded(newImages) {
    setShowUpload(false);
    load();
  }

  function handleDeleted(id) {
    setRecent((prev) => prev.filter((img) => img.id !== id));
    setStats((prev) => ({ ...prev, total_images: Math.max(0, prev.total_images - 1) }));
    setSelected(null);
  }

  function handleUpdated(updated) {
    setRecent((prev) => prev.map((img) => img.id === updated.id ? updated : img));
    setSelected(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Your image library at a glance.</p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={16} />
          Upload images
        </button>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Upload new images</h2>
          <UploadZone onUploaded={handleUploaded} />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
            <Images size={22} className="text-brand-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_images}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total images</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <FolderOpen size={22} className="text-purple-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{folderCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Folders</p>
          </div>
        </div>
      </div>

      {/* Recent images */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-4">Recent uploads</h2>

        {recent.length === 0 ? (
          <div className="card p-12 text-center">
            <Images size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No images yet</p>
            <p className="text-gray-400 text-sm mt-1">Upload your first image to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recent.map((img) => (
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
        )}

        {recent.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              to="/images"
              className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 font-medium text-sm transition-colors"
            >
              See all images <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>

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