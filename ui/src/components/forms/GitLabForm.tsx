import { Switch } from '@headlessui/react'
import TagInput from './TagInput'
import type { GitLabConfig } from '../../types'

interface Props {
  value: GitLabConfig
  onChange: (v: GitLabConfig) => void
}

export default function GitLabForm({ value, onChange }: Props) {
  const set = <K extends keyof GitLabConfig>(key: K, val: GitLabConfig[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">
            GitLab token <span className="text-red-500">*</span>
          </label>
          <input
            className="input font-mono"
            type="password"
            placeholder="glpat-xxxx"
            value={value.token}
            onChange={e => set('token', e.target.value)}
          />
        </div>
        <div>
          <label className="label">GitLab instance URL</label>
          <input
            className="input"
            placeholder="https://gitlab.com"
            value={value.endpoint ?? ''}
            onChange={e => set('endpoint', e.target.value)}
          />
        </div>
      </div>

      <TagInput
        label="Repositories"
        description="Specific repository URLs to scan"
        value={value.repos ?? []}
        onChange={v => set('repos', v)}
        placeholder="https://gitlab.com/group/repo"
      />

      <TagInput
        label="Include repos"
        value={value.include_repos ?? []}
        onChange={v => set('include_repos', v)}
        placeholder="repo-name"
      />

      <TagInput
        label="Exclude repos"
        value={value.exclude_repos ?? []}
        onChange={v => set('exclude_repos', v)}
        placeholder="repo-name"
      />

      <Switch.Group as="div" className="flex items-center gap-2 pt-1">
        <Switch
          checked={value.skip_binaries ?? false}
          onChange={v => set('skip_binaries', v)}
          className={`${
            value.skip_binaries ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          } relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent
            transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        >
          <span
            className={`${
              value.skip_binaries ? 'translate-x-4' : 'translate-x-0'
            } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
          />
        </Switch>
        <Switch.Label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          Skip binaries
        </Switch.Label>
      </Switch.Group>
    </div>
  )
}
