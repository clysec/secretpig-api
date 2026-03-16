import React, { useState, useCallback, useContext } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Play, Clock, CheckCircle, XCircle, Loader, Trash2 } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../theme'
import { ScanFormModal } from '../components/ScanFormModal'
import { JobCard } from '../components/JobCard'
import { ScanHistoryItem } from '../components/ScanHistoryItem'
import { AppContext } from '../AppContext'
import type { ScanHistoryEntry } from '../types'

export function ScanScreen() {
  const {
    activeJobIds, removeActiveJob,
    history, addEntry, completeEntry, failEntry, clearHistory,
    addFindings,
  } = useContext(AppContext)

  const [modalOpen, setModalOpen] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(true)

  const handleJobComplete = useCallback((jobId: string, findingsCount: number) => {
    completeEntry(jobId, findingsCount)
    removeActiveJob(jobId)
  }, [completeEntry, removeActiveJob])

  const handleJobError = useCallback((jobId: string, error: string) => {
    failEntry(jobId, error)
    removeActiveJob(jobId)
  }, [failEntry, removeActiveJob])

  const confirmClearHistory = () => {
    Alert.alert('Clear History', 'Remove all scan history entries?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ])
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>SecretPig</Text>
            <Text style={s.subtitle}>Secret scanner</Text>
          </View>
          <TouchableOpacity style={s.newScanBtn} onPress={() => setModalOpen(true)}>
            <Play size={16} color={colors.primaryText} />
            <Text style={s.newScanBtnText}>New Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Active jobs */}
        {activeJobIds.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Active Scans</Text>
            {activeJobIds.map(id => (
              <JobCard
                key={id}
                jobId={id}
                onComplete={(job) => handleJobComplete(id, job.findings?.length ?? 0)}
                onError={(msg) => handleJobError(id, msg)}
                onAddFindings={(findings) => addFindings(findings, id)}
              />
            ))}
          </View>
        )}

        {/* Scan history */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.sectionHeader}
            onPress={() => setHistoryExpanded(v => !v)}
          >
            <Text style={s.sectionTitle}>Scan History</Text>
            <View style={s.sectionHeaderActions}>
              {history.length > 0 && (
                <TouchableOpacity onPress={confirmClearHistory} hitSlop={8}>
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <Text style={s.chevron}>{historyExpanded ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {historyExpanded && (
            history.length === 0
              ? <Text style={s.empty}>No scans yet. Tap "New Scan" to get started.</Text>
              : history.map(entry => (
                  <ScanHistoryItem key={entry.jobId} entry={entry} />
                ))
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <ScanFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onInstantResult={(findings, jobId) => {
          addFindings(findings, jobId)
          setModalOpen(false)
        }}
        onBackgroundStart={(jobId, source, label) => {
          addEntry(jobId, source, label)
          setModalOpen(false)
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  newScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  newScanBtnText: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: font.base,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 11,
  },
  empty: {
    color: colors.textMuted,
    fontSize: font.base,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
})
