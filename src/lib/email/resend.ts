import { Resend } from 'resend'
import { render } from '@react-email/components'
import { ResultEmail } from './result-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@labuta.com'
const LABUTA_EMAIL = process.env.LABUTA_NOTIFICATION_EMAIL ?? 'oilabutalabs@gmail.com'

export interface SendResultEmailParams {
  to: string
  name: string
  resultId: string
  graphImageUrl: string | null
  resultUrl?: string
}

export async function sendResultEmail({
  to,
  name,
  resultId,
  graphImageUrl,
  resultUrl,
}: SendResultEmailParams): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://assessment.labuta.com'
  const resolvedResultUrl = resultUrl ?? `${baseUrl}/assessment/result/${resultId}`

  const html = await render(
    ResultEmail({ name, resultUrl: resolvedResultUrl, graphImageUrl }),
  )

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Seu mapa organizacional está pronto',
    html,
  })
}

export async function sendNotificationEmail(params: {
  leadName: string
  leadEmail: string
  resultId: string
  activatedNodes: { label: string; intensity: number }[]
  tipologiasNames: string[]
  narrativeText: string
}): Promise<void> {
  const { renderNotificationEmail } = await import('./templates')
  await resend.emails.send({
    from: FROM,
    to: LABUTA_EMAIL,
    subject: `Novo assessment — ${params.leadName}`,
    html: renderNotificationEmail(params),
  })
}
