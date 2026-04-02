import { useRef, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { API } from "../../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_MB        = 5;

/**
 * PosterUpload
 *
 * Props:
 *   currentUrl  {string}   — existing poster URL (shown as preview)
 *   onUploaded  {fn(url)}  — called with the new poster URL after successful upload
 *   label       {string}   — optional label (default "Movie Poster")
 *   aspectRatio {string}   — "portrait" (2:3) | "landscape" (16:9) | "square" (1:1)
 */
export default function PosterUpload({
  currentUrl  = null,
  onUploaded,
  label       = "Poster Image",
  aspectRatio = "portrait",
}) {
  const inputRef            = useRef(null);
  const [preview,  setPreview]  = useState(currentUrl);
  const [dragging, setDragging] = useState(false);
  const [uploading,setUploading]= useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);

  // ── Aspect ratio classes ──────────────────────────────────
  const aspectCls = {
    portrait:  "aspect-[2/3]",
    landscape: "aspect-[16/9]",
    square:    "aspect-square",
  }[aspectRatio] ?? "aspect-[2/3]";

  // ── Validate file before upload ───────────────────────────
  const validate = (file) => {
    if (!file) return "No file selected";
    if (!ALLOWED_TYPES.includes(file.type))
      return "Only JPEG, PNG, WebP or GIF images are allowed";
    if (file.size > MAX_MB * 1024 * 1024)
      return `File too large — max ${MAX_MB} MB`;
    return null;
  };

  // ── Upload to backend ─────────────────────────────────────
  const upload = async (file) => {
    const err = validate(file);
    if (err) { setError(err); return; }

    setError(null);
    setUploading(true);
    setProgress(0);

    // Show local preview immediately while uploading
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await axios.post(`${API.API_URL}/upload/poster`, fd, {
        headers: {
          ...auth(),
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      const serverUrl = res.data?.url;
      if (!serverUrl) throw new Error("No URL returned from server");

      setPreview(serverUrl);
      setProgress(100);
      onUploaded?.(serverUrl);
    } catch (e) {
      const msg = e.response?.data?.error ?? e.message ?? "Upload failed";
      setError(msg);
      setPreview(currentUrl); // revert to old poster on error
    } finally {
      setUploading(false);
    }
  };

  // ── Event handlers ────────────────────────────────────────
  const onFileChange  = (e) => { if (e.target.files?.[0]) upload(e.target.files[0]); };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };

  const clear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    setProgress(0);
    onUploaded?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">

      {/* Label */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        {label}
      </p>

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative ${aspectCls} rounded-2xl overflow-hidden cursor-pointer
          border-2 transition-all duration-200 select-none
          ${dragging
            ? "border-violet-400 bg-violet-500/10 scale-[1.02]"
            : preview
              ? "border-white/10 hover:border-white/25"
              : "border-dashed border-gray-300 hover:border-violet-400 bg-gray-50 hover:bg-violet-50/50"}
        `}>

        {/* ── Preview image ── */}
        {preview && (
          <img src={preview} alt="Poster preview"
            className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* ── Dark overlay when uploading ── */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col
                          items-center justify-center gap-3 z-10">
            {/* Circular progress */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none"
                  stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                <circle cx="32" cy="32" r="28" fill="none"
                  stroke="#a78bfa" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.3s ease" }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center
                               text-white text-xs font-bold">
                {progress}%
              </span>
            </div>
            <p className="text-white text-xs font-medium">Uploading…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!preview && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
                          gap-3 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center
                            justify-center text-3xl">
              🖼️
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">
                {dragging ? "Drop image here" : "Click or drag to upload"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG · PNG · WebP · GIF &nbsp;·&nbsp; Max {MAX_MB} MB
              </p>
            </div>
            <span className="px-4 py-1.5 bg-violet-600 text-white text-xs
                             font-semibold rounded-full hover:bg-violet-700 transition">
              Browse Files
            </span>
          </div>
        )}

        {/* ── Clear button (shown over preview when not uploading) ── */}
        {preview && !uploading && (
          <button onClick={clear}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full
                       bg-black/60 hover:bg-black/80 text-white text-xs
                       flex items-center justify-center transition backdrop-blur-sm
                       border border-white/20">
            ✕
          </button>
        )}

        {/* ── Replace hint ── */}
        {preview && !uploading && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t
                          from-black/70 to-transparent py-3 px-3 z-10">
            <p className="text-white text-xs text-center font-medium">
              Click or drag to replace
            </p>
          </div>
        )}

        {/* ── Success tick ── */}
        {preview && !uploading && progress === 100 && (
          <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full
                          bg-green-500 flex items-center justify-center text-white text-xs">
            ✓
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200
                        text-red-600 rounded-xl px-3 py-2.5 text-xs">
          <span className="shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Accepted formats info */}
      {!preview && (
        <p className="text-xs text-gray-400 text-center">
          Accepted: <span className="font-medium">JPEG, PNG, WebP, GIF</span> · Max {MAX_MB} MB
        </p>
      )}

      {/* Hidden file input — images only */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}