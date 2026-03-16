import React from 'react'
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native'
import { colors, spacing, radius, font } from '../../theme'
import { TagInput } from './TagInput'
import type { S3Config } from '../../types'

interface Props {
  value: Partial<S3Config>
  onChange: (v: Partial<S3Config>) => void
}

function Field({ label, value, onChange, placeholder, secure }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; secure?: boolean
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

export function S3Form({ value, onChange }: Props) {
  const set = <K extends keyof S3Config>(key: K, val: S3Config[K] | undefined) =>
    onChange({ ...value, [key]: val })

  return (
    <View style={s.wrap}>
      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Use cloud credentials (IAM/env)</Text>
        <Switch
          value={!!value.cloud_cred}
          onValueChange={v => set('cloud_cred', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value.cloud_cred ? '#fff' : colors.textSubtle}
        />
      </View>

      {!value.cloud_cred && (
        <>
          <Field label="Access Key" value={value.key ?? ''} onChange={v => set('key', v || undefined)} placeholder="AKIA…" />
          <Field label="Secret" value={value.secret ?? ''} onChange={v => set('secret', v || undefined)} secure />
          <Field label="Session Token" value={value.session_token ?? ''} onChange={v => set('session_token', v || undefined)} secure />
        </>
      )}

      <TagInput label="Buckets" values={value.buckets ?? []} onChange={v => set('buckets', v.length ? v : undefined)} placeholder="my-bucket…" />
      <TagInput label="Ignore Buckets" values={value.ignore_buckets ?? []} onChange={v => set('ignore_buckets', v.length ? v : undefined)} placeholder="skip-me…" />
      <TagInput label="Roles" values={value.roles ?? []} onChange={v => set('roles', v.length ? v : undefined)} placeholder="arn:aws:iam::…" />
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
  switchLabel: { fontSize: font.base, color: colors.text, fontWeight: '500', flex: 1 },
})
