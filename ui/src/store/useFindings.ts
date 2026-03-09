import { useState, useCallback } from 'react'
import type { Finding, StoredFinding } from '../types'

const STORAGE_KEY = 'sp_findings'

function load(): StoredFinding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredFinding[]) : []
  } catch {
    return []
  }
}

function save(findings: StoredFinding[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(findings))
  } catch {
    // Quota exceeded — silently continue; data is still in state.
  }
}

export function useFindings() {
  const [findings, setFindings] = useState<StoredFinding[]>(load)

  const update = useCallback((next: StoredFinding[]) => {
    setFindings(next)
    save(next)
  }, [])

  const addFindings = useCallback(
    (incoming: Finding[], jobId: string) => {
      const now = new Date().toISOString()
      const stored: StoredFinding[] = incoming.map(f => ({
        ...f,
        _id: crypto.randomUUID(),
        _jobId: jobId,
        _scannedAt: now,
      }))
      setFindings(prev => {
        const next = [...stored, ...prev]
        save(next)
        return next
      })
    },
    [],
  )

  const clearAll = useCallback(() => update([]), [update])

  const clearByIds = useCallback(
    (ids: Set<string>) => {
      update(findings.filter(f => !ids.has(f._id)))
    },
    [findings, update],
  )

  const clearUnverified = useCallback(() => {
    update(findings.filter(f => f.verified))
  }, [findings, update])

  const removeOne = useCallback(
    (id: string) => {
      update(findings.filter(f => f._id !== id))
    },
    [findings, update],
  )

  return { findings, addFindings, clearAll, clearByIds, clearUnverified, removeOne }
}
