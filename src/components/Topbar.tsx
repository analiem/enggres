'use client'

import { useApp } from '@/lib/store'
import { useQuiz } from '@/lib/useQuiz'
import { FONT_OPTIONS } from '@/lib/config'
import { useEffect, useRef, useState } from 'react'

export function Topbar({ onSettingsOpen }: { onSettingsOpen: () => void }) {
  const { state, dispatch } = useApp()
  const { goHome } = useQuiz()

  const toggleTheme = () => {
    const next = state.theme === 'light' ? 'dark' : 'light'
    dispatch({ type: 'SET_THEME', payload: next })
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
  }

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display, DM Serif Display, serif)',
          fontSize: 18, color: 'var(--text)', letterSpacing: '-0.01em',
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={goHome}
      >
        🦕 Dinodino Tufel{' '}
        <span style={{ color: 'var(--accent)' }}>🇬🇧</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="icon-btn" onClick={goHome} title="Beranda">🏠</button>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle tema">
          {state.theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <button className="icon-btn" onClick={onSettingsOpen} title="Settings">⚙️</button>
      </div>
    </header>
  )
}

// ─── Settings Drawer ──────────────────────────────────────────────────────────

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const [keyInput, setKeyInput] = useState('')
  const [saved, setSaved] = useState(false)

  const saveKey = () => {
    const v = keyInput.trim()
    if (!v) return
    dispatch({ type: 'SET_API_KEY', payload: v })
    localStorage.setItem('groq_key', v)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  const setFont = (i: number) => {
    dispatch({ type: 'SET_FONT', payload: i })
    const f = FONT_OPTIONS[i]
    document.documentElement.style.setProperty('--font-body', f.bodyFamily)
    document.documentElement.style.setProperty('--font-display', f.displayFamily)
    localStorage.setItem('font', String(i))
  }

  const setTheme = (t: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: t })
    document.documentElement.classList.toggle('dark', t === 'dark')
    localStorage.setItem('theme', t)
  }

  if (!open) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>Settings</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20 }}>✕</button>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Label>Theme</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${state.theme === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: state.theme === t ? 'var(--accent-bg)' : 'var(--bg2)',
                  color: state.theme === t ? 'var(--accent-tx)' : 'var(--text2)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                }}
              >
                {t === 'light' ? '☀️ Light' : '🌙 Dark'}
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Label>Font</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FONT_OPTIONS.map((f, i) => (
              <div
                key={f.name}
                onClick={() => setFont(i)}
                style={{
                  padding: 12, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: `1px solid ${state.fontIndex === i ? 'var(--accent)' : 'var(--border)'}`,
                  background: state.fontIndex === i ? 'var(--accent-bg)' : 'var(--bg2)',
                  fontFamily: f.bodyFamily,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <Label>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: state.apiKey ? 'var(--success)' : '#ccc', marginRight: 6, verticalAlign: 'middle',
            }} />
            Groq API Key
          </Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              placeholder={state.apiKey ? '••••••••••••' : 'gsk_...'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--bg2)',
                color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={saveKey}
              style={{
                padding: '9px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent)', background: 'var(--accent-bg)',
                color: 'var(--accent-tx)', cursor: 'pointer', fontSize: 13,
                fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {saved ? '✓' : 'Simpan'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>
            Dapatkan API key <strong>gratis</strong> (tanpa kartu kredit) di{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer"
              style={{ color: 'var(--accent)' }}>
              console.groq.com
            </a>. Key disimpan hanya di browser kamu.
          </p>
        </div>
      </div>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 10,
    }}>
      {children}
    </div>
  )
}
