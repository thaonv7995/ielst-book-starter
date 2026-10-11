import { AiConfig, AiProvider, ChatMessage, PageAiContext, AiMentorMode } from '../types';

export const AI_PROVIDER_PRESETS: Record<AiProvider, { name: string; defaultBaseUrl: string; defaultModel: string; models: string[] }> = {
  custom: {
    name: 'AuxCloud / Custom OpenAI-Compatible',
    defaultBaseUrl: 'https://llm.auxcloud.art/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-sonnet-20241022', 'deepseek-chat', 'deepseek-reasoner'],
  },
  deepseek: {
    name: 'DeepSeek Official',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  gemini: {
    name: 'Google Gemini (OpenAI compatible)',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  },
  openai: {
    name: 'OpenAI ChatGPT',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
  },
  groq: {
    name: 'Groq Cloud (Fast inference)',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  },
  ollama: {
    name: 'Ollama (Local Offline)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'qwen2.5:7b', 'mistral'],
  },
};

const STORAGE_KEY = 'ielts_book_ai_config';

export function getDefaultAiConfig(): AiConfig {
  return {
    provider: 'custom',
    baseUrl: 'https://llm.auxcloud.art/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    systemPromptPreset: 'ielts_mentor',
    mentorMode: 'mentor',
  };
}

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultAiConfig(), ...parsed };
    }
  } catch (e) {
    console.warn('Could not load AI config from localStorage', e);
  }
  return getDefaultAiConfig();
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Could not save AI config to localStorage', e);
  }
}

export function buildSystemPrompt(context?: PageAiContext): string {
  const mode: AiMentorMode = context?.mode || 'mentor';

  let specificModeInstructions = '';
  switch (mode) {
    case 'explain':
      specificModeInstructions = `
[CHẾ ĐỘ CHUYÊN BIỆT: GIẢI THÍCH ĐÁP ÁN & BÓC TÁCH BẪY (DISTRACTORS)]
1. Với câu hỏi người học đưa ra hoặc câu hỏi ở trang sách này:
   - Dẫn chứng chuẩn xác: Nêu rõ câu văn / dòng nào trong bài đọc, hoặc câu thoại nào trong recording script.
   - Vì sao đáp án này đúng: Giải thích logic ngữ nghĩa, chỉ ra kỹ thuật Paraphrase (từ đồng nghĩa/cấu trúc tương đương).
   - Phân tích bẫy (Distractors): Chỉ rõ các phương án sai đã đánh lừa người học như thế nào (thông tin bị bóp méo, thông tin nói trước nhưng người nói tự đính chính, hoặc dùng từ tuyệt đối).
   - Rút ra mẹo: Đóng khung bằng '> [!TIP]' hướng dẫn cách xử lý dạng câu hỏi này khi đi thi thật.`;
      break;

    case 'vocab':
      specificModeInstructions = `
[CHẾ ĐỘ CHUYÊN BIỆT: TRÍCH XUẤT TỪ VỰNG & BẢNG PARAPHRASE CHUYÊN SÂU]
1. Trích xuất các từ vựng học thuật (Academic Words), Collocations đắt giá C1/C2 từ nội dung trang sách hiện tại.
2. Trình bày dưới dạng BẢNG MARKDOWN chuẩn đẹp:
   | Từ vựng / Cụm từ | Phiên âm IPA | Nghĩa tiếng Việt | Cấp độ | Academic Collocation & Ví dụ thực tế |
3. Nếu trang sách có câu hỏi bài tập, lập thêm Bảng Kỹ thuật Paraphrase của Cambridge:
   | Từ khóa trong Câu hỏi | Từ / Cụm từ trong Bài đọc / Nghe | Phân tích cách biến đổi (Từ đồng nghĩa, Đổi dạng từ, Trái nghĩa phủ định) |`;
      break;

    case 'writing':
      specificModeInstructions = `
[CHẾ ĐỘ CHUYÊN BIỆT: COACHING & CHẤM BÀI WRITING BAND 8.0+]
1. Nếu người học dán bài viết của mình vào:
   - Chấm điểm và nhận xét chi tiết theo 4 tiêu chí chính thức của Cambridge:
     * Task Achievement / Task Response (TR): Trả lời đầy đủ yêu cầu đề, phát triển luận điểm có độ sâu.
     * Coherence & Cohesion (CC): Bố cục logic 4 đoạn, liên kết câu/đoạn tự nhiên.
     * Lexical Resource (LR): Độ chính xác từ vựng, tính học thuật, collocations, lỗi chính tả.
     * Grammatical Range & Accuracy (GRA): Độ đa dạng cấu trúc ngữ pháp (mệnh đề quan hệ, đảo ngữ, câu điều kiện, bị động) và độ chính xác.
   - Bảng sửa lỗi chi tiết: Lỗi trong bài -> Bản sửa chuẩn -> Giải thích lý do.
   - Band điểm ước tính tổng quan và từng tiêu chí.
   - Cung cấp bài mẫu viết lại (Rewritten Model Answer) đạt chuẩn Band 8.0+.
2. Nếu người học hỏi về bài tập Writing trên trang sách:
   - Lập dàn ý 4 đoạn tối ưu, cung cấp mẫu mở bài, câu Overview và các câu phức đắt giá cho dạng bài đó.`;
      break;

    case 'speaking':
      specificModeInstructions = `
[CHẾ ĐỘ CHUYÊN BIỆT: LUYỆN NÓI & NÂNG BAND SPEAKING]
1. Hướng dẫn mở rộng ý theo công thức P.E.E.R (Point -> Explain -> Example -> Result) hoặc A.R.E.A (Answer -> Reason -> Example -> Alternative).
2. Cung cấp câu trả lời mẫu đạt Band 7.5 - 8.5 mang tính tự nhiên, có ngữ điệu, dùng discourse markers đời thường của người bản xứ (Well, to be perfectly honest, looking back, frankly speaking...).
3. Gợi ý Idiomatic language, Collocations và lưu ý phát âm: Trọng âm từ, ngữ điệu và nối âm (connected speech).`;
      break;

    default: // 'mentor'
      specificModeInstructions = `
[CHẾ ĐỘ MENTOR TOÀN DIỆN]
- Đóng vai trò trợ giảng cao cấp, hỗ trợ người học toàn diện về từ vựng, ngữ pháp, chiến thuật làm bài và tư duy giải đề Cambridge.
- Luôn giải thích cặn kẽ, có tâm, cấu trúc bài giảng rõ ràng, khuyến khích tư duy phản biện.`;
      break;
  }

  let contextStr = '';
  if (context) {
    const metaLines: string[] = [
      `- Trang sách: Trang ${context.page} (Sách "The Official Cambridge Guide to IELTS")`,
    ];
    if (context.title) metaLines.push(`- Phần / Bài học: ${context.title}`);
    if (context.unit) metaLines.push(`- Unit: ${context.unit}`);
    if (context.category) metaLines.push(`- Kỹ năng: ${context.category.toUpperCase()}`);
    if (context.audioTrack) metaLines.push(`- Audio tương ứng: Track ${context.audioTrack}`);
    if (context.scriptPage) metaLines.push(`- Vị trí Tapescript: Trang ${context.scriptPage}`);
    if (context.answerPage) metaLines.push(`- Vị trí Đáp án: Trang ${context.answerPage}`);

    let details = '';
    if (context.pageText) {
      details += `\n\n[NỘI DUNG VĂN BẢN & CÂU HỎI TRANG SÁCH HIỆN TẠI (TRANG ${context.page})]:\n${context.pageText.trim()}`;
    }

    if (context.scriptText) {
      details += `\n\n[KỊCH BẢN GHI ÂM CHÍNH THỨC CỦA BÀI (RECORDING TAPESCRIPTS)]:
${context.scriptText.trim()}`;
    }

    if (context.answerText) {
      details += `\n\n[ĐÁP ÁN CHÍNH THỨC TỪ CAMBRIDGE (OFFICIAL ANSWER KEY)]:
${context.answerText.trim()}`;
    }

    contextStr = `
======================================================================
[DỮ LIỆU ĐẦY ĐỦ CỦA BÀI HỌC TỪ CAMBRIDGE]:
${metaLines.join('\n')}${details}
======================================================================`;
  }

  return `Bạn là "IELTS Master Mentor" - Trợ giảng AI chuyên sâu đồng hành cùng người học cuốn sách tiêu chuẩn vàng "The Official Cambridge Guide to IELTS".

VAI TRÒ VÀ NGUYÊN TẮC BẮT BUỘC CỦA BẠN:
1. **Chuyên môn IELTS:** Nắm vững toàn bộ 4 kỹ năng Listening, Reading, Writing, Speaking theo tiêu chuẩn giám khảo Cambridge.
2. **Ngôn ngữ sư phạm:** Trả lời bằng tiếng Việt thân thiện, rõ ràng, trực quan, có kết hợp từ vựng và thuật ngữ tiếng Anh chuẩn xác.
3. **Chi tiết & Dẫn chứng:** Khi giải thích câu hỏi hoặc bài đọc/nghe, luôn chỉ ra dẫn chứng (evidence), phân tích tại sao đáp án này đúng và các bẫy (distractors) cần tránh.
4. **QUY TẮC BẮT BUỘC VỀ DỮ LIỆU ĐÃ CUNG CẤP:**
   - Bạn ĐÃ ĐƯỢC CUNG CẤP ĐẦY ĐỦ nội dung bài tập, câu hỏi, kịch bản nghe (tapescript) và đáp án chính thức từ sách Cambridge ở phần dữ liệu bên dưới.
   - TUYỆT ĐỐI KHÔNG ĐƯỢC đưa ra các câu ghi chú/lưu ý như: "Vì chưa có ảnh...", "Vì chưa có tapescript...", "Nếu bạn gửi ảnh/nội dung tapescript tôi sẽ phân tích...".
   - TUYỆT ĐỐI KHÔNG yêu cầu người học phải gửi ảnh trang sách hay gõ lại tapescript.
   - Hãy đi thẳng vào phân tích chi tiết:
     * Dẫn trực tiếp câu hỏi (Câu 1, 2, 3, 4...) và các phương án lựa chọn (A, B, C...) từ nội dung trang sách đã có.
     * Trích dẫn chính xác lời thoại của từng người nói trong tapescript để làm bằng chứng.
     * Vạch trần từng distractor (bẫy đánh lừa) cụ thể theo đúng số câu hỏi.
     * Đối chiếu chuẩn xác với đáp án chính thức từ Cambridge.
5. **Định dạng Markdown đẹp mắt:**
   - Dùng tiêu đề rõ ràng (###, ####).
   - Dùng in đậm cho các từ khóa học thuật.
   - Dùng Bảng Markdown cho từ vựng và so sánh paraphrase.
   - Dùng '> [!TIP]' cho mẹo thi cử, '> [!WARNING]' cho các bẫy thường gặp.
${specificModeInstructions}
${contextStr}`;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

/**
 * Automatically proxies requests through local Vite dev proxy (/api/ai/proxy)
 * to bypass browser CORS preflight blocking when calling remote LLM endpoints.
 */
async function smartFetch(endpoint: string, options: RequestInit): Promise<Response> {
  const isExternal = !endpoint.startsWith('/') && !endpoint.includes('localhost') && !endpoint.includes('127.0.0.1');

  if (isExternal) {
    try {
      const headers = new Headers(options.headers || {});
      headers.set('x-target-url', endpoint);
      const proxyResponse = await fetch('/api/ai/proxy', {
        ...options,
        headers,
      });
      // If proxy handled the request (including 200, 401, 400 from remote server), return it
      if (proxyResponse.status !== 404) {
        return proxyResponse;
      }
    } catch {
      // Fall through to direct fetch if proxy is not reachable
    }
  }

  try {
    return await fetch(endpoint, options);
  } catch (err: any) {
    // If direct fetch failed with CORS / Network error, retry via proxy
    try {
      const headers = new Headers(options.headers || {});
      headers.set('x-target-url', endpoint);
      return await fetch('/api/ai/proxy', {
        ...options,
        headers,
      });
    } catch {
      throw err;
    }
  }
}

/**
 * Streams chat completion using OpenAI-compatible API format (SSE)
 */
export async function streamChatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  pageContext?: PageAiContext,
  callbacks?: StreamCallbacks,
  abortSignal?: AbortSignal
): Promise<string> {
  const systemPrompt = buildSystemPrompt(pageContext);

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const endpoint = config.baseUrl.replace(/\/+$/, '') + '/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey && config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  const payload = {
    model: config.model,
    messages: formattedMessages,
    temperature: config.temperature,
    stream: true,
  };

  try {
    const response = await smartFetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errDetail = await response.text();
      }
      throw new Error(`API Error (${response.status}): ${errDetail || response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty, streaming not supported by endpoint.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // SSE comment or ping

        if (trimmed === 'data: [DONE]') {
          continue;
        }

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const token = data.choices?.[0]?.delta?.content || '';
            if (token) {
              fullText += token;
              callbacks?.onToken(token);
            }
          } catch {
            // Partial JSON chunk, will be picked up on next line
          }
        }
      }
    }

    callbacks?.onComplete(fullText);
    return fullText;
  } catch (err: any) {
    const error = err instanceof Error ? err : new Error(String(err));
    callbacks?.onError(error);
    throw error;
  }
}

/**
 * Tests connection with the current AI configuration
 */
export async function testAiConnection(config: AiConfig): Promise<{ success: boolean; message: string }> {
  try {
    const endpoint = config.baseUrl.replace(/\/+$/, '') + '/chat/completions';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey && config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    const res = await smartFetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Say "Antigravity IELTS Ready" in 3 words.' }],
        max_tokens: 10,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `Lỗi kết nối (${res.status}): ${err}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Thành công';
    return { success: true, message: `Kết nối thành công! Phản hồi từ ${config.model}: "${reply.trim()}"` };
  } catch (e: any) {
    return { success: false, message: `Không thể kết nối tới ${config.baseUrl}: ${e.message}` };
  }
}
