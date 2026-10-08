export type GuestCategory = 'keluarga' | 'sahabat' | 'rekan' | 'vip';

export type RSVPStatus = 'hadir' | 'tidak_hadir' | 'ragu' | 'menunggu';

export interface LoveStoryMilestone {
  id?: string;
  year: string;
  title: string;
  description: string;
}

export interface BankAccount {
  id?: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  accountHolder?: string;
}

export interface EventSchedule {
  title: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapsUrl: string;
  dateFormatted?: string;
  timeFormatted?: string;
  venueName?: string;
}

export interface GalleryItem {
  id?: string;
  url: string;
  caption?: string;
  aspect?: 'portrait' | 'landscape' | 'square';
}

// -------------------------------------------------------------
// CMS THEME & VISUAL TOKENS
// -------------------------------------------------------------
export interface ThemePalette {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  heading: string;
  headingText?: string;
  bodyText: string;
  border: string;
  borderColor?: string;
  buttonBg: string;
  buttonText: string;
}

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  fontSize: 'sm' | 'base' | 'lg';
  fontWeight: 'normal' | 'medium' | 'semibold';
  letterSpacing: 'normal' | 'wide' | 'wider' | 'widest';
  lineHeight: 'tight' | 'normal' | 'relaxed';
}

export interface ThemeConfig {
  presetName?: string;
  palette: ThemePalette;
  typography: TypographyConfig;
  borderRadius: number; // in px
  sectionSpacing: 'compact' | 'normal' | 'spacious';
}

// -------------------------------------------------------------
// CMS CONTENT
// -------------------------------------------------------------
export interface OpeningContent {
  label: string;
  greeting: string;
  defaultGuestName: string;
  subheading: string;
  buttonText: string;
  weddingLabel?: string;
  openButtonText?: string;
  invitationNote?: string;
}

export interface HeroContent {
  badge: string;
  heading: string;
  subheading: string;
  groomName: string;
  brideName: string;
  eventDate: string;
  eventDateISO: string;
  venue: string;
  city: string;
  quote?: string;
  quoteSurah?: string;
  quoteSource?: string;
  heroImage: string;
  heroImageUrl?: string;
  eventDateText?: string;
  eventTimeText?: string;
  eventLocationText?: string;
}

export interface CoupleProfile {
  name: string;
  fullName: string;
  parents: string;
  description?: string;
  instagram?: string;
  image?: string;
  fullNameWithTitles?: string;
  childOrderText?: string;
  fatherName?: string;
  motherName?: string;
  photoUrl?: string;
}

export interface CoupleContent {
  sectionTitle: string;
  sectionSubtitle: string;
  groom: CoupleProfile;
  bride: CoupleProfile;
}

export interface CountdownContent {
  title: string;
  subtitle: string;
  format: 'standard' | 'minimal' | 'cards';
  targetDateISO: string;
}

export interface EventContent {
  sectionTitle: string;
  sectionSubtitle: string;
  akad: EventSchedule;
  resepsi: EventSchedule;
}

export interface StoryContent {
  sectionTitle: string;
  sectionSubtitle: string;
  milestones: LoveStoryMilestone[];
}

export interface GalleryContent {
  sectionTitle: string;
  sectionSubtitle: string;
  images: GalleryItem[];
}

export interface RsvpContent {
  sectionTitle: string;
  sectionSubtitle: string;
  buttonText: string;
  successMessage: string;
}

export interface WishesContent {
  sectionTitle: string;
  sectionSubtitle: string;
  emptyStateText: string;
  buttonText: string;
}

export interface GiftContent {
  sectionTitle: string;
  sectionSubtitle: string;
  bankAccounts: BankAccount[];
}

export interface ClosingContent {
  title: string;
  message: string;
  familyGreeting: string;
  couplesText: string;
  familyText: string;
  footerText: string;
}

export interface ContentConfig {
  opening: OpeningContent;
  hero: HeroContent;
  couple: CoupleContent;
  countdown: CountdownContent;
  event: EventContent;
  story: StoryContent;
  gallery: GalleryContent;
  rsvp: RsvpContent;
  wishes: WishesContent;
  gift: GiftContent;
  closing: ClosingContent;
}

// -------------------------------------------------------------
// CMS LAYOUT
// -------------------------------------------------------------
export type LayoutSectionId =
  | 'opening'
  | 'hero'
  | 'couple'
  | 'countdown'
  | 'event'
  | 'story'
  | 'gallery'
  | 'rsvp'
  | 'wishes'
  | 'gift'
  | 'closing';

export interface SectionLayoutConfig {
  id: LayoutSectionId;
  name: string;
  enabled: boolean;
  layoutStyle: 'centered' | 'split' | 'fullscreen' | 'cards';
  imagePosition: 'top' | 'center' | 'bottom';
  overlay: 'none' | 'subtle' | 'medium';
  textAlignment: 'left' | 'center' | 'right';
  paddingY: 'compact' | 'normal' | 'spacious';
}

// -------------------------------------------------------------
// CMS MUSIC & SETTINGS
// -------------------------------------------------------------
export interface MusicConfig {
  url: string;
  title: string;
  artist: string;
  autoPlay: boolean;
  loop?: boolean;
  isCustomUpload?: boolean;
  fileName?: string;
  fileSize?: string;
  audioKey?: string;
  uploadedAt?: string;
}

export interface SettingsConfig {
  title: string;
  description: string;
  ogImage?: string;
  enableRsvp: boolean;
  enableWishes: boolean;
  enableGift: boolean;
  adminPin: string;
  seo?: {
    metaTitle: string;
    metaDescription: string;
    ogImageUrl?: string;
  };
  features?: {
    enableRsvp: boolean;
    enableWishes: boolean;
    enableGift: boolean;
    enableMusic: boolean;
  };
  adminPasscode?: string;
}

export interface VersionSnapshot {
  versionId: string;
  versionNumber: number;
  label: string;
  publishedAt: string;
  configSnapshot: {
    theme: ThemeConfig;
    content: ContentConfig;
    layout: SectionLayoutConfig[];
    music: MusicConfig;
    settings: SettingsConfig;
  };
}

// -------------------------------------------------------------
// MASTER INVITATION MODEL
// -------------------------------------------------------------
export interface Invitation {
  id: string;
  // Core legacy fields maintained for full backward compatibility
  groomName: string;
  groomFullName: string;
  groomParents: string;
  brideName: string;
  brideFullName: string;
  brideParents: string;
  eventDate: string;
  eventDateISO: string;
  eventTime: string;
  venue: string;
  address: string;
  mapsUrl: string;
  coverImage: string;
  heroImage: string;
  musicUrl: string;
  musicTitle: string;
  storyTitle: string;
  storyMilestones: LoveStoryMilestone[];
  akad: EventSchedule;
  resepsi: EventSchedule;
  galleryImages: GalleryItem[];
  bankAccounts: BankAccount[];
  createdAt: string;

  // New CMS Full Specifications
  theme?: ThemeConfig;
  content?: ContentConfig;
  layout?: SectionLayoutConfig[];
  music?: MusicConfig;
  settings?: SettingsConfig;

  // Draft vs Published Engine
  publishedVersion?: {
    theme: ThemeConfig;
    content: ContentConfig;
    layout: SectionLayoutConfig[];
    music: MusicConfig;
    settings: SettingsConfig;
    publishedAt: string;
  } | null;

  lastEditedAt?: string;
  lastPublishedAt?: string | null;
  hasUnpublishedChanges?: boolean;
  versionHistory?: VersionSnapshot[];
}

export interface Guest {
  id: string;
  name: string;
  slug: string;
  category?: GuestCategory | string;
  phone?: string;
  isOpened: boolean;
  openedAt?: string | null;
  rsvpStatus?: RSVPStatus;
  guestCount?: number;
  rsvpNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GuestWish {
  id: string;
  guestName: string;
  message: string;
  attendance?: 'hadir' | 'tidak_hadir' | 'ragu';
  createdAt: string;
}

export interface GuestFilterOptions {
  searchQuery: string;
  category: 'all' | GuestCategory | string;
  openedFilter: 'all' | 'opened' | 'unopened';
  rsvpFilter: 'all' | RSVPStatus;
}

