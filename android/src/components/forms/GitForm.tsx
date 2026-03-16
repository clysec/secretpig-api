import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { colors, spacing, radius, font } from '../../theme'
import type { GitConfig } from '../../types'

interface Props {
  value: Partial<GitConfig>
  onChange: (v: Partial<GitConfig>) => void
  prefillUri?: string
}

function Field({ label, value, onChange, placeholder, required, keyboardType, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; keyboardType?: any; hint?: string
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}{required && <Text style={s.req}> *</Text>}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
      />
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  )
}

export function GitForm({ value, onChange, prefillUri }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const set = <K extends keyof GitConfig>(key: K, val: GitConfig[K] | undefined) =>
    onChange({ ...value, [key]: val })

  return (
    <View style={s.wrap}>
      <Field
        label="Repository URI"
        required
        value={value.uri ?? prefillUri ?? ''}
        onChange={v => set('uri', v)}
        placeholder="https://github.com/org/repo.git"
        keyboardType="url"
      />
      <Field
        label="Head Ref"
        value={value.head_ref ?? ''}
        onChange={v => set('head_ref', v || undefined)}
        placeholder="main"
      />
      <Field
        label="Base Ref"
        value={value.base_ref ?? ''}
        onChange={v => set('base_ref', v || undefined)}
        placeholder="Leave empty to scan all commits"
      />

      <TouchableOpacity style={s.advancedToggle} onPress={() => setShowAdvanced(v => !v)}>
        <Text style={s.advancedToggleText}>{showAdvanced ? '▲ Hide advanced' : '▼ Show advanced'}</Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={s.advanced}>
          <Field
            label="Max Depth"
            value={value.max_depth != null ? String(value.max_depth) : ''}
            onChange={v => set('max_depth', v ? Number(v) : undefined)}
            placeholder="0 = unlimited"
            keyboardType="number-pad"
          />
          <Field
            label="Exclude Globs"
            value={value.exclude_globs ?? ''}
            onChange={v => set('exclude_globs', v || undefined)}
            placeholder="*.lock,*.min.js (comma-separated)"
            hint="Comma-separated glob patterns to skip"
          />
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>Skip binaries</Text>
            <Switch
              value={!!value.skip_binaries}
              onValueChange={v => set('skip_binaries', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={value.skip_binaries ? '#fff' : colors.textSubtle}
            />
          </View>
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>Bare clone</Text>
            <Switch
              value={!!value.bare}
              onValueChange={v => set('bare', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={value.bare ? '#fff' : colors.textSubtle}
            />
          </View>
        </View>
      )}
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
  hint: { fontSize: 11, color: colors.textMuted },
  advancedToggle: { alignSelf: 'flex-start' },
  advancedToggleText: { fontSize: font.sm, color: colors.primary, fontWeight: '500' },
  advanced: { gap: spacing.md, paddingTop: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: { fontSize: font.base, color: colors.text, fontWeight: '500' },
})
