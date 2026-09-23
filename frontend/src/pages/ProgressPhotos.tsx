import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Camera, Trash2, X, Crown } from "lucide-react";
import { API_URL } from "../lib/api";
import { getDateLocale } from "../i18n";
import { useIsPro } from "../hooks/useIsPro";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPro } = useIsPro();
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
    return d.toLocaleDateString(getDateLocale(), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d
      .toLocaleDateString(getDateLocale(), { day: "numeric", month: "short" })
      .toUpperCase()
      .replace(".", ".");
  };

  const formatGroupLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d
      .toLocaleDateString(getDateLocale(), {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();
  };

  const photoGroups = useMemo(() => {
    const groups = new Map<string, PhotoMeta[]>();
    for (const photo of photos) {
      const key = new Date(photo.createdAt).toDateString();
      const list = groups.get(key) ?? [];
      list.push(photo);
      groups.set(key, list);
    }
    return Array.from(groups.values());
  }, [photos]);

  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#faf6f1] pb-28">
        <div className="flex items-center gap-3 px-5 pt-8 pb-6" style={{ background: "#191714" }}>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <div>
            <h1 className="text-[26px] font-black text-white uppercase tracking-wide leading-tight">
              {t("progressPhotos.title")}
            </h1>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
              {t("progressPhotos.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mb-4">
            <Crown size={24} className="text-[#c9552c]" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">
            {t("progressPhotos.proOnly")}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {t("progressPhotos.proOnlyDesc")}
          </p>
          <button
            onClick={() => navigate("/upgrade")}
            className="bg-[#c9552c] text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
          >
            {t("upgrade.goPro")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-28">
      <div className="flex items-center gap-3 px-5 pt-8 pb-6" style={{ background: "#191714" }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-white" />
        </button>
        <div>
          <h1 className="text-[26px] font-black text-white uppercase tracking-wide leading-tight">
            {t("progressPhotos.title")}
          </h1>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
            {t("progressPhotos.subtitle")}
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">

      {/* Upload button */}
      <div className="mb-6">
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
          className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
        >
          <Camera size={18} />
          {uploading ? t("progressPhotos.uploading") : t("progressPhotos.addPhoto")}
        </button>
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-[#ece7dd] rounded-2xl" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#ece7dd] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Camera size={24} className="text-[#c9552c]" />
          </div>
          <p className="text-sm font-bold text-gray-900 uppercase">
            {t("progressPhotos.noPhotosYet")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t("progressPhotos.noPhotosDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {photoGroups.map((group) => (
            <div key={group[0].id}>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                  {formatGroupLabel(group[0].createdAt)}
                </p>
                <span className="text-[10px] font-bold text-gray-600 uppercase bg-[#ece7dd] px-2.5 py-1 rounded-full shadow-sm">
                  {t("progressPhotos.photo", { count: group.length })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {group.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setViewPhoto(photo)}
                    className="relative aspect-square bg-[#ece7dd] border-2 border-dashed border-[#d6d0c1] rounded-2xl overflow-hidden active:scale-[0.97] transition-transform shadow-sm"
                  >
                    <img
                      src={photo.data}
                      alt={t("progressPhotos.photoAlt")}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white uppercase tracking-wide bg-[#191714] px-2 py-1 rounded-full whitespace-nowrap">
                      {formatShortDate(photo.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div className="border-2 border-dashed border-gray-300 rounded-3xl p-6 text-center mt-6">
        <p className="text-sm font-black text-gray-900 uppercase tracking-wide mb-1">
          {t("progressPhotos.tipTitle")}
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          {t("progressPhotos.tipDesc")}
        </p>
      </div>

      </div>

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
              alt={t("progressPhotos.photoAlt")}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Delete confirmation */}
          {deleteConfirm && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-60 px-6 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
                <p className="text-base font-bold text-gray-900 text-center mb-2">
                  {t("progressPhotos.deletePhotoTitle")}
                </p>
                <p className="text-sm text-gray-400 text-center mb-6">
                  {t("progressPhotos.deletePhotoDesc")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
                  >
                    {t("progressPhotos.cancel")}
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
                  >
                    {t("progressPhotos.delete")}
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
