import React from 'react';
import { motion } from 'motion/react';
import { Instagram } from 'lucide-react';
import { CoupleContent, CoupleProfile, SectionLayoutConfig } from '../../types';
import { SmartImage } from '../common/SmartImage';

interface CoupleSectionProps {
  content: CoupleContent;
  layout?: SectionLayoutConfig;
}

export const CoupleSection: React.FC<CoupleSectionProps> = ({ content, layout }) => {
  const { groom, bride } = content;
  const groomPhoto = groom.photoUrl || groom.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop';
  const bridePhoto = bride.photoUrl || bride.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop';

  // Helper to format parents text if custom or separate fields were edited
  const getParentsText = (profile: CoupleProfile) => {
    if (profile.parents && profile.parents.trim()) {
      return profile.parents.trim();
    }
    const parts: string[] = [];
    if (profile.childOrderText?.trim()) {
      parts.push(profile.childOrderText.trim());
    }
    const parentsList: string[] = [];
    if (profile.fatherName?.trim()) {
      const f = profile.fatherName.trim();
      parentsList.push(f.startsWith('Bpk') ? f : `Bpk. ${f}`);
    }
    if (profile.motherName?.trim()) {
      const m = profile.motherName.trim();
      parentsList.push(m.startsWith('Ibu') ? m : `Ibu ${m}`);
    }
    if (parentsList.length > 0) {
      parts.push(parentsList.join(' & '));
    }
    return parts.join(' ');
  };

  const groomParentsText = getParentsText(groom);
  const brideParentsText = getParentsText(bride);

  const getCleanInstagramHandle = (handle?: string) => {
    if (!handle) return '';
    return handle.replace(/^@/, '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
  };

  const groomInstagramClean = getCleanInstagramHandle(groom.instagram);
  const brideInstagramClean = getCleanInstagramHandle(bride.instagram);

  return (
    <section
      id="couple-section"
      className={`relative px-6 ${
        layout?.paddingY === 'compact' ? 'py-12' : layout?.paddingY === 'spacious' ? 'py-24' : 'py-16'
      } border-b border-[#EFE8DC]/80`}
    >
      <div className="max-w-xl mx-auto text-center">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Maha Suci Allah SWT
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#221F1D] font-normal mb-3">
            {content.sectionTitle || 'Kedua Mempelai'}
          </h2>
          <div className="w-10 h-[1px] bg-[#D6C7B2] mx-auto mb-4" />
          <p className="text-xs text-[#7A726B] font-light max-w-md mx-auto leading-relaxed">
            {content.sectionSubtitle ||
              'Maha Suci Allah SWT yang telah menciptakan makhluk-Nya berpasang-pasangan.'}
          </p>
        </motion.div>

        {/* Couple Cards - Mempelai Wanita (Bride) Dulu, lalu Mempelai Pria (Groom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Bride Card (Mempelai Wanita) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center p-6 rounded-2xl bg-white/70 border border-[#EFE8DC] shadow-sm backdrop-blur-xs text-center"
          >
            <div className="w-32 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden mb-4 shadow-sm border-2 border-[#FAF8F5]">
              <SmartImage
                src={bridePhoto}
                alt={bride.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="font-serif text-2xl text-[#221F1D] font-medium mb-1">
              {bride.name}
            </h3>
            <p className="text-xs font-semibold text-[#8C827A] mb-2 tracking-wide">
              {bride.fullNameWithTitles || bride.fullName}
            </p>
            {brideParentsText && (
              <p className="text-[11px] text-[#7A726B] font-light leading-relaxed mb-3">
                {brideParentsText}
              </p>
            )}
            {bride.description && bride.description.trim() && (
              <p className="text-[11px] text-[#9E958C] font-light italic mb-3 leading-relaxed">
                &ldquo;{bride.description.trim()}&rdquo;
              </p>
            )}
            {brideInstagramClean && (
              <div className="mt-auto pt-2">
                <a
                  href={`https://instagram.com/${brideInstagramClean}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] text-[#7A726B] bg-[#F7F3EE] hover:bg-[#EFE9E1] transition-colors"
                >
                  <Instagram className="w-3 h-3 text-[#B89B72]" />
                  <span>@{brideInstagramClean}</span>
                </a>
              </div>
            )}
          </motion.div>

          {/* Groom Card (Mempelai Pria) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex flex-col items-center p-6 rounded-2xl bg-white/70 border border-[#EFE8DC] shadow-sm backdrop-blur-xs text-center"
          >
            <div className="w-32 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden mb-4 shadow-sm border-2 border-[#FAF8F5]">
              <SmartImage
                src={groomPhoto}
                alt={groom.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="font-serif text-2xl text-[#221F1D] font-medium mb-1">
              {groom.name}
            </h3>
            <p className="text-xs font-semibold text-[#8C827A] mb-2 tracking-wide">
              {groom.fullNameWithTitles || groom.fullName}
            </p>
            {groomParentsText && (
              <p className="text-[11px] text-[#7A726B] font-light leading-relaxed mb-3">
                {groomParentsText}
              </p>
            )}
            {groom.description && groom.description.trim() && (
              <p className="text-[11px] text-[#9E958C] font-light italic mb-3 leading-relaxed">
                &ldquo;{groom.description.trim()}&rdquo;
              </p>
            )}
            {groomInstagramClean && (
              <div className="mt-auto pt-2">
                <a
                  href={`https://instagram.com/${groomInstagramClean}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] text-[#7A726B] bg-[#F7F3EE] hover:bg-[#EFE9E1] transition-colors"
                >
                  <Instagram className="w-3 h-3 text-[#B89B72]" />
                  <span>@{groomInstagramClean}</span>
                </a>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
