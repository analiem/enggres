'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { SCORE_CONFIG, getSimVariant, Question } from '@/lib/config'

export function useQuiz() {
  const { state, dispatch } = useApp()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null)

  // ── Timer ────────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' })
    }, 1000)
  }, [dispatch, stopTimer])

  // End when time runs out
  useEffect(() => {
    if (state.screen === 'quiz' && state.timeLeft === 0) {
      stopTimer()
      dispatch({ type: 'SET_SCREEN', payload: 'result' })
    }
  }, [state.screen, state.timeLeft, dispatch, stopTimer])

  // Cleanup on unmount
  useEffect(() => () => stopTimer(), [stopTimer])

  // ── TTS ──────────────────────────────────────────────────────────────────

  const ttsStop = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    dispatch({ type: 'SET_TTS', payload: { playing: false } })
  }, [dispatch])

  const ttsPlay = useCallback(
    (text: string, rate: number = 0.9) => {
      ttsStop()
      if (typeof window === 'undefined') return
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = rate

      // Prefer Google US English voice
      const voices = window.speechSynthesis.getVoices()
      const voice =
        voices.find((v) => v.lang === 'en-US' && v.name.includes('Google')) ||
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en'))
      if (voice) utterance.voice = voice

      utterance.onstart = () =>
        dispatch({ type: 'SET_TTS', payload: { playing: true } })
      utterance.onend = () => {
        dispatch({ type: 'SET_TTS', payload: { playing: false, unlocked: true } })
      }
      utterance.onerror = () => {
        dispatch({ type: 'SET_TTS', payload: { playing: false, unlocked: true } })
      }

      ttsRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [dispatch, ttsStop]
  )

  // ── Generate questions ────────────────────────────────────────────────────

  const generateQuestions = useCallback(
    async (testLabel: string, section: string, count: number): Promise<Question[]> => {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: state.apiKey, testLabel, section, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'API error')
      return data.questions as Question[]
    },
    [state.apiKey]
  )

  // ── Start quiz ────────────────────────────────────────────────────────────

  const startQuiz = useCallback(async () => {
    if (!state.selectedTest) return
    dispatch({ type: 'SET_SCREEN', payload: 'loading' })
    const cfg = SCORE_CONFIG[state.selectedTest]
    const allQuestions: Question[] = []

    try {
      if (state.quizMode === 'full') {
        const variant = getSimVariant(state.selectedTest, state.simVariant)
        const secs = variant.sections
        for (let i = 0; i < secs.length; i++) {
          const sec = secs[i]
          dispatch({
            type: 'SET_LOADING_MSG',
            payload: `Section ${i + 1}/${secs.length}: ${sec.name} (${sec.count} soal)...`,
          })
          // Split large sections into batches of 25 to stay within token limits
          const batchSize = 25
          for (let offset = 0; offset < sec.count; offset += batchSize) {
            const batchCount = Math.min(batchSize, sec.count - offset)
            dispatch({
              type: 'SET_LOADING_MSG',
              payload: `Section ${i + 1}/${secs.length}: ${sec.name} — soal ${offset + 1}–${offset + batchCount}...`,
            })
            const qs = await generateQuestions(cfg.label, sec.name, batchCount)
            allQuestions.push(...qs)
          }
        }
        dispatch({
          type: 'START_QUIZ',
          payload: { questions: allQuestions, timeLeft: variant.totalTime * 60 },
        })
      } else {
        dispatch({ type: 'SET_LOADING_MSG', payload: 'AI sedang membuat soal...' })
        const qs = await generateQuestions(cfg.label, state.selectedSection, state.questionCount)
        dispatch({
          type: 'START_QUIZ',
          payload: { questions: qs, timeLeft: state.questionCount * 120 },
        })
      }
      startTimer()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      dispatch({ type: 'SET_SCREEN', payload: 'home' })
      alert(`Gagal membuat soal: ${msg}\n\nPastikan Groq API key valid dan coba lagi.`)
    }
  }, [state, dispatch, generateQuestions, startTimer])

  // ── Answer & navigate ─────────────────────────────────────────────────────

  const submitAnswer = useCallback(
    (idx: number) => {
      const q = state.questions[state.currentQ]
      dispatch({
        type: 'ANSWER',
        payload: { correct: idx === q.answer, section: q.section },
      })
    },
    [state.questions, state.currentQ, dispatch]
  )

  const nextQuestion = useCallback(() => {
    ttsStop()
    if (state.currentQ + 1 >= state.questions.length) {
      stopTimer()
      dispatch({ type: 'SET_SCREEN', payload: 'result' })
    } else {
      dispatch({ type: 'NEXT_QUESTION' })
    }
  }, [state.currentQ, state.questions.length, dispatch, ttsStop, stopTimer])

  const goHome = useCallback(() => {
    stopTimer()
    ttsStop()
    dispatch({ type: 'RESET_HOME' })
  }, [dispatch, stopTimer, ttsStop])

  // ── Compute score ─────────────────────────────────────────────────────────

  const computeScore = useCallback(() => {
    if (!state.selectedTest) return null
    const cfg = SCORE_CONFIG[state.selectedTest]
    const correct = state.answers.filter((a) => a.correct).length
    const total = state.answers.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const raw = cfg.calc(pct)
    const score = Math.max(cfg.min, Math.min(cfg.max, raw))
    const level = cfg.levels.find((l) => score >= l.min && score <= l.max) ?? cfg.levels[cfg.levels.length - 1]
    const barPct = Math.round(((score - cfg.min) / (cfg.max - cfg.min)) * 100)
    const elapsed = Math.round((Date.now() - state.startTime) / 1000)
    return { cfg, correct, total, pct, score, level, barPct, elapsed }
  }, [state])

  return { startQuiz, submitAnswer, nextQuestion, goHome, computeScore, ttsPlay, ttsStop, startTimer, stopTimer }
}
