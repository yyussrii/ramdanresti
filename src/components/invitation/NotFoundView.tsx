import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  searchedSlug?: string;
  onBackToHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ searchedSlug, onBackToHome }) => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-6 py-12 text-center text-[#242220]">
      <div className="max-w-md w-full bg-white/90 border border-[#E8E1D7] rounded-2xl p-8 sm:p-10 shadow-sm">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-3">
          Status 404 &mdash; Error
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl text-[#221F1D] font-normal mb-3">
          Undangan tidak ditemukan
        </h1>

        <div className="w-10 h-[1px] bg-[#D6C7B2] mx-auto my-4" />

        <p className="text-xs sm:text-sm text-[#6B635B] font-light leading-relaxed mb-8">
          Maaf, tautan undangan{' '}
          {searchedSlug && (
            <span className="font-mono font-medium text-[#B89B72] px-2 py-0.5 bg-[#F7F3ED] rounded-sm">
              "/inv/{searchedSlug}"
            </span>
          )}{' '}
          tidak terdaftar di sistem kami. Pastikan tautan yang Anda terima sudah benar.
        </p>

        <button
          type="button"
          onClick={onBackToHome}
          className="w-full py-3 px-5 rounded-xl bg-[#242220] hover:bg-[#383431] text-white text-xs uppercase tracking-[0.2em] font-medium transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
        >
          <Home className="w-4 h-4 text-[#D4AF37]" />
          <span>Kembali ke halaman utama</span>
        </button>
      </div>
    </div>
  );
};
