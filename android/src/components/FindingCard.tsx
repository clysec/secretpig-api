import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Clipboard,
} from 'react-native'
import { ChevronDown, ChevronUp, Copy, Check, Trash2 } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../theme'
import type { StoredFinding } from '../types'

interface Props {
  finding: StoredFinding
  onRemove: () => void
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    Clipboard.setString(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <TouchableOpacity onPress={copy} hitSlop={8}>
      {copied
        ? <Check size={14} color={colors.success} />
        : <Copy size={14} color={colors.textMuted} />}
    </TouchableOpacity>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[b.badge, { borderColor: color + '55', backgroundColor: color + '22' }]}>
      <Text style={[b.badgeText, { color }]}>{label}</Text>
    </View>
  )
}
const b = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '500' },
})

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <View style={f.row}>
      <Text style={f.label}>{label}</Text>
      <View style={f.valueRow}>
        <Text style={f.value} selectable numberOfLines={3}>{value}</Text>
        <CopyButton value={value} />
      </View>
    </View>
  )
}
const f = StyleSheet.create({
  row: { gap: 2, marginBottom: spacing.sm },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  value: { flex: 1, fontSize: font.sm, color: colors.text, fontFamily: 'monospace' },
})

export function FindingCard({ finding, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false)

  const extraEntries = Object.entries(finding.extra_data ?? {}).filter(([, v]) => !!v)

  return (
    <View style={s.card}>
      {/* Summary row */}
      <TouchableOpacity style={s.header} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        <View style={s.headerLeft}>
          <Text style={s.detectorName}>{finding.detector_name}</Text>
          <View style={s.badges}>
            <Badge
              label={finding.verified ? 'Verified' : 'Unverified'}
              color={finding.verified ? colors.verified : colors.unverified}
            />
            {finding.source_type && (
              <Badge label={finding.source_type} color={colors.info} />
            )}
            {finding.decoder_type && finding.decoder_type !== 'PLAIN' && (
              <Badge label={finding.decoder_type} color={colors.warning} />
            )}
          </View>
          {finding.source_name && (
            <Text style={s.sourceName} numberOfLines={1}>{finding.source_name}</Text>
          )}
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={onRemove} hitSlop={8} style={{ padding: spacing.xs }}>
            <Trash2 size={14} color={colors.textSubtle} />
          </TouchableOpacity>
          {expanded
            ? <ChevronUp size={16} color={colors.textMuted} />
            : <ChevronDown size={16} color={colors.textMuted} />}
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={s.detail}>
          <View style={s.divider} />
          <Field label="Raw" value={finding.raw} />
          {finding.redacted && finding.redacted !== finding.raw && (
            <Field label="Redacted" value={finding.redacted} />
          )}
          {finding.raw_v2 && finding.raw_v2 !== finding.raw && (
            <Field label="Raw V2" value={finding.raw_v2} />
          )}
          {extraEntries.length > 0 && (
            <View style={s.extraSection}>
              <Text style={s.extraTitle}>Extra Data</Text>
              {extraEntries.map(([k, v]) => (
                <Field key={k} label={k} value={String(v)} />
              ))}
            </View>
          )}
          <Text style={s.scannedAt}>
            Scanned {new Date(finding._scannedAt).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerLeft: { flex: 1, gap: spacing.xs },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: 2 },
  detectorName: { fontSize: font.base, fontWeight: '600', color: colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sourceName: { fontSize: font.sm, color: colors.textMuted },
  detail: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  extraSection: { marginTop: spacing.sm },
  extraTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  scannedAt: { fontSize: 11, color: colors.textSubtle, marginTop: spacing.sm },
})
