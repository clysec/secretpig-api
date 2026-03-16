import React, { useState, useEffect } from 'react'
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../theme'
import { api } from '../api/client'
import { labelForRequest } from '../store/useScanHistory'
import { GlobalOptions } from './forms/GlobalOptions'
import { GitForm } from './forms/GitForm'
import { GitHubForm } from './forms/GitHubForm'
import { GitLabForm } from './forms/GitLabForm'
import { FilesystemForm } from './forms/FilesystemForm'
import { S3Form } from './forms/S3Form'
import { DockerForm } from './forms/DockerForm'
import type {
  SourceType, ScanMode, ScanRequest,
  GitConfig, GitHubConfig, GitLabConfig,
  FilesystemConfig, S3Config, DockerConfig,
  Finding,
} from '../types'

interface Props {
  visible: boolean
  onClose: () => void
  /** Called for instant scans when results arrive */
  onInstantResult: (findings: Finding[], jobId: string) => void
  /** Called for background scans with the new job ID */
  onBackgroundStart: (jobId: string, source: SourceType, label: string) => void
  /** Pre-fill a Git URI (from share intent) */
  prefillUri?: string
}

const SOURCES: { key: SourceType; label: string; emoji: string }[] = [
  { key: 'git',        label: 'Git',        emoji: '📦' },
  { key: 'github',     label: 'GitHub',     emoji: '🐙' },
  { key: 'gitlab',     label: 'GitLab',     emoji: '🦊' },
  { key: 'filesystem', label: 'Filesystem', emoji: '📁' },
  { key: 's3',         label: 'S3',         emoji: '🪣' },
  { key: 'docker',     label: 'Docker',     emoji: '🐳' },
]

export function ScanFormModal({ visible, onClose, onInstantResult, onBackgroundStart, prefillUri }: Props) {
  const [source,          setSource]          = useState<SourceType>('git')
  const [scanMode,        setScanMode]        = useState<ScanMode>('background')
  const [verify,          setVerify]          = useState(true)
  const [filterUnverified,setFilterUnverified] = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  // Source-specific config state
  const [gitCfg,    setGitCfg]    = useState<Partial<GitConfig>>({})
  const [githubCfg, setGithubCfg] = useState<Partial<GitHubConfig>>({})
  const [gitlabCfg, setGitlabCfg] = useState<Partial<GitLabConfig>>({})
  const [fsCfg,     setFsCfg]     = useState<Partial<FilesystemConfig>>({})
  const [s3Cfg,     setS3Cfg]     = useState<Partial<S3Config>>({})
  const [dockerCfg, setDockerCfg] = useState<Partial<DockerConfig>>({})

  // Pre-fill URI when opened from share intent
  useEffect(() => {
    if (prefillUri && visible) {
      setSource('git')
      setGitCfg(prev => ({ ...prev, uri: prefillUri }))
    }
  }, [prefillUri, visible])

  // Reset error when source changes
  useEffect(() => { setError(null) }, [source])

  const validate = (): string | null => {
    switch (source) {
      case 'git':        return !gitCfg.uri?.trim()    ? 'Repository URI is required' : null
      case 'github':     return null // token is optional for public repos
      case 'gitlab':     return !gitlabCfg.token?.trim() ? 'Access token is required' : null
      case 'filesystem': return !fsCfg.paths?.length   ? 'At least one path is required' : null
      case 's3':         return null
      case 'docker':     return !dockerCfg.images?.length ? 'At least one image is required' : null
    }
  }

  const buildRequest = (): ScanRequest => ({
    source,
    verify,
    filter_unverified: filterUnverified,
    ...(source === 'git'        && { git:        gitCfg as GitConfig }),
    ...(source === 'github'     && { github:     githubCfg }),
    ...(source === 'gitlab'     && { gitlab:     gitlabCfg as GitLabConfig }),
    ...(source === 'filesystem' && { filesystem: fsCfg as FilesystemConfig }),
    ...(source === 's3'         && { s3:         s3Cfg }),
    ...(source === 'docker'     && { docker:     dockerCfg as DockerConfig }),
  })

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setLoading(true)

    const req = buildRequest()

    try {
      if (scanMode === 'instant') {
        const result = await api.instant(req)
        const jobId = `instant-${Date.now()}`
        onInstantResult(result.findings ?? [], jobId)
      } else {
        const result = await api.startScan(req)
        const label  = labelForRequest(req)
        onBackgroundStart(result.job_id, source, label)
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  const renderForm = () => {
    switch (source) {
      case 'git':        return <GitForm value={gitCfg} onChange={setGitCfg} prefillUri={prefillUri} />
      case 'github':     return <GitHubForm value={githubCfg} onChange={setGithubCfg} />
      case 'gitlab':     return <GitLabForm value={gitlabCfg} onChange={setGitlabCfg} />
      case 'filesystem': return <FilesystemForm value={fsCfg} onChange={setFsCfg} />
      case 's3':         return <S3Form value={s3Cfg} onChange={setS3Cfg} />
      case 'docker':     return <DockerForm value={dockerCfg} onChange={setDockerCfg} />
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Toolbar */}
          <View style={s.toolbar}>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} disabled={loading}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={s.toolbarTitle}>New Scan</Text>
            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.primaryText} />
                : <Text style={s.submitBtnText}>
                    {scanMode === 'instant' ? 'Scan' : 'Start'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {/* Source selector */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Source</Text>
              <View style={s.sourcePills}>
                {SOURCES.map(src => (
                  <TouchableOpacity
                    key={src.key}
                    style={[s.sourcePill, source === src.key && s.sourcePillActive]}
                    onPress={() => setSource(src.key)}
                  >
                    <Text style={s.sourcePillEmoji}>{src.emoji}</Text>
                    <Text style={[s.sourcePillText, source === src.key && s.sourcePillTextActive]}>
                      {src.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Source-specific form */}
            <View style={s.section}>
              {renderForm()}
            </View>

            {/* Global options */}
            <View style={s.section}>
              <GlobalOptions
                verify={verify}
                filterUnverified={filterUnverified}
                scanMode={scanMode}
                onVerifyChange={setVerify}
                onFilterUnverifiedChange={setFilterUnverified}
                onScanModeChange={setScanMode}
              />
            </View>

            {/* Error */}
            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: { padding: spacing.xs },
  toolbarTitle: { fontSize: font.lg, fontWeight: '600', color: colors.text },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.primaryText, fontWeight: '600', fontSize: font.base },
  scroll: { padding: spacing.lg, gap: spacing.xl },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: { fontSize: font.base, fontWeight: '600', color: colors.text },
  sourcePills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  sourcePillActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  sourcePillEmoji: { fontSize: 14 },
  sourcePillText: { fontSize: font.sm, fontWeight: '500', color: colors.textMuted },
  sourcePillTextActive: { color: colors.primary },
  errorBox: {
    backgroundColor: '#2D1B1B',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: font.base },
})
