'use client'

import { useApp } from '@/lib/store'
import { useQuiz } from '@/lib/useQuiz'
import { SECTIONS, SIM_CONFIG, SCORE_CONFIG, TestId, QuizMode, getSimVariant } from '@/lib/config'

const TESTS: { id: TestId; name: string; desc: string }[] = [
  { id: 'TOEFL_IBT', name: 'TOEFL iBT', desc: 'Internet-based · Skor 0–120' },
  { id: 'TOEFL_ITP', name: 'TOEFL ITP', desc: 'Institutional · Skor 310–677' },
  { id: 'TOEIC',     name: 'TOEIC',     desc: 'L&R · Skor 10–990' },
]

export function HomeScreen() {
  const { state, dispatch } = useApp()
  const { startQuiz } = useQuiz()

  const selectTest = (id: TestId) => dispatch({ type: 'SELECT_TEST', payload: id })
  const selectMode = (m: QuizMode) => dispatch({ type: 'SELECT_MODE', payload: m })
  const selectSection = (s: string) => dispatch({ type: 'SELECT_SECTION', payload: s })
  const selectCount = (n: number) => dispatch({ type: 'SELECT_COUNT', payload: n })
  const selectVariant = (v: 'full' | 'mini') => dispatch({ type: 'SET_SIM_VARIANT', payload: v })

  const canStart =
    state.selectedTest &&
    state.quizMode &&
    (state.quizMode === 'full' || state.selectedSection)

  const simVariant =
    state.selectedTest && state.quizMode === 'full'
      ? getSimVariant(state.selectedTest, state.simVariant)
      : null

  return (
    <div style={{ paddingTop: '1rem' }}>

      {/* API Key warning */}
      {!state.apiKey && (
        <div style={{
          padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem',
          border: '1px solid rgba(168,85,20,.3)', background: 'rgba(168,85,20,.08)',
          fontSize: 13, color: '#a85514',
        }}>
          ⚠️ Groq API Key belum diset. Buka Settings (⚙️) dan masukkan API key gratis dari Groq.
        </div>
      )}

      {/* Test selection */}
      <SectionLabel>Pilih jenis tes</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.5rem' }}>
        {TESTS.map((t) => (
          <TestCard
            key={t.id}
            name={t.name}
            desc={t.desc}
            selected={state.selectedTest === t.id}
            onClick={() => selectTest(t.id)}
          />
        ))}
      </div>

      {/* Mode selection */}
      {state.selectedTest && (
        <>
          <SectionLabel>Pilih mode latihan</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.5rem' }}>
            <ModeCard
              icon="📝" name="Per Section"
              desc="Pilih section tertentu & jumlah soal sendiri"
              selected={state.quizMode === 'section'}
              onClick={() => selectMode('section')}
            />
            <ModeCard
              icon="🎯" name="Simulasi"
              desc="Semua section, waktu & soal mendekati tes asli"
              selected={state.quizMode === 'full'}
              onClick={() => selectMode('full')}
            />
          </div>
        </>
      )}

      {/* Per Section options */}
      {state.quizMode === 'section' && state.selectedTest && (
        <>
          <SectionLabel>Pilih section</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
            {SECTIONS[state.selectedTest].map((s) => (
              <button
                key={s}
                className={`chip ${state.selectedSection === s ? 'active' : ''}`}
                onClick={() => selectSection(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <SectionLabel>Jumlah soal</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
            {[5, 10, 15, 20, 25].map((n) => (
              <button
                key={n}
                className={`chip ${state.questionCount === n ? 'active' : ''}`}
                onClick={() => selectCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Simulasi variant selector + info */}
      {state.quizMode === 'full' && state.selectedTest && (
        <>
          <SectionLabel>Pilih varian simulasi</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
            {(['full', 'mini'] as const).map((v) => {
              const vd = SIM_CONFIG[state.selectedTest!][v]
              return (
                <div
                  key={v}
                  onClick={() => selectVariant(v)}
                  style={{
                    padding: '1rem', borderRadius: 'var(--radius)', cursor: 'pointer',
                    border: `${state.simVariant === v ? '2px solid var(--accent)' : '1px solid var(--border)'}`,
                    background: state.simVariant === v ? 'var(--accent-bg)' : 'var(--surface)',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                    {vd.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{vd.desc}</div>
                </div>
              )
            })}
          </div>

          {simVariant && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '.75rem', fontSize: 14 }}>
                🎯 {SCORE_CONFIG[state.selectedTest!].label} — {simVariant.label}
              </div>
              {simVariant.sections.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--text2)' }}>{s.name}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{s.count} soal</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)', fontWeight: 500 }}>
                  Total · {simVariant.totalTime} menit
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {simVariant.sections.reduce((a, s) => a + s.count, 0)} soal
                </span>
              </div>
              {state.simVariant === 'full' && (
                <div style={{
                  marginTop: 10, padding: '8px 10px', background: 'var(--bg2)',
                  borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.5,
                }}>
                  ⏳ Simulasi penuh memerlukan waktu loading 2–5 menit untuk generate semua soal. Pastikan koneksi stabil.
                </div>
              )}
            </div>
          )}
        </>
      )}

      <button className="btn-primary" disabled={!canStart} onClick={startQuiz}>
        {state.quizMode === 'full' ? '🎯 Mulai Simulasi' : '📝 Mulai Latihan'}
      </button>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

function TestCard({ name, desc, selected, onClick }: {
  name: string; desc: string; selected: boolean; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '1.25rem', borderRadius: 'var(--radius)', cursor: 'pointer',
        border: `${selected ? '2px solid var(--accent)' : '1px solid var(--border)'}`,
        background: selected ? 'var(--accent-bg)' : 'var(--surface)',
        transition: 'all 0.18s ease',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 20,
        color: 'var(--text)', marginBottom: 4,
      }}>{name}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{desc}</div>
    </div>
  )
}

function ModeCard({ icon, name, desc, selected, onClick }: {
  icon: string; name: string; desc: string; selected: boolean; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '1.25rem', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center',
        border: `${selected ? '2px solid var(--accent)' : '1px solid var(--border)'}`,
        background: selected ? 'var(--accent-bg)' : 'var(--surface)',
        transition: 'all 0.18s ease',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  )
}
