import { useMemo, Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDown, Search, X } from 'lucide-react'
import type { StoredFinding, FilterState } from '../types'

interface Props {
  findings: StoredFinding[]
  filtered: StoredFinding[]
  filters: FilterState
  onChange: (f: FilterState) => void
}

type VerifiedFilter = 'all' | 'verified' | 'unverified'

export default function FilterBar({ findings, filtered, filters, onChange }: Props) {
  const allDetectors = useMemo(() => {
    const set = new Set<string>()
    findings.forEach(f => set.add(f.detector_name))
    return Array.from(set).sort()
  }, [findings])

  function setDetectors(d: string[]) {
    onChange({ ...filters, detectors: d })
  }

  function setVerified(v: VerifiedFilter) {
    onChange({ ...filters, verified: v })
  }

  function setSource(s: string) {
    onChange({ ...filters, sourceSearch: s })
  }

  function clearAll() {
    onChange({ detectors: [], verified: 'all', sourceSearch: '' })
  }

  const hasActiveFilters =
    filters.detectors.length > 0 ||
    filters.verified !== 'all' ||
    filters.sourceSearch !== ''

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Detector multi-select */}
        <DetectorSelect
          all={allDetectors}
          selected={filters.detectors}
          onChange={setDetectors}
        />

        {/* Verified toggle */}
        <VerifiedToggle value={filters.verified} onChange={setVerified} />

        {/* Source search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pl-8 pr-3 py-1.5 text-sm"
            placeholder="Filter by source name…"
            value={filters.sourceSearch}
            onChange={e => setSource(e.target.value)}
          />
          {filters.sourceSearch && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSource('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button className="btn-ghost text-xs gap-1" onClick={clearAll}>
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Showing <strong className="text-gray-700 dark:text-gray-300">{filtered.length}</strong> of{' '}
        <strong className="text-gray-700 dark:text-gray-300">{findings.length}</strong> findings
      </p>
    </div>
  )
}

function DetectorSelect({
  all,
  selected,
  onChange,
}: {
  all: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(d: string) {
    onChange(selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d])
  }

  return (
    <Listbox value={selected} onChange={() => {}} multiple>
      <div className="relative">
        <Listbox.Button
          className="btn-secondary flex items-center gap-1.5 text-sm"
        >
          <span>
            {selected.length === 0
              ? 'All detectors'
              : `${selected.length} detector${selected.length > 1 ? 's' : ''}`}
          </span>
          <ChevronDown size={14} />
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="absolute z-30 mt-1 max-h-60 w-64 overflow-auto rounded-xl border
                       border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1"
          >
            {all.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-400">No detectors found</div>
            )}
            {all.map(det => (
              <Listbox.Option key={det} value={det} as={Fragment}>
                {() => (
                  <li
                    className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer
                               hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                    onClick={() => toggle(det)}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs
                                  ${selected.includes(det)
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-gray-300 dark:border-gray-600'}`}
                    >
                      {selected.includes(det) && '✓'}
                    </span>
                    <span className="truncate">{det}</span>
                  </li>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}

function VerifiedToggle({
  value,
  onChange,
}: {
  value: VerifiedFilter
  onChange: (v: VerifiedFilter) => void
}) {
  const options: { id: VerifiedFilter; label: string }[] = [
    { id: 'all',        label: 'All' },
    { id: 'verified',   label: '✓ Verified' },
    { id: 'unverified', label: '✗ Unverified' },
  ]

  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 text-sm">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1.5 transition-colors ${
            value === opt.id
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
