import { useEffect, useRef } from 'react'
import { api } from '../api/client'
import type { Job } from '../types'

const FAST_MS         = 2_000
const SLOW_MS         = 5_000
const SWITCH_AFTER_MS = 10_000

export function useJobPoller(
  jobId: string | null,
  onComplete: (job: Job) => void,
  onError: (msg: string) => void,
) {
  const onCompleteRef = useRef(onComplete)
  const onErrorRef    = useRef(onError)
  onCompleteRef.current = onComplete
  onErrorRef.current    = onError

  useEffect(() => {
    if (!jobId) return

    const startTime = Date.now()
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      try {
        const job = await api.pollJob(jobId!)
        if (job.status === 'completed') {
          onCompleteRef.current(job)
          return
        }
        if (job.status === 'failed') {
          onErrorRef.current(job.error || 'Scan failed')
          return
        }
        const elapsed = Date.now() - startTime
        const delay   = elapsed >= SWITCH_AFTER_MS ? SLOW_MS : FAST_MS
        timeoutId = setTimeout(poll, delay)
      } catch (err) {
        onErrorRef.current(String(err))
      }
    }

    timeoutId = setTimeout(poll, FAST_MS)
    return () => clearTimeout(timeoutId)
  }, [jobId])
}
