import { BOOK_TOC, AUDIO_TRACKS, TOTAL_PAGES } from '../data/book-structure';
import { Bookmark, PageNote } from '../types';

export interface SidebarTocEvents {
  onSelectPage: (page: number) => void;
  onPlayAudioTrack?: (trackId: number) => void;
  onToggleCollapse?: (isOpen: boolean) => void;
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
    this.highlightCurrentItem();
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
    this.container.innerHTML = `
      <div class="sidebar-root ${this.isOpen ? '' : 'closed'}">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <span class="brand-badge">CAMBRIDGE</span>
            <span class="brand-title">IELTS Guide</span>
          </div>
          <button class="btn-sidebar-toggle" id="btn-sidebar-close" title="Đóng mục lục">◀</button>
        </div>

        <div class="sidebar-tabs">
          <button class="tab-btn active" data-tab="toc">📚 Mục Lục</button>
          <button class="tab-btn" data-tab="audio">🎧 Audio (70)</button>
          <button class="tab-btn" data-tab="notes">⭐ Ghi Chú</button>
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
        html += `
          <div class="toc-item-row" data-page="${item.page}">
            <div class="toc-item-title-col">
              <span class="item-bullet">•</span>
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

    el.innerHTML = `
      <div class="notes-panel">
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
