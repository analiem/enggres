// ─── TYPES ────────────────────────────────────────────────────────────────────

export type TestId = 'TOEFL_IBT' | 'TOEFL_ITP' | 'TOEIC'
export type QuizMode = 'section' | 'full'

export interface Question {
  section: string
  passage: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface ScoreLevel {
  min: number
  max: number
  grade: string
  label: string
  color: string
  desc: string
}

export interface ScoreConfig {
  label: string
  min: number
  max: number
  calc: (pct: number) => number
  levels: ScoreLevel[]
}

export interface SimSection {
  name: string
  count: number
}

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

export const SECTIONS: Record<TestId, string[]> = {
  TOEFL_IBT: ['Reading', 'Listening', 'Speaking', 'Writing', 'Grammar & Vocabulary'],
  TOEFL_ITP: [
    'Listening Comprehension',
    'Structure & Written Expression',
    'Reading Comprehension',
    'Vocabulary',
  ],
  TOEIC: [
    'Reading Comprehension',
    'Listening',
    'Grammar',
    'Vocabulary',
    'Error Recognition',
  ],
}

// ─── SCORE CONFIGS ────────────────────────────────────────────────────────────

export const SCORE_CONFIG: Record<TestId, ScoreConfig> = {
  TOEFL_IBT: {
    label: 'TOEFL iBT',
    min: 0,
    max: 120,
    calc: (pct) => Math.round(pct * 1.2),
    levels: [
      { min: 114, max: 120, grade: 'C2',   label: 'Mastery',            color: '#0f6e56', desc: 'Sangat fasih — setara native speaker' },
      { min: 95,  max: 113, grade: 'C1',   label: 'Advanced',           color: '#185FA5', desc: 'Skor kuat untuk universitas top dunia (Harvard, Oxford, dll)' },
      { min: 72,  max: 94,  grade: 'B2',   label: 'Upper-Intermediate', color: '#1a56db', desc: 'Diterima kebanyakan universitas internasional' },
      { min: 42,  max: 71,  grade: 'B1',   label: 'Intermediate',       color: '#a85514', desc: 'Perlu peningkatan untuk keperluan akademis' },
      { min: 0,   max: 41,  grade: 'A2–',  label: 'Elementary',         color: '#a32d2d', desc: 'Perlu latihan intensif' },
    ],
  },
  TOEFL_ITP: {
    label: 'TOEFL ITP',
    min: 310,
    max: 677,
    calc: (pct) => Math.round(310 + pct * 3.67),
    levels: [
      { min: 627, max: 677, grade: 'C1',  label: 'Advanced',           color: '#0f6e56', desc: 'Sangat kuat untuk akademis dan beasiswa' },
      { min: 550, max: 626, grade: 'B2+', label: 'Upper-Intermediate', color: '#185FA5', desc: 'Kuat untuk keperluan akademis (>550 dianggap kuat)' },
      { min: 480, max: 549, grade: 'B2',  label: 'Intermediate-High',  color: '#1a56db', desc: 'Cukup untuk sebagian besar program' },
      { min: 420, max: 479, grade: 'B1',  label: 'Intermediate',       color: '#a85514', desc: 'Perlu ditingkatkan untuk keperluan akademis' },
      { min: 310, max: 419, grade: 'A2',  label: 'Elementary',         color: '#a32d2d', desc: 'Perlu latihan intensif' },
    ],
  },
  TOEIC: {
    label: 'TOEIC L&R',
    min: 10,
    max: 990,
    // Each section scored 5–495, total 10–990
    calc: (pct) => {
      const perSection = Math.round(5 + pct * 4.9) // 5–495 per section
      return Math.min(990, perSection * 2)
    },
    levels: [
      { min: 905, max: 990, grade: 'C1', label: 'Proficient',       color: '#0f6e56', desc: 'Sangat fasih — setara level profesional internasional (C1)' },
      { min: 785, max: 904, grade: 'B2', label: 'Advanced Working', color: '#185FA5', desc: 'Mampu berkomunikasi bisnis secara efektif' },
      { min: 605, max: 784, grade: 'B1', label: 'Intermediate',     color: '#1a56db', desc: 'Dapat bekerja dalam lingkungan berbahasa Inggris' },
      { min: 405, max: 604, grade: 'A2', label: 'Elementary',       color: '#a85514', desc: 'Kemampuan dasar, perlu peningkatan' },
      { min: 10,  max: 404, grade: 'A1', label: 'Beginner',         color: '#a32d2d', desc: 'Perlu latihan intensif' },
    ],
  },
}

// ─── SIMULATION CONFIGS ───────────────────────────────────────────────────────

export type SimMode = 'full' | 'mini'

export interface SimVariant {
  mode: SimMode
  label: string
  desc: string
  totalTime: number   // minutes
  sections: SimSection[]
}

export const SIM_CONFIG: Record<TestId, { full: SimVariant; mini: SimVariant }> = {
  TOEFL_IBT: {
    full: {
      mode: 'full',
      label: 'Simulasi Penuh',
      desc: '3 section · 72 soal · 118 menit',
      totalTime: 118,
      sections: [
        // Reading: 2 passage × 10 soal = 20
        { name: 'Reading',    count: 20 },
        // Listening: 28 soal (2 percakapan + 3 kuliah, ~5-6 soal tiap)
        { name: 'Listening',  count: 28 },
        // Writing: 2 tugas dalam format pilihan ganda simulasi
        { name: 'Writing',    count: 12 },
        // Speaking: 4 tugas simulasi pilihan ganda
        { name: 'Speaking',   count: 12 },
      ],
    },
    mini: {
      mode: 'mini',
      label: 'Simulasi Mini (50%)',
      desc: '3 section · 36 soal · 60 menit',
      totalTime: 60,
      sections: [
        { name: 'Reading',    count: 10 },
        { name: 'Listening',  count: 14 },
        { name: 'Writing',    count: 6  },
        { name: 'Speaking',   count: 6  },
      ],
    },
  },

  TOEFL_ITP: {
    full: {
      mode: 'full',
      label: 'Simulasi Penuh',
      desc: '3 section · 140 soal · 115 menit',
      totalTime: 115,
      sections: [
        // Listening Comprehension: 50 soal, 35 menit
        { name: 'Listening Comprehension',        count: 50 },
        // Structure & Written Expression: 40 soal, 25 menit
        { name: 'Structure & Written Expression', count: 40 },
        // Reading Comprehension: 50 soal, 55 menit
        { name: 'Reading Comprehension',          count: 50 },
      ],
    },
    mini: {
      mode: 'mini',
      label: 'Simulasi Mini (50%)',
      desc: '3 section · 70 soal · 57 menit',
      totalTime: 57,
      sections: [
        { name: 'Listening Comprehension',        count: 25 },
        { name: 'Structure & Written Expression', count: 20 },
        { name: 'Reading Comprehension',          count: 25 },
      ],
    },
  },

  TOEIC: {
    full: {
      mode: 'full',
      label: 'Simulasi Penuh',
      desc: '2 section · 200 soal · 120 menit',
      totalTime: 120,
      sections: [
        // Part 1-4: Photographs, Q&R, Conv, Talks = 100 soal Listening
        { name: 'Listening (Part 1–4)',                   count: 100 },
        // Part 5-7: Incomplete, Error, Reading = 100 soal Reading
        { name: 'Reading & Grammar (Part 5–7)',           count: 100 },
      ],
    },
    mini: {
      mode: 'mini',
      label: 'Simulasi Mini (50%)',
      desc: '2 section · 100 soal · 60 menit',
      totalTime: 60,
      sections: [
        { name: 'Listening (Part 1–4)',           count: 50 },
        { name: 'Reading & Grammar (Part 5–7)',   count: 50 },
      ],
    },
  },
}

// Legacy flat accessor used by useQuiz — resolved at runtime based on simVariant
export function getSimVariant(test: TestId, mode: SimMode): SimVariant {
  return SIM_CONFIG[test][mode]
}


// ─── FONT OPTIONS ─────────────────────────────────────────────────────────────

export interface FontOption {
  name: string
  label: string
  bodyFamily: string
  displayFamily: string
  desc: string
  googleParam: string
}

export const FONT_OPTIONS: FontOption[] = [
  { name: 'dm-sans',      label: 'DM Sans',       bodyFamily: "'DM Sans', sans-serif",         displayFamily: "'DM Serif Display', serif",   desc: 'Modern · Clean',       googleParam: 'DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display' },
  { name: 'outfit',       label: 'Outfit',         bodyFamily: "'Outfit', sans-serif",          displayFamily: "'Playfair Display', serif",   desc: 'Geometric · Friendly', googleParam: 'Outfit:wght@300;400;500&family=Playfair+Display:wght@400;500' },
  { name: 'figtree',      label: 'Figtree',        bodyFamily: "'Figtree', sans-serif",         displayFamily: "'DM Serif Display', serif",   desc: 'Rounded · Soft',       googleParam: 'Figtree:wght@300;400;500&family=DM+Serif+Display' },
  { name: 'plus-jakarta', label: 'Plus Jakarta',   bodyFamily: "'Plus Jakarta Sans', sans-serif", displayFamily: "'Fraunces', serif",          desc: 'Elegant · Balanced',   googleParam: 'Plus+Jakarta+Sans:wght@300;400;500&family=Fraunces:opsz,wght@9..144,300;9..144,400' },
  { name: 'ibm-mono',     label: 'IBM Mono',       bodyFamily: "'IBM Plex Mono', monospace",    displayFamily: "'Syne', sans-serif",          desc: 'Mono · Techy',         googleParam: 'IBM+Plex+Mono:wght@300;400;500&family=Syne:wght@400;500;700' },
  { name: 'literata',     label: 'Literata',       bodyFamily: "'Literata', serif",             displayFamily: "'Syne', sans-serif",          desc: 'Editorial · Reading',  googleParam: 'Literata:opsz,wght@7..72,300;7..72,400&family=Syne:wght@400;500' },
  { name: 'nunito',       label: 'Nunito',         bodyFamily: "'Nunito', sans-serif",          displayFamily: "'Playfair Display', serif",   desc: 'Bubbly · Friendly',    googleParam: 'Nunito:wght@300;400;500&family=Playfair+Display:wght@400;500' },
  { name: 'lora',         label: 'Lora',           bodyFamily: "'Lora', serif",                 displayFamily: "'Syne', sans-serif",          desc: 'Classic · Serif',      googleParam: 'Lora:wght@400;500&family=Syne:wght@400;500' },
  { name: 'poppins',      label: 'Poppins',        bodyFamily: "'Poppins', sans-serif",         displayFamily: "'DM Serif Display', serif",   desc: 'Popular · Versatile',  googleParam: 'Poppins:wght@300;400;500&family=DM+Serif+Display' },
  { name: 'source-sans',  label: 'Source Sans 3',  bodyFamily: "'Source Sans 3', sans-serif",  displayFamily: "'Fraunces', serif",           desc: 'Neutral · Readable',   googleParam: 'Source+Sans+3:wght@300;400;500&family=Fraunces:opsz,wght@9..144,300;9..144,400' },
]

// ─── SECTION INSTRUCTIONS ─────────────────────────────────────────────────────

export const SECTION_INSTRUCTIONS: Record<string, string> = {
  'Error Recognition':
    'For Error Recognition: write a complete sentence where exactly 4 parts are labeled (A), (B), (C), (D). One part has a grammatical error. Options must be exactly ["A", "B", "C", "D"]. Answer is 0-based index of the wrong part.',
  'Grammar':
    'For Grammar: sentence-completion style. Provide a sentence with a blank and 4 grammatically-focused options.',
  'Grammar & Vocabulary':
    'For Grammar & Vocabulary: mix 50% sentence completion and 50% vocabulary-in-context questions.',
  'Structure & Written Expression':
    'For Structure & Written Expression: mix sentence completion and underlined-error identification.',
  'Incomplete Sentences':
    'For Incomplete Sentences: provide a sentence with a blank and 4 options to complete it.',
  'Writing':
    'For Writing: provide a short writing prompt or sentence-improvement question with 4 options.',
}
