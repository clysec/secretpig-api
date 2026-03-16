import React from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { colors, spacing, radius, font } from '../../theme'
import type { ScanMode } from '../../types'

interface Props {
  verify: boolean
  filterUnverified: boolean
  scanMode: ScanMode
  onVerifyChange: (v: boolean) => void
  onFilterUnverifiedChange: (v: boolean) => void
  onScanModeChange: (m: ScanMode) => void
}

function Row({ label, description, value, onChange }: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View style={s.row}>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        {description && <Text style={s.rowDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? '#fff' : colors.textSubtle}
      />
    </View>
  )
}

export function GlobalOptions({ verify, filterUnverified, scanMode, onVerifyChange, onFilterUnverifiedChange, onScanModeChange }: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.sectionTitle}>Scan Options</Text>

      <Row
        label="Verify secrets"
        description="Attempt to validate discovered secrets against their services"
        value={verify}
        onChange={onVerifyChange}
      />
      <Row
        label="Filter unverified"
        description="Only return secrets that were confirmed valid"
        value={filterUnverified}
        onChange={onFilterUnverifiedChange}
      />

      <Text style={s.modeLabel}>Scan Mode</Text>
      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.modeBtn, scanMode === 'instant' && s.modeBtnActive]}
          onPress={() => onScanModeChange('instant')}
        >
          <Text style={[s.modeBtnText, scanMode === 'instant' && s.modeBtnTextActive]}>⚡ Instant</Text>
          <Text style={s.modeBtnDesc}>Wait for results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, scanMode === 'background' && s.modeBtnActive]}
          onPress={() => onScanModeChange('background')}
        >
          <Text style={[s.modeBtnText, scanMode === 'background' && s.modeBtnTextActive]}>⏳ Background</Text>
          <Text style={s.modeBtnDesc}>Run in background</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: spacing.md },
  sectionTitle: { fontSize: font.base, fontWeight: '600', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: font.base, color: colors.text, fontWeight: '500' },
  rowDesc: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  modeLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  modeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  modeBtnText: { fontSize: font.base, fontWeight: '600', color: colors.textMuted },
  modeBtnTextActive: { color: colors.primary },
  modeBtnDesc: { fontSize: 11, color: colors.textSubtle, marginTop: 2 },
})
