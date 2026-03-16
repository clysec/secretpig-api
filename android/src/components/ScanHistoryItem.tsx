import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CheckCircle, XCircle, Loader } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../theme'
import type { ScanHistoryEntry } from '../types'

interface Props {
  entry: ScanHistoryEntry
}

function duration(start: string, end?: string): string {
  const ms = new Date(end ?? new Date()).getTime() - new Date(start).getTime()
  if (ms < 1000) return '<1s'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rs = s % 60
  return rs ? `${m}m ${rs}s` : `${m}m`
}

export function ScanHistoryItem({ entry }: Props) {
  const statusIcon =
    entry.status === 'running'   ? <Loader size={14} color={colors.info} /> :
    entry.status === 'completed' ? <CheckCircle size={14} color={colors.success} /> :
                                   <XCircle size={14} color={colors.danger} />

  const statusColor =
    entry.status === 'running'   ? colors.info :
    entry.status === 'completed' ? colors.success : colors.danger

  return (
    <View style={s.row}>
      <View style={s.left}>
        {statusIcon}
      </View>
      <View style={s.body}>
        <View style={s.topLine}>
          <Text style={s.source}>{entry.source.toUpperCase()}</Text>
          <Text style={s.label} numberOfLines={1}>{entry.label}</Text>
        </View>
        <View style={s.bottomLine}>
          <Text style={s.meta}>{new Date(entry.startedAt).toLocaleString()}</Text>
          <Text style={s.sep}>·</Text>
          <Text style={s.meta}>{duration(entry.startedAt, entry.endedAt)}</Text>
          <Text style={s.sep}>·</Text>
          <Text style={[s.meta, { color: statusColor }]}>
            {entry.status === 'running' ? 'Running' : `${entry.findingsCount} finding${entry.findingsCount !== 1 ? 's' : ''}`}
          </Text>
        </View>
        {entry.error && (
          <Text style={s.error} numberOfLines={2}>{entry.error}</Text>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  left: { paddingTop: 2 },
  body: { flex: 1, gap: 3 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  source: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  label: { flex: 1, fontSize: font.sm, color: colors.text },
  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 11, color: colors.textMuted },
  sep: { color: colors.textSubtle, fontSize: 11 },
  error: { fontSize: 11, color: colors.danger, marginTop: 2 },
})
