'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { FONT_OPTIONS } from '@/lib/config'
import { Topbar, SettingsDrawer } from '@/components/Topbar'
import { HomeScreen } from '@/components/HomeScreen'
import { QuizScreen } from '@/components/QuizScreen'
import { ResultScreen } from '@/components/ResultScreen'
import { Footer } from '@/components/Footer'

export default function Page() {
  const { state, dispatch } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Restore preferences from localStorage on mount
  useEffect(() => {
    const key   = localStorage.getItem('groq_key')
    const theme = (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
    const font  = parseInt(localStorage.getItem('font') ?? '0')

    if (key)   dispatch({ type: 'SET_API_KEY', payload: key })
    if (theme) dispatch({ type: 'SET_THEME', payload: theme })
    if (!isNaN(font)) dispatch({ type: 'SET_FONT', payload: font })

    document.documentElement.classList.toggle('dark', theme === 'dark')

    const f = FONT_OPTIONS[font] ?? FONT_OPTIONS[0]
    document.documentElement.style.setProperty('--font-body', f.bodyFamily)
    document.documentElement.style.setProperty('--font-display', f.displayFamily)
  }, [dispatch])

  return (
    <>
      <Topbar onSettingsOpen={() => setSettingsOpen(true)} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '80px 1.5rem 2rem' }}>

        {state.screen === 'home' && <HomeScreen />}

        {state.screen === 'loading' && (
          <div style={{ padding: '4rem 0' }}>
            {/* Spinner + title */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                {state.quizMode === 'full' ? 'Menyiapkan Simulasi...' : 'Membuat Soal...'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                {state.loadingMessage}
              </div>
            </div>

            {/* Progress bar — only for full sim */}
            {state.quizMode === 'full' && state.loadingTotal > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                {/* Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, color: 'var(--text3)', marginBottom: 6,
                  }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: 500, color: 'var(--accent-tx)' }}>
                      {state.loadingProgress}%
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: 8 }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${state.loadingProgress}%`, transition: 'width 0.5s ease' }}
                    />
                  </div>
                </div>

                {/* Batch count */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, color: 'var(--text2)', marginBottom: 8,
                }}>
                  <span>Batch selesai</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                    {state.loadingDone} / {state.loadingTotal}
                  </span>
                </div>

                {/* Countdown */}
                {state.loadingCountdown > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    background: state.loadingMessage.includes('retry')
                      ? 'var(--danger-bg)'
                      : 'var(--accent-bg)',
                    border: `1px solid ${state.loadingMessage.includes('retry') ? 'var(--danger)' : 'var(--border)'}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      border: `2.5px solid ${state.loadingMessage.includes('retry') ? 'var(--danger)' : 'var(--border)'}`,
                      borderTopColor: state.loadingMessage.includes('retry') ? 'var(--danger)' : 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600,
                      color: state.loadingMessage.includes('retry') ? 'var(--danger)' : 'var(--accent-tx)',
                      animation: 'spin 1s linear infinite',
                    }}>
                      {state.loadingCountdown}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: 500,
                        color: state.loadingMessage.includes('retry') ? 'var(--danger)' : 'var(--accent-tx)',
                      }}>
                        {state.loadingMessage.includes('retry')
                          ? '⚠️ Rate limit — menunggu sebelum retry'
                          : 'Cooldown — mencegah rate limit'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        Lanjut dalam {state.loadingCountdown} detik...
                      </div>
                    </div>
                  </div>
                )}

                {state.loadingCountdown === 0 && state.loadingDone < state.loadingTotal && (
                  <div style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg2)', fontSize: 12, color: 'var(--text3)',
                    textAlign: 'center',
                  }}>
                    ⚡ Generating soal...
                  </div>
                )}
              </div>
            )}

            {/* Estimated time */}
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
              {state.quizMode === 'full' && state.simVariant === 'full'
                ? '⏳ Simulasi penuh: estimasi 4–8 menit'
                : state.quizMode === 'full'
                ? '⏳ Simulasi mini: estimasi 2–4 menit'
                : '⏳ Estimasi 10–20 detik'}
            </div>
          </div>
        )}

        {state.screen === 'quiz' && <QuizScreen />}

        {state.screen === 'result' && <ResultScreen />}
      </main>

      <Footer />
    </>
  )
}
