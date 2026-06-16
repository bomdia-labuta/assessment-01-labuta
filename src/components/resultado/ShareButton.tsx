'use client'

interface Props {
  shareUrl: string
}

export function ShareButton({ shareUrl }: Props) {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(shareUrl)}
      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
    >
      Compartilhar leitura
    </button>
  )
}
