import type {
  ScanRequest,
  InstantScanResponse,
  StartScanResponse,
  Job,
  ListJobsResponse,
  HealthResponse,
} from '../types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${body ? ': ' + body : ''}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  health(): Promise<HealthResponse> {
    return request('/health')
  },

  instant(req: ScanRequest): Promise<InstantScanResponse> {
    return request('/api/v1/scan/instant', { method: 'POST', body: JSON.stringify(req) })
  },

  startScan(req: ScanRequest): Promise<StartScanResponse> {
    return request('/api/v1/scan/start', { method: 'POST', body: JSON.stringify(req) })
  },

  pollJob(id: string): Promise<Job> {
    return request(`/api/v1/scan/poll/${id}`)
  },

  listJobs(): Promise<ListJobsResponse> {
    return request('/api/v1/jobs')
  },

  getJob(id: string): Promise<Job> {
    return request(`/api/v1/jobs/${id}`)
  },

  deleteJob(id: string): Promise<void> {
    return request(`/api/v1/jobs/${id}`, { method: 'DELETE' })
  },
}
