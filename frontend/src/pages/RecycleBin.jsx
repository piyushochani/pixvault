import { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, Loader2, Clock } from "lucide-react";
import { recycleBinModel } from "../models/recycleBinModel";
import { formatCountdown, formatDate, getErrorMessage } from "../utils/helpers";

export default function RecycleBinPage() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [message, setMessage] = useState(null);
  const [actionId, setActionId] = useState(null);   // id currently being acted on

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await recycleBinModel.list();
      setItems(data.results || []);
      setMessage(data.message || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRestore(imageId) {
    setActionId(imageId);
    try {
      await recycleBinModel.restore(imageId);
      setItems((prev) => prev.filter((i) => i.image_id !== imageId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function handlePermanentDelete(imageId) {
    if (!window.confirm("Permanently delete this image? This cannot be undone.")) return;
    setActionId(imageId);
    try {
      await recycleBinModel.permanentDelete(imageId);
      setItems((prev) => prev.filter((i) => i.image_id !== imageId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
        <p className="text-gray-500 text-sm mt-1">
          Deleted images are kept here for 24 hours before being permanently removed.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <Trash2 size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">Recycle bin is empty</p>
          <p className="text-gray-400 text-sm mt-2">
            {message || "Deleted images will appear here for 24 hours."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.image_id} className="card p-4 flex gap-4 items-start">
              {/* Thumbnail */}
              <img
                src={item.image_url}
                alt={item.user_description || "Deleted image"}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0 opacity-70"
              />

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {item.user_description && (
                  <p className="text-sm font-medium text-gray-700 line-clamp-1">
                    {item.user_description}
                  </p>
                )}
                {item.ai_description && (
                  <p className="text-xs text-gray-400 italic line-clamp-1">
                    {item.ai_description}
                  </p>
                )}
                {!item.user_description && !item.ai_description && (
                  <p className="text-sm text-gray-400 italic">No description</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <Clock size={12} />
                  <span>{formatCountdown(item.hours_remaining)}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Deleted {formatDate(item.deleted_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleRestore(item.image_id)}
                  disabled={actionId === item.image_id}
                  title="Restore"
                  className="btn-secondary flex items-center gap-1.5 text-sm text-green-600 border-green-200 hover:bg-green-50"
                >
                  {actionId === item.image_id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <RotateCcw size={14} />
                  }
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(item.image_id)}
                  disabled={actionId === item.image_id}
                  title="Delete permanently"
                  className="btn-secondary flex items-center gap-1.5 text-sm text-red-500 border-red-200 hover:bg-red-50"
                >
                  {actionId === item.image_id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <X size={14} />
                  }
                  Delete now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}