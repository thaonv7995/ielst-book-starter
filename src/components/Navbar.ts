import { TOTAL_PAGES } from '../data/book-structure';
import { PageLayout, FitMode } from '../types';

export interface NavbarOptions {
  initialPage?: number;
  initialLayout?: PageLayout;
  initialFitMode?: FitMode;
  initialZoom?: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onJumpPage: (page: number) => void;
  onPageLayoutChange: (layout: PageLayout) => void;
  onFitModeChange: (mode: FitMode) => void;
  onZoomChange: (zoom: number) => void;
  onToggleSidebar: () => void;
}

export class Navbar {
  private container: HTMLElement;
  private events: NavbarOptions;
  private currentPage: number = 1;
  private pageLayout: PageLayout = 'single';
  private fitMode: FitMode = 'height';
  private zoom: number = 1.0;

  constructor(container: HTMLElement, options: NavbarOptions) {
    this.container = container;
    this.events = options;
    if (options.initialPage) this.currentPage = options.initialPage;
    if (options.initialLayout) this.pageLayout = options.initialLayout;
    if (options.initialFitMode) this.fitMode = options.initialFitMode;
    if (typeof options.initialZoom === 'number') this.zoom = options.initialZoom;

    this.render();
  }

  public setPage(page: number): void {
    this.currentPage = page;
    const input = this.container.querySelector('#nav-page-input') as HTMLInputElement;
    if (input) input.value = String(page);

    const progressPercent = Math.min(100, Math.max(0, Math.round((page / TOTAL_PAGES) * 100)));
    const badge = this.container.querySelector('#nav-progress-badge');
    if (badge) {
      badge.textContent = `${progressPercent}%`;
      badge.setAttribute('title', `Tiến độ đọc: Trang ${page}/${TOTAL_PAGES} (${progressPercent}%)`);
    }

    const progressBar = this.container.querySelector('#nav-progress-bar') as HTMLElement;
    if (progressBar) {
      const fillPercent = ((page / TOTAL_PAGES) * 100).toFixed(1);
      progressBar.style.width = `${fillPercent}%`;
    }

    const progressTrack = this.container.querySelector('#nav-progress-track') as HTMLElement;
    if (progressTrack) {
      progressTrack.title = `Tiến độ đọc: Trang ${page}/${TOTAL_PAGES} (${progressPercent}%)`;
    }
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
    const label = this.container.querySelector('#nav-zoom-val');
    if (label) label.textContent = `${Math.round(zoom * 100)}%`;
  }

  public setPageLayout(layout: PageLayout): void {
    this.pageLayout = layout;
    const btnSingle = this.container.querySelector('#btn-layout-single');
    const btnDouble = this.container.querySelector('#btn-layout-double');
    btnSingle?.classList.toggle('active', layout === 'single');
    btnDouble?.classList.toggle('active', layout === 'double');
  }

  public setFitMode(mode: FitMode): void {
    this.fitMode = mode;
    const btnHeight = this.container.querySelector('#btn-fit-height');
    const btnWidth = this.container.querySelector('#btn-fit-width');
    btnHeight?.classList.toggle('active', mode === 'height');
    btnWidth?.classList.toggle('active', mode === 'width');
  }

  private render(): void {
    const progressPercent = Math.min(100, Math.max(0, Math.round((this.currentPage / TOTAL_PAGES) * 100)));
    const fillPercent = ((this.currentPage / TOTAL_PAGES) * 100).toFixed(1);

    this.container.innerHTML = `
      <header class="app-navbar">
        <!-- Progress track along bottom border of navbar -->
        <div class="nav-progress-track" id="nav-progress-track" title="Tiến độ đọc: Trang ${this.currentPage}/${TOTAL_PAGES} (${progressPercent}%)">
          <div class="nav-progress-bar" id="nav-progress-bar" style="width: ${fillPercent}%"></div>
        </div>

        <!-- Left: TOC toggle & Title -->
        <div class="nav-left">
          <button class="nav-btn nav-btn-toc" id="btn-nav-toc" title="Mục lục sách (TOC)">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <span class="btn-label">Mục lục</span>
          </button>

          <div class="nav-divider"></div>

          <div class="nav-book-title" title="The Official Cambridge Guide to IELTS">
            <span class="title-badge">CAMBRIDGE</span>
            <span class="title-text">Official Guide to IELTS</span>
          </div>
        </div>

        <!-- Center: Minimal Page Switcher with Progress Badge -->
        <div class="nav-center">
          <div class="page-switcher-pill">
            <button class="nav-page-arrow" id="nav-btn-prev" title="Trang trước (←)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <div class="page-counter-group">
              <span class="label-dim">Trang</span>
              <input type="number" id="nav-page-input" class="page-number-input" min="1" max="${TOTAL_PAGES}" value="${this.currentPage}" />
              <span class="label-slash">/</span>
              <span class="label-total">${TOTAL_PAGES}</span>
              <span class="nav-progress-badge" id="nav-progress-badge" title="Tiến độ đọc: ${progressPercent}%">${progressPercent}%</span>
            </div>

            <button class="nav-page-arrow" id="nav-btn-next" title="Trang sau (→)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <!-- Right: 1 Page / 2 Page & Fit Height / Fit Width Controls -->
        <div class="nav-right">
          <!-- 1 Page vs 2 Page Toggle -->
          <div class="nav-segmented" title="Chế độ hiển thị trang">
            <button class="seg-item ${this.pageLayout === 'single' ? 'active' : ''}" id="btn-layout-single" title="Xem 1 trang">1 Trang</button>
            <button class="seg-item ${this.pageLayout === 'double' ? 'active' : ''}" id="btn-layout-double" title="Xem 2 trang (sách mở)">2 Trang</button>
          </div>

          <!-- Fit Height vs Fit Width Toggle -->
          <div class="nav-segmented" title="Tỷ lệ co giãn trang">
            <button class="seg-item ${this.fitMode === 'height' ? 'active' : ''}" id="btn-fit-height" title="Vừa chiều cao (không cuộn chuột)">↕ Vừa cao</button>
            <button class="seg-item ${this.fitMode === 'width' ? 'active' : ''}" id="btn-fit-width" title="Vừa chiều rộng (cuộn dọc phóng to)">↔ Vừa rộng</button>
          </div>

          <!-- Zoom control -->
          <div class="nav-zoom-pill">
            <button class="btn-zoom" id="btn-zoom-out" title="Thu nhỏ">−</button>
            <span class="zoom-value" id="nav-zoom-val">${Math.round(this.zoom * 100)}%</span>
            <button class="btn-zoom" id="btn-zoom-in" title="Phóng to">+</button>
          </div>

          <!-- Fullscreen toggle -->
          <button class="nav-icon-only" id="btn-nav-fullscreen" title="Toàn màn hình">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          </button>
        </div>
      </header>
    `;

    this.wireEvents();
  }

  private wireEvents(): void {
    this.container.querySelector('#btn-nav-toc')?.addEventListener('click', () => {
      this.events.onToggleSidebar();
    });

    this.container.querySelector('#nav-btn-prev')?.addEventListener('click', () => {
      this.events.onPrevPage();
    });

    this.container.querySelector('#nav-btn-next')?.addEventListener('click', () => {
      this.events.onNextPage();
    });

    const pageInput = this.container.querySelector('#nav-page-input') as HTMLInputElement;
    pageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = parseInt(pageInput.value, 10);
        if (!isNaN(val)) this.events.onJumpPage(val);
        pageInput.blur();
      }
    });
    pageInput?.addEventListener('blur', () => {
      const val = parseInt(pageInput.value, 10);
      if (!isNaN(val)) this.events.onJumpPage(val);
    });

    // 1 Page vs 2 Page
    this.container.querySelector('#btn-layout-single')?.addEventListener('click', () => {
      this.setPageLayout('single');
      this.events.onPageLayoutChange('single');
    });

    this.container.querySelector('#btn-layout-double')?.addEventListener('click', () => {
      this.setPageLayout('double');
      this.events.onPageLayoutChange('double');
    });

    // Fit Height vs Fit Width
    this.container.querySelector('#btn-fit-height')?.addEventListener('click', () => {
      this.setFitMode('height');
      this.events.onFitModeChange('height');
    });

    this.container.querySelector('#btn-fit-width')?.addEventListener('click', () => {
      this.setFitMode('width');
      this.events.onFitModeChange('width');
    });

    // Zoom
    this.container.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      this.events.onZoomChange(this.zoom + 0.15);
    });

    this.container.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      this.events.onZoomChange(this.zoom - 0.15);
    });

    this.container.querySelector('#btn-nav-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }
}
