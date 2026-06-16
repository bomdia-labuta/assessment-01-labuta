export function renderResultEmail(params: {
  name: string
  resultId: string
  narrativeText: string
  tipologiasNames: string[]
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://assessment.labuta.com'
  const resultUrl = `${baseUrl}/assessment/result/${params.resultId}`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <div style="margin-bottom: 24px;">
    <span style="color: #8b5cf6; font-weight: 700; font-size: 14px; letter-spacing: 2px;">LABUTA LABS</span>
  </div>
  <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Sua leitura sistêmica, ${params.name}</h1>
  <p style="color: #6b7280; margin-bottom: 24px;">Esta é uma leitura possível do sistema que você opera — não a única.</p>
  <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
    <p style="margin: 0; line-height: 1.6; color: #374151;">${params.narrativeText}</p>
  </div>
  <p style="margin-bottom: 8px; font-weight: 600; color: #374151;">Tipologias de intervenção identificadas:</p>
  <ul style="margin-bottom: 24px; color: #6b7280;">
    ${params.tipologiasNames.map(n => `<li style="margin-bottom: 4px;">${n}</li>`).join('')}
  </ul>
  <a href="${resultUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
    Ver leitura completa →
  </a>
  <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">
    Labuta Labs · <a href="https://labuta.com" style="color: #8b5cf6;">labuta.com</a>
  </p>
</body>
</html>
  `.trim()
}

export function renderNotificationEmail(params: {
  leadName: string
  leadEmail: string
  resultId: string
  activatedNodes: { label: string; intensity: number }[]
  tipologiasNames: string[]
  narrativeText: string
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://assessment.labuta.com'
  const resultUrl = `${baseUrl}/assessment/result/${params.resultId}`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <h2 style="font-size: 18px;">Novo assessment — ${params.leadName}</h2>
  <p><strong>Email:</strong> ${params.leadEmail}</p>
  <p><strong>Nós ativados:</strong></p>
  <ul>
    ${params.activatedNodes.map(n => `<li>${n.label}: ${(n.intensity * 100).toFixed(0)}%</li>`).join('')}
  </ul>
  <p><strong>Tipologias sugeridas:</strong> ${params.tipologiasNames.join(', ')}</p>
  <p><strong>Leitura gerada:</strong></p>
  <blockquote style="border-left: 3px solid #8b5cf6; padding-left: 12px; color: #6b7280;">${params.narrativeText}</blockquote>
  <a href="${resultUrl}">Ver resultado completo →</a>
</body>
</html>
  `.trim()
}
