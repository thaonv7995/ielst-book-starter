import { PageAiContext, AiMentorMode } from '../types';
import { getTocItemForPage, getAudioTracksForPage } from '../data/book-structure';

// In-memory cache for loaded page texts to avoid re-fetching
const pageTextCache = new Map<number, string>();

/**
 * Fetch raw OCR text for a specific book page
 */
export async function fetchPageText(page: number): Promise<string> {
  if (page < 1 || page > 398) return '';
  if (pageTextCache.has(page)) {
    return pageTextCache.get(page)!;
  }

  try {
    const res = await fetch(`/page-texts/page_${page}.txt`);
    if (res.ok) {
      const text = await res.text();
      pageTextCache.set(page, text);
      return text;
    }
  } catch (e) {
    console.warn(`Could not load page text for page ${page}`, e);
  }
  return '';
}

/**
 * Fetch recording script text for a page.
 * If scriptPage is specified, fetches that page and adjacent script pages if applicable.
 */
export async function fetchScriptTextForPage(page: number, scriptPage?: number): Promise<string> {
  if (!scriptPage) return '';

  const chunks: string[] = [];
  const primary = await fetchPageText(scriptPage);
  if (primary && primary.trim().length > 0) {
    chunks.push(`[TAPESCRIPT TRANG ${scriptPage}]:\n${primary.trim()}`);
  }

  // Recording scripts frequently span across multiple pages (330 - 362)
  if (scriptPage + 1 <= 362) {
    const secondary = await fetchPageText(scriptPage + 1);
    if (secondary && secondary.trim().length > 0) {
      chunks.push(`[TAPESCRIPT TRANG ${scriptPage + 1}]:\n${secondary.trim()}`);
    }
  }

  return chunks.join('\n\n');
}

/**
 * Fetch official Cambridge answer key text for a page.
 */
export async function fetchAnswerTextForPage(page: number, answerPage?: number): Promise<string> {
  if (!answerPage) return '';
  const text = await fetchPageText(answerPage);
  if (text && text.trim().length > 0) {
    return `[ĐÁP ÁN CAMBRIDGE TRANG ${answerPage}]:\n${text.trim()}`;
  }
  return '';
}

/**
 * Assemble comprehensive PageAiContext with actual page text, tapescripts, and answer key.
 */
export async function loadPageFullContext(page: number, mode?: AiMentorMode): Promise<PageAiContext> {
  const toc = getTocItemForPage(page);
  const audioTracks = getAudioTracksForPage(page);
  const primaryTrack = audioTracks.length > 0 ? audioTracks[0] : undefined;

  const scriptPage = toc?.scriptPage;
  const answerPage = toc?.answerPage;

  // Parallel fetch page text, script text, answer text
  const [pageText, scriptText, answerText] = await Promise.all([
    fetchPageText(page),
    fetchScriptTextForPage(page, scriptPage),
    fetchAnswerTextForPage(page, answerPage),
  ]);

  return {
    page,
    title: toc?.title,
    unit: toc?.unit ? `Unit ${toc.unit}` : undefined,
    category: toc?.category,
    audioTrack: primaryTrack?.id,
    scriptPage,
    answerPage,
    mode,
    pageText: pageText.trim() || undefined,
    scriptText: scriptText.trim() || undefined,
    answerText: answerText.trim() || undefined,
  };
}
