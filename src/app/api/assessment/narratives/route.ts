// src/app/api/assessment/narratives/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getNarrativesForNode } from '@/lib/supabase/responses'
import type { NodeSlug } from '@/lib/assessment/types'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') as NodeSlug | null
  if (!slug) return NextResponse.json([], { status: 400 })
  const narratives = await getNarrativesForNode(slug)
  return NextResponse.json(narratives)
}
