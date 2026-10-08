import React from 'react';
import { motion } from 'motion/react';
import { Invitation, SectionLayoutConfig } from '../../types';

interface ClosingSectionProps {
  invitation: Invitation;
  layout?: SectionLayoutConfig;
}

export const ClosingSection: React.FC<ClosingSectionProps> = ({ invitation, layout }) => {
  const closing = invitation.content?.closing;
  const groomName = invitation.content?.hero.groomName || invitation.groomName;
  const brideName = invitation.content?.hero.brideName || invitation.brideName;

  const title = closing?.title || 'Ungkapan Terima Kasih';
  const message =
    closing?.message ||
    'Merupakan suatu kebahagiaan dan kehormatan yang tak terhingga bagi kami sekeluarga, apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.';
  const familyGreeting = closing?.familyGreeting || 'Kami Yang Berbahagia,';
  const couplesText = closing?.couplesText || `${brideName} & ${groomName}`;
  const familyText = closing?.familyText || 'Beserta Keluarga Besar Kedua Mempelai';
  const footerText = closing?.footerText;

  return (
    <section
      id="closing-section"
      className={`px-6 bg-[#FAF8F5] border-t border-[#EFE8DC] text-center ${
        layout?.paddingY === 'compact' ? 'py-12' : layout?.paddingY === 'spacious' ? 'py-28' : 'py-24'
      }`}
    >
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-3">
            {title}
          </span>

          <p className="text-xs text-[#6B635B] font-light leading-relaxed mb-8">
            {message}
          </p>

          <p className="text-xs uppercase tracking-[0.2em] text-[#8C827A] font-medium mb-3">
            {familyGreeting}
          </p>

          <h2 className="font-serif text-4xl sm:text-5xl text-[#221F1D] font-normal tracking-wide mb-3">
            {couplesText}
          </h2>

          <div className="w-12 h-[1px] bg-[#D6C7B2] mx-auto my-6" />

          <p className="text-[11px] text-[#8C827A] font-light tracking-wider">
            {familyText}
          </p>

          {footerText && (
            <p className="text-[10px] text-[#A69C92] font-light tracking-widest mt-6 uppercase">
              {footerText}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};
