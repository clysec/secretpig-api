import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check, Trash2 } from 'lucide-react'
import type { StoredFinding } from '../types'

interface Props {
  finding: StoredFinding
  onRemove: () => void
}

export default function FindingCard({ finding: f, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false)

  const displayValue = f.redacted || f.raw || '—'

  return (
    <div className="card overflow-hidden">
      {/* Collapsed header */}
      <div className="flex items-start">
      <button
        className="flex-1 text-left p-4 flex items-start gap-3 hover:bg-gray-50
                   dark:hover:bg-gray-800/50 transition-colors min-w-0"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Row 1: badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="badge-detector">{f.detector_name}</span>
            {f.verified ? (
              <span className="badge-verified">✓ Verified</span>
            ) : (
              <span className="badge-unverified">✗ Unverified</span>
            )}
            <span className="badge-source">{f.source_type}</span>
            {f.decoder_type && f.decoder_type !== 'PLAIN' && (
              <span className="badge bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                {f.decoder_type}
              </span>
            )}
          </div>

          {/* Row 2: source name */}
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {f.source_name}
          </p>

          {/* Row 3: redacted value */}
          <p className="text-xs font-mono text-gray-800 dark:text-gray-200 truncate bg-gray-100
                        dark:bg-gray-800 rounded px-2 py-0.5">
            {displayValue}
          </p>
        </div>

        {/* Timestamp */}
        <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 ml-2">
          {new Date(f._scannedAt).toLocaleString()}
        </span>
      </button>
      {/* Per-row remove */}
      <button
        className="flex-shrink-0 p-3 text-gray-300 hover:text-red-500 dark:text-gray-600
                   dark:hover:text-red-400 transition-colors self-start mt-1"
        onClick={e => { e.stopPropagation(); onRemove() }}
        title="Remove this finding"
      >
        <Trash2 size={14} />
      </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 text-sm">
          {/* Raw value */}
          {f.raw && (
            <CopyableField label="Raw value" value={f.raw} mono />
          )}
          {f.raw_v2 && (
            <CopyableField label="Raw v2" value={f.raw_v2} mono />
          )}
          {f.redacted && (
            <CopyableField label="Redacted" value={f.redacted} mono />
          )}

          {/* Detector info */}
          <KeyValueTable
            label="Detector"
            rows={[
              ['Name', f.detector_name],
              ['Type ID', f.detector_type],
              ['Decoder', f.decoder_type],
            ]}
          />

          {/* Source info */}
          <KeyValueTable
            label="Source"
            rows={[
              ['Type', f.source_type],
              ['Name', f.source_name],
            ]}
          />

          {/* Source metadata */}
          {f.source_metadata && Object.keys(f.source_metadata).length > 0 && (
            <KeyValueTable
              label="Source metadata"
              rows={flattenMetadata(f.source_metadata)}
            />
          )}

          {/* Extra data */}
          {f.extra_data && Object.keys(f.extra_data).length > 0 && (
            <KeyValueTable
              label="Extra data"
              rows={Object.entries(f.extra_data)}
            />
          )}

          {/* Job info */}
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Job: <code className="font-mono">{f._jobId}</code>
          </div>
        </div>
      )}
    </div>
  )
}

function CopyableField({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        <button
          className="btn-ghost p-1 text-xs"
          onClick={copy}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check size={13} className="text-green-500" />
          ) : (
            <Copy size={13} />
          )}
        </button>
      </div>
      <div
        className={`rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 break-all
                    text-gray-800 dark:text-gray-200 ${mono ? 'font-mono text-xs' : 'text-sm'}`}
      >
        {value}
      </div>
    </div>
  )
}

function KeyValueTable({
  label,
  rows,
}: {
  label: string
  rows: [string, string][]
}) {
  const nonEmpty = rows.filter(([, v]) => v)
  if (nonEmpty.length === 0) return null

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {nonEmpty.map(([k, v]) => (
          <div
            key={k}
            className="flex items-start gap-2 px-3 py-1.5 text-xs odd:bg-gray-50 dark:odd:bg-gray-800/50"
          >
            <span className="font-medium text-gray-500 dark:text-gray-400 flex-shrink-0 w-32 truncate">
              {k}
            </span>
            <span className="font-mono text-gray-800 dark:text-gray-200 break-all">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function flattenMetadata(meta: Record<string, unknown>): [string, string][] {
  const rows: [string, string][] = []
  function traverse(obj: unknown, prefix = '') {
    if (obj === null || obj === undefined) return
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        traverse(v, prefix ? `${prefix}.${k}` : k)
      }
    } else {
      rows.push([prefix, String(obj)])
    }
  }
  traverse(meta)
  return rows
}
