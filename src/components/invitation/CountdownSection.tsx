import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SectionLayoutConfig } from '../../types';

interface CountdownSectionProps {
  targetDateISO: string;
  title?: string;
  subtitle?: string;
  layout?: SectionLayoutConfig;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownSection: React.FC<CountdownSectionProps> = ({
  targetDateISO,
  title,
  subtitle,
  layout,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const target = new Date(targetDateISO).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDateISO]);

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
            <p className="text-xs text-[#70675F] max-w-xs mx-auto mb-8 font-light">
              {subtitle}
            </p>
          )}
          {!subtitle && <div className="mb-8" />}

          <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-sm border border-[#E8E1D7] rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center shadow-xs"
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
        </motion.div>
      </div>
    </section>
  );
};
