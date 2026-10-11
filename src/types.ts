export type PageLayout = 'single' | 'double';
export type FitMode = 'height' | 'width';
export type ViewMode = 'single' | 'double' | 'fit-width';

export interface TocItem {
  id: string;
  title: string;
  page: number; // 1-based PDF page index
  bookPage?: number; // printed book page
  category: 'introduction' | 'listening' | 'reading' | 'writing' | 'speaking' | 'practice_test' | 'scripts' | 'answers';
  unit?: number;
  audioTrack?: number; // 1-70
  scriptPage?: number;
  answerPage?: number;
  children?: TocItem[];
}

export interface AudioTrackInfo {
  id: number; // 1-70
  filename: string; // e.g. CGtoIELTS_01.mp3
  title: string;
  subtitle: string;
  category: 'listening_skills' | 'speaking_skills' | 'practice_test';
  page: number; // start page
  endPage?: number; // end page (inclusive)
  unit?: string;
  test?: number;
  section?: number;
  duration?: number;
}

export type AiProvider = 'gemini' | 'openai' | 'deepseek' | 'groq' | 'ollama' | 'custom';
export type AiMentorMode = 'mentor' | 'explain' | 'vocab' | 'writing' | 'speaking';

export interface PageAiContext {
  page: number;
  title?: string;
  unit?: string;
  audioTrack?: number;
  category?: string;
  scriptPage?: number;
  answerPage?: number;
  mode?: AiMentorMode;
  pageText?: string;
  scriptText?: string;
  answerText?: string;
}

export interface AiConfig {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  systemPromptPreset: string;
  mentorMode?: AiMentorMode;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  pageContext?: PageAiContext;
}

export interface Bookmark {
  page: number;
  title: string;
  createdAt: number;
}

export interface PageNote {
  page: number;
  text: string;
  updatedAt: number;
}
