import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
} from '@react-email/components'

interface ResultEmailProps {
  name: string
  resultUrl: string
  graphImageUrl: string | null
}

export function ResultEmail({ name, resultUrl, graphImageUrl }: ResultEmailProps) {
  const firstName = name.split(' ')[0]
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0e0e12', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
          <Text style={{ color: '#a855f7', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>
            LABUTA LABS
          </Text>

          <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: 'bold', margin: '16px 0 8px' }}>
            {firstName ? `Seu mapa, ${firstName}.` : 'Seu mapa organizacional.'}
          </Text>

          <Text style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>
            O seu grafo de pontos de alavancagem está pronto.
          </Text>

          {graphImageUrl && (
            <Section style={{ margin: '24px 0' }}>
              <Img
                src={graphImageUrl}
                alt="Seu grafo organizacional"
                width={520}
                style={{ borderRadius: 16, display: 'block' }}
              />
            </Section>
          )}

          <Button
            href={resultUrl}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
              margin: '8px 0 24px',
            }}
          >
            Ver resultado completo →
          </Button>

          <Hr style={{ borderColor: '#1f2937' }} />

          <Text style={{ color: '#4b5563', fontSize: 12 }}>
            Labuta Labs · Sem spam, só leituras que podem ser úteis.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
