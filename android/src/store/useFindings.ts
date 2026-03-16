import { useState, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Finding, StoredFinding } from '../types'

const STORAGE_KEY = 'sp_findings'

// Unique IDs without crypto.randomUUID (not always available in RN Hermes)
let _counter = 0
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${_counter++}`
}

async function load(): Promise<StoredFinding[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredFinding[]) : []
  } catch {
    return []
  }
}

async function save(findings: StoredFinding[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(findings))
  } catch {
    // Quota exceeded — silently continue; data is still in state.
  }
}

export function useFindings() {
  const [findings, setFindings] = useState<StoredFinding[]>([])
  const [loaded, setLoaded]     = useState(false)

  useEffect(() => {
    load().then(data => {
      setFindings(data)
      setLoaded(true)
    })
  }, [])

  const update = useCallback((next: StoredFinding[]) => {
    setFindings(next)
    save(next)
  }, [])

  const addFindings = useCallback(
    (incoming: Finding[], jobId: string) => {
      const now = new Date().toISOString()
      const stored: StoredFinding[] = incoming.map(f => ({
        ...f,
        _id: uid(),
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
      setFindings(prev => {
        const next = prev.filter(f => !ids.has(f._id))
        save(next)
        return next
      })
    },
    [],
  )

  const clearUnverified = useCallback(() => {
    setFindings(prev => {
      const next = prev.filter(f => f.verified)
      save(next)
      return next
    })
  }, [])

  const removeOne = useCallback((id: string) => {
    setFindings(prev => {
      const next = prev.filter(f => f._id !== id)
      save(next)
      return next
    })
  }, [])

  return { findings, loaded, addFindings, clearAll, clearByIds, clearUnverified, removeOne }
}
