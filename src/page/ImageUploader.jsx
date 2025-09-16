// ImageUploader.jsx
import { useEffect, useState } from "react";

export default function ImageUploader({
  apiBase = import.meta.env.VITE_API_BASE,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [lastUploadedUrl, setLastUploadedUrl] = useState("");

  // Load images on mount
  const loadImages = async () => {
    try {
      setError("");
      const res = await fetch(`${apiBase}/images-list`);
      if (!res.ok) throw new Error("Failed to load images");
      const data = await res.json();
      setImages(data);
    } catch (e) {
      setError(e.message || "Failed to load images");
    }
  };

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setLastUploadedUrl("");
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("");
    }
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose an image first");
      return;
    }
    setUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("image", file); // field name MUST be 'image' to match your API

      const res = await fetch(`${apiBase}/upload`, {
        method: "POST",
        body: form,
        // Note: DON'T set Content-Type when using FormData; the browser will set the boundary.
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Upload failed");
      }

      const data = await res.json();
      setLastUploadedUrl(data.url);
      setFile(null);
      setPreview("");
      await loadImages();
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-3">Image Uploader</h2>

      <form onSubmit={onUpload} className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="block w-full text-sm"
          />
          <button
            type="submit"
            disabled={uploading}
            className={`px-4 py-2 rounded text-white ${
              uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {preview && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">Preview:</p>
            <img
              src={preview}
              alt="preview"
              className="max-h-40 rounded border object-contain"
            />
          </div>
        )}

        {lastUploadedUrl && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Uploaded:</span>{" "}
            <a
              href={lastUploadedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline break-all"
            >
              {lastUploadedUrl}
            </a>
          </div>
        )}

        {error && <div className="text-sm text-red-600 mt-1">⚠️ {error}</div>}
      </form>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">All Images</h3>
          <button
            onClick={loadImages}
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {images.length === 0 ? (
          <p className="text-sm text-gray-600">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => (
              <a
                key={img.filename}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="block group"
                title={img.filename}
              >
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-36 object-cover rounded border group-hover:opacity-90"
                />
                <div className="mt-1 text-xs text-gray-700 break-all">
                  {img.filename}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
