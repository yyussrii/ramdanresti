import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn } from 'lucide-react';
import { Invitation, SectionLayoutConfig } from '../../types';
import { SmartImage } from '../common/SmartImage';

interface GallerySectionProps {
  images: Invitation['galleryImages'];
  sectionTitle?: string;
  sectionSubtitle?: string;
  layout?: SectionLayoutConfig;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  images,
  sectionTitle,
  sectionSubtitle,
  layout,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);

  return (
    <section
      id="gallery-section"
      className={`px-4 sm:px-6 bg-[#FAF8F5] ${
        layout?.paddingY === 'compact' ? 'py-12' : layout?.paddingY === 'spacious' ? 'py-24' : 'py-20'
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Galeri Momen
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#242220] font-normal">
            {sectionTitle || 'Potret Kenangan'}
          </h2>
          <p className="text-xs text-[#8C827A] mt-2 font-light">
            {sectionSubtitle || 'Sentuh foto untuk memperbesar tampilan'}
          </p>
        </motion.div>

        {/* Asymmetric Editorial Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((item, index) => {
            // Apply subtle asymmetric layout spans for an editorial magazine feel
            const isLarge = index === 0 || index === 4;
            const spanClass = isLarge ? 'sm:col-span-2 sm:row-span-2' : '';
            const heightClass = isLarge ? 'h-80 sm:h-96' : 'h-64 sm:h-72';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                onClick={() => setSelectedImage(item)}
                className={`group relative overflow-hidden rounded-xl bg-[#EDE7DD] cursor-pointer shadow-xs ${spanClass} ${heightClass}`}
              >
                <SmartImage
                  src={item.url}
                  alt={item.caption || `Foto Momen ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Hover overlay with zoom hint */}
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between text-white">
                    {item.caption && item.caption.trim() !== '' ? (
                      <p className="text-xs font-light tracking-wide drop-shadow-sm line-clamp-1">{item.caption.trim()}</p>
                    ) : (
                      <span />
                    )}
                    <ZoomIn className="w-4 h-4 text-white/90 shrink-0 ml-auto" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          >
            <button
              onClick={() => setSelectedImage(null)}
              aria-label="Tutup foto"
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-2xl max-h-[85vh] flex flex-col items-center"
            >
              <SmartImage
                src={selectedImage.url}
                alt={selectedImage.caption || 'Foto Galeri'}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
              />
              {selectedImage.caption && selectedImage.caption.trim() !== '' && (
                <p className="text-sm font-light text-[#E8E1D7] tracking-wider text-center mt-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/10">
                  {selectedImage.caption.trim()}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
