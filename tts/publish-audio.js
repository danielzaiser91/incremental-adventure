/* ══════════════════════════════════════════════════════════════
   tts/publish-audio.js — veröffentlicht fertige Vertonungen

   VERSCHIEBT jede Einheit, die BEIDES hat (output/opus/<id>.opus UND
   output/<id>.words.json), nach tts/audio/ — das committete Verzeichnis,
   aus dem das Spiel lädt (siehe getStoryAudioSrc()/getStoryWordsSrc()
   in script/story.js). Einheiten ohne Wort-Zeitstempel werden bewusst
   NICHT veröffentlicht: das Spiel zeigt die Audio-UI nur mit Timing-Daten
   (User-Entscheidung 12.08.2026).

   Verschieben statt kopieren (12.08.2026): Vorher blieb jede
   veröffentlichte Datei zusätzlich in output/ liegen. Das waren zuletzt
   163 Opus-Dateien doppelt auf der Platte, rund 15 MB, und der einzige
   Grund, warum output/ überhaupt ignoriert werden musste. Jetzt gibt es
   jede veröffentlichte Datei genau einmal: in tts/audio/.
   Die WAV-Quellen bleiben in output/ liegen — die sind das Original,
   keine Kopie, und werden zum Neu-Kodieren gebraucht.

   Idempotent: Was schon verschoben wurde, ist in output/ nicht mehr da.
   Nach jedem Lauf die neuen Dateien in tts/audio/ committen.
   Aufruf: node tts/publish-audio.js
   ══════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'output');
const OPUS = path.join(OUT, 'opus');
const AUDIO = path.join(__dirname, 'audio');

fs.mkdirSync(AUDIO, { recursive: true });

/* rename() wirft unter Windows, wenn das Ziel schon existiert -- deshalb
   erst kopieren, dann die Quelle löschen. Ein abgebrochener Lauf lässt so
   höchstens eine Kopie zurück, nie eine verlorene Datei. */
function move(src, dst) {
  fs.copyFileSync(src, dst);
  fs.unlinkSync(src);
}

let published = 0, skippedNoWords = 0;
const opusFiles = fs.existsSync(OPUS)
  ? fs.readdirSync(OPUS).filter(f => f.endsWith('.opus'))
  : [];

for (const f of opusFiles) {
  const id = path.basename(f, '.opus');
  const words = path.join(OUT, `${id}.words.json`);
  if (!fs.existsSync(words)) { skippedNoWords++; continue; }

  move(path.join(OPUS, f), path.join(AUDIO, f));
  move(words, path.join(AUDIO, `${id}.words.json`));
  published++;
}

console.log(
  `Veröffentlicht: ${published}, ohne Wort-Timing zurückgehalten: ${skippedNoWords}`
);
