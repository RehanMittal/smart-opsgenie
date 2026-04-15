export const overview = {
  total: 28, open: 6, auto_healed: 9, critical: 8,
  mttr_minutes: 34.2, auto_heal_rate: 32.1, last_7d_count: 11
}

export const teamData = [
  { team: 'Backend',        total: 6, critical: 2, open: 1, auto_healed: 1, mttr_minutes: 28, risk_level: 'high'   },
  { team: 'Infrastructure', total: 5, critical: 2, open: 1, auto_healed: 2, mttr_minutes: 41, risk_level: 'high'   },
  { team: 'Platform',       total: 4, critical: 2, open: 1, auto_healed: 1, mttr_minutes: 22, risk_level: 'high'   },
  { team: 'Data',           total: 4, critical: 1, open: 1, auto_healed: 1, mttr_minutes: 55, risk_level: 'medium' },
  { team: 'Security',       total: 3, critical: 2, open: 0, auto_healed: 0, mttr_minutes: 19, risk_level: 'medium' },
  { team: 'Frontend',       total: 3, critical: 2, open: 1, auto_healed: 0, mttr_minutes: 15, risk_level: 'medium' },
  { team: 'DevOps',         total: 3, critical: 0, open: 1, auto_healed: 2, mttr_minutes: 38, risk_level: 'low'    },
]

export const sevData = [
  { severity: 'critical', count: 8 },
  { severity: 'high',     count: 11 },
  { severity: 'medium',   count: 6 },
  { severity: 'low',      count: 3 },
]

export const serviceData = [
  { service: 'api-gateway',   total: 7, critical: 2, open: 2 },
  { service: 'db-cluster',    total: 5, critical: 2, open: 0 },
  { service: 'web-app',       total: 5, critical: 2, open: 2 },
  { service: 'auth-service',  total: 4, critical: 1, open: 0 },
  { service: 'data-pipeline', total: 4, critical: 1, open: 1 },
  { service: 'monitoring',    total: 3, critical: 1, open: 1 },
]

export const trendData = [
  { date: '04/01', total: 1, critical: 0, resolved: 1 },
  { date: '04/02', total: 2, critical: 1, resolved: 1 },
  { date: '04/03', total: 3, critical: 1, resolved: 2 },
  { date: '04/04', total: 2, critical: 0, resolved: 2 },
  { date: '04/05', total: 4, critical: 2, resolved: 3 },
  { date: '04/06', total: 1, critical: 0, resolved: 1 },
  { date: '04/07', total: 2, critical: 1, resolved: 1 },
  { date: '04/08', total: 3, critical: 1, resolved: 2 },
  { date: '04/09', total: 5, critical: 2, resolved: 4 },
  { date: '04/10', total: 2, critical: 0, resolved: 2 },
  { date: '04/11', total: 1, critical: 1, resolved: 0 },
  { date: '04/12', total: 3, critical: 1, resolved: 2 },
  { date: '04/13', total: 4, critical: 2, resolved: 2 },
  { date: '04/14', total: 2, critical: 1, resolved: 0 },
]

export const riskAreas = [
  { area: 'Backend / db-cluster',         incidents: 4, critical: 2, score: 14 },
  { area: 'Infrastructure / monitoring',  incidents: 4, critical: 2, score: 13 },
  { area: 'Platform / api-gateway',       incidents: 4, critical: 2, score: 13 },
  { area: 'Security / auth-service',      incidents: 3, critical: 2, score: 11 },
  { area: 'Frontend / web-app',           incidents: 3, critical: 2, score: 10 },
  { area: 'Data / data-pipeline',         incidents: 3, critical: 1, score: 9  },
  { area: 'Backend / payment-api',        incidents: 2, critical: 1, score: 7  },
  { area: 'DevOps / monitoring',          incidents: 3, critical: 0, score: 5  },
]
