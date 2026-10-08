import {
  ThemeConfig,
  ContentConfig,
  SectionLayoutConfig,
  MusicConfig,
  SettingsConfig,
  ThemePalette,
  TypographyConfig,
} from '../types';

// ============================================================================
// COLOR PRESETS
// ============================================================================
export const THEME_COLOR_PRESETS: Record<string, { name: string; palette: ThemePalette }> = {
  classicIvory: {
    name: 'Classic Ivory',
    palette: {
      background: '#FAF8F5',
      surface: '#FFFFFF',
      primary: '#242220',
      secondary: '#8C827A',
      accent: '#B89B72',
      heading: '#1F1D1B',
      bodyText: '#4A4540',
      border: '#EFE8DC',
      buttonBg: '#242220',
      buttonText: '#FAF8F5',
    },
  },
  champagne: {
    name: 'Champagne',
    palette: {
      background: '#F8F5EE',
      surface: '#FFFFFF',
      primary: '#2A2520',
      secondary: '#91877E',
      accent: '#C5A059',
      heading: '#231F1A',
      bodyText: '#4E4842',
      border: '#EBE2D3',
      buttonBg: '#2A2520',
      buttonText: '#F8F5EE',
    },
  },
  warmBeige: {
    name: 'Warm Beige',
    palette: {
      background: '#F5EFEB',
      surface: '#FFFFFF',
      primary: '#332B25',
      secondary: '#8D7E73',
      accent: '#B47958',
      heading: '#2B241F',
      bodyText: '#524840',
      border: '#E5DAD1',
      buttonBg: '#332B25',
      buttonText: '#F5EFEB',
    },
  },
  monochrome: {
    name: 'Monochrome',
    palette: {
      background: '#F8F9FA',
      surface: '#FFFFFF',
      primary: '#111827',
      secondary: '#6B7280',
      accent: '#4B5563',
      heading: '#0F172A',
      bodyText: '#374151',
      border: '#E5E7EB',
      buttonBg: '#111827',
      buttonText: '#F9FAFB',
    },
  },
  darkLuxury: {
    name: 'Dark Luxury',
    palette: {
      background: '#161514',
      surface: '#22201E',
      primary: '#FAF8F5',
      secondary: '#A3998F',
      accent: '#D4AF37',
      heading: '#FFFFFF',
      bodyText: '#D9D0C7',
      border: '#38332E',
      buttonBg: '#D4AF37',
      buttonText: '#161514',
    },
  },
  minimalBrown: {
    name: 'Minimal Brown',
    palette: {
      background: '#F9F6F0',
      surface: '#FFFFFF',
      primary: '#2A211B',
      secondary: '#827367',
      accent: '#785E4F',
      heading: '#241C16',
      bodyText: '#4A3E36',
      border: '#E8DFD3',
      buttonBg: '#2A211B',
      buttonText: '#F9F6F0',
    },
  },
};

// ============================================================================
// TYPOGRAPHY PRESETS
// ============================================================================
export const TYPOGRAPHY_PRESETS: Record<string, { name: string; typography: TypographyConfig }> = {
  elegantSerif: {
    name: 'Elegant Serif',
    typography: {
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Plus Jakarta Sans',
      fontSize: 'base',
      fontWeight: 'normal',
      letterSpacing: 'wide',
      lineHeight: 'relaxed',
    },
  },
  editorial: {
    name: 'Editorial',
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      fontSize: 'base',
      fontWeight: 'normal',
      letterSpacing: 'wide',
      lineHeight: 'normal',
    },
  },
  modernMinimal: {
    name: 'Modern Minimal',
    typography: {
      headingFont: 'Montserrat',
      bodyFont: 'Outfit',
      fontSize: 'base',
      fontWeight: 'medium',
      letterSpacing: 'wider',
      lineHeight: 'normal',
    },
  },
  luxuryClassic: {
    name: 'Luxury Classic',
    typography: {
      headingFont: 'Cinzel',
      bodyFont: 'Lora',
      fontSize: 'base',
      fontWeight: 'normal',
      letterSpacing: 'widest',
      lineHeight: 'relaxed',
    },
  },
};

// ============================================================================
// DEFAULT THEME
// ============================================================================
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  presetName: 'Classic Ivory',
  palette: THEME_COLOR_PRESETS.classicIvory.palette,
  typography: TYPOGRAPHY_PRESETS.elegantSerif.typography,
  borderRadius: 12,
  sectionSpacing: 'normal',
};

// ============================================================================
// DEFAULT CONTENT CONFIG
// ============================================================================
export const DEFAULT_CONTENT_CONFIG: ContentConfig = {
  opening: {
    label: 'The Wedding Celebration',
    greeting: 'Kepada Yth. Bapak/Ibu/Saudara/i:',
    defaultGuestName: 'Tamu Undangan',
    subheading: 'Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir dalam perayaan pernikahan kami.',
    buttonText: 'Buka Undangan',
  },
  hero: {
    badge: "Walimatul 'Ursy",
    heading: 'The Wedding of Resti & Ramdan',
    subheading: 'Kami mengundang Anda untuk menjadi saksi pengikatan janji suci kami',
    groomName: 'Ramdan',
    brideName: 'Resti',
    eventDate: 'Sabtu, 24 Oktober 2026',
    eventDateISO: '2026-10-24T08:00:00+07:00',
    venue: 'The Glass House Ballroom',
    city: 'Jakarta Selatan',
    quote: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
    quoteSurah: 'QS. Ar-Rum: 21',
    heroImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
  },
  couple: {
    sectionTitle: 'Kedua Mempelai',
    sectionSubtitle: 'Maha Suci Allah SWT yang telah menciptakan makhluk-Nya berpasang-pasangan.',
    groom: {
      name: 'Ramdan',
      fullName: 'Ramdan Pratama',
      fullNameWithTitles: 'Ramdan Pratama, S.T.',
      childOrderText: 'Putra kedua dari',
      fatherName: 'Bpk. Bambang Haryanto',
      motherName: 'Ibu Endah Susilowati',
      parents: 'Putra kedua dari Bpk. Bambang Haryanto & Ibu Endah Susilowati',
      description: 'Pribadi yang penuh semangat dengan kecintaan mendalam pada keindahan arsitektur dan seni rupa.',
      instagram: '@ramdanpratama',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    },
    bride: {
      name: 'Resti',
      fullName: 'Resti Azzahra',
      fullNameWithTitles: 'Resti Azzahra, S.Ds.',
      childOrderText: 'Putri pertama dari',
      fatherName: 'Bpk. Ir. Hendra Gunawan',
      motherName: 'Ibu Maya Savitri',
      parents: 'Putri pertama dari Bpk. Ir. Hendra Gunawan & Ibu Maya Savitri',
      description: 'Sosok yang hangat dan ceria, memandang cinta sebagai ruang terindah untuk berpulang dan bertumbuh bersama.',
      instagram: '@restiazzahra',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    },
  },
  countdown: {
    title: 'Menuju Hari Bahagia',
    subtitle: 'Setiap detik yang terlewati membawa kami semakin dekat pada hari yang penuh berkah.',
    format: 'standard',
    targetDateISO: '2026-10-24T08:00:00+07:00',
  },
  event: {
    sectionTitle: 'Rangkaian Acara',
    sectionSubtitle: 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan acara:',
    akad: {
      title: 'Akad Nikah',
      date: 'Sabtu, 24 Oktober 2026',
      time: '08:00 - 10:00 WIB',
      venue: 'Masjid Agung Al-Azhar',
      address: 'Jl. Sisingamangaraja, Selong, Kebayoran Baru, Jakarta Selatan',
      mapsUrl: 'https://maps.google.com/?q=Masjid+Agung+Al-Azhar+Jakarta',
    },
    resepsi: {
      title: 'Resepsi Pernikahan',
      date: 'Sabtu, 24 Oktober 2026',
      time: '11:30 - 14:00 WIB',
      venue: 'The Glass House Ballroom',
      address: 'Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan, Jakarta Selatan',
      mapsUrl: 'https://maps.google.com/?q=The+Glass+House+Jakarta',
    },
  },
  story: {
    sectionTitle: 'Untaian Kisah Dua Hati',
    sectionSubtitle: 'Bagaimana sebuah pertemuan biasa bertransformasi menjadi janji seumur hidup.',
    milestones: [
      {
        id: 'm-1',
        year: '2019',
        title: 'Awal Perjumpaan',
        description: 'Pertemuan pertama di sebuah pameran seni di Bandung. Sebuah percakapan hangat tentang arsitektur dan seni yang perlahan membuka pintu rasa.',
      },
      {
        id: 'm-2',
        year: '2022',
        title: 'Langkah Bersama',
        description: 'Menemukan keselarasan dalam berbagai perbedaan. Belajar saling memahami, mendukung mimpi satu sama lain, dan tumbuh bersama.',
      },
      {
        id: 'm-3',
        year: '2025',
        title: 'Janji Suci Menuju Pelaminan',
        description: 'Di hadapan kedua keluarga besar, kami mengikat janji untuk melangkah menuju ikatan suci pernikahan yang diridhoi Allah SWT.',
      },
    ],
  },
  gallery: {
    sectionTitle: 'Potret Kenangan',
    sectionSubtitle: 'Setiap detik bersamamu adalah lembaran kenangan yang ingin kami abadikan selamanya.',
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=900&auto=format&fit=crop',
        caption: 'Di bawah hangatnya senja Jakarta',
        aspect: 'portrait',
      },
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=900&auto=format&fit=crop',
        caption: 'Tawa yang senantiasa menenangkan',
        aspect: 'landscape',
      },
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900&auto=format&fit=crop',
        caption: 'Menghitung hari menuju hari bahagia',
        aspect: 'portrait',
      },
      {
        id: 'img-4',
        url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=900&auto=format&fit=crop',
        caption: 'Janji dalam heningnya doa',
        aspect: 'square',
      },
      {
        id: 'img-5',
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=900&auto=format&fit=crop',
        caption: 'Langkah pertama menuju selamanya',
        aspect: 'portrait',
      },
      {
        id: 'img-6',
        url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=900&auto=format&fit=crop',
        caption: 'Cinta dalam setiap tatapan',
        aspect: 'landscape',
      },
    ],
  },
  rsvp: {
    sectionTitle: 'Konfirmasi Kehadiran',
    sectionSubtitle: 'Mohon berkenan mengonfirmasi kehadiran Anda agar kami dapat mempersiapkan jamuan terbaik.',
    buttonText: 'Kirim Konfirmasi Kehadiran',
    successMessage: 'Terima kasih atas konfirmasi Anda. Kami menantikan kehadiran Anda dengan penuh sukacita.',
  },
  wishes: {
    sectionTitle: 'Doa Restu & Harapan',
    sectionSubtitle: 'Untaian doa dari Bapak/Ibu/Saudara/i merupakan kado terindah bagi lembaran hidup baru kami.',
    emptyStateText: 'Belum ada untaian doa. Jadilah yang pertama memberikan doa restu bagi kedua mempelai!',
    buttonText: 'Kirim Doa Restu',
  },
  gift: {
    sectionTitle: 'Tanda Kasih Digital',
    sectionSubtitle: 'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika berkenan memberikan tanda kasih secara cashless, dapat disalurkan melalui:',
    bankAccounts: [
      {
        id: 'bank-1',
        bank: 'Bank Mandiri',
        accountNumber: '1370019284721',
        accountName: 'Resti Azzahra',
      },
      {
        id: 'bank-2',
        bank: 'Bank Central Asia (BCA)',
        accountNumber: '8820491029',
        accountName: 'Ramdan Pratama',
      },
    ],
  },
  closing: {
    title: 'Ungkapan Terima Kasih',
    message: 'Merupakan suatu kehormatan dan kebahagiaan yang tiada tara bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi pernikahan kami.',
    familyGreeting: 'Kami yang berbahagia,',
    couplesText: 'Resti & Ramdan',
    familyText: 'Beserta Seluruh Keluarga Besar Kedua Mempelai',
    footerText: 'The Wedding Celebration of Resti & Ramdan • 2026',
  },
};

// ============================================================================
// DEFAULT LAYOUT CONFIG
// ============================================================================
export const DEFAULT_LAYOUT_CONFIG: SectionLayoutConfig[] = [
  {
    id: 'opening',
    name: 'Cover Pembuka (Opening)',
    enabled: true,
    layoutStyle: 'centered',
    imagePosition: 'center',
    overlay: 'subtle',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'hero',
    name: 'Hero Banner',
    enabled: true,
    layoutStyle: 'centered',
    imagePosition: 'center',
    overlay: 'subtle',
    textAlignment: 'center',
    paddingY: 'spacious',
  },
  {
    id: 'couple',
    name: 'Kedua Mempelai',
    enabled: true,
    layoutStyle: 'cards',
    imagePosition: 'top',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'countdown',
    name: 'Hitung Mundur (Countdown)',
    enabled: true,
    layoutStyle: 'centered',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'event',
    name: 'Rangkaian Acara (Akad & Resepsi)',
    enabled: true,
    layoutStyle: 'cards',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'story',
    name: 'Kisah Cinta (Love Story)',
    enabled: true,
    layoutStyle: 'centered',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'gallery',
    name: 'Galeri Foto',
    enabled: true,
    layoutStyle: 'cards',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'rsvp',
    name: 'Konfirmasi Kehadiran (RSVP)',
    enabled: true,
    layoutStyle: 'centered',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'wishes',
    name: 'Doa & Ucapan Tamu',
    enabled: true,
    layoutStyle: 'centered',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'gift',
    name: 'Amplop Digital (Wedding Gift)',
    enabled: true,
    layoutStyle: 'cards',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'normal',
  },
  {
    id: 'closing',
    name: 'Penutup & Salam Keluarga',
    enabled: true,
    layoutStyle: 'centered',
    imagePosition: 'center',
    overlay: 'none',
    textAlignment: 'center',
    paddingY: 'spacious',
  },
];

// ============================================================================
// DEFAULT MUSIC CONFIG
// ============================================================================
export const DEFAULT_MUSIC_CONFIG: MusicConfig = {
  url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  title: 'Serene View - Romantic Piano & Strings',
  artist: 'Mixkit Audio',
  autoPlay: true,
};

// ============================================================================
// CURATED MUSIC PRESETS
// ============================================================================
export const MUSIC_PRESETS: Array<{ id: string; title: string; artist: string; url: string }> = [
  {
    id: 'music-1',
    title: 'Serene View - Piano & Strings',
    artist: 'Mixkit Audio',
    url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  },
  {
    id: 'music-2',
    title: 'Gentle Wedding Melodies',
    artist: 'Classical Ambient Ensemble',
    url: 'https://assets.mixkit.co/music/preview/mixkit-valley-sunset-127.mp3',
  },
  {
    id: 'music-3',
    title: 'Warm Acoustic Harmony',
    artist: 'Acoustic Soul Trio',
    url: 'https://assets.mixkit.co/music/preview/mixkit-silent-walk-piano-melody-458.mp3',
  },
  {
    id: 'music-4',
    title: 'Ethereal Romance Orchestra',
    artist: 'Vienna String Quintet',
    url: 'https://assets.mixkit.co/music/preview/mixkit-sweet-love-story-piano-solo-463.mp3',
  },
];

// ============================================================================
// DEFAULT SETTINGS CONFIG
// ============================================================================
export const DEFAULT_SETTINGS_CONFIG: SettingsConfig = {
  title: 'The Wedding Celebration of Resti & Ramdan',
  description: 'Undangan pernikahan digital online Resti & Ramdan. Sabtu, 24 Oktober 2026.',
  ogImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
  enableRsvp: true,
  enableWishes: true,
  enableGift: true,
  adminPin: '123123',
};

// ============================================================================
// CURATED MEDIA PRESETS
// ============================================================================
export const CURATED_MEDIA_PRESETS = [
  {
    category: 'Hero & Cover',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
        label: 'Romantic Embrace (Sunset)',
      },
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        label: 'Modern Minimalist Portrait',
      },
      {
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
        label: 'Warm Sunlight Gown',
      },
      {
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200&auto=format&fit=crop',
        label: 'Garden Ceremony Kiss',
      },
    ],
  },
  {
    category: 'Kedua Mempelai',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
        label: 'Groom (Pria Jas Hitam)',
      },
      {
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
        label: 'Groom (Pria Senyum Hangat)',
      },
      {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
        label: 'Bride (Wanita Elegan)',
      },
      {
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
        label: 'Bride (Wanita Gaun Putih)',
      },
    ],
  },
  {
    category: 'Galeri & Detail',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900&auto=format&fit=crop',
        label: 'Buket Bunga & Cincin',
      },
      {
        url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=900&auto=format&fit=crop',
        label: 'Pernikahan Outdoor Romantis',
      },
      {
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=900&auto=format&fit=crop',
        label: 'Gaun Pengantin Renda',
      },
      {
        url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=900&auto=format&fit=crop',
        label: 'Langkah Bersama di Taman',
      },
    ],
  },
];

// ============================================================================
// TEMPLATE PRESETS (Canva style complete combinations)
// ============================================================================
export const TEMPLATE_PRESETS = [
  {
    id: 'elegant',
    name: 'Elegant Ivory',
    description: 'Palet gading klasik berpadu tipografi serif anggun dan aksen emas champagne.',
    theme: {
      presetName: 'Classic Ivory',
      palette: THEME_COLOR_PRESETS.classicIvory.palette,
      typography: TYPOGRAPHY_PRESETS.elegantSerif.typography,
      borderRadius: 12,
      sectionSpacing: 'normal' as const,
    },
  },
  {
    id: 'minimal',
    name: 'Modern Minimal',
    description: 'Desain bersih dengan tipografi sans-serif kontemporer, garis halus, dan ruang bernapas lega.',
    theme: {
      presetName: 'Monochrome',
      palette: THEME_COLOR_PRESETS.monochrome.palette,
      typography: TYPOGRAPHY_PRESETS.modernMinimal.typography,
      borderRadius: 8,
      sectionSpacing: 'compact' as const,
    },
  },
  {
    id: 'classic',
    name: 'Champagne Romance',
    description: 'Kesan hangat berkelas dengan palet champagne dan font serif tradisional yang abadi.',
    theme: {
      presetName: 'Champagne',
      palette: THEME_COLOR_PRESETS.champagne.palette,
      typography: TYPOGRAPHY_PRESETS.editorial.typography,
      borderRadius: 16,
      sectionSpacing: 'normal' as const,
    },
  },
  {
    id: 'luxury',
    name: 'Dark Luxury Gold',
    description: 'Nuansa malam eksklusif dengan latar obsidian gelap dan aksen emas gemerlap.',
    theme: {
      presetName: 'Dark Luxury',
      palette: THEME_COLOR_PRESETS.darkLuxury.palette,
      typography: TYPOGRAPHY_PRESETS.luxuryClassic.typography,
      borderRadius: 12,
      sectionSpacing: 'spacious' as const,
    },
  },
  {
    id: 'editorial',
    name: 'Warm Editorial',
    description: 'Sentuhan majalah seni kontemporer dengan palet beige tanah liat yang puitis.',
    theme: {
      presetName: 'Warm Beige',
      palette: THEME_COLOR_PRESETS.warmBeige.palette,
      typography: TYPOGRAPHY_PRESETS.editorial.typography,
      borderRadius: 10,
      sectionSpacing: 'spacious' as const,
    },
  },
];
