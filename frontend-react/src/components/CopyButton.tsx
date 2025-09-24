import React, { useState } from 'react'

type Props = { text: string; className?: string; label?: string }

export default function CopyButton({ text, className = '', label = 'Copy' }: Props) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {}
      }}
      className={`px-2 py-1 rounded-md text-xs bg-chatgpt-sidebar-dark text-chatgpt-primary-dark hover:opacity-90 ${className}`}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
