import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getAlerts      = ()           => api.get('/alerts/')
export const ingestAlert    = (data)       => api.post('/alerts/ingest', data)
export const getIncidents   = ()           => api.get('/incidents/')
export const getStats       = ()           => api.get('/incidents/stats/summary')
export const resolveIncident = (id, res)  => api.post(`/incidents/${id}/resolve`, { resolution: res })
export const chatAssistant  = (data)       => api.post('/assistant/chat', data)
export const getHealHistory = ()           => api.get('/autoheal/history')
