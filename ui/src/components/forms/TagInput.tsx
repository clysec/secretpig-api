import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface Props {
  label: string
  description?: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  required?: boolean
}

export default function TagInput({
  label,
  description,
  value,
  onChange,
  placeholder = 'Type and press Enter',
  required,
}: Props) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  function remove(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{description}</p>
      )}
      <div
        className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-300 bg-white
                   dark:border-gray-600 dark:bg-gray-800 focus-within:ring-1 focus-within:ring-indigo-500
                   focus-within:border-indigo-500 dark:focus-within:ring-indigo-400 min-h-[2.5rem]"
      >
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5
                       text-xs text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none
                     placeholder-gray-400 dark:placeholder-gray-500
                     text-gray-900 dark:text-gray-100"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={value.length === 0 ? placeholder : ''}
        />
      </div>
    </div>
  )
}
