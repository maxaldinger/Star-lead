'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, DollarSign, Building2, ChevronDown, ChevronUp, RefreshCw, Sparkles, ExternalLink, Copy, Check, List, Map, Upload, X, Loader2 } from 'lucide-react'
import { VERTICAL_COLORS } from '@/lib/types'
import type { Intel, Contact } from '@/lib/types'

const TerritoryMap = dynamic(() => import('./territory-map'), { ssr: false })

interface Account {
  rank: number
  company: string
  vertical: string
  vertical_id: string
  revenue: string
  hq_city: string
  hq_state: string
  lat: number
  lng: number
  data_challenge: string
  stardog_fit: string
  entry_strategy: string
  key_personas: string[]
  est_acv: string
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    rank: 1,
    company: 'JPMorgan Chase',
    vertical: 'Financial Services',
    vertical_id: 'finserv',
    revenue: '$162B',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7128,
    lng: -74.006,
    data_challenge: 'Siloed risk data across trading, compliance, and operations. Regulatory pressure to unify reporting across 60+ legal entities.',
    stardog_fit: 'Knowledge graph unifies risk, trading, and compliance data without migration. Enables cross-entity regulatory reporting through virtual graphs. Voicebox lets compliance teams query without SQL.',
    entry_strategy: 'Enter through CDO office via upcoming Basel III.1 compliance mandate. Position as data fabric for regulatory reporting. Reference BNY Mellon success.',
    key_personas: ['Chief Data Officer', 'VP Enterprise Data Architecture', 'Head of Regulatory Technology', 'Managing Director, Risk Analytics'],
    est_acv: '$500K - $1M',
  },
  {
    rank: 2,
    company: 'Lockheed Martin',
    vertical: 'Government',
    vertical_id: 'government',
    revenue: '$67B',
    hq_city: 'Bethesda',
    hq_state: 'MD',
    lat: 38.9848,
    lng: -77.0947,
    data_challenge: 'Multi-program data across classified and unclassified systems. Engineering data fragmented across F-35, Space, and Missiles & Fire Control divisions.',
    stardog_fit: 'Virtual graph layer federates data across classification boundaries without data movement. Knowledge graph maps component dependencies across programs. AI grounding prevents hallucination in mission-critical contexts.',
    entry_strategy: 'Target Space division engineering data management. Reference NASA relationship. Lead with cross-program parts commonality and supply chain visibility.',
    key_personas: ['VP Digital Transformation', 'Chief Data & Analytics Officer', 'Director of Engineering Systems', 'VP Supply Chain'],
    est_acv: '$400K - $800K',
  },
  {
    rank: 3,
    company: 'UnitedHealth Group',
    vertical: 'Healthcare',
    vertical_id: 'healthcare',
    revenue: '$372B',
    hq_city: 'Minnetonka',
    hq_state: 'MN',
    lat: 44.9133,
    lng: -93.4687,
    data_challenge: 'Clinical, claims, and pharmacy data across Optum and UnitedHealthcare. FHIR interoperability mandates creating integration pressure.',
    stardog_fit: 'Knowledge graph maps patient journeys across clinical and claims data. Semantic layer enables FHIR compliance without rebuilding systems. AI grounding critical for clinical decision support.',
    entry_strategy: 'Enter through Optum data platform team. Position around CMS interoperability mandate deadlines. Show patient data unification across Optum Health, Rx, and Insight.',
    key_personas: ['Optum CTO', 'VP Health Data Platform', 'Chief Medical Informatics Officer', 'SVP Analytics & AI'],
    est_acv: '$600K - $1.2M',
  },
  {
    rank: 4,
    company: 'ExxonMobil',
    vertical: 'Energy',
    vertical_id: 'energy',
    revenue: '$344B',
    hq_city: 'Spring',
    hq_state: 'TX',
    lat: 30.0799,
    lng: -95.4172,
    data_challenge: 'Upstream exploration, midstream pipeline, and downstream refining data completely siloed. Decades of legacy systems across global operations.',
    stardog_fit: 'Virtual graph federates subsurface, production, and refining data without ETL. Knowledge graph maps asset relationships for predictive maintenance. Enables AI-driven exploration insights grounded in verified geological data.',
    entry_strategy: 'Target digital transformation office. Lead with asset data unification for predictive maintenance. Reference energy sector peers. Enter through upstream data management.',
    key_personas: ['VP Digital & Information Technology', 'Chief Data Officer', 'Director Subsurface Data Science', 'VP Refining Optimization'],
    est_acv: '$350K - $700K',
  },
  {
    rank: 5,
    company: 'Siemens',
    vertical: 'Manufacturing',
    vertical_id: 'manufacturing',
    revenue: '$87B',
    hq_city: 'Iselin',
    hq_state: 'NJ',
    lat: 40.5728,
    lng: -74.3224,
    data_challenge: 'IoT sensor data, PLM, ERP, and MES systems disconnected across Digital Industries and Smart Infrastructure. Digital twin data not unified.',
    stardog_fit: 'Knowledge graph unifies IoT, PLM, and ERP data for true digital twin intelligence. Virtual graphs connect Teamcenter, SAP, and MindSphere without migration. AI grounding ensures reliable manufacturing insights.',
    entry_strategy: 'Enter through Digital Industries division. Position as the data layer that makes digital twins intelligent. Reference Bosch relationship in manufacturing.',
    key_personas: ['CTO Digital Industries', 'VP Industrial AI', 'Head of Data Architecture', 'Director Manufacturing Excellence'],
    est_acv: '$400K - $800K',
  },
  {
    rank: 6,
    company: 'Goldman Sachs',
    vertical: 'Financial Services',
    vertical_id: 'finserv',
    revenue: '$47B',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7146,
    lng: -74.0071,
    data_challenge: 'Alternative data integration for trading intelligence. Research, market data, and internal analytics in separate systems.',
    stardog_fit: 'Knowledge graph connects alternative data sources to internal research for AI-powered trading insights. Grounded AI prevents hallucination in financial analysis. Virtual graphs federate across data vendors.',
    entry_strategy: 'Target Global Markets data engineering team. Lead with alternative data unification for alpha generation. Position against custom-built graph solutions.',
    key_personas: ['Chief Data Officer', 'MD Engineering - Data Platform', 'VP Quantitative Research', 'Head of Market Data Strategy'],
    est_acv: '$300K - $600K',
  },
  {
    rank: 7,
    company: 'General Electric',
    vertical: 'Manufacturing',
    vertical_id: 'manufacturing',
    revenue: '$68B',
    hq_city: 'Evendale',
    hq_state: 'OH',
    lat: 39.2328,
    lng: -84.426,
    data_challenge: 'Post-split data architecture across GE Aerospace, GE Vernova. Legacy systems from decades of conglomerate operations.',
    stardog_fit: 'Virtual graph layer enables data federation during corporate separation. Knowledge graph maps asset lineage across divisions. Critical for maintaining institutional knowledge during organizational change.',
    entry_strategy: 'Target GE Aerospace data platform team. Lead with post-separation data continuity. Position as the bridge between legacy and modern architecture.',
    key_personas: ['VP Data & Analytics - GE Aerospace', 'CTO GE Vernova', 'Director Enterprise Architecture', 'Head of Digital Thread'],
    est_acv: '$350K - $700K',
  },
  {
    rank: 8,
    company: 'U.S. Department of Energy',
    vertical: 'Government',
    vertical_id: 'government',
    revenue: '$52B budget',
    hq_city: 'Washington',
    hq_state: 'DC',
    lat: 38.9072,
    lng: -77.0369,
    data_challenge: 'Research data across 17 national labs disconnected. Climate, nuclear, and AI research data in isolated repositories.',
    stardog_fit: 'Knowledge graph federates research data across labs without centralizing classified or sensitive data. Enables cross-lab discovery. Voicebox gives researchers natural language access to unified data.',
    entry_strategy: 'Enter through Office of Science data management initiative. Reference NASA relationship. Target cross-lab data sharing mandate. Position through GSA schedule.',
    key_personas: ['Chief Information Officer', 'Director of Scientific Computing', 'Deputy CTO for Data', 'Program Manager - AI Initiative'],
    est_acv: '$250K - $500K',
  },
  {
    rank: 9,
    company: 'Johnson & Johnson',
    vertical: 'Healthcare',
    vertical_id: 'healthcare',
    revenue: '$85B',
    hq_city: 'New Brunswick',
    hq_state: 'NJ',
    lat: 40.4862,
    lng: -74.4518,
    data_challenge: 'R&D, regulatory, manufacturing, and supply chain data fragmented across MedTech and Pharmaceutical segments.',
    stardog_fit: 'Knowledge graph connects clinical trial data, regulatory submissions, and manufacturing quality data. Accelerates drug development by unifying R&D insights. AI grounding critical for FDA submission accuracy.',
    entry_strategy: 'Target R&D data platform team. Lead with clinical-to-regulatory data traceability. Position around FDA data integrity requirements.',
    key_personas: ['CTO - Innovative Medicine', 'VP Global Data Strategy', 'Head of R&D Informatics', 'Director Supply Chain Digital'],
    est_acv: '$400K - $800K',
  },
  {
    rank: 10,
    company: 'Deloitte',
    vertical: 'Technology',
    vertical_id: 'technology',
    revenue: '$65B',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7558,
    lng: -73.9845,
    data_challenge: 'Client engagement data, methodology knowledge bases, and industry research across practices completely disconnected. Institutional knowledge walks out the door.',
    stardog_fit: 'Knowledge graph captures and connects institutional knowledge across practices. Enables AI-powered client intelligence grounded in verified engagement history. Virtual graphs federate across practice management systems.',
    entry_strategy: 'Enter as both customer and potential implementation partner. Target internal CIO office. Lead with knowledge management for consulting leverage. Explore reseller/SI partnership.',
    key_personas: ['Chief Information Officer', 'US Managing Director - AI & Data', 'National Practice CTO', 'Head of Knowledge Management'],
    est_acv: '$300K - $600K + partner revenue',
  },
]

/* ── City coordinate lookup for imported accounts ── */

const CITY_COORDS: Record<string, [number, number]> = {
  'new york': [40.7128, -74.006], 'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298], 'houston': [29.7604, -95.3698],
  'phoenix': [33.4484, -112.074], 'philadelphia': [39.9526, -75.1652],
  'san antonio': [29.4241, -98.4936], 'san diego': [32.7157, -117.1611],
  'dallas': [32.7767, -96.797], 'san jose': [37.3382, -121.8863],
  'austin': [30.2672, -97.7431], 'jacksonville': [30.3322, -81.6557],
  'san francisco': [37.7749, -122.4194], 'seattle': [47.6062, -122.3321],
  'denver': [39.7392, -104.9903], 'boston': [42.3601, -71.0589],
  'washington': [38.9072, -77.0369], 'nashville': [36.1627, -86.7816],
  'atlanta': [33.749, -84.388], 'detroit': [42.3314, -83.0458],
  'miami': [25.7617, -80.1918], 'portland': [45.5152, -122.6784],
  'charlotte': [35.2271, -80.8431], 'minneapolis': [44.9778, -93.265],
  'raleigh': [35.7796, -78.6382], 'salt lake city': [40.7608, -111.891],
  'st louis': [38.627, -90.1994], 'pittsburgh': [40.4406, -79.9959],
  'columbus': [39.9612, -82.9988], 'indianapolis': [39.7684, -86.1581],
  'tampa': [27.9506, -82.4572], 'richmond': [37.5407, -77.436],
  'omaha': [41.2565, -95.9345], 'kansas city': [39.0997, -94.5786],
  'milwaukee': [43.0389, -87.9065], 'louisville': [38.2527, -85.7585],
  'oklahoma city': [35.4676, -97.5164], 'memphis': [35.1495, -90.049],
  'baltimore': [39.2904, -76.6122], 'cincinnati': [39.1031, -84.512],
  'bethesda': [38.9848, -77.0947], 'arlington': [38.8799, -77.1068],
  'cupertino': [37.323, -122.0322], 'redmond': [47.674, -122.1215],
  'menlo park': [37.453, -122.1817], 'mountain view': [37.3861, -122.0839],
  'palo alto': [37.4419, -122.143], 'new brunswick': [40.4862, -74.4518],
  'minnetonka': [44.9133, -93.4687], 'spring': [30.0799, -95.4172],
  'iselin': [40.5728, -74.3224], 'evendale': [39.2328, -84.426],
  'stamford': [41.0534, -73.5387], 'bentonville': [36.3729, -94.2088],
  'irving': [32.814, -96.9489], 'round rock': [30.5083, -97.6789],
  'armonk': [41.1265, -73.7143], 'purchase': [41.0409, -73.7143],
  'dearborn': [42.3223, -83.1763], 'burbank': [34.1808, -118.3090],
  'sunnyvale': [37.3688, -122.0363], 'plano': [33.0198, -96.6989],
  'troy': [42.6064, -83.1498], 'wilmington': [39.7391, -75.5398],
  'hartford': [41.7658, -72.6734], 'providence': [41.824, -71.4128],
  'buffalo': [42.8864, -78.8784], 'rochester': [43.1566, -77.6088],
  'cleveland': [41.4993, -81.6944], 'orlando': [28.5383, -81.3792],
  'las vegas': [36.1699, -115.1398], 'tucson': [32.2226, -110.9747],
}

function lookupCoords(city: string): { lat: number; lng: number } {
  if (!city) return { lat: 0, lng: 0 }
  const coords = CITY_COORDS[city.toLowerCase().trim()]
  return coords ? { lat: coords[0], lng: coords[1] } : { lat: 0, lng: 0 }
}

function mapVerticalId(vertical: string): string {
  const l = vertical.toLowerCase()
  if (l.includes('financial') || l.includes('banking') || l.includes('insurance')) return 'finserv'
  if (l.includes('health') || l.includes('pharma') || l.includes('medical')) return 'healthcare'
  if (l.includes('manufactur') || l.includes('industrial') || l.includes('automotive')) return 'manufacturing'
  if (l.includes('energy') || l.includes('oil') || l.includes('utilit')) return 'energy'
  if (l.includes('government') || l.includes('defense') || l.includes('federal')) return 'government'
  return 'technology'
}

function linkedinUrl(persona: string, company: string) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(persona + ' ' + company)}`
}

export default function TerritoryPlan() {
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null)
  const [researching, setResearching] = useState<Record<number, boolean>>({})
  const [deepDive, setDeepDive] = useState<Record<number, Intel>>({})
  const [copied, setCopied] = useState<string | null>(null)

  // Map / list toggle
  const [view, setView] = useState<'list' | 'map'>('list')

  // Import
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<Record<string, 'pending' | 'loading' | 'done' | 'error'>>({})
  const [importedAccounts, setImportedAccounts] = useState<Account[]>([])
  const [includeDefaults, setIncludeDefaults] = useState(true)

  const allAccounts = useMemo(() => {
    const base = includeDefaults ? DEFAULT_ACCOUNTS : []
    return [...base, ...importedAccounts].map((a, i) => ({ ...a, rank: i + 1 }))
  }, [includeDefaults, importedAccounts])

  const totalPipeline = allAccounts.reduce((s, a) => {
    const match = a.est_acv.match(/\$([0-9.]+)([KMB])/i)
    if (!match) return s
    const num = parseFloat(match[1])
    const mult = match[2].toUpperCase() === 'M' ? 1000000 : match[2].toUpperCase() === 'K' ? 1000 : 1
    return s + num * mult
  }, 0)

  const aiResearch = async (idx: number) => {
    const account = allAccounts[idx]
    setResearching(p => ({ ...p, [idx]: true }))
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: account.company }),
      })
      const d = await r.json()
      if (d.intel) {
        setDeepDive(p => ({ ...p, [idx]: d.intel as Intel }))
      }
    } catch {}
    setResearching(p => ({ ...p, [idx]: false }))
  }

  const parseImportLine = (line: string) => {
    const parts = line.split(',').map(s => s.trim())
    const company = parts[0]
    if (parts.length >= 3) {
      // "Company, City, ST" or "Company, City, ST ZIP"
      const city = parts[1]
      const stateChunk = parts.slice(2).join(', ').trim()
      const stateMatch = stateChunk.match(/^([A-Z]{2})(?:\s+\d{5})?$/i)
      const state = stateMatch ? stateMatch[1].toUpperCase() : stateChunk.replace(/\s*\d{5}$/, '').trim()
      return { company, city, state }
    }
    if (parts.length === 2) {
      // Could be "Company, City" — no state
      return { company, city: parts[1], state: '' }
    }
    return { company, city: '', state: '' }
  }

  const importAccounts = async () => {
    const lines = importText.split('\n').map(s => s.trim()).filter(Boolean)
    if (!lines.length) return

    setImporting(true)
    const progress: Record<string, 'pending' | 'loading' | 'done' | 'error'> = {}
    lines.forEach(l => { progress[l] = 'pending' })
    setImportProgress({ ...progress })

    for (const line of lines) {
      const parsed = parseImportLine(line)
      setImportProgress(p => ({ ...p, [line]: 'loading' }))
      try {
        const r = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: parsed.company }),
        })
        const d = await r.json()
        if (d.intel) {
          const intel = d.intel as Intel
          // Use user-provided location if given, otherwise fall back to API response
          let city = parsed.city
          let state = parsed.state
          if (!city) {
            const apiParts = (intel.hq || '').split(',').map(s => s.trim())
            city = apiParts[0] || ''
            state = apiParts[1] || ''
          }
          const coords = lookupCoords(city)
          const newAccount: Account = {
            rank: 0,
            company: intel.company_name || parsed.company,
            vertical: intel.primary_vertical || 'Technology',
            vertical_id: mapVerticalId(intel.primary_vertical || ''),
            revenue: '',
            hq_city: city,
            hq_state: state,
            lat: coords.lat,
            lng: coords.lng,
            data_challenge: intel.data_challenge || '',
            stardog_fit: intel.stardog_fit || '',
            entry_strategy: intel.outreach_angle || '',
            key_personas: intel.target_contacts?.map(c => c.title) || [],
            est_acv: 'TBD',
          }
          setImportedAccounts(prev => [...prev, newAccount])
          setImportProgress(p => ({ ...p, [line]: 'done' }))
        } else {
          setImportProgress(p => ({ ...p, [line]: 'error' }))
        }
      } catch {
        setImportProgress(p => ({ ...p, [line]: 'error' }))
      }
    }
    setImporting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Territory Attack Plan - Q2 2026</h2>
          <p className="text-sm text-slate-400">
            {allAccounts.length} pre-researched enterprise accounts with complex data integration challenges aligned to Stardog&apos;s ICP
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import toggle */}
          <button
            onClick={() => setShowImport(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              showImport
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>

          {/* View toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${
                view === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${
                view === 'map' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Import Accounts</h3>
              <p className="text-xs text-slate-400 mt-0.5">Paste one entry per line. Use company name alone, or add location: Company, City, ST or Company, City, ST ZIP</p>
            </div>
            <button onClick={() => setShowImport(false)} className="p-1 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={'JPMorgan Chase\nBoeing, Arlington, VA 22202\nExxonMobil, Spring, TX 77389\nSnowflake'}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm resize-none leading-relaxed"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={importAccounts}
              disabled={importing || !importText.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium text-sm hover:from-cyan-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Import Accounts</>
              )}
            </button>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                onClick={() => setIncludeDefaults(p => !p)}
                className={`relative w-9 h-5 rounded-full transition-colors ${includeDefaults ? 'bg-cyan-600' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeDefaults ? 'translate-x-4' : ''}`} />
              </button>
              <span className="text-xs text-slate-400">Include default accounts</span>
            </label>
          </div>

          {/* Import progress */}
          {Object.keys(importProgress).length > 0 && (
            <div className="space-y-1.5">
              {Object.entries(importProgress).map(([name, status]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  {status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                  {status === 'loading' && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                  {status === 'done' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {status === 'error' && <X className="w-3.5 h-3.5 text-red-400" />}
                  <span className={status === 'done' ? 'text-slate-300' : status === 'error' ? 'text-red-400' : 'text-slate-400'}>
                    {name}
                  </span>
                  {status === 'loading' && <span className="text-slate-500">Analyzing...</span>}
                  {status === 'error' && <span className="text-red-500">Failed</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Target Accounts</span>
          </div>
          <div className="text-2xl font-bold text-white">{allAccounts.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Pipeline Target (Low)</span>
          </div>
          <div className="text-2xl font-bold text-white">${(totalPipeline / 1000000).toFixed(1)}M</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-400">Verticals Covered</span>
          </div>
          <div className="text-2xl font-bold text-white">{new Set(allAccounts.map(a => a.vertical_id)).size}</div>
        </div>
      </div>

      {/* Map View */}
      {view === 'map' && (
        <TerritoryMap accounts={allAccounts} />
      )}

      {/* Account List */}
      {view === 'list' && (
        <div className="space-y-2">
          {allAccounts.map((a, idx) => {
            const isOpen = expandedAccount === idx
            return (
              <div key={`${a.company}-${idx}`} className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden hover:border-white/20 transition-all">
                <button
                  onClick={() => setExpandedAccount(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center gap-4 text-left"
                >
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                    {a.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white">{a.company}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${VERTICAL_COLORS[a.vertical_id] || 'bg-white/5 text-slate-400'}`}>
                        {a.vertical}
                      </span>
                      {a.revenue && <span className="text-xs text-slate-500">{a.revenue}</span>}
                      {a.hq_city && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {a.hq_city}, {a.hq_state}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{a.est_acv}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                        <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Data Challenge</div>
                        <p className="text-xs text-slate-300">{a.data_challenge}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                        <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">Stardog Fit</div>
                        <p className="text-xs text-slate-300">{a.stardog_fit}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                      <div className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Entry Strategy</div>
                      <p className="text-xs text-slate-300">{a.entry_strategy}</p>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Key Personas</div>
                      <div className="flex flex-wrap gap-2">
                        {a.key_personas.map((p, i) => (
                          <a
                            key={i}
                            href={linkedinUrl(p, a.company)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-xs text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 transition-all"
                          >
                            {p}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => aiResearch(idx)}
                      disabled={researching[idx]}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all text-xs font-medium"
                    >
                      {researching[idx] ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Researching...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> AI Deep Dive</>
                      )}
                    </button>

                    {deepDive[idx] && (() => {
                      const intel = deepDive[idx]
                      return (
                        <div className="space-y-3">
                          {/* Relevance Score */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${intel.relevance_score}%` }} />
                              </div>
                              <span className="text-xs text-cyan-400 font-mono">{intel.relevance_score}%</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{intel.relevance_label}</span>
                            {intel.hq && <span className="text-[10px] text-slate-500">HQ: {intel.hq}</span>}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                              <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Data Challenge</div>
                              <p className="text-xs text-slate-300">{intel.data_challenge}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                              <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">Stardog Fit</div>
                              <p className="text-xs text-slate-300">{intel.stardog_fit}</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                            <div className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Outreach Angle</div>
                            <p className="text-xs text-slate-300">{intel.outreach_angle}</p>
                          </div>

                          {intel.talking_points?.length > 0 && (
                            <div className="p-3 rounded-lg bg-white/5">
                              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Talking Points</div>
                              <ul className="space-y-1">
                                {intel.talking_points.map((pt: string, pi: number) => (
                                  <li key={pi} className="flex items-start gap-2 text-xs text-slate-300">
                                    <span className="text-cyan-500 mt-0.5">&rarr;</span> {pt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {intel.target_contacts?.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Target Contacts</div>
                              <div className="flex flex-wrap gap-2">
                                {intel.target_contacts.map((c: Contact, ci: number) => (
                                  <a key={ci} href={c.linkedin_search} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-xs text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 transition-all"
                                    title={c.why_target}>
                                    {c.title} <ExternalLink className="w-3 h-3 opacity-60" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {intel.risk_flags?.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                              <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">Risk Factors</div>
                              <ul className="space-y-1">
                                {intel.risk_flags.map((rf: string, ri: number) => (
                                  <li key={ri} className="text-xs text-slate-400 flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">!</span> {rf}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {intel.email_subject && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`Subject: ${intel.email_subject}\n\n${intel.outreach_angle}`)
                                  setCopied(`dd-${idx}`)
                                  setTimeout(() => setCopied(null), 2000)
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-all"
                              >
                                {copied === `dd-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copied === `dd-${idx}` ? 'Copied' : 'Copy outreach'}
                              </button>
                              <span className="text-[10px] text-slate-500 truncate">Subject: {intel.email_subject}</span>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
