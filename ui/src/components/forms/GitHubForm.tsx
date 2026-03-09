import { Switch } from '@headlessui/react'
import TagInput from './TagInput'
import type { GitHubConfig } from '../../types'

interface Props {
  value: GitHubConfig
  onChange: (v: GitHubConfig) => void
}

export default function GitHubForm({ value, onChange }: Props) {
  const set = <K extends keyof GitHubConfig>(key: K, val: GitHubConfig[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">GitHub token (PAT)</label>
          <input
            className="input font-mono"
            type="password"
            placeholder="ghp_xxxx"
            value={value.token ?? ''}
            onChange={e => set('token', e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            API endpoint <span className="text-gray-400 font-normal">(GHES)</span>
          </label>
          <input
            className="input"
            placeholder="https://api.github.com"
            value={value.endpoint ?? ''}
            onChange={e => set('endpoint', e.target.value)}
          />
        </div>
      </div>

      <TagInput
        label="Organizations"
        description="Scan all repos in these orgs"
        value={value.orgs ?? []}
        onChange={v => set('orgs', v)}
        placeholder="myorg (Enter to add)"
      />

      <TagInput
        label="Repositories"
        description="Specific repos in owner/repo format"
        value={value.repos ?? []}
        onChange={v => set('repos', v)}
        placeholder="owner/repo (Enter to add)"
      />

      <TagInput
        label="Include repos"
        description="Filter to only these repos within org"
        value={value.include_repos ?? []}
        onChange={v => set('include_repos', v)}
        placeholder="repo-name"
      />

      <TagInput
        label="Exclude repos"
        description="Skip these repos"
        value={value.exclude_repos ?? []}
        onChange={v => set('exclude_repos', v)}
        placeholder="repo-name"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Concurrency</label>
          <input
            type="number"
            className="input"
            min={0}
            value={value.concurrency ?? 0}
            onChange={e => set('concurrency', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">
            Comments timeframe <span className="text-gray-400 font-normal">(days, 0=all)</span>
          </label>
          <input
            type="number"
            className="input"
            min={0}
            value={value.comments_timeframe_days ?? 0}
            onChange={e => set('comments_timeframe_days', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
        {(
          [
            ['include_members', 'Include members'],
            ['include_forks', 'Include forks'],
            ['include_issue_comments', 'Issue comments'],
            ['include_pull_request_comments', 'PR comments'],
            ['include_gist_comments', 'Gist comments'],
            ['include_wikis', 'Wikis'],
            ['skip_binaries', 'Skip binaries'],
          ] as [keyof GitHubConfig, string][]
        ).map(([key, label]) => (
          <Switch.Group key={key} as="div" className="flex items-center gap-2">
            <Switch
              checked={(value[key] as boolean) ?? false}
              onChange={v => set(key, v as GitHubConfig[typeof key])}
              className={`${
                (value[key] as boolean) ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              } relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent
                transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <span
                className={`${
                  (value[key] as boolean) ? 'translate-x-4' : 'translate-x-0'
                } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
              />
            </Switch>
            <Switch.Label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              {label}
            </Switch.Label>
          </Switch.Group>
        ))}
      </div>
    </div>
  )
}
