import React from 'react';
import {
  Users,
  Eye,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ArrowRight,
  FileText,
  Layers,
  Music,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { Guest, Invitation } from '../../types';
import { AdminTab } from './AdminSidebar';
import { dbService } from '../../services/dbService';

interface DashboardOverviewProps {
  invitation: Invitation;
  guests: Guest[];
  onNavigateTab: (tab: AdminTab) => void;
  onPublish: () => void;
  onOpenLiveSite: () => void;
  isPublishing: boolean;
  hasUnpublishedChanges: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  invitation,
  guests,
  onNavigateTab,
  onPublish,
  onOpenLiveSite,
  isPublishing,
  hasUnpublishedChanges,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const [wishesCount, setWishesCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    dbService
      .getWishes()
      .then((w) => setWishesCount(w.length))
      .catch(() => setWishesCount(0));
  }, []);

  // Statistics calculations
  const totalGuests = guests.length;
  const openedCount = guests.filter((g) => g.openedAt !== null).length;
  const openRate = totalGuests > 0 ? Math.round((openedCount / totalGuests) * 100) : 0;
  const attendingCount = guests.filter((g) => g.rsvpStatus === 'attending').length;
  const totalPax = guests
    .filter((g) => g.rsvpStatus === 'attending')
    .reduce((sum, g) => sum + (g.paxCount || 1), 0);

  const sampleGuest = guests[0];
  const sampleUrl = sampleGuest
    ? `${window.location.origin}/inv/${sampleGuest.slug}`
    : window.location.origin;

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Live Sync Banner */}
      {hasUnpublishedChanges && (
        <div className="bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center text-[#D97706] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#92400E]">
                Ada Perubahan Draft yang Belum Dipublikasikan
              </h4>
              <p className="text-xs text-[#B45309] font-light mt-0.5">
                Perubahan pada teks, warna, atau layout tersimpan sebagai draft. Publikasikan agar dapat dilihat tamu undangan.
              </p>
            </div>
          </div>
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Mempublikasi...' : 'Publikasi Sekarang'}</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tamu */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs hover:border-[#D6C7B2] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium">
              Total Tamu
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#70675F]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-[#242220]">
              {totalGuests}
            </span>
            <span className="text-xs text-[#8C827A]">orang</span>
          </div>
          <p className="text-[11px] text-[#A69C92] mt-2 font-light">
            Memiliki kode akses unik
          </p>
        </div>

        {/* Card 2: Tingkat Pembukaan */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs hover:border-[#D6C7B2] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium">
              Tamu Membuka
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#70675F]">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-[#242220]">
              {openedCount}
            </span>
            <span className="text-xs text-[#10B981] font-medium">({openRate}%)</span>
          </div>
          <p className="text-[11px] text-[#A69C92] mt-2 font-light">
            Telah membuka amplop
          </p>
        </div>

        {/* Card 3: Konfirmasi Hadir */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs hover:border-[#D6C7B2] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium">
              Konfirmasi Hadir
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#70675F]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-[#242220]">
              {attendingCount}
            </span>
            <span className="text-xs text-[#8C827A]">({totalPax} pax)</span>
          </div>
          <p className="text-[11px] text-[#A69C92] mt-2 font-light">
            Terkonfirmasi via form RSVP
          </p>
        </div>

        {/* Card 4: Komentar Masuk */}
        <div
          onClick={() => onNavigateTab('komentar')}
          className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs hover:border-[#D6C7B2] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium">
              Komentar Masuk
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] group-hover:bg-[#FAF5EB] flex items-center justify-center text-[#70675F] group-hover:text-[#C5A059] transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-[#242220]">
              {wishesCount !== null ? wishesCount : '...'}
            </span>
            <span className="text-xs text-[#8C827A]">doa</span>
          </div>
          <p className="text-[11px] text-[#A69C92] mt-2 font-light group-hover:text-[#C5A059] transition-colors">
            Kelola &amp; hapus komentar &rarr;
          </p>
        </div>
      </div>

      {/* Main Wedding Overview & Sample Link */}
      <div className="bg-white rounded-2xl p-6 border border-[#EFE8DC] shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#EFE8DC]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C827A] font-medium block mb-1">
              Undangan Pernikahan Aktif
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#1F1D1B] font-normal">
              {invitation.brideName || 'Resti'} &amp; {invitation.groomName || 'Ramdan'}
            </h3>
            <p className="text-xs text-[#70675F] mt-1 font-light">
              Acara Akad &amp; Resepsi &bull; {invitation.eventDateFormatted || 'Sabtu, 24 Oktober 2026'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={onOpenLiveSite}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D6C7B2] hover:bg-[#FAF8F5] text-xs font-medium text-[#242220] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#8C827A]" />
              <span>Buka Halaman Tamu</span>
            </button>
            <button
              onClick={() => onNavigateTab('tamu')}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242220] hover:bg-[#34302C] text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Kelola Daftar Tamu</span>
            </button>
          </div>
        </div>

        {/* Sample URL copy box */}
        <div className="mt-5 p-4 rounded-xl bg-[#FAF8F5] border border-[#EFE8DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-[#8C827A] font-medium block">
              Contoh Tautan Undangan (Personal):
            </span>
            <code className="text-xs text-[#1F1D1B] font-mono truncate block mt-0.5">
              {sampleUrl}
            </code>
          </div>
          <button
            onClick={handleCopySample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D6C7B2] hover:border-[#1F1D1B] text-xs text-[#242220] font-medium transition-colors cursor-pointer shrink-0"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#8C827A]" />}
            <span>{isCopied ? 'Tersalin!' : 'Salin URL'}</span>
          </button>
        </div>
      </div>

      {/* Quick Visual Editor Jump Cards */}
      <div>
        <h4 className="font-serif text-lg text-[#1F1D1B] font-medium mb-3">
          Kustomisasi Undangan Tanpa Kode
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Box 1: Konten */}
          <div
            onClick={() => onNavigateTab('konten')}
            className="p-5 rounded-2xl bg-white border border-[#EFE8DC] hover:border-[#C5A059] transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] group-hover:bg-[#C5A059]/15 flex items-center justify-center text-[#70675F] group-hover:text-[#C5A059] transition-colors mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-semibold text-[#1F1D1B] group-hover:text-[#C5A059] transition-colors flex items-center justify-between">
              <span>Editor Konten</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h5>
            <p className="text-xs text-[#8C827A] font-light mt-1">
              Ubah teks nama mempelai, tanggal akad, lokasi maps, kisah cinta, dan rekening.
            </p>
          </div>

          {/* Box 2: Komentar */}
          <div
            onClick={() => onNavigateTab('komentar')}
            className="p-5 rounded-2xl bg-white border border-[#EFE8DC] hover:border-[#C5A059] transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] group-hover:bg-[#C5A059]/15 flex items-center justify-center text-[#70675F] group-hover:text-[#C5A059] transition-colors mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-semibold text-[#1F1D1B] group-hover:text-[#C5A059] transition-colors flex items-center justify-between">
              <span>Kontrol Komentar</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h5>
            <p className="text-xs text-[#8C827A] font-light mt-1">
              Kelola, moderasi, dan hapus pesan doa &amp; ucapan yang masuk dari para tamu undangan.
            </p>
          </div>

          {/* Box 3: Layout */}
          <div
            onClick={() => onNavigateTab('layout')}
            className="p-5 rounded-2xl bg-white border border-[#EFE8DC] hover:border-[#C5A059] transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] group-hover:bg-[#C5A059]/15 flex items-center justify-center text-[#70675F] group-hover:text-[#C5A059] transition-colors mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-semibold text-[#1F1D1B] group-hover:text-[#C5A059] transition-colors flex items-center justify-between">
              <span>Urutan &amp; Layout</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h5>
            <p className="text-xs text-[#8C827A] font-light mt-1">
              Atur urutan naik/turun setiap section dan sembunyikan section yang tidak diinginkan.
            </p>
          </div>

          {/* Box 4: Musik */}
          <div
            onClick={() => onNavigateTab('musik')}
            className="p-5 rounded-2xl bg-white border border-[#EFE8DC] hover:border-[#C5A059] transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] group-hover:bg-[#C5A059]/15 flex items-center justify-center text-[#70675F] group-hover:text-[#C5A059] transition-colors mb-3">
              <Music className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-semibold text-[#1F1D1B] group-hover:text-[#C5A059] transition-colors flex items-center justify-between">
              <span>Musik Pengiring</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h5>
            <p className="text-xs text-[#8C827A] font-light mt-1">
              Pilih alunan akustik romantis berlisensi atau masukkan URL file MP3 sendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
