import React, { useState, useEffect, lazy, Suspense } from 'react';
import { GuestInvitationPage } from './pages/GuestInvitationPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'invitation' | 'admin'>('invitation');
  const [currentSlug, setCurrentSlug] = useState<string>('tamu'); // Default to general: tamu (displays "Tamu Undangan")

  // Parse path or hash on initial load & history navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);

      // 1. Admin route check
      if (path.startsWith('/admin') || hash.startsWith('#/admin') || search.get('page') === 'admin') {
        setCurrentRoute('admin');
        return;
      }

      // 2. Invitation route check: /inv/{slug}
      const invPathMatch = path.match(/\/inv\/([a-zA-Z0-9_-]+)/i);
      const invHashMatch = hash.match(/#\/inv\/([a-zA-Z0-9_-]+)/i);
      const slugParam = search.get('slug') || search.get('to') || search.get('guest');

      if (invPathMatch && invPathMatch[1]) {
        setCurrentSlug(decodeURIComponent(invPathMatch[1]).toLowerCase());
        setCurrentRoute('invitation');
      } else if (invHashMatch && invHashMatch[1]) {
        setCurrentSlug(decodeURIComponent(invHashMatch[1]).toLowerCase());
        setCurrentRoute('invitation');
      } else if (slugParam) {
        setCurrentSlug(decodeURIComponent(slugParam).toLowerCase());
        setCurrentRoute('invitation');
      } else {
        // Fallback default: General guest without personal slug ("Tamu Undangan")
        setCurrentRoute('invitation');
        setCurrentSlug('tamu');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Update URL history without page reload
  const navigateToSlug = (slug: string) => {
    const clean = slug.trim().toLowerCase();
    setCurrentSlug(clean);
    setCurrentRoute('invitation');
    const newUrl = clean === 'tamu' ? '/' : `/inv/${clean}`;
    try {
      window.history.pushState({}, '', newUrl);
    } catch {
      window.location.hash = clean === 'tamu' ? '' : `/inv/${clean}`;
    }
  };

  const navigateToAdmin = () => {
    setCurrentRoute('admin');
    try {
      window.history.pushState({}, '', '/admin');
    } catch {
      window.location.hash = '/admin';
    }
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen">
        {/* Main View Router */}
        {currentRoute === 'admin' ? (
          <Suspense
            fallback={
              <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#D6C7B2] border-t-[#242220] animate-spin mb-3" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#8C827A]">Memuat Admin Studio...</p>
              </div>
            }
          >
            <AdminDashboard
              onBackToInvitation={() => navigateToSlug(currentSlug)}
              onNavigateToSlug={navigateToSlug}
            />
          </Suspense>
        ) : (
          <GuestInvitationPage
            slug={currentSlug}
            onNavigateHome={() => navigateToSlug('tamu')}
            onOpenAdmin={navigateToAdmin}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
