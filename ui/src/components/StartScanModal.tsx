import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../api/client'
import GlobalOptions from './forms/GlobalOptions'
import GitForm from './forms/GitForm'
import GitHubForm from './forms/GitHubForm'
import GitLabForm from './forms/GitLabForm'
import FilesystemForm from './forms/FilesystemForm'
import S3Form from './forms/S3Form'
import DockerForm from './forms/DockerForm'
import type {
  SourceType, ScanMode, ScanRequest,
  GitConfig, GitHubConfig, GitLabConfig,
  FilesystemConfig, S3Config, DockerConfig,
  Finding,
} from '../types'

const SOURCES: { id: SourceType; label: string; icon: string }[] = [
  { id: 'git',        label: 'Git',        icon: '⎇' },
  { id: 'github',     label: 'GitHub',     icon: '🐙' },
  { id: 'gitlab',     label: 'GitLab',     icon: '🦊' },
  { id: 'filesystem', label: 'Filesystem', icon: '📁' },
  { id: 's3',         label: 'S3',         icon: '🪣' },
  { id: 'docker',     label: 'Docker',     icon: '🐳' },
]

const DEFAULT_GIT: GitConfig         = { uri: '' }
const DEFAULT_GITHUB: GitHubConfig   = {}
const DEFAULT_GITLAB: GitLabConfig   = { token: '' }
const DEFAULT_FS: FilesystemConfig   = { paths: [] }
const DEFAULT_S3: S3Config           = {}
const DEFAULT_DOCKER: DockerConfig   = { images: [] }

interface Props {
  open: boolean
  onClose: () => void
  onInstantResult: (findings: Finding[], jobId: string, req: ScanRequest) => void
  onBackgroundStart: (jobId: string, req: ScanRequest) => void
}

export default function StartScanModal({
  open,
  onClose,
  onInstantResult,
  onBackgroundStart,
}: Props) {
  const [source, setSource] = useState<SourceType>('git')
  const [verify, setVerify] = useState(true)
  const [filterUnverified, setFilterUnverified] = useState(false)
  const [concurrency, setConcurrency] = useState(8)
  const [scanMode, setScanMode] = useState<ScanMode>('background')

  const [gitCfg,    setGitCfg]    = useState<GitConfig>(DEFAULT_GIT)
  const [ghCfg,     setGhCfg]     = useState<GitHubConfig>(DEFAULT_GITHUB)
  const [glCfg,     setGlCfg]     = useState<GitLabConfig>(DEFAULT_GITLAB)
  const [fsCfg,     setFsCfg]     = useState<FilesystemConfig>(DEFAULT_FS)
  const [s3Cfg,     setS3Cfg]     = useState<S3Config>(DEFAULT_S3)
  const [dockerCfg, setDockerCfg] = useState<DockerConfig>(DEFAULT_DOCKER)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function handleClose() {
    if (loading) return
    onClose()
    setError(null)
  }

  function handleGlobalChange(key: string, value: unknown) {
    if (key === 'verify')           setVerify(value as boolean)
    if (key === 'filterUnverified') setFilterUnverified(value as boolean)
    if (key === 'concurrency')      setConcurrency(value as number)
    if (key === 'scanMode')         setScanMode(value as ScanMode)
  }

  function buildRequest(): ScanRequest | null {
    const base: ScanRequest = {
      source,
      verify,
      filter_unverified: filterUnverified,
      concurrency,
    }
    switch (source) {
      case 'git':
        if (!gitCfg.uri.trim()) { setError('Git URI is required'); return null }
        return { ...base, git: gitCfg }
      case 'github':
        return { ...base, github: ghCfg }
      case 'gitlab':
        if (!glCfg.token.trim()) { setError('GitLab token is required'); return null }
        return { ...base, gitlab: glCfg }
      case 'filesystem':
        if (fsCfg.paths.length === 0) { setError('At least one path is required'); return null }
        return { ...base, filesystem: fsCfg }
      case 's3':
        return { ...base, s3: s3Cfg }
      case 'docker':
        if (dockerCfg.images.length === 0) { setError('At least one image is required'); return null }
        return { ...base, docker: dockerCfg }
    }
  }

  async function handleSubmit() {
    setError(null)
    const req = buildRequest()
    if (!req) return

    setLoading(true)
    try {
      if (scanMode === 'instant') {
        const result = await api.instant(req)
        const jobId = `instant-${crypto.randomUUID()}`
        onInstantResult(result.findings ?? [], jobId, req)
        setLoading(false)
        onClose()
        setError(null)
      } else {
        const { job_id } = await api.startScan(req)
        onBackgroundStart(job_id, req)
        setLoading(false)
        onClose()
        setError(null)
      }
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl card overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Start Scan
                </Dialog.Title>
                <button className="btn-ghost p-1.5" onClick={handleClose} disabled={loading}>
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-5">
                {/* Source selector */}
                <div>
                  <label className="label">Source</label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCES.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSource(s.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          source === s.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Source-specific form */}
                {source === 'git'        && <GitForm value={gitCfg} onChange={setGitCfg} />}
                {source === 'github'     && <GitHubForm value={ghCfg} onChange={setGhCfg} />}
                {source === 'gitlab'     && <GitLabForm value={glCfg} onChange={setGlCfg} />}
                {source === 'filesystem' && <FilesystemForm value={fsCfg} onChange={setFsCfg} />}
                {source === 's3'         && <S3Form value={s3Cfg} onChange={setS3Cfg} />}
                {source === 'docker'     && <DockerForm value={dockerCfg} onChange={setDockerCfg} />}

                {/* Divider */}
                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Global options */}
                <GlobalOptions
                  verify={verify}
                  filterUnverified={filterUnverified}
                  concurrency={concurrency}
                  scanMode={scanMode}
                  onChange={handleGlobalChange}
                />

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <button className="btn-secondary" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  className="btn-primary min-w-[100px]"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Scanning…
                    </span>
                  ) : (
                    'Run Scan'
                  )}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
