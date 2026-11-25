import React from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin } from 'lucide-react';
import { Invitation, SectionLayoutConfig } from '../../types';
import { SmartImage } from '../common/SmartImage';

interface HeroSectionProps {
  invitation: Invitation;
  layout?: SectionLayoutConfig;
  isOpened?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  invitation,
  layout,
  isOpened = true,
}) => {
  const heroContent = invitation.content?.hero;
  const groomName = heroContent?.groomName || invitation.groomName;
  const brideName = heroContent?.brideName || invitation.brideName;
  const eventDate = heroContent?.eventDateText || heroContent?.eventDate || invitation.eventDate;
  const eventTime = heroContent?.eventTimeText;
  const venue = heroContent?.eventLocationText || heroContent?.venue || invitation.venue;
  const badge = heroContent?.badge || "Walimatul 'Ursy";
  const heroImage = heroContent?.heroImageUrl || heroContent?.heroImage || invitation.heroImage;
  const quote = heroContent?.quote;
  const quoteSurah = heroContent?.quoteSource || heroContent?.quoteSurah;

  const isLeftAlign = layout?.textAlignment === 'left';
  const isRightAlign = layout?.textAlignment === 'right';
  const textAlign = isLeftAlign
    ? 'text-left items-start'
    : isRightAlign
    ? 'text-right items-end'
    : 'text-center items-center';

  return (
    <section
      id="hero-section"
      className={`relative ${
        layout?.layoutStyle === 'fullscreen' ? 'min-h-screen' : 'min-h-[92vh]'
      } flex flex-col justify-end px-4 sm:px-6 pb-14 pt-20 overflow-hidden`}
    >
      {/* Background Image with Multi-Layer Scrim for High Readability */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <SmartImage
          src={heroImage}
          alt={`${brideName} & ${groomName}`}
          className="w-full h-full object-cover object-center scale-[1.02] transition-transform duration-700"
          priority={true}
          optimizeWidth={1080}
          fallbackSrc="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=75&w=1080&auto=format&fit=crop"
        />

        {/* Top Vignette (frames top) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />

        {/* Ambient Dark Scrim to calm high-exposure image highlights */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Bottom Smooth Transition to Page Body */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/85 via-50% to-transparent" />
      </div>

      {/* Content Plaque / Card for Maximum Text Contrast */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 max-w-xl mx-auto w-full flex flex-col ${textAlign}`}
      >
        <div className="w-full bg-white/95 border border-[#E8DFD3] rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-[0_16px_45px_rgba(0,0,0,0.12)] flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#B89B72]/15 border border-[#B89B72]/35 text-[#82622F] text-[11px] font-semibold tracking-[0.25em] uppercase mb-3.5 shadow-2xs"
          >
            <span>{badge}</span>
          </motion.div>

          {/* Couple Names - Silky Smooth GPU-Composited Entrance */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={
              isOpened
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 12 }
            }
            transition={{ duration: 1.0, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#12100E] leading-tight mb-2 font-medium tracking-normal drop-shadow-2xs"
          >
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              {brideName}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={isOpened ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.85, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif italic font-light mx-2 sm:mx-3 text-[#A68353] inline-block"
            >
              &amp;
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.85, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              {groomName}
            </motion.span>
          </motion.h1>

          {/* Subheading / Event Type Tag */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs sm:text-[13px] text-[#635B53] font-light tracking-[0.2em] uppercase mt-1"
          >
            The Wedding Celebration
          </motion.p>

          {/* Delicate Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isOpened ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-2 my-4 w-full max-w-[220px]"
          >
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C9B9A6] to-transparent" />
            <span className="text-[#A68353] text-xs">✦</span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C9B9A6] to-transparent" />
          </motion.div>

          {/* Event Schedule & Location Badges */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-[13px] text-[#1E1C1A] font-medium"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8DFD3] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#A68353] shrink-0" />
              <span>{eventDate}</span>
            </div>

            {eventTime && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8DFD3] shadow-2xs text-[#4A433C]">
                <span>{eventTime}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8DFD3] shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#A68353] shrink-0" />
              <span>{venue}</span>
            </div>
          </motion.div>

          {/* Quote Section with Prominent Readability */}
          {quote && (
            <div className="mt-5 pt-5 border-t border-[#E8DFD3]/90 w-full max-w-md">
              <p className="text-xs sm:text-[13px] text-[#2F2923] font-serif italic leading-relaxed text-center px-2">
                "{quote}"
              </p>
              {quoteSurah && (
                <span className="inline-block mt-2.5 px-3 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8DFD3] text-[10px] sm:text-[11px] uppercase tracking-widest text-[#82622F] font-semibold text-center">
                  — {quoteSurah}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};
