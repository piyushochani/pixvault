import { useState, useEffect } from "react";
import { FolderOpen, Plus, ArrowLeft, Loader2, Images } from "lucide-react";
import { folderModel } from "s./models/Foldermodel";
import { imageModel } from "../models/imageModel";
import FolderCard from "../components/FolderCard";
import ImageCard from "../components/ImageCard";
import ImageModal from "../components/ImageModal";
import { getErrorMessage } from "../utils/helpers";

export default function FolderPage() {
  const [folders, setFolders]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [creating, setCreating]       = useState(false);
  const [newName, setNewName]         = useState("");
  const [savingFolder, setSavingFolder] = useState(false);

  // Drill-down state
  const [openFolder, setOpenFolder]   = useState(null);  // { id, name }
  const [folderImages, setFolderImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selected, setSelected]       = useState(null);

  async function loadFolders() {
    setLoading(true);
    setError(null);
    try {
      const data = await folderModel.list();
      setFolders(data.folders || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFolders(); }, []);

  async function openFolderView(folder) {
    setOpenFolder(folder);
    setLoadingImages(true);
    try {
      const data = await folderModel.images(folder.id);
      setFolderImages(data.results || []);
    } catch (err) {
      setFolderImages([]);
    } finally {
      setLoadingImages(false);
    }
  }

  async function createFolder() {
    const name = newName.trim();
    if (!name) return;
    setSavingFolder(true);
    try {
      const folder = await folderModel.create(name);
      setFolders((prev) => [{ ...folder, image_count: 0 }, ...prev]);
      setNewName("");
      setCreating(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingFolder(false);
    }
  }

  function handleRenamed(id, name) {
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
    if (openFolder?.id === id) setOpenFolder((f) => ({ ...f, name }));
  }

  function handleDeleted(id) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (openFolder?.id === id) setOpenFolder(null);
  }

  function handleImageDeleted(id) {
    setFolderImages((prev) => prev.filter((img) => img.id !== id));
    setSelected(null);
  }

  function handleImageUpdated(updated) {
    setFolderImages((prev) => prev.map((img) => img.id === updated.id ? updated : img));
    setSelected(updated);
  }

  // ── Folder drill-down view ───────────────────────────────────────────────
  if (openFolder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpenFolder(null)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={15} /> Back to folders
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{openFolder.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {folderImages.length} image{folderImages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loadingImages ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : folderImages.length === 0 ? (
          <div className="card p-12 text-center">
            <Images size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">This folder has no images yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Open any image and use "Move to folder" to add it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {folderImages.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                onClick={() => setSelected(img)}
                onDelete={async (id) => {
                  await imageModel.delete(id);
                  handleImageDeleted(id);
                }}
              />
            ))}
          </div>
        )}

        <ImageModal
          image={selected}
          onClose={() => setSelected(null)}
          onDeleted={handleImageDeleted}
          onUpdated={handleImageUpdated}
        />
      </div>
    );
  }

  // ── Main folder list view ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Folders</h1>
          <p className="text-gray-500 text-sm mt-1">Organise your images into folders.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={15} /> New folder
        </button>
      </div>

      {/* Create folder input */}
      {creating && (
        <div className="card p-4 flex gap-2 items-center">
          <FolderOpen size={18} className="text-brand-500 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Folder name…"
            className="input-base flex-1"
          />
          <button onClick={createFolder} disabled={savingFolder} className="btn-primary text-sm">
            {savingFolder ? "Creating…" : "Create"}
          </button>
          <button onClick={() => setCreating(false)} className="btn-secondary text-sm">
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : folders.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpen size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No folders yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Create a folder to start organising your images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => openFolderView(folder)}
              onRenamed={handleRenamed}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}