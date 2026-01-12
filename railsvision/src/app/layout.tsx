'use client'

import React from 'react'
import './globals.css'
import { Manrope } from 'next/font/google'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { CameraProvider } from '@/components/CameraSelector'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
        <CameraProvider>
          {/* Main Layout Container - Mesh Background is in globals.css */}
          <div className="flex h-screen relative w-full">

            {/* Sidebar - Floating Glass Panel */}
            <div className="z-50 h-full p-4 hidden md:block w-72 shrink-0">
              <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Floating Header */}
              <div className="w-full p-4 pb-0 z-40">
                <Header />
              </div>

              {/* Scrollable Page Content */}
              <main className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth">
                <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
                  {children}
                </div>
              </main>
            </div>

          </div>
        </CameraProvider>
      </body>
    </html>
  )
}
