import { useState } from 'react'
import { Moon, Sun, ScanSearch, Clipboard, CheckCircle, AlertCircle } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onToggleTheme: () => void
  onStartScan: () => void
  onQuickScan: (uri: string) => Promise<void>
}

export default function Header({ theme, onToggleTheme, onStartScan, onQuickScan }: Props) {
  const [clipState, setClipState] = useState<'idle' | 'success' | 'error'>('idle')
  const [clipError, setClipError] = useState('')

  async function handleQuickScan() {
    let text = ''
    try {
      text = (await navigator.clipboard.readText()).trim()
    } catch {
      setClipError('Clipboard access denied')
      setClipState('error')
      setTimeout(() => setClipState('idle'), 3000)
      return
    }
    if (!text) {
      setClipError('Clipboard is empty')
      setClipState('error')
      setTimeout(() => setClipState('idle'), 3000)
      return
    }
    try {
      await onQuickScan(text)
      setClipState('success')
      setTimeout(() => setClipState('idle'), 2000)
    } catch (e) {
      setClipError(String(e))
      setClipState('error')
      setTimeout(() => setClipState('idle'), 3000)
    }
  }

  const clipIcon =
    clipState === 'success' ? <CheckCircle size={16} className="text-green-500" /> :
    clipState === 'error'   ? <AlertCircle size={16} className="text-red-500" /> :
                              <Clipboard size={16} />

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur
                       dark:border-gray-800 dark:bg-gray-950/80">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
          <span className="text-2xl">🐷</span>
          <span>SecretPig</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              className="btn-secondary gap-2"
              onClick={handleQuickScan}
              title="Paste a Git URL from clipboard and start a background scan with verification"
            >
              {clipIcon}
              Quick Scan
            </button>
            {clipState === 'error' && (
              <div className="absolute top-full right-0 mt-1 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {clipError}
              </div>
            )}
          </div>

          <button
            className="btn-primary gap-2"
            onClick={onStartScan}
          >
            <ScanSearch size={16} />
            Start Scan
          </button>

          <button
            className="btn-ghost p-2"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
