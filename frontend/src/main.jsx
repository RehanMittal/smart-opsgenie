import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import AvatarAssistant from './pages/AvatarAssistant'
import DocAnalyzer from './pages/DocAnalyzer'
import DeepAnalysis from './pages/DeepAnalysis'
import WebSearch from './pages/WebSearch'
import Gems from './pages/Gems'
import BusinessImpact from './pages/BusinessImpact'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="assistant" element={<AvatarAssistant />} />
        <Route path="doc-analyzer" element={<DocAnalyzer />} />
        <Route path="deep-analysis" element={<DeepAnalysis />} />
        <Route path="web-search" element={<WebSearch />} />
        <Route path="gems" element={<Gems />} />
        <Route path="impact" element={<BusinessImpact />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
