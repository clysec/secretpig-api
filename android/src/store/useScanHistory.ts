import { useState, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ScanHistoryEntry, SourceType, ScanRequest } from '../types'

const STORAGE_KEY = 'sp_scan_history'

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

async function load(): Promise<ScanHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ScanHistoryEntry[]) : []
  } catch {
    return []
  }
}

async function persist(entries: ScanHistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {}
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([])

  useEffect(() => {
    load().then(setHistory)
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
        persist(next)
        return next
      })
    },
    [],
  )

  const completeEntry = useCallback((jobId: string, findingsCount: number) => {
    setHistory(prev => {
      const next = prev.map(e =>
        e.jobId === jobId
          ? { ...e, status: 'completed' as const, endedAt: new Date().toISOString(), findingsCount }
          : e,
      )
      persist(next)
      return next
    })
  }, [])

  const failEntry = useCallback((jobId: string, error: string) => {
    setHistory(prev => {
      const next = prev.map(e =>
        e.jobId === jobId
          ? { ...e, status: 'failed' as const, endedAt: new Date().toISOString(), error }
          : e,
      )
      persist(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    AsyncStorage.removeItem(STORAGE_KEY)
  }, [])

  return { history, addEntry, completeEntry, failEntry, clearHistory }
}
