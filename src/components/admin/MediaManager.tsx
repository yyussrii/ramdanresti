import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  HardDrive,
  Check,
  Sparkles,
  ExternalLink,
  User,
  Heart,
  Eye,
  X,
  Loader2,
  FolderHeart,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { ContentConfig } from '../../types';
import {
  MediaItem,
  getAllMediaItems,
  saveMediaFile,
  deleteMediaItem,
  formatBytes,
} from '../../services/mediaStorageService';
import { SmartImage } from '../common/SmartImage';

interface MediaManagerProps {
  content: ContentConfig;
  onChangeContent: (updatedContent: ContentConfig) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  content,
  onChangeContent,
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'invitation-gallery' | 'presets'>('database');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Invitation gallery manual add state
  const [newCaption, setNewCaption] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Curated Preset Wedding Photos
  const curatedStockPhotos = [
    {
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      title: 'Potret Jas Mempelai Pria',
      category: 'couple',
    },
    {
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      title: 'Potret Gaun Mempelai Wanita',
      category: 'couple',
    },
    {
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
      title: 'Tatapan Kasih Pasangan',
      category: 'hero',
    },
    {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      title: 'Malam Resepsi Elegan',
      category: 'hero',
    },
    {
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      title: 'Dekorasi Meja Bunga',
      category: 'gallery',
    },
    {
      url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
      title: 'Kebersamaan & Tawa Bahagia',
      category: 'gallery',
    },
  ];

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const items = await getAllMediaItems();
      setMediaList(items);
    } catch (e) {
      console.error('Failed to load media list:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (file) => file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      alert('Harap unggah file gambar berformat JPG, PNG, atau WEBP.');
      return;
    }

    setIsUploading(true);
    try {
      let count = 0;
      for (const file of validFiles) {
        await saveMediaFile(file, { category: 'general' });
        count++;
      }
      await loadMedia();
      triggerNotice(`${count} foto berhasil diunggah dan disimpan ke database!`);
    } catch (err) {
      console.error('Error saving media:', err);
      alert('Gagal menyimpan file ke database. Silakan coba kembali.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('Hapus foto ini secara permanen dari basis data browser?')) {
      await deleteMediaItem(id);
      await loadMedia();
      triggerNotice('Foto berhasil dihapus dari database.');
    }
  };

  // Assign to Groom Photo
  const handleSetGroomPhoto = (url: string) => {
    onChangeContent({
      ...content,
      couple: {
        ...content.couple,
        groom: {
          ...content.couple.groom,
          photoUrl: url,
          image: url,
        },
      },
    });
    triggerNotice('✓ Foto berhasil ditetapkan sebagai Foto Profil Mempelai Pria!');
  };

  // Assign to Bride Photo
  const handleSetBridePhoto = (url: string) => {
    onChangeContent({
      ...content,
      couple: {
        ...content.couple,
        bride: {
          ...content.couple.bride,
          photoUrl: url,
          image: url,
        },
      },
    });
    triggerNotice('✓ Foto berhasil ditetapkan sebagai Foto Profil Mempelai Wanita!');
  };

  // Assign to Hero / Cover
  const handleSetHeroPhoto = (url: string) => {
    onChangeContent({
      ...content,
      hero: {
        ...content.hero,
        heroImageUrl: url,
        heroImage: url,
      },
    });
    triggerNotice('✓ Foto berhasil ditetapkan sebagai Foto Sampul (Hero) Utama!');
  };

  // Add to Wedding Gallery Section
  const handleAddToInvitationGallery = (url: string, caption?: string) => {
    // Check if already in gallery
    const exists = content.gallery.images.some((img) => img.url === url);
    if (exists) {
      triggerNotice('Foto ini sudah ada di Galeri Undangan.');
      return;
    }

    onChangeContent({
      ...content,
      gallery: {
        ...content.gallery,
        images: [
          ...content.gallery.images,
          {
            url,
            caption: caption || 'Momen Bahagia',
            aspectRatio: 'portrait',
          },
        ],
      },
    });
    triggerNotice('✓ Foto berhasil ditambahkan ke Galeri Undangan Tamu!');
  };

  // Remove photo from Wedding Gallery Section
  const handleRemoveFromGallery = (index: number) => {
    const updated = content.gallery.images.filter((_, i) => i !== index);
    onChangeContent({
      ...content,
      gallery: {
        ...content.gallery,
        images: updated,
      },
    });
    triggerNotice('Foto dihapus dari Galeri Undangan.');
  };

  // Determine usage tags for each media URL
  const currentHeroUrl = content.hero.heroImageUrl || content.hero.heroImage;
  const currentGroomUrl = content.couple.groom.photoUrl || content.couple.groom.image;
  const currentBrideUrl = content.couple.bride.photoUrl || content.couple.bride.image;
  const galleryUrls = new Set(content.gallery.images.map((img) => img.url));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#242220] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#C5A059] flex items-center gap-2 text-xs animate-slide-up">
          <Check className="w-4 h-4 text-[#C5A059]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl text-[#1F1D1B] font-medium flex items-center gap-2.5">
            <span>Galeri Media &amp; Foto Database</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-sans font-medium">
              Cloud Sync Aktif
            </span>
          </h3>
          <p className="text-xs text-[#8C827A] font-light mt-1">
            Unggah foto JPG &amp; PNG. Foto otomatis dioptimasi dan disinkronkan ke Cloud Database sehingga langsung tampil di semua HP &amp; laptop tamu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-xl bg-[#242220] hover:bg-[#34302C] text-white text-xs font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
        >
          <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Upload Foto (JPG/PNG)</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
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
        className={`rounded-2xl p-8 text-center transition-all cursor-pointer border-2 border-dashed shadow-xs ${
          isDragging
            ? 'border-[#C5A059] bg-[#C5A059]/10 scale-[1.008]'
            : 'border-[#E8DFD3] bg-white hover:border-[#C5A059] hover:bg-[#FAF8F5]/50'
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
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
            <p className="text-xs font-medium text-[#1F1D1B]">
              Menyimpan foto ke database browser (IndexedDB)...
            </p>
            <p className="text-[10px] text-[#8C827A]">
              Menghasilkan thumbnail resolusi tinggi &amp; menyimpan binary Blob
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-center text-[#C5A059]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-medium text-[#1F1D1B]">
                Tarik &amp; Lepaskan Foto JPG / PNG ke Sini
              </h4>
              <p className="text-xs text-[#8C827A] font-light mt-1">
                atau <span className="text-[#C5A059] font-medium underline">klik untuk memilih file</span> dari laptop/HP Anda
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E8DFD3] text-[10px] text-[#70675F]">
                <HardDrive className="w-3 h-3 text-emerald-600" />
                <span>Penyimpanan Database Bebas Kuota (Hingga ratusan MB)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E8DFD3] text-[10px] text-[#70675F]">
                Format: .JPG, .JPEG, .PNG, .WEBP
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EFE8DC] flex gap-6 bg-transparent">
        <button
          onClick={() => setActiveTab('database')}
          className={`pb-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'database'
              ? 'border-[#C5A059] text-[#242220]'
              : 'border-transparent text-[#8C827A] hover:text-[#242220]'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Foto di Database ({mediaList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invitation-gallery')}
          className={`pb-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'invitation-gallery'
              ? 'border-[#C5A059] text-[#242220]'
              : 'border-transparent text-[#8C827A] hover:text-[#242220]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Galeri Undangan Aktif ({content.gallery.images.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`pb-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'presets'
              ? 'border-[#C5A059] text-[#242220]'
              : 'border-transparent text-[#8C827A] hover:text-[#242220]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Koleksi Foto Pilihan</span>
        </button>
      </div>

      {/* TAB 1: DATABASE MEDIA */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-[#8C827A] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
              <span className="text-xs">Memuat galeri foto dari database browser...</span>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#EFE8DC] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mx-auto text-[#C5A059]">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg text-[#1F1D1B] font-medium">
                Belum Ada Foto di Database
              </h4>
              <p className="text-xs text-[#8C827A] font-light max-w-md mx-auto">
                Silakan tarik &amp; lepas file foto JPG/PNG Anda di area kotak di atas, atau klik tombol
                "Upload Foto (JPG/PNG)".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaList.map((item) => {
                const isHero = currentHeroUrl === item.url;
                const isGroom = currentGroomUrl === item.url;
                const isBride = currentBrideUrl === item.url;
                const inGallery = galleryUrls.has(item.url);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Image Preview Box */}
                    <div className="relative aspect-4/3 bg-[#FAF8F5] overflow-hidden group">
                      <SmartImage
                        src={item.thumbnailUrl || item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {isHero && (
                          <span className="px-2 py-0.5 rounded-md bg-[#242220]/90 text-[#C5A059] text-[9px] font-semibold tracking-wider uppercase backdrop-blur-xs">
                            ★ Cover Hero
                          </span>
                        )}
                        {isGroom && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-900/90 text-blue-200 text-[9px] font-semibold tracking-wider uppercase backdrop-blur-xs">
                            Mempelai Pria
                          </span>
                        )}
                        {isBride && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-900/90 text-rose-200 text-[9px] font-semibold tracking-wider uppercase backdrop-blur-xs">
                            Mempelai Wanita
                          </span>
                        )}
                        {inGallery && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-900/90 text-emerald-200 text-[9px] font-semibold tracking-wider uppercase backdrop-blur-xs">
                            Galeri Undangan
                          </span>
                        )}
                      </div>

                      {/* Quick Overlay Action */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxImage(item.url)}
                          className="p-2 rounded-xl bg-white/90 text-[#242220] hover:bg-white text-xs font-medium flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Perbesar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-600 text-xs font-medium shadow-sm cursor-pointer"
                          title="Hapus dari database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3.5 border-b border-[#F0EAE1] bg-[#FAF8F5]/40 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-medium text-[#1F1D1B] truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#8C827A] mt-0.5">
                          {item.formattedSize} &bull; {new Date(item.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white text-[9px] text-[#70675F] border border-[#E8DFD3] shrink-0">
                        {item.type.replace('image/', '').toUpperCase()}
                      </span>
                    </div>

                    {/* Action Integration Buttons */}
                    <div className="p-3 bg-white space-y-1.5 mt-auto">
                      <p className="text-[10px] uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
                        Gunakan Foto Untuk:
                      </p>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetGroomPhoto(item.url)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                            isGroom
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-white hover:bg-[#FAF8F5] text-[#242220] border-[#E8DFD3]'
                          }`}
                        >
                          <User className="w-3 h-3 text-blue-600" />
                          <span>{isGroom ? '✓ Pria Aktif' : 'Mempelai Pria'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetBridePhoto(item.url)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                            isBride
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-white hover:bg-[#FAF8F5] text-[#242220] border-[#E8DFD3]'
                          }`}
                        >
                          <Heart className="w-3 h-3 text-rose-500" />
                          <span>{isBride ? '✓ Wanita Aktif' : 'Mempelai Wanita'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetHeroPhoto(item.url)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                            isHero
                              ? 'bg-[#FAF8F5] text-[#C5A059] border-[#C5A059] font-semibold'
                              : 'bg-white hover:bg-[#FAF8F5] text-[#242220] border-[#E8DFD3]'
                          }`}
                        >
                          <span>★ {isHero ? 'Cover Aktif' : 'Cover Hero'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToInvitationGallery(item.url, item.name)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                            inGallery
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white hover:bg-[#FAF8F5] text-[#242220] border-[#E8DFD3]'
                          }`}
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>{inGallery ? 'Ada di Galeri' : '+ Galeri'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVITATION GALLERY SECTION */}
      {activeTab === 'invitation-gallery' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                <span>Daftar Foto di Galeri Undangan ({content.gallery.images.length})</span>
              </h4>
              <p className="text-xs text-[#8C827A] font-light mt-0.5">
                Foto-foto ini ditampilkan pada bagian "Galeri Momen" di undangan tamu Anda.
              </p>
            </div>
          </div>

          {content.gallery.images.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8C827A] font-light bg-white rounded-2xl border border-[#EFE8DC]">
              Belum ada foto yang dimasukkan ke galeri undangan. Pilih foto dari tab "Foto di Database"
              lalu klik "+ Galeri".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {content.gallery.images.map((img, index) => {
                return (
                  <div
                    key={index}
                    className="group relative rounded-xl overflow-hidden border border-[#E8DFD3] bg-[#FAF8F5] shadow-xs flex flex-col"
                  >
                    <div className="h-44 relative overflow-hidden">
                      <SmartImage
                        src={img.url}
                        alt={img.caption || `Foto #${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFromGallery(index)}
                        title="Hapus dari Galeri"
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white cursor-pointer shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 bg-white border-t border-[#F0EAE1]">
                      <input
                        type="text"
                        value={img.caption || ''}
                        onChange={(e) => {
                          const updated = [...content.gallery.images];
                          updated[index] = { ...updated[index], caption: e.target.value };
                          onChangeContent({
                            ...content,
                            gallery: { ...content.gallery, images: updated },
                          });
                        }}
                        placeholder="Tulis caption foto..."
                        className="w-full text-xs text-[#242220] bg-transparent border-b border-transparent focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CURATED PRESETS */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs">
            <h4 className="text-sm font-semibold text-[#1F1D1B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>Koleksi Foto Contoh Siap Pakai</span>
            </h4>
            <p className="text-xs text-[#8C827A] font-light mt-0.5">
              Klik pada salah satu aksi di bawah kartu untuk langsung menerapkan foto pilihan ini ke website undangan Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {curatedStockPhotos.map((photo, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden border border-[#E8DFD3] group shadow-xs flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-[#FAF8F5]">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <button
                      type="button"
                      onClick={() => handleAddToInvitationGallery(photo.url, photo.title)}
                      className="px-2 py-1 bg-white text-[#242220] rounded text-[10px] font-semibold cursor-pointer"
                    >
                      + Tambah ke Galeri
                    </button>
                  </div>
                </div>
                <div className="p-2 text-[10px] text-[#70675F] truncate font-medium">
                  {photo.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl">
            <SmartImage
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
