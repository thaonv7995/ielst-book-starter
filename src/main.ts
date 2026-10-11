import './styles.css';
import { Navbar } from './components/Navbar';
import { SidebarToc } from './components/SidebarToc';
import { BookViewer } from './components/BookViewer';
import { AudioPlayer } from './components/AudioPlayer';
import { AiChat } from './components/AiChat';

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

    // Parse initial page from hash if available (e.g. #page=16)
    let initialPage = 1;
    const hashMatch = window.location.hash.match(/page=(\d+)/);
    if (hashMatch) {
      initialPage = parseInt(hashMatch[1], 10) || 1;
    }

    // 1. Initialize BookViewer (Focus on book)
    this.viewer = new BookViewer(viewerContainer, initialPage, {
      onPageChange: (page) => this.handlePageChange(page),
      onAudioTrigger: (trackId) => {
        this.audioPlayer.playTrackById(trackId, true);
      },
      onAskAiForPage: (prompt) => {
        this.aiChat.openPopup();
        this.aiChat.askPrompt(prompt);
      },
    });

    // 2. Initialize Navbar (Minimal book controls)
    this.navbar = new Navbar(navContainer, {
      onPrevPage: () => this.viewer.prevPage(),
      onNextPage: () => this.viewer.nextPage(),
      onJumpPage: (page) => this.viewer.setPage(page),
      onPageLayoutChange: (layout) => this.viewer.setPageLayout(layout),
      onFitModeChange: (mode) => this.viewer.setFitMode(mode),
      onZoomChange: (zoom) => {
        this.viewer.setZoom(zoom);
        this.navbar.setZoom(this.viewer.getZoom());
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
    });

    // 4. Initialize AudioPlayer (Mapped strictly to page)
    this.audioPlayer = new AudioPlayer(audioContainer, {
      onJumpToPage: (page) => this.viewer.setPage(page),
    });

    // 5. Initialize AiChat (Corner icon with floating popup window)
    this.aiChat = new AiChat(aiContainer, {});

    // Sync initial page
    this.handlePageChange(initialPage);
  }

  private handlePageChange(page: number): void {
    // 1. Sync controls
    this.navbar.setPage(page);
    this.sidebar.setPage(page);
    this.aiChat.setPage(page);

    // 2. Update URL hash
    window.history.replaceState(null, '', `#page=${page}`);

    // 3. Map Audio strictly to page!
    // Shows player if page has audio, hides completely if not.
    this.audioPlayer.updateForPage(page);
  }
}

// Start app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
