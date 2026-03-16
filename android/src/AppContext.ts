import { createContext } from 'react'
import type { Finding, StoredFinding, SourceType, ScanHistoryEntry } from './types'
import type { ServerStatus } from './hooks/useServerManager'

export interface ServerManager {
  status: ServerStatus
  error: string | null
  start: () => Promise<void>
  stop: () => Promise<void>
  port: number
}

export interface AppContextValue {
  // Findings
  findings: StoredFinding[]
  addFindings: (findings: Finding[], jobId: string) => void
  clearAll: () => void
  clearByIds: (ids: Set<string>) => void
  clearUnverified: () => void
  removeOne: (id: string) => void

  // Scan history
  history: ScanHistoryEntry[]
  addEntry: (jobId: string, source: SourceType, label: string) => void
  completeEntry: (jobId: string, findingsCount: number) => void
  failEntry: (jobId: string, error: string) => void
  clearHistory: () => void

  // Active jobs
  activeJobIds: string[]
  addActiveJob: (id: string) => void
  removeActiveJob: (id: string) => void

  // Server
  serverManager: ServerManager

  // Share intent
  sharedUrl: string | null
  clearSharedUrl: () => void
}

export const AppContext = createContext<AppContextValue>({} as AppContextValue)
