import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Invitation } from '../../types';
import { GuestInvitationPage } from '../../pages/GuestInvitationPage';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  invitation,
}) => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [showCoverFirst, setShowCoverFirst] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  if (!isOpen) return null;

  const handleReload = () => {
    setPreviewKey((prev) => prev + 1);
  };

  const getFrameWidth = () => {
    switch (device) {
      case 'mobile':
        return 'w-[390px] h-[780px] rounded-[44px] border-[10px] border-[#1F1D1B] shadow-2xl';
      case 'tablet':
        return 'w-[768px] h-[850px] rounded-[32px] border-[12px] border-[#1F1D1B] shadow-2xl';
      case 'desktop':
        return 'w-full max-w-4xl h-[88vh] rounded-2xl border-4 border-[#3D3833] shadow-2xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden animate-in fade-in">
      {/* Top Controller Bar */}
      <div className="w-full max-w-4xl bg-[#1E1C1A] text-white px-4 py-2.5 rounded-2xl border border-[#3D3833] flex items-center justify-between shadow-lg shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-semibold tracking-wide">
            Live Preview Undangan
          </span>
          <span className="text-[10px] text-[#A69C92] hidden sm:inline-block">
            (Render real-time dari konfigurasi CMS)
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-[#2A2724] p-1 rounded-xl border border-[#3D3833]">
          <button
            onClick={() => setDevice('mobile')}
            title="Mobile (390px)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              device === 'mobile'
                ? 'bg-[#C5A059] text-black font-semibold shadow-xs'
                : 'text-[#C9C1B8] hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            title="Tablet (768px)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              device === 'tablet'
                ? 'bg-[#C5A059] text-black font-semibold shadow-xs'
                : 'text-[#C9C1B8] hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('desktop')}
            title="Desktop (Full)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              device === 'desktop'
                ? 'bg-[#C5A059] text-black font-semibold shadow-xs'
                : 'text-[#C9C1B8] hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            title="Muat Ulang Preview"
            className="p-1.5 rounded-lg hover:bg-[#34302C] text-[#C9C1B8] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Tutup Preview"
            className="p-1.5 rounded-lg hover:bg-red-600/20 text-[#EF4444] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Simulated Device Frame */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <div
          className={`${getFrameWidth()} bg-white overflow-y-auto relative transition-all duration-300 flex flex-col`}
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Mobile Speaker/Camera notch */}
          {device === 'mobile' && (
            <div className="sticky top-0 left-0 right-0 z-50 h-5 bg-[#1F1D1B] flex items-center justify-center">
              <div className="w-16 h-3 bg-black rounded-full" />
            </div>
          )}

          <div key={previewKey} className="flex-1 w-full">
            <GuestInvitationPage
              slug="preview"
              customInvitation={invitation}
              previewMode={!showCoverFirst}
              initialOpened={!showCoverFirst}
              onNavigateHome={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Bottom info hint */}
      <div className="text-[11px] text-[#A69C92] pt-2 text-center shrink-0">
        Tekan tombol <span className="text-white font-mono">ESC</span> atau tombol silang di kanan atas untuk kembali ke Dashboard Editor.
      </div>
    </div>
  );
};
