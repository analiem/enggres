# 🦕 Dinodino Tufel

Aplikasi latihan TOEFL & TOEIC dengan soal AI-generated (Groq + Llama 3.3).

## Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Groq API** (Llama 3.3 70B) — gratis, tanpa kartu kredit

## Fitur
- TOEFL iBT / TOEFL ITP / TOEIC
- Mode Per Section & Simulasi Penuh
- TTS (Text-to-Speech) untuk section Listening
- Scoring akurat sesuai range tes asli + level CEFR
- Dark mode & pilihan 10 font
- Penjelasan jawaban dalam Bahasa Indonesia

## Deploy ke Vercel (tanpa install lokal)

### Cara 1 — GitHub (Rekomendasi)
1. Upload folder ini ke GitHub repo baru
2. Buka [vercel.com](https://vercel.com) → New Project → Import repo
3. Vercel otomatis detect Next.js → klik Deploy
4. Selesai! Buka web → Settings ⚙️ → masukkan Groq API key

### Cara 2 — Drag & Drop
1. Zip folder `dinodino-tufel` ini
2. Buka [vercel.com](https://vercel.com) → New Project → drag & drop zip
3. Deploy

## Groq API Key (gratis)
1. Buka https://console.groq.com
2. Login pakai Google/GitHub
3. API Keys → Create API Key
4. Copy key (format: `gsk_...`)
5. Paste di Settings web
