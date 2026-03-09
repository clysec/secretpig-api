import { Moon, Sun, ScanSearch } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onToggleTheme: () => void
  onStartScan: () => void
}

export default function Header({ theme, onToggleTheme, onStartScan }: Props) {
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
