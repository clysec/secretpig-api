import { Switch } from '@headlessui/react'
import type { ScanMode } from '../../types'

interface Props {
  verify: boolean
  filterUnverified: boolean
  concurrency: number
  scanMode: ScanMode
  onChange: (key: string, value: unknown) => void
}

export default function GlobalOptions({
  verify,
  filterUnverified,
  concurrency,
  scanMode,
  onChange,
}: Props) {
  return (
    <div className="space-y-4 pt-2">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Scan options
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Verify */}
        <ToggleField
          label="Verify credentials"
          description="Check discovered secrets against live APIs"
          checked={verify}
          onChange={v => onChange('verify', v)}
        />

        {/* Filter unverified */}
        <ToggleField
          label="Filter unverified"
          description="Return only the first unverified result per chunk"
          checked={filterUnverified}
          onChange={v => onChange('filterUnverified', v)}
        />
      </div>

      {/* Concurrency */}
      <div>
        <label className="label">
          Concurrency
          <span className="ml-1 text-gray-400 font-normal">(workers, default 8)</span>
        </label>
        <input
          type="number"
          className="input w-32"
          min={1}
          max={64}
          value={concurrency}
          onChange={e => onChange('concurrency', Math.max(1, parseInt(e.target.value) || 8))}
        />
      </div>

      {/* Scan mode */}
      <div>
        <label className="label">Scan mode</label>
        <div className="flex gap-3">
          {(['instant', 'background'] as ScanMode[]).map(mode => (
            <label
              key={mode}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                className="accent-indigo-600"
                name="scanMode"
                value={mode}
                checked={scanMode === mode}
                onChange={() => onChange('scanMode', mode)}
              />
              <span className="font-medium capitalize text-gray-800 dark:text-gray-200">
                {mode === 'instant' ? '⚡ Instant' : '⏳ Background'}
              </span>
              <span className="text-gray-400 text-xs">
                {mode === 'instant' ? '(blocking)' : '(async poll)'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Switch.Group as="div" className="flex items-start gap-3">
      <Switch
        checked={checked}
        onChange={onChange}
        className={`${
          checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2
          border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 mt-0.5`}
      >
        <span
          className={`${
            checked ? 'translate-x-4' : 'translate-x-0'
          } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
        />
      </Switch>
      <div>
        <Switch.Label className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
          {label}
        </Switch.Label>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
      </div>
    </Switch.Group>
  )
}
