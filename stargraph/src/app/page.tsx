'use client'

import { useState, useEffect } from 'react'
import { Radio, MessageSquare, Map, Network, Shield, ShieldCheck } from 'lucide-react'
import SignalFeed from '@/components/signal-feed'
import SalesAssist from '@/components/sales-assist'
import TerritoryPlan from '@/components/territory-plan'
import KnowledgeGraph from '@/components/knowledge-graph'

const TABS = [
  { id: 'signals', label: 'Signal Feed', Icon: Radio },
  { id: 'sales-assist', label: 'Sales Assist', Icon: MessageSquare },
  { id: 'territory', label: 'Territory Plan', Icon: Map },
]

const ADMIN_TAB = { id: 'graph', label: 'Knowledge Graph', Icon: Network }

export default function Dashboard() {
  const [tab, setTab] = useState('signals')
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault()
        setAdmin(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const visibleTabs = admin ? [...TABS, ADMIN_TAB] : TABS

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e1a]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">StarGraph Intel</h1>
              <p className="text-xs text-slate-400">Stardog Enterprise Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {admin && (
              <span className="px-2 py-1 text-[10px] font-bold tracking-widest uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded">
                Architect Mode
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
            <button
              onClick={() => setAdmin(p => !p)}
              className={`p-2 rounded-lg transition-all ${
                admin
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title="Toggle Architect Mode (Ctrl+Shift+G)"
            >
              {admin ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px">
            {visibleTabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === id
                    ? id === 'graph'
                      ? 'border-violet-400 text-violet-300'
                      : 'border-cyan-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'signals' && <SignalFeed />}
        {tab === 'sales-assist' && <SalesAssist />}
        {tab === 'territory' && <TerritoryPlan />}
        {tab === 'graph' && admin && <KnowledgeGraph />}
      </main>
    </div>
  )
}
