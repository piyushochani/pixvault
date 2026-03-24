import { useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import { truncate, formatDate, downloadImage } from "../utils/helpers";

/**
 * ImageCard
 * ---------
 * Props:
 *   image        — image object from API
 *   onClick()    — open image modal
 *   onDelete()   — soft delete callback
 */
export default function ImageCard({ image, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Move this image to the recycle bin?")) return;
    setDeleting(true);
    try {
      await onDelete(image.id);
    } finally {
      setDeleting(false);
    }
  }

  function handleDownload(e) {
    e.stopPropagation();
    downloadImage(image.image_url, `pixvault-${image.id}`);
  }

  const description = image.user_description || image.ai_description || "";

  return (
    <div
      className="card overflow-hidden cursor-pointer group relative"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={image.image_url}
          alt={description || "Image"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-black/40 flex items-end justify-between p-2 transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={handleDownload}
            title="Download"
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-colors"
          >
            <Download size={15} />
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              title="Edit"
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
              className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Similarity badge for semantic search results */}
        {image.similarity_score !== undefined && (
          <div className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {Math.round(image.similarity_score * 100)}% match
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="p-3">
        {description ? (
          <p className="text-sm text-gray-700 line-clamp-2 leading-snug">
            {truncate(description, 100)}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No description</p>
        )}
        <p className="text-xs text-gray-400 mt-1.5">{formatDate(image.created_at)}</p>
      </div>
    </div>
  );
}