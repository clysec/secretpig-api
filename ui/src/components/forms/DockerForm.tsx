import { Switch } from '@headlessui/react'
import TagInput from './TagInput'
import type { DockerConfig } from '../../types'

interface Props {
  value: DockerConfig
  onChange: (v: DockerConfig) => void
}

export default function DockerForm({ value, onChange }: Props) {
  const set = <K extends keyof DockerConfig>(key: K, val: DockerConfig[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-3">
      <TagInput
        label="Images"
        description="Docker image references to scan"
        value={value.images}
        onChange={v => set('images', v)}
        placeholder="registry/image:tag (Enter to add)"
        required
      />

      <div>
        <label className="label">Bearer token</label>
        <input
          className="input font-mono"
          type="password"
          placeholder="Registry authentication token"
          value={value.bearer_token ?? ''}
          onChange={e => set('bearer_token', e.target.value)}
        />
      </div>

      <Switch.Group as="div" className="flex items-center gap-2">
        <Switch
          checked={value.use_docker_keychain ?? false}
          onChange={v => set('use_docker_keychain', v)}
          className={`${
            value.use_docker_keychain ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          } relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent
            transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        >
          <span
            className={`${
              value.use_docker_keychain ? 'translate-x-4' : 'translate-x-0'
            } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
          />
        </Switch>
        <div>
          <Switch.Label className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
            Use Docker keychain
          </Switch.Label>
          <p className="text-xs text-gray-400 dark:text-gray-500">Use local Docker credential store for authentication</p>
        </div>
      </Switch.Group>
    </div>
  )
}
