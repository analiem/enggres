'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { useQuiz } from '@/lib/useQuiz'
import { getSimVariant } from '@/lib/config'

export function QuizScreen() {
  const { state } = useApp()
  const { submitAnswer, nextQuestion, ttsPlay, ttsStop } = useQuiz()
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [ttsRate, setTtsRate] = useState(0.9)

  const q = state.questions[state.currentQ]

  // Reset per question
  useEffect(() => {
    setAnswered(false)
    setChosen(null)
  }, [state.currentQ])

  const isListening = q?.section === 'Listening' || q?.section === 'Listening Comprehension'
  const isErrRec = q?.section === 'Error Recognition'

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return
    setAnswered(true)
    setChosen(idx)
    submitAnswer(idx)
  }, [answered, submitAnswer])

  const handleNext = () => {
    ttsStop()
    nextQuestion()
  }

  // Timer display
  const mins = Math.floor(state.timeLeft / 60)
  const secs = state.timeLeft % 60
  const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const urgent = state.timeLeft < 60

  // Section label for sim mode
  let simLabel = ''
  if (state.quizMode === 'full' && state.selectedTest) {
    const variant = getSimVariant(state.selectedTest, state.simVariant)
    let cum = 0
    for (let i = 0; i < variant.sections.length; i++) {
      cum += variant.sections[i].count
      if (state.currentQ < cum) {
        simLabel = `Section ${i + 1}/${variant.sections.length}: ${variant.sections[i].name}`
        break
      }
    }
  }

  const pct = (state.currentQ / state.questions.length) * 100

  if (!q) return null

  return (
    <div>
      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>
          Soal {state.currentQ + 1} dari {state.questions.length}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 500, padding: '4px 14px', borderRadius: 20,
          border: `1px solid ${urgent ? 'var(--danger)' : 'var(--border)'}`,
          background: urgent ? 'var(--danger-bg)' : 'var(--bg2)',
          color: urgent ? 'var(--danger)' : 'var(--text)',
        }}>
          {timerStr}
        </span>
      </div>

      {/* Progress */}
      <div className="progress-track" style={{ marginBottom: '1.5rem' }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Card */}
      <div className="card">
        {/* Sim section label */}
        {simLabel && (
          <div style={{
            display: 'inline-block', fontSize: 12, fontWeight: 500,
            color: 'var(--accent-tx)', background: 'var(--accent-bg)',
            padding: '4px 12px', borderRadius: 20, marginBottom: '0.75rem',
          }}>
            {simLabel}
          </div>
        )}

        {/* Section tag */}
        <div style={{
          fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--accent-tx)', marginBottom: 10,
        }}>
          {q.section}
        </div>

        {/* Listening TTS box */}
        {isListening && q.passage && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '.75rem' }}>
              🎧 Dengarkan audio terlebih dahulu
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {!state.ttsPlaying ? (
                <button
                  onClick={() => ttsPlay(q.passage, ttsRate)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 20,
                    border: '1px solid var(--accent)', background: 'var(--accent-bg)',
                    color: 'var(--accent-tx)', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ▶ {state.ttsUnlocked ? 'Putar Ulang' : 'Putar Audio'}
                </button>
              ) : (
                <button
                  onClick={ttsStop}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 20,
                    border: '1px solid var(--accent)', background: 'var(--accent)',
                    color: '#fff', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ⏹ Stop
                </button>
              )}
              <select
                value={ttsRate}
                onChange={(e) => setTtsRate(Number(e.target.value))}
                style={{
                  padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  color: 'var(--text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <option value={0.7}>Lambat</option>
                <option value={0.9}>Normal</option>
                <option value={1.1}>Cepat</option>
              </select>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              {state.ttsPlaying
                ? 'Sedang memutar audio...'
                : state.ttsUnlocked
                ? 'Audio selesai — sekarang jawab pertanyaannya'
                : 'Putar audio sebelum menjawab soal'}
            </div>
          </div>
        )}

        {/* Passage (non-listening) */}
        {q.passage && !isListening && (
          <div className="passage-box" style={{ marginBottom: '1rem' }}>
            {q.passage}
          </div>
        )}

        {/* Question area — locked until audio played for listening */}
        <div className={isListening && q.passage && !state.ttsUnlocked ? 'q-locked' : ''}>
          {isListening && q.passage && !state.ttsUnlocked && (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginBottom: '1rem', fontStyle: 'italic' }}>
              ▲ Putar audio dulu untuk membuka soal
            </div>
          )}

          <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            {q.question}
          </div>

          {/* Options */}
          <div style={{
            display: isErrRec ? 'grid' : 'flex',
            gridTemplateColumns: isErrRec ? '1fr 1fr' : undefined,
            flexDirection: isErrRec ? undefined : 'column',
            gap: 8, marginBottom: '1.25rem',
          }}>
            {q.options.map((opt, i) => {
              const isCorrect = answered && i === q.answer
              const isWrong = answered && i === chosen && i !== q.answer
              return (
                <button
                  key={i}
                  className={`opt-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  style={isErrRec ? { justifyContent: 'center', fontSize: 16, fontWeight: 500 } : {}}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div style={{
              fontSize: 13, color: 'var(--text2)', lineHeight: 1.65,
              padding: '.875rem 1rem', background: 'var(--bg2)',
              borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem',
            }}>
              <strong style={{ color: 'var(--text)' }}>Penjelasan:</strong>{' '}
              {q.explanation}
            </div>
          )}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!answered}
          style={{
            width: '100%', padding: 11, borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border2)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: 14, fontWeight: 500,
            cursor: answered ? 'pointer' : 'not-allowed',
            opacity: answered ? 1 : 0.4,
            fontFamily: 'inherit', transition: 'all 0.18s ease',
          }}
        >
          {!answered
            ? 'Jawab dulu untuk lanjut'
            : state.currentQ < state.questions.length - 1
            ? 'Soal berikutnya →'
            : 'Lihat hasil →'}
        </button>
      </div>
    </div>
  )
}
