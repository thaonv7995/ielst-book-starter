import './styles.css';
import { Navbar } from './components/Navbar';
import { SidebarToc } from './components/SidebarToc';
import { BookViewer } from './components/BookViewer';
import { AudioPlayer } from './components/AudioPlayer';
import { AiChat } from './components/AiChat';
import {
  loadBookState,
  saveCurrentPage,
  savePageLayout,
  saveFitMode,
  saveZoomLevel,
  calculateProgressPercent,
} from './services/storage-service';
import { TOTAL_PAGES } from './data/book-structure';

class App {
  private navbar!: Navbar;
  private sidebar!: SidebarToc;
  private viewer!: BookViewer;
  private audioPlayer!: AudioPlayer;
  private aiChat!: AiChat;

  constructor() {
    this.init();
  }

  private init(): void {
    const navContainer = document.getElementById('navbar-container') as HTMLElement;
    const sidebarContainer = document.getElementById('sidebar-container') as HTMLElement;
    const viewerContainer = document.getElementById('viewer-container') as HTMLElement;
    const audioContainer = document.getElementById('audio-container') as HTMLElement;
    const aiContainer = document.getElementById('ai-container') as HTMLElement;

    // Load persisted state from localStorage
    const savedState = loadBookState();

    // Determine initial page: URL hash takes priority if explicitly given, otherwise restore saved page
    let initialPage = savedState.currentPage || 1;
    let isRestoredFromStorage = false;

    const hashMatch = window.location.hash.match(/page=(\d+)/);
    if (hashMatch) {
      const p = parseInt(hashMatch[1], 10);
      if (p >= 1 && p <= TOTAL_PAGES) {
        initialPage = p;
      }
    } else if (savedState.currentPage > 1) {
      isRestoredFromStorage = true;
    }

    // 1. Initialize BookViewer (Focus on book with restored state)
    this.viewer = new BookViewer(
      viewerContainer,
      initialPage,
      {
        onPageChange: (page) => this.handlePageChange(page),
        onAudioTrigger: (trackId) => {
          this.audioPlayer.playTrackById(trackId, true);
        },
        onAskAiForPage: (prompt) => {
          this.aiChat.openPopup();
          this.aiChat.askPrompt(prompt);
        },
      },
      {
        initialLayout: savedState.pageLayout,
        initialFitMode: savedState.fitMode,
        initialZoom: savedState.zoomLevel,
      }
    );

    // 2. Initialize Navbar (Controls with restored layout/fit/zoom)
    this.navbar = new Navbar(navContainer, {
      initialPage,
      initialLayout: savedState.pageLayout,
      initialFitMode: savedState.fitMode,
      initialZoom: savedState.zoomLevel,
      onPrevPage: () => this.viewer.prevPage(),
      onNextPage: () => this.viewer.nextPage(),
      onJumpPage: (page) => this.viewer.setPage(page),
      onPageLayoutChange: (layout) => {
        this.viewer.setPageLayout(layout);
        savePageLayout(layout);
      },
      onFitModeChange: (mode) => {
        this.viewer.setFitMode(mode);
        saveFitMode(mode);
      },
      onZoomChange: (zoom) => {
        this.viewer.setZoom(zoom);
        this.navbar.setZoom(this.viewer.getZoom());
        saveZoomLevel(this.viewer.getZoom());
      },
      onToggleSidebar: () => {
        this.sidebar.toggle();
      },
    });

    // 3. Initialize Sidebar (TOC slide-over drawer)
    this.sidebar = new SidebarToc(sidebarContainer, {
      onSelectPage: (page) => {
        this.viewer.setPage(page);
        this.sidebar.close(); // Close on selection for distraction-free reading
      },
      onPlayAudioTrack: (trackId) => {
        this.audioPlayer.playTrackById(trackId, true);
      },
      onResetProgress: () => {
        this.navbar.setPage(1);
        this.viewer.setPage(1);
      },
    });

    // 4. Initialize AudioPlayer (Mapped strictly to page)
    this.audioPlayer = new AudioPlayer(audioContainer, {
      onJumpToPage: (page) => this.viewer.setPage(page),
    });

    // 5. Initialize AiChat (Corner icon with floating popup window)
    this.aiChat = new AiChat(aiContainer, {});

    // Sync initial page
    this.handlePageChange(initialPage);

    // Listen for browser Back/Forward navigation
    window.addEventListener('hashchange', () => {
      const match = window.location.hash.match(/page=(\d+)/);
      if (match) {
        const p = parseInt(match[1], 10);
        if (p >= 1 && p <= TOTAL_PAGES && p !== this.viewer.getPage()) {
          this.viewer.setPage(p);
        }
      }
    });

    // If restored from previous session, show non-intrusive resume toast
    if (isRestoredFromStorage && initialPage > 1) {
      this.showResumeToast(initialPage);
    }
  }

  private handlePageChange(page: number): void {
    // 1. Persist progress & page state to localStorage
    saveCurrentPage(page);

    // 2. Sync controls & views
    this.navbar.setPage(page);
    this.sidebar.setPage(page);
    this.aiChat.setPage(page);

    // 3. Update URL hash
    window.history.replaceState(null, '', `#page=${page}`);

    // 4. Map Audio strictly to page
    this.audioPlayer.updateForPage(page);
  }

  private showResumeToast(page: number): void {
    const pct = calculateProgressPercent(page);
    const toast = document.createElement('div');
    toast.className = 'resume-progress-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">📖</span>
        <div class="toast-text">
          <div class="toast-title">Đã tiếp tục tiến độ đọc</div>
          <div class="toast-subtitle">Trang <strong>${page}</strong> / ${TOTAL_PAGES} (${pct}%)</div>
        </div>
      </div>
      <div class="toast-actions">
        <button class="toast-btn-restart" id="btn-toast-restart" title="Bắt đầu lại từ trang 1">Đọc từ đầu</button>
        <button class="toast-btn-dismiss" id="btn-toast-dismiss" title="Đóng">✕</button>
      </div>
    `;

    document.body.appendChild(toast);

    // Actions
    toast.querySelector('#btn-toast-restart')?.addEventListener('click', () => {
      this.viewer.setPage(1);
      toast.remove();
    });

    toast.querySelector('#btn-toast-dismiss')?.addEventListener('click', () => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 300);
    });

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }
}

// Start app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
