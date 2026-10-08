import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  Loader2,
  HardDrive,
  FolderOpen,
} from 'lucide-react';
import {
  MediaItem,
  getAllMediaItems,
  saveMediaFile,
  deleteMediaItem,
  formatBytes,
} from '../../services/mediaStorageService';
import { SmartImage } from '../common/SmartImage';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string, mediaItem?: MediaItem) => void;
  currentSelectedUrl?: string;
  title?: string;
  category?: 'couple' | 'hero' | 'gallery' | 'general';
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentSelectedUrl,
  title = 'Pilih dari Galeri Media',
  category = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'my-media' | 'upload' | 'curated'>('my-media');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Curated stock photos for inspiration
  const curatedStock = [
    {
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
      name: 'Potret Jas Mempelai Pria',
      category: 'couple',
    },
    {
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      name: 'Potret Gaun Mempelai Wanita',
      category: 'couple',
    },
    {
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
      name: 'Tatapan Kasih Pasangan',
      category: 'hero',
    },
    {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      name: 'Malam Resepsi Elegan',
      category: 'hero',
    },
    {
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      name: 'Dekorasi Meja Bunga',
      category: 'gallery',
    },
    {
      url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
      name: 'Kebersamaan & Tawa',
      category: 'gallery',
    },
  ];

  const loadMedia = async () => {
    setLoading(true);
    try {
      const items = await getAllMediaItems();
      setMediaList(items);
    } catch (e) {
      console.error('Failed to load media items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      alert('Harap unggah file foto dengan format JPG, PNG, atau WEBP.');
      return;
    }

    setIsUploading(true);
    try {
      let lastItem: MediaItem | null = null;
      for (const file of validFiles) {
        const item = await saveMediaFile(file, { category });
        lastItem = item;
      }
      await loadMedia();
      setActiveTab('my-media');

      // If user uploaded a single image, automatically select it!
      if (validFiles.length === 1 && lastItem) {
        onSelectImage(lastItem.url, lastItem);
        onClose();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Gagal mengunggah foto ke database. Silakan coba kembali.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Hapus foto ini dari basis data database browser?')) {
      await deleteMediaItem(id);
      await loadMedia();
    }
  };

  const filteredMedia = mediaList.filter((item) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#EFE8DC] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EFE8DC] flex items-center justify-between bg-[#FAF8F5]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#242220] flex items-center justify-center text-[#C5A059]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#1F1D1B] font-medium">{title}</h3>
              <p className="text-[11px] text-[#8C827A]">
                Penyimpanan foto aman di database browser (IndexedDB) &bull; {mediaList.length} Foto Tersimpan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1F1D1B] hover:bg-[#EFE8DC]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-[#EFE8DC] flex gap-6 bg-white">
          <button
            onClick={() => setActiveTab('my-media')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'my-media'
                ? 'border-[#C5A059] text-[#242220]'
                : 'border-transparent text-[#8C827A] hover:text-[#242220]'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Koleksi Foto Saya ({mediaList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#C5A059] text-[#242220]'
                : 'border-transparent text-[#8C827A] hover:text-[#242220]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Baru (Drag &amp; Drop)</span>
          </button>

          <button
            onClick={() => setActiveTab('curated')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'curated'
                ? 'border-[#C5A059] text-[#242220]'
                : 'border-transparent text-[#8C827A] hover:text-[#242220]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Foto Pilihan Siap Pakai</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF8F5]/40">
          {/* TAB 1: MY MEDIA */}
          {activeTab === 'my-media' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Cari foto berdasarkan nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-white border border-[#E8DFD3] rounded-xl w-full max-w-xs focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-3.5 py-2 rounded-xl bg-[#242220] hover:bg-[#34302C] text-xs font-medium text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Unggah Foto Baru</span>
                </button>
              </div>

              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center text-[#8C827A] gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
                  <span className="text-xs">Memuat galeri media dari database...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-[#E8DFD3] rounded-2xl bg-white p-8">
                  <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mx-auto mb-3 text-[#C5A059]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-serif font-medium text-[#1F1D1B] mb-1">
                    Belum Ada Foto Tersimpan di Database
                  </h4>
                  <p className="text-xs text-[#8C827A] font-light max-w-md mx-auto mb-5">
                    Unggah foto mempelai atau dokumentasi pernikahan Anda sekarang. Foto akan disimpan
                    secara permanen di database lokal peramban.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-[#C5A059] hover:bg-[#B8934C] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    Unggah Foto Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {filteredMedia.map((item) => {
                    const isSelected = currentSelectedUrl === item.url;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectImage(item.url, item);
                          onClose();
                        }}
                        className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all bg-white shadow-xs hover:shadow-md ${
                          isSelected
                            ? 'border-[#C5A059] ring-2 ring-[#C5A059]/40'
                            : 'border-[#E8DFD3] hover:border-[#C5A059]'
                        }`}
                      >
                        <div className="aspect-square relative overflow-hidden bg-[#FAF8F5]">
                          <SmartImage
                            src={item.thumbnailUrl || item.url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C5A059] text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="px-2.5 py-1 bg-white text-[#242220] rounded-lg text-[10px] font-semibold">
                              Pilih Foto Ini
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(e, item.id)}
                              title="Hapus dari database"
                              className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-2 border-t border-[#F0EAE1]">
                          <p className="text-[11px] font-medium text-[#1F1D1B] truncate">{item.name}</p>
                          <div className="flex items-center justify-between text-[9px] text-[#8C827A] mt-0.5">
                            <span>{item.formattedSize}</span>
                            <span className="text-[#C5A059] font-medium">Tersimpan</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD (DRAG & DROP) */}
          {activeTab === 'upload' && (
            <div className="max-w-xl mx-auto py-6 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#C5A059] bg-[#C5A059]/10 scale-[1.01]'
                    : 'border-[#D6C7B2] bg-white hover:border-[#C5A059] hover:bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) handleFileUpload(e.target.files);
                  }}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
                    <p className="text-xs font-medium text-[#1F1D1B]">
                      Menyimpan foto ke database browser (IndexedDB)...
                    </p>
                    <p className="text-[10px] text-[#8C827A]">
                      Mohon tunggu sebentar, file sedang diproses
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-center text-[#C5A059]">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-serif font-medium text-[#1F1D1B]">
                        Tarik &amp; Lepaskan Foto JPG / PNG ke Sini
                      </p>
                      <p className="text-xs text-[#8C827A] mt-1 font-light">
                        atau <span className="text-[#C5A059] font-medium underline">klik untuk mencari file</span> dari komputer/HP Anda
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E8DFD3] text-[10px] text-[#70675F] mt-2">
                      <HardDrive className="w-3 h-3 text-[#C5A059]" />
                      <span>Format: JPG, PNG, WEBP &bull; Disimpan Permanen di Database</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CURATED STOCK */}
          {activeTab === 'curated' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-[#E8DFD3]">
                <p className="text-xs text-[#70675F] font-light leading-relaxed">
                  Gunakan foto pilihan berkualitas tinggi berikut sebagai foto contoh, cover hero, atau
                  foto mempelai sementara sebelum foto asli siap diunggah.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {curatedStock.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onSelectImage(photo.url);
                      onClose();
                    }}
                    className="group relative rounded-xl overflow-hidden border border-[#E8DFD3] hover:border-[#C5A059] bg-white cursor-pointer transition-all shadow-xs"
                  >
                    <div className="aspect-square overflow-hidden bg-[#FAF8F5]">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2 border-t border-[#F0EAE1] flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#1F1D1B] truncate">
                        {photo.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#C5A059] font-semibold">
                        Pilih
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#EFE8DC] bg-[#FAF8F5]/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#8C827A]">
            💡 Foto yang diunggah disimpan di database lokal dan dapat digunakan di semua bagian website.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#EFE8DC]/50 border border-[#E8DFD3] text-[#242220] font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
