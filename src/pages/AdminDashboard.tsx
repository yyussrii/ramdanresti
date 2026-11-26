import React, { useState, useEffect, Suspense } from 'react';
import {
  Lock,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Guest,
  Invitation,
} from '../types';
import { dbService } from '../services/dbService';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { DashboardOverview } from '../components/admin/DashboardOverview';

const GuestManager = React.lazy(() =>
  import('../components/admin/GuestManager').then((m) => ({ default: m.GuestManager }))
);
const ContentEditor = React.lazy(() =>
  import('../components/admin/ContentEditor').then((m) => ({ default: m.ContentEditor }))
);
const LayoutEditor = React.lazy(() =>
  import('../components/admin/LayoutEditor').then((m) => ({ default: m.LayoutEditor }))
);
const MediaManager = React.lazy(() =>
  import('../components/admin/MediaManager').then((m) => ({ default: m.MediaManager }))
);
const MusicManager = React.lazy(() =>
  import('../components/admin/MusicManager').then((m) => ({ default: m.MusicManager }))
);
const CommentControl = React.lazy(() =>
  import('../components/admin/CommentControl').then((m) => ({ default: m.CommentControl }))
);
const LivePreviewModal = React.lazy(() =>
  import('../components/admin/LivePreviewModal').then((m) => ({ default: m.LivePreviewModal }))
);
import {
  DEFAULT_CONTENT_CONFIG,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_MUSIC_CONFIG,
} from '../constants/cmsDefaults';

interface AdminDashboardProps {
  onBackToInvitation?: () => void;
  onNavigateToSlug?: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToInvitation,
  onNavigateToSlug,
}) => {
  // 1. Server-Verified Authentication State (Bearer token held in memory only)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState('');
  const [authError, setAuthError] = useState('');

  // 2. Active Tab
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // 3. Data State
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 4. Draft & Publishing State
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('Database Cloud Aktif');

  // 5. Live Preview
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // 6. Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [invData, guestData] = await Promise.all([
        dbService.getInvitation(undefined, 'draft'),
        dbService.getAllGuests(),
      ]);
      setInvitation(invData);
      setGuests(guestData);
      setHasUnpublishedChanges(Boolean(invData.hasUnpublishedChanges));
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToast('Gagal memuat data dari database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = adminPin.trim();
    if (!cleanInput) {
      setAuthError('Silakan masukkan kata sandi admin.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: cleanInput }),
      });

      let payload: { token?: string; error?: string } = {};
      try {
        payload = (await response.json()) as { token?: string; error?: string };
      } catch {
        payload = {};
      }

      if (!response.ok || !payload.token) {
        setAuthError(
          payload.error || 'Kata sandi salah atau autentikasi server belum dikonfigurasi.'
        );
        return;
      }

      sessionStorage.removeItem('wedding_admin_auth');
      setAdminToken(payload.token);
      setIsAuthenticated(true);
      setAdminPin('');
      setAuthError('');
    } catch {
      setAuthError('Tidak dapat terhubung ke server autentikasi. Silakan coba kembali.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAuthExpired = (message?: string) => {
    setAdminToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('wedding_admin_auth');
    setAuthError(message || 'Sesi admin telah berakhir. Silakan masuk kembali.');
  };

  const handleLogout = () => {
    setAdminToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('wedding_admin_auth');
    setAdminPin('');
  };

  // Generic partial draft updater
  const handleUpdateDraftConfig = async (updates: Partial<Invitation>) => {
    if (!invitation) return;

    // Optimistically update local invitation state immediately
    const nextInvitation: Invitation = {
      ...invitation,
      ...updates,
      hasUnpublishedChanges: true,
    };
    setInvitation(nextInvitation);
    setHasUnpublishedChanges(true);

    setIsSaving(true);
    setLastSavedText('Menyimpan ke website...');

    try {
      const saved = await dbService.saveDraft(updates);
      setInvitation(saved);
      setHasUnpublishedChanges(false);
      setLastSavedText('Tersimpan & Langsung Aktif di Website');
    } catch (err) {
      console.error('Error saving:', err);
      setLastSavedText('Gagal menyimpan perubahan');
      showToast('Gagal menyimpan perubahan ke database.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Explicit Save & Apply to Live Website
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const published = await dbService.publishInvitation();
      setInvitation(published);
      setHasUnpublishedChanges(false);
      showToast('Perubahan berhasil disimpan & langsung aktif di website undangan!');
    } catch (err) {
      console.error('Error publishing:', err);
      showToast('Gagal menerapkan perubahan.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenLiveSite = () => {
    const firstGuest = guests[0];
    if (onNavigateToSlug) {
      onNavigateToSlug(firstGuest?.slug || 'tamu');
    } else if (onBackToInvitation) {
      onBackToInvitation();
    }
  };

  // -------------------------------------------------------------
  // LOGIN VIEW (When not authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1E1C1A] flex flex-col items-center justify-center p-4">
        {onBackToInvitation && (
          <button
            onClick={onBackToInvitation}
            className="fixed top-6 left-6 text-xs text-[#A69C92] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Undangan</span>
          </button>
        )}

        <div className="w-full max-w-sm bg-[#262320] border border-[#3D3833] rounded-3xl p-7 text-center shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] flex items-center justify-center text-[#1E1C1A] mx-auto mb-5 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-2xl text-white font-medium mb-1">
            Admin Studio Undangan
          </h2>
          <p className="text-xs text-[#A69C92] font-light mb-6">
            Masukkan kata sandi admin untuk mengelola seluruh konten dan desain undangan.
          </p>

          {authError && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#A69C92] font-medium mb-1.5">
                Kata Sandi Admin
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1816] border border-[#3D3833] rounded-xl text-white placeholder-[#70675F] text-xs focus:outline-none focus:border-[#C5A059] transition-colors tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-[#C5A059] hover:bg-[#D4AF37] active:scale-[0.98] disabled:opacity-60 text-[#1E1C1A] text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isLoggingIn ? 'Memverifikasi...' : 'Masuk ke Dashboard CMS'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#34302C]">
            <p className="text-[11px] text-[#70675F] font-light">
              Akses terbatas hanya untuk pengelola undangan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading || !invitation) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-full border-2 border-[#D6C7B2] border-t-[#242220] animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.25em] text-[#8C827A] font-light">
          Mempersiapkan Studio CMS...
        </p>
      </div>
    );
  }

  // Safe fallback objects
  const currentContent = invitation.content || DEFAULT_CONTENT_CONFIG;
  const currentLayout = invitation.layout || DEFAULT_LAYOUT_CONFIG;
  const currentMusic = invitation.music || {
    url: invitation.musicUrl || DEFAULT_MUSIC_CONFIG.url,
    title: DEFAULT_MUSIC_CONFIG.title,
    artist: DEFAULT_MUSIC_CONFIG.artist,
    autoPlay: true,
    loop: true,
  };

  const tabTitles: Record<AdminTab, string> = {
    dashboard: 'Dashboard Ikhtisar',
    tamu: 'Daftar Tamu & Kode Undangan',
    konten: 'Editor Konten & Teks',
    layout: 'Tata Letak & Urutan Section',
    media: 'Manajer Media & Galeri',
    musik: 'Musik Pengiring Latar',
    komentar: 'Kontrol & Moderasi Komentar',
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1D1B] flex flex-col lg:flex-row antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E1C1A] text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-[#3D3833] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isSaving={isSaving}
        isPublishing={isPublishing}
        hasUnpublishedChanges={hasUnpublishedChanges}
        onSaveDraft={() => handleUpdateDraftConfig({})}
        onPublish={handlePublish}
        onTogglePreview={() => setIsPreviewModalOpen(true)}
        onLogout={handleLogout}
        onOpenLiveSite={handleOpenLiveSite}
        versionNumber={invitation.versionHistory?.[0]?.versionNumber || 1}
      />

      {/* 2. Main Editor Panel */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Control Header */}
        <AdminHeader
          currentTab={currentTab}
          tabTitle={tabTitles[currentTab]}
          previewDevice={previewDevice}
          onChangePreviewDevice={(d) => setPreviewDevice(d)}
          isSaving={isSaving}
          isPublishing={isPublishing}
          hasUnpublishedChanges={hasUnpublishedChanges}
          lastSavedText={lastSavedText}
          onPublish={handlePublish}
          onSaveDraft={() => handleUpdateDraftConfig({})}
          onOpenLiveSite={handleOpenLiveSite}
        />

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardOverview
              invitation={invitation}
              guests={guests}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onPublish={handlePublish}
              onOpenLiveSite={handleOpenLiveSite}
              isPublishing={isPublishing}
              hasUnpublishedChanges={hasUnpublishedChanges}
            />
          )}

          <Suspense
            fallback={
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#8C827A]">
                <div className="w-8 h-8 rounded-full border-2 border-[#D6C7B2] border-t-[#242220] animate-spin" />
                <span className="text-xs">Memuat panel editor...</span>
              </div>
            }
          >
            {currentTab === 'tamu' && (
              <GuestManager
                guests={guests}
                invitation={invitation}
                onRefresh={loadInitialData}
                onNavigateToSlug={onNavigateToSlug}
              />
            )}

            {currentTab === 'konten' && (
              <ContentEditor
                content={currentContent}
                isSaving={isSaving}
                authToken={adminToken}
                onAuthExpired={handleAuthExpired}
                onSave={async (updatedContent) => {
                  await handleUpdateDraftConfig({ content: updatedContent });
                  showToast('Perubahan konten berhasil disimpan!');
                }}
              />
            )}

            {currentTab === 'layout' && (
              <LayoutEditor
                layout={currentLayout}
                onChange={(updatedLayout) => {
                  handleUpdateDraftConfig({ layout: updatedLayout }).catch(() => {});
                }}
              />
            )}

            {currentTab === 'media' && (
              <MediaManager
                content={currentContent}
                settings={invitation.settings}
                authToken={adminToken}
                onAuthExpired={handleAuthExpired}
                onChangeContent={(updatedContent) => {
                  handleUpdateDraftConfig({ content: updatedContent }).catch(() => {});
                }}
              />
            )}

            {currentTab === 'musik' && (
              <MusicManager
                music={currentMusic}
                onChange={(updatedMusic) => {
                  handleUpdateDraftConfig({ music: updatedMusic }).catch(() => {});
                }}
              />
            )}

            {currentTab === 'komentar' && (
              <CommentControl
                invitation={invitation}
                onUpdateDraftConfig={(updates) => {
                  handleUpdateDraftConfig(updates).catch(() => {});
                }}
                showToast={showToast}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* 3. Live Preview Modal with Device Switcher */}
      {isPreviewModalOpen && (
        <Suspense fallback={null}>
          <LivePreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            invitation={invitation}
          />
        </Suspense>
      )}
    </div>
  );
};
