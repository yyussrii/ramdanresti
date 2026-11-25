import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
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
  Link2,
  Upload,
  Layers,
  X,
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Tag,
  ArrowUpDown,
  Eye,
  CheckSquare,
  Square,
  List,
} from 'lucide-react';
import { Guest, GuestCategory, Invitation } from '../../types';
import { dbService } from '../../services/dbService';
import { generateSlug, generateUniqueSlug } from '../../utils/slugGenerator';
import { copyToClipboard } from '../../utils/clipboard';

interface GuestManagerProps {
  guests: Guest[];
  invitation?: Invitation | null;
  onRefresh: () => void;
  onNavigateToSlug?: (slug: string) => void;
}

const TEMPLATE_STORAGE_KEY = 'wedding_invitation_share_template_v1';

interface MessagePreset {
  id: string;
  label: string;
  template: string;
}

const MESSAGE_PRESETS: MessagePreset[] = [
  {
    id: 'islami',
    label: 'Resmi & Islami',
    template: `Assalamu'alaikum Wr. Wb.\n\nKepada Yth. Bapak/Ibu/Saudara/i *{nama}*,\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk hadir dan memberikan doa restu pada acara pernikahan kami:\n\n*{mempelai}*\n📅 {tanggal}\n📍 {lokasi}\n\nInformasi lengkap & konfirmasi kehadiran dapat diakses melalui tautan undangan khusus Anda:\n{link}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir.\n\nWassalamu'alaikum Wr. Wb.`,
  },
  {
    id: 'hangat',
    label: 'Hangat & Elegan',
    template: `Halo *{nama}*,\n\nDengan penuh sukacita, kami mengundang Anda untuk menjadi bagian dari hari bahagia pernikahan kami:\n\n*{mempelai}*\n{tanggal} • {lokasi}\n\nSilakan buka tautan undangan digital khusus untuk Anda di bawah ini:\n{link}\n\nKehadiran serta doa restu Anda sangat berarti bagi kami. Sampai jumpa di hari bahagia!`,
  },
  {
    id: 'santai',
    label: 'Santai (Sahabat / Teman)',
    template: `Hai {nama}! 👋\n\nAkhirnya hari yang ditunggu datang juga! Kami mau ngundang kamu buat hadir di acara pernikahan kami ({mempelai}) pada {tanggal} di {lokasi}.\n\nIni link undangan khusus buat kamu ya:\n{link}\n\nJangan lupa isi RSVP & kirim ucapan di link-nya. Ditunggu kehadirannya! ✨`,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  keluarga: 'Keluarga',
  sahabat: 'Sahabat',
  rekan: 'Rekan Kerja',
  vip: 'VIP',
  lainnya: 'Lainnya',
};

const CATEGORY_ORDER = ['vip', 'keluarga', 'sahabat', 'rekan', 'lainnya', 'tanpa_kategori'];

export const GuestManager: React.FC<GuestManagerProps> = ({
  guests,
  invitation,
  onRefresh,
  onNavigateToSlug,
}) => {
  // Search, filter & organization state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOpenedFilter, setSelectedOpenedFilter] = useState<string>('all');
  const [selectedRsvpFilter, setSelectedRsvpFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name_asc' | 'category' | 'opened'>('newest');
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);

  // Invitation Message Template state
  const [showTemplatePanel, setShowTemplatePanel] = useState<boolean>(false);
  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved && saved.trim()) return saved;
    } catch {
      // ignore
    }
    return MESSAGE_PRESETS[0].template;
  });

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, messageTemplate);
    } catch {
      // ignore
    }
  }, [messageTemplate]);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

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
  const [bulkDefaultCategory, setBulkDefaultCategory] = useState<string>('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Copy feedback UI helpers
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedMessageSlug, setCopiedMessageSlug] = useState<string | null>(null);
  const [copiedAllMode, setCopiedAllMode] = useState<'none' | 'links' | 'messages'>('none');
  const [bulkCopyModal, setBulkCopyModal] = useState<{
    title: string;
    subtitle: string;
    text: string;
    count: number;
  } | null>(null);
  const [bulkModalCopied, setBulkModalCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<
    { mode: 'single'; id: string; name: string } | { mode: 'bulk'; ids: string[] } | null
  >(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Resolve invitation variables for message templates
  const coupleDisplay = useMemo(() => {
    const bride = invitation?.content?.hero?.brideName || invitation?.brideName || 'Resti';
    const groom = invitation?.content?.hero?.groomName || invitation?.groomName || 'Ramdan';
    return `${bride} & ${groom}`;
  }, [invitation]);

  const eventDateDisplay = useMemo(() => {
    return (
      invitation?.content?.hero?.eventDateText ||
      invitation?.content?.hero?.eventDate ||
      invitation?.eventDate ||
      'Sabtu, 24 Oktober 2026'
    );
  }, [invitation]);

  const eventLocationDisplay = useMemo(() => {
    return (
      invitation?.content?.hero?.eventLocationText ||
      invitation?.content?.hero?.venue ||
      invitation?.venue ||
      'Lokasi Acara'
    );
  }, [invitation]);

  const getGuestUrl = (slug: string) => `${window.location.origin}/inv/${slug}`;

  const formatInvitationMessage = (guestName: string, slug: string) => {
    const link = getGuestUrl(slug);
    return messageTemplate
      .replace(/\{nama\}/gi, guestName)
      .replace(/\{link\}/gi, link)
      .replace(/\{mempelai\}/gi, coupleDisplay)
      .replace(/\{tanggal\}/gi, eventDateDisplay)
      .replace(/\{lokasi\}/gi, eventLocationDisplay);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = guests.length;
    const opened = guests.filter((g) => Boolean(g.openedAt)).length;
    const attendingGuests = guests.filter(
      (g) => g.rsvpStatus === 'hadir' || g.rsvpStatus === 'attending'
    );
    const attendingPax = attendingGuests.reduce((sum, g) => sum + (g.guestCount || 1), 0);
    const waiting = guests.filter(
      (g) => !g.rsvpStatus || g.rsvpStatus === 'menunggu' || g.rsvpStatus === 'pending'
    ).length;

    const categoryCounts: Record<string, number> = {
      all: total,
      keluarga: 0,
      sahabat: 0,
      rekan: 0,
      vip: 0,
      lainnya: 0,
      none: 0,
    };
    guests.forEach((g) => {
      const cat = g.category?.trim().toLowerCase();
      if (!cat) {
        categoryCounts.none++;
      } else if (cat in categoryCounts) {
        categoryCounts[cat]++;
      } else {
        categoryCounts.lainnya++;
      }
    });

    return {
      total,
      opened,
      attendingCount: attendingGuests.length,
      attendingPax,
      waiting,
      categoryCounts,
    };
  }, [guests]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingGuest(null);
    setFormName('');
    setFormCategory(
      selectedCategory !== 'all' && selectedCategory !== 'none' && selectedCategory !== 'has_category'
        ? selectedCategory
        : ''
    );
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
      const auto = generateUniqueSlug(val, existingSlugs, editingGuest?.slug);
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

    const existing = guests.find(
      (g) => g.slug === cleanSlug && (!editingGuest || g.id !== editingGuest.id)
    );
    if (existing) {
      setFormError(
        `Slug "/inv/${cleanSlug}" sudah dipakai oleh ${existing.name}. Gunakan slug lain atau biarkan sistem menambahkan angka.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGuest) {
        await dbService.updateGuest(editingGuest.id, {
          name: cleanName,
          slug: cleanSlug,
          category: formCategory.trim() || '',
          phone: formPhone.trim(),
          updatedAt: new Date().toISOString(),
        });
        showToast(`Data tamu "${cleanName}" berhasil diperbarui.`);
      } else {
        await dbService.addGuest({
          name: cleanName,
          customSlug: cleanSlug,
          category: formCategory.trim() || undefined,
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

  // Open non-blocking Delete Guest modal
  const handleDeleteGuest = (id: string, name: string) => {
    setConfirmDeleteTarget({ mode: 'single', id, name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    setIsDeletingTarget(true);
    try {
      if (confirmDeleteTarget.mode === 'single') {
        const { id, name } = confirmDeleteTarget;
        await dbService.deleteGuest(id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast(`Tamu "${name}" telah dihapus.`);
      } else {
        const { ids } = confirmDeleteTarget;
        await Promise.all(ids.map((id) => dbService.deleteGuest(id)));
        showToast(`${ids.length} tamu berhasil dihapus.`);
        setSelectedIds(new Set());
      }
      setConfirmDeleteTarget(null);
      onRefresh();
    } catch {
      showToast('Gagal menghapus tamu.');
    } finally {
      setIsDeletingTarget(false);
    }
  };

  // Copy Single Link Only
  const handleCopyLink = async (slug: string) => {
    const url = getGuestUrl(slug);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedSlug(slug);
      showToast(`Link /inv/${slug} disalin!`);
      setTimeout(() => setCopiedSlug(null), 2200);
    } else {
      showToast('Gagal menyalin link. Salin manual dari kolom URL.');
    }
  };

  // Copy Message + Link for Single Guest
  const handleCopyMessageWithLink = async (guest: Guest) => {
    const message = formatInvitationMessage(guest.name, guest.slug);
    const ok = await copyToClipboard(message);
    if (ok) {
      setCopiedMessageSlug(guest.slug);
      showToast(`Kata-kata undangan + link untuk "${guest.name}" disalin!`);
      setTimeout(() => setCopiedMessageSlug(null), 2400);
    } else {
      showToast('Gagal menyalin pesan undangan.');
    }
  };

  // Build WhatsApp URL using current customized template
  const getWhatsAppUrl = (guest: Guest) => {
    const message = formatInvitationMessage(guest.name, guest.slug);
    const text = encodeURIComponent(message);
    let cleanPhone = (guest.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
  };

  // Filtered & Sorted list
  const filteredGuests = useMemo(() => {
    const filtered = guests.filter((guest) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        guest.name.toLowerCase().includes(q) ||
        guest.slug.toLowerCase().includes(q) ||
        (guest.phone && guest.phone.includes(q)) ||
        (guest.category && guest.category.toLowerCase().includes(q));

      const cat = guest.category?.trim().toLowerCase() || '';
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'none' && cat === '') ||
        (selectedCategory === 'has_category' && cat !== '') ||
        cat === selectedCategory.toLowerCase();

      const matchesOpened =
        selectedOpenedFilter === 'all' ||
        (selectedOpenedFilter === 'opened' && Boolean(guest.openedAt)) ||
        (selectedOpenedFilter === 'unopened' && !guest.openedAt);

      const rsvp = guest.rsvpStatus || 'menunggu';
      const matchesRsvp =
        selectedRsvpFilter === 'all' ||
        (selectedRsvpFilter === 'hadir' && (rsvp === 'hadir' || rsvp === 'attending')) ||
        (selectedRsvpFilter === 'tidak_hadir' && (rsvp === 'tidak_hadir' || rsvp === 'declined')) ||
        (selectedRsvpFilter === 'menunggu' &&
          rsvp !== 'hadir' &&
          rsvp !== 'attending' &&
          rsvp !== 'tidak_hadir' &&
          rsvp !== 'declined');

      return matchesSearch && matchesCategory && matchesOpened && matchesRsvp;
    });

    const sorted = [...filtered];
    if (sortBy === 'name_asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => {
        const ca = a.category?.toLowerCase() || 'zzz';
        const cb = b.category?.toLowerCase() || 'zzz';
        const cmp = ca.localeCompare(cb, 'id');
        return cmp !== 0 ? cmp : a.name.localeCompare(b.name, 'id');
      });
    } else if (sortBy === 'opened') {
      sorted.sort((a, b) => {
        const oa = a.openedAt ? 1 : 0;
        const ob = b.openedAt ? 1 : 0;
        return ob - oa || a.name.localeCompare(b.name, 'id');
      });
    } else {
      sorted.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
    }
    return sorted;
  }, [guests, searchQuery, selectedCategory, selectedOpenedFilter, selectedRsvpFilter, sortBy]);

  // Grouped guests by category (for Group View)
  const groupedGuests = useMemo(() => {
    const groups = new Map<string, Guest[]>();
    filteredGuests.forEach((guest) => {
      const rawCat = guest.category?.trim().toLowerCase();
      const key = rawCat && rawCat !== '' ? rawCat : 'tanpa_kategori';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(guest);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [filteredGuests]);

  // Selection helpers
  const allFilteredSelected =
    filteredGuests.length > 0 && filteredGuests.every((g) => selectedIds.has(g.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredGuests.forEach((g) => next.delete(g.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredGuests.forEach((g) => next.add(g.id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatBulkText = (targetGuests: Guest[], mode: 'links' | 'messages') => {
    return mode === 'messages'
      ? targetGuests
          .map(
            (g, i) =>
              `=== ${i + 1}. ${g.name} ===\n${formatInvitationMessage(g.name, g.slug)}`
          )
          .join('\n\n────────────────────────\n\n')
      : targetGuests.map((g, i) => `${i + 1}. ${g.name}\n${getGuestUrl(g.slug)}`).join('\n\n');
  };

  // Copy multiple guests (links only OR full message + link)
  const handleCopyBulk = async (
    targetGuests: Guest[],
    mode: 'links' | 'messages',
    openPreviewModal = false
  ) => {
    if (targetGuests.length === 0) {
      showToast('Belum ada tamu untuk disalin.');
      return;
    }

    const formattedList = formatBulkText(targetGuests, mode);

    if (openPreviewModal) {
      setBulkModalCopied(false);
      setBulkCopyModal({
        title:
          mode === 'messages'
            ? `Semua Kata-Kata & Link (${targetGuests.length} Tamu)`
            : `Semua Link Undangan (${targetGuests.length} Tamu)`,
        subtitle:
          'Klik tombol Salin Semua di bawah ini atau pilih teks secara manual untuk menyalin ke WhatsApp/catatan.',
        text: formattedList,
        count: targetGuests.length,
      });
      return;
    }

    const ok = await copyToClipboard(formattedList);
    if (ok) {
      setCopiedAllMode(mode);
      showToast(
        mode === 'messages'
          ? `Berhasil menyalin kata-kata + link untuk ${targetGuests.length} tamu!`
          : `Berhasil menyalin ${targetGuests.length} tautan tamu!`
      );
      setTimeout(() => setCopiedAllMode('none'), 2500);
    } else {
      // Fallback: open clean modal so user can copy 1-tap or manually select all text
      setBulkModalCopied(false);
      setBulkCopyModal({
        title:
          mode === 'messages'
            ? `Salin Kata-Kata & Link (${targetGuests.length} Tamu)`
            : `Salin Link Undangan (${targetGuests.length} Tamu)`,
        subtitle:
          'Browser membatasi salin otomatis. Klik "Salin Sekarang" atau tekan Ctrl+C / Salin pada kotak di bawah.',
        text: formattedList,
        count: targetGuests.length,
      });
    }
  };

  // Bulk category update for selected guests
  const handleBulkAssignCategory = async (categoryValue: string) => {
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkActionLoading(true);
    try {
      await Promise.all(
        ids.map((id) =>
          dbService.updateGuest(id, {
            category: categoryValue,
            updatedAt: new Date().toISOString(),
          })
        )
      );
      showToast(
        categoryValue
          ? `${ids.length} tamu dipindahkan ke kategori "${CATEGORY_LABELS[categoryValue] || categoryValue}".`
          : `Kategori dihapus dari ${ids.length} tamu.`
      );
      setSelectedIds(new Set());
      onRefresh();
    } catch {
      showToast('Gagal mengubah kategori massal.');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Bulk delete selected guests
  const handleBulkDelete = () => {
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;
    setConfirmDeleteTarget({ mode: 'bulk', ids });
  };

  // Export CSV
  const handleExportCSV = () => {
    const esc = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
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
    const rows = filteredGuests.map((g) => [
      esc(g.name),
      esc(g.slug),
      esc(g.category ? CATEGORY_LABELS[g.category] || g.category : '-'),
      esc(g.phone || '-'),
      esc(getGuestUrl(g.slug)),
      g.openedAt ? esc(`Sudah (${new Date(g.openedAt).toLocaleDateString('id-ID')})`) : '"Belum"',
      esc(g.rsvpStatus || 'menunggu'),
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

    return lines.map((line) => {
      // Optional support for "Nama | Kategori | Nomor WA" or plain "Nama"
      const parts = line.split('|').map((p) => p.trim());
      const name = parts[0];
      const lineCategory = parts[1]?.toLowerCase() || bulkDefaultCategory || '';
      const linePhone = parts[2] || '';
      const generated = generateUniqueSlug(name, tempSlugs);
      tempSlugs.push(generated);
      const isDuplicate = existingSlugs.includes(generateSlug(name));
      return {
        name,
        category: lineCategory,
        phone: linePhone,
        slug: generated,
        status: isDuplicate ? 'Slug Unik Otomatis' : 'Siap Ditambahkan',
      };
    });
  }, [bulkText, bulkDefaultCategory, guests]);

  // Submit Bulk Import
  const handleSaveBulk = async () => {
    if (parsedBulkGuests.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      const payload = parsedBulkGuests.map((item) => ({
        name: item.name,
        category: (item.category as GuestCategory) || undefined,
        phone: item.phone || undefined,
      }));
      await dbService.addGuestsBulk(payload);
      showToast(`${parsedBulkGuests.length} tamu berhasil diimpor dan langsung terkelompok rapi!`);
      setShowBulkModal(false);
      setBulkText('');
      setBulkDefaultCategory('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengimpor daftar tamu.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const renderGuestRow = (guest: Guest) => {
    const isLinkCopied = copiedSlug === guest.slug;
    const isMsgCopied = copiedMessageSlug === guest.slug;
    const isSelected = selectedIds.has(guest.id);
    const categoryLabel = guest.category?.trim()
      ? CATEGORY_LABELS[guest.category.toLowerCase()] || guest.category.replace('_', ' ')
      : '';

    return (
      <tr
        key={guest.id}
        className={`transition-colors ${
          isSelected ? 'bg-[#FAF5EB]' : 'hover:bg-[#FAF8F5]/70'
        }`}
      >
        {/* Checkbox */}
        <td className="py-3.5 pl-4 pr-2 w-10">
          <button
            type="button"
            onClick={() => toggleSelectOne(guest.id)}
            aria-label={`Pilih ${guest.name}`}
            className="text-[#8C827A] hover:text-[#1F1D1B] cursor-pointer flex items-center"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-[#B89B72]" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        </td>

        {/* Name & Phone */}
        <td className="py-3.5 px-3">
          <div className="font-medium text-[#1F1D1B] leading-snug">{guest.name}</div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E8DFD3] font-mono text-[10px] text-[#70675F]">
              /inv/{guest.slug}
            </span>
            {guest.phone && (
              <span className="text-[11px] text-[#8C827A] font-normal">{guest.phone}</span>
            )}
          </div>
        </td>

        {/* Category */}
        <td className="py-3.5 px-3">
          {categoryLabel ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F4EFE6] text-[#5C5349] border border-[#E6DDD0] capitalize">
              <Tag className="w-2.5 h-2.5 text-[#B89B72]" />
              {categoryLabel}
            </span>
          ) : (
            <span className="text-[#B5ABA0] text-[11px]">&mdash;</span>
          )}
        </td>

        {/* Opened Status */}
        <td className="py-3.5 px-3">
          {guest.openedAt ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#059669] font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <CheckCircle2 className="w-3 h-3" />
              <span>Dibuka</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#8C827A]">
              <Clock className="w-3 h-3" />
              <span>Belum</span>
            </span>
          )}
        </td>

        {/* RSVP Status */}
        <td className="py-3.5 px-3">
          {String(guest.rsvpStatus) === 'hadir' || String(guest.rsvpStatus) === 'attending' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-[#059669] border border-emerald-200/60">
              Hadir ({guest.guestCount || 1} pax)
            </span>
          ) : String(guest.rsvpStatus) === 'tidak_hadir' || String(guest.rsvpStatus) === 'declined' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-[#DC2626] border border-red-200/60">
              Tidak Hadir
            </span>
          ) : (
            <span className="text-[11px] text-[#8C827A] italic">Menunggu</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-3.5 pl-3 pr-4">
          <div className="flex items-center justify-end gap-1.5">
            {/* Primary Copy Button: Copy Message + Link */}
            <button
              type="button"
              onClick={() => handleCopyMessageWithLink(guest)}
              title="Salin kata-kata undangan beserta link personal"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                isMsgCopied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-[#FAF8F5] hover:bg-[#EFE8DC] border-[#D6C7B2] text-[#242220]'
              }`}
            >
              {isMsgCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <MessageSquareText className="w-3.5 h-3.5 text-[#B89B72]" />
              )}
              <span>{isMsgCopied ? 'Tersalin!' : 'Salin Pesan + Link'}</span>
            </button>

            {/* Copy Link Only */}
            <button
              type="button"
              onClick={() => handleCopyLink(guest.slug)}
              title="Salin Link Saja (/inv/slug)"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLinkCopied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                  : 'border-transparent text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5]'
              }`}
            >
              {isLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Share WhatsApp */}
            <a
              href={getWhatsAppUrl(guest)}
              target="_blank"
              rel="noopener noreferrer"
              title="Kirim langsung via WhatsApp dengan kata pengantar"
              className="p-1.5 rounded-lg text-[#059669] hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </a>

            {/* Open Guest Invitation */}
            {onNavigateToSlug ? (
              <button
                type="button"
                onClick={() => onNavigateToSlug(guest.slug)}
                title="Buka Undangan Tamu Ini"
                className="p-1.5 rounded-lg text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href={`/inv/${guest.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Undangan Tamu Ini"
                className="p-1.5 rounded-lg text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEdit(guest)}
              title="Edit Data Tamu"
              className="p-1.5 rounded-lg text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => handleDeleteGuest(guest.id, guest.name)}
              title="Hapus Tamu"
              className="p-1.5 rounded-lg text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderGuestMobileCard = (guest: Guest) => {
    const isLinkCopied = copiedSlug === guest.slug;
    const isMsgCopied = copiedMessageSlug === guest.slug;
    const isSelected = selectedIds.has(guest.id);
    const categoryLabel = guest.category?.trim()
      ? CATEGORY_LABELS[guest.category.toLowerCase()] || guest.category.replace('_', ' ')
      : '';

    return (
      <div
        key={guest.id}
        className={`p-4 rounded-xl border transition-colors ${
          isSelected
            ? 'bg-[#FAF5EB] border-[#D4AF37]'
            : 'bg-white border-[#EFE8DC]'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => toggleSelectOne(guest.id)}
              className="mt-0.5 text-[#8C827A] hover:text-[#1F1D1B]"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-[#B89B72]" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#1F1D1B] truncate">{guest.name}</p>
              <p className="text-[11px] font-mono text-[#70675F] truncate">/inv/{guest.slug}</p>
              {guest.phone && (
                <p className="text-[11px] text-[#8C827A] mt-0.5">{guest.phone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenEdit(guest)}
              className="p-1.5 rounded-lg text-[#70675F] hover:bg-[#FAF8F5]"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteGuest(guest.id, guest.name)}
              className="p-1.5 rounded-lg text-[#EF4444] hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {categoryLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F4EFE6] text-[#5C5349] capitalize">
              <Tag className="w-2.5 h-2.5 text-[#B89B72]" />
              {categoryLabel}
            </span>
          )}
          {guest.openedAt ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Dibuka
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#8C827A] bg-[#FAF8F5] px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> Belum Buka
            </span>
          )}
          {String(guest.rsvpStatus) === 'hadir' || String(guest.rsvpStatus) === 'attending' ? (
            <span className="text-[10px] text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              Hadir ({guest.guestCount || 1} pax)
            </span>
          ) : String(guest.rsvpStatus) === 'tidak_hadir' || String(guest.rsvpStatus) === 'declined' ? (
            <span className="text-[10px] text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full">
              Tidak Hadir
            </span>
          ) : (
            <span className="text-[10px] text-[#8C827A] bg-[#FAF8F5] px-2 py-0.5 rounded-full italic">
              Menunggu RSVP
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F4EFE6]">
          <button
            type="button"
            onClick={() => handleCopyMessageWithLink(guest)}
            className={`col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border cursor-pointer ${
              isMsgCopied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-[#242220] text-white border-[#242220]'
            }`}
          >
            {isMsgCopied ? <Check className="w-3.5 h-3.5" /> : <MessageSquareText className="w-3.5 h-3.5 text-[#D4AF37]" />}
            <span>{isMsgCopied ? 'Pesan & Link Tersalin!' : 'Salin Kata-Kata + Link'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCopyLink(guest.slug)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border border-[#D6C7B2] bg-[#FAF8F5] text-[#242220] cursor-pointer"
          >
            {isLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isLinkCopied ? 'Tersalin' : 'Salin Link'}</span>
          </button>
          <a
            href={getWhatsAppUrl(guest)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kirim WA</span>
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E1C1A] text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-[#3D3833] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Top Action Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl text-[#1F1D1B] font-medium">
            Daftar Tamu Undangan
          </h3>
          <p className="text-xs text-[#8C827A] font-light mt-0.5">
            Kelola kelompok tamu, atur template kata pengantar, dan salin pesan beserta tautan personal sekali klik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Toggle Template Kata-Kata Editor */}
          <button
            type="button"
            onClick={() => setShowTemplatePanel((v) => !v)}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              showTemplatePanel
                ? 'bg-[#242220] text-white border-[#242220]'
                : 'bg-white border-[#D6C7B2] hover:bg-[#FAF8F5] text-[#242220]'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Atur Kata-Kata</span>
            {showTemplatePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Copy ALL Guests Messages + Links */}
          <button
            type="button"
            onClick={() => handleCopyBulk(guests, 'messages')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C5A059]/60 bg-[#FAF6EE] hover:bg-[#F3EBD9] text-xs font-medium text-[#242220] transition-colors cursor-pointer"
            title="Salin semua kata-kata undangan beserta link seluruh tamu"
          >
            {copiedAllMode === 'messages' ? (
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#B89B72]" />
            )}
            <span>
              {copiedAllMode === 'messages'
                ? 'Semua Tersalin!'
                : `Salin Semua Kata-Kata & Link (${guests.length})`}
            </span>
          </button>

          {/* Preview & Copy All Modal Trigger */}
          <button
            type="button"
            onClick={() =>
              handleCopyBulk(
                filteredGuests.length > 0 ? filteredGuests : guests,
                'messages',
                true
              )
            }
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6C7B2] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#242220] transition-colors cursor-pointer"
            title="Lihat daftar lengkap semua kata-kata + link untuk disalin"
          >
            <Eye className="w-3.5 h-3.5 text-[#B89B72]" />
            <span>Lihat &amp; Salin</span>
          </button>

          {/* Copy Links Only */}
          <button
            type="button"
            onClick={() =>
              handleCopyBulk(filteredGuests.length > 0 ? filteredGuests : guests, 'links')
            }
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6C7B2] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#70675F] transition-colors cursor-pointer"
            title="Salin daftar link saja"
          >
            {copiedAllMode === 'links' ? (
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <Link2 className="w-3.5 h-3.5 text-[#8C827A]" />
            )}
            <span>{copiedAllMode === 'links' ? 'Link Tersalin!' : 'Salin Link'}</span>
          </button>

          {/* Bulk Import */}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6C7B2] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#70675F] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#8C827A]" />
            <span>Import Banyak</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6C7B2] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#70675F] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#8C827A]" />
            <span>CSV</span>
          </button>

          {/* Add Guest Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#242220] hover:bg-[#34302C] text-xs font-medium text-white transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Tambah Tamu</span>
          </button>
        </div>
      </div>

      {/* Collapsible Template Kata-Kata Undangan Editor */}
      {showTemplatePanel && (
        <div className="bg-white rounded-2xl border border-[#E6DDD0] shadow-sm p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2ECE2] pb-3">
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Template Kata-Kata Undangan (Untuk Tombol Salin &amp; WhatsApp)</span>
              </h4>
              <p className="text-[11px] text-[#8C827A] mt-0.5">
                Variabel otomatis: <code className="bg-[#FAF8F5] px-1 rounded text-[#1F1D1B]">{'{nama}'}</code>,{' '}
                <code className="bg-[#FAF8F5] px-1 rounded text-[#1F1D1B]">{'{link}'}</code>,{' '}
                <code className="bg-[#FAF8F5] px-1 rounded text-[#1F1D1B]">{'{mempelai}'}</code>,{' '}
                <code className="bg-[#FAF8F5] px-1 rounded text-[#1F1D1B]">{'{tanggal}'}</code>,{' '}
                <code className="bg-[#FAF8F5] px-1 rounded text-[#1F1D1B]">{'{lokasi}'}</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {MESSAGE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setMessageTemplate(preset.template);
                    showToast(`Template "${preset.label}" diterapkan.`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EFE8DC] border border-[#E8DFD3] text-[11px] font-medium text-[#3D3833] transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMessageTemplate(MESSAGE_PRESETS[0].template)}
                title="Reset ke template standar"
                className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#3D3833]">Edit Kata-Kata Pengantar:</label>
                <div className="flex items-center gap-1">
                  {['{nama}', '{link}', '{mempelai}', '{tanggal}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setMessageTemplate((prev) => `${prev}${prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' '}${tag}`)}
                      className="px-1.5 py-0.5 rounded bg-[#FAF8F5] hover:bg-[#EFE8DC] border border-[#E8DFD3] text-[10px] font-mono text-[#70675F] cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={8}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059] leading-relaxed font-sans"
              />
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#3D3833] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#B89B72]" />
                  <span>Preview Hasil Salin (Contoh Tamu Pertama):</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyBulk(guests, 'messages', true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#242220] hover:bg-[#34302C] text-[11px] font-medium text-white transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-[#D4AF37]" />
                  <span>Lihat &amp; Salin Semua ({guests.length})</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EFE8DC] text-xs text-[#242220] whitespace-pre-wrap leading-relaxed max-h-[205px] overflow-y-auto font-sans">
                {formatInvitationMessage(
                  filteredGuests[0]?.name || guests[0]?.name || 'Bpk. Ahmad & Ibu',
                  filteredGuests[0]?.slug || guests[0]?.slug || 'bpk-ahmad'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setSelectedOpenedFilter('all');
            setSelectedRsvpFilter('all');
          }}
          className="text-left bg-white p-3.5 rounded-2xl border border-[#EFE8DC] hover:border-[#D6C7B2] transition-colors cursor-pointer"
        >
          <p className="text-[11px] text-[#8C827A] font-medium">Total Tamu</p>
          <p className="text-xl font-serif font-semibold text-[#1F1D1B] mt-0.5">{stats.total}</p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedOpenedFilter(selectedOpenedFilter === 'opened' ? 'all' : 'opened')}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer ${
            selectedOpenedFilter === 'opened'
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-white border-[#EFE8DC] hover:border-[#D6C7B2]'
          }`}
        >
          <p className="text-[11px] text-[#8C827A] font-medium">Sudah Buka Undangan</p>
          <p className="text-xl font-serif font-semibold text-[#059669] mt-0.5">
            {stats.opened} <span className="text-xs font-sans font-normal text-[#8C827A]">/ {stats.total}</span>
          </p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedRsvpFilter(selectedRsvpFilter === 'hadir' ? 'all' : 'hadir')}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer ${
            selectedRsvpFilter === 'hadir'
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-white border-[#EFE8DC] hover:border-[#D6C7B2]'
          }`}
        >
          <p className="text-[11px] text-[#8C827A] font-medium">Konfirmasi Hadir</p>
          <p className="text-xl font-serif font-semibold text-[#1F1D1B] mt-0.5">
            {stats.attendingCount}{' '}
            <span className="text-xs font-sans font-normal text-[#8C827A]">({stats.attendingPax} pax)</span>
          </p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedRsvpFilter(selectedRsvpFilter === 'menunggu' ? 'all' : 'menunggu')}
          className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer ${
            selectedRsvpFilter === 'menunggu'
              ? 'bg-amber-50/60 border-amber-300'
              : 'bg-white border-[#EFE8DC] hover:border-[#D6C7B2]'
          }`}
        >
          <p className="text-[11px] text-[#8C827A] font-medium">Menunggu RSVP</p>
          <p className="text-xl font-serif font-semibold text-[#B45309] mt-0.5">{stats.waiting}</p>
        </button>
      </div>

      {/* Category Quick Tabs for Clean Organization */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Semua Tamu', count: stats.categoryCounts.all },
          { key: 'vip', label: 'VIP', count: stats.categoryCounts.vip },
          { key: 'keluarga', label: 'Keluarga', count: stats.categoryCounts.keluarga },
          { key: 'sahabat', label: 'Sahabat', count: stats.categoryCounts.sahabat },
          { key: 'rekan', label: 'Rekan Kerja', count: stats.categoryCounts.rekan },
          { key: 'lainnya', label: 'Lainnya', count: stats.categoryCounts.lainnya },
          { key: 'none', label: 'Tanpa Kategori', count: stats.categoryCounts.none },
        ].map((tab) => {
          const active = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                active
                  ? 'bg-[#242220] text-white border-[#242220] shadow-xs'
                  : 'bg-white text-[#70675F] border-[#EFE8DC] hover:border-[#D6C7B2]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#8C827A]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Filter, Sort & Grouping Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EFE8DC] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A69C92] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama tamu, slug (/inv/...), kategori, atau no. WA..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Opened Filter */}
          <select
            value={selectedOpenedFilter}
            onChange={(e) => setSelectedOpenedFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl text-[#3D3833] focus:outline-none focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all">Status Buka: Semua</option>
            <option value="opened">Sudah Dibuka</option>
            <option value="unopened">Belum Dibuka</option>
          </select>

          {/* RSVP Filter */}
          <select
            value={selectedRsvpFilter}
            onChange={(e) => setSelectedRsvpFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl text-[#3D3833] focus:outline-none focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all">RSVP: Semua</option>
            <option value="hadir">Hadir</option>
            <option value="tidak_hadir">Tidak Hadir</option>
            <option value="menunggu">Menunggu</option>
          </select>

          {/* Sort */}
          <div className="inline-flex items-center bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl px-2.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8C827A] mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 text-xs bg-transparent text-[#3D3833] focus:outline-none cursor-pointer"
            >
              <option value="newest">Urut: Terbaru</option>
              <option value="name_asc">Urut: Nama A–Z</option>
              <option value="category">Urut: Kategori</option>
              <option value="opened">Urut: Sudah Buka</option>
            </select>
          </div>

          {/* Group by Category Toggle */}
          <button
            type="button"
            onClick={() => setGroupByCategory((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              groupByCategory
                ? 'bg-[#242220] text-white border-[#242220]'
                : 'bg-[#FAF8F5] text-[#3D3833] border-[#E8DFD3] hover:bg-[#EFE8DC]/50'
            }`}
            title="Kelompokkan tampilan daftar tamu berdasarkan kategori"
          >
            {groupByCategory ? <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> : <List className="w-3.5 h-3.5" />}
            <span>{groupByCategory ? 'Tampilan Grup' : 'Kelompokkan'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#1F1D1B] text-white px-4 py-3 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#1F1D1B] text-xs font-bold">
              {selectedIds.size} dipilih
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-white/70 hover:text-white underline cursor-pointer"
            >
              Batal pilih
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBulkActionLoading}
              onClick={() =>
                handleCopyBulk(
                  guests.filter((g) => selectedIds.has(g.id)),
                  'messages'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C5A059] text-[#1F1D1B] text-xs font-semibold cursor-pointer"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Salin Pesan + Link</span>
            </button>

            <button
              type="button"
              disabled={isBulkActionLoading}
              onClick={() =>
                handleCopyBulk(
                  guests.filter((g) => selectedIds.has(g.id)),
                  'links'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Link Saja</span>
            </button>

            <select
              defaultValue=""
              disabled={isBulkActionLoading}
              onChange={(e) => {
                if (e.target.value !== '__none') {
                  handleBulkAssignCategory(e.target.value);
                  e.target.value = '__none';
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs border border-white/15 focus:outline-none cursor-pointer"
            >
              <option value="__none" className="text-[#1F1D1B]">
                Pindah Kategori...
              </option>
              <option value="vip" className="text-[#1F1D1B]">
                VIP
              </option>
              <option value="keluarga" className="text-[#1F1D1B]">
                Keluarga
              </option>
              <option value="sahabat" className="text-[#1F1D1B]">
                Sahabat
              </option>
              <option value="rekan" className="text-[#1F1D1B]">
                Rekan Kerja
              </option>
              <option value="lainnya" className="text-[#1F1D1B]">
                Lainnya
              </option>
              <option value="" className="text-[#1F1D1B]">
                Hapus Kategori
              </option>
            </select>

            <button
              type="button"
              disabled={isBulkActionLoading}
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

      {/* Guest List Content */}
      {filteredGuests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EFE8DC] py-14 px-6 text-center text-[#8C827A]">
          <Users className="w-8 h-8 mx-auto mb-2 text-[#D6C7B2]" />
          <p className="text-sm font-medium text-[#3D3833]">Tidak ada tamu ditemukan</p>
          <p className="text-xs mt-1">
            Coba ubah filter pencarian atau klik &ldquo;Tambah Tamu&rdquo; untuk menambahkan tamu baru.
          </p>
        </div>
      ) : groupByCategory ? (
        /* GROUPED BY CATEGORY VIEW */
        <div className="space-y-5">
          {groupedGuests.map(([catKey, groupList]) => {
            const label =
              catKey === 'tanpa_kategori'
                ? 'Tanpa Kategori'
                : CATEGORY_LABELS[catKey] || catKey;

            return (
              <div
                key={catKey}
                className="bg-white rounded-2xl border border-[#EFE8DC] shadow-xs overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#EFE8DC] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[#B89B72]" />
                    <span className="text-xs font-semibold text-[#1F1D1B] uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#E8DFD3] text-[10px] font-medium text-[#70675F]">
                      {groupList.length} Tamu
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyBulk(groupList, 'messages')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFE8DC] border border-[#D6C7B2] text-[11px] font-medium text-[#242220] transition-colors cursor-pointer"
                  >
                    <MessageSquareText className="w-3 h-3 text-[#B89B72]" />
                    <span>Salin Pesan + Link Grup Ini</span>
                  </button>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <tbody className="divide-y divide-[#F4EFE6]">
                      {groupList.map(renderGuestRow)}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-2.5">
                  {groupList.map(renderGuestMobileCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD CLEAN TABLE / CARD VIEW */
        <div className="bg-white rounded-2xl border border-[#EFE8DC] shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EFE8DC] text-[#8C827A] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      title={allFilteredSelected ? 'Batal pilih semua' : 'Pilih semua yang tampil'}
                      className="text-[#8C827A] hover:text-[#1F1D1B] cursor-pointer flex items-center"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#B89B72]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3 font-semibold">Nama Tamu &amp; Link Slug</th>
                  <th className="py-3.5 px-3 font-semibold">Kategori</th>
                  <th className="py-3.5 px-3 font-semibold">Status Buka</th>
                  <th className="py-3.5 px-3 font-semibold">RSVP</th>
                  <th className="py-3.5 pl-3 pr-4 font-semibold text-right">Salin &amp; Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFE6]">
                {filteredGuests.map(renderGuestRow)}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-3 space-y-3">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-[#F4EFE6]">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="inline-flex items-center gap-1.5 text-xs text-[#70675F]"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#B89B72]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Pilih Semua ({filteredGuests.length})</span>
              </button>
              <span className="text-[11px] text-[#8C827A]">{filteredGuests.length} tamu</span>
            </div>
            {filteredGuests.map(renderGuestMobileCard)}
          </div>
        </div>
      )}

      {/* Add / Edit Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#EFE8DC] animate-in fade-in zoom-in-95">
            <h3 className="font-serif text-xl font-normal text-[#1F1D1B] mb-1">
              {editingGuest ? 'Edit Tamu Undangan' : 'Tambah Tamu Baru'}
            </h3>
            <p className="text-xs text-[#8C827A] mb-5 font-light">
              Undangan akan dapat diakses secara langsung via slug URL personal.
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

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DFD3]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#3D3833]">
                    Kategori / Grup Tamu (Opsional)
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
                  <option value="">-- Tanpa Kategori --</option>
                  <option value="vip">VIP</option>
                  <option value="keluarga">Keluarga</option>
                  <option value="sahabat">Sahabat</option>
                  <option value="rekan">Rekan Kerja</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                <p className="text-[10px] text-[#8C827A] mt-1.5 leading-normal">
                  Memudahkan pengelompokan daftar tamu di Admin. Jika dipilih &ldquo;Tanpa Kategori&rdquo;, label tidak muncul di website tamu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3D3833] mb-1">
                  Nomor WhatsApp (Opsional, untuk kirim langsung ke WA)
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
                Import Banyak Tamu Sekaligus
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1 rounded-lg text-[#8C827A] hover:text-[#1F1D1B] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#8C827A] mb-4 font-light">
              Masukkan 1 nama per baris (opsional: <code className="bg-[#FAF8F5] px-1 rounded">Nama | Kategori | No WA</code>). Sistem otomatis membuat slug unik untuk setiap tamu.
            </p>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-[#3D3833] mb-1">
                  Kategori Default untuk Tamu yang Diimpor (Opsional)
                </label>
                <select
                  value={bulkDefaultCategory}
                  onChange={(e) => setBulkDefaultCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="">-- Tanpa Kategori --</option>
                  <option value="vip">VIP</option>
                  <option value="keluarga">Keluarga</option>
                  <option value="sahabat">Sahabat</option>
                  <option value="rekan">Rekan Kerja</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3D3833] mb-1">
                  Daftar Nama Tamu (1 nama per baris)
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Aley Firmansyah\nNelly Selvatiany\nFutri Tiara | sahabat | 08123456789\nRapi Nurdiansyah`}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059] font-mono leading-relaxed"
                />
              </div>

              {/* Preview Import Table */}
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
                          <th className="py-2 px-3 font-semibold">Kategori</th>
                          <th className="py-2 px-3 font-semibold">Slug URL</th>
                          <th className="py-2 px-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4EFE6]">
                        {parsedBulkGuests.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF8F5]/60">
                            <td className="py-2 px-3 font-medium text-[#1F1D1B]">{item.name}</td>
                            <td className="py-2 px-3 text-[#70675F] capitalize">
                              {item.category ? CATEGORY_LABELS[item.category] || item.category : '—'}
                            </td>
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
      {/* Bulk Copy Preview & Fallback Modal */}
      {bulkCopyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#EFE8DC] animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#EFE8DC]">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#1F1D1B]">
                  {bulkCopyModal.title}
                </h3>
                <p className="text-xs text-[#70675F] font-light mt-0.5">
                  {bulkCopyModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkCopyModal(null)}
                className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 flex-1 overflow-hidden">
              <textarea
                readOnly
                value={bulkCopyModal.text}
                onFocus={(e) => e.currentTarget.select()}
                rows={12}
                className="w-full h-full min-h-[240px] max-h-[50vh] p-3.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl text-[#242220] font-sans leading-relaxed focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EFE8DC]">
              <span className="text-[11px] text-[#8C827A]">
                Total {bulkCopyModal.count} tamu siap dibagikan
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkCopyModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#D6C7B2] text-xs text-[#70675F] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(bulkCopyModal.text);
                    if (ok) {
                      setBulkModalCopied(true);
                      showToast(`Berhasil menyalin ${bulkCopyModal.count} data tamu!`);
                      setTimeout(() => setBulkModalCopied(false), 2500);
                    } else {
                      showToast('Silakan pilih semua teks di kotak lalu tekan Salin.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#242220] hover:bg-[#34302C] text-xs font-medium text-white cursor-pointer"
                >
                  {bulkModalCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Salin Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#EFE8DC] animate-in fade-in zoom-in-95">
            <h3 className="font-serif text-lg font-medium text-[#1F1D1B]">
              {confirmDeleteTarget.mode === 'single'
                ? 'Hapus Tamu Undangan?'
                : `Hapus ${confirmDeleteTarget.ids.length} Tamu Terpilih?`}
            </h3>
            <p className="text-xs text-[#70675F] font-light mt-2 leading-relaxed">
              {confirmDeleteTarget.mode === 'single' ? (
                <>
                  Anda akan menghapus <strong className="font-semibold text-[#1F1D1B]">{confirmDeleteTarget.name}</strong> dari daftar tamu. Tindakan ini tidak dapat dibatalkan.
                </>
              ) : (
                <>
                  Sebanyak <strong className="font-semibold text-[#1F1D1B]">{confirmDeleteTarget.ids.length} tamu terpilih</strong> akan dihapus permanen dari database.
                </>
              )}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingTarget}
                onClick={() => setConfirmDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#D6C7B2] text-xs text-[#70675F] hover:bg-[#FAF8F5] cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTarget}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                {isDeletingTarget ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
