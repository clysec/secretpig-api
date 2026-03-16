import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { colors, spacing, radius, font } from '../../theme'
import { TagInput } from './TagInput'
import type { GitHubConfig } from '../../types'

interface Props {
  value: Partial<GitHubConfig>
  onChange: (v: Partial<GitHubConfig>) => void
}

function Field({ label, value, onChange, placeholder, secure }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; secure?: boolean
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secure}
      />
    </View>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.switchRow}>
      <Text style={s.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? '#fff' : colors.textSubtle}
      />
    </View>
  )
}

export function GitHubForm({ value, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const set = <K extends keyof GitHubConfig>(key: K, val: GitHubConfig[K] | undefined) =>
    onChange({ ...value, [key]: val })

  return (
    <View style={s.wrap}>
      <Field label="Personal Access Token" value={value.token ?? ''} onChange={v => set('token', v || undefined)} placeholder="ghp_…" secure />
      <Field label="Enterprise Endpoint" value={value.endpoint ?? ''} onChange={v => set('endpoint', v || undefined)} placeholder="https://github.example.com" />

      <TagInput
        label="Organizations"
        values={value.orgs ?? []}
        onChange={v => set('orgs', v.length ? v : undefined)}
        placeholder="org name…"
      />
      <TagInput
        label="Repositories"
        values={value.repos ?? []}
        onChange={v => set('repos', v.length ? v : undefined)}
        placeholder="org/repo…"
      />

      <TouchableOpacity style={s.advancedToggle} onPress={() => setShowAdvanced(v => !v)}>
        <Text style={s.advancedToggleText}>{showAdvanced ? '▲ Hide advanced' : '▼ Show advanced'}</Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={s.advanced}>
          <TagInput label="Include Repos" values={value.include_repos ?? []} onChange={v => set('include_repos', v.length ? v : undefined)} placeholder="org/repo…" />
          <TagInput label="Exclude Repos" values={value.exclude_repos ?? []} onChange={v => set('exclude_repos', v.length ? v : undefined)} placeholder="org/repo…" />
          <Toggle label="Include forks" value={!!value.include_forks} onChange={v => set('include_forks', v)} />
          <Toggle label="Include members" value={!!value.include_members} onChange={v => set('include_members', v)} />
          <Toggle label="Include wikis" value={!!value.include_wikis} onChange={v => set('include_wikis', v)} />
          <Toggle label="Include issue comments" value={!!value.include_issue_comments} onChange={v => set('include_issue_comments', v)} />
          <Toggle label="Include PR comments" value={!!value.include_pull_request_comments} onChange={v => set('include_pull_request_comments', v)} />
          <Toggle label="Include gist comments" value={!!value.include_gist_comments} onChange={v => set('include_gist_comments', v)} />
          <Toggle label="Skip binaries" value={!!value.skip_binaries} onChange={v => set('skip_binaries', v)} />
        </View>
      )}
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
  advancedToggle: { alignSelf: 'flex-start' },
  advancedToggleText: { fontSize: font.sm, color: colors.primary, fontWeight: '500' },
  advanced: { gap: spacing.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: font.base, color: colors.text, fontWeight: '500' },
})
