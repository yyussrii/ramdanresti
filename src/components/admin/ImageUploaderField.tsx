import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Trash2,
  CheckCircle2,
  Cloud,
  Link,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  saveMediaFile,
  MediaItem,
  MediaStorageError,
  isVercelBlobUrl,
  validateMediaFile,
} from '../../services/mediaStorageService';
import type { ContentConfig } from '../../types';
import { SmartImage } from '../common/SmartImage';
import { MediaPickerModal } from './MediaPickerModal';

interface ImageUploaderFieldProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (url: string) => void;
  category?: 'couple' | 'hero' | 'gallery' | 'general';
  aspectRatio?: 'portrait' | 'square' | 'landscape' | 'wide';
  placeholderName?: string;
  authToken?: string | null;
  onAuthExpired?: (message?: string) => void;
  content?: ContentConfig;
}

export const ImageUploaderField: React.FC<ImageUploaderFieldProps> = ({
  label,
  sublabel,
  value,
  onChange,
  category = 'general',
  aspectRatio = 'portrait',
  authToken,
  onAuthExpired,
  content,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStoredInVercelBlob = isVercelBlobUrl(value);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'w-24 h-32 sm:w-28 sm:h-36';
      case 'square':
        return 'w-24 h-24 sm:w-28 sm:h-28';
      case 'landscape':
        return 'w-36 h-24 sm:w-44 sm:h-28';
      case 'wide':
        return 'w-full h-32 sm:h-40';
      default:
        return 'w-24 h-32';
    }
  };

  const handleProcessFile = async (file: File) => {
    setUploadError(null);
    try {
      validateMediaFile(file);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Format atau ukuran foto tidak valid (JPG, JPEG, PNG, WebP maks. 5 MB).'
      );
      return;
    }

    if (!authToken) {
      setUploadError('Sesi admin tidak ditemukan. Silakan masuk ulang untuk mengunggah foto.');
      onAuthExpired?.('Sesi admin dibutuhkan untuk mengunggah foto.');
      return;
    }

    setIsUploading(true);
    try {
      const mediaItem: MediaItem = await saveMediaFile(file, {
        authToken,
        category,
        name: file.name,
      });
      onChange(mediaItem.url);

      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.error('Failed to upload image to Vercel Blob:', err);
      if (err instanceof MediaStorageError && err.code === 'UNAUTHORIZED') {
        onAuthExpired?.(err.message);
      }
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah foto ke Vercel Blob. Silakan coba kembali.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {/* Label Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-semibold text-[#1F1D1B]">{label}</label>
          {sublabel && <p className="text-[11px] text-[#8C827A] font-light">{sublabel}</p>}
        </div>

        {isStoredInVercelBlob && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200/60 shrink-0">
            <Cloud className="w-3 h-3 text-emerald-600" />
            <span>Tersimpan Permanen (Vercel Blob)</span>
          </span>
        )}
      </div>

      {/* Main Upload / Preview Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative p-3.5 rounded-xl border-2 transition-all bg-white ${
          isDragging
            ? 'border-[#C5A059] bg-[#C5A059]/5 scale-[1.008]'
            : 'border-[#E8DFD3] hover:border-[#D6C7B2]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#C5A059]" />
            <span className="text-xs font-medium text-[#1F1D1B]">
              Mengunggah foto ke Vercel Blob &amp; menyinkronkan ke Firestore...
            </span>
            <span className="text-[10px] text-[#8C827A]">
              Foto akan langsung tersedia permanen untuk seluruh tamu tanpa deploy ulang
            </span>
          </div>
        ) : value ? (
          /* Has Image State */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div
              className={`relative shrink-0 rounded-xl overflow-hidden border border-[#D6C7B2] shadow-xs bg-[#FAF8F5] ${getAspectClass()}`}
            >
              <SmartImage
                src={value}
                alt={label}
                className="w-full h-full object-cover"
                fallbackSrc="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
              />
            </div>

            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#242220] hover:bg-[#34302C] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Ganti / Upload Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFE8DC] border border-[#E8DFD3] text-[#242220] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Pilih dari Galeri Media</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-[#8C827A] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer ml-auto"
                  title="Lepaskan Foto dari Bagian Ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-[#70675F] leading-snug">
                {isStoredInVercelBlob ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                    Foto tersimpan permanen di Vercel Blob CDN. Langsung tampil di semua perangkat &amp; browser.
                  </span>
                ) : (
                  <span>
                    Tarik &amp; lepas foto JPG/JPEG/PNG/WebP (maks. 5 MB) ke kotak ini untuk menggantinya.
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          /* Empty / Upload State */
          <div className="py-4 px-2 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-center text-[#C5A059]">
                <ImageIcon className="w-6 h-6" />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#1F1D1B]">
                Tarik &amp; Lepaskan Foto ke Sini
              </p>
              <p className="text-[11px] text-[#8C827A] mt-0.5 font-light">
                Format: JPG, JPEG, PNG, WebP &bull; Maksimal 5 MB &bull; Disimpan permanen di Vercel Blob
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-[#242220] hover:bg-[#34302C] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Unggah Foto</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFE8DC] border border-[#E8DFD3] text-[#242220] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Pilih dari Galeri Media</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-medium shadow-md animate-fade-in flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Tersimpan permanen di Vercel Blob!</span>
          </div>
        )}
      </div>

      {/* Inline Upload Error Banner */}
      {uploadError && (
        <div
          role="alert"
          className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {uploadError}
          </span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Optional URL Toggle */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-[#8C827A] hover:text-[#C5A059] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Link className="w-3 h-3" />
          <span>Atau gunakan URL gambar eksternal</span>
          {showUrlInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showUrlInput && (
          <div className="mt-2 animate-fade-in">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        )}
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectImage={(url) => onChange(url)}
        currentSelectedUrl={value}
        title={`Pilih ${label}`}
        category={category}
        authToken={authToken}
        onAuthExpired={onAuthExpired}
        content={content}
      />
    </div>
  );
};
