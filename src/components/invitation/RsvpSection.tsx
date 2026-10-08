import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Send, Users } from 'lucide-react';
import { Guest, RSVPStatus, SectionLayoutConfig } from '../../types';
import { dbService } from '../../services/dbService';

interface RsvpSectionProps {
  guest: Guest | null;
  onRsvpSuccess: (updatedGuest: Guest) => void;
  sectionTitle?: string;
  sectionSubtitle?: string;
  layout?: SectionLayoutConfig;
}

export const RsvpSection: React.FC<RsvpSectionProps> = ({
  guest,
  onRsvpSuccess,
  sectionTitle = 'RSVP',
  sectionSubtitle = 'Mohon kesediaan Bapak/Ibu/Saudara/i untuk mengonfirmasi kehadiran sebelum hari pernikahan.',
  layout,
}) => {
  const [name, setName] = useState(guest?.name || '');
  const [attendance, setAttendance] = useState<RSVPStatus>(
    guest?.rsvpStatus && guest.rsvpStatus !== 'menunggu' ? guest.rsvpStatus : 'hadir'
  );
  const [guestCount, setGuestCount] = useState<number>(guest?.guestCount || 1);
  const [notes, setNotes] = useState(guest?.rsvpNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(guest?.rsvpStatus && guest.rsvpStatus !== 'menunggu'));

  const paddingClass =
    layout?.paddingY === 'compact'
      ? 'py-12'
      : layout?.paddingY === 'spacious'
      ? 'py-28'
      : 'py-20';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;

    setIsSubmitting(true);
    try {
      const success = await dbService.submitRSVP(guest.id, attendance, guestCount, notes);
      if (success) {
        setSubmitted(true);
        onRsvpSuccess({
          ...guest,
          rsvpStatus: attendance,
          guestCount,
          rsvpNotes: notes
        });

        // Also post to wishes if notes provided
        if (notes.trim().length > 2) {
          await dbService.addWish(name, notes, attendance === 'hadir' ? 'hadir' : 'tidak_hadir');
        }
      }
    } catch (err) {
      console.error('Error submitting RSVP:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="rsvp-section" className={`${paddingClass} px-6 bg-[#FAF8F5] border-t border-[#EFE8DC]`}>
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Konfirmasi Kehadiran
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#242220] font-normal">
            {sectionTitle}
          </h2>
          <p className="text-xs text-[#70675F] max-w-sm mx-auto mt-2 font-light leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        <div className="bg-white/90 border border-[#E8E1D7] rounded-xl p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <CheckCircle2 className="w-12 h-12 text-[#B89B72] mx-auto mb-3" />
              <h3 className="font-serif text-2xl text-[#221F1D] font-normal mb-2">
                Terima Kasih Atas Konfirmasinya
              </h3>
              <p className="text-xs text-[#6B635B] font-light leading-relaxed max-w-xs mx-auto mb-6">
                Status kehadiran Anda telah berhasil tersimpan dalam sistem kami:
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F3ED] rounded-lg border border-[#E4DCCE] text-xs font-medium text-[#242220] mb-6">
                <span className="capitalize font-semibold text-[#B89B72]">
                  {attendance === 'hadir' ? 'Hadir' : attendance === 'tidak_hadir' ? 'Berhalangan Hadir' : 'Masih Ragu'}
                </span>
                <span>• {guestCount} Orang</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-[#8C827A] hover:text-[#242220] underline tracking-wider cursor-pointer"
                >
                  Ubah Konfirmasi Kehadiran
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name field (read-only or editable for guest) */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] text-[#8C827A] mb-1.5">
                  Nama Tamu
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Nama Lengkap"
                  className="w-full bg-transparent border-b border-[#D6C7B2] focus:border-[#242220] outline-hidden py-2 text-sm text-[#242220] placeholder-[#B5AAA0] transition-colors"
                />
              </div>

              {/* Attendance Options */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] text-[#8C827A] mb-2.5">
                  Konfirmasi Kehadiran
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { value: 'hadir', label: 'Hadir' },
                    { value: 'tidak_hadir', label: 'Tidak Hadir' },
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setAttendance(opt.value as RSVPStatus)}
                      className={`py-3 px-3 rounded-lg border text-xs font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                        attendance === opt.value
                          ? 'bg-[#242220] border-[#242220] text-white shadow-xs'
                          : 'bg-white border-[#E8E1D7] text-[#524B45] hover:border-[#C5B8A8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count (if attending) */}
              {attendance === 'hadir' && (
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-[#8C827A] mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#B89B72]" />
                    <span>Jumlah Kehadiran</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setGuestCount(count)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          guestCount === count
                            ? 'bg-[#F7F3ED] border-[#B89B72] text-[#221F1D] font-semibold'
                            : 'bg-white border-[#E8E1D7] text-[#7A726B]'
                        }`}
                      >
                        {count} Orang
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes / Well-wishes */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] text-[#8C827A] mb-1.5">
                  Ucapan / Doa Restu (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan ucapan dan doa Anda untuk kedua mempelai..."
                  className="w-full bg-[#FAF8F5]/60 border border-[#E8E1D7] rounded-lg p-3 text-xs text-[#242220] placeholder-[#B5AAA0] focus:border-[#242220] outline-hidden transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-lg bg-[#242220] hover:bg-[#383431] active:scale-[0.99] text-white text-xs uppercase tracking-[0.2em] font-medium transition-all duration-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5 text-[#D8C6AE]" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Kehadiran'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
