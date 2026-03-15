import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react'
import type { ScanHistoryEntry } from '../types'

interface Props {
  history: ScanHistoryEntry[]
  onViewFindings: (jobId: string) => void
  onClearHistory: () => void
}

export default function ScanHistory({ history, onViewFindings, onClearHistory }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (history.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between">
        <button
          className="flex-1 flex items-center gap-2 p-3 text-sm font-medium
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          Scan history ({history.length})
        </button>
        <button
          className="btn-ghost p-2 mr-1 text-gray-400 hover:text-red-500"
          onClick={onClearHistory}
          title="Clear history"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-t border-gray-100 dark:border-gray-700/50 text-left text-gray-400 dark:text-gray-500">
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Findings</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {history.map(entry => (
                <HistoryRow key={entry.jobId} entry={entry} onView={() => onViewFindings(entry.jobId)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HistoryRow({ entry, onView }: { entry: ScanHistoryEntry; onView: () => void }) {
  const duration = entry.endedAt
    ? formatDuration(new Date(entry.startedAt), new Date(entry.endedAt))
    : entry.status === 'running' ? 'running…' : '—'

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
      <td className="px-4 py-2">
        <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{entry.source}</span>
      </td>
      <td className="px-4 py-2 max-w-[200px]">
        <span className="truncate block text-gray-600 dark:text-gray-400" title={entry.label}>
          {entry.label || '—'}
        </span>
      </td>
      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {formatTime(new Date(entry.startedAt))}
      </td>
      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {duration}
      </td>
      <td className="px-4 py-2">
        <StatusBadge status={entry.status} error={entry.error} />
      </td>
      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
        {entry.status === 'completed' ? entry.findingsCount : '—'}
      </td>
      <td className="px-4 py-2">
        {entry.status === 'completed' && entry.findingsCount > 0 && (
          <button
            className="btn-ghost p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
            onClick={onView}
            title="Filter findings to this scan"
          >
            <Eye size={13} />
          </button>
        )}
      </td>
    </tr>
  )
}

function StatusBadge({ status, error }: { status: ScanHistoryEntry['status']; error?: string }) {
  if (status === 'running') {
    return (
      <span className="flex items-center gap-1 text-indigo-500">
        <Loader2 size={11} className="animate-spin" /> running
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <CheckCircle size={11} /> done
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-red-500" title={error}>
      <XCircle size={11} /> failed
    </span>
  )
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}
