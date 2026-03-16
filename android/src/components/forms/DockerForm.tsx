import React from 'react'
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native'
import { colors, spacing, radius, font } from '../../theme'
import { TagInput } from './TagInput'
import type { DockerConfig } from '../../types'

interface Props {
  value: Partial<DockerConfig>
  onChange: (v: Partial<DockerConfig>) => void
}

export function DockerForm({ value, onChange }: Props) {
  const set = <K extends keyof DockerConfig>(key: K, val: DockerConfig[K] | undefined) =>
    onChange({ ...value, [key]: val })

  return (
    <View style={s.wrap}>
      <TagInput
        label="Images"
        required
        values={value.images ?? []}
        onChange={v => set('images', v)}
        placeholder="nginx:latest, ubuntu:22.04…"
      />
      <View style={s.field}>
        <Text style={s.label}>Bearer Token</Text>
        <TextInput
          style={s.input}
          value={value.bearer_token ?? ''}
          onChangeText={v => set('bearer_token', v || undefined)}
          placeholder="Registry auth token"
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
      </View>
      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Use Docker keychain</Text>
        <Switch
          value={!!value.use_docker_keychain}
          onValueChange={v => set('use_docker_keychain', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value.use_docker_keychain ? '#fff' : colors.textSubtle}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: spacing.md },
  field: { gap: spacing.xs },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: font.base,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: font.base, color: colors.text, fontWeight: '500' },
})
