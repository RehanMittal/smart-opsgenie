import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard, AlertTriangle, Bot, FileText, Brain, Globe, Sparkles, DollarSign, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

const nav = [
  { to: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/incidents',     label: 'Incidents',    icon: AlertTriangle },
  { to: '/assistant',     label: 'Aegis AI',     icon: Bot },
  { to: '/doc-analyzer',  label: 'Doc Analyzer', icon: FileText },
  { to: '/deep-analysis', label: 'Deep Analysis',icon: Brain },
  { to: '/web-search',    label: 'Web Search',   icon: Globe },
  { to: '/gems',          label: 'Gems',          icon: Sparkles },
  { to: '/impact',        label: 'Biz Impact',    icon: DollarSign },
]

export default function Layout() {
  const { pathname } = useLocation()
  const isAssistant = pathname === '/assistant'
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className={`flex h-screen overflow-hidden ${dark ? 'bg-[#0a0f1e] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`w-56 flex flex-col p-4 gap-2 shrink-0 border-r ${dark ? 'bg-[#111827] border-[#1f2937]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-400" size={22} />
            <span className="font-bold text-lg tracking-tight">Aegis AI</span>
          </div>
          <button
            onClick={() => setDark(d => !d)}
            className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-white/10 text-gray-400 hover:text-yellow-300' : 'hover:bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {nav.slice(0, 3).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-500'
                  : dark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}>
            <Icon size={16} />{label}
          </NavLink>
        ))}

        <div className={`border-t my-2 ${dark ? 'border-[#1f2937]' : 'border-gray-200'}`} />
        <p className={`text-xs px-3 mb-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Gemini Features</p>

        {nav.slice(3).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-500'
                  : dark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
      </aside>

      {/* Main */}
      <main className={`flex-1 overflow-hidden ${isAssistant ? '' : 'p-6 overflow-y-auto'}`}>
        <Outlet />
      </main>
    </div>
  )
}
