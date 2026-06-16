import { NextRequest } from 'next/server'
import { getResponse } from '@/lib/supabase/responses'

// Serve a leitura sistêmica salva no banco.
// Gerada no momento do submit — esta rota só faz leitura.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })

  const response = await getResponse(id)
  if (!response) return new Response('Not found', { status: 404 })

  return new Response(response.leitura_sistemica ?? '', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
