'use client'

import { useState, useMemo } from 'react'
import { DollarSign, Plus, Minus, ShoppingCart, Download, Sparkles, RefreshCw, Check, ArrowLeft, Trash2 } from 'lucide-react'

interface PricebookItem {
  id: string
  product_name: string
  category: string
  msrp: number
  unit: string
  notes: string
}

interface QuoteLineItem extends PricebookItem {
  quantity: number
  selected: boolean
}

const STARDOG_PRICEBOOK: PricebookItem[] = [
  { id: 'sep', product_name: 'Stardog Enterprise Platform', category: 'Platform', msrp: 100000, unit: '/node/year', notes: 'Core knowledge graph engine with SPARQL, GraphQL, SQL' },
  { id: 'sc', product_name: 'Stardog Cloud (Managed)', category: 'Platform', msrp: 150000, unit: '/year', notes: 'Fully managed cloud deployment' },
  { id: 'sd', product_name: 'Stardog Designer', category: 'Tools', msrp: 25000, unit: '/year', notes: 'Visual data modeling and ontology management' },
  { id: 'sv', product_name: 'Stardog Voicebox', category: 'AI', msrp: 50000, unit: '/year', notes: 'AI-powered natural language query interface' },
  { id: 'vg', product_name: 'Virtual Graph Module', category: 'Integration', msrp: 30000, unit: '/source/year', notes: 'Query remote databases in-place without ETL' },
  { id: 'ps-impl', product_name: 'Implementation Services', category: 'Services', msrp: 50000, unit: 'fixed', notes: 'Production deployment, integration, migration' },
  { id: 'ps-dm', product_name: 'Data Modeling Services', category: 'Services', msrp: 25000, unit: 'fixed', notes: 'Ontology design, schema mapping' },
  { id: 'tr-admin', product_name: 'Training - Admin', category: 'Training', msrp: 5000, unit: '/seat', notes: 'Platform administration and operations' },
  { id: 'tr-dev', product_name: 'Training - Developer', category: 'Training', msrp: 3500, unit: '/seat', notes: 'SPARQL, GraphQL, API integration' },
  { id: 'tr-biz', product_name: 'Training - Business User', category: 'Training', msrp: 2000, unit: '/seat', notes: 'Voicebox and Explorer usage' },
]

const CATEGORY_ORDER = ['Platform', 'AI', 'Tools', 'Integration', 'Services', 'Training']

interface Props {
  dealName: string | null
}

export default function SaPricebookBuilder({ dealName }: Props) {
  const [mode, setMode] = useState<'pricebook' | 'quote'>('pricebook')
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([])
  const [discountPct, setDiscountPct] = useState(0)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  const groupedItems = useMemo(() => {
    const groups: Record<string, PricebookItem[]> = {}
    for (const item of STARDOG_PRICEBOOK) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return CATEGORY_ORDER
      .filter(cat => groups[cat])
      .map(cat => ({ category: cat, items: groups[cat] }))
  }, [])

  const addToQuote = (item: PricebookItem) => {
    const exists = quoteItems.find(qi => qi.id === item.id)
    if (exists) {
      setQuoteItems(prev =>
        prev.map(qi => qi.id === item.id ? { ...qi, quantity: qi.quantity + 1 } : qi)
      )
    } else {
      setQuoteItems(prev => [...prev, { ...item, quantity: 1, selected: true }])
    }
    setMode('quote')
  }

  const removeFromQuote = (id: string) => {
    setQuoteItems(prev => prev.filter(qi => qi.id !== id))
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return
    setQuoteItems(prev =>
      prev.map(qi => qi.id === id ? { ...qi, quantity: qty } : qi)
    )
  }

  const toggleSelected = (id: string) => {
    setQuoteItems(prev =>
      prev.map(qi => qi.id === id ? { ...qi, selected: !qi.selected } : qi)
    )
  }

  const selectedItems = quoteItems.filter(qi => qi.selected)
  const subtotal = selectedItems.reduce((sum, qi) => sum + qi.msrp * qi.quantity, 0)
  const discount = subtotal * (discountPct / 100)
  const total = subtotal - discount

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val)

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'Platform': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'AI': return 'text-violet-400 bg-violet-500/10 border-violet-500/20'
      case 'Tools': return 'text-teal-400 bg-teal-500/10 border-teal-500/20'
      case 'Integration': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'Services': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Training': return 'text-pink-400 bg-pink-500/10 border-pink-500/20'
      default: return 'text-slate-400 bg-white/5 border-white/10'
    }
  }

  const generateSummary = async () => {
    if (selectedItems.length === 0) return
    setLoading(true)
    setError('')
    setSummary('')
    try {
      const r = await fetch('/api/sa-pricebook-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems: selectedItems.map(qi => ({
            product_name: qi.product_name,
            category: qi.category,
            msrp: qi.msrp,
            unit: qi.unit,
            quantity: qi.quantity,
            line_total: qi.msrp * qi.quantity,
          })),
          dealName,
          discountPct,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to generate summary')
      setSummary(d.summary)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Product', 'Category', 'MSRP', 'Unit', 'Qty', 'Line Total']
    const csvRows = selectedItems.map(qi =>
      [qi.product_name, qi.category, qi.msrp, qi.unit, qi.quantity, qi.msrp * qi.quantity]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    csvRows.push(`"","","","","Subtotal","${subtotal}"`)
    if (discountPct > 0) {
      csvRows.push(`"","","","","Discount (${discountPct}%)","${-discount}"`)
    }
    csvRows.push(`"","","","","Total","${total}"`)
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Quote-${dealName || 'draft'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Pricebook & Quote Builder</h2>
        <p className="text-sm text-slate-400">
          Browse the Stardog product catalog and build a quote with discounts.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        <button
          onClick={() => setMode('pricebook')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'pricebook'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 inline mr-1.5" />
          Pricebook
        </button>
        <button
          onClick={() => setMode('quote')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            mode === 'quote'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 inline mr-1.5" />
          Quote
          {quoteItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] text-white flex items-center justify-center">
              {quoteItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Pricebook mode */}
      {mode === 'pricebook' && (
        <div className="space-y-6">
          {groupedItems.map(group => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColor(group.category)}`}>
                  {group.category}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Product</th>
                      <th className="text-right px-4 py-2.5 text-slate-400 font-medium">MSRP</th>
                      <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Unit</th>
                      <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Notes</th>
                      <th className="text-center px-4 py-2.5 text-slate-400 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {group.items.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{item.product_name}</td>
                        <td className="px-4 py-3 text-slate-300 text-right font-mono">{formatCurrency(item.msrp)}</td>
                        <td className="px-4 py-3 text-slate-400">{item.unit}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.notes}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => addToQuote(item)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                            title="Add to quote"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote mode */}
      {mode === 'quote' && (
        <div className="space-y-5">
          {quoteItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No items in quote yet.</p>
              <button
                onClick={() => setMode('pricebook')}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Browse Pricebook
              </button>
            </div>
          ) : (
            <>
              {/* Line items */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-center px-3 py-2.5 w-10">
                        <input
                          type="checkbox"
                          checked={quoteItems.every(qi => qi.selected)}
                          onChange={e => setQuoteItems(prev => prev.map(qi => ({ ...qi, selected: e.target.checked })))}
                          className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
                        />
                      </th>
                      <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Product</th>
                      <th className="text-left px-4 py-2.5 text-slate-400 font-medium w-20">Category</th>
                      <th className="text-right px-4 py-2.5 text-slate-400 font-medium w-28">MSRP</th>
                      <th className="text-center px-4 py-2.5 text-slate-400 font-medium w-28">Qty</th>
                      <th className="text-right px-4 py-2.5 text-slate-400 font-medium w-28">Line Total</th>
                      <th className="text-center px-3 py-2.5 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {quoteItems.map(qi => (
                      <tr
                        key={qi.id}
                        className={`transition-colors ${qi.selected ? 'hover:bg-white/[0.02]' : 'opacity-40'}`}
                      >
                        <td className="text-center px-3 py-3">
                          <input
                            type="checkbox"
                            checked={qi.selected}
                            onChange={() => toggleSelected(qi.id)}
                            className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
                          />
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{qi.product_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${categoryColor(qi.category)}`}>
                            {qi.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-right font-mono">{formatCurrency(qi.msrp)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(qi.id, qi.quantity - 1)}
                              className="p-1 rounded hover:bg-white/5 text-slate-400"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={qi.quantity}
                              onChange={e => updateQuantity(qi.id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center px-1 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                              min={1}
                            />
                            <button
                              onClick={() => updateQuantity(qi.id, qi.quantity + 1)}
                              className="p-1 rounded hover:bg-white/5 text-slate-400"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white text-right font-mono font-medium">
                          {formatCurrency(qi.msrp * qi.quantity)}
                        </td>
                        <td className="text-center px-3 py-3">
                          <button
                            onClick={() => removeFromQuote(qi.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Discount</span>
                    <input
                      type="number"
                      value={discountPct}
                      onChange={e => setDiscountPct(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-16 text-center px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                      min={0}
                      max={100}
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                  <span className="text-red-400 font-mono">-{formatCurrency(discount)}</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-xl font-bold text-cyan-400 font-mono">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={generateSummary}
                  disabled={loading || selectedItems.length === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium text-sm hover:from-cyan-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Summary
                    </>
                  )}
                </button>
                <button
                  onClick={exportCSV}
                  disabled={selectedItems.length === 0}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
              )}

              {/* AI Summary */}
              {summary && (
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Quote Summary</h3>
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{summary}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
