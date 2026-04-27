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
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>
              {state.loadingMessage}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {state.quizMode === 'full' && state.simVariant === 'full'
                ? 'Simulasi penuh: estimasi 2–5 menit'
                : state.quizMode === 'full'
                ? 'Simulasi mini: estimasi 1–2 menit'
                : 'Proses ini memakan waktu 10–20 detik'}
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
