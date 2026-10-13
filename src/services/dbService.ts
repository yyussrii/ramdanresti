import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { Invitation, Guest, GuestCategory, GuestWish, RSVPStatus } from '../types';
import { INITIAL_INVITATION, INITIAL_GUESTS, INITIAL_WISHES } from './seedData';
import { generateSlug, generateUniqueSlug } from '../utils/slugGenerator';

const LOCAL_STORAGE_INVITATION_KEY = 'wedding_invitation_data_v1';
const LOCAL_STORAGE_GUESTS_KEY = 'wedding_guests_data_v1';
const LOCAL_STORAGE_WISHES_KEY = 'wedding_wishes_data_v1';

// Local storage helpers for instantaneous fallback
function getLocalGuests(): Guest[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_GUESTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let hasChanges = false;
        const existingSlugs: string[] = [];
        const migrated = parsed.map((g: any) => {
          if (!g.slug || g.uniqueCode) {
            hasChanges = true;
          }
          const cleanSlug = g.slug || generateUniqueSlug(g.name || 'tamu', existingSlugs);
          existingSlugs.push(cleanSlug);
          const { uniqueCode, ...rest } = g;
          return {
            ...rest,
            slug: cleanSlug,
            updatedAt: g.updatedAt || new Date().toISOString(),
          } as Guest;
        });

        // Ensure category is cleared if it was from previous default seed
        if (!localStorage.getItem('wedding_guests_category_v2_migrated')) {
          migrated.forEach((g: any) => {
            delete g.category;
          });
          hasChanges = true;
          localStorage.setItem('wedding_guests_category_v2_migrated', 'true');
        }

        if (hasChanges) {
          saveLocalGuests(migrated);
        }
        return migrated;
      }
    }
  } catch (e) {
    console.error('Failed to read guests from local storage', e);
  }
  // Initialize default seed
  saveLocalGuests(INITIAL_GUESTS);
  return INITIAL_GUESTS;
}

function saveLocalGuests(guests: Guest[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_GUESTS_KEY, JSON.stringify(guests));
  } catch (e) {
    console.error('Failed to save guests to local storage', e);
  }
}

function getLocalWishes(): GuestWish[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_WISHES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to read wishes from local storage', e);
  }
  saveLocalWishes(INITIAL_WISHES);
  return INITIAL_WISHES;
}

function saveLocalWishes(wishes: GuestWish[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_WISHES_KEY, JSON.stringify(wishes));
  } catch (e) {
    console.error('Failed to save wishes to local storage', e);
  }
}

function getLocalInvitation(): Invitation {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_INVITATION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Check migration for Resti & Ramdan (bride name first)
      if (
        !localStorage.getItem('wedding_invitation_v3_resti_first') ||
        parsed.content?.hero?.heading === 'The Wedding of Ramdan & Resti' ||
        parsed.content?.closing?.couplesText === 'Ramdan & Resti' ||
        parsed.groomName === 'Radian'
      ) {
        parsed.groomName = 'Ramdan';
        parsed.groomFullName = 'Ramdan Pratama';
        parsed.brideName = 'Resti';
        parsed.brideFullName = 'Resti Azzahra';
        if (parsed.content?.hero) {
          parsed.content.hero.groomName = 'Ramdan';
          parsed.content.hero.brideName = 'Resti';
          parsed.content.hero.heading = 'The Wedding of Resti & Ramdan';
        }
        if (parsed.content?.couple?.groom) {
          parsed.content.couple.groom.name = 'Ramdan';
          parsed.content.couple.groom.fullName = 'Ramdan Pratama';
        }
        if (parsed.content?.couple?.bride) {
          parsed.content.couple.bride.name = 'Resti';
          parsed.content.couple.bride.fullName = 'Resti Azzahra';
        }
        if (parsed.content?.closing) {
          parsed.content.closing.couplesText = 'Resti & Ramdan';
          parsed.content.closing.footerText = 'The Wedding Celebration of Resti & Ramdan • 2026';
        }
        if (parsed.publishedVersion) {
          if (parsed.publishedVersion.content?.hero) {
            parsed.publishedVersion.content.hero.heading = 'The Wedding of Resti & Ramdan';
          }
          if (parsed.publishedVersion.content?.closing) {
            parsed.publishedVersion.content.closing.couplesText = 'Resti & Ramdan';
            parsed.publishedVersion.content.closing.footerText = 'The Wedding Celebration of Resti & Ramdan • 2026';
          }
        }
        localStorage.setItem('wedding_invitation_v3_resti_first', 'true');
        saveLocalInvitation(parsed);
      }
      // Ensure couple fields are fully preserved & initialized
      if (parsed.content?.couple?.groom) {
        if (!parsed.content.couple.groom.parents) {
          parsed.content.couple.groom.parents = INITIAL_INVITATION.content.couple.groom.parents;
        }
        if (!parsed.content.couple.groom.instagram) {
          parsed.content.couple.groom.instagram = INITIAL_INVITATION.content.couple.groom.instagram;
        }
        if (!parsed.content.couple.groom.description) {
          parsed.content.couple.groom.description = INITIAL_INVITATION.content.couple.groom.description;
        }
        if (!parsed.content.couple.groom.fullNameWithTitles) {
          parsed.content.couple.groom.fullNameWithTitles = INITIAL_INVITATION.content.couple.groom.fullNameWithTitles;
        }
      }
      if (parsed.content?.couple?.bride) {
        if (!parsed.content.couple.bride.parents) {
          parsed.content.couple.bride.parents = INITIAL_INVITATION.content.couple.bride.parents;
        }
        if (!parsed.content.couple.bride.instagram) {
          parsed.content.couple.bride.instagram = INITIAL_INVITATION.content.couple.bride.instagram;
        }
        if (!parsed.content.couple.bride.description) {
          parsed.content.couple.bride.description = INITIAL_INVITATION.content.couple.bride.description;
        }
        if (!parsed.content.couple.bride.fullNameWithTitles) {
          parsed.content.couple.bride.fullNameWithTitles = INITIAL_INVITATION.content.couple.bride.fullNameWithTitles;
        }
      }

      return parsed;
    }
  } catch (e) {
    console.error('Failed to read invitation from local storage', e);
  }
  saveLocalInvitation(INITIAL_INVITATION);
  return INITIAL_INVITATION;
}

function saveLocalInvitation(inv: Invitation): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_INVITATION_KEY, JSON.stringify(inv));
  } catch (e) {
    console.error('Failed to save invitation to local storage', e);
  }
}

export const dbService = {
  /**
   * Fetch master invitation details
   * If version === 'published', prioritizes the publishedVersion snapshot for guests
   */
  async getInvitation(
    invitationId: string = INITIAL_INVITATION.id,
    version: 'draft' | 'published' = 'published'
  ): Promise<Invitation> {
    let inv: Invitation;

    if (isFirebaseConfigured && db) {
      try {
        const invDoc = await getDoc(doc(db, 'invitations', invitationId));
        if (invDoc.exists()) {
          inv = { id: invDoc.id, ...invDoc.data() } as Invitation;
          saveLocalInvitation(inv);
        } else {
          inv = getLocalInvitation();
          try {
            await setDoc(doc(db, 'invitations', invitationId), inv);
            console.info('[Firestore] Master invitation saved to cloud database');
          } catch (seedErr) {
            console.warn('[Firestore] Initial master invitation upload note:', seedErr);
          }
        }
      } catch (err) {
        console.warn('[Firestore] Falling back to local data for invitation:', err);
        inv = getLocalInvitation();
      }
    } else {
      inv = getLocalInvitation();
    }

    // Ensure CMS fields exist by filling defaults if missing
    if (!inv.theme) inv.theme = INITIAL_INVITATION.theme;
    if (!inv.content) inv.content = INITIAL_INVITATION.content;
    if (!inv.layout) inv.layout = INITIAL_INVITATION.layout;
    if (!inv.music) inv.music = INITIAL_INVITATION.music;
    if (!inv.settings) inv.settings = INITIAL_INVITATION.settings;
    if (!inv.versionHistory) inv.versionHistory = INITIAL_INVITATION.versionHistory;

    // If published mode is requested and publishedVersion exists, overlay published fields
    if (version === 'published' && inv.publishedVersion) {
      return {
        ...inv,
        theme: inv.publishedVersion.theme || inv.theme,
        content: inv.publishedVersion.content || inv.content,
        layout: inv.publishedVersion.layout || inv.layout,
        music: inv.publishedVersion.music || inv.music,
        settings: inv.publishedVersion.settings || inv.settings,
      };
    }

    return inv;
  },

  /**
   * Save draft changes to Firestore / localStorage
   */
  async saveDraft(
    updates: Partial<Invitation>,
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<Invitation> {
    const current = await this.getInvitation(invitationId, 'draft');
    const updated: Invitation = {
      ...current,
      ...updates,
      lastEditedAt: new Date().toISOString(),
    };

    // Synchronize top-level legacy fields if content was updated
    if (updates.content) {
      updated.groomName = updates.content.hero.groomName;
      updated.brideName = updates.content.hero.brideName;
      if (updates.content.couple?.groom) {
        if (updates.content.couple.groom.fullNameWithTitles || updates.content.couple.groom.fullName) {
          updated.groomFullName = updates.content.couple.groom.fullNameWithTitles || updates.content.couple.groom.fullName;
        }
        if (updates.content.couple.groom.parents) {
          updated.groomParents = updates.content.couple.groom.parents;
        }
      }
      if (updates.content.couple?.bride) {
        if (updates.content.couple.bride.fullNameWithTitles || updates.content.couple.bride.fullName) {
          updated.brideFullName = updates.content.couple.bride.fullNameWithTitles || updates.content.couple.bride.fullName;
        }
        if (updates.content.couple.bride.parents) {
          updated.brideParents = updates.content.couple.bride.parents;
        }
      }
      updated.eventDate = updates.content.hero.eventDate;
      updated.eventDateISO = updates.content.hero.eventDateISO;
      updated.venue = updates.content.hero.venue;
      updated.heroImage = updates.content.hero.heroImage;
      updated.akad = updates.content.event.akad;
      updated.resepsi = updates.content.event.resepsi;
      updated.storyMilestones = updates.content.story.milestones;
      updated.galleryImages = updates.content.gallery.images;
      updated.bankAccounts = updates.content.gift.bankAccounts;
    }
    if (updates.music) {
      updated.musicUrl = updates.music.url;
      updated.musicTitle = updates.music.title;
    }

    // Keep publishedVersion completely synchronized so landing page reflects CMS updates immediately
    const liveTheme = updates.theme || updated.theme || INITIAL_INVITATION.theme;
    const liveContent = updates.content || updated.content || INITIAL_INVITATION.content;
    const liveLayout = updates.layout || updated.layout || INITIAL_INVITATION.layout;
    const liveMusic = updates.music || updated.music || INITIAL_INVITATION.music;
    const liveSettings = updates.settings || updated.settings || INITIAL_INVITATION.settings;

    updated.publishedVersion = {
      theme: liveTheme!,
      content: liveContent!,
      layout: liveLayout!,
      music: liveMusic!,
      settings: liveSettings!,
      publishedAt: new Date().toISOString(),
    };
    updated.lastPublishedAt = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      try {
        const invDocRef = doc(db, 'invitations', invitationId);
        await setDoc(invDocRef, updated, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Error saving draft, falling back locally:', err);
      }
    }

    saveLocalInvitation(updated);
    return updated;
  },

  /**
   * Publish current configuration (copies to publishedVersion & creates version snapshot)
   */
  async publishInvitation(
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<Invitation> {
    const current = await this.getInvitation(invitationId, 'draft');
    const now = new Date().toISOString();

    const newVersionNumber = (current.versionHistory?.length || 0) + 1;
    const newSnapshot = {
      versionId: `v-${Date.now()}`,
      versionNumber: newVersionNumber,
      label: `Publikasi Versi ${newVersionNumber}.0`,
      publishedAt: now,
      configSnapshot: {
        theme: current.theme!,
        content: current.content!,
        layout: current.layout!,
        music: current.music!,
        settings: current.settings!,
      },
    };

    const publishedVersion = {
      theme: current.theme!,
      content: current.content!,
      layout: current.layout!,
      music: current.music!,
      settings: current.settings!,
      publishedAt: now,
    };

    const updatedHistory = [newSnapshot, ...(current.versionHistory || [])];

    const updated: Invitation = {
      ...current,
      publishedVersion,
      lastPublishedAt: now,
      versionHistory: updatedHistory,
    };

    if (isFirebaseConfigured && db) {
      try {
        const invDocRef = doc(db, 'invitations', invitationId);
        await setDoc(invDocRef, updated, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Error publishing, falling back locally:', err);
      }
    }

    saveLocalInvitation(updated);
    return updated;
  },

  /**
   * Restore a historical snapshot into draft
   */
  async restoreVersion(
    versionId: string,
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<Invitation> {
    const current = await this.getInvitation(invitationId, 'draft');
    const targetSnapshot = current.versionHistory?.find(v => v.versionId === versionId);

    if (!targetSnapshot) {
      throw new Error('Versi tidak ditemukan');
    }

    const { theme, content, layout, music, settings } = targetSnapshot.configSnapshot;
    return this.saveDraft(
      {
        theme,
        content,
        layout,
        music,
        settings,
      },
      invitationId
    );
  },

  /**
   * Reset design tokens to default template without altering content
   */
  async resetDesign(
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<Invitation> {
    return this.saveDraft(
      {
        theme: INITIAL_INVITATION.theme,
        layout: INITIAL_INVITATION.layout,
      },
      invitationId
    );
  },

  /**
   * Look up a guest by their human-readable URL slug (e.g., pak-yanto)
   * Also updates isOpened = true and openedAt timestamp
   * Enforces security: does NOT return or expose other guests
   */
  async getGuestBySlug(
    slug: string,
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<Guest | null> {
    const cleanSlug = slug.trim().toLowerCase();

    if (isFirebaseConfigured && db) {
      try {
        const guestsRef = collection(db, 'invitations', invitationId, 'guests');
        const q = query(guestsRef, where('slug', '==', cleanSlug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const guestDoc = querySnapshot.docs[0];
          const guestData = guestDoc.data() as Omit<Guest, 'id'>;
          const guest: Guest = { id: guestDoc.id, ...guestData };

          // Update opened state if not already opened
          if (!guest.isOpened) {
            const now = new Date().toISOString();
            await updateDoc(guestDoc.ref, {
              isOpened: true,
              openedAt: now,
              updatedAt: now,
            });
            guest.isOpened = true;
            guest.openedAt = now;
            guest.updatedAt = now;
          }

          return guest;
        }
      } catch (err) {
        console.warn('[Firestore] Looking up guest locally:', err);
      }
    }

    // Local fallback
    const localGuests = getLocalGuests();
    const foundIndex = localGuests.findIndex(
      g => g.slug.trim().toLowerCase() === cleanSlug
    );

    if (foundIndex === -1) {
      return null;
    }

    const current = localGuests[foundIndex];
    if (!current.isOpened) {
      const now = new Date().toISOString();
      const updated: Guest = {
        ...current,
        isOpened: true,
        openedAt: now,
        updatedAt: now,
      };
      localGuests[foundIndex] = updated;
      saveLocalGuests(localGuests);
      return updated;
    }

    return current;
  },

  /**
   * Submit RSVP confirmation for a guest
   */
  async submitRSVP(
    guestId: string,
    status: RSVPStatus,
    guestCount: number,
    rsvpNotes?: string,
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const guestDocRef = doc(db, 'invitations', invitationId, 'guests', guestId);
        await updateDoc(guestDocRef, {
          rsvpStatus: status,
          guestCount,
          rsvpNotes: rsvpNotes || '',
          isOpened: true,
          openedAt: new Date().toISOString()
        });
        return true;
      } catch (err) {
        console.warn('[Firestore] Falling back to local RSVP submission:', err);
      }
    }

    const localGuests = getLocalGuests();
    const index = localGuests.findIndex(g => g.id === guestId);
    if (index !== -1) {
      localGuests[index] = {
        ...localGuests[index],
        rsvpStatus: status,
        guestCount,
        rsvpNotes,
        isOpened: true,
        openedAt: localGuests[index].openedAt || new Date().toISOString()
      };
      saveLocalGuests(localGuests);
      return true;
    }
    return false;
  },

  /**
   * Fetch all guest prayers & wishes
   */
  async getWishes(invitationId: string = INITIAL_INVITATION.id): Promise<GuestWish[]> {
    if (isFirebaseConfigured && db) {
      try {
        const wishesRef = collection(db, 'invitations', invitationId, 'wishes');
        const q = query(wishesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const list: GuestWish[] = [];
        querySnapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<GuestWish, 'id'>) });
        });
        if (list.length > 0) {
          saveLocalWishes(list);
          return list;
        } else {
          // Cloud database has no wishes yet. Seed initial wishes to cloud!
          const localWishes = getLocalWishes();
          for (const w of localWishes) {
            const { id, ...data } = w;
            await setDoc(doc(db, 'invitations', invitationId, 'wishes', id), data);
          }
          return localWishes;
        }
      } catch (err) {
        console.warn('[Firestore] Reading wishes locally:', err);
      }
    }
    return getLocalWishes();
  },

  /**
   * Add a new guest prayer & wish
   */
  async addWish(
    guestName: string,
    message: string,
    attendance?: 'hadir' | 'tidak_hadir' | 'ragu',
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<GuestWish> {
    const newWish: Omit<GuestWish, 'id'> = {
      guestName: guestName.trim(),
      message: message.trim(),
      attendance,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        const wishesRef = collection(db, 'invitations', invitationId, 'wishes');
        const docRef = await addDoc(wishesRef, newWish);
        const created: GuestWish = { id: docRef.id, ...newWish };
        const local = getLocalWishes();
        saveLocalWishes([created, ...local]);
        return created;
      } catch (err) {
        console.warn('[Firestore] Storing wish locally:', err);
      }
    }

    const local = getLocalWishes();
    const created: GuestWish = {
      id: `wish-${Date.now()}`,
      ...newWish
    };
    saveLocalWishes([created, ...local]);
    return created;
  },

  /**
   * ADMIN: Delete a guest prayer / wish from Cloud Firestore and local storage
   */
  async deleteWish(
    wishId: string,
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const wishDocRef = doc(db, 'invitations', invitationId, 'wishes', wishId);
        await deleteDoc(wishDocRef);
        console.info('[Firestore] Successfully deleted wish document:', wishId);
      } catch (err) {
        console.warn('[Firestore] Error deleting wish from cloud:', err);
      }
    }

    const localWishes = getLocalWishes();
    const filtered = localWishes.filter(w => w.id !== wishId);
    saveLocalWishes(filtered);
    return true;
  },

  /**
   * ADMIN METHODS
   * List all guests (Admin only)
   */
  async getAllGuests(invitationId: string = INITIAL_INVITATION.id): Promise<Guest[]> {
    if (isFirebaseConfigured && db) {
      try {
        const guestsRef = collection(db, 'invitations', invitationId, 'guests');
        const querySnapshot = await getDocs(guestsRef);
        const list: Guest[] = [];
        querySnapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as Omit<Guest, 'id'>) });
        });
        if (list.length > 0) {
          const sorted = list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
          saveLocalGuests(sorted);
          return sorted;
        } else {
          // Cloud database has no guests yet. Seed initial guests to cloud!
          const localGuests = getLocalGuests();
          for (const g of localGuests) {
            const { id, ...data } = g;
            await setDoc(doc(db, 'invitations', invitationId, 'guests', id), data);
          }
          console.info('[Firestore] Initialized guest collection in cloud database');
          return localGuests;
        }
      } catch (err) {
        console.warn('[Firestore] Listing guests locally:', err);
      }
    }
    return getLocalGuests();
  },

  /**
   * ADMIN: Add a new guest with automatic slug generation
   */
  async addGuest(
    guestInput: {
      name: string;
      category?: GuestCategory | string;
      phone?: string;
      customSlug?: string;
      rsvpStatus?: RSVPStatus;
      guestCount?: number;
    },
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<Guest> {
    const allGuests = await this.getAllGuests(invitationId);
    const existingSlugs = allGuests.map(g => g.slug);

    const finalSlug = guestInput.customSlug?.trim()
      ? generateUniqueSlug(guestInput.customSlug, existingSlugs)
      : generateUniqueSlug(guestInput.name, existingSlugs);

    const now = new Date().toISOString();
    const newGuestData: Omit<Guest, 'id'> = {
      name: guestInput.name.trim(),
      slug: finalSlug,
      ...(guestInput.category?.trim() ? { category: guestInput.category.trim() } : {}),
      phone: guestInput.phone?.trim() || '',
      isOpened: false,
      openedAt: null,
      rsvpStatus: guestInput.rsvpStatus || 'menunggu',
      guestCount: guestInput.guestCount || 1,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      try {
        const guestsRef = collection(db, 'invitations', invitationId, 'guests');
        const docRef = await addDoc(guestsRef, newGuestData);
        const created: Guest = { id: docRef.id, ...newGuestData };
        const localGuests = getLocalGuests();
        saveLocalGuests([created, ...localGuests]);
        return created;
      } catch (err) {
        console.warn('[Firestore] Saving new guest locally:', err);
      }
    }

    const localGuests = getLocalGuests();
    const created: Guest = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...newGuestData
    };
    saveLocalGuests([created, ...localGuests]);
    return created;
  },

  /**
   * ADMIN: Bulk import multiple guests at once
   */
  async addGuestsBulk(
    guestsInput: Array<{ name: string; category?: GuestCategory | string; phone?: string }>,
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<Guest[]> {
    const allGuests = await this.getAllGuests(invitationId);
    const existingSlugs = allGuests.map(g => g.slug);

    const createdList: Guest[] = [];
    const now = new Date().toISOString();

    for (const item of guestsInput) {
      if (!item.name?.trim()) continue;
      const slug = generateUniqueSlug(item.name, existingSlugs);
      existingSlugs.push(slug);

      const guestData: Omit<Guest, 'id'> = {
        name: item.name.trim(),
        slug,
        ...(item.category?.trim() ? { category: item.category.trim() } : {}),
        phone: item.phone?.trim() || '',
        isOpened: false,
        openedAt: null,
        rsvpStatus: 'menunggu',
        guestCount: 1,
        createdAt: now,
        updatedAt: now,
      };

      if (isFirebaseConfigured && db) {
        try {
          const guestsRef = collection(db, 'invitations', invitationId, 'guests');
          const docRef = await addDoc(guestsRef, guestData);
          createdList.push({ id: docRef.id, ...guestData });
          continue;
        } catch (err) {
          console.warn('[Firestore] Bulk add local fallback item:', err);
        }
      }

      createdList.push({
        id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...guestData,
      });
    }

    const localGuests = getLocalGuests();
    saveLocalGuests([...createdList, ...localGuests]);
    return createdList;
  },

  /**
   * ADMIN: Update an existing guest
   */
  async updateGuest(
    guestId: string,
    updates: Partial<Guest>,
    invitationId: string = INITIAL_INVITATION.id
  ): Promise<boolean> {
    const cleanUpdates = { ...updates };
    if (!cleanUpdates.category || cleanUpdates.category.trim() === '') {
      delete cleanUpdates.category;
    }

    if (isFirebaseConfigured && db) {
      try {
        const guestDocRef = doc(db, 'invitations', invitationId, 'guests', guestId);
        await updateDoc(guestDocRef, cleanUpdates);
      } catch (err) {
        console.warn('[Firestore] Updating guest locally:', err);
      }
    }

    const localGuests = getLocalGuests();
    const idx = localGuests.findIndex(g => g.id === guestId);
    if (idx !== -1) {
      const updated = { ...localGuests[idx], ...cleanUpdates };
      localGuests[idx] = updated;
      saveLocalGuests(localGuests);
      return true;
    }
    return true;
  },

  /**
   * ADMIN: Delete a guest
   */
  async deleteGuest(guestId: string, invitationId: string = INITIAL_INVITATION.id): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const guestDocRef = doc(db, 'invitations', invitationId, 'guests', guestId);
        await deleteDoc(guestDocRef);
      } catch (err) {
        console.warn('[Firestore] Deleting guest locally:', err);
      }
    }

    const localGuests = getLocalGuests();
    const filtered = localGuests.filter(g => g.id !== guestId);
    saveLocalGuests(filtered);
    return true;
  },

  /**
   * ADMIN: Reset to initial sample seed (Pak Yanto, Ibu Siti, Budi, Andi, Rina)
   */
  async resetToSeed(invitationId: string = INITIAL_INVITATION.id): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        // Write master invitation
        await setDoc(doc(db, 'invitations', invitationId), INITIAL_INVITATION);
        // Write initial guests
        for (const guest of INITIAL_GUESTS) {
          const { id, ...data } = guest;
          await setDoc(doc(db, 'invitations', invitationId, 'guests', id), data);
        }
        // Write initial wishes
        for (const wish of INITIAL_WISHES) {
          const { id, ...data } = wish;
          await setDoc(doc(db, 'invitations', invitationId, 'wishes', id), data);
        }
        return;
      } catch (err) {
        console.warn('[Firestore] Resetting locally:', err);
      }
    }

    saveLocalInvitation(INITIAL_INVITATION);
    saveLocalGuests(INITIAL_GUESTS);
    saveLocalWishes(INITIAL_WISHES);
  }
};
