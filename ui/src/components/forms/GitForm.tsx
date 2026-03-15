import { useState } from 'react'
import { Switch } from '@headlessui/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { GitConfig } from '../../types'

interface Props {
  value: GitConfig
  onChange: (v: GitConfig) => void
}

export default function GitForm({ value, onChange }: Props) {
  const [advanced, setAdvanced] = useState(false)
  const set = <K extends keyof GitConfig>(key: K, val: GitConfig[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-3">
      <div>
        <label className="label">
          Repository URI <span className="text-red-500">*</span>
        </label>
        <input
          className="input"
          placeholder="https://github.com/org/repo  or  file:///local/path"
          value={value.uri}
          onChange={e => set('uri', e.target.value)}
        />
      </div>

      {/* Advanced settings toggle */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        onClick={() => setAdvanced(v => !v)}
      >
        {advanced ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Advanced settings
      </button>

      {advanced && (
        <div className="space-y-3 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Head ref</label>
              <input
                className="input"
                placeholder="main"
                value={value.head_ref ?? ''}
                onChange={e => set('head_ref', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Base ref (diff mode)</label>
              <input
                className="input"
                placeholder="HEAD~10"
                value={value.base_ref ?? ''}
                onChange={e => set('base_ref', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">
              Max depth <span className="text-gray-400 font-normal">(0 = unlimited)</span>
            </label>
            <input
              type="number"
              className="input w-32"
              min={0}
              value={value.max_depth ?? 0}
              onChange={e => set('max_depth', parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="label">
              Exclude globs <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              className="input"
              placeholder="*.pdf,*.png"
              value={value.exclude_globs ?? ''}
              onChange={e => set('exclude_globs', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Include paths file</label>
              <input
                className="input"
                placeholder="/path/to/include.txt"
                value={value.include_paths_file ?? ''}
                onChange={e => set('include_paths_file', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Exclude paths file</label>
              <input
                className="input"
                placeholder="/path/to/exclude.txt"
                value={value.exclude_paths_file ?? ''}
                onChange={e => set('exclude_paths_file', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-6">
            <InlineToggle
              label="Bare clone"
              checked={value.bare ?? false}
              onChange={v => set('bare', v)}
            />
            <InlineToggle
              label="Skip binaries"
              checked={value.skip_binaries ?? false}
              onChange={v => set('skip_binaries', v)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function InlineToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Switch.Group as="div" className="flex items-center gap-2">
      <Switch
        checked={checked}
        onChange={onChange}
        className={`${
          checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        } relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
      >
        <span
          className={`${
            checked ? 'translate-x-4' : 'translate-x-0'
          } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
        />
      </Switch>
      <Switch.Label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        {label}
      </Switch.Label>
    </Switch.Group>
  )
}
