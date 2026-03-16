import { useState, useCallback, useEffect } from 'react'
import { NativeModules, Platform } from 'react-native'

const { ServerModule } = NativeModules

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'error'

const LOCAL_PORT = 18080

export function useServerManager() {
  const [status, setStatus]   = useState<ServerStatus>('stopped')
  const [error, setError]     = useState<string | null>(null)

  const start = useCallback(async () => {
    if (!ServerModule) {
      setError('ServerModule unavailable (not running on Android?)')
      setStatus('error')
      return
    }
    setStatus('starting')
    setError(null)
    try {
      await ServerModule.start(LOCAL_PORT)
      setStatus('running')
    } catch (e: any) {
      setError(e?.message ?? String(e))
      setStatus('error')
    }
  }, [])

  const stop = useCallback(async () => {
    if (!ServerModule) return
    try {
      await ServerModule.stop()
    } catch {
      // ignore
    }
    setStatus('stopped')
  }, [])

  // Sync initial state with the native process (e.g. after JS reload)
  useEffect(() => {
    if (!ServerModule) return
    ServerModule.isRunning().then((running: boolean) => {
      setStatus(running ? 'running' : 'stopped')
    }).catch(() => {})
  }, [])

  return { status, error, start, stop, port: LOCAL_PORT }
}
