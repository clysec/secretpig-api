import React, { useState, useContext, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Switch, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Server, Wifi, WifiOff, Play, Square, AlertCircle, CheckCircle,
} from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing, radius, font } from '../theme'
import { setApiBaseUrl, setApiToken, getApiBaseUrl } from '../api/client'
import { AppContext } from '../AppContext'

const SERVER_MODE_KEY = 'sp_server_mode'   // 'local' | 'remote'
const REMOTE_URL_KEY  = 'sp_remote_url'
const AUTH_TOKEN_KEY  = 'sp_auth_token'

export function SettingsScreen() {
  const { serverManager, findings, clearAll: clearFindings } = useContext(AppContext)
  const { status, error, start, stop, port } = serverManager

  const [mode, setMode]         = useState<'local' | 'remote'>('local')
  const [remoteUrl, setRemoteUrl] = useState('http://192.168.1.100:8080')
  const [authToken, setAuthToken] = useState('')
  const [saved, setSaved]       = useState(false)

  // Load persisted settings
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SERVER_MODE_KEY),
      AsyncStorage.getItem(REMOTE_URL_KEY),
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
    ]).then(([savedMode, savedUrl, savedToken]) => {
      const m = (savedMode ?? 'local') as 'local' | 'remote'
      setMode(m)
      if (savedUrl) setRemoteUrl(savedUrl)
      if (savedToken) { setAuthToken(savedToken); setApiToken(savedToken) }
      if (m === 'remote' && savedUrl) {
        setApiBaseUrl(savedUrl)
      } else {
        setApiBaseUrl(`http://localhost:${port}`)
      }
    })
  }, [port])

  const applyAndSave = async () => {
    if (mode === 'remote') {
      const trimmed = remoteUrl.trim()
      if (!trimmed) { Alert.alert('Missing URL', 'Please enter the remote server URL.'); return }
      setApiBaseUrl(trimmed)
      await AsyncStorage.setItem(REMOTE_URL_KEY, trimmed)
    } else {
      setApiBaseUrl(`http://localhost:${port}`)
    }
    setApiToken(authToken.trim() || null)
    await AsyncStorage.setItem(SERVER_MODE_KEY, mode)
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const confirmClearData = () => {
    Alert.alert('Clear All Data', `Delete all ${findings.length} findings and scan history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          clearFindings()
          await AsyncStorage.removeItem('sp_findings')
          await AsyncStorage.removeItem('sp_scan_history')
        },
      },
    ])
  }

  const statusColor = {
    stopped: colors.textMuted,
    starting: colors.warning,
    running: colors.success,
    error: colors.danger,
  }[status]

  const statusLabel = {
    stopped: 'Stopped',
    starting: 'Starting…',
    running: `Running on :${port}`,
    error: 'Error',
  }[status]

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Settings</Text>

        {/* Mode selector */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Connection Mode</Text>
          <View style={s.modeRow}>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'local' && s.modeBtnActive]}
              onPress={() => setMode('local')}
            >
              <Server size={16} color={mode === 'local' ? colors.primaryText : colors.textMuted} />
              <Text style={[s.modeBtnText, mode === 'local' && s.modeBtnTextActive]}>Local</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'remote' && s.modeBtnActive]}
              onPress={() => setMode('remote')}
            >
              <Wifi size={16} color={mode === 'remote' ? colors.primaryText : colors.textMuted} />
              <Text style={[s.modeBtnText, mode === 'remote' && s.modeBtnTextActive]}>Remote</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Local server controls */}
        {mode === 'local' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Local Server</Text>
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {error && (
              <View style={s.errorRow}>
                <AlertCircle size={14} color={colors.danger} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}
            <View style={s.serverBtns}>
              <TouchableOpacity
                style={[s.serverBtn, s.serverBtnStart, (status === 'running' || status === 'starting') && s.serverBtnDisabled]}
                onPress={start}
                disabled={status === 'running' || status === 'starting'}
              >
                <Play size={14} color={colors.primaryText} />
                <Text style={s.serverBtnText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.serverBtn, s.serverBtnStop, status === 'stopped' && s.serverBtnDisabled]}
                onPress={stop}
                disabled={status === 'stopped'}
              >
                <Square size={14} color={colors.primaryText} />
                <Text style={s.serverBtnText}>Stop</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.hint}>
              The bundled SecretPig binary runs as a local HTTP server on port {port}.
            </Text>
          </View>
        )}

        {/* Remote URL */}
        {mode === 'remote' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Remote Server URL</Text>
            <TextInput
              style={s.input}
              value={remoteUrl}
              onChangeText={setRemoteUrl}
              placeholder="http://192.168.1.100:8080"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
        )}

        {/* Auth token */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Auth Token</Text>
          <TextInput
            style={s.input}
            value={authToken}
            onChangeText={setAuthToken}
            placeholder="Leave empty if auth is disabled"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Save button */}
        <TouchableOpacity style={[s.saveBtn, saved && s.saveBtnDone]} onPress={applyAndSave}>
          {saved
            ? <><CheckCircle size={16} color={colors.primaryText} /><Text style={s.saveBtnText}>Saved</Text></>
            : <Text style={s.saveBtnText}>Apply Settings</Text>
          }
        </TouchableOpacity>

        {/* Danger zone */}
        <View style={[s.card, s.dangerCard]}>
          <Text style={[s.cardTitle, { color: colors.danger }]}>Danger Zone</Text>
          <TouchableOpacity style={s.dangerBtn} onPress={confirmClearData}>
            <Text style={s.dangerBtnText}>Clear All Findings & History</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: font.base,
    fontWeight: '600',
    color: colors.text,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeBtnText: { color: colors.textMuted, fontWeight: '500', fontSize: font.base },
  modeBtnTextActive: { color: colors.primaryText },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: font.base, fontWeight: '500' },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#2D1B1B',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  errorText: { color: colors.danger, fontSize: font.sm, flex: 1 },
  serverBtns: { flexDirection: 'row', gap: spacing.sm },
  serverBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  serverBtnStart: { backgroundColor: colors.primary },
  serverBtnStop: { backgroundColor: colors.danger },
  serverBtnDisabled: { opacity: 0.45 },
  serverBtnText: { color: colors.primaryText, fontWeight: '600', fontSize: font.base },
  hint: { fontSize: font.sm, color: colors.textMuted, lineHeight: 18 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: font.base,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveBtnDone: { backgroundColor: colors.success },
  saveBtnText: { color: colors.primaryText, fontWeight: '600', fontSize: font.md },
  dangerCard: { borderWidth: 1, borderColor: '#4B1C1C' },
  dangerBtn: {
    backgroundColor: '#2D1B1B',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  dangerBtnText: { color: colors.danger, fontWeight: '600', fontSize: font.base },
})
