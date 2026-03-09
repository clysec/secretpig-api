import { Trash2 } from 'lucide-react'
import FindingCard from './FindingCard'
import type { StoredFinding } from '../types'

interface Props {
  filtered: StoredFinding[]
  filteredIds: Set<string>
  unverifiedCount: number
  totalCount: number
  onClearAll: () => void
  onClearFiltered: () => void
  onClearUnverified: () => void
  onRemoveFinding: (id: string) => void
}

export default function ResultsViewer({
  filtered,
  filteredIds,
  unverifiedCount,
  totalCount,
  onClearAll,
  onClearFiltered,
  onClearUnverified,
  onRemoveFinding,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Results
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-ghost text-xs gap-1.5"
            onClick={onClearFiltered}
            disabled={filteredIds.size === 0}
            title="Remove only findings matching the current filters"
          >
            <Trash2 size={13} />
            Clear filtered ({filteredIds.size})
          </button>
          <button
            className="btn-ghost text-xs gap-1.5"
            onClick={onClearUnverified}
            disabled={unverifiedCount === 0}
            title="Remove all unverified findings"
          >
            <Trash2 size={13} />
            Clear unverified ({unverifiedCount})
          </button>
          <button
            className="btn-danger text-xs gap-1.5"
            onClick={onClearAll}
            disabled={totalCount === 0}
            title="Remove all findings"
          >
            <Trash2 size={13} />
            Clear all ({totalCount})
          </button>
        </div>
      </div>

      {/* Findings list */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 dark:text-gray-500">
          No findings match the current filters.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <FindingCard key={f._id} finding={f} onRemove={() => onRemoveFinding(f._id)} />
          ))}
        </div>
      )}
    </div>
  )
}
