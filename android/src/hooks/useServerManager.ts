import { useState, useCallback, useEffect } from 'react'
import { NativeModules } from 'react-native'

const { ServerModule } = NativeModules

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'error'

// Pick a random ephemeral port once per app session and keep it stable across re-mounts.
const _sessionPort = Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152

export function useServerManager() {
  const [status, setStatus] = useState<ServerStatus>('stopped')
  const [error, setError]   = useState<string | null>(null)

  const start = useCallback(async () => {
    if (!ServerModule) {
      setError('ServerModule unavailable (not running on Android?)')
      setStatus('error')
      return
    }
    setStatus('starting')
    setError(null)
    try {
      await ServerModule.start(_sessionPort)
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

  /**
   * Ensure the server is running. If it's already up, resolves immediately.
   * If it's mid-start, polls until it's ready. Otherwise starts it.
   */
  const ensureRunning = useCallback(async () => {
    if (!ServerModule) return
    if (status === 'running') return
    if (status === 'starting') {
      // Wait for the in-flight start to finish
      await new Promise<void>(resolve => {
        const iv = setInterval(() => {
          ServerModule.isRunning().then((r: boolean) => {
            if (r) { clearInterval(iv); resolve() }
          }).catch(() => {})
        }, 200)
      })
      return
    }
    await start()
  }, [status, start])

  // Sync initial state with the native process (e.g. after JS reload)
  useEffect(() => {
    if (!ServerModule) return
    ServerModule.isRunning().then((running: boolean) => {
      setStatus(running ? 'running' : 'stopped')
    }).catch(() => {})
  }, [])

  return { status, error, start, stop, ensureRunning, port: _sessionPort }
}
