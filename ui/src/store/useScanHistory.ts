import { useState, useCallback } from 'react'
import type { ScanHistoryEntry, SourceType, ScanRequest } from '../types'

const STORAGE_KEY = 'sp_scan_history'

function load(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ScanHistoryEntry[]) : []
  } catch {
    return []
  }
}

function save(entries: ScanHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Quota exceeded — silently continue
  }
}

export function labelForRequest(req: ScanRequest): string {
  switch (req.source) {
    case 'git':        return req.git?.uri ?? ''
    case 'github':     return req.github?.orgs?.join(', ') || req.github?.repos?.join(', ') || 'GitHub'
    case 'gitlab':     return req.gitlab?.repos?.join(', ') || req.gitlab?.endpoint || 'GitLab'
    case 'filesystem': return req.filesystem?.paths?.join(', ') ?? ''
    case 's3':         return req.s3?.buckets?.join(', ') || 'S3'
    case 'docker':     return req.docker?.images?.join(', ') ?? ''
  }
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>(load)

  const update = useCallback((next: ScanHistoryEntry[]) => {
    setHistory(next)
    save(next)
  }, [])

  const addEntry = useCallback(
    (jobId: string, source: SourceType, label: string) => {
      const entry: ScanHistoryEntry = {
        jobId,
        source,
        label,
        startedAt: new Date().toISOString(),
        findingsCount: 0,
        status: 'running',
      }
      setHistory(prev => {
        const next = [entry, ...prev]
        save(next)
        return next
      })
    },
    [],
  )

  const completeEntry = useCallback(
    (jobId: string, findingsCount: number) => {
      setHistory(prev => {
        const next = prev.map(e =>
          e.jobId === jobId
            ? { ...e, status: 'completed' as const, endedAt: new Date().toISOString(), findingsCount }
            : e,
        )
        save(next)
        return next
      })
    },
    [],
  )

  const failEntry = useCallback(
    (jobId: string, error: string) => {
      setHistory(prev => {
        const next = prev.map(e =>
          e.jobId === jobId
            ? { ...e, status: 'failed' as const, endedAt: new Date().toISOString(), error }
            : e,
        )
        save(next)
        return next
      })
    },
    [],
  )

  const clearHistory = useCallback(() => update([]), [update])

  return { history, addEntry, completeEntry, failEntry, clearHistory }
}
