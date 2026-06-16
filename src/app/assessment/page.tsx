'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, initSession, saveSession } from '@/lib/assessment/session'

export default function AssessmentPage() {
  const router = useRouter()

  useEffect(() => {
    let session = loadSession()
    // Se não tem nodeOrder (sessão nova ou corrompida), reinicia
    if (!session.nodeOrder?.length) {
      session = initSession()
      saveSession(session)
    }
    router.replace('/assessment/0')
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e12' }}>
      <div className="text-gray-500 text-sm">Carregando…</div>
    </main>
  )
}
