import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Copy,
  Check,
  Share2,
  Trash2,
  Edit2,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Link2,
  Upload,
  Layers,
  X,
} from 'lucide-react';
import { Guest, GuestCategory } from '../../types';
import { dbService } from '../../services/dbService';
import { generateSlug, generateUniqueSlug, isValidSlug } from '../../utils/slugGenerator';

interface GuestManagerProps {
  guests: Guest[];
  onRefresh: () => void;
  onNavigateToSlug?: (slug: string) => void;
}

export const GuestManager: React.FC<GuestManagerProps> = ({
  guests,
  onRefresh,
  onNavigateToSlug,
}) => {
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOpenedFilter, setSelectedOpenedFilter] = useState<string>('all');

  // Add / Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Form Fields for Add / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formPhone, setFormPhone] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // UI helpers
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingGuest(null);
    setFormName('');
    setFormCategory('');
    setFormPhone('');
    setFormSlug('');
    setIsCustomSlug(false);
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormName(guest.name);
    setFormCategory(guest.category || '');
    setFormPhone(guest.phone || '');
    setFormSlug(guest.slug);
    setIsCustomSlug(true);
    setFormError('');
    setShowAddModal(true);
  };

  // Handle Name Input change with auto-slug generation
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!isCustomSlug || !editingGuest) {
      const existingSlugs = guests.map((g) => g.slug);
      const auto = generateUniqueSlug(
        val,
        existingSlugs,
        editingGuest?.slug
      );
      setFormSlug(auto);
    }
  };

  // Save or Update Guest
  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Nama tamu wajib diisi.');
      return;
    }

    const cleanSlug = (formSlug || generateSlug(cleanName)).trim().toLowerCase();
    if (!cleanSlug) {
      setFormError('Slug URL tamu tidak valid.');
      return;
    }

    // Check duplicate slug
    const existing = guests.find(
      (g) => g.slug === cleanSlug && (!editingGuest || g.id !== editingGuest.id)
    );
    if (existing) {
      setFormError(`Slug "/inv/${cleanSlug}" sudah dipakai oleh ${existing.name}. Gunakan slug lain atau biarkan sistem menambahkan angka.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGuest) {
        await dbService.updateGuest(editingGuest.id, {
          name: cleanName,
          slug: cleanSlug,
          category: formCategory.trim() || undefined,
          phone: formPhone.trim() || undefined,
          updatedAt: new Date().toISOString(),
        });
        showToast(`Data tamu "${cleanName}" berhasil diperbarui.`);
      } else {
        // Adding new guest does not include category by default
        await dbService.addGuest({
          name: cleanName,
          customSlug: cleanSlug,
          phone: formPhone.trim() || undefined,
          rsvpStatus: 'menunggu',
          guestCount: 1,
        });
        showToast(`Tamu "${cleanName}" (/inv/${cleanSlug}) berhasil ditambahkan.`);
      }
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan tamu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Guest
  const handleDeleteGuest = async (id: string, name: string) => {
    if (!window.confirm(`Hapus tamu "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      await dbService.deleteGuest(id);
      showToast(`Tamu "${name}" telah dihapus.`);
      onRefresh();
    } catch (err) {
      showToast('Gagal menghapus tamu.');
    }
  };

  // Copy Single Link
  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/inv/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    showToast(`Tautan /inv/${slug} disalin!`);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Copy All Links
  const handleCopyAllLinks = () => {
    if (guests.length === 0) {
      showToast('Belum ada data tamu untuk disalin.');
      return;
    }

    const formattedList = guests
      .map((g) => `${g.name}\n${window.location.origin}/inv/${g.slug}`)
      .join('\n\n');

    navigator.clipboard.writeText(formattedList);
    setCopiedAll(true);
    showToast(`Berhasil menyalin seluruh ${guests.length} tautan undangan tamu!`);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Share WhatsApp
  const handleShareWhatsApp = (guest: Guest) => {
    const url = `${window.location.origin}/inv/${guest.slug}`;
    const text = encodeURIComponent(
      `Halo ${guest.name},\n\nkami mengundang Anda untuk hadir dalam acara kami.\n\nUndangan:\n${url}`
    );
    const waUrl = guest.phone
      ? `https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, '_blank');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Nama Tamu',
      'Slug URL',
      'Kategori',
      'Nomor WA',
      'Tautan Undangan',
      'Status Dibuka',
      'RSVP Status',
      'Jumlah Pax',
    ];
    const rows = guests.map((g) => [
      `"${g.name}"`,
      `"${g.slug}"`,
      `"${g.category || '-'}"`,
      `"${g.phone || '-'}"`,
      `"${window.location.origin}/inv/${g.slug}"`,
      g.openedAt ? `"Sudah (${new Date(g.openedAt).toLocaleDateString('id-ID')})"` : '"Belum"',
      `"${g.rsvpStatus || 'menunggu'}"`,
      g.guestCount || 1,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `daftar_undangan_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computed preview for Bulk Import
  const parsedBulkGuests = useMemo(() => {
    if (!bulkText.trim()) return [];
    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const existingSlugs = guests.map((g) => g.slug);
    const tempSlugs = [...existingSlugs];

    return lines.map((name) => {
      const generated = generateUniqueSlug(name, tempSlugs);
      tempSlugs.push(generated);
      const isDuplicate = existingSlugs.includes(generateSlug(name));
      return {
        name,
        slug: generated,
        status: isDuplicate ? 'Suffix Ditambahkan' : 'Siap Ditambahkan',
      };
    });
  }, [bulkText, guests]);

  // Submit Bulk Import
  const handleSaveBulk = async () => {
    if (parsedBulkGuests.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      const payload = parsedBulkGuests.map((item) => ({
        name: item.name,
      }));
      await dbService.addGuestsBulk(payload);
      showToast(`${parsedBulkGuests.length} tamu berhasil diimpor dengan slug baru!`);
      setShowBulkModal(false);
      setBulkText('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengimpor daftar tamu.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Filtered list
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guest.phone && guest.phone.includes(searchQuery));

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'none' && (!guest.category || guest.category.trim() === '')) ||
      (selectedCategory === 'has_category' && !!guest.category && guest.category.trim() !== '') ||
      guest.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesOpened =
      selectedOpenedFilter === 'all' ||
      (selectedOpenedFilter === 'opened' && guest.openedAt !== null && guest.openedAt !== undefined) ||
      (selectedOpenedFilter === 'unopened' && (!guest.openedAt));

    return matchesSearch && matchesCategory && matchesOpened;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E1C1A] text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-[#3D3833] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header action controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl text-[#1F1D1B] font-medium">
            Daftar Tamu Undangan
          </h3>
          <p className="text-xs text-[#8C827A] font-light mt-0.5">
            Sistem personalisasi tamu langsung menggunakan slug nama di URL: <span className="font-mono text-[#242220]">/inv/nama-tamu</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Copy All Links */}
          <button
            onClick={handleCopyAllLinks}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D6C7B2] hover:bg-white text-xs font-medium text-[#242220] transition-colors cursor-pointer"
            title="Salin seluruh link tamu beserta namanya"
          >
            {copiedAll ? (
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <Link2 className="w-3.5 h-3.5 text-[#8C827A]" />
            )}
            <span>{copiedAll ? 'Tersalin!' : 'Copy All Links'}</span>
          </button>

          {/* Bulk Import */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D6C7B2] hover:bg-white text-xs font-medium text-[#242220] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#8C827A]" />
            <span>Bulk Import</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D6C7B2] hover:bg-white text-xs font-medium text-[#242220] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#8C827A]" />
            <span>Export CSV</span>
          </button>

          {/* Add Guest Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242220] hover:bg-[#34302C] text-xs font-medium text-white transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Tambah Tamu</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EFE8DC] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A69C92] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama tamu atau slug URL (contoh: pak-yanto)..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl text-[#3D3833] focus:outline-none focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            <option value="none">Tanpa Kategori</option>
            <option value="has_category">Dengan Kategori</option>
            <option value="keluarga">Kategori: Keluarga</option>
            <option value="sahabat">Kategori: Sahabat</option>
            <option value="rekan">Kategori: Rekan Kerja</option>
            <option value="vip">Kategori: VIP</option>
            <option value="lainnya">Kategori: Lainnya</option>
          </select>

          {/* Status Opened Filter */}
          <select
            value={selectedOpenedFilter}
            onChange={(e) => setSelectedOpenedFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl text-[#3D3833] focus:outline-none focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="opened">Sudah Buka</option>
            <option value="unopened">Belum Buka</option>
          </select>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EFE8DC] text-[#8C827A] uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Nama Tamu</th>
                <th className="py-3.5 px-3 font-semibold">Slug Undangan</th>
                <th className="py-3.5 px-3 font-semibold">Kategori</th>
                <th className="py-3.5 px-3 font-semibold">Status Buka</th>
                <th className="py-3.5 px-3 font-semibold">RSVP</th>
                <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFE6]">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8C827A]">
                    Tidak ada tamu yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const isCopied = copiedSlug === guest.slug;
                  return (
                    <tr key={guest.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4 font-medium text-[#1F1D1B]">
                        <div>
                          <span>{guest.name}</span>
                          {guest.phone && (
                            <span className="block text-[11px] text-[#8C827A] font-normal">
                              {guest.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Slug Badge */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#D6C7B2] font-mono text-[11px] font-medium text-[#1F1D1B]">
                          /inv/{guest.slug}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-[#70675F]">
                        {guest.category && guest.category.trim() !== '' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFE8DC]/60 text-[#70675F] capitalize">
                            {guest.category.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-[#A69C92] font-light text-[11px]">&mdash;</span>
                        )}
                      </td>

                      {/* Opened Status */}
                      <td className="py-3.5 px-3">
                        {guest.openedAt ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#10B981] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dibuka</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#8C827A] font-normal">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Belum</span>
                          </span>
                        )}
                      </td>

                      {/* RSVP Status */}
                      <td className="py-3.5 px-3">
                        {guest.rsvpStatus === 'hadir' || guest.rsvpStatus === 'attending' ? (
                          <span className="text-[11px] text-[#10B981] font-medium">
                            Hadir ({guest.guestCount || 1}pax)
                          </span>
                        ) : guest.rsvpStatus === 'tidak_hadir' || guest.rsvpStatus === 'declined' ? (
                          <span className="text-[11px] text-[#EF4444] font-normal">
                            Tidak Hadir
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8C827A] italic">
                            Menunggu
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(guest.slug)}
                            title="Salin Tautan Undangan"
                            className="p-1.5 rounded-lg text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-[#10B981]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Share WhatsApp */}
                          <button
                            onClick={() => handleShareWhatsApp(guest)}
                            title="Kirim ke WhatsApp"
                            className="p-1.5 rounded-lg text-[#10B981] hover:bg-[#10B981]/10 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Preview as guest */}
                          <button
                            onClick={() => {
                              if (onNavigateToSlug) {
                                onNavigateToSlug(guest.slug);
                              } else {
                                window.open(`/inv/${guest.slug}`, '_blank');
                              }
                            }}
                            title="Buka Undangan Tamu Ini"
                            className="p-1.5 rounded-lg text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(guest)}
                            title="Edit Data Tamu"
                            className="p-1.5 rounded-lg text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteGuest(guest.id, guest.name)}
                            title="Hapus Tamu"
                            className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#EFE8DC] animate-in fade-in zoom-in-95">
            <h3 className="font-serif text-xl font-normal text-[#1F1D1B] mb-1">
              {editingGuest ? 'Edit Tamu Undangan' : 'Tambah Tamu Baru'}
            </h3>
            <p className="text-xs text-[#8C827A] mb-5 font-light">
              Undangan akan dapat diakses secara langsung via slug URL.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#DC2626]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#3D3833] mb-1">
                  Nama Tamu / Pasangan / Keluarga <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contoh: Pak Yanto, Bpk. Bambang & Ibu"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3D3833] mb-1">
                  Slug URL Undangan <span className="text-[#EF4444]">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 text-xs font-mono bg-[#EFE8DC]/50 border border-r-0 border-[#E8DFD3] rounded-l-xl text-[#70675F]">
                    /inv/
                  </span>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => {
                      setIsCustomSlug(true);
                      setFormSlug(generateSlug(e.target.value));
                    }}
                    placeholder="pak-yanto"
                    className="flex-1 px-3 py-2.5 text-xs font-mono bg-[#FAF8F5] border border-[#E8DFD3] rounded-r-xl focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <p className="text-[10px] text-[#8C827A] mt-1">
                  Tautan lengkap:{' '}
                  <span className="font-mono text-[#1F1D1B]">
                    {window.location.origin}/inv/{formSlug || 'nama-tamu'}
                  </span>
                </p>
              </div>

              {/* Category Field: Only visible when editing a guest */}
              {editingGuest && (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DFD3]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#3D3833]">
                      Kategori Tamu (Opsional)
                    </label>
                    {formCategory && (
                      <button
                        type="button"
                        onClick={() => setFormCategory('')}
                        className="text-[10px] text-[#A69C92] hover:text-[#EF4444] transition-colors cursor-pointer"
                      >
                        Hapus Kategori
                      </button>
                    )}
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="">-- Tanpa Kategori (Jangan Munculkan) --</option>
                    <option value="keluarga">Keluarga</option>
                    <option value="sahabat">Sahabat</option>
                    <option value="rekan">Rekan Kerja</option>
                    <option value="vip">VIP</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                  <p className="text-[10px] text-[#8C827A] mt-1.5 leading-normal">
                    Pilih kategori hanya jika ingin menampilkan label khusus pada undangan tamu ini. Jika dibiarkan &quot;Tanpa Kategori&quot;, label tidak akan dimunculkan di website undangan.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#3D3833] mb-1">
                  Nomor WhatsApp (Opsional, untuk link direct WA)
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE8DC]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D6C7B2] text-xs text-[#70675F] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#242220] hover:bg-[#34302C] text-xs font-medium text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingGuest ? 'Simpan Perubahan' : 'Tambah Tamu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-[#EFE8DC] animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-xl font-normal text-[#1F1D1B]">
                Bulk Import Tamu
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 rounded-lg text-[#8C827A] hover:text-[#1F1D1B] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#8C827A] mb-4 font-light">
              Masukkan satu nama tamu per baris. Sistem otomatis membuat slug URL untuk setiap tamu.
            </p>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-[#3D3833] mb-1">
                  Daftar Nama Tamu (1 nama per baris)
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Aley Firmansyah\nNelly Selvatiany\nFutri Tiara\nRapi Nurdiansyah`}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059] font-mono leading-relaxed"
                />
              </div>

              {/* Preview Import Table: Nama | Slug | Status */}
              {parsedBulkGuests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[#3D3833]">
                      Preview Hasil Import ({parsedBulkGuests.length} Tamu):
                    </span>
                  </div>
                  <div className="border border-[#EFE8DC] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#FAF8F5] border-b border-[#EFE8DC] text-[#8C827A] uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Nama</th>
                          <th className="py-2 px-3 font-semibold">Slug URL</th>
                          <th className="py-2 px-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4EFE6]">
                        {parsedBulkGuests.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF8F5]/60">
                            <td className="py-2 px-3 font-medium text-[#1F1D1B]">{item.name}</td>
                            <td className="py-2 px-3 font-mono text-[#70675F]">/inv/{item.slug}</td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-[#EFE8DC]/80 text-[#70675F]">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EFE8DC] mt-4">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl border border-[#D6C7B2] text-xs text-[#70675F] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBulk}
                disabled={parsedBulkGuests.length === 0 || isBulkSubmitting}
                className="px-5 py-2 rounded-xl bg-[#242220] hover:bg-[#34302C] text-xs font-medium text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isBulkSubmitting
                  ? 'Mengimpor...'
                  : `Simpan Semua Tamu (${parsedBulkGuests.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
