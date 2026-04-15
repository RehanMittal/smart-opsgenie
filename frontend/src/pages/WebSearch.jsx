/**
 * Web Search — Gemini grounded with Google Search for real-time SRE answers
 */
import { useState } from 'react'
import { Globe, Search, Loader } from 'lucide-react'
import axios from 'axios'

const QUICK = [
  'What are the latest best practices for Kubernetes pod crash debugging?',
  'How to fix PostgreSQL connection pool exhaustion?',
  'CrowdStrike Falcon sensor high CPU fix',
  'AWS Auto Scaling Group SNS notification setup',
  'TIBCO EMS monitoring best practices',
]

export default function WebSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const search = async (q) => {
    const question = q || query
    if (!question.trim()) return
    setQuery(question)
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post('/api/gemini/search-web', { query: question })
      setResult(res.data)
    } catch {
      setResult({ error: 'Search failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="text-indigo-400" /> Web Search
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gemini answers SRE questions grounded with real-time Google Search.</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-600"
          placeholder="Ask anything about incidents, tools, fixes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button onClick={() => search()} disabled={loading || !query.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors">
          <Search size={16} />
        </button>
      </div>

      {/* Quick searches */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Quick searches from your incident history:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map(q => (
            <button key={q} onClick={() => search(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#1f2937] text-gray-400 hover:border-indigo-500 hover:text-white transition-colors">
              {q.length > 50 ? q.slice(0, 50) + '...' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card flex items-center gap-3">
          <Loader className="animate-spin text-indigo-400" size={18} />
          <span className="text-sm text-gray-400">Searching with Gemini...</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="card space-y-2">
          {result.error
            ? <p className="text-red-400 text-sm">{result.error}</p>
            : <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-indigo-300 font-medium">{result.query}</p>
                  {result.note && <span className="text-xs text-gray-600">{result.note}</span>}
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">{result.answer}</pre>
              </>
          }
        </div>
      )}
    </div>
  )
}
