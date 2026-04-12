export interface Company {
  company: string
  vertical_id: string
  vertical_label: string
  signal_count: number
  top_signal: string
  signal_type: string
  urgency: 'high' | 'medium' | 'low'
  amount: string | null
  date: string
  why_stardog: string
}

export interface Signal {
  type: string
  urgency: string
  text: string
  date: string
}

export interface Contact {
  title: string
  department: string
  why_target: string
  linkedin_search: string
}

export interface Intel {
  company_name: string
  ticker: string | null
  hq: string
  primary_vertical: string
  relevance_score: number
  relevance_label: string
  relevance_color: string
  snapshot: string
  stardog_fit: string
  data_challenge: string
  signals: Signal[]
  target_contacts: Contact[]
  outreach_angle: string
  email_subject: string
  talking_points: string[]
  competitor_risk: string
  risk_flags: string[]
}

export interface TimelineEntry {
  id: string
  company: string
  signal_type: string
  urgency: string
  signal_text: string
  signal_date: string
  first_seen_at: string
}

export const VERTICALS = [
  { id: 'finserv', label: 'Financial Services', color: 'blue' },
  { id: 'healthcare', label: 'Healthcare', color: 'emerald' },
  { id: 'manufacturing', label: 'Manufacturing', color: 'yellow' },
  { id: 'energy', label: 'Energy', color: 'orange' },
  { id: 'government', label: 'Government', color: 'teal' },
  { id: 'technology', label: 'Technology', color: 'violet' },
] as const

export const VERTICAL_COLORS: Record<string, string> = {
  finserv: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  healthcare: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  manufacturing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  energy: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  government: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  technology: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
}

export const URGENCY_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300',
  medium: 'bg-yellow-500/20 text-yellow-300',
  low: 'bg-slate-500/20 text-slate-300',
}

export const SIGNAL_ICONS: Record<string, string> = {
  news: '\u{1F4F0}',
  funding: '\u{1F4B0}',
  hiring: '\u{1F465}',
  contract: '\u{1F4CB}',
  partnership: '\u{1F91D}',
  earnings: '\u{1F4CA}',
  research: '\u{1F52C}',
  regulation: '\u{2696}\u{FE0F}',
}

export const SCORE_COLORS: Record<string, string> = {
  green: 'text-emerald-400',
  yellow: 'text-yellow-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
}
