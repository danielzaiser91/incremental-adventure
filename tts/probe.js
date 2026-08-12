/* ══════════════════════════════════════════════════════════════
   tts/probe.js — Gratis-Diagnostik für reproduzierbare HTTP-400-Einheiten
   Schickt EINEN Request für eine Manifest-Einheit, optional mit getauschter
   Stimme/Stil, und wertet NUR den Antworttyp aus. Schreibt nie in
   progress.json und erzeugt keine Dateien.

   Der Trick (Erkenntnis 07.08.2026): HTTP 400 wird VOR der Quota-Prüfung
   ausgewertet. Bei ERSCHÖPFTER Tagesquota ist die Sonde deshalb kostenlos
   und trotzdem aussagekräftig:
     400 → die gesendete Kombination ist der Auslöser (invalid),
     429 → die gesendete Kombination wäre gültig (nur Quota fehlt).
   So lässt sich isolieren, ob Text oder Stimme/Stil den Fehler triggert,
   ohne einen Batch-Slot zu opfern. Bei freier Quota kostet ein 429-Ausgang
   natürlich nichts, ein Erfolgs-Ausgang dagegen einen Slot — die Sonde
   deshalb bevorzugt NACH dem Tagesbatch laufen lassen.

   Aufruf: node tts/probe.js <unit-id> [--voice <Name>] [--narrator-style]
   ══════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');

const MODEL = 'gemini-3.1-flash-tts-preview';

function loadEnvKey() {
  const line = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split(/\r?\n/).find(l => l.startsWith('GEMINI_API_KEY='));
  if (!line) throw new Error('GEMINI_API_KEY fehlt in .env.local');
  return line.slice('GEMINI_API_KEY='.length).trim();
}

async function main() {
  const [id] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!id) throw new Error('Aufruf: node tts/probe.js <unit-id> [--voice <Name>] [--narrator-style]');
  const voiceArg = process.argv.indexOf('--voice');
  const useNarratorStyle = process.argv.includes('--narrator-style');

  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  const unit = manifest.units.find(u => u.id === id);
  if (!unit) throw new Error(`Einheit "${id}" nicht im Manifest`);
  const narrator = manifest.units.find(u => u.category === 'story');

  const voice = voiceArg > -1 ? process.argv[voiceArg + 1] : unit.voice;
  const style = useNarratorStyle ? narrator.style : unit.style;

  console.log(`Sonde: ${id} | Stimme: ${voice}${voice !== unit.voice ? ' (getauscht)' : ''} | Stil: ${useNarratorStyle ? 'Erzähler (getauscht)' : 'original'}`);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': loadEnvKey() },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${style}\n\n${unit.text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
        }
      })
    }
  );
  const body = await res.text();
  if (res.status === 400) {
    console.log('ERGEBNIS: HTTP 400 — diese Kombination ist der Auslöser (unabhängig von Quota).');
  } else if (res.status === 429) {
    console.log('ERGEBNIS: HTTP 429 — diese Kombination wäre gültig (nur Quota erschöpft).');
  } else if (res.ok) {
    const hasAudio = /inlineData/.test(body);
    console.log(`ERGEBNIS: HTTP 200 ${hasAudio ? 'mit Audio — Kombination funktioniert (hat einen Quota-Slot gekostet!)' : 'OHNE Audio (finishReason OTHER?) — Leerantwort'}`);
  } else {
    console.log(`ERGEBNIS: HTTP ${res.status} — ${body.slice(0, 300)}`);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
