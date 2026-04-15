import { useEffect, useState } from 'react'
import { getIncidents, resolveIncident } from '../api'
import { CheckCircle, Zap, Clock } from 'lucide-react'

export default function Incidents() {
  const [incidents, setIncidents] = useState([])
  const [resolving, setResolving] = useState(null)
  const [resText, setResText] = useState('')

  const load = () => getIncidents().then(r => setIncidents(r.data)).catch(() => {})

  useEffect(() => { load() }, [])

  const handleResolve = async (id) => {
    if (!resText.trim()) return
    await resolveIncident(id, resText)
    setResolving(null)
    setResText('')
    load()
  }

  const statusIcon = (s) => {
    if (s === 'auto_resolved') return <Zap size={14} className="text-indigo-400" />
    if (s === 'resolved')      return <CheckCircle size={14} className="text-green-400" />
    return <Clock size={14} className="text-yellow-400" />
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Incidents</h1>
      {incidents.length === 0 && <p className="text-gray-500 text-sm">No incidents yet. Fire an alert from the dashboard.</p>}
      {incidents.map(inc => (
        <div key={inc.id} className="card space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {statusIcon(inc.status)}
              <span className="font-medium text-sm">{inc.title}</span>
              <span className={`badge-${inc.severity}`}>{inc.severity}</span>
            </div>
            <span className="text-xs text-gray-500">{inc.source}</span>
          </div>

          {inc.root_cause && (
            <p className="text-xs text-gray-400">🧠 {inc.root_cause}</p>
          )}
          {inc.resolution && (
            <p className="text-xs text-green-400">✅ {inc.resolution}</p>
          )}

          {inc.status === 'open' && (
            resolving === inc.id ? (
              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 bg-[#0a0f1e] border border-[#1f2937] rounded px-2 py-1 text-xs"
                  placeholder="How was it resolved?"
                  value={resText}
                  onChange={e => setResText(e.target.value)}
                />
                <button onClick={() => handleResolve(inc.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded">Save</button>
                <button onClick={() => setResolving(null)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setResolving(inc.id)} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1">
                + Mark resolved
              </button>
            )
          )}
        </div>
      ))}
    </div>
  )
}
