'use client'

import { useApp } from '@/lib/store'
import { useQuiz } from '@/lib/useQuiz'
import { SCORE_CONFIG } from '@/lib/config'

export function ResultScreen() {
  const { state } = useApp()
  const { goHome, startQuiz, computeScore } = useQuiz()

  const result = computeScore()
  if (!result || !state.selectedTest) return null

  const { cfg, correct, total, pct, score, level, barPct, elapsed } = result
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  const modeLabel =
    state.quizMode === 'full' ? 'Simulasi Penuh' : state.selectedSection

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '1.5rem 0 2rem' }}>
        <div style={{
          fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: '.5rem',
        }}>
          {cfg.label} · {modeLabel}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 72,
          lineHeight: 1, color: 'var(--text)', marginBottom: 4,
        }}>
          {score}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text2)' }}>
          Estimasi skor {cfg.label}: {score} / {cfg.max}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { n: correct,  label: 'Benar' },
          { n: total - correct, label: 'Salah' },
          { n: `${mins}m ${String(secs).padStart(2,'0')}s`, label: 'Waktu' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'var(--bg2)', borderRadius: 'var(--radius-sm)',
            padding: '1rem', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text)' }}>{s.n}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <Row label="Akurasi jawaban" value={`${pct}%`} />
        <Row label="Soal dijawab" value={`${total} / ${state.questions.length}`} />
        <Row label={`Range skor ${cfg.label}`} value={`${cfg.min} – ${cfg.max}`} />
        <Row label="Level CEFR" value={`${level.grade} · ${level.label}`} valueColor={level.color} />

        {/* Score bar */}
        <div style={{ padding: '10px 0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
            <span>{cfg.min}</span>
            <span style={{ fontWeight: 500, color: level.color }}>{score}</span>
            <span>{cfg.max}</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${barPct}%`,
              background: level.color, borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Level breakdown table */}
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 8 }}>
            Tabel level {cfg.label}
          </div>
          {cfg.levels.map((l) => (
            <div key={l.grade} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 8px', borderRadius: 6, marginBottom: 4,
              background: score >= l.min && score <= l.max ? `${l.color}18` : 'transparent',
              border: score >= l.min && score <= l.max ? `1px solid ${l.color}40` : '1px solid transparent',
            }}>
              <span style={{ fontSize: 12, fontWeight: score >= l.min && score <= l.max ? 500 : 400, color: l.color }}>
                {l.grade} · {l.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{l.min}–{l.max}</span>
            </div>
          ))}
        </div>

        {/* Desc */}
        <div style={{
          padding: '8px 10px', background: 'var(--bg2)', borderRadius: 'var(--radius-sm)',
          marginTop: 8, fontSize: 13, color: 'var(--text2)',
        }}>
          💡 {level.desc}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn-primary" onClick={startQuiz}>🔄 Coba Lagi (soal baru)</button>
        <button className="btn-secondary" onClick={goHome}>← Kembali ke Beranda</button>
      </div>
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 14,
    }}>
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: valueColor ?? 'var(--text)' }}>{value}</span>
    </div>
  )
}
