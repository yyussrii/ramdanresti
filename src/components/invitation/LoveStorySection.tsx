import React from 'react';
import { motion } from 'motion/react';
import { LoveStoryMilestone, SectionLayoutConfig } from '../../types';

interface LoveStorySectionProps {
  milestones: LoveStoryMilestone[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  layout?: SectionLayoutConfig;
}

export const LoveStorySection: React.FC<LoveStorySectionProps> = ({
  milestones,
  sectionTitle,
  sectionSubtitle,
  layout,
}) => {
  return (
    <section
      id="our-story"
      className={`px-6 bg-[#FAF8F5] border-t border-[#EFE8DC] ${
        layout?.paddingY === 'compact' ? 'py-12' : layout?.paddingY === 'spacious' ? 'py-24' : 'py-20'
      }`}
    >
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Kisah Cinta
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#242220] font-normal">
            {sectionTitle || 'Untaian Kisah Dua Hati'}
          </h2>
          {sectionSubtitle && (
            <p className="text-xs text-[#70675F] max-w-sm mx-auto mt-2 font-light">
              {sectionSubtitle}
            </p>
          )}
          <div className="w-10 h-[1px] bg-[#D6C7B2] mx-auto mt-4" />
        </motion.div>

        <div className="relative pl-6 sm:pl-8 border-l border-[#E5DDD2] space-y-12">
          {milestones.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Dot on timeline */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#FAF8F5] border-2 border-[#B89B72]" />

              <span className="text-xs font-mono tracking-widest text-[#B89B72] font-semibold block mb-1">
                {item.year}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[#221F1D] font-normal mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-[#6B635B] font-light leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
