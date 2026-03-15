import { useState, useMemo, useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { useFindings } from './store/useFindings'
import { useScanHistory, labelForRequest } from './store/useScanHistory'
import { api, setApiToken } from './api/client'
import Header from './components/Header'
import StartScanModal from './components/StartScanModal'
import FilterBar from './components/FilterBar'
import ResultsViewer from './components/ResultsViewer'
import JobsPanel from './components/JobsPanel'
import ScanHistory from './components/ScanHistory'
import AuthModal from './components/AuthModal'
import type { FilterState, Finding, ScanRequest } from './types'

const TOKEN_STORAGE_KEY = 'sp_auth_token'

const DEFAULT_FILTER: FilterState = {
  detectors: [],
  verified: 'all',
  sourceSearch: '',
}

export default function App() {
  const { theme, toggle } = useTheme()
  const { findings, addFindings, clearAll, clearByIds, clearUnverified, removeOne } = useFindings()
  const { history, addEntry, completeEntry, failEntry, clearHistory } = useScanHistory()
  const [scanOpen, setScanOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER)
  const [authMode, setAuthMode] = useState<string | null>(null)

  // Active (non-completed) job IDs tracked by JobsPanel
  const [activeJobIds, setActiveJobIds] = useState<string[]>([])

  // Check auth requirements on mount
  useEffect(() => {
    api.checkAuth().then(({ auth_required, mode }) => {
      if (!auth_required) return
      // Restore saved token if present
      const saved = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (saved) {
        setApiToken(saved)
      } else {
        setAuthMode(mode)
      }
    }).catch(() => {}) // Ignore errors — proceed unauthenticated
  }, [])

  const filtered = useMemo(() => {
    return findings.filter(f => {
      if (filters.jobId && f._jobId !== filters.jobId) return false
      if (filters.verified === 'verified' && !f.verified) return false
      if (filters.verified === 'unverified' && f.verified) return false
      if (
        filters.detectors.length > 0 &&
        !filters.detectors.includes(f.detector_name)
      )
        return false
      if (
        filters.sourceSearch &&
        !f.source_name.toLowerCase().includes(filters.sourceSearch.toLowerCase())
      )
        return false
      return true
    })
  }, [findings, filters])

  const filteredIds = useMemo(() => new Set(filtered.map(f => f._id)), [filtered])

  const unverifiedCount = useMemo(() => findings.filter(f => !f.verified).length, [findings])

  function handleNewFindings(incoming: Finding[], jobId: string, req?: ScanRequest) {
    addFindings(incoming, jobId)
    if (req) {
      addEntry(jobId, req.source, labelForRequest(req))
      completeEntry(jobId, incoming.length)
    }
  }

  function handleJobStarted(jobId: string, req?: ScanRequest) {
    setActiveJobIds(prev => [...prev, jobId])
    if (req) addEntry(jobId, req.source, labelForRequest(req))
  }

  function handleJobDone(jobId: string, newFindings: Finding[]) {
    setActiveJobIds(prev => prev.filter(id => id !== jobId))
    addFindings(newFindings, jobId)
    completeEntry(jobId, newFindings.length)
  }

  function handleJobFailed(jobId: string, error: string) {
    setActiveJobIds(prev => prev.filter(id => id !== jobId))
    failEntry(jobId, error)
  }

  async function handleQuickScan(uri: string) {
    const req: ScanRequest = { source: 'git', verify: true, git: { uri } }
    const { job_id } = await api.startScan(req)
    handleJobStarted(job_id, req)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        theme={theme}
        onToggleTheme={toggle}
        onStartScan={() => setScanOpen(true)}
        onQuickScan={handleQuickScan}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-4">
        {activeJobIds.length > 0 && (
          <JobsPanel
            jobIds={activeJobIds}
            onJobComplete={handleJobDone}
            onJobFail={handleJobFailed}
            onJobRemove={id => setActiveJobIds(prev => prev.filter(j => j !== id))}
          />
        )}

        <ScanHistory
          history={history}
          onViewFindings={jobId => setFilters(f => ({ ...f, jobId }))}
          onClearHistory={clearHistory}
        />

        {findings.length > 0 ? (
          <>
            <FilterBar
              findings={findings}
              filters={filters}
              filtered={filtered}
              onChange={setFilters}
            />
            <ResultsViewer
              filtered={filtered}
              filteredIds={filteredIds}
              unverifiedCount={unverifiedCount}
              totalCount={findings.length}
              onClearAll={clearAll}
              onClearFiltered={() => { clearByIds(filteredIds); setFilters(DEFAULT_FILTER) }}
              onClearUnverified={clearUnverified}
              onRemoveFinding={removeOne}
            />
          </>
        ) : (
          <EmptyState onStartScan={() => setScanOpen(true)} />
        )}
      </main>

      <StartScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onInstantResult={(findings, jobId, req) => handleNewFindings(findings, jobId, req)}
        onBackgroundStart={(jobId, req) => handleJobStarted(jobId, req)}
      />

      <AuthModal
        mode={authMode ?? ''}
        open={authMode !== null}
        onSubmit={token => {
          setApiToken(token)
          localStorage.setItem(TOKEN_STORAGE_KEY, token)
          setAuthMode(null)
        }}
      />
    </div>
  )
}

function EmptyState({ onStartScan }: { onStartScan: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        No findings yet
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        Start a scan to discover secrets across your repositories, filesystems, S3 buckets, or
        container images.
      </p>
      <button className="btn-primary" onClick={onStartScan}>
        Start your first scan
      </button>
    </div>
  )
}
