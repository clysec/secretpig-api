import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle, XCircle, ChevronDown, ChevronRight, X } from 'lucide-react'
import { api } from '../api/client'
import { useJobPoller } from '../hooks/useJobPoller'
import type { Job, Finding } from '../types'

interface JobEntry {
  id: string
  status: Job['status']
  error?: string
  findingsCount: number
}

interface Props {
  jobIds: string[]
  onJobComplete: (jobId: string, findings: Finding[]) => void
  onJobRemove: (jobId: string) => void
}

export default function JobsPanel({ jobIds, onJobComplete, onJobRemove }: Props) {
  const [jobs, setJobs] = useState<Record<string, JobEntry>>(() =>
    Object.fromEntries(jobIds.map(id => [id, { id, status: 'pending', findingsCount: 0 }])),
  )
  const [expanded, setExpanded] = useState(true)

  // Sync when new jobIds arrive
  useEffect(() => {
    setJobs(prev => {
      const next = { ...prev }
      for (const id of jobIds) {
        if (!next[id]) next[id] = { id, status: 'pending', findingsCount: 0 }
      }
      return next
    })
  }, [jobIds])

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 text-sm font-medium
                   text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          Active scans ({jobIds.length})
        </span>
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {jobIds.map(id => (
            <JobRow
              key={id}
              jobId={id}
              entry={jobs[id]}
              onUpdate={entry => setJobs(prev => ({ ...prev, [id]: entry }))}
              onComplete={findings => onJobComplete(id, findings)}
              onRemove={() => onJobRemove(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function JobRow({
  jobId,
  entry,
  onUpdate,
  onComplete,
  onRemove,
}: {
  jobId: string
  entry?: JobEntry
  onUpdate: (e: JobEntry) => void
  onComplete: (findings: Finding[]) => void
  onRemove: () => void
}) {
  const status = entry?.status ?? 'pending'

  const handleComplete = useCallback(
    (job: Job) => {
      onUpdate({ id: jobId, status: 'completed', findingsCount: job.findings?.length ?? 0 })
      onComplete(job.findings ?? [])
    },
    [jobId, onUpdate, onComplete],
  )

  const handleError = useCallback(
    (msg: string) => {
      onUpdate({ id: jobId, status: 'failed', error: msg, findingsCount: 0 })
    },
    [jobId, onUpdate],
  )

  useJobPoller(
    status === 'pending' || status === 'running' ? jobId : null,
    handleComplete,
    handleError,
  )

  // Also do an initial fetch to update from pending→running
  useEffect(() => {
    if (status !== 'pending') return
    api.getJob(jobId).then(job => {
      if (job.status !== 'pending') {
        onUpdate({
          id: jobId,
          status: job.status,
          findingsCount: job.findings?.length ?? 0,
          error: job.error,
        })
      }
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = status === 'completed' || status === 'failed'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <StatusIcon status={status} />
      <div className="flex-1 min-w-0">
        <code className="text-xs text-gray-600 dark:text-gray-400">
          {jobId.slice(0, 8)}…
        </code>
        <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs capitalize">
          {status}
        </span>
        {status === 'completed' && entry && (
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
            {entry.findingsCount} finding{entry.findingsCount !== 1 ? 's' : ''}
          </span>
        )}
        {status === 'failed' && entry?.error && (
          <span className="ml-2 text-xs text-red-500 truncate">{entry.error}</span>
        )}
      </div>
      {isDone && (
        <button className="btn-ghost p-1" onClick={onRemove} title="Dismiss">
          <X size={13} />
        </button>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: Job['status'] }) {
  switch (status) {
    case 'pending':
    case 'running':
      return <Loader2 size={15} className="animate-spin text-indigo-500 flex-shrink-0" />
    case 'completed':
      return <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
    case 'failed':
      return <XCircle size={15} className="text-red-500 flex-shrink-0" />
  }
}
