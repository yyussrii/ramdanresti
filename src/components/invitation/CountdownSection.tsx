import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { SectionLayoutConfig } from '../../types';
import { parseEventDate } from '../../utils/dateParser';

interface CountdownSectionProps {
  targetDateISO?: string;
  eventDateText?: string;
  eventTimeText?: string;
  title?: string;
  subtitle?: string;
  layout?: SectionLayoutConfig;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCompleted: boolean;
}

export const CountdownSection: React.FC<CountdownSectionProps> = ({
  targetDateISO,
  eventDateText,
  eventTimeText,
  title,
  subtitle,
  layout,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isCompleted: false,
  });

  useEffect(() => {
    // Determine target timestamp:
    // 1. Try parsing eventDateText (from Hero section) - exact what user sees on cover & hero!
    // 2. Try parsing targetDateISO
    // 3. Fallback to default date
    const resolveTargetTime = (): number => {
      // Prioritize eventDateText if provided, since user configures date text in Hero
      if (eventDateText && eventDateText.trim()) {
        const fromHeroText = parseEventDate(eventDateText, eventTimeText);
        if (fromHeroText && !isNaN(fromHeroText.timestamp)) {
          return fromHeroText.timestamp;
        }
      }

      if (targetDateISO && targetDateISO.trim()) {
        const fromISO = parseEventDate(targetDateISO, eventTimeText);
        if (fromISO && !isNaN(fromISO.timestamp)) {
          return fromISO.timestamp;
        }
        const nativeTime = new Date(targetDateISO).getTime();
        if (!isNaN(nativeTime)) {
          return nativeTime;
        }
      }

      // Default fallback
      return new Date('2026-10-24T08:00:00+07:00').getTime();
    };

    const targetTimestamp = resolveTargetTime();

    const calculate = () => {
      const now = new Date().getTime();
      const difference = targetTimestamp - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isCompleted: false,
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isCompleted: true,
        });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDateISO, eventDateText, eventTimeText]);

  const items = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ];

  return (
    <section
      id="countdown-section"
      className={`px-6 bg-[#FAF8F5] relative ${
        layout?.paddingY === 'compact' ? 'py-10' : layout?.paddingY === 'spacious' ? 'py-20' : 'py-16'
      }`}
    >
      <div className="max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Save The Date
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#242220] font-normal mb-2">
            {title || 'Menghitung Hari Bahagia'}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#70675F] max-w-xs mx-auto mb-4 font-light">
              {subtitle}
            </p>
          )}

          {/* Synchronized Hero Date Badge */}
          {eventDateText && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF5EE] border border-[#E8DFD3] text-[#8C6D23] text-xs font-medium shadow-2xs mb-6">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{eventDateText}</span>
              {eventTimeText && <span className="text-[#A39281]">• {eventTimeText}</span>}
            </div>
          )}

          {!subtitle && !eventDateText && <div className="mb-8" />}

          {timeLeft.isCompleted ? (
            <div className="p-5 rounded-2xl bg-white/90 border border-[#E8E1D7] shadow-sm max-w-sm mx-auto flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#FAF5EE] border border-[#E8DFD3] flex items-center justify-center text-[#C5A059] mb-2.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#1F1D1B] font-medium">Hari Bahagia Telah Tiba</h3>
              <p className="text-xs text-[#70675F] font-light mt-1">
                Alhamdulillah, acara pernikahan telah berlangsung. Terima kasih atas doa dan restu seluruh keluarga & sahabat tercinta.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm border border-[#E8E1D7] rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-xs transition-transform hover:-translate-y-0.5 duration-200"
                >
                  <span className="font-serif text-2xl sm:text-3xl font-medium text-[#1F1D1B] leading-none mb-1">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#8C827A] font-light">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

