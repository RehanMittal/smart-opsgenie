/**
 * Doc Analyzer — Upload any file, Gemini reads it natively via Files API
 */
import { useState, useRef } from 'react'
import { Upload, FileText, Loader } from 'lucide-react'
import axios from 'axios'

export default function DocAnalyzer() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const analyze = async (f) => {
    if (!f) return
    setFile(f)
    setLoading(true)
    setResult(null)
    const form = new FormData()
    form.append('file', f)
    try {
      const res = await axios.post('/api/gemini/analyze-doc', form)
      setResult(res.data)
    } catch (e) {
      setResult({ error: e.response?.data?.detail || 'Analysis failed' })
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) analyze(f)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-indigo-400" /> Doc Analyzer
        </h1>
        <p className="text-sm text-gray-500 mt-1">Upload any PDF, doc, or image — Gemini reads it natively and extracts incidents, root causes, and action items.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-[#1f2937] hover:border-indigo-500 hover:bg-white/5'
        }`}
      >
        <Upload className="mx-auto mb-3 text-gray-500" size={32} />
        <p className="text-sm text-gray-400">Drop a file here or <span className="text-indigo-400">click to browse</span></p>
        <p className="text-xs text-gray-600 mt-1">PDF, DOCX, TXT, PNG, JPG supported</p>
        <input ref={inputRef} type="file" className="hidden" onChange={e => analyze(e.target.files[0])} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="card flex items-center gap-3">
          <Loader className="animate-spin text-indigo-400" size={18} />
          <span className="text-sm text-gray-400">Gemini is reading <span className="text-white">{file?.name}</span>...</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="card space-y-3">
          {result.error ? (
            <p className="text-red-400 text-sm">{result.error}</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-300">{result.filename}</p>
                <span className="text-xs text-gray-500">Gemini Files API</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">{result.analysis}</pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
