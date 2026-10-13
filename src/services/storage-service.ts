import { PageLayout, FitMode, BookReadingState } from '../types';
import { TOTAL_PAGES } from '../data/book-structure';

export const STORAGE_KEY_BOOK_STATE = 'ielts_book_reading_state';
export const LEGACY_STORAGE_KEY_PAGE = 'ielts_reading_page';

export const DEFAULT_BOOK_STATE: BookReadingState = {
  currentPage: 1,
  pageLayout: 'single',
  fitMode: 'height',
  zoomLevel: 1.0,
  lastReadAt: Date.now(),
  highestPageReached: 1,
};

/**
 * Load book reading progress and view state from localStorage.
 * Validates all values against boundary ranges and fallback defaults.
 */
export function loadBookState(): BookReadingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOK_STATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      const currentPage = Math.max(1, Math.min(TOTAL_PAGES, Number(parsed.currentPage) || 1));
      const highestPageReached = Math.max(
        currentPage,
        Math.min(TOTAL_PAGES, Number(parsed.highestPageReached) || currentPage)
      );
      const pageLayout: PageLayout = parsed.pageLayout === 'double' ? 'double' : 'single';
      const fitMode: FitMode = parsed.fitMode === 'width' ? 'width' : 'height';
      const zoomLevel =
        typeof parsed.zoomLevel === 'number' && parsed.zoomLevel >= 0.5 && parsed.zoomLevel <= 2.5
          ? parsed.zoomLevel
          : 1.0;
      const lastReadAt = typeof parsed.lastReadAt === 'number' ? parsed.lastReadAt : Date.now();

      return {
        currentPage,
        pageLayout,
        fitMode,
        zoomLevel,
        lastReadAt,
        highestPageReached,
      };
    }

    // Check legacy key if user visited before
    const legacyPage = localStorage.getItem(LEGACY_STORAGE_KEY_PAGE);
    if (legacyPage) {
      const page = Math.max(1, Math.min(TOTAL_PAGES, parseInt(legacyPage, 10) || 1));
      return {
        ...DEFAULT_BOOK_STATE,
        currentPage: page,
        highestPageReached: page,
      };
    }
  } catch (err) {
    console.warn('Failed to load book state from localStorage', err);
  }

  return { ...DEFAULT_BOOK_STATE };
}

/**
 * Save partial updates to book reading state and persist to localStorage.
 */
export function saveBookState(partial: Partial<BookReadingState>): BookReadingState {
  try {
    const current = loadBookState();
    const updated: BookReadingState = {
      ...current,
      ...partial,
      lastReadAt: Date.now(),
    };

    if (partial.currentPage !== undefined) {
      updated.currentPage = Math.max(1, Math.min(TOTAL_PAGES, partial.currentPage));
      if (!updated.highestPageReached || updated.currentPage > updated.highestPageReached) {
        updated.highestPageReached = updated.currentPage;
      }
    }

    if (partial.pageLayout !== undefined) {
      updated.pageLayout = partial.pageLayout === 'double' ? 'double' : 'single';
    }

    if (partial.fitMode !== undefined) {
      updated.fitMode = partial.fitMode === 'width' ? 'width' : 'height';
    }

    if (partial.zoomLevel !== undefined) {
      updated.zoomLevel = Math.max(0.6, Math.min(2.5, partial.zoomLevel));
    }

    localStorage.setItem(STORAGE_KEY_BOOK_STATE, JSON.stringify(updated));
    // Also save legacy key for backward compatibility
    localStorage.setItem(LEGACY_STORAGE_KEY_PAGE, String(updated.currentPage));

    return updated;
  } catch (err) {
    console.warn('Failed to save book state to localStorage', err);
    return { ...DEFAULT_BOOK_STATE, ...partial };
  }
}

/**
 * Helper to quickly update current reading page.
 */
export function saveCurrentPage(page: number): BookReadingState {
  return saveBookState({ currentPage: page });
}

/**
 * Helper to quickly update page layout (single / double).
 */
export function savePageLayout(layout: PageLayout): BookReadingState {
  return saveBookState({ pageLayout: layout });
}

/**
 * Helper to quickly update fit mode (height / width).
 */
export function saveFitMode(mode: FitMode): BookReadingState {
  return saveBookState({ fitMode: mode });
}

/**
 * Helper to quickly update zoom level.
 */
export function saveZoomLevel(zoom: number): BookReadingState {
  return saveBookState({ zoomLevel: zoom });
}

/**
 * Reset book progress back to beginning (page 1).
 */
export function resetBookProgress(): BookReadingState {
  const resetState: BookReadingState = {
    ...DEFAULT_BOOK_STATE,
    currentPage: 1,
    highestPageReached: 1,
    lastReadAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY_BOOK_STATE, JSON.stringify(resetState));
    localStorage.setItem(LEGACY_STORAGE_KEY_PAGE, '1');
  } catch (err) {
    console.warn('Failed to reset book progress', err);
  }

  return resetState;
}

/**
 * Calculate reading progress percentage (0% - 100%).
 */
export function calculateProgressPercent(page: number): number {
  const safePage = Math.max(1, Math.min(TOTAL_PAGES, page));
  return Math.min(100, Math.max(0, Math.round((safePage / TOTAL_PAGES) * 100)));
}

/**
 * Format timestamp into friendly Vietnamese time string.
 */
export function formatLastReadTime(timestamp: number): string {
  if (!timestamp) return 'Chưa có';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} lúc ${hours}:${mins}`;
}
