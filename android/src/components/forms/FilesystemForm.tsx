import React from 'react'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../theme'
import { TagInput } from './TagInput'
import type { FilesystemConfig } from '../../types'

interface Props {
  value: Partial<FilesystemConfig>
  onChange: (v: Partial<FilesystemConfig>) => void
}

export function FilesystemForm({ value, onChange }: Props) {
  const set = <K extends keyof FilesystemConfig>(key: K, val: FilesystemConfig[K] | undefined) =>
    onChange({ ...value, [key]: val })

  return (
    <View style={s.wrap}>
      <TagInput
        label="Paths"
        required
        values={value.paths ?? []}
        onChange={v => set('paths', v)}
        placeholder="/data/repo or /sdcard/..."
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: spacing.md },
})
