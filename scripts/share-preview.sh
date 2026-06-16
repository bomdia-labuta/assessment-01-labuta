#!/usr/bin/env bash
#
# share-preview.sh — sobe o assessment em modo dev e expõe um link público
# temporário (Cloudflare quick tunnel) para o time de design revisar.
#
# Uso:   ./scripts/share-preview.sh
# Parar: Ctrl-C  (derruba o dev server e o túnel)
#
# Observações:
#  - O link vive ENQUANTO este script estiver rodando nesta máquina (é um túnel,
#    não um deploy). Para revisão assíncrona de longo prazo, prefira o deploy Vercel.
#  - Roda em modo dev → a rota de preview /api/assessment/test-result fica liberada
#    (mostra a result page rica sem precisar preencher o gate nem esperar a geração).
#  - O fluxo real do gate gera a leitura via Claude (~50s) e dispara email (Resend).

set -euo pipefail

PORT="${PORT:-3001}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEV_LOG="$(mktemp -t labuta-dev.XXXX)"
TUNNEL_LOG="$(mktemp -t labuta-tunnel.XXXX)"
DEV_PID=""
TUNNEL_PID=""

cleanup() {
  echo ""
  echo "→ Encerrando preview…"
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null || true
  [ -n "$DEV_PID" ] && kill "$DEV_PID" 2>/dev/null || true
  # garante que a porta libera
  lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
  rm -f "$DEV_LOG" "$TUNNEL_LOG" 2>/dev/null || true
  echo "→ Pronto. Link encerrado."
}
trap cleanup EXIT INT TERM

# 1) cloudflared instalado?
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared não encontrado. Instalando via Homebrew…"
  if ! command -v brew >/dev/null 2>&1; then
    echo "ERRO: Homebrew não encontrado. Instale o cloudflared manualmente:"
    echo "  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    exit 1
  fi
  brew install cloudflared
fi

# 2) libera a porta e sobe o dev server
echo "→ Subindo o app (dev) na porta ${PORT}…"
lsof -ti:"${PORT}" 2>/dev/null | xargs kill -9 2>/dev/null || true
npm run dev -- --port "${PORT}" > "$DEV_LOG" 2>&1 &
DEV_PID=$!

echo "→ Aguardando o Next ficar pronto…"
until grep -qE "Ready in|started server" "$DEV_LOG" 2>/dev/null; do
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "ERRO: o dev server caiu. Log:"; tail -20 "$DEV_LOG"; exit 1
  fi
  sleep 0.5
done
echo "  ✓ app pronto em http://localhost:$PORT"

# 3) abre o túnel público
echo "→ Abrindo túnel público (Cloudflare)…"
cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

PUBLIC_URL=""
for _ in $(seq 1 40); do
  PUBLIC_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1 || true)"
  [ -n "$PUBLIC_URL" ] && break
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "ERRO: o túnel caiu. Log:"; tail -20 "$TUNNEL_LOG"; exit 1
  fi
  sleep 0.5
done

if [ -z "$PUBLIC_URL" ]; then
  echo "ERRO: não consegui obter o link do túnel. Log:"; tail -20 "$TUNNEL_LOG"; exit 1
fi

# 4) imprime o painel de links
cat <<EOF

────────────────────────────────────────────────────────────
  ✅ PREVIEW NO AR — compartilhe estes links com o time
────────────────────────────────────────────────────────────

  Fluxo completo (começa aqui):
    $PUBLIC_URL/

  Gate (captura) — foco da revisão:
    passe pelo fluxo a partir da landing e revise 3+ temas

  Preview da result page (sem gate, sem esperar geração):
    $PUBLIC_URL/api/assessment/test-result

────────────────────────────────────────────────────────────
  O link vive enquanto este terminal estiver aberto.
  Pressione Ctrl-C para encerrar.
────────────────────────────────────────────────────────────

EOF

# mantém vivo até Ctrl-C
wait "$DEV_PID"
