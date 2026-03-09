import { Switch } from '@headlessui/react'
import TagInput from './TagInput'
import type { S3Config } from '../../types'

interface Props {
  value: S3Config
  onChange: (v: S3Config) => void
}

export default function S3Form({ value, onChange }: Props) {
  const set = <K extends keyof S3Config>(key: K, val: S3Config[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-3">
      <Switch.Group as="div" className="flex items-center gap-2 p-3 rounded-lg bg-blue-50
                                        dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <Switch
          checked={value.cloud_cred ?? false}
          onChange={v => set('cloud_cred', v)}
          className={`${
            value.cloud_cred ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          } relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent
            transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        >
          <span
            className={`${
              value.cloud_cred ? 'translate-x-4' : 'translate-x-0'
            } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
          />
        </Switch>
        <div>
          <Switch.Label className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
            Use ambient cloud credentials
          </Switch.Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">IAM role, environment variables, or ~/.aws/credentials</p>
        </div>
      </Switch.Group>

      {!value.cloud_cred && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">AWS Access Key ID</label>
              <input
                className="input font-mono"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={value.key ?? ''}
                onChange={e => set('key', e.target.value)}
              />
            </div>
            <div>
              <label className="label">AWS Secret Access Key</label>
              <input
                className="input font-mono"
                type="password"
                placeholder="wJalrX..."
                value={value.secret ?? ''}
                onChange={e => set('secret', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Session token (optional)</label>
            <input
              className="input font-mono"
              type="password"
              placeholder="Temporary session token"
              value={value.session_token ?? ''}
              onChange={e => set('session_token', e.target.value)}
            />
          </div>
        </div>
      )}

      <TagInput
        label="Buckets"
        description="Leave empty to scan all accessible buckets"
        value={value.buckets ?? []}
        onChange={v => set('buckets', v)}
        placeholder="my-bucket (Enter to add)"
      />

      <TagInput
        label="Ignore buckets"
        value={value.ignore_buckets ?? []}
        onChange={v => set('ignore_buckets', v)}
        placeholder="skip-this-bucket"
      />

      <TagInput
        label="IAM roles to assume"
        value={value.roles ?? []}
        onChange={v => set('roles', v)}
        placeholder="arn:aws:iam::123456789012:role/MyRole"
      />
    </div>
  )
}
