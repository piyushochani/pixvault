import { useState, useEffect, useCallback } from "react";
import { X, Download, Trash2, Pencil, Check, Loader2, FolderOpen } from "lucide-react";
import { imageModel } from "../models/imageModel";
import { folderModel } from "./models/Foldermodel";
import { downloadImage, formatDate, getErrorMessage } from "../utils/helpers";

/**
 * ImageModal
 * ----------
 * Props:
 *   image         — image object (null = closed)
 *   onClose()
 *   onDeleted(id)
 *   onUpdated(updatedImage)
 */
export default function ImageModal({ image, onClose, onDeleted, onUpdated }) {
  const [editMode, setEditMode]       = useState(false);
  const [desc, setDesc]               = useState("");
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [error, setError]             = useState(null);
  const [folders, setFolders]         = useState([]);
  const [movingFolder, setMovingFolder] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");

  // Populate state when image changes
  useEffect(() => {
    if (!image) return;
    setDesc(image.user_description || "");
    setEditMode(false);
    setError(null);
    setSelectedFolder(image.folder_id || "");

    folderModel.list().then((data) => setFolders(data.folders || [])).catch(() => {});
  }, [image]);

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!image) return null;

  async function saveDescription() {
    setSaving(true);
    setError(null);
    try {
      const data = await imageModel.updateDescription(image.id, desc);
      onUpdated({ ...image, user_description: data.user_description });
      setEditMode(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Move this image to the recycle bin?")) return;
    setDeleting(true);
    try {
      await imageModel.delete(image.id);
      onDeleted(image.id);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  async function handleMoveFolder(folderId) {
    setMovingFolder(true);
    try {
      await imageModel.moveToFolder(image.id, folderId || null);
      setSelectedFolder(folderId);
      onUpdated({ ...image, folder_id: folderId || null });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMovingFolder(false);
    }
  }

  const displayDesc = image.user_description || image.ai_description;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Image — 60% of screen height */}
        <div className="w-full bg-gray-900 rounded-t-2xl flex items-center justify-center overflow-hidden"
             style={{ minHeight: "60vh", maxHeight: "60vh" }}>
          <img
            src={image.image_url}
            alt={displayDesc || "Image"}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Bottom panel */}
        <div className="p-6 space-y-5">
          {/* Action buttons row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => downloadImage(image.image_url, `pixvault-${image.id}`)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download size={15} /> Download
            </button>

            <button
              onClick={() => setEditMode((v) => !v)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Pencil size={15} /> Edit description
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger flex items-center gap-2 text-sm ml-auto"
            >
              {deleting
                ? <><Loader2 size={15} className="animate-spin" /> Deleting…</>
                : <><Trash2 size={15} /> Delete</>
              }
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Edit description */}
          {editMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your description</label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe this image…"
                className="input-base resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveDescription}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : <><Check size={14} /> Save</>
                  }
                </button>
                <button
                  onClick={() => { setEditMode(false); setDesc(image.user_description || ""); }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Move to folder */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <FolderOpen size={14} /> Move to folder
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="input-base text-sm flex-1"
                disabled={movingFolder}
              >
                <option value="">— No folder —</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button
                onClick={() => handleMoveFolder(selectedFolder)}
                disabled={movingFolder}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                {movingFolder ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Apply
              </button>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {image.user_description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Your description
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">{image.user_description}</p>
              </div>
            )}
            {image.ai_description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  AI description
                </p>
                <p className="text-gray-500 text-sm leading-relaxed italic">{image.ai_description}</p>
              </div>
            )}
            {!image.user_description && !image.ai_description && (
              <p className="text-gray-400 text-sm italic">No description available.</p>
            )}
            <p className="text-xs text-gray-400">Uploaded {formatDate(image.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}