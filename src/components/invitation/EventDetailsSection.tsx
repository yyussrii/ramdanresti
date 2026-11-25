import React from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, ExternalLink, CalendarPlus, Calendar } from 'lucide-react';
import { Invitation, SectionLayoutConfig } from '../../types';
import { parseEventDate } from '../../utils/dateParser';

interface EventDetailsSectionProps {
  invitation: Invitation;
  layout?: SectionLayoutConfig;
}

function formatGCalDateUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}00Z`
  );
}

function buildUnifiedCalendarUrl(
  coupleTitle: string,
  eventTitle: string,
  dateStr: string,
  startTimeStr: string,
  endTimeStr: string,
  location: string,
  fallbackIso?: string
): string {
  const parsed =
    parseEventDate(dateStr, startTimeStr) ||
    (fallbackIso ? parseEventDate(fallbackIso, startTimeStr) : null);
  const startDate = parsed ? parsed.date : new Date('2026-10-24T08:00:00+07:00');

  let endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);
  const explicitEndMatch = endTimeStr.match(/\d{1,2}[:.]\d{2}\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
  const startOnlyMatch = endTimeStr.match(/(\d{1,2})[:.](\d{2})/);

  if (explicitEndMatch) {
    const endHour = Math.min(23, Math.max(0, parseInt(explicitEndMatch[1], 10)));
    const endMinute = Math.min(59, Math.max(0, parseInt(explicitEndMatch[2], 10)));
    const candidateEnd = new Date(startDate);
    candidateEnd.setHours(endHour, endMinute, 0, 0);
    if (candidateEnd.getTime() > startDate.getTime()) {
      endDate = candidateEnd;
    }
  } else if (startOnlyMatch) {
    const resepsiStartHour = Math.min(23, Math.max(0, parseInt(startOnlyMatch[1], 10)));
    const resepsiStartMinute = Math.min(59, Math.max(0, parseInt(startOnlyMatch[2], 10)));
    const candidateEnd = new Date(startDate);
    candidateEnd.setHours(resepsiStartHour, resepsiStartMinute, 0, 0);
    candidateEnd.setTime(candidateEnd.getTime() + 3 * 60 * 60 * 1000);
    if (candidateEnd.getTime() > startDate.getTime()) {
      endDate = candidateEnd;
    }
  }

  const datesParam = `${formatGCalDateUtc(startDate)}/${formatGCalDateUtc(endDate)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Pernikahan ${coupleTitle} - ${eventTitle}`
  )}&dates=${datesParam}&details=${encodeURIComponent(
    'Dengan penuh rasa syukur, kami mengundang Anda dalam rangkaian acara Akad Nikah & Resepsi Pernikahan kami.'
  )}&location=${encodeURIComponent(location)}`;
}

function sanitizeMapsUrl(url: string | undefined, venue: string, address: string): string {
  const trimmed = (url || '').trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const queryText = [venue, address].filter(Boolean).join(', ');
  return `https://maps.google.com/?q=${encodeURIComponent(queryText || 'Jakarta')}`;
}

export const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({ invitation, layout }) => {
  const eventContent = invitation.content?.event;
  const akad = eventContent?.akad || invitation.akad;
  const resepsi = eventContent?.resepsi || invitation.resepsi;
  const sectionTitle = eventContent?.sectionTitle || 'Rangkaian Acara';
  const sectionSubtitle =
    eventContent?.sectionSubtitle ||
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.';

  const brideName = invitation.content?.hero?.brideName || invitation.brideName || 'Resti';
  const groomName = invitation.content?.hero?.groomName || invitation.groomName || 'Ramdan';
  const coupleTitle = `${brideName} & ${groomName}`;
  const fallbackIso = invitation.content?.hero?.eventDateISO || invitation.eventDateISO;

  const cardTitle = eventContent?.cardTitle || 'Akad Nikah & Resepsi Pernikahan';
  const akadTitle = akad?.title || 'Akad Nikah';
  const akadTime = akad?.timeFormatted || akad?.time || '08:00 - 10:00 WIB';

  const resepsiTitle = resepsi?.title || 'Resepsi Pernikahan';
  const rawResepsiTime = resepsi?.timeFormatted || resepsi?.time;
  const resepsiTime =
    !eventContent?.cardTitle &&
    !resepsi?.timeFormatted &&
    rawResepsiTime === '11:30 - 14:00 WIB'
      ? '11:30 - Selesai'
      : rawResepsiTime || '11:30 - Selesai';

  const eventDate =
    eventContent?.dateFormatted ||
    eventContent?.date ||
    resepsi?.dateFormatted ||
    resepsi?.date ||
    akad?.dateFormatted ||
    akad?.date ||
    invitation.content?.hero?.eventDateText ||
    invitation.content?.hero?.eventDate ||
    invitation.eventDate ||
    'Sabtu, 24 Oktober 2026';

  const eventVenue =
    eventContent?.venueName ||
    eventContent?.venue ||
    resepsi?.venueName ||
    resepsi?.venue ||
    akad?.venueName ||
    akad?.venue ||
    invitation.venue ||
    '';

  const eventAddress =
    eventContent?.address ||
    resepsi?.address ||
    akad?.address ||
    invitation.address ||
    '';

  const rawMapsUrl =
    eventContent?.mapsUrl ||
    resepsi?.mapsUrl ||
    akad?.mapsUrl ||
    invitation.mapsUrl;

  const mapsUrl = sanitizeMapsUrl(rawMapsUrl, eventVenue, eventAddress);
  const calendarUrl = buildUnifiedCalendarUrl(
    coupleTitle,
    cardTitle,
    eventDate,
    akadTime,
    resepsiTime,
    [eventVenue, eventAddress].filter(Boolean).join(', '),
    fallbackIso
  );

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
          className="text-center mb-12"
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

        {/* Unified Single Card: Akad Nikah & Resepsi Pernikahan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-white/90 border border-[#E8E1D7] rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)]"
        >
          {/* Unified Card Title */}
          <div className="text-center border-b border-[#F0EAE1] pb-5 mb-6">
            <h3 className="font-serif text-2xl sm:text-3xl text-[#221F1D] font-medium leading-snug">
              {cardTitle}
            </h3>
          </div>

          {/* Two Sessions on the Same Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[#F0EAE1]">
            <div className="rounded-xl bg-[#FAF8F5] border border-[#EFE8DC] p-4 text-center">
              <h4 className="font-serif text-lg text-[#221F1D] font-medium">
                {akadTitle}
              </h4>
              <p className="text-xs text-[#70675F] mt-1.5 flex items-center justify-center gap-1.5 font-normal">
                <Clock className="w-3.5 h-3.5 text-[#B89B72] shrink-0" />
                <span>{akadTime}</span>
              </p>
            </div>

            <div className="rounded-xl bg-[#FAF8F5] border border-[#EFE8DC] p-4 text-center">
              <h4 className="font-serif text-lg text-[#221F1D] font-medium">
                {resepsiTitle}
              </h4>
              <p className="text-xs text-[#70675F] mt-1.5 flex items-center justify-center gap-1.5 font-normal">
                <Clock className="w-3.5 h-3.5 text-[#B89B72] shrink-0" />
                <span>{resepsiTime}</span>
              </p>
            </div>
          </div>

          {/* Date & Full Address */}
          <div className="space-y-4 pt-6 text-xs text-[#524B45] font-light">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-[#B89B72] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8C827A] font-medium block mb-0.5">
                  Hari &amp; Tanggal
                </span>
                <p className="font-medium text-sm text-[#221F1D]">{eventDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#B89B72] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8C827A] font-medium block mb-0.5">
                  Lokasi Acara
                </span>
                {eventVenue && (
                  <p className="font-medium text-sm text-[#221F1D] mb-0.5">{eventVenue}</p>
                )}
                <p className="text-[#70675F] leading-relaxed">{eventAddress}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-5 border-t border-[#F0EAE1] flex flex-wrap gap-2.5">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] py-2.5 px-4 rounded-lg border border-[#D6C7B2] hover:bg-[#F6F1EA] text-[#242220] text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors duration-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#B89B72]" />
              <span>Google Maps</span>
            </a>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-lg bg-[#F7F3ED] hover:bg-[#EFE7DC] text-[#3D3833] text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#8C827A]" />
              <span>Simpan Kalender</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

