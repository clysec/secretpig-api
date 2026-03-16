import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { NativeModules, NativeEventEmitter, StatusBar } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { AppContext } from './src/AppContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { useFindings } from './src/store/useFindings'
import { useScanHistory } from './src/store/useScanHistory'
import { useServerManager } from './src/hooks/useServerManager'
import { setApiBaseUrl, setApiToken } from './src/api/client'
import { ScanFormModal } from './src/components/ScanFormModal'
import type { SourceType } from './src/types'

const { ShareIntentModule } = NativeModules

export default function App() {
  const findings    = useFindings()
  const scanHistory = useScanHistory()
  const serverMgr   = useServerManager()

  const [activeJobIds,  setActiveJobIds]  = useState<string[]>([])
  const [sharedUrl,     setSharedUrl]     = useState<string | null>(null)
  const [scanModalOpen, setScanModalOpen] = useState(false)

  // ── Share intent handling ────────────────────────────────────────────────
  useEffect(() => {
    // URL shared before JS was ready
    ShareIntentModule?.getPendingUrl?.()
      ?.then?.((url: string | null) => {
        if (url) { setSharedUrl(url); setScanModalOpen(true) }
      })

    // URLs shared while foregrounded
    const emitter = ShareIntentModule ? new NativeEventEmitter(ShareIntentModule) : null
    const sub = emitter?.addListener('SharedUrl', (url: string) => {
      setSharedUrl(url)
      setScanModalOpen(true)
    })
    return () => { sub?.remove() }
  }, [])

  // ── Restore API settings ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('sp_server_mode'),
      AsyncStorage.getItem('sp_remote_url'),
      AsyncStorage.getItem('sp_auth_token'),
    ]).then(([mode, remoteUrl, token]) => {
      if (mode === 'remote' && remoteUrl) {
        setApiBaseUrl(remoteUrl)
      } else {
        setApiBaseUrl(`http://localhost:${serverMgr.port}`)
      }
      if (token) setApiToken(token)
    })
  }, [serverMgr.port])

  const addActiveJob    = useCallback((id: string) => setActiveJobIds(p => [...p, id]), [])
  const removeActiveJob = useCallback((id: string) => setActiveJobIds(p => p.filter(j => j !== id)), [])
  const clearSharedUrl  = useCallback(() => setSharedUrl(null), [])

  const ctx = useMemo(() => ({
    ...findings,
    ...scanHistory,
    activeJobIds,
    addActiveJob,
    removeActiveJob,
    serverManager: serverMgr,
    sharedUrl,
    clearSharedUrl,
  }), [findings, scanHistory, activeJobIds, addActiveJob, removeActiveJob, serverMgr, sharedUrl, clearSharedUrl])

  return (
    <AppContext.Provider value={ctx}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <NavigationContainer theme={{
          dark: true,
          colors: {
            primary: '#6366F1',
            background: '#0F172A',
            card: '#111827',
            text: '#F1F5F9',
            border: '#334155',
            notification: '#6366F1',
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium:  { fontFamily: 'System', fontWeight: '500' },
            bold:    { fontFamily: 'System', fontWeight: '700' },
            heavy:   { fontFamily: 'System', fontWeight: '900' },
          },
        }}>
          <AppNavigator />
        </NavigationContainer>

        {/* Mounted outside nav so it opens regardless of active tab */}
        <ScanFormModal
          visible={scanModalOpen}
          prefillUri={sharedUrl ?? undefined}
          onClose={() => { setScanModalOpen(false); clearSharedUrl() }}
          onInstantResult={(f, jobId) => {
            findings.addFindings(f, jobId)
            setScanModalOpen(false)
            clearSharedUrl()
          }}
          onBackgroundStart={(jobId, source: SourceType, label) => {
            addActiveJob(jobId)
            scanHistory.addEntry(jobId, source, label)
            setScanModalOpen(false)
            clearSharedUrl()
          }}
        />
      </SafeAreaProvider>
    </AppContext.Provider>
  )
}
