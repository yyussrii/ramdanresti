import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send } from 'lucide-react';
import { GuestWish, SectionLayoutConfig } from '../../types';
import { dbService } from '../../services/dbService';

interface WishesSectionProps {
  initialWishes?: GuestWish[];
  defaultGuestName?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  layout?: SectionLayoutConfig;
}

export const WishesSection: React.FC<WishesSectionProps> = ({
  defaultGuestName,
  sectionTitle = 'Doa & Ucapan',
  sectionSubtitle = 'Ungkapan doa dan harapan terbaik dari para sahabat dan keluarga tercinta.',
  layout,
}) => {
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [guestName, setGuestName] = useState(defaultGuestName || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const paddingClass =
    layout?.paddingY === 'compact'
      ? 'py-12'
      : layout?.paddingY === 'spacious'
      ? 'py-28'
      : 'py-20';

  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    try {
      const data = await dbService.getWishes();
      setWishes(data);
    } catch (err) {
      console.error('Failed to load wishes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !message.trim()) return;

    setIsSending(true);
    try {
      const created = await dbService.addWish(guestName, message, 'hadir');
      setWishes(prev => [created, ...prev]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send wish:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="wishes-section" className={`${paddingClass} px-6 bg-[#FAF8F5]`}>
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Doa &amp; Restu
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#242220] font-normal">
            {sectionTitle}
          </h2>
          <p className="text-xs text-[#70675F] max-w-sm mx-auto mt-2 font-light leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        {/* Input Card */}
        <div className="bg-white/85 border border-[#E8E1D7] rounded-xl p-6 mb-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Nama Anda"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                required
                className="w-full bg-[#FAF8F5]/70 border border-[#E4DCCE] rounded-lg px-3.5 py-2.5 text-xs text-[#242220] placeholder-[#A0968C] focus:border-[#242220] outline-hidden transition-colors"
              />
            </div>
            <div>
              <textarea
                placeholder="Tuliskan ucapan dan doa tulus Anda..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={3}
                className="w-full bg-[#FAF8F5]/70 border border-[#E4DCCE] rounded-lg p-3 text-xs text-[#242220] placeholder-[#A0968C] focus:border-[#242220] outline-hidden transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !guestName.trim() || !message.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-[#242220] hover:bg-[#383431] text-white text-xs uppercase tracking-[0.18em] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#D8C6AE]" />
              <span>{isSending ? 'Mengirim...' : 'Kirim Ucapan'}</span>
            </button>
          </form>
        </div>

        {/* Wishes List */}
        <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
          {wishes.length === 0 ? (
            <p className="text-center text-xs text-[#8C827A] py-8 font-light">
              Belum ada ucapan. Jadilah yang pertama memberikan doa restu.
            </p>
          ) : (
            wishes.map((w) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 border border-[#E8E1D7] rounded-lg p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-medium text-xs text-[#221F1D] leading-tight">
                    {w.guestName}
                  </h4>
                  {w.createdAt && (
                    <span className="text-[10px] text-[#A69C92] font-light">
                      {new Date(w.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#524B45] font-light leading-relaxed">
                  {w.message}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
