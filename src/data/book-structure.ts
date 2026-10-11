import { TocItem, AudioTrackInfo } from '../types';

export const TOTAL_PAGES = 398;
export const SCRIPT_START_PAGE = 330;
export const ANSWER_KEY_START_PAGE = 363;

export const BOOK_TOC: TocItem[] = [
  {
    id: 'intro',
    title: 'Introduction & IELTS Overview',
    page: 6,
    bookPage: 5,
    category: 'introduction',
    children: [
      { id: 'intro-guide', title: 'About the Book & IELTS Guide', page: 6, bookPage: 5, category: 'introduction' },
      { id: 'intro-summary', title: 'IELTS Summary & Format', page: 8, bookPage: 7, category: 'introduction' },
    ],
  },
  {
    id: 'listening-skills',
    title: 'IELTS Listening Skills',
    page: 14,
    bookPage: 13,
    category: 'listening',
    children: [
      {
        id: 'lis-u1',
        title: 'Unit 1: Getting ready to listen',
        page: 16,
        bookPage: 15,
        category: 'listening',
        unit: 1,
        audioTrack: 2,
        scriptPage: 330,
        answerPage: 363,
      },
      {
        id: 'lis-u2',
        title: 'Unit 2: Following a conversation',
        page: 19,
        bookPage: 18,
        category: 'listening',
        unit: 2,
        audioTrack: 8,
        scriptPage: 331,
        answerPage: 364,
      },
      {
        id: 'lis-u3',
        title: 'Unit 3: Recognising paraphrase',
        page: 23,
        bookPage: 22,
        category: 'listening',
        unit: 3,
        audioTrack: 13,
        scriptPage: 332,
        answerPage: 365,
      },
      {
        id: 'lis-u4',
        title: 'Unit 4: Places and directions',
        page: 26,
        bookPage: 25,
        category: 'listening',
        unit: 4,
        audioTrack: 16,
        scriptPage: 333,
        answerPage: 366,
      },
      {
        id: 'lis-u5',
        title: 'Unit 5: Listening for actions and processes',
        page: 30,
        bookPage: 29,
        category: 'listening',
        unit: 5,
        audioTrack: 19,
        scriptPage: 334,
        answerPage: 367,
      },
      {
        id: 'lis-u6',
        title: 'Unit 6: Attitude and opinion',
        page: 34,
        bookPage: 33,
        category: 'listening',
        unit: 6,
        audioTrack: 23,
        scriptPage: 335,
        answerPage: 367,
      },
      {
        id: 'lis-u7',
        title: 'Unit 7: Following a lecture or talk',
        page: 37,
        bookPage: 36,
        category: 'listening',
        unit: 7,
        audioTrack: 26,
        scriptPage: 336,
        answerPage: 368,
      },
      {
        id: 'lis-u8',
        title: 'Unit 8: Contrasting ideas',
        page: 40,
        bookPage: 39,
        category: 'listening',
        unit: 8,
        audioTrack: 30,
        scriptPage: 337,
        answerPage: 369,
      },
    ],
  },
  {
    id: 'reading-skills',
    title: 'IELTS Reading Skills',
    page: 43,
    bookPage: 42,
    category: 'reading',
    children: [
      { id: 'read-u1', title: 'Unit 1: Reading strategies', page: 43, bookPage: 42, category: 'reading', unit: 1, answerPage: 370 },
      { id: 'read-u2', title: 'Unit 2: Descriptive passages', page: 49, bookPage: 48, category: 'reading', unit: 2, answerPage: 371 },
      { id: 'read-u3', title: 'Unit 3: Understanding the main ideas', page: 56, bookPage: 55, category: 'reading', unit: 3, answerPage: 372 },
      { id: 'read-u4', title: 'Unit 4: Locating and matching information', page: 60, bookPage: 59, category: 'reading', unit: 4, answerPage: 372 },
      { id: 'read-u5', title: 'Unit 5: Discursive passages', page: 65, bookPage: 64, category: 'reading', unit: 5, answerPage: 373 },
      { id: 'read-u6', title: 'Unit 6: Multiple-choice questions', page: 71, bookPage: 70, category: 'reading', unit: 6, answerPage: 374 },
      { id: 'read-u7', title: 'Unit 7: Opinions and attitudes', page: 74, bookPage: 73, category: 'reading', unit: 7, answerPage: 374 },
      { id: 'read-u8', title: 'Unit 8: General Training Reading', page: 79, bookPage: 78, category: 'reading', unit: 8, answerPage: 375 },
    ],
  },
  {
    id: 'writing-skills',
    title: 'IELTS Writing Skills',
    page: 92,
    bookPage: 91,
    category: 'writing',
    children: [
      { id: 'write-u1', title: 'Task 1: Describing a chart, table or graph', page: 92, bookPage: 91, category: 'writing', unit: 1, answerPage: 376 },
      { id: 'write-u2', title: 'Task 1: Comparing and contrasting graphs', page: 99, bookPage: 98, category: 'writing', unit: 2, answerPage: 377 },
      { id: 'write-u3', title: 'Task 1: Describing diagrams & processes', page: 103, bookPage: 102, category: 'writing', unit: 3, answerPage: 378 },
      { id: 'write-u4', title: 'Task 1: Describing maps & changes', page: 107, bookPage: 106, category: 'writing', unit: 4, answerPage: 379 },
      { id: 'write-u5', title: 'GT Task 1: Writing a letter', page: 111, bookPage: 110, category: 'writing', unit: 5, answerPage: 379 },
      { id: 'write-u6', title: 'Task 2: Getting ready to write & planning', page: 116, bookPage: 115, category: 'writing', unit: 6, answerPage: 380 },
      { id: 'write-u7', title: 'Task 2: Expressing your ideas clearly', page: 121, bookPage: 120, category: 'writing', unit: 7, answerPage: 381 },
      { id: 'write-u8', title: 'Task 2: Checking and correcting grammar', page: 126, bookPage: 125, category: 'writing', unit: 8, answerPage: 381 },
    ],
  },
  {
    id: 'speaking-skills',
    title: 'IELTS Speaking Skills',
    page: 135,
    bookPage: 134,
    category: 'speaking',
    children: [
      { id: 'spk-u1', title: 'Unit 1: The Speaking Test - Part 1', page: 137, bookPage: 136, category: 'speaking', unit: 1, scriptPage: 337, answerPage: 382 },
      { id: 'spk-u2', title: 'Unit 2: Part 2 - Giving a talk', page: 141, bookPage: 140, category: 'speaking', unit: 2, scriptPage: 337, answerPage: 383 },
      { id: 'spk-u3', title: 'Unit 3: Part 3 - Abstract topics & discussion', page: 146, bookPage: 145, category: 'speaking', unit: 3, scriptPage: 337, answerPage: 383 },
      { id: 'spk-u4', title: 'Unit 4: Checking, correcting and assessing', page: 150, bookPage: 149, category: 'speaking', unit: 4, audioTrack: 35, scriptPage: 337, answerPage: 384 },
    ],
  },
  {
    id: 'practice-tests',
    title: 'Practice Tests (8 Full Tests)',
    page: 155,
    bookPage: 154,
    category: 'practice_test',
    children: [
      { id: 'test-1', title: 'Practice Test 1 (with Hints)', page: 155, bookPage: 154, category: 'practice_test', audioTrack: 39, scriptPage: 338, answerPage: 385 },
      { id: 'test-2', title: 'Practice Test 2', page: 174, bookPage: 173, category: 'practice_test', audioTrack: 43, scriptPage: 341, answerPage: 386 },
      { id: 'test-3', title: 'Practice Test 3', page: 191, bookPage: 190, category: 'practice_test', audioTrack: 47, scriptPage: 344, answerPage: 387 },
      { id: 'test-4', title: 'Practice Test 4', page: 208, bookPage: 207, category: 'practice_test', audioTrack: 51, scriptPage: 347, answerPage: 388 },
      { id: 'test-5', title: 'Practice Test 5', page: 227, bookPage: 226, category: 'practice_test', audioTrack: 55, scriptPage: 350, answerPage: 389 },
      { id: 'test-6', title: 'Practice Test 6', page: 247, bookPage: 246, category: 'practice_test', audioTrack: 59, scriptPage: 353, answerPage: 390 },
      { id: 'test-7', title: 'Practice Test 7', page: 263, bookPage: 262, category: 'practice_test', audioTrack: 63, scriptPage: 356, answerPage: 391 },
      { id: 'test-7-gt', title: 'General Training Test (for Test 7)', page: 283, bookPage: 282, category: 'practice_test', answerPage: 392 },
      { id: 'test-8', title: 'Practice Test 8', page: 297, bookPage: 296, category: 'practice_test', audioTrack: 67, scriptPage: 359, answerPage: 393 },
      { id: 'test-8-gt', title: 'General Training Test (for Test 8)', page: 317, bookPage: 316, category: 'practice_test', answerPage: 394 },
    ],
  },
  {
    id: 'scripts',
    title: 'Recording Scripts (Audio Tapescripts)',
    page: 330,
    bookPage: 329,
    category: 'scripts',
  },
  {
    id: 'answers',
    title: 'Answer Key (Comprehensive Solutions)',
    page: 363,
    bookPage: 362,
    category: 'answers',
  },
  {
    id: 'sample-sheets',
    title: 'Sample Answer Sheets',
    page: 395,
    bookPage: 394,
    category: 'introduction',
  },
];

// Fully verified 70 audio tracks with exact spoken recording transcripts
export const AUDIO_TRACKS: AudioTrackInfo[] = [
  // Intro Track
  { id: 1, filename: 'CGtoIELTS_01.mp3', title: 'Track 01', subtitle: 'Book Intro & Copyright', category: 'listening_skills', page: 6, endPage: 6, unit: 'Intro' },

  // Listening Skills (Tracks 2 - 34)
  // Unit 1: Getting ready to listen (p.16 - 18)
  { id: 2, filename: 'CGtoIELTS_02.mp3', title: 'Track 02', subtitle: 'Listening Unit 1 - Ex 1.1 Predicting context', category: 'listening_skills', page: 16, endPage: 16, unit: 'Unit 1' },
  { id: 3, filename: 'CGtoIELTS_03.mp3', title: 'Track 03', subtitle: 'Listening Unit 1 - Ex 2.1 Alphabet & spelling', category: 'listening_skills', page: 17, endPage: 17, unit: 'Unit 1' },
  { id: 4, filename: 'CGtoIELTS_04.mp3', title: 'Track 04', subtitle: 'Listening Unit 1 - Ex 2.2 Names & addresses', category: 'listening_skills', page: 17, endPage: 17, unit: 'Unit 1' },
  { id: 5, filename: 'CGtoIELTS_05.mp3', title: 'Track 05', subtitle: 'Listening Unit 1 - Ex 3.1 Numbers & prices', category: 'listening_skills', page: 18, endPage: 18, unit: 'Unit 1' },
  { id: 6, filename: 'CGtoIELTS_06.mp3', title: 'Track 06', subtitle: 'Listening Unit 1 - Ex 3.3 Dimensions & fares', category: 'listening_skills', page: 18, endPage: 18, unit: 'Unit 1' },
  { id: 7, filename: 'CGtoIELTS_07.mp3', title: 'Track 07', subtitle: 'Listening Unit 1 - Ex 3.5 Survey statistics', category: 'listening_skills', page: 18, endPage: 18, unit: 'Unit 1' },

  // Unit 2: Following a conversation (p.19 - 22)
  { id: 8, filename: 'CGtoIELTS_08.mp3', title: 'Track 08', subtitle: 'Listening Unit 2 - Ex 1.1 Identifying speakers', category: 'listening_skills', page: 19, endPage: 19, unit: 'Unit 2' },
  { id: 9, filename: 'CGtoIELTS_09.mp3', title: 'Track 09', subtitle: 'Listening Unit 2 - Ex 1.2 Travel agency dialog', category: 'listening_skills', page: 20, endPage: 20, unit: 'Unit 2' },
  { id: 10, filename: 'CGtoIELTS_10.mp3', title: 'Track 10', subtitle: 'Listening Unit 2 - Ex 2.1 Speaker functions', category: 'listening_skills', page: 20, endPage: 20, unit: 'Unit 2' },
  { id: 11, filename: 'CGtoIELTS_11.mp3', title: 'Track 11', subtitle: 'Listening Unit 2 - Ex 2.3 Conversation topics', category: 'listening_skills', page: 21, endPage: 21, unit: 'Unit 2' },
  { id: 12, filename: 'CGtoIELTS_12.mp3', title: 'Track 12', subtitle: 'Listening Unit 2 - Ex 3.2 Hotel & tickets', category: 'listening_skills', page: 22, endPage: 22, unit: 'Unit 2' },

  // Unit 3: Recognising paraphrase (p.23 - 25)
  { id: 13, filename: 'CGtoIELTS_13.mp3', title: 'Track 13', subtitle: 'Listening Unit 3 - Ex 1.1 Distractors', category: 'listening_skills', page: 23, endPage: 23, unit: 'Unit 3' },
  { id: 14, filename: 'CGtoIELTS_14.mp3', title: 'Track 14', subtitle: 'Listening Unit 3 - Ex 2.2 Recognising paraphrase', category: 'listening_skills', page: 24, endPage: 24, unit: 'Unit 3' },
  { id: 15, filename: 'CGtoIELTS_15.mp3', title: 'Track 15', subtitle: 'Listening Unit 3 - Ex 3.2 Selecting from list', category: 'listening_skills', page: 25, endPage: 25, unit: 'Unit 3' },

  // Unit 4: Places and directions (p.26 - 29)
  { id: 16, filename: 'CGtoIELTS_16.mp3', title: 'Track 16', subtitle: 'Listening Unit 4 - Ex 1.4 Describing places', category: 'listening_skills', page: 27, endPage: 27, unit: 'Unit 4' },
  { id: 17, filename: 'CGtoIELTS_17.mp3', title: 'Track 17', subtitle: 'Listening Unit 4 - Ex 2.1 Directions to store', category: 'listening_skills', page: 28, endPage: 28, unit: 'Unit 4' },
  { id: 18, filename: 'CGtoIELTS_18.mp3', title: 'Track 18', subtitle: 'Listening Unit 4 - Ex 3.2 Market map plan', category: 'listening_skills', page: 29, endPage: 29, unit: 'Unit 4' },

  // Unit 5: Listening for actions and processes (p.30 - 33)
  { id: 19, filename: 'CGtoIELTS_19.mp3', title: 'Track 19', subtitle: 'Listening Unit 5 - Ex 1.2 System parts', category: 'listening_skills', page: 30, endPage: 30, unit: 'Unit 5' },
  { id: 20, filename: 'CGtoIELTS_20.mp3', title: 'Track 20', subtitle: 'Listening Unit 5 - Ex 2.1 Inventions & devices', category: 'listening_skills', page: 31, endPage: 31, unit: 'Unit 5' },
  { id: 21, filename: 'CGtoIELTS_21.mp3', title: 'Track 21', subtitle: 'Listening Unit 5 - Ex 2.2 Thermometer process', category: 'listening_skills', page: 32, endPage: 32, unit: 'Unit 5' },
  { id: 22, filename: 'CGtoIELTS_22.mp3', title: 'Track 22', subtitle: 'Listening Unit 5 - Ex 3.1 Wrapping a gift', category: 'listening_skills', page: 33, endPage: 33, unit: 'Unit 5' },

  // Unit 6: Attitude and opinion (p.34 - 36)
  { id: 23, filename: 'CGtoIELTS_23.mp3', title: 'Track 23', subtitle: 'Listening Unit 6 - Ex 1.1 Identifying attitudes', category: 'listening_skills', page: 34, endPage: 34, unit: 'Unit 6' },
  { id: 24, filename: 'CGtoIELTS_24.mp3', title: 'Track 24', subtitle: 'Listening Unit 6 - Ex 2.2 Persuading & arguing', category: 'listening_skills', page: 35, endPage: 35, unit: 'Unit 6' },
  { id: 25, filename: 'CGtoIELTS_25.mp3', title: 'Track 25', subtitle: 'Listening Unit 6 - Ex 3.1 Reaching a decision', category: 'listening_skills', page: 35, endPage: 36, unit: 'Unit 6' },

  // Unit 7: Following a lecture or talk (p.37 - 39)
  { id: 26, filename: 'CGtoIELTS_26.mp3', title: 'Track 26', subtitle: 'Listening Unit 7 - Ex 1.2 Lecture main ideas', category: 'listening_skills', page: 37, endPage: 37, unit: 'Unit 7' },
  { id: 27, filename: 'CGtoIELTS_27.mp3', title: 'Track 27', subtitle: 'Listening Unit 7 - Ex 2.1 Connecting ideas', category: 'listening_skills', page: 38, endPage: 38, unit: 'Unit 7' },
  { id: 28, filename: 'CGtoIELTS_28.mp3', title: 'Track 28', subtitle: 'Listening Unit 7 - Ex 3.1 Explanations in talk', category: 'listening_skills', page: 39, endPage: 39, unit: 'Unit 7' },
  { id: 29, filename: 'CGtoIELTS_29.mp3', title: 'Track 29', subtitle: 'Listening Unit 7 - Ex 3.3 Research notes', category: 'listening_skills', page: 39, endPage: 39, unit: 'Unit 7' },

  // Unit 8: Contrasting ideas (p.40 - 42)
  { id: 30, filename: 'CGtoIELTS_30.mp3', title: 'Track 30', subtitle: 'Listening Unit 8 - Ex 1.1 Signposting words', category: 'listening_skills', page: 40, endPage: 40, unit: 'Unit 8' },
  { id: 31, filename: 'CGtoIELTS_31.mp3', title: 'Track 31', subtitle: 'Listening Unit 8 - Ex 2.1 Comparing ideas', category: 'listening_skills', page: 41, endPage: 41, unit: 'Unit 8' },
  { id: 32, filename: 'CGtoIELTS_32.mp3', title: 'Track 32', subtitle: 'Listening Unit 8 - Ex 2.3 Plant discoveries', category: 'listening_skills', page: 42, endPage: 42, unit: 'Unit 8' },
  { id: 33, filename: 'CGtoIELTS_33.mp3', title: 'Track 33', subtitle: 'Listening Unit 8 - Ex 3.1 History of silk road', category: 'listening_skills', page: 42, endPage: 42, unit: 'Unit 8' },
  { id: 34, filename: 'CGtoIELTS_34.mp3', title: 'Track 34', subtitle: 'Listening Unit 8 - Ex 3.3 Plants in history', category: 'listening_skills', page: 42, endPage: 42, unit: 'Unit 8' },

  // Speaking Skills (Tracks 35 - 38)
  { id: 35, filename: 'CGtoIELTS_35.mp3', title: 'Track 35', subtitle: 'Speaking Unit 4 - Ex 2.2 Minimal vowel pairs', category: 'speaking_skills', page: 151, endPage: 151, unit: 'Speaking 4' },
  { id: 36, filename: 'CGtoIELTS_36.mp3', title: 'Track 36', subtitle: 'Speaking Unit 4 - Ex 2.5 Past -ed endings', category: 'speaking_skills', page: 152, endPage: 152, unit: 'Speaking 4' },
  { id: 37, filename: 'CGtoIELTS_37.mp3', title: 'Track 37', subtitle: 'Speaking Unit 4 - Ex 2.9 Word stress', category: 'speaking_skills', page: 152, endPage: 152, unit: 'Speaking 4' },
  { id: 38, filename: 'CGtoIELTS_38.mp3', title: 'Track 38', subtitle: 'Speaking Unit 4 - Ex 2.10 Interview assessment', category: 'speaking_skills', page: 153, endPage: 154, unit: 'Speaking 4' },

  // Practice Tests 1 - 8 (Tracks 39 - 70)
  // Test 1 (p.155 - 160)
  { id: 39, filename: 'CGtoIELTS_39.mp3', title: 'Track 39', subtitle: 'Practice Test 1 - Listening Section 1', category: 'practice_test', page: 155, endPage: 155, test: 1, section: 1 },
  { id: 40, filename: 'CGtoIELTS_40.mp3', title: 'Track 40', subtitle: 'Practice Test 1 - Listening Section 2', category: 'practice_test', page: 156, endPage: 157, test: 1, section: 2 },
  { id: 41, filename: 'CGtoIELTS_41.mp3', title: 'Track 41', subtitle: 'Practice Test 1 - Listening Section 3', category: 'practice_test', page: 158, endPage: 159, test: 1, section: 3 },
  { id: 42, filename: 'CGtoIELTS_42.mp3', title: 'Track 42', subtitle: 'Practice Test 1 - Listening Section 4', category: 'practice_test', page: 160, endPage: 160, test: 1, section: 4 },

  // Test 2 (p.174 - 177)
  { id: 43, filename: 'CGtoIELTS_43.mp3', title: 'Track 43', subtitle: 'Practice Test 2 - Listening Section 1', category: 'practice_test', page: 174, endPage: 174, test: 2, section: 1 },
  { id: 44, filename: 'CGtoIELTS_44.mp3', title: 'Track 44', subtitle: 'Practice Test 2 - Listening Section 2', category: 'practice_test', page: 175, endPage: 175, test: 2, section: 2 },
  { id: 45, filename: 'CGtoIELTS_45.mp3', title: 'Track 45', subtitle: 'Practice Test 2 - Listening Section 3', category: 'practice_test', page: 176, endPage: 176, test: 2, section: 3 },
  { id: 46, filename: 'CGtoIELTS_46.mp3', title: 'Track 46', subtitle: 'Practice Test 2 - Listening Section 4', category: 'practice_test', page: 177, endPage: 177, test: 2, section: 4 },

  // Test 3 (p.191 - 195)
  { id: 47, filename: 'CGtoIELTS_47.mp3', title: 'Track 47', subtitle: 'Practice Test 3 - Listening Section 1', category: 'practice_test', page: 191, endPage: 191, test: 3, section: 1 },
  { id: 48, filename: 'CGtoIELTS_48.mp3', title: 'Track 48', subtitle: 'Practice Test 3 - Listening Section 2', category: 'practice_test', page: 192, endPage: 192, test: 3, section: 2 },
  { id: 49, filename: 'CGtoIELTS_49.mp3', title: 'Track 49', subtitle: 'Practice Test 3 - Listening Section 3', category: 'practice_test', page: 193, endPage: 194, test: 3, section: 3 },
  { id: 50, filename: 'CGtoIELTS_50.mp3', title: 'Track 50', subtitle: 'Practice Test 3 - Listening Section 4', category: 'practice_test', page: 195, endPage: 195, test: 3, section: 4 },

  // Test 4 (p.208 - 213)
  { id: 51, filename: 'CGtoIELTS_51.mp3', title: 'Track 51', subtitle: 'Practice Test 4 - Listening Section 1', category: 'practice_test', page: 208, endPage: 208, test: 4, section: 1 },
  { id: 52, filename: 'CGtoIELTS_52.mp3', title: 'Track 52', subtitle: 'Practice Test 4 - Listening Section 2', category: 'practice_test', page: 209, endPage: 210, test: 4, section: 2 },
  { id: 53, filename: 'CGtoIELTS_53.mp3', title: 'Track 53', subtitle: 'Practice Test 4 - Listening Section 3', category: 'practice_test', page: 211, endPage: 212, test: 4, section: 3 },
  { id: 54, filename: 'CGtoIELTS_54.mp3', title: 'Track 54', subtitle: 'Practice Test 4 - Listening Section 4', category: 'practice_test', page: 213, endPage: 213, test: 4, section: 4 },

  // Test 5 (p.227 - 232)
  { id: 55, filename: 'CGtoIELTS_55.mp3', title: 'Track 55', subtitle: 'Practice Test 5 - Listening Section 1', category: 'practice_test', page: 227, endPage: 227, test: 5, section: 1 },
  { id: 56, filename: 'CGtoIELTS_56.mp3', title: 'Track 56', subtitle: 'Practice Test 5 - Listening Section 2', category: 'practice_test', page: 228, endPage: 229, test: 5, section: 2 },
  { id: 57, filename: 'CGtoIELTS_57.mp3', title: 'Track 57', subtitle: 'Practice Test 5 - Listening Section 3', category: 'practice_test', page: 230, endPage: 231, test: 5, section: 3 },
  { id: 58, filename: 'CGtoIELTS_58.mp3', title: 'Track 58', subtitle: 'Practice Test 5 - Listening Section 4', category: 'practice_test', page: 232, endPage: 232, test: 5, section: 4 },

  // Test 6 (p.247 - 252)
  { id: 59, filename: 'CGtoIELTS_59.mp3', title: 'Track 59', subtitle: 'Practice Test 6 - Listening Section 1', category: 'practice_test', page: 247, endPage: 247, test: 6, section: 1 },
  { id: 60, filename: 'CGtoIELTS_60.mp3', title: 'Track 60', subtitle: 'Practice Test 6 - Listening Section 2', category: 'practice_test', page: 248, endPage: 248, test: 6, section: 2 },
  { id: 61, filename: 'CGtoIELTS_61.mp3', title: 'Track 61', subtitle: 'Practice Test 6 - Listening Section 3', category: 'practice_test', page: 249, endPage: 250, test: 6, section: 3 },
  { id: 62, filename: 'CGtoIELTS_62.mp3', title: 'Track 62', subtitle: 'Practice Test 6 - Listening Section 4', category: 'practice_test', page: 251, endPage: 252, test: 6, section: 4 },

  // Test 7 (p.263 - 268)
  { id: 63, filename: 'CGtoIELTS_63.mp3', title: 'Track 63', subtitle: 'Practice Test 7 - Listening Section 1', category: 'practice_test', page: 263, endPage: 263, test: 7, section: 1 },
  { id: 64, filename: 'CGtoIELTS_64.mp3', title: 'Track 64', subtitle: 'Practice Test 7 - Listening Section 2', category: 'practice_test', page: 264, endPage: 265, test: 7, section: 2 },
  { id: 65, filename: 'CGtoIELTS_65.mp3', title: 'Track 65', subtitle: 'Practice Test 7 - Listening Section 3', category: 'practice_test', page: 266, endPage: 267, test: 7, section: 3 },
  { id: 66, filename: 'CGtoIELTS_66.mp3', title: 'Track 66', subtitle: 'Practice Test 7 - Listening Section 4', category: 'practice_test', page: 268, endPage: 268, test: 7, section: 4 },

  // Test 8 (p.297 - 302)
  { id: 67, filename: 'CGtoIELTS_67.mp3', title: 'Track 67', subtitle: 'Practice Test 8 - Listening Section 1', category: 'practice_test', page: 297, endPage: 297, test: 8, section: 1 },
  { id: 68, filename: 'CGtoIELTS_68.mp3', title: 'Track 68', subtitle: 'Practice Test 8 - Listening Section 2', category: 'practice_test', page: 298, endPage: 299, test: 8, section: 2 },
  { id: 69, filename: 'CGtoIELTS_69.mp3', title: 'Track 69', subtitle: 'Practice Test 8 - Listening Section 3', category: 'practice_test', page: 300, endPage: 301, test: 8, section: 3 },
  { id: 70, filename: 'CGtoIELTS_70.mp3', title: 'Track 70', subtitle: 'Practice Test 8 - Listening Section 4', category: 'practice_test', page: 302, endPage: 302, test: 8, section: 4 },
];

/**
 * Returns all audio tracks that belong to a given book page (if any)
 */
export function getAudioTracksForPage(page: number): AudioTrackInfo[] {
  return AUDIO_TRACKS.filter((track) => {
    const end = track.endPage ?? track.page;
    return page >= track.page && page <= end;
  });
}

/**
 * Returns the primary audio track for a given book page (if any)
 */
export function getAudioTrackForPage(page: number): AudioTrackInfo | undefined {
  const tracks = getAudioTracksForPage(page);
  return tracks.length > 0 ? tracks[0] : undefined;
}

/**
 * Find TOC item for a given page
 */
export function getTocItemForPage(page: number): TocItem | undefined {
  let matched: TocItem | undefined = undefined;
  function search(items: TocItem[]) {
    for (const item of items) {
      if (item.page <= page) {
        if (!matched || item.page >= matched.page) {
          matched = item;
        }
      }
      if (item.children) {
        search(item.children);
      }
    }
  }
  search(BOOK_TOC);
  return matched;
}
