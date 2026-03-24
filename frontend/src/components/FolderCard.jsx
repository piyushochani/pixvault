import { useState } from "react";
import { FolderOpen, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { folderModel } from "./models/Foldermodel";
import { getErrorMessage } from "../utils/helpers";

/**
 * FolderCard
 * ----------
 * Props:
 *   folder        — { id, name, image_count, created_at }
 *   onClick()     — open folder to view its images
 *   onRenamed(id, newName)
 *   onDeleted(id)
 */
export default function FolderCard({ folder, onClick, onRenamed, onDeleted }) {
  const [renaming, setRenaming]   = useState(false);
  const [newName, setNewName]     = useState(folder.name);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState(null);

  async function handleRename() {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === folder.name) { setRenaming(false); return; }
    setSaving(true);
    setError(null);
    try {
      await folderModel.rename(folder.id, trimmed);
      onRenamed(folder.id, trimmed);
      setRenaming(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm(`Delete folder "${folder.name}"? Images inside will stay in your library.`)) return;
    setDeleting(true);
    try {
      await folderModel.delete(folder.id);
      onDeleted(folder.id);
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => !renaming && onClick()}
    >
      {/* Icon + name row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <FolderOpen size={20} className="text-brand-500" />
          </div>

          {renaming ? (
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
              onClick={(e) => e.stopPropagation()}
              className="input-base text-sm py-1"
            />
          ) : (
            <div className="min-w-0">
              <p className="font-medium text-gray-800 truncate">{folder.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {folder.image_count === 0
                  ? "No images"
                  : `${folder.image_count} image${folder.image_count !== 1 ? "s" : ""}`}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="flex gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {renaming ? (
            <>
              <button
                onClick={handleRename}
                disabled={saving}
                className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                onClick={() => { setRenaming(false); setNewName(folder.name); }}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setRenaming(true)}
                title="Rename"
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                title="Delete"
                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}