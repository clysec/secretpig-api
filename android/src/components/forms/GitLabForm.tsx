import React from 'react'
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native'
import { colors, spacing, radius, font } from '../../theme'
import { TagInput } from './TagInput'
import type { GitLabConfig } from '../../types'

interface Props {
  value: Partial<GitLabConfig>
  onChange: (v: Partial<GitLabConfig>) => void
}

export function GitLabForm({ value, onChange }: Props) {
  const set = <K extends keyof GitLabConfig>(key: K, val: GitLabConfig[K] | undefined) =>
    onChange({ ...value, [key]: val })

  return (
    <View style={s.wrap}>
      <View style={s.field}>
        <Text style={s.label}>Access Token <Text style={s.req}>*</Text></Text>
        <TextInput
          style={s.input}
          value={value.token ?? ''}
          onChangeText={v => set('token', v)}
          placeholder="glpat-…"
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
      </View>
      <View style={s.field}>
        <Text style={s.label}>Endpoint</Text>
        <TextInput
          style={s.input}
          value={value.endpoint ?? ''}
          onChangeText={v => set('endpoint', v || undefined)}
          placeholder="https://gitlab.com"
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>
      <TagInput label="Repositories" values={value.repos ?? []} onChange={v => set('repos', v.length ? v : undefined)} placeholder="group/repo…" />
      <TagInput label="Include Repos" values={value.include_repos ?? []} onChange={v => set('include_repos', v.length ? v : undefined)} placeholder="group/repo…" />
      <TagInput label="Exclude Repos" values={value.exclude_repos ?? []} onChange={v => set('exclude_repos', v.length ? v : undefined)} placeholder="group/repo…" />
      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Skip binaries</Text>
        <Switch
          value={!!value.skip_binaries}
          onValueChange={v => set('skip_binaries', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value.skip_binaries ? '#fff' : colors.textSubtle}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: spacing.md },
  field: { gap: spacing.xs },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  req: { color: colors.danger },
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
