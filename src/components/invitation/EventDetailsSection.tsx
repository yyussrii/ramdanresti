import React from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, ExternalLink, CalendarPlus } from 'lucide-react';
import { Invitation, SectionLayoutConfig } from '../../types';

interface EventDetailsSectionProps {
  invitation: Invitation;
  layout?: SectionLayoutConfig;
}

export const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({ invitation, layout }) => {
  const eventContent = invitation.content?.event;
  const akad = eventContent?.akad || invitation.akad;
  const resepsi = eventContent?.resepsi || invitation.resepsi;
  const sectionTitle = eventContent?.sectionTitle || 'Rangkaian Acara';
  const sectionSubtitle =
    eventContent?.sectionSubtitle ||
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.';

  const addToCalendar = (title: string, date: string, location: string) => {
    // Generate Google Calendar Link
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Pernikahan ${invitation.groomName} & ${invitation.brideName} - ${title}`
    )}&dates=20261024T010000Z/20261024T070000Z&details=${encodeURIComponent(
      `Dengan penuh rasa syukur, kami mengundang Anda dalam perayaan pernikahan kami.`
    )}&location=${encodeURIComponent(location)}`;
    window.open(calendarUrl, '_blank');
  };

  return (
    <section
      id="wedding-details"
      className={`px-6 bg-[#FAF8F5] ${
        layout?.paddingY === 'compact' ? 'py-12' : layout?.paddingY === 'spacious' ? 'py-24' : 'py-20'
      }`}
    >
      <div className="max-w-xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8C827A] font-medium block mb-2">
            Waktu &amp; Tempat
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#242220] font-normal">
            {sectionTitle}
          </h2>
          <p className="text-xs text-[#70675F] max-w-sm mx-auto mt-3 font-light leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        {/* Schedule Cards */}
        <div className="space-y-8">
          {/* Akad Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white/80 border border-[#E8E1D7] rounded-xl p-6 sm:p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4 mb-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#B89B72] font-medium block">
                  Ikatan Suci
                </span>
                <h3 className="font-serif text-2xl text-[#221F1D] font-medium mt-0.5">
                  {akad.title}
                </h3>
              </div>
              <span className="text-xs font-mono text-[#8C827A] px-2.5 py-1 bg-[#F7F3ED] rounded-md">
                {akad.time.split('-')[0] || '08:00 WIB'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs text-[#524B45] font-light">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#B89B72] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#221F1D]">{akad.date}</p>
                  <p className="text-[#7A726B]">{akad.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B89B72] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#221F1D]">{akad.venue}</p>
                  <p className="text-[#7A726B] leading-relaxed">{akad.address}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F0EAE1] flex flex-wrap gap-2.5">
              <a
                href={akad.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-lg border border-[#D6C7B2] hover:bg-[#F6F1EA] text-[#242220] text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors duration-200"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#B89B72]" />
                <span>Google Maps</span>
              </a>
              <button
                onClick={() => addToCalendar(akad.title, akad.date, akad.venue)}
                className="py-2.5 px-4 rounded-lg bg-[#F7F3ED] hover:bg-[#EFE7DC] text-[#3D3833] text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-[#8C827A]" />
                <span>Kalender</span>
              </button>
            </div>
          </motion.div>

          {/* Resepsi Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-white/80 border border-[#E8E1D7] rounded-xl p-6 sm:p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4 mb-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#B89B72] font-medium block">
                  Perayaan Bahagia
                </span>
                <h3 className="font-serif text-2xl text-[#221F1D] font-medium mt-0.5">
                  {resepsi.title}
                </h3>
              </div>
              <span className="text-xs font-mono text-[#8C827A] px-2.5 py-1 bg-[#F7F3ED] rounded-md">
                {resepsi.time.split('-')[0] || '11:30 WIB'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs text-[#524B45] font-light">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#B89B72] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#221F1D]">{resepsi.date}</p>
                  <p className="text-[#7A726B]">{resepsi.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B89B72] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#221F1D]">{resepsi.venue}</p>
                  <p className="text-[#7A726B] leading-relaxed">{resepsi.address}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F0EAE1] flex flex-wrap gap-2.5">
              <a
                href={resepsi.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-lg border border-[#D6C7B2] hover:bg-[#F6F1EA] text-[#242220] text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors duration-200"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#B89B72]" />
                <span>Google Maps</span>
              </a>
              <button
                onClick={() => addToCalendar(resepsi.title, resepsi.date, resepsi.venue)}
                className="py-2.5 px-4 rounded-lg bg-[#F7F3ED] hover:bg-[#EFE7DC] text-[#3D3833] text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-[#8C827A]" />
                <span>Kalender</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
