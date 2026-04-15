import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Send, X, Sparkles } from 'lucide-react'
import axios from 'axios'

export default function Gems() {
  const [gems, setGems] = useState([])
  const [activeGem, setActiveGem] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', system_prompt: '', icon: '💎', model: 'gemini-2.5-flash', gem_url: '' })
  const bottomRef = useRef()

  useEffect(() => { loadGems() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadGems = () => axios.get('/api/gems/').then(r => setGems(r.data))

  const selectGem = (gem) => {
    setActiveGem(gem)
    setMessages([{ role: 'assistant', content: `Hi! I'm **${gem.name}** — ${gem.description}. How can I help?` }])
    setInput('')
  }

  const send = async () => {
    if (!input.trim() || !activeGem) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post(`/api/gems/${activeGem.id}/chat`, { message: msg, conversation_history: history })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response || res.data.error }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to Gem.' }])
    } finally {
      setLoading(false)
    }
  }

  const createGem = async () => {
    if (!form.name || !form.system_prompt) return
    await axios.post('/api/gems/', form)
    setShowCreate(false)
    setForm({ name: '', description: '', system_prompt: '', icon: '💎', model: 'gemini-2.5-flash' })
    loadGems()
  }

  const deleteGem = async (id, e) => {
    e.stopPropagation()
    await axios.delete(`/api/gems/${id}`)
    if (activeGem?.id === id) setActiveGem(null)
    loadGems()
  }

  const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']
  const ICONS = ['💎', '🔥', '🚨', '📋', '📝', '💰', '🤖', '🧠', '⚡', '🛡️']

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 overflow-hidden -mx-6 -mt-6">

      {/* ── Gems list ── */}
      <div className="w-64 shrink-0 border-r border-[#1f2937] flex flex-col bg-[#0d1117]">
        <div className="p-4 border-b border-[#1f2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold">My Gems</span>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {gems.map(gem => (
            <div key={gem.id} onClick={() => selectGem(gem)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                activeGem?.id === gem.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-gray-400'
              }`}>
              <span className="text-lg shrink-0">{gem.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-200">{gem.name}</p>
                <p className="text-xs text-gray-500 truncate">{gem.description}</p>
              </div>
              <button onClick={(e) => deleteGem(gem.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col">
        {activeGem ? (
          <>
            {/* Header */}
            <div className="px-6 py-3 border-b border-[#1f2937] flex items-center gap-3 bg-[#0d1117]">
              <span className="text-2xl">{activeGem.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-200">{activeGem.name}</p>
                <p className="text-xs text-gray-500">{activeGem.description} · {activeGem.model}</p>
              </div>
              {activeGem.gem_url && (
                <a href={activeGem.gem_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/40 text-xs transition-colors">
                  <Sparkles size={12} />
                  Open in Gemini
                </a>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <span className="text-xl mr-2 mt-1 shrink-0">{activeGem.icon}</span>
                  )}
                  <div className={`max-w-[75%] text-sm px-4 py-3 rounded-2xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-[#1f2937] text-gray-200 rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <span className="text-xl mr-2">{activeGem.icon}</span>
                  <div className="bg-[#1f2937] text-gray-400 text-sm px-4 py-3 rounded-2xl animate-pulse">thinking...</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#1f2937] flex gap-2">
              <input
                className="flex-1 bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-600"
                placeholder={`Ask ${activeGem.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
              />
              <button onClick={send} disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <Sparkles size={48} className="text-indigo-400 opacity-50" />
            <p className="text-gray-400">Select a Gem to start chatting</p>
            <p className="text-xs text-gray-600">Each Gem is a specialized AI persona with a custom system prompt</p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-colors">
              <Plus size={15} /> Create your own Gem
            </button>
          </div>
        )}
      </div>

      {/* ── Create Gem modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Sparkles size={18} className="text-indigo-400" /> Create Gem</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            {/* Icon picker */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                    className={`text-xl p-1.5 rounded-lg transition-colors ${form.icon === ic ? 'bg-indigo-500/30 ring-1 ring-indigo-400' : 'hover:bg-white/10'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                <input className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. DB Expert" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Model</label>
                <select className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="What does this Gem do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">System Prompt * <span className="text-gray-600">(defines the Gem's personality)</span></label>
              <textarea className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                rows={5} placeholder="You are an expert in... Your job is to... Always respond with..."
                value={form.system_prompt} onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Published Gemini Gem URL <span className="text-gray-600">(optional — paste your gemini.google.com/gems/share/... link)</span>
              </label>
              <input className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="https://gemini.google.com/gems/share/..."
                value={form.gem_url} onChange={e => setForm(f => ({ ...f, gem_url: e.target.value }))} />
            </div>

            <button onClick={createGem} disabled={!form.name || !form.system_prompt}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-medium transition-colors">
              Create Gem
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
