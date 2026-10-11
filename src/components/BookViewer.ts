import { PageLayout, FitMode } from '../types';
import { TOTAL_PAGES, getTocItemForPage, getAudioTracksForPage } from '../data/book-structure';

export interface BookViewerEvents {
  onPageChange: (page: number) => void;
  onAudioTrigger?: (trackId: number) => void;
  onAskAiForPage?: (prompt: string) => void;
}

export class BookViewer {
  private container: HTMLElement;
  private currentPage: number = 1;
  private pageLayout: PageLayout = 'single';
  private fitMode: FitMode = 'height';
  private zoomLevel: number = 1.0;
  private events: BookViewerEvents;
  private previousExercisePage: number | null = null;
  private preloadedPages = new Set<number>();

  constructor(container: HTMLElement, initialPage: number = 1, events: BookViewerEvents) {
    this.container = container;
    this.currentPage = Math.max(1, Math.min(TOTAL_PAGES, initialPage));
    this.events = events;

    this.render();
    this.setupKeyboard();
    this.preloadSurroundingPages(this.currentPage);
  }

  public setPage(page: number, rememberExercise: boolean = false): void {
    const targetPage = Math.max(1, Math.min(TOTAL_PAGES, page));
    if (this.currentPage === targetPage) return;
    const direction = targetPage > this.currentPage ? 'next' : 'prev';
    if (rememberExercise && this.currentPage !== targetPage) {
      this.previousExercisePage = this.currentPage;
    }
    this.currentPage = targetPage;
    this.updatePagesDisplay(direction);
    this.events.onPageChange(this.currentPage);
    this.preloadSurroundingPages(this.currentPage);
  }

  public getPage(): number {
    return this.currentPage;
  }

  public setPageLayout(layout: PageLayout): void {
    this.pageLayout = layout;
    this.updatePagesDisplay();
  }

  public getPageLayout(): PageLayout {
    return this.pageLayout;
  }

  public setFitMode(mode: FitMode): void {
    this.fitMode = mode;
    this.updatePagesDisplay();
  }

  public getFitMode(): FitMode {
    return this.fitMode;
  }

  public setZoom(zoom: number): void {
    this.zoomLevel = Math.max(0.6, Math.min(2.5, zoom));
    this.applyZoom();
  }

  public getZoom(): number {
    return this.zoomLevel;
  }

  public nextPage(): void {
    const step = this.pageLayout === 'double' ? 2 : 1;
    if (this.currentPage + step <= TOTAL_PAGES) {
      this.setPage(this.currentPage + step);
    } else if (this.currentPage < TOTAL_PAGES) {
      this.setPage(TOTAL_PAGES);
    }
  }

  public prevPage(): void {
    const step = this.pageLayout === 'double' ? 2 : 1;
    if (this.currentPage - step >= 1) {
      this.setPage(this.currentPage - step);
    } else if (this.currentPage > 1) {
      this.setPage(1);
    }
  }

  private preloadSurroundingPages(page: number): void {
    const pagesToPreload = [page - 2, page - 1, page + 1, page + 2, page + 3, page + 4];
    for (const p of pagesToPreload) {
      if (p >= 1 && p <= TOTAL_PAGES && !this.preloadedPages.has(p)) {
        const img = new Image();
        img.src = `/pages/page_${p}.jpg`;
        this.preloadedPages.add(p);
      }
    }
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prevPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.setPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.setPage(TOTAL_PAGES);
      } else if (e.key === '+' || e.key === '=') {
        this.setZoom(this.zoomLevel + 0.1);
      } else if (e.key === '-') {
        this.setZoom(this.zoomLevel - 0.1);
      } else if (e.key === '0') {
        this.setZoom(1.0);
      }
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="book-viewer-root">
        <!-- Floating Context Pill on top of reading stage (Only when applicable) -->
        <div class="floating-context-pill" id="book-context-bar"></div>

        <!-- Book Stage (Perfect Centering) -->
        <div class="book-stage" id="book-stage">
          <div class="book-content-wrapper" id="book-content-wrapper">
            <div class="pages-container" id="pages-container"></div>
          </div>
        </div>

        <!-- Subtle Navigation Arrow Overlays -->
        <button class="nav-edge-arrow nav-edge-prev" id="btn-prev-page" title="Trang trước (←)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button class="nav-edge-arrow nav-edge-next" id="btn-next-page" title="Trang sau (→)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    `;

    const btnPrev = this.container.querySelector('#btn-prev-page');
    const btnNext = this.container.querySelector('#btn-next-page');

    btnPrev?.addEventListener('click', () => this.prevPage());
    btnNext?.addEventListener('click', () => this.nextPage());

    this.updatePagesDisplay();
  }

  private updatePagesDisplay(direction?: 'next' | 'prev'): void {
    const stage = this.container.querySelector('#book-stage') as HTMLElement;
    const pagesContainer = this.container.querySelector('#pages-container') as HTMLElement;
    const contextBar = this.container.querySelector('#book-context-bar') as HTMLElement;
    if (!pagesContainer || !stage) return;

    stage.className = `book-stage fit-${this.fitMode} layout-${this.pageLayout}`;
    stage.scrollTop = 0;
    const animClass = direction === 'next' ? 'turn-anim-next' : direction === 'prev' ? 'turn-anim-prev' : '';
    pagesContainer.className = `pages-container layout-${this.pageLayout} fit-${this.fitMode} ${animClass}`.trim();
    if (animClass) {
      pagesContainer.addEventListener(
        'animationend',
        () => {
          pagesContainer.classList.remove('turn-anim-next', 'turn-anim-prev');
        },
        { once: true }
      );
    }
    pagesContainer.innerHTML = '';

    const tocItem = getTocItemForPage(this.currentPage);
    const audioTracks = getAudioTracksForPage(this.currentPage);

    // Update floating context pill
    if (contextBar) {
      let shortcutsHtml = '';
      if (tocItem?.scriptPage && this.currentPage < 330) {
        shortcutsHtml += `
          <button class="pill-action pill-action-script" id="btn-jump-script">
            📜 Tapescript (p.${tocItem.scriptPage})
          </button>
        `;
      }
      if (tocItem?.answerPage && this.currentPage < 363) {
        shortcutsHtml += `
          <button class="pill-action pill-action-answer" id="btn-jump-answer">
            🎯 Đáp án (p.${tocItem.answerPage})
          </button>
        `;
      }
      if (this.previousExercisePage && (this.currentPage >= 330 || this.currentPage >= 363)) {
        shortcutsHtml += `
          <button class="pill-action pill-action-return" id="btn-return-exercise">
            ↩️ Về bài tập (p.${this.previousExercisePage})
          </button>
        `;
      }
      if (audioTracks.length > 0) {
        audioTracks.forEach((t) => {
          const cleanSub = t.subtitle
            .replace(/^(Listening|Speaking)\s+Unit\s+\d+\s+-\s+/, '')
            .replace(/^Practice Test \d+\s+-\s+/, '');
          shortcutsHtml += `
            <button class="pill-action pill-action-audio btn-trigger-audio" data-track-id="${t.id}" title="${t.title}: ${t.subtitle}">
              🎧 ${t.title}${audioTracks.length > 1 ? `: ${cleanSub}` : ''}
            </button>
          `;
        });
      }

      if (shortcutsHtml || tocItem?.title) {
        contextBar.style.display = 'flex';
        contextBar.innerHTML = `
          <span class="pill-title">${tocItem?.title || 'Cambridge IELTS'}</span>
          ${shortcutsHtml ? `<div class="pill-shortcuts-row">${shortcutsHtml}</div>` : ''}
        `;

        contextBar.querySelector('#btn-jump-script')?.addEventListener('click', () => {
          if (tocItem?.scriptPage) this.setPage(tocItem.scriptPage, true);
        });
        contextBar.querySelector('#btn-jump-answer')?.addEventListener('click', () => {
          if (tocItem?.answerPage) this.setPage(tocItem.answerPage, true);
        });
        contextBar.querySelector('#btn-return-exercise')?.addEventListener('click', () => {
          if (this.previousExercisePage) {
            const target = this.previousExercisePage;
            this.previousExercisePage = null;
            this.setPage(target);
          }
        });
        contextBar.querySelectorAll('.btn-trigger-audio').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const trackId = parseInt((e.currentTarget as HTMLElement).getAttribute('data-track-id') || '0', 10);
            if (trackId && this.events.onAudioTrigger) {
              this.events.onAudioTrigger(trackId);
            }
          });
        });
      } else {
        contextBar.style.display = 'none';
      }
    }

    // Render pure clean page images
    if (this.pageLayout === 'double' && this.currentPage < TOTAL_PAGES) {
      pagesContainer.appendChild(this.createPageElement(this.currentPage, 'left'));
      pagesContainer.appendChild(this.createPageElement(this.currentPage + 1, 'right'));
    } else {
      pagesContainer.appendChild(this.createPageElement(this.currentPage, 'single'));
    }

    this.applyZoom();
  }

  private createPageElement(pageNum: number, position: 'left' | 'right' | 'single'): HTMLElement {
    const card = document.createElement('div');
    card.className = `clean-page-card page-pos-${position}`;
    card.dataset.page = String(pageNum);

    const img = document.createElement('img');
    img.className = 'clean-page-img';
    img.src = `/pages/page_${pageNum}.jpg`;
    img.alt = `Cambridge IELTS - Trang ${pageNum}`;
    img.loading = 'eager';

    card.appendChild(img);
    return card;
  }

  private applyZoom(): void {
    const wrapper = this.container.querySelector('#book-content-wrapper') as HTMLElement;
    if (wrapper) {
      wrapper.style.transform = `scale(${this.zoomLevel})`;
      wrapper.style.transformOrigin = this.fitMode === 'height' ? 'center center' : 'top center';
    }
  }
}
