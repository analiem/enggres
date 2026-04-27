'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { TestId, QuizMode, Question } from '@/lib/config'

// ─── STATE ────────────────────────────────────────────────────────────────────

export interface AppState {
  // Settings
  apiKey: string
  theme: 'light' | 'dark'
  fontIndex: number

  // Selection
  selectedTest: TestId | null
  selectedSection: string
  quizMode: QuizMode | null
  simVariant: 'full' | 'mini'
  questionCount: number

  // Quiz
  screen: 'home' | 'loading' | 'quiz' | 'result'
  questions: Question[]
  currentQ: number
  answers: { correct: boolean; section: string }[]
  timeLeft: number
  startTime: number
  loadingMessage: string

  // TTS
  ttsPlaying: boolean
  ttsUnlocked: boolean
}

const initialState: AppState = {
  apiKey: '',
  theme: 'light',
  fontIndex: 0,
  selectedTest: null,
  selectedSection: '',
  quizMode: null,
  simVariant: 'full',
  questionCount: 5,
  screen: 'home',
  questions: [],
  currentQ: 0,
  answers: [],
  timeLeft: 0,
  startTime: 0,
  loadingMessage: 'AI sedang membuat soal...',
  ttsPlaying: false,
  ttsUnlocked: false,
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_FONT'; payload: number }
  | { type: 'SELECT_TEST'; payload: TestId }
  | { type: 'SELECT_MODE'; payload: QuizMode }
  | { type: 'SET_SIM_VARIANT'; payload: 'full' | 'mini' }
  | { type: 'SELECT_SECTION'; payload: string }
  | { type: 'SELECT_COUNT'; payload: number }
  | { type: 'SET_SCREEN'; payload: AppState['screen'] }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_LOADING_MSG'; payload: string }
  | { type: 'START_QUIZ'; payload: { questions: Question[]; timeLeft: number } }
  | { type: 'ANSWER'; payload: { correct: boolean; section: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'TICK_TIMER' }
  | { type: 'SET_TTS'; payload: { playing: boolean; unlocked?: boolean } }
  | { type: 'RESET_HOME' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_FONT':
      return { ...state, fontIndex: action.payload }
    case 'SELECT_TEST':
      return { ...state, selectedTest: action.payload, selectedSection: '', quizMode: null }
    case 'SELECT_MODE':
      return { ...state, quizMode: action.payload, selectedSection: '' }
    case 'SET_SIM_VARIANT':
      return { ...state, simVariant: action.payload }
    case 'SELECT_SECTION':
      return { ...state, selectedSection: action.payload }
    case 'SELECT_COUNT':
      return { ...state, questionCount: action.payload }
    case 'SET_SCREEN':
      return { ...state, screen: action.payload }
    case 'SET_LOADING_MSG':
      return { ...state, loadingMessage: action.payload }
    case 'START_QUIZ':
      return {
        ...state,
        questions: action.payload.questions,
        timeLeft: action.payload.timeLeft,
        startTime: Date.now(),
        currentQ: 0,
        answers: [],
        screen: 'quiz',
      }
    case 'ANSWER':
      return { ...state, answers: [...state.answers, action.payload] }
    case 'NEXT_QUESTION':
      return { ...state, currentQ: state.currentQ + 1 }
    case 'TICK_TIMER':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) }
    case 'SET_TTS':
      return {
        ...state,
        ttsPlaying: action.payload.playing,
        ttsUnlocked: action.payload.unlocked ?? state.ttsUnlocked,
      }
    case 'RESET_HOME':
      return {
        ...initialState,
        apiKey: state.apiKey,
        theme: state.theme,
        fontIndex: state.fontIndex,
      }
    default:
      return state
  }
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
