#!/usr/bin/env bash
# Patcht die #patchnotes-Nachricht direkt via Discord API — kein GitHub Actions nötig.
# Verwendung: bash scripts/discord-patch-patchnotes.sh
# Benötigt: DISCORD_WEBHOOK_PATCHNOTES als Umgebungsvariable ODER in .env.local

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Webhook-URL laden (Umgebungsvariable hat Vorrang, sonst .env.local)
if [ -z "$DISCORD_WEBHOOK_PATCHNOTES" ] && [ -f "$ROOT/.env.local" ]; then
  export $(grep DISCORD_WEBHOOK_PATCHNOTES "$ROOT/.env.local" | xargs)
fi

if [ -z "$DISCORD_WEBHOOK_PATCHNOTES" ]; then
  echo "❌ DISCORD_WEBHOOK_PATCHNOTES nicht gesetzt."
  echo "   Setze die Variable oder lege .env.local an."
  exit 1
fi

IDS_FILE="$ROOT/patchnotes/.discord-ids.json"
PATCHNOTES_FILE="$ROOT/patchnotes/pending-patchnotes.md"
MENTION="<@&1518368928370528256>"

MSG_ID=$(python3 -c "import json; d=json.load(open('$IDS_FILE')); print(d.get('patchnotes_message_id',''))")
LAST_VER=$(python3 -c "import json; d=json.load(open('$IDS_FILE')); print(d.get('patchnotes_last_version',''))")
CURRENT_VER=$(head -1 "$PATCHNOTES_FILE" | grep -oP '(?<=<!-- version: )[^>]+(?= -->)' || true)

CONTENT=$(tail -n +2 "$PATCHNOTES_FILE")
FULL_MSG="${MENTION}
${CONTENT}"

if [ -n "$MSG_ID" ] && [ "$CURRENT_VER" = "$LAST_VER" ]; then
  echo "📝 Selbe Version ($CURRENT_VER), patche Nachricht $MSG_ID..."
  HTTP=$(curl -s -o /tmp/discord_resp.txt -w "%{http_code}" -X PATCH \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json,sys; print(json.dumps({'content': sys.argv[1]}))" "$FULL_MSG")" \
    "${DISCORD_WEBHOOK_PATCHNOTES}/messages/${MSG_ID}")
  if [ "$HTTP" = "200" ]; then
    echo "✅ Discord-Nachricht erfolgreich gepatcht."
  else
    echo "❌ PATCH fehlgeschlagen (HTTP $HTTP):"
    cat /tmp/discord_resp.txt
    exit 1
  fi
else
  echo "⚠️  Neue Version ($CURRENT_VER ≠ $LAST_VER) — bitte per Git pushen (Bot postet neue Nachricht)."
  exit 1
fi
