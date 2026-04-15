import { useEffect, useState } from 'react'
import { ingestAlert } from '../api'
import { ShieldCheck, Zap, AlertTriangle, CheckCircle, HardDrive, TrendingUp, Users, Clock, Flame } from 'lucide-react'
import axios from 'axios'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import * as mock from '../data/mockDashboard'

const MOCK_ALERTS = [
  { title: 'High CPU Usage', description: 'CPU at 95% on prod-server-1 for 10 minutes', severity: 'critical', source: 'prometheus' },
  { title: 'DB Connection Pool Exhausted', description: 'PostgreSQL connection pool at max capacity', severity: 'high', source: 'datadog' },
  { title: 'Memory Leak Detected', description: 'Heap memory growing unbounded in auth-service', severity: 'high', source: 'opsgenie' },
  { title: 'Disk Usage 92%', description: '/var/log partition at 92% on worker-node-3', severity: 'medium', source: 'prometheus' },
]

const SEV_COLORS  = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' }
const RISK_COLORS = { high: 'text-red-400 bg-red-500/10 border-red-500/20', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', low: 'text-green-400 bg-green-500/10 border-green-500/20' }
const TEAM_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899']

export default function Dashboard() {
  const [driveStatus, setDriveStatus]   = useState(null)
  const [driveSyncing, setDriveSyncing] = useState(false)
  const [firing, setFiring]             = useState(false)
  const [lastResult, setLastResult]     = useState(null)
  const [liveStats, setLiveStats]       = useState(null)

  useEffect(() => {
    axios.get('/api/incidents/stats/summary').then(r => setLiveStats(r.data)).catch(() => {})
    axios.get('/api/drive/status').then(r => setDriveStatus(r.data)).catch(() => {})
  }, [])

  const overview = {
    ...mock.overview,
    ...(liveStats ? { total: liveStats.total_incidents, open: liveStats.open, auto_healed: liveStats.auto_healed } : {})
  }

  const fireAlert = async (alert) => {
    setFiring(true)
    try {
      const res = await ingestAlert(alert)
      setLastResult(res.data)
      axios.get('/api/incidents/stats/summary').then(r => setLiveStats(r.data)).catch(() => {})
    } finally { setFiring(false) }
  }

  const triggerDriveSync = async () => {
    setDriveSyncing(true)
    await axios.post('/api/drive/sync').catch(() => {})
    setTimeout(() => {
      setDriveSyncing(false)
      axios.get('/api/drive/status').then(r => setDriveStatus(r.data)).catch(() => {})
    }, 3000)
  }

  const statCards = [
    { label: 'Total Incidents', value: overview.total,          icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Auto-Healed',     value: overview.auto_healed,    icon: Zap,           color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Open Now',        value: overview.open,           icon: Flame,         color: 'text-red-400',    bg: 'bg-red-500/10'    },
    { label: 'Critical',        value: overview.critical,       icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'MTTR (mins)',     value: overview.mttr_minutes,   icon: Clock,         color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { label: 'Auto-Heal Rate',  value: `${overview.auto_heal_rate}%`, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  const tt = { contentStyle: { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 } }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-indigo-400" /> Admin Dashboard
        </h1>
        <button onClick={triggerDriveSync} disabled={driveSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs transition-colors">
          <HardDrive size={13} className={driveSyncing ? 'animate-pulse' : ''} />
          {driveSyncing ? 'Syncing...' : `Sync Drive ${driveStatus ? `(${driveStatus.chunks_in_memory} chunks)` : ''}`}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card flex flex-col gap-2 ${bg} border-0`}>
            <Icon className={color} size={20} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Trend + Severity */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-indigo-400" /> Alert Trend (14 days)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={mock.trendData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip {...tt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total"    stroke="#6366f1" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} name="Critical" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">By Severity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={mock.sevData} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={65}
                label={({ severity, percent }) => `${severity} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {mock.sevData.map(e => <Cell key={e.severity} fill={SEV_COLORS[e.severity] || '#6b7280'} />)}
              </Pie>
              <Tooltip {...tt} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team + Service */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users size={15} className="text-indigo-400" /> Incidents by Team</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mock.teamData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis dataKey="team" type="category" tick={{ fontSize: 11, fill: '#9ca3af' }} width={90} />
              <Tooltip {...tt} />
              <Bar dataKey="total" name="Total" radius={[0,4,4,0]}>
                {mock.teamData.map((_, i) => <Cell key={i} fill={TEAM_COLORS[i % TEAM_COLORS.length]} />)}
              </Bar>
              <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Incidents by Service</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mock.serviceData}>
              <XAxis dataKey="service" tick={{ fontSize: 9, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip {...tt} />
              <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="open"  name="Open"  fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team risk + Risk areas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Team Risk Overview</h2>
          <div className="space-y-2">
            {mock.teamData.map(t => (
              <div key={t.team} className="flex items-center gap-3 py-1.5 border-b border-[#1f2937] last:border-0">
                <span className="text-sm text-gray-300 w-28 shrink-0">{t.team}</span>
                <div className="flex-1 bg-[#1f2937] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(t.total / mock.teamData[0].total) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{t.total}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${RISK_COLORS[t.risk_level]}`}>{t.risk_level}</span>
                <span className="text-xs text-gray-600 w-16 text-right">{t.mttr_minutes}m MTTR</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Flame size={15} className="text-red-400" /> Top Risk Areas</h2>
          <div className="space-y-2">
            {mock.riskAreas.map((r, i) => (
              <div key={r.area} className="flex items-center gap-3 py-1.5 border-b border-[#1f2937] last:border-0">
                <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                <span className="flex-1 text-xs text-gray-300 truncate">{r.area}</span>
                <span className="text-xs text-orange-400 shrink-0">{r.critical} crit</span>
                <div className="w-16 bg-[#1f2937] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${(r.score / mock.riskAreas[0].score) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fire alerts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">🔥 Simulate Alert</h2>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_ALERTS.map(a => (
              <button key={a.title} onClick={() => fireAlert(a)} disabled={firing}
                className="text-left p-2.5 rounded-lg border border-[#1f2937] hover:border-indigo-500 hover:bg-indigo-500/10 transition-all text-xs">
                <span className={`badge-${a.severity} mr-1.5`}>{a.severity}</span>{a.title}
              </button>
            ))}
          </div>
        </div>
        {lastResult && (
          <div className="card space-y-2">
            <h2 className="text-sm font-semibold text-indigo-300">🧠 Gemini Analysis</h2>
            <p className="text-xs text-gray-300"><span className="text-gray-500">Root cause: </span>{lastResult.analysis?.root_cause}</p>
            <p className="text-xs text-gray-300"><span className="text-gray-500">Duplicate: </span>{lastResult.analysis?.is_duplicate ? '✅ ' + lastResult.analysis?.duplicate_reason : 'No'}</p>
            <p className="text-xs text-gray-300"><span className="text-gray-500">Auto-heal: </span>{lastResult.auto_heal_triggered ? '⚡ ' + lastResult.analysis?.auto_heal_action : 'Not triggered'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
