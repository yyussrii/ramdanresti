import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Layers,
  Image as ImageIcon,
  Music,
  MessageSquare,
  Eye,
  LogOut,
  ExternalLink,
  Save,
  Send,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'tamu'
  | 'konten'
  | 'layout'
  | 'media'
  | 'musik'
  | 'komentar';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isSaving: boolean;
  isPublishing: boolean;
  hasUnpublishedChanges: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onTogglePreview: () => void;
  onLogout: () => void;
  onOpenLiveSite: () => void;
  versionNumber?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isSaving,
  isPublishing,
  hasUnpublishedChanges,
  onSaveDraft,
  onPublish,
  onTogglePreview,
  onLogout,
  onOpenLiveSite,
  versionNumber = 1,
}) => {
  const displayVersion = typeof versionNumber === 'number'
    ? versionNumber
    : typeof versionNumber === 'string'
    ? versionNumber
    : 1;

  const menuItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tamu', label: 'Tamu & RSVP', icon: Users },
    { id: 'konten', label: 'Konten Teks', icon: FileText },
    { id: 'layout', label: 'Layout Section', icon: Layers },
    { id: 'media', label: 'Media & Galeri', icon: ImageIcon },
    { id: 'musik', label: 'Musik Latar', icon: Music },
    { id: 'komentar', label: 'Kontrol Komentar', icon: MessageSquare },
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, fixed on desktop) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#1E1C1A] text-[#EFEBE6] border-r border-[#34302C] shrink-0 sticky top-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#2D2925] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] flex items-center justify-center text-[#1E1C1A] shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-serif text-base tracking-wide font-medium text-white leading-tight">
                Studio Undangan
              </h1>
              <span className="text-[10px] text-[#A69C92] tracking-wider uppercase block">
                Visual CMS v{displayVersion}.0
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Publish Bar */}
        <div className="p-4 border-b border-[#2D2925] bg-[#161514]/60 space-y-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#A69C92] text-[11px]">Status Live:</span>
            {hasUnpublishedChanges ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#F59E0B] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                Ada Perubahan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#10B981] px-2 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Sinkron Live
              </span>
            )}
          </div>

          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="w-full py-2.5 px-3 rounded-lg bg-[#C5A059] hover:bg-[#D4AF37] active:scale-[0.98] text-[#161514] text-xs font-semibold tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Mempublikasi...' : 'Publikasikan ke Tamu'}</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#C5A059]/20 text-[#D4AF37] border border-[#C5A059]/40 shadow-xs'
                    : 'text-[#C9C1B8] hover:bg-[#2A2724] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-[#8C827A]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Actions */}
        <div className="p-3 border-t border-[#2D2925] space-y-1 bg-[#181615]">
          <button
            onClick={onTogglePreview}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#C9C1B8] hover:bg-[#2A2724] hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#C5A059]" />
            <span>Live Preview Modal</span>
          </button>
          <button
            onClick={onOpenLiveSite}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#C9C1B8] hover:bg-[#2A2724] hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#8C827A]" />
            <span>Lihat Undangan Asli</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#EF4444]" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1C1A]/95 backdrop-blur-md border-t border-[#34302C] px-2 py-1 flex items-center justify-around shadow-lg">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] transition-colors cursor-pointer ${
                isActive ? 'text-[#D4AF37]' : 'text-[#8C827A]'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[50px]">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => onSelectTab('komentar')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] transition-colors cursor-pointer ${
            ['media', 'musik', 'komentar'].includes(currentTab) ? 'text-[#D4AF37]' : 'text-[#8C827A]'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span>Komentar</span>
        </button>
      </div>
    </>
  );
};
