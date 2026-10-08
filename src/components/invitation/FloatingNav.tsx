import React, { useState } from 'react';
import { Calendar, MapPin, CheckSquare, Share2, Copy, Check } from 'lucide-react';

interface FloatingNavProps {
  onCopyLink: () => void;
  isCopied: boolean;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ onCopyLink, isCopied }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#242220]/90 backdrop-blur-md border border-[#443F3B] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-4 text-xs">
        <button
          onClick={() => scrollTo('wedding-details')}
          className="flex items-center gap-1.5 text-[#E6DEC] hover:text-[#D8C6AE] transition-colors py-1 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-light">Acara</span>
        </button>

        <span className="text-white/20">|</span>

        <button
          onClick={() => scrollTo('wedding-details')}
          className="flex items-center gap-1.5 text-[#E6DEC] hover:text-[#D8C6AE] transition-colors py-1 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-light">Lokasi</span>
        </button>

        <span className="text-white/20">|</span>

        <button
          onClick={() => scrollTo('rsvp-section')}
          className="flex items-center gap-1.5 text-[#E6DEC] hover:text-[#D8C6AE] transition-colors py-1 cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-light">RSVP</span>
        </button>

        <span className="text-white/20">|</span>

        <button
          onClick={onCopyLink}
          aria-label="Bagikan Undangan"
          className="flex items-center gap-1 text-[#D8C6AE] hover:text-white transition-colors py-1 cursor-pointer"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          <span className="text-[11px] uppercase tracking-wider font-light">
            {isCopied ? 'Tersalin' : 'Share'}
          </span>
        </button>
      </div>
    </>
  );
};
