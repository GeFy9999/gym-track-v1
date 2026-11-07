import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Camera, Trash2, X, Crown, Pencil } from "lucide-react";
import { API_URL } from "../lib/api";
import { getDateLocale } from "../i18n";
import { useIsPro } from "../hooks/useIsPro";
import { offlineAwareFetch } from "../lib/offlineFetch";
import { onSyncQueueChange } from "../lib/syncQueue";

// Same limit as the backend (progressPhotoController NOTE_MAX_LENGTH).
const NOTE_MAX_LENGTH = 300;

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
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

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

  // Once queued photo uploads finish syncing, refetch so their temporary
  // (offline) ids get replaced by the server's real ones.
  useEffect(() => {
    return onSyncQueueChange((pending) => {
      if (pending === 0) fetchPhotos();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await compressImage(file);
      const tempId = `temp-${crypto.randomUUID()}`;
      const result = await offlineAwareFetch(
        "POST",
        "/progress-photos",
        { data },
        "Photo de progression",
        { localId: tempId },
      );
      if (result.queued) {
        setPhotos((prev) => [
          {
            id: tempId,
            data,
            note: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else if (result.response.ok) {
        fetchPhotos();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openPhoto = (photo: PhotoMeta) => {
    setViewPhoto(photo);
    setEditingNote(false);
  };

  const closePhoto = () => {
    setViewPhoto(null);
    setDeleteConfirm(null);
    setEditingNote(false);
  };

  const startEditingNote = () => {
    setNoteDraft(viewPhoto?.note ?? "");
    setEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!viewPhoto) return;
    const id = viewPhoto.id;
    const note = noteDraft.trim() || null;
    setEditingNote(false);
    if (note === viewPhoto.note) return;

    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)));
    setViewPhoto((prev) => (prev && prev.id === id ? { ...prev, note } : prev));

    // A photo added offline: queued behind its upload, like a delete.
    try {
      await offlineAwareFetch(
        "PATCH",
        `/progress-photos/${id}`,
        { note },
        "Note de photo",
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
    setViewPhoto(null);
    setDeleteConfirm(null);

    // A photo added offline: the delete is queued behind its upload (which
    // gives it its real id) — otherwise the upload would bring it back.
    try {
      await offlineAwareFetch(
        "DELETE",
        `/progress-photos/${id}`,
        undefined,
        "Suppression photo",
      );
    } catch (err) {
      console.error(err);
    }
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
        <div className="flex items-center gap-3 px-page pt-8 pb-6" style={{ background: "#191714" }}>
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
      <div className="flex items-center gap-3 px-page pt-8 pb-6" style={{ background: "#191714" }}>
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

      <div className="px-page pt-5">

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
                    onClick={() => openPhoto(photo)}
                    className="flex flex-col text-left active:scale-[0.97] transition-transform"
                  >
                    <div className="w-full aspect-square bg-[#ece7dd] border-2 border-dashed border-[#d6d0c1] rounded-2xl overflow-hidden shadow-sm">
                      <img
                        src={photo.data}
                        alt={t("progressPhotos.photoAlt")}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="mt-1.5 px-0.5 text-[10px] font-bold text-gray-900 uppercase tracking-wide">
                      {formatShortDate(photo.createdAt)}
                    </span>
                    {photo.note && (
                      <span className="px-0.5 text-[11px] leading-snug text-gray-500 line-clamp-2 break-words">
                        {photo.note}
                      </span>
                    )}
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
              onClick={closePhoto}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>
            <button
              onClick={() => setDeleteConfirm(viewPhoto.id)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center px-4">
            <img
              src={viewPhoto.data}
              alt={t("progressPhotos.photoAlt")}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Date + note */}
          <div className="px-5 pt-4 pb-8">
            <p className="text-xs font-bold text-white uppercase tracking-widest mb-2">
              {formatGroupLabel(viewPhoto.createdAt)}
            </p>
            {editingNote ? (
              <div>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  maxLength={NOTE_MAX_LENGTH}
                  rows={3}
                  autoFocus
                  placeholder={t("progressPhotos.notePlaceholder")}
                  className="w-full bg-white/10 text-white text-sm rounded-xl px-3 py-2.5 placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#c9552c] resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-white/40">
                    {noteDraft.length}/{NOTE_MAX_LENGTH}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingNote(false)}
                      className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold uppercase"
                    >
                      {t("progressPhotos.cancel")}
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-2 rounded-full bg-[#c9552c] text-white text-xs font-bold uppercase"
                    >
                      {t("progressPhotos.saveNote")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={startEditingNote}
                className="w-full flex items-start gap-2 text-left"
              >
                <p
                  className={`flex-1 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    viewPhoto.note ? "text-white/90" : "text-white/40 italic"
                  }`}
                >
                  {viewPhoto.note ?? t("progressPhotos.addNote")}
                </p>
                <Pencil size={14} className="text-white/60 mt-1 flex-shrink-0" />
              </button>
            )}
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
