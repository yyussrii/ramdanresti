import { Invitation, Guest, GuestWish } from '../types';
import {
  DEFAULT_THEME_CONFIG,
  DEFAULT_CONTENT_CONFIG,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_MUSIC_CONFIG,
  DEFAULT_SETTINGS_CONFIG,
} from '../constants/cmsDefaults';

export const INITIAL_INVITATION_ID = 'ramdan-resti';

export const INITIAL_INVITATION: Invitation = {
  id: INITIAL_INVITATION_ID,
  groomName: 'Ramdan',
  groomFullName: 'Ramdan Pratama',
  groomParents: 'Putra kedua dari Bpk. Bambang Haryanto & Ibu Endah Susilowati',
  brideName: 'Resti',
  brideFullName: 'Resti Azzahra',
  brideParents: 'Putri pertama dari Bpk. Ir. Hendra Gunawan & Ibu Maya Savitri',
  eventDate: 'Sabtu, 24 Oktober 2026',
  eventDateISO: '2026-10-24T08:00:00+07:00',
  eventTime: '08:00 - 14:00 WIB',
  venue: 'The Glass House Ballroom',
  address: 'Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan, Jakarta Selatan 12730',
  mapsUrl: 'https://maps.google.com/?q=The+Glass+House+Jakarta',
  coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
  heroImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
  // Relaxing ambient acoustic wedding track
  musicUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  musicTitle: 'Serene View - Piano & Strings',
  storyTitle: 'Untaian Kisah Dua Hati',
  storyMilestones: [
    {
      year: '2019',
      title: 'Awal Perjumpaan',
      description: 'Pertemuan pertama di sebuah pameran seni di Bandung. Sebuah percakapan hangat tentang arsitektur dan desain yang perlahan membuka pintu rasa.'
    },
    {
      year: '2022',
      title: 'Langkah Bersama',
      description: 'Menemukan keselarasan dalam berbagai perbedaan. Belajar saling memahami, mendukung mimpi satu sama lain, dan tumbuh bersama.'
    },
    {
      year: '2025',
      title: 'Janji Suci',
      description: 'Di hadapan kedua keluarga besar, kami mengikat janji untuk melangkah menuju ikatan suci pernikahan yang diridhoi.'
    }
  ],
  akad: {
    title: 'Akad Nikah',
    date: 'Sabtu, 24 Oktober 2026',
    time: '08:00 - 10:00 WIB',
    venue: 'Masjid Agung Al-Azhar',
    address: 'Jl. Sisingamangaraja, Selong, Kebayoran Baru, Jakarta Selatan',
    mapsUrl: 'https://maps.google.com/?q=Masjid+Agung+Al-Azhar+Jakarta'
  },
  resepsi: {
    title: 'Resepsi Pernikahan',
    date: 'Sabtu, 24 Oktober 2026',
    time: '11:30 - 14:00 WIB',
    venue: 'The Glass House Ballroom',
    address: 'Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan, Jakarta Selatan',
    mapsUrl: 'https://maps.google.com/?q=The+Glass+House+Jakarta'
  },
  galleryImages: [
    {
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=900&auto=format&fit=crop',
      caption: 'Di bawah hangatnya senja Jakarta',
      aspect: 'portrait'
    },
    {
      url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=900&auto=format&fit=crop',
      caption: 'Tawa yang senantiasa menenangkan',
      aspect: 'landscape'
    },
    {
      url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900&auto=format&fit=crop',
      caption: 'Menghitung hari menuju hari bahagia',
      aspect: 'portrait'
    },
    {
      url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=900&auto=format&fit=crop',
      caption: 'Janji dalam heningnya doa',
      aspect: 'square'
    },
    {
      url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=900&auto=format&fit=crop',
      caption: 'Langkah pertama menuju selamanya',
      aspect: 'portrait'
    },
    {
      url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=900&auto=format&fit=crop',
      caption: 'Cinta dalam setiap tatapan',
      aspect: 'landscape'
    }
  ],
  bankAccounts: [
    {
      bank: 'Bank Mandiri',
      accountNumber: '1370019284721',
      accountName: 'Resti Azzahra'
    },
    {
      bank: 'BCA',
      accountNumber: '8820491029',
      accountName: 'Ramdan Pratama'
    }
  ],
  createdAt: '2026-09-01T00:00:00Z',
  theme: DEFAULT_THEME_CONFIG,
  content: DEFAULT_CONTENT_CONFIG,
  layout: DEFAULT_LAYOUT_CONFIG,
  music: DEFAULT_MUSIC_CONFIG,
  settings: DEFAULT_SETTINGS_CONFIG,
  publishedVersion: {
    theme: DEFAULT_THEME_CONFIG,
    content: DEFAULT_CONTENT_CONFIG,
    layout: DEFAULT_LAYOUT_CONFIG,
    music: DEFAULT_MUSIC_CONFIG,
    settings: DEFAULT_SETTINGS_CONFIG,
    publishedAt: '2026-09-01T00:00:00Z',
  },
  lastEditedAt: '2026-09-12T09:00:00Z',
  lastPublishedAt: '2026-09-01T00:00:00Z',
  versionHistory: [
    {
      versionId: 'v-1',
      versionNumber: 1,
      label: 'Publikasi Awal (Versi 1.0)',
      publishedAt: '2026-09-01T00:00:00Z',
      configSnapshot: {
        theme: DEFAULT_THEME_CONFIG,
        content: DEFAULT_CONTENT_CONFIG,
        layout: DEFAULT_LAYOUT_CONFIG,
        music: DEFAULT_MUSIC_CONFIG,
        settings: DEFAULT_SETTINGS_CONFIG,
      },
    },
  ],
};

export const INITIAL_GUESTS: Guest[] = [
  {
    id: 'guest-1',
    name: 'Pak Yanto',
    slug: 'pak-yanto',
    phone: '+6281234567890',
    isOpened: true,
    openedAt: '2026-09-10T14:32:00Z',
    rsvpStatus: 'hadir',
    guestCount: 2,
    rsvpNotes: 'Insya Allah hadir bersama istri. Selamat untuk Resti & Ramdan.',
    createdAt: '2026-09-05T10:00:00Z'
  },
  {
    id: 'guest-2',
    name: 'Ibu Siti',
    slug: 'ibu-siti',
    phone: '+6281345678901',
    isOpened: true,
    openedAt: '2026-09-11T09:15:00Z',
    rsvpStatus: 'hadir',
    guestCount: 2,
    rsvpNotes: 'Barakallahu lakuma, semoga menjadi keluarga sakinah mawaddah warahmah.',
    createdAt: '2026-09-05T10:05:00Z'
  },
  {
    id: 'guest-3',
    name: 'Budi',
    slug: 'budi',
    phone: '+6281456789012',
    isOpened: false,
    openedAt: null,
    rsvpStatus: 'menunggu',
    guestCount: 1,
    createdAt: '2026-09-05T10:10:00Z'
  },
  {
    id: 'guest-4',
    name: 'Andi',
    slug: 'andi',
    phone: '+6281567890123',
    isOpened: false,
    openedAt: null,
    rsvpStatus: 'menunggu',
    guestCount: 1,
    createdAt: '2026-09-05T10:15:00Z'
  },
  {
    id: 'guest-5',
    name: 'Rina',
    slug: 'rina',
    phone: '+6281678901245',
    isOpened: true,
    openedAt: '2026-09-12T08:04:00Z',
    rsvpStatus: 'hadir',
    guestCount: 1,
    rsvpNotes: 'Congrats Resti cantik! Pasti datang dong!',
    createdAt: '2026-09-05T10:20:00Z'
  }
];

export const INITIAL_WISHES: GuestWish[] = [
  {
    id: 'wish-1',
    guestName: 'Pak Yanto',
    message: 'Selamat untuk kedua mempelai Resti & Ramdan. Semoga senantiasa dipenuhi keberkahan dan kebahagiaan hingga anak cucu.',
    attendance: 'hadir',
    createdAt: '2026-09-10T14:35:00Z'
  },
  {
    id: 'wish-2',
    guestName: 'Ibu Siti',
    message: 'Barakallahu lakuma wa baraka alaika wa jamaa bainakuma fii khair. Turut berbahagia untuk kedua keluarga.',
    attendance: 'hadir',
    createdAt: '2026-09-11T09:20:00Z'
  },
  {
    id: 'wish-3',
    guestName: 'Rina',
    message: 'Resti dan Ramdan! So happy for both of you. Wishing you a lifetime of love and joy!',
    attendance: 'hadir',
    createdAt: '2026-09-12T08:10:00Z'
  }
];
