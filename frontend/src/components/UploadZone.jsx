import { useState, useRef, useCallback } from "react";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { imageModel } from "../models/imageModel";
import { getErrorMessage } from "../utils/helpers";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 10;

export default function UploadZone({ onUploaded }) {
  const [dragging, setDragging]     = useState(false);
  const [files, setFiles]           = useState([]);       // [{file, preview, desc, status, error}]
  const [uploading, setUploading]   = useState(false);
  const inputRef                    = useRef();

  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter((f) => {
      if (!ALLOWED.includes(f.type)) return false;
      if (f.size > MAX_MB * 1024 * 1024) return false;
      return true;
    });
    const entries = valid.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      desc: "",
      status: "pending",   // pending | uploading | done | error
      error: null,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  // Drag events
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const updateDesc = (id, desc) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, desc } : f)));

  async function uploadAll() {
    if (!files.length) return;
    setUploading(true);

    const results = [];
    for (const entry of files) {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: "uploading" } : f))
      );
      try {
        const data = await imageModel.upload(entry.file, entry.desc);
        results.push(data);
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: "done" } : f))
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "error", error: getErrorMessage(err) }
              : f
          )
        );
      }
    }

    setUploading(false);

    // Remove done files after short delay, keep errored ones visible
    setTimeout(() => {
      setFiles((prev) => prev.filter((f) => f.status !== "done"));
    }, 1500);

    if (results.length > 0 && onUploaded) onUploaded(results);
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors select-none
          ${dragging
            ? "border-brand-500 bg-brand-50"
            : "border-gray-200 bg-white hover:border-brand-400 hover:bg-gray-50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
          <ImagePlus size={28} className="text-brand-500" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700">
            Drag &amp; drop images here
          </p>
          <p className="text-sm text-gray-400 mt-1">
            or click to browse — JPEG, PNG, WEBP, GIF · max {MAX_MB} MB each
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((entry) => (
            <div
              key={entry.id}
              className="card p-3 flex gap-3 items-start"
            >
              {/* Thumbnail */}
              <img
                src={entry.preview}
                alt=""
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />

              {/* Description + status */}
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  placeholder="Add a description (optional)…"
                  value={entry.desc}
                  onChange={(e) => updateDesc(entry.id, e.target.value)}
                  disabled={entry.status !== "pending"}
                  className="input-base text-sm"
                />
                {entry.status === "uploading" && (
                  <p className="text-xs text-brand-500 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Uploading &amp; processing AI description…
                  </p>
                )}
                {entry.status === "done" && (
                  <p className="text-xs text-green-600 font-medium">✓ Uploaded</p>
                )}
                {entry.status === "error" && (
                  <p className="text-xs text-red-500">{entry.error}</p>
                )}
              </div>

              {/* Remove */}
              {entry.status === "pending" && (
                <button
                  onClick={() => removeFile(entry.id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}

          {/* Upload button */}
          {pendingCount > 0 && (
            <button
              onClick={uploadAll}
              disabled={uploading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 size={16} className="animate-spin" /> Uploading…</>
              ) : (
                <><Upload size={16} /> Upload {pendingCount} image{pendingCount > 1 ? "s" : ""}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}