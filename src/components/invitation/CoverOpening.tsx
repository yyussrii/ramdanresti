import React from 'react';
import { motion } from 'motion/react';
import { MailOpen, Sparkles, ChevronDown } from 'lucide-react';
import { Guest, Invitation } from '../../types';

interface CoverOpeningProps {
  invitation: Invitation;
  guest: Guest | null;
  onOpen: () => void;
  isOpened?: boolean;
}

export const CoverOpening: React.FC<CoverOpeningProps> = ({
  invitation,
  guest,
  onOpen,
  isOpened = false,
}) => {
  const opening = invitation.content?.opening;
  const groomName = invitation.content?.hero.groomName || invitation.groomName;
  const brideName = invitation.content?.hero.brideName || invitation.brideName;
  const eventDate = invitation.content?.hero.eventDate || invitation.eventDate;

  const label = opening?.label || 'The Wedding Celebration';
  const greeting = opening?.greeting || 'Kepada Yth. Bapak/Ibu/Saudara/i:';
  const defaultGuestName = opening?.defaultGuestName || 'Tamu Undangan';
  const subheading = opening?.subheading || 'Tanpa mengurangi rasa hormat, kami bermaksud mengundang Anda untuk hadir dalam perayaan pernikahan kami.';
  const buttonText = opening?.buttonText || 'Buka Undangan';

  return (
    <section
      id="cover-opening"
      className="relative w-full min-h-[100dvh] h-[100dvh] flex flex-col items-center justify-between px-6 py-8 sm:py-12 bg-[#FAF8F5] text-[#242220] overflow-hidden select-none"
      style={{ backgroundColor: invitation.theme?.palette.background || '#FAF8F5' }}
    >
      {/* Subtle Background Texture & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#E8DFD3_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#EFE8DC] blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#EFE8DC] blur-3xl opacity-60 pointer-events-none" />

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center pt-2"
      >
        <span className="text-[11px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
          {label}
        </span>
        <div className="w-10 h-[1px] bg-[#D6C7B2] mx-auto" />
      </motion.div>

      {/* Center Couple Focal Point & Personalized Guest Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-sm w-full my-auto flex flex-col items-center"
      >
        {/* Couple Names - Silky Smooth Reveal */}
        <motion.h1
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-wide text-[#12100E] font-medium leading-tight"
        >
          <span className="inline-block">{brideName}</span>
          <span className="font-serif italic font-light mx-2 text-[#A68353] inline-block">&amp;</span>
          <span className="inline-block">{groomName}</span>
        </motion.h1>

        {/* Date Display */}
        <motion.p
          initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs uppercase tracking-[0.25em] text-[#4A433C] mt-3 mb-5 font-medium"
        >
          {eventDate}
        </motion.p>

        {/* Personalized Guest Invitation Card */}
        <div className="w-full bg-[#FFFFFF]/90 backdrop-blur-sm border border-[#E8E1D7] rounded-xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#70665E] font-medium block mb-1">
            {greeting}
          </span>

          {/* Guest Name with Gentle Smooth Reveal */}
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="my-1.5 py-0.5 px-3"
          >
            <h2 className="font-serif text-2xl sm:text-3xl text-[#12100E] font-semibold tracking-normal capitalize">
              {guest ? guest.name : defaultGuestName}
            </h2>
          </motion.div>

          {guest?.category && guest.category.trim() !== '' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase bg-[#F3EFEA] text-[#61574E] font-medium border border-[#E3DBD0] mb-2.5">
              <Sparkles className="w-2.5 h-2.5 text-[#A68353]" />
              Tamu {guest.category}
            </span>
          )}

          <p className="text-xs text-[#524A42] font-normal leading-relaxed text-center mt-1 max-w-xs">
            {subheading}
          </p>
        </div>
      </motion.div>

      {/* Bottom Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xs flex flex-col items-center pb-2"
      >
        <button
          id="btn-open-invitation"
          onClick={onOpen}
          className="group w-full py-3.5 px-6 rounded-lg bg-[#242220] hover:bg-[#383431] active:scale-[0.98] text-[#FAF8F5] text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {isOpened ? (
            <>
              <ChevronDown className="w-4 h-4 text-[#D8C6AE] transition-transform duration-300 group-hover:translate-y-0.5 animate-bounce" />
              <span>Lihat Undangan</span>
            </>
          ) : (
            <>
              <MailOpen className="w-4 h-4 text-[#D8C6AE] transition-transform duration-300 group-hover:scale-110" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-[#A0978E] mt-3 tracking-wider font-light flex items-center gap-1">
          {isOpened ? (
            <span>Gulir ke bawah untuk melihat rangkaian acara</span>
          ) : (
            <span>Sentuh untuk membuka undangan digital</span>
          )}
        </p>
      </motion.div>
    </section>
  );
};
