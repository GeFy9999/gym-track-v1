import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Trash2, X } from "lucide-react";
import { API_URL } from "../lib/api";

type PhotoMeta = {
  id: string;
  data: string;
  note: string | null;
  createdAt: string;
};

function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProgressPhotosPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<PhotoMeta | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`${API_URL}/progress-photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPhotos(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await compressImage(file);
      const res = await fetch(`${API_URL}/progress-photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });
      if (res.ok) {
        fetchPhotos();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/progress-photos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPhotos(photos.filter((p) => p.id !== id));
      setViewPhoto(null);
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-28">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center active:bg-gray-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-[26px] font-black text-gray-900 leading-tight">
            Progression
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Suis ton évolution physique en photos
          </p>
        </div>
      </div>

      {/* Upload button */}
      <div className="px-5 mb-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Camera size={18} />
          {uploading ? "Envoi en cours..." : "Ajouter une photo"}
        </button>
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="px-5">
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      ) : photos.length === 0 ? (
        <div className="px-5 text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Camera size={24} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">Aucune photo pour le moment</p>
          <p className="text-xs text-gray-300 mt-1">
            Prends une photo pour commencer à suivre ta progression
          </p>
        </div>
      ) : (
        <div className="px-5">
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setViewPhoto(photo)}
                className="relative aspect-square bg-gray-200 rounded-xl overflow-hidden active:scale-[0.97] transition-transform"
              >
                <img
                  src={photo.data}
                  alt="Progression"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1">
                  <p className="text-[10px] text-white font-medium truncate">
                    {formatDate(photo.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View photo modal */}
      {viewPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <button
              onClick={() => {
                setViewPhoto(null);
                setDeleteConfirm(null);
              }}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>
            <p className="text-sm text-white/70 font-medium">
              {formatDate(viewPhoto.createdAt)}
            </p>
            <button
              onClick={() => setDeleteConfirm(viewPhoto.id)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <img
              src={viewPhoto.data}
              alt="Progression"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Delete confirmation */}
          {deleteConfirm && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-60 px-6 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
                <p className="text-base font-bold text-gray-900 text-center mb-2">
                  Supprimer cette photo ?
                </p>
                <p className="text-sm text-gray-400 text-center mb-6">
                  Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
