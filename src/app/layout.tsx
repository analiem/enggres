import type { Metadata } from 'next'
import '@/styles/globals.css'
import { AppProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: 'Dinodino Tufel 🦕',
  description: 'Latihan TOEFL & TOEIC dengan soal AI — Dinodino Learn',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
