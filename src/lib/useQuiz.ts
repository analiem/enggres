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

  // ── Generate questions (base) ─────────────────────────────────────────────

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

  // ── Delay helper ─────────────────────────────────────────────────────────

  const delayWithCountdown = useCallback(
    async (seconds: number) => {
      for (let i = seconds; i > 0; i--) {
        dispatch({ type: 'SET_LOADING_COUNTDOWN', payload: i })
        await new Promise((r) => setTimeout(r, 1000))
      }
      dispatch({ type: 'SET_LOADING_COUNTDOWN', payload: 0 })
    },
    [dispatch]
  )

  // ── Generate with auto-retry on rate limit ────────────────────────────────

  const generateWithRetry = useCallback(
    async (testLabel: string, section: string, count: number, attempt = 1): Promise<Question[]> => {
      try {
        return await generateQuestions(testLabel, section, count)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        const isRateLimit = msg.toLowerCase().includes('rate') || msg.includes('429') || msg.includes('TPM')
        if (isRateLimit && attempt <= 4) {
          dispatch({
            type: 'SET_LOADING_PROGRESS',
            payload: { done: -1, total: -1, message: `Rate limit — auto retry ${attempt}/4...` },
          })
          await delayWithCountdown(40)
          return generateWithRetry(testLabel, section, count, attempt + 1)
        }
        throw err
      }
    },
    [generateQuestions, dispatch, delayWithCountdown]
  )

  // ── Start quiz ────────────────────────────────────────────────────────────

  const startQuiz = useCallback(async () => {
    if (!state.selectedTest) return
    dispatch({ type: 'SET_SCREEN', payload: 'loading' })
    const cfg = SCORE_CONFIG[state.selectedTest]
    const allQuestions: Question[] = []
    const BATCH_SIZE = 5   // smaller batch = smaller output = no JSON truncation
    const DELAY_SECS = 20  // ~3 batch/min = ~4500 TPM (37% of limit, very safe)

    try {
      if (state.quizMode === 'full') {
        const variant = getSimVariant(state.selectedTest, state.simVariant)
        const secs = variant.sections

        const totalBatches = secs.reduce(
          (acc, s) => acc + Math.ceil(s.count / BATCH_SIZE),
          0
        )
        let batchesDone = 0

        for (let si = 0; si < secs.length; si++) {
          const sec = secs[si]
          const numBatches = Math.ceil(sec.count / BATCH_SIZE)

          for (let b = 0; b < numBatches; b++) {
            const offset = b * BATCH_SIZE
            const batchCount = Math.min(BATCH_SIZE, sec.count - offset)

            dispatch({
              type: 'SET_LOADING_PROGRESS',
              payload: {
                done: batchesDone,
                total: totalBatches,
                message: `Section ${si + 1}/${secs.length}: ${sec.name} — soal ${offset + 1}–${offset + batchCount}`,
              },
            })

            const qs = await generateWithRetry(cfg.label, sec.name, batchCount)
            allQuestions.push(...qs)
            batchesDone++

            dispatch({
              type: 'SET_LOADING_PROGRESS',
              payload: {
                done: batchesDone,
                total: totalBatches,
                message: `Section ${si + 1}/${secs.length}: ${sec.name} — soal ${offset + 1}–${offset + batchCount}`,
              },
            })

            // Cooldown between batches — skip after last batch
            if (batchesDone < totalBatches) {
              await delayWithCountdown(DELAY_SECS)
            }
          }
        }

        dispatch({
          type: 'START_QUIZ',
          payload: { questions: allQuestions, timeLeft: variant.totalTime * 60 },
        })
      } else {
        dispatch({
          type: 'SET_LOADING_PROGRESS',
          payload: { done: 0, total: 1, message: 'AI sedang membuat soal...' },
        })
        const qs = await generateWithRetry(cfg.label, state.selectedSection, state.questionCount)
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
  }, [state, dispatch, generateWithRetry, startTimer, delayWithCountdown])

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
