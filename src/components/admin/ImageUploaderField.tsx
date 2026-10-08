import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Trash2,
  CheckCircle2,
  HardDrive,
  Link,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { saveMediaFile, MediaItem } from '../../services/mediaStorageService';
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
}

export const ImageUploaderField: React.FC<ImageUploaderFieldProps> = ({
  label,
  sublabel,
  value,
  onChange,
  category = 'general',
  aspectRatio = 'portrait',
  placeholderName = 'Foto',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStoredInDatabase = value && (value.startsWith('idb://') || value.startsWith('indexeddb://'));

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
    if (!file.type.startsWith('image/') && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      alert('Harap pilih file gambar dengan format JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    setIsUploading(true);
    try {
      const mediaItem: MediaItem = await saveMediaFile(file, { category, name: file.name });
      onChange(mediaItem.url);

      // Flash success toast
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.error('Failed to save uploaded image:', err);
      alert('Gagal mengunggah foto ke database. Silakan coba kembali.');
    } finally {
      setIsUploading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-[#1F1D1B]">{label}</label>
          {sublabel && <p className="text-[11px] text-[#8C827A] font-light">{sublabel}</p>}
        </div>

        {isStoredInDatabase && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200/60">
            <HardDrive className="w-3 h-3 text-emerald-600" />
            <span>Tersimpan di Cloud &amp; Database</span>
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
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#C5A059]" />
            <span className="text-xs font-medium text-[#1F1D1B]">
              Mengompres &amp; Menyimpan foto ke Cloud Database...
            </span>
            <span className="text-[10px] text-[#8C827A]">Otomatis dioptimasi agar langsung tampil di semua HP &amp; perangkat tamu</span>
          </div>
        ) : value ? (
          /* Has Image State */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Image Thumbnail Preview */}
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

            {/* Actions & Info */}
            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#242220] hover:bg-[#34302C] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Upload Foto Baru</span>
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
                  title="Hapus Foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-[#70675F] leading-snug">
                {isStoredInDatabase ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                    Foto tersimpan di database lokal browser. Tidak hilang saat refresh.
                  </span>
                ) : (
                  <span>Tarik &amp; lepas file foto baru ke kotak ini untuk menggantinya langsung.</span>
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
                Tarik &amp; Lepaskan Foto JPG / PNG ke Sini
              </p>
              <p className="text-[11px] text-[#8C827A] mt-0.5 font-light">
                Format didukung: JPG, PNG, WEBP &bull; Disimpan permanen di database
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-[#242220] hover:bg-[#34302C] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Unggah JPG/PNG</span>
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
            <span>Foto berhasil disimpan ke database!</span>
          </div>
        )}
      </div>

      {/* Optional URL Toggle (subtle fallback for external links) */}
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
              placeholder="https://images.unsplash.com/..."
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
      />
    </div>
  );
};
