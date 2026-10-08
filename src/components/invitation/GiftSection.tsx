import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Copy, Check } from 'lucide-react';
import { BankAccount, SectionLayoutConfig } from '../../types';

interface GiftSectionProps {
  bankAccounts: BankAccount[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  layout?: SectionLayoutConfig;
}

export const GiftSection: React.FC<GiftSectionProps> = ({
  bankAccounts,
  sectionTitle,
  sectionSubtitle,
  layout,
}) => {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const handleCopy = (accountNumber: string, bank: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  return (
    <section
      id="wedding-gift"
      className={`px-6 bg-[#FAF8F5] border-t border-[#EFE8DC] ${
        layout?.paddingY === 'compact' ? 'py-12' : layout?.paddingY === 'spacious' ? 'py-24' : 'py-20'
      }`}
    >
      <div className="max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Tanda Kasih
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#242220] font-normal">
            {sectionTitle || 'Wedding Gift'}
          </h2>
          <p className="text-xs text-[#70675F] max-w-sm mx-auto mt-2 mb-8 font-light leading-relaxed">
            {sectionSubtitle ||
              'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda bermaksud memberikan tanda kasih, kami menyediakannya melalui:'}
          </p>

          <div className="space-y-4">
            {bankAccounts.map((acc, index) => (
              <div
                key={index}
                className="bg-white/85 border border-[#E8E1D7] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="text-center sm:text-left">
                  <span className="text-[10px] uppercase tracking-widest text-[#B89B72] font-semibold block mb-0.5">
                    {acc.bank}
                  </span>
                  <p className="font-mono text-base text-[#1F1D1B] font-medium tracking-wide">
                    {acc.accountNumber}
                  </p>
                  <p className="text-xs text-[#6B635B] font-light">
                    a.n. {acc.accountName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(acc.accountNumber, acc.bank)}
                  className="w-full sm:w-auto py-2 px-4 rounded-lg bg-[#F7F3ED] hover:bg-[#EFE8DC] active:scale-95 text-[#242220] text-xs font-medium tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedBank === acc.bank ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#B89B72]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8C827A]" />
                      <span>Salin No. Rekening</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
