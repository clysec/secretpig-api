import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Lock, AlertCircle } from 'lucide-react'

interface Props {
  mode: string
  open: boolean
  onSubmit: (token: string) => void
}

export default function AuthModal({ mode, open, onSubmit }: Props) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!token.trim()) {
      setError('Token is required')
      return
    }
    setError('')
    onSubmit(token.trim())
  }

  // For jwt/oidc modes we can't collect credentials in the UI in a meaningful way.
  const unsupported = mode !== 'token'

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-sm card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Lock size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
                    Authentication required
                  </Dialog.Title>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Mode: <span className="font-mono">{mode}</span>
                  </p>
                </div>
              </div>

              {unsupported ? (
                <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Auth mode <strong>{mode}</strong> requires credentials to be configured
                    outside the UI (e.g. via a reverse proxy or browser extension).
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">Bearer token</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Enter your API token"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  <button className="btn-primary w-full" onClick={handleSubmit}>
                    Authenticate
                  </button>
                </>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
