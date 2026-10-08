import React, { useState, useEffect, useRef } from 'react';
import { Guest, Invitation, SectionLayoutConfig } from '../types';
import { dbService } from '../services/dbService';
import { CoverOpening } from '../components/invitation/CoverOpening';
import { HeroSection } from '../components/invitation/HeroSection';
import { CoupleSection } from '../components/invitation/CoupleSection';
import { CountdownSection } from '../components/invitation/CountdownSection';
import { EventDetailsSection } from '../components/invitation/EventDetailsSection';
import { LoveStorySection } from '../components/invitation/LoveStorySection';
import { GallerySection } from '../components/invitation/GallerySection';
import { RsvpSection } from '../components/invitation/RsvpSection';
import { WishesSection } from '../components/invitation/WishesSection';
import { GiftSection } from '../components/invitation/GiftSection';
import { ClosingSection } from '../components/invitation/ClosingSection';
import { MusicPlayer } from '../components/invitation/MusicPlayer';
import { NotFoundView } from '../components/invitation/NotFoundView';
import { DEFAULT_CONTENT_CONFIG } from '../constants/cmsDefaults';

interface GuestInvitationPageProps {
  slug: string;
  onNavigateHome?: () => void;
  onOpenAdmin?: () => void;
  customInvitation?: Invitation;
  previewMode?: boolean;
  initialOpened?: boolean;
}

export const GuestInvitationPage: React.FC<GuestInvitationPageProps> = ({
  slug,
  onNavigateHome,
  onOpenAdmin,
  customInvitation,
  previewMode = false,
  initialOpened = false,
}) => {
  const [invitation, setInvitation] = useState<Invitation | null>(customInvitation || null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(!customInvitation);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isOpened, setIsOpened] = useState(initialOpened);

  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (customInvitation) {
      setInvitation(customInvitation);
      setIsLoading(false);
      return;
    }
    loadData(slug);
  }, [slug, customInvitation]);

  // Lock scroll completely until the client clicks "Buka Undangan"
  useEffect(() => {
    if (isOpened || previewMode) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Firmly position at top of cover
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Block any attempt to scroll down before "Buka Undangan" is clicked
    const handlePreventScroll = (e: Event) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        'ArrowDown',
        'ArrowUp',
        'PageDown',
        'PageUp',
        'Space',
        'Home',
        'End',
      ];
      if (blockedKeys.includes(e.code) || blockedKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handlePreventScroll, { passive: false });
    window.addEventListener('touchmove', handlePreventScroll, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
      window.removeEventListener('wheel', handlePreventScroll);
      window.removeEventListener('touchmove', handlePreventScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpened, previewMode]);

  const loadData = async (guestSlug: string) => {
    setIsLoading(true);
    setIsNotFound(false);
    try {
      // 1. Fetch master invitation (guests receive the published version)
      const invData = await dbService.getInvitation(undefined, 'published');
      setInvitation(invData);

      // 2. Fetch personalized guest by slug
      // If slug is empty, general ('tamu'/'guest'), or not found in database,
      // fallback smoothly to general guest (shows "Tamu Undangan") without throwing 404
      if (guestSlug && guestSlug !== 'tamu' && guestSlug !== 'guest') {
        const guestData = await dbService.getGuestBySlug(guestSlug);
        if (guestData) {
          setGuest(guestData);
        } else {
          // If guest slug is not listed in DB, gracefully display as general "Tamu Undangan"
          setGuest(null);
        }
      } else {
        // General guest (Bapak/Ibu/Saudara/i) without personal slug
        setGuest(null);
      }
      setIsNotFound(false);
    } catch (err) {
      console.error('Error fetching invitation details:', err);
      // Only set not found if master invitation completely fails
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const smoothScrollToTarget = (targetElement: HTMLElement) => {
    if (!targetElement) return;

    // Detect if inside an overflow container (e.g. simulated device modal in admin preview) or window
    let scrollContainer: HTMLElement | Window = window;
    let parent = targetElement.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      ) {
        scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }

    const isWindow = scrollContainer === window;
    const getScrollTop = () =>
      isWindow
        ? window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
        : (scrollContainer as HTMLElement).scrollTop;

    const setScrollTop = (val: number) => {
      if (isWindow) {
        window.scrollTo(0, val);
      } else {
        (scrollContainer as HTMLElement).scrollTop = val;
      }
    };

    const startY = getScrollTop();
    const targetY = isWindow
      ? targetElement.getBoundingClientRect().top + getScrollTop()
      : targetElement.offsetTop;

    const diff = targetY - startY;
    if (Math.abs(diff) < 2) return;

    // Ultra smooth and slow continuous cinematic glide (2.5 seconds)
    // Cubic-bezier approximation for pure, buttery-smooth acceleration and soft deceleration
    const duration = 2500;
    let startTime: number | null = null;
    let animationActive = true;

    // Smooth quartic ease-in-out curve
    const easeInOutQuart = (t: number) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

    const onUserInterrupt = (e: TouchEvent | WheelEvent) => {
      // Only cancel if user intentionally drags with a substantial touch gesture
      animationActive = false;
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('wheel', onUserInterrupt);
      window.removeEventListener('touchmove', onUserInterrupt);
    };

    // Small delay before listening to interrupt prevents the click event from killing the animation
    setTimeout(() => {
      if (animationActive) {
        window.addEventListener('wheel', onUserInterrupt, { passive: true });
        window.addEventListener('touchmove', onUserInterrupt, { passive: true });
      }
    }, 300);

    const step = (timestamp: number) => {
      if (!animationActive) return;
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutQuart(progress);
      const currentY = startY + diff * easedProgress;

      setScrollTop(currentY);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        cleanup();
        setScrollTop(targetY);
      }
    };

    requestAnimationFrame(step);
  };

  const handleOpenInvitation = () => {
    // 1. Immediately release all overflow and touch-action constraints
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.touchAction = '';

    // 2. Mark opened state
    setIsOpened(true);

    // 3. Kick off the silky smooth scroll
    requestAnimationFrame(() => {
      if (mainContentRef.current) {
        smoothScrollToTarget(mainContentRef.current);
      }
    });
  };

  const handleRsvpSuccess = (updatedGuest: Guest) => {
    setGuest(updatedGuest);
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-full border-2 border-[#D6C7B2] border-t-[#242220] animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.25em] text-[#8C827A] font-light">
          Mempersiapkan Undangan...
        </p>
      </div>
    );
  }

  // 404 / Error State when slug is not found
  if ((isNotFound || !invitation) && !previewMode) {
    return (
      <NotFoundView
        searchedSlug={slug}
        onBackToHome={() => {
          if (onNavigateHome) {
            onNavigateHome();
          } else {
            window.location.href = '/';
          }
        }}
      />
    );
  }

  if (!invitation) return null;

  // Custom theme styles from CMS
  const themeStyles: React.CSSProperties = {
    backgroundColor: invitation.theme?.palette.background || '#FAF8F5',
    color: invitation.theme?.palette.bodyText || '#242220',
    fontFamily: invitation.theme?.typography.bodyFont ? `"${invitation.theme.typography.bodyFont}", sans-serif` : undefined,
  };

  // Layout section ordering & visibility resolver
  const layoutSections: SectionLayoutConfig[] = invitation.layout || [
    { id: 'hero', name: 'Hero', enabled: true, layoutStyle: 'centered', imagePosition: 'center', overlay: 'subtle', textAlignment: 'center', paddingY: 'spacious' },
    { id: 'couple', name: 'Couple', enabled: true, layoutStyle: 'cards', imagePosition: 'top', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'countdown', name: 'Countdown', enabled: true, layoutStyle: 'centered', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'event', name: 'Event', enabled: true, layoutStyle: 'cards', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'story', name: 'Story', enabled: true, layoutStyle: 'centered', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'gallery', name: 'Gallery', enabled: true, layoutStyle: 'cards', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'rsvp', name: 'RSVP', enabled: true, layoutStyle: 'centered', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'wishes', name: 'Wishes', enabled: true, layoutStyle: 'centered', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'gift', name: 'Gift', enabled: true, layoutStyle: 'cards', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'normal' },
    { id: 'closing', name: 'Closing', enabled: true, layoutStyle: 'centered', imagePosition: 'center', overlay: 'none', textAlignment: 'center', paddingY: 'spacious' },
  ];

  return (
    <div
      className="relative min-h-screen overflow-x-hidden transition-colors duration-300"
      style={themeStyles}
    >
      {/* Background Ambient Music Player */}
      {!previewMode && (
        <MusicPlayer
          musicUrl={invitation.music?.url || invitation.musicUrl}
          autoPlayTrigger={isOpened}
        />
      )}

      {/* 1. Cover Opening Section (Top section of unified single-page scroll) */}
      <div className="w-full max-w-2xl mx-auto border-x border-[#EFE8DC]/60 shadow-[0_0_50px_rgba(0,0,0,0.03)]">
        <CoverOpening
          invitation={invitation}
          guest={guest}
          onOpen={handleOpenInvitation}
          isOpened={isOpened}
        />
      </div>

      {/* 2. Main Invitation Content (Located right below Cover in single scrollable flow) */}
      <main
        ref={mainContentRef}
        id="main-invitation"
        className="w-full max-w-2xl mx-auto shadow-[0_0_50px_rgba(0,0,0,0.03)] border-x border-[#EFE8DC]/60"
        style={{ backgroundColor: invitation.theme?.palette.background || '#FAF8F5' }}
      >
        {layoutSections
          .filter(section => section.enabled && section.id !== 'opening')
          .map(section => {
            switch (section.id) {
              case 'hero':
                return (
                  <HeroSection
                    key="hero"
                    invitation={invitation}
                    layout={section}
                    isOpened={isOpened || previewMode}
                  />
                );
              case 'couple':
                return (
                  <CoupleSection
                    key="couple"
                    content={invitation.content?.couple || DEFAULT_CONTENT_CONFIG.couple}
                    layout={section}
                  />
                );
              case 'countdown':
                return (
                  <CountdownSection
                    key="countdown"
                    targetDateISO={invitation.content?.countdown.targetDateISO || invitation.eventDateISO}
                    title={invitation.content?.countdown.title}
                    subtitle={invitation.content?.countdown.subtitle}
                    layout={section}
                  />
                );
              case 'event':
                return <EventDetailsSection key="event" invitation={invitation} layout={section} />;
              case 'story':
                return (
                  <LoveStorySection
                    key="story"
                    milestones={invitation.content?.story.milestones || invitation.storyMilestones}
                    sectionTitle={invitation.content?.story.sectionTitle}
                    sectionSubtitle={invitation.content?.story.sectionSubtitle}
                    layout={section}
                  />
                );
              case 'gallery':
                return (
                  <GallerySection
                    key="gallery"
                    images={invitation.content?.gallery.images || invitation.galleryImages}
                    sectionTitle={invitation.content?.gallery.sectionTitle}
                    sectionSubtitle={invitation.content?.gallery.sectionSubtitle}
                    layout={section}
                  />
                );
              case 'rsvp':
                return (
                  <RsvpSection
                    key="rsvp"
                    guest={guest}
                    onRsvpSuccess={handleRsvpSuccess}
                    layout={section}
                  />
                );
              case 'wishes':
                return (
                  <WishesSection
                    key="wishes"
                    defaultGuestName={guest?.name || 'Tamu Undangan'}
                    layout={section}
                  />
                );
              case 'gift':
                return (
                  <GiftSection
                    key="gift"
                    bankAccounts={invitation.content?.gift.bankAccounts || invitation.bankAccounts}
                    sectionTitle={invitation.content?.gift.sectionTitle}
                    sectionSubtitle={invitation.content?.gift.sectionSubtitle}
                    layout={section}
                  />
                );
              case 'closing':
                return <ClosingSection key="closing" invitation={invitation} layout={section} />;
              default:
                return null;
            }
          })}
      </main>
    </div>
  );
};
