import React, { useMemo, useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Pressable,
} from 'react-native'
import { Filter, X } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../theme'
import type { FilterState, StoredFinding } from '../types'

interface Props {
  findings: StoredFinding[]
  filters: FilterState
  onChange: (f: FilterState) => void
}

export function FilterBar({ findings, filters, onChange }: Props) {
  const [detectorOpen, setDetectorOpen] = useState(false)

  const allDetectors = useMemo(
    () => [...new Set(findings.map(f => f.detector_name))].sort(),
    [findings],
  )

  const toggleDetector = (name: string) => {
    const current = filters.detectors
    const next = current.includes(name) ? current.filter(d => d !== name) : [...current, name]
    onChange({ ...filters, detectors: next })
  }

  const clearFilters = () => onChange({ detectors: [], verified: 'all', sourceSearch: '' })
  const hasFilters = filters.detectors.length > 0 || filters.verified !== 'all' || !!filters.sourceSearch

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        {/* Detector picker */}
        <TouchableOpacity style={s.chip} onPress={() => setDetectorOpen(true)}>
          <Filter size={12} color={filters.detectors.length > 0 ? colors.primary : colors.textMuted} />
          <Text style={[s.chipText, filters.detectors.length > 0 && { color: colors.primary }]}>
            {filters.detectors.length > 0 ? `${filters.detectors.length} detector${filters.detectors.length > 1 ? 's' : ''}` : 'Detectors'}
          </Text>
        </TouchableOpacity>

        {/* Verified toggle */}
        {(['all', 'verified', 'unverified'] as const).map(v => (
          <TouchableOpacity
            key={v}
            style={[s.chip, filters.verified === v && s.chipActive]}
            onPress={() => onChange({ ...filters, verified: v })}
          >
            <Text style={[s.chipText, filters.verified === v && s.chipTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}

        {hasFilters && (
          <TouchableOpacity style={s.clearBtn} onPress={clearFilters}>
            <X size={12} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Source search */}
      <TextInput
        style={s.searchInput}
        value={filters.sourceSearch}
        onChangeText={v => onChange({ ...filters, sourceSearch: v })}
        placeholder="Filter by source name…"
        placeholderTextColor={colors.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {/* Detector picker modal */}
      <Modal visible={detectorOpen} transparent animationType="slide" onRequestClose={() => setDetectorOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setDetectorOpen(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Select Detectors</Text>
            <TouchableOpacity onPress={() => setDetectorOpen(false)}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {allDetectors.length === 0 ? (
            <Text style={s.noDetectors}>No findings to filter yet.</Text>
          ) : (
            <ScrollView>
              {allDetectors.map(name => {
                const selected = filters.detectors.includes(name)
                return (
                  <TouchableOpacity
                    key={name}
                    style={s.detectorRow}
                    onPress={() => toggleDetector(name)}
                  >
                    <View style={[s.checkbox, selected && s.checkboxSelected]}>
                      {selected && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <Text style={s.detectorName}>{name}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  chipText: { fontSize: font.sm, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: colors.primary },
  clearBtn: {
    padding: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: font.base,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
    padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: font.lg, fontWeight: '600', color: colors.text },
  noDetectors: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  detectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  detectorName: { flex: 1, color: colors.text, fontSize: font.base },
})
