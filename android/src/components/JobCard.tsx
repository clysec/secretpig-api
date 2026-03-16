import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { CheckCircle, XCircle } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../theme'
import { useJobPoller } from '../hooks/useJobPoller'
import type { Job, Finding } from '../types'

interface Props {
  jobId: string
  onComplete: (job: Job) => void
  onError: (msg: string) => void
  onAddFindings: (findings: Finding[]) => void
}

export function JobCard({ jobId, onComplete, onError, onAddFindings }: Props) {
  useJobPoller(
    jobId,
    (job) => {
      if (job.findings?.length) onAddFindings(job.findings)
      onComplete(job)
    },
    onError,
  )

  return (
    <View style={s.card}>
      <ActivityIndicator size="small" color={colors.info} />
      <View style={s.text}>
        <Text style={s.label}>Job {jobId.slice(0, 8)}…</Text>
        <Text style={s.status}>Running</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  text: { flex: 1 },
  label: { fontSize: font.base, fontWeight: '500', color: colors.text },
  status: { fontSize: font.sm, color: colors.info, marginTop: 2 },
})
