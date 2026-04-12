import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StarGraph Intel',
  description: 'Stardog Enterprise Account Intelligence Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0e1a] min-h-screen antialiased">{children}</body>
    </html>
  )
}
