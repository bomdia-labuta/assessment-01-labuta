// src/app/api/assessment/tags/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { classifyTags } from '@/lib/ai/tagging'

const Schema = z.object({ text: z.string().min(1).max(500) })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ tags: [] }, { status: 400 })
  try {
    const tags = await classifyTags(parsed.data.text)
    return NextResponse.json({ tags })
  } catch {
    return NextResponse.json({ tags: [] })
  }
}
