import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Heart,
  CreditCard,
  Gift,
  BookOpen,
  Instagram,
  RefreshCw,
} from 'lucide-react';
import { ContentConfig, LoveStoryMilestone, BankAccount } from '../../types';
import { ImageUploaderField } from './ImageUploaderField';

interface ContentEditorProps {
  content: ContentConfig;
  onChange: (updatedContent: ContentConfig) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({ content, onChange }) => {
  // Accordion open state
  const [openSection, setOpenSection] = useState<string>('hero');
  const [activeCoupleTab, setActiveCoupleTab] = useState<'bride' | 'groom'>('bride');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? '' : id);
  };

  // Helper update functions
  const updateOpening = (fields: Partial<ContentConfig['opening']>) => {
    onChange({
      ...content,
      opening: { ...content.opening, ...fields },
    });
  };

  const updateHero = (fields: Partial<ContentConfig['hero']>) => {
    onChange({
      ...content,
      hero: { ...content.hero, ...fields },
    });
  };

  const updateCouple = (fields: Partial<ContentConfig['couple']>) => {
    onChange({
      ...content,
      couple: { ...content.couple, ...fields },
    });
  };

  const formatParentsString = (childOrder?: string, father?: string, mother?: string) => {
    const parts: string[] = [];
    if (childOrder?.trim()) parts.push(childOrder.trim());
    const parentsList: string[] = [];
    if (father?.trim()) {
      const f = father.trim();
      parentsList.push(f.startsWith('Bpk') ? f : `Bpk. ${f}`);
    }
    if (mother?.trim()) {
      const m = mother.trim();
      parentsList.push(m.startsWith('Ibu') ? m : `Ibu ${m}`);
    }
    if (parentsList.length > 0) {
      parts.push(parentsList.join(' & '));
    }
    return parts.join(' ');
  };

  const updateGroom = (fields: Partial<ContentConfig['couple']['groom']>) => {
    const updatedGroom = { ...content.couple.groom, ...fields };

    // Align fullName and fullNameWithTitles
    if (fields.fullNameWithTitles !== undefined && !fields.fullName) {
      updatedGroom.fullName = fields.fullNameWithTitles;
    } else if (fields.fullName !== undefined && !fields.fullNameWithTitles) {
      updatedGroom.fullNameWithTitles = fields.fullName;
    }

    const nextContent: ContentConfig = {
      ...content,
      couple: {
        ...content.couple,
        groom: updatedGroom,
      },
    };

    // Keep hero and closing in sync if groom's name is updated
    if (fields.name && fields.name.trim()) {
      nextContent.hero = {
        ...nextContent.hero,
        groomName: fields.name.trim(),
      };
      if (nextContent.closing) {
        nextContent.closing = {
          ...nextContent.closing,
          couplesText: `${content.couple.bride.name || 'Resti'} & ${fields.name.trim()}`,
        };
      }
    }

    onChange(nextContent);
  };

  const updateBride = (fields: Partial<ContentConfig['couple']['bride']>) => {
    const updatedBride = { ...content.couple.bride, ...fields };

    // Align fullName and fullNameWithTitles
    if (fields.fullNameWithTitles !== undefined && !fields.fullName) {
      updatedBride.fullName = fields.fullNameWithTitles;
    } else if (fields.fullName !== undefined && !fields.fullNameWithTitles) {
      updatedBride.fullNameWithTitles = fields.fullName;
    }

    const nextContent: ContentConfig = {
      ...content,
      couple: {
        ...content.couple,
        bride: updatedBride,
      },
    };

    // Keep hero and closing in sync if bride's name is updated
    if (fields.name && fields.name.trim()) {
      nextContent.hero = {
        ...nextContent.hero,
        brideName: fields.name.trim(),
      };
      if (nextContent.closing) {
        nextContent.closing = {
          ...nextContent.closing,
          couplesText: `${fields.name.trim()} & ${content.couple.groom.name || 'Ramdan'}`,
        };
      }
    }

    onChange(nextContent);
  };

  const updateCountdown = (fields: Partial<ContentConfig['countdown']>) => {
    onChange({
      ...content,
      countdown: { ...content.countdown, ...fields },
    });
  };

  const updateAkad = (fields: Partial<ContentConfig['event']['akad']>) => {
    onChange({
      ...content,
      event: {
        ...content.event,
        akad: { ...content.event.akad, ...fields },
      },
    });
  };

  const updateResepsi = (fields: Partial<ContentConfig['event']['resepsi']>) => {
    onChange({
      ...content,
      event: {
        ...content.event,
        resepsi: { ...content.event.resepsi, ...fields },
      },
    });
  };

  const updateClosing = (fields: Partial<ContentConfig['closing']>) => {
    onChange({
      ...content,
      closing: { ...content.closing, ...fields },
    });
  };

  // Milestones Handlers
  const handleAddMilestone = () => {
    const newMilestone: LoveStoryMilestone = {
      year: new Date().getFullYear().toString(),
      title: 'Babak Baru',
      description: 'Tuliskan momen indah perjalanan cinta Anda di sini.',
    };
    onChange({
      ...content,
      story: {
        ...content.story,
        milestones: [...content.story.milestones, newMilestone],
      },
    });
  };

  const handleUpdateMilestone = (index: number, fields: Partial<LoveStoryMilestone>) => {
    const updated = [...content.story.milestones];
    updated[index] = { ...updated[index], ...fields };
    onChange({
      ...content,
      story: { ...content.story, milestones: updated },
    });
  };

  const handleDeleteMilestone = (index: number) => {
    const updated = content.story.milestones.filter((_, i) => i !== index);
    onChange({
      ...content,
      story: { ...content.story, milestones: updated },
    });
  };

  // Bank Accounts Handlers
  const handleAddBankAccount = () => {
    const holder = `${content.hero.groomName} / ${content.hero.brideName}`;
    const newAccount: BankAccount = {
      bank: 'BCA',
      accountNumber: '1234567890',
      accountName: holder,
      accountHolder: holder,
    };
    onChange({
      ...content,
      gift: {
        ...content.gift,
        bankAccounts: [...content.gift.bankAccounts, newAccount],
      },
    });
  };

  const handleUpdateBankAccount = (index: number, fields: Partial<BankAccount>) => {
    const updated = [...content.gift.bankAccounts];
    updated[index] = { ...updated[index], ...fields };
    onChange({
      ...content,
      gift: { ...content.gift, bankAccounts: updated },
    });
  };

  const handleDeleteBankAccount = (index: number) => {
    const updated = content.gift.bankAccounts.filter((_, i) => i !== index);
    onChange({
      ...content,
      gift: { ...content.gift, bankAccounts: updated },
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      <div className="mb-2">
        <h3 className="font-serif text-2xl text-[#1F1D1B] font-medium">
          Editor Konten Undangan
        </h3>
        <p className="text-xs text-[#8C827A] font-light mt-0.5">
          Edit seluruh teks, nama, tanggal, lokasi, hingga cerita cinta secara visual tanpa menyentuh source code.
        </p>
      </div>

      {/* 1. Cover Pembuka (Opening) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('opening')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Cover Pembuka (Opening Screen)</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Salam pembuka, teks undangan, dan tombol 'Buka Undangan'
              </p>
            </div>
          </div>
          {openSection === 'opening' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'opening' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Label Atas</label>
                <input
                  type="text"
                  value={content.opening.weddingLabel}
                  onChange={(e) => updateOpening({ weddingLabel: e.target.value })}
                  placeholder="The Wedding Of"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Salam Pembuka</label>
                <input
                  type="text"
                  value={content.opening.greeting}
                  onChange={(e) => updateOpening({ greeting: e.target.value })}
                  placeholder="Kepada Yth. Bapak/Ibu/Saudara/i"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Teks Tombol Buka</label>
                <input
                  type="text"
                  value={content.opening.openButtonText}
                  onChange={(e) => updateOpening({ openButtonText: e.target.value })}
                  placeholder="Buka Undangan"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Catatan Tambahan (Kecil)</label>
                <input
                  type="text"
                  value={content.opening.invitationNote || ''}
                  onChange={(e) => updateOpening({ invitationNote: e.target.value })}
                  placeholder="Mohon maaf apabila ada kesalahan penulisan nama/gelar"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Hero Section */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('hero')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Hero &amp; Nama Mempelai</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Nama panggilan utama, foto cover, kutipan ayat, tanggal ringkas
              </p>
            </div>
          </div>
          {openSection === 'hero' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'hero' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Nama Panggilan Wanita (Mempelai Wanita)</label>
                <input
                  type="text"
                  value={content.hero.brideName}
                  onChange={(e) => updateHero({ brideName: e.target.value })}
                  placeholder="Resti"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Nama Panggilan Pria (Mempelai Pria)</label>
                <input
                  type="text"
                  value={content.hero.groomName}
                  onChange={(e) => updateHero({ groomName: e.target.value })}
                  placeholder="Ramdan"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <ImageUploaderField
                label="Foto Cover / Hero Utama"
                sublabel="Seret & lepas foto JPG/PNG langsung ke kotak di bawah atau pilih dari galeri database"
                value={content.hero.heroImageUrl || content.hero.heroImage || ''}
                onChange={(url) => updateHero({ heroImageUrl: url, heroImage: url })}
                category="hero"
                aspectRatio="landscape"
                placeholderName="Cover Hero"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Tanggal Acara (Teks)</label>
                <input
                  type="text"
                  value={content.hero.eventDateText}
                  onChange={(e) => updateHero({ eventDateText: e.target.value })}
                  placeholder="Sabtu, 24 Oktober 2026"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Waktu</label>
                <input
                  type="text"
                  value={content.hero.eventTimeText}
                  onChange={(e) => updateHero({ eventTimeText: e.target.value })}
                  placeholder="08.00 WIB - Selesai"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Kota / Venue Singkat</label>
                <input
                  type="text"
                  value={content.hero.eventLocationText}
                  onChange={(e) => updateHero({ eventLocationText: e.target.value })}
                  placeholder="Jakarta Selatan"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#3D3833] mb-1">Kutipan Rohani / Ayat Suci</label>
              <textarea
                rows={3}
                value={content.hero.quote}
                onChange={(e) => updateHero({ quote: e.target.value })}
                placeholder="Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan..."
                className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#3D3833] mb-1">Sumber Kutipan / Surah</label>
              <input
                type="text"
                value={content.hero.quoteSource}
                onChange={(e) => updateHero({ quoteSource: e.target.value })}
                placeholder="QS. Ar-Rum: 21"
                className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Profil Kedua Mempelai (Couple) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('couple')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Profil Kedua Mempelai</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Gelar lengkap, nama orang tua, urutan anak, dan foto potret
              </p>
            </div>
          </div>
          {openSection === 'couple' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'couple' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-6 text-xs">
            {/* Header copy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Judul Section</label>
                <input
                  type="text"
                  value={content.couple.sectionTitle}
                  onChange={(e) => updateCouple({ sectionTitle: e.target.value })}
                  placeholder="Kedua Mempelai"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Subtitle / Pengantar</label>
                <input
                  type="text"
                  value={content.couple.sectionSubtitle}
                  onChange={(e) => updateCouple({ sectionSubtitle: e.target.value })}
                  placeholder="Dengan memohon rahmat dan ridho Allah SWT..."
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Couple Sub-Tabs: Mempelai Wanita (Bride) Dulu, lalu Mempelai Pria (Groom) */}
            <div className="flex items-center gap-2 p-1 bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl max-w-md">
              <button
                type="button"
                onClick={() => setActiveCoupleTab('bride')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all cursor-pointer text-center ${
                  activeCoupleTab === 'bride'
                    ? 'bg-white text-[#1F1D1B] shadow-xs border border-[#E8DFD3] font-semibold text-[#8C6D23]'
                    : 'text-[#70675F] hover:text-[#1F1D1B] font-medium'
                }`}
              >
                1. Mempelai Wanita ({content.couple.bride.name || 'Resti'})
              </button>
              <button
                type="button"
                onClick={() => setActiveCoupleTab('groom')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all cursor-pointer text-center ${
                  activeCoupleTab === 'groom'
                    ? 'bg-white text-[#1F1D1B] shadow-xs border border-[#E8DFD3] font-semibold text-[#8C6D23]'
                    : 'text-[#70675F] hover:text-[#1F1D1B] font-medium'
                }`}
              >
                2. Mempelai Pria ({content.couple.groom.name || 'Ramdan'})
              </button>
            </div>

            {/* Groom Details */}
            {activeCoupleTab === 'groom' && (
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#EFE8DC] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
                <h5 className="font-semibold text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <span>Mempelai Pria (Groom)</span>
                </h5>
                <span className="text-[10px] text-[#A69C92]">Tampil di landing page &amp; undangan</span>
              </div>

              {/* Names: Short Name & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1">
                    Nama Panggilan (Short Name)
                  </label>
                  <input
                    type="text"
                    value={content.couple.groom.name}
                    onChange={(e) => updateGroom({ name: e.target.value })}
                    placeholder="Ramdan"
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Nama singkat yang tampil di cover &amp; headline</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1">
                    Nama Lengkap &amp; Gelar
                  </label>
                  <input
                    type="text"
                    value={content.couple.groom.fullNameWithTitles || content.couple.groom.fullName}
                    onChange={(e) => updateGroom({ fullNameWithTitles: e.target.value, fullName: e.target.value })}
                    placeholder="Ramdan Pratama, S.T."
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Nama resmi yang tampil di profil kartu mempelai</p>
                </div>
              </div>

              {/* Parents Section */}
              <div className="p-3 bg-[#FAF8F5]/80 rounded-xl border border-[#E8DFD3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#3D3833]">Data Orang Tua Mempelai Pria</span>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = formatParentsString(
                        content.couple.groom.childOrderText,
                        content.couple.groom.fatherName,
                        content.couple.groom.motherName
                      );
                      if (auto) updateGroom({ parents: auto });
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-[#C5A059] hover:text-[#9F7E3B] font-medium cursor-pointer"
                    title="Buat ulang teks gabungan otomatis dari Urutan Anak, Nama Ayah, dan Ibu"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sinkronkan ke Teks Gabungan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#70675F] mb-1">Urutan Anak</label>
                    <input
                      type="text"
                      value={content.couple.groom.childOrderText || ''}
                      onChange={(e) => {
                        const newChild = e.target.value;
                        const auto = formatParentsString(
                          newChild,
                          content.couple.groom.fatherName,
                          content.couple.groom.motherName
                        );
                        updateGroom({ childOrderText: newChild, parents: auto });
                      }}
                      placeholder="Putra kedua dari"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#70675F] mb-1">Nama Ayah</label>
                    <input
                      type="text"
                      value={content.couple.groom.fatherName || ''}
                      onChange={(e) => {
                        const newFather = e.target.value;
                        const auto = formatParentsString(
                          content.couple.groom.childOrderText,
                          newFather,
                          content.couple.groom.motherName
                        );
                        updateGroom({ fatherName: newFather, parents: auto });
                      }}
                      placeholder="Bpk. Bambang Haryanto"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#70675F] mb-1">Nama Ibu</label>
                    <input
                      type="text"
                      value={content.couple.groom.motherName || ''}
                      onChange={(e) => {
                        const newMother = e.target.value;
                        const auto = formatParentsString(
                          content.couple.groom.childOrderText,
                          content.couple.groom.fatherName,
                          newMother
                        );
                        updateGroom({ motherName: newMother, parents: auto });
                      }}
                      placeholder="Ibu Endah Susilowati"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#70675F] mb-1">
                    Teks Keterangan Orang Tua (Muncul di Halaman Undangan)
                  </label>
                  <input
                    type="text"
                    value={content.couple.groom.parents || ''}
                    onChange={(e) => updateGroom({ parents: e.target.value })}
                    placeholder="Putra kedua dari Bpk. Bambang Haryanto & Ibu Endah Susilowati"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">
                    Kalimat ini ditampilkan tepat di bawah nama mempelai pada landing page undangan
                  </p>
                </div>
              </div>

              {/* Instagram & Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1 flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-[#C5A059]" />
                    <span>Akun Instagram Mempelai Pria</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#A69C92] text-xs">@</span>
                    <input
                      type="text"
                      value={(content.couple.groom.instagram || '').replace(/^@/, '')}
                      onChange={(e) => {
                        const val = e.target.value.trim().replace(/^@/, '');
                        updateGroom({ instagram: val ? `@${val}` : '' });
                      }}
                      placeholder="ramdanpratama"
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Tautan tombol Instagram di kartu profil (opsional)</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1">
                    Deskripsi / Bio Singkat Mempelai Pria
                  </label>
                  <textarea
                    rows={2}
                    value={content.couple.groom.description || ''}
                    onChange={(e) => updateGroom({ description: e.target.value })}
                    placeholder="Pribadi yang penuh semangat dengan kecintaan mendalam pada arsitektur..."
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059] leading-relaxed"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Kutipan atau deskripsi kepribadian di bawah profil (opsional)</p>
                </div>
              </div>

              {/* Photo */}
              <div>
                <ImageUploaderField
                  label="Foto Potret Mempelai Pria"
                  sublabel="Format JPG/PNG dengan seret & lepas atau pilih dari galeri media"
                  value={content.couple.groom.photoUrl || content.couple.groom.image || ''}
                  onChange={(url) => updateGroom({ photoUrl: url, image: url })}
                  category="couple"
                  aspectRatio="portrait"
                  placeholderName="Mempelai Pria"
                />
              </div>
            </div>
            )}

            {/* Bride Details */}
            {activeCoupleTab === 'bride' && (
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#EFE8DC] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
                <h5 className="font-semibold text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                  <span>Mempelai Wanita (Bride)</span>
                </h5>
                <span className="text-[10px] text-[#A69C92]">Tampil di landing page &amp; undangan</span>
              </div>

              {/* Names: Short Name & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1">
                    Nama Panggilan (Short Name)
                  </label>
                  <input
                    type="text"
                    value={content.couple.bride.name}
                    onChange={(e) => updateBride({ name: e.target.value })}
                    placeholder="Resti"
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Nama singkat yang tampil di cover &amp; headline</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1">
                    Nama Lengkap &amp; Gelar
                  </label>
                  <input
                    type="text"
                    value={content.couple.bride.fullNameWithTitles || content.couple.bride.fullName}
                    onChange={(e) => updateBride({ fullNameWithTitles: e.target.value, fullName: e.target.value })}
                    placeholder="Resti Azzahra, S.Ds."
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Nama resmi yang tampil di profil kartu mempelai</p>
                </div>
              </div>

              {/* Parents Section */}
              <div className="p-3 bg-[#FAF8F5]/80 rounded-xl border border-[#E8DFD3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#3D3833]">Data Orang Tua Mempelai Wanita</span>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = formatParentsString(
                        content.couple.bride.childOrderText,
                        content.couple.bride.fatherName,
                        content.couple.bride.motherName
                      );
                      if (auto) updateBride({ parents: auto });
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-[#C5A059] hover:text-[#9F7E3B] font-medium cursor-pointer"
                    title="Buat ulang teks gabungan otomatis dari Urutan Anak, Nama Ayah, dan Ibu"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sinkronkan ke Teks Gabungan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#70675F] mb-1">Urutan Anak</label>
                    <input
                      type="text"
                      value={content.couple.bride.childOrderText || ''}
                      onChange={(e) => {
                        const newChild = e.target.value;
                        const auto = formatParentsString(
                          newChild,
                          content.couple.bride.fatherName,
                          content.couple.bride.motherName
                        );
                        updateBride({ childOrderText: newChild, parents: auto });
                      }}
                      placeholder="Putri pertama dari"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#70675F] mb-1">Nama Ayah</label>
                    <input
                      type="text"
                      value={content.couple.bride.fatherName || ''}
                      onChange={(e) => {
                        const newFather = e.target.value;
                        const auto = formatParentsString(
                          content.couple.bride.childOrderText,
                          newFather,
                          content.couple.bride.motherName
                        );
                        updateBride({ fatherName: newFather, parents: auto });
                      }}
                      placeholder="Bpk. Ir. Hendra Gunawan"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#70675F] mb-1">Nama Ibu</label>
                    <input
                      type="text"
                      value={content.couple.bride.motherName || ''}
                      onChange={(e) => {
                        const newMother = e.target.value;
                        const auto = formatParentsString(
                          content.couple.bride.childOrderText,
                          content.couple.bride.fatherName,
                          newMother
                        );
                        updateBride({ motherName: newMother, parents: auto });
                      }}
                      placeholder="Ibu Maya Savitri"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#70675F] mb-1">
                    Teks Keterangan Orang Tua (Muncul di Halaman Undangan)
                  </label>
                  <input
                    type="text"
                    value={content.couple.bride.parents || ''}
                    onChange={(e) => updateBride({ parents: e.target.value })}
                    placeholder="Putri pertama dari Bpk. Ir. Hendra Gunawan & Ibu Maya Savitri"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">
                    Kalimat ini ditampilkan tepat di bawah nama mempelai pada landing page undangan
                  </p>
                </div>
              </div>

              {/* Instagram & Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1 flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-[#C5A059]" />
                    <span>Akun Instagram Mempelai Wanita</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#A69C92] text-xs">@</span>
                    <input
                      type="text"
                      value={(content.couple.bride.instagram || '').replace(/^@/, '')}
                      onChange={(e) => {
                        const val = e.target.value.trim().replace(/^@/, '');
                        updateBride({ instagram: val ? `@${val}` : '' });
                      }}
                      placeholder="restiazzahra"
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Tautan tombol Instagram di kartu profil (opsional)</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#3D3833] mb-1">
                    Deskripsi / Bio Singkat Mempelai Wanita
                  </label>
                  <textarea
                    rows={2}
                    value={content.couple.bride.description || ''}
                    onChange={(e) => updateBride({ description: e.target.value })}
                    placeholder="Sosok yang hangat dan ceria, memandang cinta sebagai ruang terindah..."
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg focus:outline-none focus:border-[#C5A059] leading-relaxed"
                  />
                  <p className="text-[10px] text-[#A69C92] mt-0.5">Kutipan atau deskripsi kepribadian di bawah profil (opsional)</p>
                </div>
              </div>

              {/* Photo */}
              <div>
                <ImageUploaderField
                  label="Foto Potret Mempelai Wanita"
                  sublabel="Format JPG/PNG dengan seret & lepas atau pilih dari galeri media"
                  value={content.couple.bride.photoUrl || content.couple.bride.image || ''}
                  onChange={(url) => updateBride({ photoUrl: url, image: url })}
                  category="couple"
                  aspectRatio="portrait"
                  placeholderName="Mempelai Wanita"
                />
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Rangkaian Acara (Akad & Resepsi) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('event')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Rangkaian Acara (Akad &amp; Resepsi)</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Tanggal, jam, lokasi venue, alamat lengkap, dan tautan Google Maps
              </p>
            </div>
          </div>
          {openSection === 'event' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'event' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-6 text-xs">
            {/* Akad Nikah Form */}
            <div className="p-4 rounded-xl bg-white border border-[#EFE8DC] space-y-3">
              <h5 className="font-semibold text-[#1F1D1B] text-xs uppercase tracking-wider text-[#C5A059]">
                Sesi 1: Akad Nikah
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Judul Acara</label>
                  <input
                    type="text"
                    value={content.event.akad.title}
                    onChange={(e) => updateAkad({ title: e.target.value })}
                    placeholder="Akad Nikah"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    value={content.event.akad.timeFormatted}
                    onChange={(e) => updateAkad({ timeFormatted: e.target.value })}
                    placeholder="08:00 - 10:00 WIB"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Nama Tempat / Venue</label>
                  <input
                    type="text"
                    value={content.event.akad.venueName}
                    onChange={(e) => updateAkad({ venueName: e.target.value })}
                    placeholder="Masjid Agung Al-Azhar"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Tanggal</label>
                  <input
                    type="text"
                    value={content.event.akad.dateFormatted}
                    onChange={(e) => updateAkad({ dateFormatted: e.target.value })}
                    placeholder="Sabtu, 24 Oktober 2026"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#70675F] mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={content.event.akad.address}
                  onChange={(e) => updateAkad({ address: e.target.value })}
                  placeholder="Jl. Sisingamangaraja No. 1, Kebayoran Baru, Jakarta Selatan"
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#70675F] mb-1">Tautan Google Maps</label>
                <input
                  type="url"
                  value={content.event.akad.mapsUrl}
                  onChange={(e) => updateAkad({ mapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                />
              </div>
            </div>

            {/* Resepsi Pernikahan Form */}
            <div className="p-4 rounded-xl bg-white border border-[#EFE8DC] space-y-3">
              <h5 className="font-semibold text-[#1F1D1B] text-xs uppercase tracking-wider text-[#C5A059]">
                Sesi 2: Resepsi Pernikahan
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Judul Acara</label>
                  <input
                    type="text"
                    value={content.event.resepsi.title}
                    onChange={(e) => updateResepsi({ title: e.target.value })}
                    placeholder="Resepsi Pernikahan"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    value={content.event.resepsi.timeFormatted}
                    onChange={(e) => updateResepsi({ timeFormatted: e.target.value })}
                    placeholder="11:00 - 14:00 WIB"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Nama Tempat / Venue</label>
                  <input
                    type="text"
                    value={content.event.resepsi.venueName}
                    onChange={(e) => updateResepsi({ venueName: e.target.value })}
                    placeholder="The Tribrata Darmawangsa"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#70675F] mb-1">Tanggal</label>
                  <input
                    type="text"
                    value={content.event.resepsi.dateFormatted}
                    onChange={(e) => updateResepsi({ dateFormatted: e.target.value })}
                    placeholder="Sabtu, 24 Oktober 2026"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#70675F] mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={content.event.resepsi.address}
                  onChange={(e) => updateResepsi({ address: e.target.value })}
                  placeholder="Jl. Darmawangsa III No.2, Pulo, Kebayoran Baru, Jakarta Selatan"
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#70675F] mb-1">Tautan Google Maps</label>
                <input
                  type="url"
                  value={content.event.resepsi.mapsUrl}
                  onChange={(e) => updateResepsi({ mapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Kisah Cinta (Love Story) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('story')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Kisah Cinta (Love Story Milestones)</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Linimasa perjalanan dari pertama bertemu, komitmen, hingga lamaran
              </p>
            </div>
          </div>
          {openSection === 'story' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'story' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Judul Section</label>
                <input
                  type="text"
                  value={content.story.sectionTitle}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      story: { ...content.story, sectionTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Subtitle</label>
                <input
                  type="text"
                  value={content.story.sectionSubtitle || ''}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      story: { ...content.story, sectionSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#3D3833]">Daftar Babak Cerita:</span>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C5A059] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Milestone</span>
                </button>
              </div>

              {content.story.milestones.map((m, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-white rounded-xl border border-[#EFE8DC] space-y-2 relative"
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(index)}
                    title="Hapus Momen"
                    className="absolute top-3 right-3 text-[#EF4444] p-1 rounded hover:bg-[#EF4444]/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-3 gap-2 pr-8">
                    <div>
                      <label className="block text-[10px] text-[#8C827A] mb-0.5">Tahun</label>
                      <input
                        type="text"
                        value={m.year}
                        onChange={(e) => handleUpdateMilestone(index, { year: e.target.value })}
                        className="w-full px-2.5 py-1 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-[#8C827A] mb-0.5">Judul Momen</label>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleUpdateMilestone(index, { title: e.target.value })}
                        className="w-full px-2.5 py-1 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8C827A] mb-0.5">Deskripsi Cerita</label>
                    <textarea
                      rows={2}
                      value={m.description}
                      onChange={(e) => handleUpdateMilestone(index, { description: e.target.value })}
                      className="w-full px-2.5 py-1 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Galeri Momen (Gallery & Captions) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('gallery')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Galeri Momen &amp; Deskripsi Foto</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Atur judul seksi galeri dan edit nama / deskripsi untuk setiap foto (kosongkan jika tanpa nama)
              </p>
            </div>
          </div>
          {openSection === 'gallery' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'gallery' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Judul Seksi Galeri</label>
                <input
                  type="text"
                  value={content.gallery.sectionTitle}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      gallery: { ...content.gallery, sectionTitle: e.target.value },
                    })
                  }
                  placeholder="Potret Kenangan"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Subjudul / Petunjuk</label>
                <input
                  type="text"
                  value={content.gallery.sectionSubtitle || ''}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      gallery: { ...content.gallery, sectionSubtitle: e.target.value },
                    })
                  }
                  placeholder="Sentuh foto untuk memperbesar tampilan"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#3D3833]">
                  Daftar Foto di Galeri ({content.gallery.images.length}):
                </span>
                <span className="text-[11px] text-[#8C827A]">
                  *Kosongkan deskripsi jika foto tidak ingin menampilkan teks
                </span>
              </div>

              {content.gallery.images.length === 0 ? (
                <p className="text-[#8C827A] italic py-3 text-center bg-white rounded-xl border border-[#E8DFD3]">
                  Belum ada foto di galeri. Buka menu Kelola Media untuk menambahkan foto.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {content.gallery.images.map((img, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white rounded-xl border border-[#EFE8DC] flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[#E8DFD3] bg-[#FAF8F5]">
                        <img
                          src={img.url}
                          alt={img.caption || `Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] text-[#8C827A] mb-0.5">
                          Nama / Deskripsi Foto #{index + 1}
                        </label>
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={(e) => {
                            const updated = [...content.gallery.images];
                            updated[index] = { ...updated[index], caption: e.target.value };
                            onChange({
                              ...content,
                              gallery: { ...content.gallery, images: updated },
                            });
                          }}
                          placeholder="Contoh: Momen Lamaran (atau kosongkan)"
                          className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-xs focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.gallery.images.filter((_, i) => i !== index);
                          onChange({
                            ...content,
                            gallery: { ...content.gallery, images: updated },
                          });
                        }}
                        title="Hapus foto dari galeri"
                        className="text-[#EF4444] p-1.5 rounded-lg hover:bg-[#EF4444]/10 cursor-pointer self-end sm:self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Amplop Digital / Rekening (Gift) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('gift')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Amplop Digital / Tanda Kasih</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Daftar nomor rekening bank dan nama penerima untuk transfer kado
              </p>
            </div>
          </div>
          {openSection === 'gift' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'gift' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Judul Section</label>
                <input
                  type="text"
                  value={content.gift.sectionTitle}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      gift: { ...content.gift, sectionTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Pesan Pengantar</label>
                <input
                  type="text"
                  value={content.gift.sectionSubtitle || ''}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      gift: { ...content.gift, sectionSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#3D3833]">Daftar Rekening Bank:</span>
                <button
                  type="button"
                  onClick={handleAddBankAccount}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C5A059] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Rekening</span>
                </button>
              </div>

              {content.gift.bankAccounts.map((acc, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-white rounded-xl border border-[#EFE8DC] grid grid-cols-1 sm:grid-cols-3 gap-3 relative"
                >
                  <div>
                    <label className="block text-[10px] text-[#8C827A] mb-0.5">Nama Bank</label>
                    <input
                      type="text"
                      value={acc.bank}
                      onChange={(e) => handleUpdateBankAccount(index, { bank: e.target.value })}
                      placeholder="BCA / Mandiri / BNI"
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C827A] mb-0.5">Nomor Rekening</label>
                    <input
                      type="text"
                      value={acc.accountNumber}
                      onChange={(e) =>
                        handleUpdateBankAccount(index, { accountNumber: e.target.value })
                      }
                      placeholder="8830123456"
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg font-mono font-medium"
                    />
                  </div>
                  <div className="relative pr-8">
                    <label className="block text-[10px] text-[#8C827A] mb-0.5">Atas Nama (A/N)</label>
                    <input
                      type="text"
                      value={acc.accountHolder || acc.accountName || ''}
                      onChange={(e) =>
                        handleUpdateBankAccount(index, {
                          accountHolder: e.target.value,
                          accountName: e.target.value,
                        })
                      }
                      placeholder="Dimas Pratama"
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteBankAccount(index)}
                      title="Hapus Rekening"
                      className="absolute top-5 right-0 text-[#EF4444] p-1.5 rounded hover:bg-[#EF4444]/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Penutup (Closing) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection('closing')}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C5A059]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1F1D1B]">Penutup &amp; Ucapan Terima Kasih</h4>
              <p className="text-[11px] text-[#8C827A] font-light">
                Pesan penutup, salam keluarga besar, dan ucapan kedua mempelai
              </p>
            </div>
          </div>
          {openSection === 'closing' ? (
            <ChevronUp className="w-4 h-4 text-[#8C827A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C827A]" />
          )}
        </button>

        {openSection === 'closing' && (
          <div className="p-5 border-t border-[#EFE8DC] bg-[#FAF8F5]/30 space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#3D3833] mb-1">Judul Penutup</label>
              <input
                type="text"
                value={content.closing.title}
                onChange={(e) => updateClosing({ title: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
              />
            </div>

            <div>
              <label className="block font-medium text-[#3D3833] mb-1">Pesan Terima Kasih</label>
              <textarea
                rows={3}
                value={content.closing.message}
                onChange={(e) => updateClosing({ message: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Salam Keluarga</label>
                <input
                  type="text"
                  value={content.closing.familyGreeting}
                  onChange={(e) => updateClosing({ familyGreeting: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Teks Nama Mempelai</label>
                <input
                  type="text"
                  value={content.closing.couplesText}
                  onChange={(e) => updateClosing({ couplesText: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Teks Keluarga Besar</label>
                <input
                  type="text"
                  value={content.closing.familyText}
                  onChange={(e) => updateClosing({ familyText: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3D3833] mb-1">Footer Copyright / Kredit</label>
                <input
                  type="text"
                  value={content.closing.footerText || ''}
                  onChange={(e) => updateClosing({ footerText: e.target.value })}
                  placeholder="The Wedding of Dimas & Larasati &bull; 2026"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD3] rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
