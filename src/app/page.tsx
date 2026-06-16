import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e12' }}>
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-8 text-center">
        <div className="flex flex-col gap-3">
          <p className="text-purple-400 font-bold text-xs tracking-widest uppercase">LABUTA LABS</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Um mapa das tensões que atravessam a sua organização
          </h1>
        </div>

        <p className="text-gray-400 text-base leading-relaxed max-w-xl mx-auto">
          Você revisa micro-narrativas de situações comuns no dia a dia organizacional —
          comunicação, poder, sobrecarga, decisões, conflitos entre áreas. A partir do que
          ressoa com a sua realidade, geramos uma <span className="text-gray-200">leitura sistêmica</span>{' '}
          dos padrões e pontos de alavancagem do seu contexto.
        </p>

        <div className="flex flex-col gap-3 text-sm text-gray-500">
          <p>Gratuito · anônimo · leva ~10 minutos · não é um teste com certo ou errado</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/assessment"
            className="bg-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-purple-500 transition-colors text-sm inline-block"
          >
            Começar o assessment →
          </Link>
          <p className="text-gray-600 text-xs">
            Para times e lideranças que querem enxergar o sistema por trás dos sintomas.
          </p>
        </div>
      </div>
    </main>
  )
}
