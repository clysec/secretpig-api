import React, { useState, useMemo, useContext } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Trash2 } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../theme'
import { FindingCard } from '../components/FindingCard'
import { FilterBar } from '../components/FilterBar'
import { AppContext } from '../AppContext'
import type { FilterState, StoredFinding } from '../types'

export function FindingsScreen() {
  const { findings, clearAll, clearByIds, clearUnverified, removeOne } = useContext(AppContext)

  const [filters, setFilters] = useState<FilterState>({
    detectors: [],
    verified: 'all',
    sourceSearch: '',
  })

  const filtered = useMemo<StoredFinding[]>(() => {
    return findings.filter(f => {
      if (filters.detectors.length > 0 && !filters.detectors.includes(f.detector_name)) return false
      if (filters.verified === 'verified'   && !f.verified) return false
      if (filters.verified === 'unverified' &&  f.verified) return false
      if (filters.sourceSearch && !f.source_name.toLowerCase().includes(filters.sourceSearch.toLowerCase())) return false
      return true
    })
  }, [findings, filters])

  const filteredIds = useMemo(() => new Set(filtered.map(f => f._id)), [filtered])
  const unverifiedCount = useMemo(() => findings.filter(f => !f.verified).length, [findings])

  const confirmClearAll = () => {
    Alert.alert('Clear All Findings', `Remove all ${findings.length} findings?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ])
  }

  const confirmClearFiltered = () => {
    Alert.alert('Clear Filtered', `Remove ${filtered.length} visible findings?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearByIds(filteredIds) },
    ])
  }

  const confirmClearUnverified = () => {
    Alert.alert('Clear Unverified', `Remove ${unverifiedCount} unverified findings?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearUnverified },
    ])
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Findings</Text>
        <Text style={s.count}>
          {filtered.length !== findings.length
            ? `${filtered.length} / ${findings.length}`
            : `${findings.length}`}
        </Text>
      </View>

      {/* Filter bar */}
      <FilterBar findings={findings} filters={filters} onChange={setFilters} />

      {/* Bulk actions */}
      {findings.length > 0 && (
        <View style={s.actions}>
          {filteredIds.size < findings.length ? (
            <TouchableOpacity style={s.actionBtn} onPress={confirmClearFiltered}>
              <Trash2 size={13} color={colors.warning} />
              <Text style={[s.actionText, { color: colors.warning }]}>Clear filtered</Text>
            </TouchableOpacity>
          ) : null}
          {unverifiedCount > 0 && (
            <TouchableOpacity style={s.actionBtn} onPress={confirmClearUnverified}>
              <Trash2 size={13} color={colors.danger} />
              <Text style={[s.actionText, { color: colors.danger }]}>Clear unverified ({unverifiedCount})</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.actionBtn} onPress={confirmClearAll}>
            <Trash2 size={13} color={colors.textMuted} />
            <Text style={[s.actionText, { color: colors.textMuted }]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {findings.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No findings yet</Text>
          <Text style={s.emptySubtitle}>Run a scan from the Scan tab to see results here.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No matches</Text>
          <Text style={s.emptySubtitle}>Adjust your filters to see findings.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={f => f._id}
          renderItem={({ item }) => (
            <FindingCard finding={item} onRemove={() => removeOne(item._id)} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    fontSize: font.base,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  actionText: {
    fontSize: font.sm,
    fontWeight: '500',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: font.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
