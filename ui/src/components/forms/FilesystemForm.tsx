import TagInput from './TagInput'
import type { FilesystemConfig } from '../../types'

interface Props {
  value: FilesystemConfig
  onChange: (v: FilesystemConfig) => void
}

export default function FilesystemForm({ value, onChange }: Props) {
  const set = <K extends keyof FilesystemConfig>(key: K, val: FilesystemConfig[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-3">
      <TagInput
        label="Paths"
        description="Directories or files to scan"
        value={value.paths}
        onChange={v => set('paths', v)}
        placeholder="/home/user/project (Enter to add)"
        required
      />

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
    </div>
  )
}
