import { marked } from 'marked';
import { ChatMessage, AiConfig, AiProvider, AiMentorMode, PageAiContext } from '../types';
import { loadAiConfig, saveAiConfig, streamChatCompletion, testAiConnection, AI_PROVIDER_PRESETS } from '../services/ai-service';
import { getTocItemForPage, getAudioTracksForPage } from '../data/book-structure';
import { loadPageFullContext } from '../services/book-content-service';

export interface AiChatEvents {
  onTogglePopup?: (isOpen: boolean) => void;
}

export class AiChat {
  private container: HTMLElement;
  private config: AiConfig;
  private messages: ChatMessage[] = [];
  private currentPage: number = 1;
  private isStreaming: boolean = false;
  private isOpen: boolean = false;
  private isExpanded: boolean = false;
  private currentMode: AiMentorMode = 'mentor';
  private events: AiChatEvents;
  private abortController: AbortController | null = null;
  private lastUserPrompt: string = '';
  private customWidth: number = 440;
  private animFrameId: number | null = null;

  constructor(container: HTMLElement, events: AiChatEvents) {
    this.container = container;
    this.events = events;
    this.config = loadAiConfig();
    this.currentMode = this.config.mentorMode || 'mentor';

    const savedWidth = localStorage.getItem('ai_chat_custom_width');
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (parsed >= 360 && parsed <= 1200) {
        this.customWidth = parsed;
        document.documentElement.style.setProperty('--ai-expanded-width', `${parsed}px`);
      }
    }

    this.render();
    this.setupWelcomeMessage();
  }

  public setPage(page: number): void {
    this.currentPage = page;
    this.updateContextBadge();
    this.renderContextChips();
  }

  public askPrompt(promptText: string): void {
    if (this.isStreaming) return;
    this.openPopup();
    this.sendUserMessage(promptText);
  }

  public openPopup(): void {
    this.isOpen = true;
    const popup = this.container.querySelector('#ai-chat-popup') as HTMLElement;
    const icon = this.container.querySelector('#ai-corner-icon') as HTMLElement;
    if (popup) {
      popup.classList.add('open');
      if (!this.isExpanded && this.customWidth && this.customWidth !== 440) {
        popup.style.width = `${this.customWidth}px`;
      }
    }
    if (icon) icon.classList.add('active');
    if (this.isExpanded) {
      document.body.classList.add('ai-chat-expanded');
    }
    this.events.onTogglePopup?.(true);

    // Auto-focus input
    setTimeout(() => {
      const input = this.container.querySelector('#ai-prompt-input') as HTMLTextAreaElement;
      input?.focus();
    }, 150);
  }

  public closePopup(): void {
    this.isOpen = false;
    const popup = this.container.querySelector('#ai-chat-popup') as HTMLElement;
    const icon = this.container.querySelector('#ai-corner-icon') as HTMLElement;
    if (popup) popup.classList.remove('open');
    if (icon) icon.classList.remove('active');
    document.body.classList.remove('ai-chat-expanded');
    this.events.onTogglePopup?.(false);
  }

  public togglePopup(): void {
    if (this.isOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  public toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    const popup = this.container.querySelector('#ai-chat-popup') as HTMLElement;
    const btnExpand = this.container.querySelector('#btn-toggle-expand') as HTMLElement;
    if (popup) {
      popup.classList.toggle('expanded', this.isExpanded);
      if (this.isExpanded) {
        popup.style.width = '';
      } else if (this.customWidth && this.customWidth !== 440) {
        popup.style.width = `${this.customWidth}px`;
      }
    }
    if (btnExpand) {
      btnExpand.textContent = this.isExpanded ? '🗗' : '⤢';
      btnExpand.title = this.isExpanded ? 'Thu nhỏ cửa sổ' : 'Phóng to cửa sổ';
    }
    document.body.classList.toggle('ai-chat-expanded', this.isExpanded && this.isOpen);
  }

  private setupWelcomeMessage(): void {
    const toc = getTocItemForPage(this.currentPage);
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `### 🎓 Xin chào! Tôi là Cambridge IELTS Mentor AI
Tôi là trợ giảng thông minh hỗ trợ người học theo chuẩn Cambridge Examiner.

${toc ? `📍 Bạn đang mở **${toc.title}** (Trang ${this.currentPage}).` : ''}

**Bạn có thể chọn chế độ học bên trên hoặc bấm các gợi ý nhanh bên dưới:**
* 🎯 **Chữa đề & Bẫy**: Dẫn chứng đáp án, phân tích vì sao đúng & bóc mẽ distractor.
* 📚 **Từ vựng & Paraphrase**: Lập bảng từ vựng C1/C2 kèm IPA và kỹ thuật paraphrase.
* ✍️ **Chấm bài Writing**: Chấm & nhận xét theo 4 tiêu chí TR, CC, LR, GRA kèm bài mẫu Band 8.0+.
* 🗣️ **Luyện Speaking**: Khung trả lời P.E.E.R, Idioms và ngữ điệu tự nhiên.`,
      timestamp: Date.now(),
    };
    this.messages = [welcome];
    this.renderMessages();
  }

  private render(): void {
    this.container.innerHTML = `
      <!-- Corner Floating Icon Button -->
      <button class="ai-corner-fab" id="ai-corner-icon" type="button" title="Mở Trợ giảng IELTS AI">
        <span class="fab-sparkle">✨</span>
      </button>

      <!-- Floating Popup Window (Opens above the corner icon) -->
      <div class="ai-chat-popup-card ${this.isExpanded ? 'expanded' : ''}" id="ai-chat-popup">
        <!-- Drag-to-Resize Left Handle -->
        <div class="ai-chat-resize-handle" id="ai-chat-resize-handle" title="Kéo mép trái để chỉnh độ rộng cửa sổ"></div>

        <!-- Popup Header -->
        <div class="ai-popup-header">
          <div class="ai-popup-title-group">
            <span class="popup-avatar">🎓</span>
            <div class="popup-text">
              <div class="popup-title-row">
                <span class="popup-title">IELTS Mentor AI</span>
                <span class="model-badge" id="ai-model-badge">${this.config.model || 'AI'}</span>
              </div>
              <span class="popup-sub" id="ai-context-badge">Trang ${this.currentPage}</span>
            </div>
          </div>
          <div class="ai-popup-actions">
            <button class="btn-popup-icon" id="btn-toggle-expand" title="Phóng to cửa sổ">⤢</button>
            <button class="btn-popup-icon" id="btn-ai-settings" title="Cài đặt API Key">⚙️</button>
            <button class="btn-popup-icon" id="btn-clear-chat" title="Làm mới cuộc trò chuyện">🧹</button>
            <button class="btn-popup-icon" id="btn-close-popup" title="Đóng cửa sổ">✕</button>
          </div>
        </div>

        <!-- Mentor Persona / Mode Switcher -->
        <div class="ai-mode-tabs-bar" id="ai-mode-tabs">
          <button class="mode-tab-btn ${this.currentMode === 'mentor' ? 'active' : ''}" data-mode="mentor">🎓 Toàn diện</button>
          <button class="mode-tab-btn ${this.currentMode === 'explain' ? 'active' : ''}" data-mode="explain">🎯 Chữa đề & Bẫy</button>
          <button class="mode-tab-btn ${this.currentMode === 'vocab' ? 'active' : ''}" data-mode="vocab">📚 Từ vựng</button>
          <button class="mode-tab-btn ${this.currentMode === 'writing' ? 'active' : ''}" data-mode="writing">✍️ Writing</button>
          <button class="mode-tab-btn ${this.currentMode === 'speaking' ? 'active' : ''}" data-mode="speaking">🗣️ Speaking</button>
        </div>

        <!-- Dynamic Context-Aware Prompt Chips -->
        <div class="ai-popup-chips" id="ai-popup-chips"></div>

        <!-- Chat Messages Area -->
        <div class="ai-messages-list" id="ai-messages-list"></div>

        <!-- Input Area -->
        <div class="ai-popup-input-area">
          <div class="ai-input-wrapper">
            <textarea id="ai-prompt-input" placeholder="Hỏi trợ giảng AI hoặc dán bài viết cần chấm..." rows="1"></textarea>
            <div class="ai-input-btns">
              <button class="btn-send-message" id="btn-send-message" title="Gửi tin nhắn (Enter)">
                <svg class="icon-send" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                <svg class="icon-stop" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="6" width="12" height="12"></rect></svg>
              </button>
            </div>
          </div>
          <div class="ai-input-hint">Nhấn <b>Enter</b> để gửi • <b>Shift+Enter</b> xuống dòng</div>
        </div>
      </div>

      <!-- Settings Modal Backdrop -->
      <div class="modal-backdrop" id="ai-settings-modal" style="display:none;">
        <div class="modal-card">
          <div class="modal-header">
            <h3>⚙️ Cài đặt AI Mentor (OpenAI / AuxCloud / Gemini / DeepSeek)</h3>
            <button class="btn-close-modal" id="btn-close-settings">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nhà cung cấp AI (Provider)</label>
              <select id="setting-provider" class="form-control">
                <option value="custom">AuxCloud / Custom OpenAI-Compatible (Khuyên dùng)</option>
                <option value="deepseek">DeepSeek Official (API chính hãng)</option>
                <option value="gemini">Google Gemini (OpenAI compatible)</option>
                <option value="openai">OpenAI ChatGPT</option>
                <option value="groq">Groq Cloud (Siêu nhanh)</option>
                <option value="ollama">Ollama (Offline Local)</option>
              </select>
            </div>

            <div class="form-group">
              <label>API Key</label>
              <div class="input-password-wrap">
                <input type="password" id="setting-api-key" class="form-control" placeholder="Nhập API Key..." />
                <button type="button" class="btn-toggle-eye" id="btn-toggle-key-visibility">👁️</button>
              </div>
              <small class="form-help">Khóa được lưu bảo mật trên trình duyệt của bạn (localStorage).</small>
            </div>

            <div class="form-group">
              <label>Base URL</label>
              <input type="text" id="setting-base-url" class="form-control" placeholder="https://llm.auxcloud.art/v1" />
            </div>

            <div class="form-group">
              <label>Model Name</label>
              <input type="text" id="setting-model" class="form-control" placeholder="gpt-4o-mini" />
              <div class="model-quick-tags" id="setting-model-tags"></div>
            </div>

            <div class="test-connection-box">
              <button class="btn-test-conn" id="btn-test-conn">⚡ Thử kết nối ngay</button>
              <div class="test-result-msg" id="test-result-msg"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-modal-cancel" id="btn-cancel-settings">Đóng</button>
            <button class="btn-modal-save" id="btn-save-settings">Lưu cấu hình</button>
          </div>
        </div>
      </div>
    `;

    this.wireEvents();
    this.setupResizeHandle();
    this.updateContextBadge();
    this.renderContextChips();
  }

  private wireEvents(): void {
    const iconBtn = this.container.querySelector('#ai-corner-icon');
    const closeBtn = this.container.querySelector('#btn-close-popup');
    const expandBtn = this.container.querySelector('#btn-toggle-expand');
    const input = this.container.querySelector('#ai-prompt-input') as HTMLTextAreaElement;
    const btnSend = this.container.querySelector('#btn-send-message');
    const btnSettings = this.container.querySelector('#btn-ai-settings');
    const btnClear = this.container.querySelector('#btn-clear-chat');

    iconBtn?.addEventListener('click', () => this.togglePopup());
    closeBtn?.addEventListener('click', () => this.closePopup());
    expandBtn?.addEventListener('click', () => this.toggleExpand());

    btnSend?.addEventListener('click', () => {
      if (this.isStreaming) {
        this.stopStreaming();
      } else if (input.value.trim()) {
        this.sendUserMessage(input.value.trim());
        input.value = '';
        input.style.height = 'auto';
      }
    });

    // Auto-grow textarea
    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (this.isStreaming) {
          this.stopStreaming();
        } else if (input.value.trim()) {
          this.sendUserMessage(input.value.trim());
          input.value = '';
          input.style.height = 'auto';
        }
      }
    });

    btnClear?.addEventListener('click', () => {
      this.setupWelcomeMessage();
    });

    // Mode tabs switcher
    this.container.querySelectorAll('.mode-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as AiMentorMode;
        if (mode) {
          this.currentMode = mode;
          this.config.mentorMode = mode;
          saveAiConfig(this.config);

          this.container.querySelectorAll('.mode-tab-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');

          this.renderContextChips();
        }
      });
    });

    // Settings modal
    btnSettings?.addEventListener('click', () => this.openSettingsModal());
    this.container.querySelector('#btn-close-settings')?.addEventListener('click', () => this.closeSettingsModal());
    this.container.querySelector('#btn-cancel-settings')?.addEventListener('click', () => this.closeSettingsModal());
    this.container.querySelector('#btn-save-settings')?.addEventListener('click', () => this.saveSettingsFromModal());
    this.container.querySelector('#btn-test-conn')?.addEventListener('click', () => this.handleTestConnection());

    const providerSelect = this.container.querySelector('#setting-provider') as HTMLSelectElement;
    providerSelect?.addEventListener('change', () => {
      const p = providerSelect.value as AiProvider;
      const preset = AI_PROVIDER_PRESETS[p];
      if (preset) {
        (this.container.querySelector('#setting-base-url') as HTMLInputElement).value = preset.defaultBaseUrl;
        (this.container.querySelector('#setting-model') as HTMLInputElement).value = preset.defaultModel;
        this.renderModelQuickTags(preset.models);
      }
    });

    const btnEye = this.container.querySelector('#btn-toggle-key-visibility');
    btnEye?.addEventListener('click', () => {
      const keyInput = this.container.querySelector('#setting-api-key') as HTMLInputElement;
      if (keyInput) {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      }
    });
  }

  private updateContextBadge(): void {
    const badge = this.container.querySelector('#ai-context-badge');
    const modelBadge = this.container.querySelector('#ai-model-badge');
    const toc = getTocItemForPage(this.currentPage);
    const audioTracks = getAudioTracksForPage(this.currentPage);

    if (modelBadge) {
      modelBadge.textContent = this.config.model || 'AI';
    }

    if (badge) {
      let desc = `Trang ${this.currentPage}`;
      if (toc?.unit) desc += ` • Unit ${toc.unit}`;
      if (audioTracks.length > 0) {
        const trackNums = audioTracks.map((t) => t.id).join(', ');
        desc += ` • 🎧 Track ${trackNums}`;
      } else if (toc?.category) {
        const catMap: Record<string, string> = {
          listening: 'Listening',
          reading: 'Reading',
          writing: 'Writing',
          speaking: 'Speaking',
          practice_test: 'Practice Test',
          scripts: 'Tapescripts',
          answers: 'Answer Key',
        };
        desc += ` • ${catMap[toc.category] || toc.category}`;
      }
      if (toc?.scriptPage) {
        desc += ` • 📜 Tapescript`;
      }
      if (toc?.answerPage) {
        desc += ` • 🎯 Key`;
      }
      badge.textContent = desc;
    }
  }

  private renderContextChips(): void {
    const chipsContainer = this.container.querySelector('#ai-popup-chips');
    if (!chipsContainer) return;

    const toc = getTocItemForPage(this.currentPage);
    const category = toc?.category || 'listening';
    const chips = this.getContextualChips(category);

    chipsContainer.innerHTML = chips
      .map(
        (c) => `
        <button class="chip-action" data-prompt="${this.escapeHtml(c.prompt)}" title="${this.escapeHtml(c.prompt)}">
          ${c.label}
        </button>
      `
      )
      .join('');

    chipsContainer.querySelectorAll('.chip-action').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          this.sendUserMessage(prompt);
        }
      });
    });
  }

  private getContextualChips(category: string): { label: string; prompt: string }[] {
    // Mode-specific chips
    if (this.currentMode === 'vocab') {
      return [
        { label: '📚 Bảng từ vựng C1/C2', prompt: 'Trích xuất toàn bộ từ vựng học thuật C1/C2 và Collocations ở trang này thành bảng markdown kèm IPA và nghĩa.' },
        { label: '🔄 Kỹ thuật Paraphrase', prompt: 'Lập bảng phân tích các từ khóa paraphrase giữa câu hỏi và bài đọc/nghe ở trang này.' },
        { label: '💎 Collocations đắt giá', prompt: 'Chỉ ra các cụm collocations tự nhiên và Academic Words giúp nâng band điểm ở trang này.' },
      ];
    }

    if (this.currentMode === 'explain') {
      return [
        { label: '🎯 Bóc tách Bẫy (Distractors)', prompt: 'Chỉ ra các bẫy (distractor) và lỗi sai người học dễ mắc phải nhất ở các câu hỏi trang này.' },
        { label: '🔍 Dẫn chứng từng câu', prompt: 'Giải thích vì sao đáp án trong Answer Key lại chính xác, trích dẫn chứng dòng cụ thể trong bài.' },
        { label: '💡 Mẹo tránh bẫy', prompt: 'Chia sẻ chiến thuật và mẹo làm bài chuẩn Cambridge để không bị lừa ở dạng bài này.' },
      ];
    }

    if (this.currentMode === 'writing') {
      return [
        { label: '✍️ Dàn ý Band 8.0 bài này', prompt: 'Lập dàn ý chi tiết 4 đoạn chuẩn Band 8.0 cho đề bài / dạng bài viết ở trang này.' },
        { label: '📊 Mẫu Overview & Câu phức', prompt: 'Cung cấp mẫu câu mở bài, Overview và các cấu trúc ngữ pháp phức (GRA) đắt giá cho dạng này.' },
        { label: '🧐 Hướng dẫn chấm bài', prompt: 'Hướng dẫn tôi tự chấm bài viết theo 4 tiêu chí giám khảo: TR, CC, LR, GRA.' },
      ];
    }

    if (this.currentMode === 'speaking') {
      return [
        { label: '🗣️ Câu trả lời mẫu Band 8.0', prompt: 'Cung cấp câu trả lời mẫu Band 8.0 tự nhiên, trôi chảy cho các câu hỏi luyện nói trang này.' },
        { label: '💡 Khung phát triển ý P.E.E.R', prompt: 'Hướng dẫn mở rộng câu trả lời theo công thức P.E.E.R (Point -> Explain -> Example -> Result).' },
        { label: '🎙️ Nối âm & Ngữ điệu', prompt: 'Chỉ ra các lưu ý về phát âm, trọng âm và ngữ điệu tự nhiên cho chủ đề nói này.' },
      ];
    }

    // Default 'mentor' mode: tailor according to book section category
    if (category === 'listening' || category === 'practice_test') {
      return [
        { label: '🎧 Tóm tắt bài nghe', prompt: 'Tóm tắt nội dung bài nghe và ngữ cảnh hội thoại ở trang này.' },
        { label: '🎯 Chỉ ra bẫy (Distractor)', prompt: 'Phân tích các bẫy (distractor) thường gặp trong bài nghe ở trang này.' },
        { label: '📝 Từ vựng & Phát âm', prompt: 'Trích xuất từ vựng và lưu ý nối âm/phát âm cần chú ý ở trang này.' },
        { label: '💡 Chiến thuật bắt keywords', prompt: 'Hướng dẫn cách gạch chân keyword và dự đoán đáp án trước khi bật audio ở trang này.' },
      ];
    }

    if (category === 'reading') {
      return [
        { label: '📖 Dịch & Phân tích đoạn', prompt: 'Dịch nghĩa và phân tích ý chính từng đoạn văn ở trang này.' },
        { label: '🔄 Bảng Paraphrase', prompt: 'Lập bảng đối chiếu Paraphrase giữa từ khóa trong câu hỏi và bài đọc trang này.' },
        { label: '🎯 Chiến thuật làm dạng bài', prompt: 'Hướng dẫn chiến thuật làm dạng bài đọc ở trang này (Skimming, Scanning, định vị thông tin).' },
        { label: '💎 Từ vựng C1/C2', prompt: 'Trích xuất 6 từ vựng học thuật C1/C2 kèm ví dụ trong ngữ cảnh bài đọc này.' },
      ];
    }

    if (category === 'writing') {
      return [
        { label: '✍️ Dàn ý 4 đoạn Band 8.0', prompt: 'Lập dàn ý chi tiết 4 đoạn chuẩn Band 8.0 cho bài viết trang này.' },
        { label: '📊 Mẫu câu Overview & Body', prompt: 'Cung cấp mẫu câu mở bài, Overview và các cấu trúc so sánh đắt giá cho dạng này.' },
        { label: '🧐 Chấm & Sửa bài viết', prompt: 'Hãy chấm bài viết của tôi theo 4 tiêu chí giám khảo Cambridge: TR, CC, LR, GRA.' },
      ];
    }

    if (category === 'speaking') {
      return [
        { label: '🗣️ Gợi ý trả lời Band 8.0', prompt: 'Cung cấp câu trả lời mẫu Band 8.0 cho các câu hỏi luyện nói trang này.' },
        { label: '💡 Phát triển ý tưởng', prompt: 'Hướng dẫn mở rộng ý theo công thức P.E.E.R (Point -> Explain -> Example -> Result).' },
        { label: '🎙️ Idioms & Collocations', prompt: 'Gợi ý các cụm từ tự nhiên và collocations cho chủ đề này.' },
      ];
    }

    if (category === 'scripts') {
      return [
        { label: '📜 Phân tích đoạn Transcript', prompt: 'Phân tích đoạn băng transcript này: chỉ ra từ khóa ăn điểm và chỗ người nói đổi ý.' },
        { label: '🗣️ Từ vựng nói tự nhiên', prompt: 'Trích xuất các cụm từ nói tự nhiên và lưu ý nối âm trong đoạn transcript này.' },
      ];
    }

    if (category === 'answers') {
      return [
        { label: '🔍 Giải thích vì sao đáp án đúng', prompt: 'Giải thích vì sao đáp án trong Answer Key lại chính xác và dẫn chứng nằm ở đâu trong bài.' },
      ];
    }

    return [
      { label: '📖 Giải thích trang này', prompt: 'Giải thích chi tiết nội dung và các bài tập ở trang này giúp tôi.' },
      { label: '💡 Chiến thuật làm bài', prompt: 'Hướng dẫn chiến thuật làm bài tốt nhất cho nội dung ở trang này.' },
      { label: '📝 Từ vựng quan trọng', prompt: 'Trích xuất từ vựng quan trọng ở trang này kèm giải nghĩa.' },
    ];
  }

  private setupResizeHandle(): void {
    const handle = this.container.querySelector('#ai-chat-resize-handle') as HTMLElement;
    const popup = this.container.querySelector('#ai-chat-popup') as HTMLElement;
    if (!handle || !popup) return;

    let startX = 0;
    let startWidth = 0;
    let isDragging = false;

    const startDrag = (clientX: number) => {
      isDragging = true;
      startX = clientX;
      startWidth = popup.getBoundingClientRect().width;
      document.body.classList.add('ai-resizing');
    };

    const doDrag = (clientX: number) => {
      if (!isDragging) return;
      const deltaX = startX - clientX;
      const targetWidth = startWidth + deltaX;
      const minWidth = 360;
      const maxWidth = Math.min(window.innerWidth - 120, 1050);
      const clamped = Math.max(minWidth, Math.min(maxWidth, targetWidth));

      this.customWidth = clamped;
      document.documentElement.style.setProperty('--ai-expanded-width', `${clamped}px`);
      if (!this.isExpanded) {
        popup.style.width = `${clamped}px`;
      }
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.classList.remove('ai-resizing');
      localStorage.setItem('ai_chat_custom_width', String(this.customWidth));
    };

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startDrag(e.clientX);

      const onMouseMove = (ev: MouseEvent) => {
        doDrag(ev.clientX);
      };
      const onMouseUp = () => {
        stopDrag();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    handle.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          startDrag(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (isDragging && e.touches.length === 1) {
          doDrag(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    window.addEventListener('touchend', () => {
      if (isDragging) stopDrag();
    });
  }

  private renderMessages(): void {
    const list = this.container.querySelector('#ai-messages-list');
    if (!list) return;

    list.innerHTML = this.messages
      .map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isAssistantLoading = !isUser && this.isStreaming && !msg.content;
        let contentHtml = '';

        if (isUser) {
          contentHtml = this.escapeHtml(msg.content).replace(/\n/g, '<br>');
        } else if (isAssistantLoading) {
          contentHtml = `
            <div class="ai-loading-indicator">
              <div class="ai-typing-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <span class="ai-loading-text">Examiner AI đang suy nghĩ & phân tích...</span>
            </div>
          `;
        } else {
          contentHtml = this.formatMarkdown(msg.content);
        }

        // Action buttons: ONLY appear when response is DONE (!isStreaming) and content is non-empty!
        const isDone = !this.isStreaming;
        const showActions = !isUser && msg.id !== 'welcome' && isDone && msg.content.trim().length > 0;
        const isLastMsg = idx === this.messages.length - 1;

        return `
          <div class="chat-message ${msg.role}" id="msg-${msg.id}">
            <div class="msg-bubble">
              <div class="msg-content">${contentHtml}</div>
              ${
                showActions
                  ? `
                <div class="msg-actions-row">
                  <button class="btn-msg-icon-action btn-copy-msg" data-msg-id="${msg.id}" title="Sao chép câu trả lời">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                  ${
                    isLastMsg
                      ? `
                    <button class="btn-msg-icon-action btn-regen-msg" title="Tạo lại câu trả lời (Regenerate)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                    </button>
                  `
                      : ''
                  }
                </div>
              `
                  : ''
              }
            </div>
          </div>
        `;
      })
      .join('');

    // Wire message actions
    list.querySelectorAll('.btn-copy-msg').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget as HTMLElement;
        const msgId = targetBtn.getAttribute('data-msg-id');
        const found = this.messages.find((m) => m.id === msgId);
        if (found) {
          navigator.clipboard.writeText(found.content);
          targetBtn.classList.add('copied');
          targetBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          targetBtn.title = 'Đã sao chép!';
          setTimeout(() => {
            targetBtn.classList.remove('copied');
            targetBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            targetBtn.title = 'Sao chép câu trả lời';
          }, 1800);
        }
      });
    });

    list.querySelector('.btn-regen-msg')?.addEventListener('click', () => {
      if (this.lastUserPrompt && !this.isStreaming) {
        // Remove the last assistant message and re-send
        this.messages.pop();
        this.sendUserMessage(this.lastUserPrompt);
      }
    });

    list.scrollTop = list.scrollHeight;
  }

  private formatMarkdown(content: string): string {
    // Process Examiner Callouts:
    // > [!TIP]
    // > text
    let processed = content
      .replace(/^>\s*\[!TIP\]\s*\n((?:>.*\n?)*)/gim, (_, text) => {
        const clean = text.replace(/^>\s?/gm, '');
        return `<div class="ai-callout ai-callout-tip"><div class="callout-header"><span class="callout-icon">💡</span> MẸO THI CỬ (EXAMINER TIP)</div><div class="callout-body">${clean}</div></div>\n`;
      })
      .replace(/^>\s*\[!WARNING\]\s*\n((?:>.*\n?)*)/gim, (_, text) => {
        const clean = text.replace(/^>\s?/gm, '');
        return `<div class="ai-callout ai-callout-warning"><div class="callout-header"><span class="callout-icon">⚠️</span> BẪY THƯỜNG GẶP (COMMON TRAP)</div><div class="callout-body">${clean}</div></div>\n`;
      })
      .replace(/^>\s*\[!NOTE\]\s*\n((?:>.*\n?)*)/gim, (_, text) => {
        const clean = text.replace(/^>\s?/gm, '');
        return `<div class="ai-callout ai-callout-note"><div class="callout-header"><span class="callout-icon">ℹ️</span> LƯU Ý QUAN TRỌNG</div><div class="callout-body">${clean}</div></div>\n`;
      });

    return marked.parse(processed) as string;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private stopStreaming(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isStreaming = false;
    this.updateStreamingUI(false);
  }

  private updateStreamingUI(isStreaming: boolean): void {
    const iconSend = this.container.querySelector('.icon-send') as HTMLElement;
    const iconStop = this.container.querySelector('.icon-stop') as HTMLElement;
    const btnSend = this.container.querySelector('#btn-send-message') as HTMLElement;

    if (iconSend && iconStop) {
      iconSend.style.display = isStreaming ? 'none' : 'block';
      iconStop.style.display = isStreaming ? 'block' : 'none';
      if (btnSend) {
        btnSend.classList.toggle('btn-stopping', isStreaming);
        btnSend.title = isStreaming ? 'Dừng trả lời (Stop)' : 'Gửi tin nhắn';
      }
    }
  }

  private async sendUserMessage(content: string): Promise<void> {
    if (!this.config.apiKey && this.config.provider !== 'ollama') {
      this.openSettingsModal();
      return;
    }

    this.lastUserPrompt = content;

    // Load complete ground-truth context: current page text/questions, audio tapescript, and Cambridge answer key
    const pageContext = await loadPageFullContext(this.currentPage, this.currentMode);

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content,
      timestamp: Date.now(),
      pageContext,
    };

    this.messages.push(userMsg);

    const assistantMsgId = 'ast_' + Date.now();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    this.messages.push(assistantMsg);
    this.renderMessages();

    this.abortController = new AbortController();
    this.isStreaming = true;
    this.updateStreamingUI(true);

    const list = this.container.querySelector('#ai-messages-list') as HTMLElement;
    const msgCard = this.container.querySelector(`#msg-${assistantMsgId}`) as HTMLElement;
    const msgElement = this.container.querySelector(`#msg-${assistantMsgId} .msg-content`) as HTMLElement;

    if (msgCard) {
      msgCard.classList.add('streaming');
    }

    let targetText = '';
    let displayedLength = 0;
    let isNetworkDone = false;
    let hasStartedTyping = false;

    const finishStreaming = () => {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      this.isStreaming = false;
      this.updateStreamingUI(false);
      assistantMsg.content = targetText;
      if (msgCard) {
        msgCard.classList.remove('streaming');
      }
      this.renderMessages();
      if (list) list.scrollTop = list.scrollHeight;
    };

    const renderLoop = () => {
      if (!this.isStreaming) return;

      const remaining = targetText.length - displayedLength;

      if (remaining > 0) {
        if (!hasStartedTyping) {
          hasStartedTyping = true;
          if (msgElement) {
            msgElement.classList.add('is-typing');
          }
        }

        // Adaptive typing speed based on buffer size:
        // When remaining is small: 1-2 chars per frame (smooth typing cadence)
        // When remaining is large (fast network chunk): scales up smoothly so it never lags behind
        let step = 1;
        if (remaining > 150) {
          step = 8;
        } else if (remaining > 80) {
          step = 5;
        } else if (remaining > 35) {
          step = 3;
        } else if (remaining > 10) {
          step = 2;
        } else {
          step = 1;
        }

        displayedLength = Math.min(targetText.length, displayedLength + step);

        if (msgElement) {
          const currentText = targetText.slice(0, displayedLength);
          msgElement.innerHTML = this.formatMarkdown(currentText) + '<span class="typing-cursor"></span>';

          if (list) {
            const isNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 160;
            if (isNearBottom) {
              list.scrollTop = list.scrollHeight;
            }
          }
        }
      }

      if (isNetworkDone && displayedLength >= targetText.length) {
        finishStreaming();
        return;
      }

      this.animFrameId = requestAnimationFrame(renderLoop);
    };

    // Start typewriter animation loop
    this.animFrameId = requestAnimationFrame(renderLoop);

    try {
      await streamChatCompletion(
        this.config,
        this.messages.slice(0, -1),
        pageContext,
        {
          onToken: (token) => {
            targetText += token;
          },
          onComplete: (full) => {
            targetText = full;
            isNetworkDone = true;
          },
          onError: (err) => {
            isNetworkDone = true;
            if (!targetText) {
              targetText = `⚠️ **Lỗi kết nối AI:**\n${err.message}`;
            }
          },
        },
        this.abortController.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        isNetworkDone = true;
        if (!targetText) {
          targetText = `⚠️ **Lỗi kết nối:** ${e.message}`;
        }
      }
    }
  }

  private openSettingsModal(): void {
    const modal = this.container.querySelector('#ai-settings-modal') as HTMLElement;
    if (!modal) return;
    modal.style.display = 'flex';

    (this.container.querySelector('#setting-provider') as HTMLSelectElement).value = this.config.provider;
    (this.container.querySelector('#setting-api-key') as HTMLInputElement).value = this.config.apiKey;
    (this.container.querySelector('#setting-base-url') as HTMLInputElement).value = this.config.baseUrl;
    (this.container.querySelector('#setting-model') as HTMLInputElement).value = this.config.model;

    const preset = AI_PROVIDER_PRESETS[this.config.provider];
    if (preset) {
      this.renderModelQuickTags(preset.models);
    }
  }

  private closeSettingsModal(): void {
    const modal = this.container.querySelector('#ai-settings-modal') as HTMLElement;
    if (modal) modal.style.display = 'none';
  }

  private renderModelQuickTags(models: string[]): void {
    const tagsContainer = this.container.querySelector('#setting-model-tags');
    if (!tagsContainer) return;
    tagsContainer.innerHTML = models
      .map((m) => `<button type="button" class="tag-model-quick" data-model="${m}">${m}</button>`)
      .join('');

    tagsContainer.querySelectorAll('.tag-model-quick').forEach((tag) => {
      tag.addEventListener('click', () => {
        const m = tag.getAttribute('data-model');
        if (m) {
          (this.container.querySelector('#setting-model') as HTMLInputElement).value = m;
        }
      });
    });
  }

  private saveSettingsFromModal(): void {
    const provider = (this.container.querySelector('#setting-provider') as HTMLSelectElement).value as AiProvider;
    const apiKey = (this.container.querySelector('#setting-api-key') as HTMLInputElement).value.trim();
    const baseUrl = (this.container.querySelector('#setting-base-url') as HTMLInputElement).value.trim();
    const model = (this.container.querySelector('#setting-model') as HTMLInputElement).value.trim();

    this.config = {
      ...this.config,
      provider,
      apiKey,
      baseUrl,
      model,
    };
    saveAiConfig(this.config);
    this.updateContextBadge();
    this.closeSettingsModal();
  }

  private async handleTestConnection(): Promise<void> {
    const btn = this.container.querySelector('#btn-test-conn') as HTMLButtonElement;
    const msg = this.container.querySelector('#test-result-msg') as HTMLElement;

    const tempConfig: AiConfig = {
      provider: (this.container.querySelector('#setting-provider') as HTMLSelectElement).value as AiProvider,
      apiKey: (this.container.querySelector('#setting-api-key') as HTMLInputElement).value.trim(),
      baseUrl: (this.container.querySelector('#setting-base-url') as HTMLInputElement).value.trim(),
      model: (this.container.querySelector('#setting-model') as HTMLInputElement).value.trim(),
      temperature: 0.7,
      systemPromptPreset: 'default',
    };

    if (btn) btn.disabled = true;
    if (msg) {
      msg.className = 'test-result-msg loading';
      msg.textContent = '⏳ Đang kiểm tra...';
    }

    const res = await testAiConnection(tempConfig);
    if (btn) btn.disabled = false;
    if (msg) {
      msg.className = `test-result-msg ${res.success ? 'success' : 'error'}`;
      msg.textContent = res.message;
    }
  }
}
