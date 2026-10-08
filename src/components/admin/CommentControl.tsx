import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Database,
  User,
  Clock,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { GuestWish, Invitation } from '../../types';
import { dbService } from '../../services/dbService';

interface CommentControlProps {
  invitation?: Invitation | null;
  onUpdateDraftConfig?: (updates: Partial<Invitation>) => void;
  showToast?: (msg: string) => void;
}

export const CommentControl: React.FC<CommentControlProps> = ({
  invitation,
  onUpdateDraftConfig,
  showToast,
}) => {
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteWish, setConfirmDeleteWish] = useState<GuestWish | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getWishes();
      setWishes(data);
    } catch (err) {
      console.error('Error fetching wishes:', err);
      if (showToast) showToast('Gagal memuat komentar dari database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteWish) return;

    setIsDeleting(true);
    const wishId = confirmDeleteWish.id;
    try {
      await dbService.deleteWish(wishId);
      setWishes(prev => prev.filter(w => w.id !== wishId));
      if (showToast) {
        showToast('Komentar berhasil dihapus dari database.');
      }
      setConfirmDeleteWish(null);
    } catch (err) {
      console.error('Error deleting wish:', err);
      if (showToast) {
        showToast('Gagal menghapus komentar.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter wishes
  const filteredWishes = wishes.filter(w => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      w.guestName.toLowerCase().includes(query) ||
      w.message.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalComments = wishes.length;
  const today = new Date().toDateString();
  const todayComments = wishes.filter(w => {
    if (!w.createdAt) return false;
    return new Date(w.createdAt).toDateString() === today;
  }).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#EFE8DC] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-semibold bg-[#FAF5EB] px-2.5 py-0.5 rounded-full border border-[#EFE8DC]">
              Moderasi Interaksi
            </span>
            <span className="text-[10px] text-[#059669] font-medium bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0] flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              Cloud Firestore
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-[#1F1D1B] font-medium">
            Kontrol &amp; Moderasi Komentar
          </h3>
          <p className="text-xs text-[#8C827A] font-light mt-1 max-w-xl">
            Kelola doa, ucapan, dan komentar yang dikirimkan oleh para tamu undangan. Setiap penghapusan komentar akan langsung menghapus data secara permanen dari Cloud Database.
          </p>
        </div>

        <button
          onClick={loadWishes}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#D6C7B2] text-xs font-medium text-[#242220] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C5A059]' : 'text-[#8C827A]'}`} />
          <span>{isLoading ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#EFE8DC] shadow-2xs">
          <div className="flex items-center justify-between text-[#8C827A] mb-2">
            <span className="text-xs font-medium">Total Komentar Masuk</span>
            <MessageSquare className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold text-[#1F1D1B]">
              {totalComments}
            </span>
            <span className="text-xs text-[#8C827A] font-light">ucapan</span>
          </div>
          <p className="text-[11px] text-[#A69C92] mt-1 font-light">
            Tersimpan aman di database
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#EFE8DC] shadow-2xs">
          <div className="flex items-center justify-between text-[#8C827A] mb-2">
            <span className="text-xs font-medium">Masuk Hari Ini</span>
            <Calendar className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold text-[#1F1D1B]">
              {todayComments}
            </span>
            <span className="text-xs text-[#8C827A] font-light">ucapan baru</span>
          </div>
          <p className="text-[11px] text-[#A69C92] mt-1 font-light">
            Aktivitas 24 jam terakhir
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#EFE8DC] shadow-2xs">
          <div className="flex items-center justify-between text-[#8C827A] mb-2">
            <span className="text-xs font-medium">Status Keamanan</span>
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-[#047857]">
              Otorisasi Admin Aktif
            </span>
          </div>
          <p className="text-[11px] text-[#A69C92] mt-1 font-light">
            Hanya admin yang dapat menghapus
          </p>
        </div>
      </div>

      {/* Main Comment Control Card */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] shadow-xs overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 sm:p-5 border-b border-[#EFE8DC] bg-[#FAF8F5]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#A69C92] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama tamu atau kata dalam komentar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#D6C7B2] rounded-xl text-xs text-[#1F1D1B] placeholder-[#A69C92] focus:border-[#242220] focus:ring-1 focus:ring-[#242220] outline-hidden transition-all"
            />
          </div>

          <div className="text-xs text-[#8C827A] font-light self-end sm:self-center">
            Menampilkan <span className="font-semibold text-[#1F1D1B]">{filteredWishes.length}</span> dari {totalComments} komentar
          </div>
        </div>

        {/* Comments List */}
        <div className="divide-y divide-[#EFE8DC]">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#D6C7B2] border-t-[#242220] animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#8C827A] font-light">
                Memuat daftar komentar dari database...
              </p>
            </div>
          ) : filteredWishes.length === 0 ? (
            <div className="py-16 text-center px-4">
              <MessageSquare className="w-10 h-10 text-[#D6C7B2] mx-auto mb-3 stroke-[1.5]" />
              <h4 className="text-sm font-medium text-[#1F1D1B]">
                {searchQuery ? 'Tidak ada komentar yang cocok' : 'Belum Ada Komentar Masuk'}
              </h4>
              <p className="text-xs text-[#8C827A] font-light mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Coba gunakan kata kunci pencarian yang lain.'
                  : 'Komentar dan doa dari tamu undangan di halaman landing page akan otomatis muncul di sini.'}
              </p>
            </div>
          ) : (
            filteredWishes.map((wish, index) => {
              const formattedDate = wish.createdAt
                ? new Date(wish.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Baru saja';

              return (
                <div
                  key={wish.id || `wish-${index}`}
                  className="p-4 sm:p-5 hover:bg-[#FAF8F5]/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-6 h-6 rounded-full bg-[#F3EFEA] text-[#8C6D23] flex items-center justify-center text-xs font-semibold shrink-0">
                        {wish.guestName ? wish.guestName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <h4 className="text-sm font-semibold text-[#1F1D1B] truncate">
                        {wish.guestName || 'Tamu Tanpa Nama'}
                      </h4>
                      <span className="text-[11px] text-[#A69C92] font-light flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C5A059]" />
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#4A453F] font-normal leading-relaxed pl-8 sm:pl-8.5 pr-2">
                      "{wish.message}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pl-8 sm:pl-0">
                    <button
                      onClick={() => setConfirmDeleteWish(wish)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FCA5A5]/60 bg-white hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Hapus komentar ini dari database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {confirmDeleteWish && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EFE8DC] max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-lg text-[#1F1D1B] font-medium">
              Hapus Komentar Tamu?
            </h3>
            <p className="text-xs text-[#70675F] font-light mt-2 leading-relaxed">
              Anda akan menghapus komentar dari <strong className="font-semibold text-[#1F1D1B]">{confirmDeleteWish.guestName}</strong>:
            </p>

            <div className="my-3 p-3 bg-[#FAF8F5] border border-[#EFE8DC] rounded-xl text-xs text-[#524B45] italic max-h-28 overflow-y-auto">
              "{confirmDeleteWish.message}"
            </div>

            <p className="text-[11px] text-[#DC2626] font-medium">
              Tindakan ini permanen dan akan langsung terhapus dari Cloud Database serta landing page.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmDeleteWish(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-[#D6C7B2] hover:bg-[#FAF8F5] text-xs text-[#3D3833] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
