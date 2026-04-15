import { useState, useEffect } from 'react'
import { DollarSign, Users, Clock, TrendingDown, AlertTriangle, Loader } from 'lucide-react'
import axios from 'axios'

export default function BusinessImpact() {
  const [summary, setSummary] = useState(null)
  const [calc, setCalc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', severity: 'high', duration_minutes: 30,
    affected_service: '', monthly_revenue: 1000000,
    monthly_active_users: 100000, sla_target_percent: 99.9
  })

  useEffect(() => { loadSummary() }, [])

  const loadSummary = () =>
    axios.get('/api/impact/summary').then(r => setSummary(r.data)).catch(() => {})

  const calculate = async () => {
    setLoading(true)
    setCalc(null)
    try {
      const res = await axios.post('/api/impact/calculate', form)
      setCalc(res.data)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const fmtN = (n) => new Intl.NumberFormat('en-US').format(n)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-green-400" /> Business Impact
        </h1>
        <p className="text-sm text-gray-500 mt-1">Real dollar cost, user impact, and SLA risk for every incident — powered by Gemini.</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Total Cost (all incidents)</p>
            <p className="text-2xl font-bold text-red-400">{fmt(summary.total_cost)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Users Affected</p>
            <p className="text-2xl font-bold text-yellow-400">{fmtN(summary.total_users_affected)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Total Incidents</p>
            <p className="text-2xl font-bold text-indigo-400">{summary.incident_count}</p>
          </div>
        </div>
      )}

      {/* Top incidents by cost */}
      {summary?.breakdown?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Top Incidents by Cost</h2>
          <div className="space-y-2">
            {summary.breakdown.map((inc, i) => (
              <div key={inc.id} className="flex items-center gap-3 py-2 border-b border-[#1f2937] last:border-0">
                <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                <span className={`badge-${inc.severity}`}>{inc.severity}</span>
                <span className="flex-1 text-sm text-gray-300 truncate">{inc.title}</span>
                <span className="text-sm font-medium text-red-400">{fmt(inc.cost)}</span>
                <span className="text-xs text-gray-500">{fmtN(inc.users)} users</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculator */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <TrendingDown size={16} className="text-indigo-400" /> Impact Calculator
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Incident Title</label>
            <input className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="e.g. DB Connection Pool Exhausted"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Severity</label>
            <select className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Duration (minutes)</label>
            <input type="number" className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: +e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Monthly Revenue ($)</label>
            <input type="number" className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={form.monthly_revenue} onChange={e => setForm(f => ({ ...f, monthly_revenue: +e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Monthly Active Users</label>
            <input type="number" className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={form.monthly_active_users} onChange={e => setForm(f => ({ ...f, monthly_active_users: +e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">SLA Target (%)</label>
            <input type="number" step="0.1" className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={form.sla_target_percent} onChange={e => setForm(f => ({ ...f, sla_target_percent: +e.target.value }))} />
          </div>
        </div>

        <button onClick={calculate} disabled={loading || !form.title}
          className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 text-sm font-medium transition-colors flex items-center justify-center gap-2">
          {loading ? <><Loader size={15} className="animate-spin" /> Calculating...</> : '💰 Calculate Business Impact'}
        </button>
      </div>

      {/* Result */}
      {calc && !loading && (
        <div className="card space-y-4">
          {calc.error ? <p className="text-red-400 text-sm">{calc.error}</p> : (
            <>
              {/* Executive summary */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                <p className="text-xs text-indigo-400 mb-1 font-medium">Executive Summary</p>
                <p className="text-sm text-gray-200 leading-relaxed">{calc.executive_summary}</p>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-red-400" />
                    <span className="text-xs text-gray-500">Total Cost</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{fmt(calc.total_cost)}</p>
                  <p className="text-xs text-gray-600 mt-1">Revenue: {fmt(calc.revenue_lost)} · Eng: {fmt(calc.engineering_cost)}</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-yellow-400" />
                    <span className="text-xs text-gray-500">Users Affected</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">{fmtN(calc.users_affected)}</p>
                  <p className="text-xs text-gray-600 mt-1">{calc.engineers_involved} engineers involved</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-blue-400" />
                    <span className="text-xs text-gray-500">Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{calc.duration_minutes}m</p>
                  <p className="text-xs text-gray-600 mt-1">{fmt(calc.total_cost / calc.duration_minutes)}/min</p>
                </div>

                <div className={`${calc.sla_at_risk ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'} border rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} className={calc.sla_at_risk ? 'text-red-400' : 'text-green-400'} />
                    <span className="text-xs text-gray-500">SLA Impact</span>
                  </div>
                  <p className={`text-2xl font-bold ${calc.sla_at_risk ? 'text-red-400' : 'text-green-400'}`}>
                    {calc.downtime_percent.toFixed(4)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{calc.sla_at_risk ? '⚠️ SLA at risk' : '✅ Within SLA'}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
