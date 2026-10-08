import React from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  currentTab: AdminTab;
  tabTitle: string;
  previewDevice: 'mobile' | 'tablet' | 'desktop';
  onChangePreviewDevice: (device: 'mobile' | 'tablet' | 'desktop') => void;
  isSaving: boolean;
  isPublishing: boolean;
  hasUnpublishedChanges: boolean;
  lastSavedText: string;
  onPublish: () => void;
  onSaveDraft: () => void;
  onOpenLiveSite: () => void;
  showDeviceToggles?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  tabTitle,
  previewDevice,
  onChangePreviewDevice,
  isSaving,
  isPublishing,
  hasUnpublishedChanges,
  lastSavedText,
  onPublish,
  onSaveDraft,
  onOpenLiveSite,
  showDeviceToggles = false,
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#EFE8DC] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8C827A] font-medium hidden sm:inline-block">CMS Studio</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#D6C7B2] hidden sm:inline-block" />
        <h2 className="text-sm sm:text-base font-semibold text-[#1F1D1B] tracking-tight capitalize">
          {tabTitle}
        </h2>
        {isSaving && (
          <span className="text-[10px] text-[#8C827A] font-light italic ml-2 hidden sm:inline-block">
            Menyimpan perubahan ke cloud...
          </span>
        )}
        {!isSaving && lastSavedText && (
          <span className="text-[10px] text-[#10B981] font-normal ml-2 hidden md:inline-flex items-center gap-1 bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
            <Database className="w-2.5 h-2.5 text-[#059669]" />
            <span className="font-medium text-[#047857]">{lastSavedText}</span>
          </span>
        )}
      </div>

      {/* Center Device Switcher (when previewing) */}
      {showDeviceToggles && (
        <div className="hidden md:flex items-center bg-[#F7F3EE] p-1 rounded-xl border border-[#E8DFD3]">
          <button
            onClick={() => onChangePreviewDevice('mobile')}
            title="Tampilan Mobile (375px)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              previewDevice === 'mobile'
                ? 'bg-white text-[#1F1D1B] shadow-xs font-medium'
                : 'text-[#8C827A] hover:text-[#1F1D1B]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangePreviewDevice('tablet')}
            title="Tampilan Tablet (768px)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              previewDevice === 'tablet'
                ? 'bg-white text-[#1F1D1B] shadow-xs font-medium'
                : 'text-[#8C827A] hover:text-[#1F1D1B]'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangePreviewDevice('desktop')}
            title="Tampilan Desktop Penuh"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              previewDevice === 'desktop'
                ? 'bg-white text-[#1F1D1B] shadow-xs font-medium'
                : 'text-[#8C827A] hover:text-[#1F1D1B]'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenLiveSite}
          title="Buka tampilan website undangan live"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D6C7B2] hover:bg-[#F7F3EE] text-[#3D3833] text-xs font-medium transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#8C827A]" />
          <span className="hidden sm:inline">Lihat Website Live</span>
        </button>

        <button
          onClick={onPublish}
          disabled={isPublishing || isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg bg-[#242220] hover:bg-[#383431] active:scale-[0.98] text-[#FAF8F5] text-xs font-medium tracking-wide transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{isPublishing ? 'Menerapkan...' : 'Simpan & Terapkan'}</span>
        </button>
      </div>
    </header>
  );
};
