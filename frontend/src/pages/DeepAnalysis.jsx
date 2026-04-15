/**
 * Deep Analysis — Gemini 2.5 Flash thinking mode for complex incidents
 */
import { useState } from 'react'
import { Brain, Plus, X, Loader } from 'lucide-react'
import axios from 'axios'

export default function DeepAnalysis() {
  const [form, setForm] = useState({
    incident_title: '',
    incident_description: '',
    affected_service: '',
    symptoms: [''],
  })
  const [tab, setTab] = useState('analysis') // analysis | runbook
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setSymptom = (i, v) => {
    const s = [...form.symptoms]
    s[i] = v
    setForm(f => ({ ...f, symptoms: s }))
  }

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      if (tab === 'analysis') {
        const res = await axios.post('/api/gemini/deep-analysis', {
          incident_title: form.incident_title,
          incident_description: form.incident_description,
          system_context: form.affected_service,
        })
        setResult(res.data)
      } else {
        const res = await axios.post('/api/gemini/runbook', {
          incident_type: form.incident_title,
          affected_service: form.affected_service,
          symptoms: form.symptoms.filter(Boolean),
        })
        setResult(res.data)
      }
    } catch (e) {
      setResult({ error: 'Request failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="text-indigo-400" /> Deep Analysis
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gemini 2.5 Flash with extended thinking for complex root cause analysis and runbook generation.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['analysis', 'runbook'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              tab === t ? 'bg-indigo-600 text-white' : 'bg-[#1f2937] text-gray-400 hover:text-white'
            }`}>
            {t === 'analysis' ? '🧠 Root Cause' : '📋 Runbook'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="card space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Incident Title *</label>
          <input className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="e.g. High CPU on prod-server-1"
            value={form.incident_title} onChange={e => set('incident_title', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Affected Service</label>
          <input className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="e.g. auth-service, payment-api"
            value={form.affected_service} onChange={e => set('affected_service', e.target.value)} />
        </div>
        {tab === 'analysis' && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              rows={3} placeholder="Describe what's happening..."
              value={form.incident_description} onChange={e => set('incident_description', e.target.value)} />
          </div>
        )}
        {tab === 'runbook' && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Symptoms</label>
            {form.symptoms.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="flex-1 bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder={`Symptom ${i + 1}`} value={s} onChange={e => setSymptom(i, e.target.value)} />
                {form.symptoms.length > 1 && (
                  <button onClick={() => setForm(f => ({ ...f, symptoms: f.symptoms.filter((_, j) => j !== i) }))}
                    className="text-gray-500 hover:text-red-400"><X size={16} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, symptoms: [...f.symptoms, ''] }))}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Plus size={13} /> Add symptom
            </button>
          </div>
        )}
        <button onClick={run} disabled={loading || !form.incident_title}
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-medium transition-colors flex items-center justify-center gap-2">
          {loading ? <><Loader size={15} className="animate-spin" /> Thinking...</> : tab === 'analysis' ? '🧠 Analyze' : '📋 Generate Runbook'}
        </button>
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="card">
          {result.error
            ? <p className="text-red-400 text-sm">{result.error}</p>
            : <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">
                {result.analysis || result.runbook}
              </pre>
          }
        </div>
      )}
    </div>
  )
}
