import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';
import { SectionLayoutConfig } from '../../types';
import { DEFAULT_LAYOUT_CONFIG } from '../../constants/cmsDefaults';

interface LayoutEditorProps {
  layout: SectionLayoutConfig[];
  onChange: (updatedLayout: SectionLayoutConfig[]) => void;
}

export const LayoutEditor: React.FC<LayoutEditorProps> = ({ layout, onChange }) => {
  const handleToggleEnabled = (index: number) => {
    const updated = [...layout];
    updated[index] = {
      ...updated[index],
      enabled: !updated[index].enabled,
    };
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...layout];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === layout.length - 1) return;
    const updated = [...layout];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  const handleUpdateSection = (
    index: number,
    fields: Partial<SectionLayoutConfig>
  ) => {
    const updated = [...layout];
    updated[index] = {
      ...updated[index],
      ...fields,
    };
    onChange(updated);
  };

  const handleResetLayout = () => {
    if (window.confirm('Kembalikan urutan dan tata letak section ke standar?')) {
      onChange(DEFAULT_LAYOUT_CONFIG);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-[#1F1D1B] font-medium">
            Pengaturan Layout &amp; Urutan Section
          </h3>
          <p className="text-xs text-[#8C827A] font-light mt-0.5">
            Sembunyikan atau tampilkan bagian tertentu dan atur urutan kemunculan dari atas ke bawah.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetLayout}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D6C7B2] hover:bg-white text-xs text-[#70675F] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#8C827A]" />
          <span>Reset Urutan Default</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[#EFE8DC] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-3 text-xs text-[#8C827A] font-medium">
          <span>Daftar Section Undangan</span>
          <span>Status &amp; Kontrol Posisi</span>
        </div>

        <div className="space-y-2.5">
          {layout.map((sec, index) => {
            const isFirst = index === 0;
            const isLast = index === layout.length - 1;

            return (
              <div
                key={sec.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  sec.enabled
                    ? 'bg-white border-[#EFE8DC] hover:border-[#D6C7B2]'
                    : 'bg-[#FAF8F5]/60 border-dashed border-[#D6C7B2] opacity-60'
                }`}
              >
                {/* Title & info */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-center font-mono text-[11px] font-semibold text-[#8C827A]">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#1F1D1B] flex items-center gap-2">
                      <span>{sec.name}</span>
                      {!sec.enabled && (
                        <span className="text-[10px] text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full font-normal">
                          Disembunyikan
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-[#8C827A] font-light">
                      ID: #{sec.id} &bull; Padding:{' '}
                      {sec.paddingY === 'compact'
                        ? 'Padat'
                        : sec.paddingY === 'spacious'
                        ? 'Lebar'
                        : 'Normal'}
                    </span>
                  </div>
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Padding Selector */}
                  <select
                    value={sec.paddingY || 'normal'}
                    onChange={(e) =>
                      handleUpdateSection(index, {
                        paddingY: e.target.value as 'compact' | 'normal' | 'spacious',
                      })
                    }
                    className="px-2.5 py-1.5 text-[11px] bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-[#3D3833] focus:outline-none focus:border-[#C5A059] cursor-pointer"
                  >
                    <option value="compact">Padding Padat</option>
                    <option value="normal">Padding Normal</option>
                    <option value="spacious">Padding Lebar</option>
                  </select>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(index)}
                    title={sec.enabled ? 'Sembunyikan Section' : 'Tampilkan Section'}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      sec.enabled
                        ? 'border-[#D6C7B2] bg-white text-[#10B981] hover:bg-[#10B981]/10'
                        : 'border-[#EF4444]/40 bg-white text-[#EF4444] hover:bg-[#EF4444]/10'
                    }`}
                  >
                    {sec.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveUp(index)}
                    title="Pindahkan ke Atas"
                    className="p-1.5 rounded-lg border border-[#D6C7B2] bg-white text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveDown(index)}
                    title="Pindahkan ke Bawah"
                    className="p-1.5 rounded-lg border border-[#D6C7B2] bg-white text-[#70675F] hover:text-[#1F1D1B] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
