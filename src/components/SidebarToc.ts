import { BOOK_TOC, AUDIO_TRACKS, TOTAL_PAGES } from '../data/book-structure';
import { Bookmark, PageNote } from '../types';
import {
  loadBookState,
  calculateProgressPercent,
  formatLastReadTime,
  resetBookProgress,
} from '../services/storage-service';

export interface SidebarTocEvents {
  onSelectPage: (page: number) => void;
  onPlayAudioTrack?: (trackId: number) => void;
  onToggleCollapse?: (isOpen: boolean) => void;
  onResetProgress?: () => void;
}

export class SidebarToc {
  private container: HTMLElement;
  private events: SidebarTocEvents;
  private currentPage: number = 1;
  private isOpen: boolean = false;
  private activeTab: 'toc' | 'audio' | 'notes' = 'toc';
  private bookmarks: Bookmark[] = [];
  private notes: PageNote[] = [];

  constructor(container: HTMLElement, events: SidebarTocEvents) {
    this.container = container;
    this.events = events;

    this.loadSavedData();
    this.render();
  }

  public setPage(page: number): void {
    this.currentPage = page;
    this.updateProgressCard();
    this.highlightCurrentItem();
  }

  public updateProgressCard(): void {
    const bookState = loadBookState();
    const pct = calculateProgressPercent(this.currentPage);
    const fillPercent = ((this.currentPage / TOTAL_PAGES) * 100).toFixed(1);

    const pctEl = this.container.querySelector('#sidebar-progress-pct');
    if (pctEl) pctEl.textContent = `${pct}%`;

    const fillEl = this.container.querySelector('#sidebar-progress-fill') as HTMLElement;
    if (fillEl) fillEl.style.width = `${fillPercent}%`;

    const detailEl = this.container.querySelector('#sidebar-progress-detail');
    if (detailEl) detailEl.textContent = `Trang ${this.currentPage} / ${TOTAL_PAGES}`;

    const highestEl = this.container.querySelector('#sidebar-progress-highest');
    if (highestEl) highestEl.textContent = `Xa nhất: p.${bookState.highestPageReached || this.currentPage}`;
  }

  public open(): void {
    this.isOpen = true;
    const sidebar = this.container.querySelector('.sidebar-root') as HTMLElement;
    if (sidebar) {
      sidebar.classList.remove('closed');
    }
    this.events.onToggleCollapse?.(true);
  }

  public close(): void {
    this.isOpen = false;
    const sidebar = this.container.querySelector('.sidebar-root') as HTMLElement;
    if (sidebar) {
      sidebar.classList.add('closed');
    }
    this.events.onToggleCollapse?.(false);
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public addBookmark(page: number, title: string): void {
    if (!this.bookmarks.some((b) => b.page === page)) {
      this.bookmarks.push({ page, title, createdAt: Date.now() });
      this.saveData();
      if (this.activeTab === 'notes') this.renderTabContent();
    }
  }

  public removeBookmark(page: number): void {
    this.bookmarks = this.bookmarks.filter((b) => b.page !== page);
    this.saveData();
    if (this.activeTab === 'notes') this.renderTabContent();
  }

  public saveNote(page: number, text: string): void {
    const existing = this.notes.find((n) => n.page === page);
    if (existing) {
      existing.text = text;
      existing.updatedAt = Date.now();
    } else {
      this.notes.push({ page, text, updatedAt: Date.now() });
    }
    this.saveData();
  }

  private loadSavedData(): void {
    try {
      const bRaw = localStorage.getItem('ielts_bookmarks');
      if (bRaw) this.bookmarks = JSON.parse(bRaw);
      const nRaw = localStorage.getItem('ielts_notes');
      if (nRaw) this.notes = JSON.parse(nRaw);
    } catch (e) {
      console.warn('Failed loading bookmarks/notes', e);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('ielts_bookmarks', JSON.stringify(this.bookmarks));
      localStorage.setItem('ielts_notes', JSON.stringify(this.notes));
    } catch (e) {
      console.warn('Failed saving bookmarks/notes', e);
    }
  }

  private render(): void {
    const bookState = loadBookState();
    const pct = calculateProgressPercent(this.currentPage);
    const fillPercent = ((this.currentPage / TOTAL_PAGES) * 100).toFixed(1);

    this.container.innerHTML = `
      <div class="sidebar-root ${this.isOpen ? '' : 'closed'}">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <span class="brand-badge">CAMBRIDGE</span>
            <span class="brand-title">IELTS Guide</span>
          </div>
          <button class="btn-sidebar-toggle" id="btn-sidebar-close" title="Đóng mục lục">◀</button>
        </div>

        <!-- Reading Progress Summary Card -->
        <div class="sidebar-progress-card" id="sidebar-progress-card">
          <div class="progress-card-top">
            <div class="progress-title-col">
              <span class="progress-icon">📖</span>
              <span class="progress-text-label">Tiến độ đọc sách</span>
            </div>
            <span class="progress-percent" id="sidebar-progress-pct">${pct}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="sidebar-progress-fill" style="width: ${fillPercent}%"></div>
          </div>
          <div class="progress-card-footer">
            <span class="progress-detail" id="sidebar-progress-detail">Trang ${this.currentPage} / ${TOTAL_PAGES}</span>
            <span class="progress-highest" id="sidebar-progress-highest">Xa nhất: p.${bookState.highestPageReached || this.currentPage}</span>
          </div>
        </div>

        <div class="sidebar-tabs">
          <button class="tab-btn active" data-tab="toc">📚 Mục Lục</button>
          <button class="tab-btn" data-tab="audio">🎧 Audio (70)</button>
          <button class="tab-btn" data-tab="notes">⭐ Ghi Chú & Tiến Độ</button>
        </div>

        <div class="sidebar-search-box">
          <input type="text" id="sidebar-search-input" placeholder="Tìm kiếm chương, unit, bài tập..." class="sidebar-search" />
        </div>

        <div class="sidebar-tab-content" id="sidebar-tab-content"></div>
      </div>
    `;

    this.wireEvents();
    this.renderTabContent();
  }

  private wireEvents(): void {
    this.container.querySelector('#btn-sidebar-close')?.addEventListener('click', () => {
      this.toggle();
    });

    const tabBtns = this.container.querySelectorAll('.sidebar-tabs .tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab') as any;
        this.renderTabContent();
      });
    });

    const searchInput = this.container.querySelector('#sidebar-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', () => {
      this.renderTabContent(searchInput.value);
    });
  }

  private renderTabContent(searchQuery: string = ''): void {
    const content = this.container.querySelector('#sidebar-tab-content');
    if (!content) return;

    if (this.activeTab === 'toc') {
      this.renderToc(content as HTMLElement, searchQuery);
    } else if (this.activeTab === 'audio') {
      this.renderAudioList(content as HTMLElement, searchQuery);
    } else {
      this.renderNotesTab(content as HTMLElement);
    }

    this.highlightCurrentItem();
  }

  private renderToc(el: HTMLElement, searchQuery: string): void {
    const q = searchQuery.toLowerCase().trim();
    const bookState = loadBookState();
    const highest = bookState.highestPageReached || 1;

    let html = '<div class="toc-tree">';
    for (const group of BOOK_TOC) {
      const matchGroup = !q || group.title.toLowerCase().includes(group.category) || group.title.toLowerCase().includes(q);
      const filteredChildren = (group.children || []).filter((c) => !q || c.title.toLowerCase().includes(q));

      if (q && !matchGroup && filteredChildren.length === 0) continue;

      html += `
        <div class="toc-group">
          <div class="toc-group-header" data-page="${group.page}">
            <span class="group-icon">📁</span>
            <span class="group-title">${group.title}</span>
            <span class="page-badge">Trang ${group.page}</span>
          </div>
          <div class="toc-group-items">
      `;

      const itemsToRender = q && filteredChildren.length > 0 ? filteredChildren : group.children || [];
      for (const item of itemsToRender) {
        const isReached = item.page <= highest;
        html += `
          <div class="toc-item-row ${isReached ? 'reached' : ''}" data-page="${item.page}">
            <div class="toc-item-title-col">
              <span class="item-bullet ${isReached ? 'bullet-reached' : ''}">${isReached ? '✓' : '•'}</span>
              <span class="item-title">${item.title}</span>
            </div>
            <div class="toc-item-badge-col">
              ${item.audioTrack ? `<span class="badge-audio" title="Có Audio">🎧 T${item.audioTrack}</span>` : ''}
              <span class="page-badge">p.${item.page}</span>
            </div>
          </div>
        `;
      }

      html += `</div></div>`;
    }
    html += '</div>';
    el.innerHTML = html;

    // Wire clicks
    el.querySelectorAll('[data-page]').forEach((row) => {
      row.addEventListener('click', () => {
        const page = parseInt(row.getAttribute('data-page') || '1', 10);
        this.events.onSelectPage(page);
      });
    });
  }

  private renderAudioList(el: HTMLElement, searchQuery: string): void {
    const q = searchQuery.toLowerCase().trim();
    const filtered = AUDIO_TRACKS.filter((t) => !q || t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q));

    el.innerHTML = `
      <div class="sidebar-audio-list">
        ${filtered
          .map(
            (t) => `
          <div class="sidebar-audio-item" data-id="${t.id}" data-page="${t.page}">
            <button class="btn-sub-play">▶</button>
            <div class="audio-sub-text">
              <div class="sub-title">${t.title}: ${t.subtitle}</div>
              <div class="sub-meta">Trang sách: ${t.page}</div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    el.querySelectorAll('.sidebar-audio-item').forEach((item) => {
      item.addEventListener('click', () => {
        const id = parseInt(item.getAttribute('data-id') || '1', 10);
        const page = parseInt(item.getAttribute('data-page') || '1', 10);
        this.events.onPlayAudioTrack?.(id);
        this.events.onSelectPage(page);
      });
    });
  }

  private renderNotesTab(el: HTMLElement): void {
    const curBookmarked = this.bookmarks.some((b) => b.page === this.currentPage);
    const curNote = this.notes.find((n) => n.page === this.currentPage)?.text || '';
    const bookState = loadBookState();
    const pct = calculateProgressPercent(this.currentPage);

    el.innerHTML = `
      <div class="notes-panel">
        <!-- Reading Progress & State Overview -->
        <div class="reading-stats-card">
          <div class="stats-card-header">
            <h4>📊 Tiến Độ & Trạng Thái Đọc</h4>
          </div>
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-label">Tiến độ</span>
              <span class="stat-val text-accent">${pct}%</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Trang hiện tại</span>
              <span class="stat-val">Trang ${this.currentPage}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Trang xa nhất</span>
              <span class="stat-val">Trang ${bookState.highestPageReached || this.currentPage}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Đọc lần cuối</span>
              <span class="stat-val text-dim">${formatLastReadTime(bookState.lastReadAt)}</span>
            </div>
          </div>
          <button class="btn-reset-progress-state" id="btn-reset-progress-state" title="Đặt lại tiến độ đọc về Trang 1">
            🔄 Đặt lại tiến độ đọc về Trang 1
          </button>
        </div>

        <div class="current-page-note-card">
          <div class="note-card-header">
            <h4>Ghi chú cho Trang ${this.currentPage}</h4>
            <button class="btn-toggle-bookmark ${curBookmarked ? 'bookmarked' : ''}" id="btn-toggle-cur-bookmark">
              ${curBookmarked ? '★ Đã đánh dấu' : '☆ Đánh dấu trang'}
            </button>
          </div>
          <textarea id="page-note-input" class="note-textarea" placeholder="Nhập ghi chú cá nhân, từ mới hoặc lưu ý cho trang này...">${curNote}</textarea>
          <button class="btn-save-note" id="btn-save-note">💾 Lưu ghi chú</button>
        </div>

        <div class="saved-bookmarks-section">
          <h4>Danh sách trang đã đánh dấu (${this.bookmarks.length})</h4>
          ${
            this.bookmarks.length === 0
              ? '<p class="empty-hint">Chưa có trang nào được đánh dấu.</p>'
              : `<div class="bookmarks-list">
                ${this.bookmarks
                  .map(
                    (b) => `
                  <div class="bookmark-row" data-page="${b.page}">
                    <span>★ Trang ${b.page}: ${b.title}</span>
                    <button class="btn-del-bm" data-del-page="${b.page}">✕</button>
                  </div>
                `
                  )
                  .join('')}
              </div>`
          }
        </div>
      </div>
    `;

    // Wire actions
    el.querySelector('#btn-reset-progress-state')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại tiến độ đọc về Trang 1 không?')) {
        resetBookProgress();
        this.events.onResetProgress?.();
        this.events.onSelectPage(1);
      }
    });

    el.querySelector('#btn-toggle-cur-bookmark')?.addEventListener('click', () => {
      if (curBookmarked) {
        this.removeBookmark(this.currentPage);
      } else {
        this.addBookmark(this.currentPage, `Trang ${this.currentPage}`);
      }
    });

    el.querySelector('#btn-save-note')?.addEventListener('click', () => {
      const text = (el.querySelector('#page-note-input') as HTMLTextAreaElement).value;
      this.saveNote(this.currentPage, text);
      alert('Đã lưu ghi chú thành công!');
    });

    el.querySelectorAll('.bookmark-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('btn-del-bm')) return;
        const page = parseInt(row.getAttribute('data-page') || '1', 10);
        this.events.onSelectPage(page);
      });
    });

    el.querySelectorAll('.btn-del-bm').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const page = parseInt(btn.getAttribute('data-del-page') || '1', 10);
        this.removeBookmark(page);
      });
    });
  }

  private highlightCurrentItem(): void {
    this.container.querySelectorAll('.toc-item-row').forEach((r) => {
      const p = parseInt(r.getAttribute('data-page') || '0', 10);
      r.classList.toggle('active', p === this.currentPage);
    });
  }
}
