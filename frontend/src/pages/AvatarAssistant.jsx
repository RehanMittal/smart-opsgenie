import { useState, useRef, useEffect } from 'react'
import { chatAssistant } from '../api'
import { Mic, MicOff, Send } from 'lucide-react'
import AvatarFrame from '../components/AvatarFrame'

export default function AvatarAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey, I'm Aegis — your AI incident engineer. Ask me about any alert or incident." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarSpeaking, setAvatarSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await chatAssistant({ message: msg, conversation_history: history })
      const reply = res.data.response
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      speakText(reply)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Is the backend running?' }])
    } finally {
      setLoading(false)
    }
  }

  const speakText = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google'))
    if (preferred) utt.voice = preferred
    utt.onstart = () => setAvatarSpeaking(true)
    utt.onend   = () => setAvatarSpeaking(false)
    window.speechSynthesis.speak(utt)
  }

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported.')
      return
    }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e) => { setListening(false); send(e.results[0][0].transcript) }
    rec.onerror = () => setListening(false)
    rec.onend   = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden">

      {/* ── Center — Avatar centered vertically ── */}
      <div className="flex-1 min-w-0 flex items-center justify-center p-3">
        <div className="w-full" style={{ maxHeight: 'calc(100vh - 24px)', aspectRatio: '16/9' }}>
          <AvatarFrame speaking={avatarSpeaking} />
        </div>
      </div>

      {/* ── Right — Chat panel ── */}
      <div className="w-80 shrink-0 flex flex-col border-l border-[#1f2937] bg-[#0d1117]">

        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1f2937] flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${avatarSpeaking ? 'bg-indigo-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-sm font-semibold text-gray-200">Ask Aegis</span>
          <span className="text-xs text-gray-500 ml-auto">Gemini + Drive</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${
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
              <div className="bg-[#1f2937] text-gray-400 text-xs px-3 py-2 rounded-2xl animate-pulse">
                thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[#1f2937] flex gap-2">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-lg border transition-colors shrink-0 ${
              listening
                ? 'border-red-500 bg-red-500/20 text-red-400'
                : 'border-[#1f2937] text-gray-400 hover:text-white hover:border-indigo-500'
            }`}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <input
            className="flex-1 min-w-0 bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            placeholder="Ask about incidents or docs..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
