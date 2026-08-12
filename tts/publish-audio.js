/* ══════════════════════════════════════════════════════════════
   tts/publish-audio.js — veröffentlicht fertige Vertonungen
   Kopiert jede Einheit, die BEIDES hat (output/opus/<id>.opus UND
   output/<id>.words.json), nach tts/audio/ — das committete Verzeichnis,
   aus dem das Spiel lädt (siehe getStoryAudioSrc()/getStoryWordsSrc()
   in script/story.js). Einheiten ohne Wort-Zeitstempel werden bewusst
   NICHT veröffentlicht: das Spiel zeigt die Audio-UI nur mit Timing-Daten
   (User-Entscheidung 12.08.2026).

   Idempotent — kopiert nur, was fehlt oder neuer ist. Nach jedem Lauf
   die neuen Dateien in tts/audio/ committen.
   Aufruf: node tts/publish-audio.js
   ══════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');
const OPUS = path.join(OUT, 'opus');
const AUDIO = path.join(__dirname, 'audio');

fs.mkdirSync(AUDIO, { recursive: true });

let published = 0, skippedNoWords = 0, upToDate = 0;
for (const f of fs.readdirSync(OPUS).filter(f => f.endsWith('.opus'))) {
  const id = path.basename(f, '.opus');
  const words = path.join(OUT, `${id}.words.json`);
  if (!fs.existsSync(words)) { skippedNoWords++; continue; }

  let copied = false;
  for (const [src, dst] of [
    [path.join(OPUS, f), path.join(AUDIO, f)],
    [words, path.join(AUDIO, `${id}.words.json`)]
  ]) {
    if (!fs.existsSync(dst) || fs.statSync(src).mtimeMs > fs.statSync(dst).mtimeMs) {
      fs.copyFileSync(src, dst);
      copied = true;
    }
  }
  copied ? published++ : upToDate++;
}

console.log(`Veröffentlicht/aktualisiert: ${published}, bereits aktuell: ${upToDate}, ohne Wort-Timing zurückgehalten: ${skippedNoWords}`);
