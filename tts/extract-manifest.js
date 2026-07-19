/* ══════════════════════════════════════════════════════════════
   tts/extract-manifest.js — baut tts/manifest.json
   Extrahiert vertonbare Einheiten aus den Spieldateien, aktuell:
   - Phase 1: STORY_ENTRIES (script/story.js) — 1 Datei pro Eintrag
   - Phase 2: EP_SKILL_TREE learnDialogs (script/experience.js)
   Spätere Phasen (NPCs, Quests, …) werden hier ergänzt.
   Idempotent: bestehende manifest.json wird überschrieben, die
   Fortschritts-Daten liegen separat in progress.json.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* Spieldateien deklarieren nur Konstanten/Funktionen — Top-Level führt nichts
   aus. Ein leerer Sandbox-Kontext reicht; Funktionswerte (unlockFlag etc.)
   werden nie aufgerufen. */
function evalGameFile(relPath, resultExpr) {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return vm.runInNewContext(src + '\n;' + resultExpr, {}, { filename: relPath });
}

const NARRATOR_VOICE = 'Iapetus';
/* Stand 19.07.2026, Qualitäts-Überarbeitung v2: Feedback nach v1-Hörprobe
   (story-1-1) war "immer noch langweilig, kein Charakter" + ein Wortfehler
   ("die" statt "der" erste Atemzug). Ergänzt daher: (a) explizite
   Wortwörtlichkeits-Anweisung gegen Text-Drift, (b) Anweisung zu kräftigerer,
   präsenterer Stimme mit ausdrücklicher Erlaubnis, Emotion eher zu übertreiben
   als zurückhaltend zu bleiben. */
const NARRATOR_STYLE =
  'Du bist ein junger Mann von neunzehn Jahren mit einer kräftigen, präsenten ' +
  'Stimme voller Charakter — kein leises, zurückhaltendes Vorlesen, sondern ein ' +
  'Erzähler, der mit echter innerer Beteiligung und vollem Ausdruck spricht. ' +
  'Dieses Timbre und diese Sprechweise bleiben über alle Aufnahmen hinweg exakt ' +
  'gleich, unabhängig vom Inhalt — es ist immer dieselbe Person.\n' +
  'Sprich niemals monoton oder gleichförmig. Trage den Text kraftvoll, lebendig ' +
  'und emotional intensiv vor: Angst klingt spürbar gehetzt und mit stockendem ' +
  'Atem; Wut hart, scharf und laut; Hoffnung hell, warm und energisch; ' +
  'Verzweiflung brüchig, aber durchdrungen; ruhige Reflexion langsamer, aber mit ' +
  'Gewicht und Präsenz; Erleichterung hörbar befreit. Übertreibe die Emotion ' +
  'lieber zu stark als zu schwach — Zurückhaltung ist hier unerwünscht. Wechsle ' +
  'diese Färbung innerhalb des Textes, sobald sich die Stimmung des ' +
  'Ich-Erzählers ändert.\n' +
  'Lies den folgenden Text auf Deutsch exakt wortwörtlich vor, ohne Wörter zu ' +
  'verändern, hinzuzufügen oder wegzulassen:';

const units = [];

/* Phase 1 — Story-Chronik */
const storyEntries = evalGameFile('script/story.js', 'STORY_ENTRIES');
for (const e of storyEntries) {
  units.push({
    id: `story-${e.id.replace(/\./g, '-')}`,
    phase: 1,
    category: 'story',
    title: e.title,
    voice: NARRATOR_VOICE,
    style: NARRATOR_STYLE,
    text: e.text.join('\n\n')
  });
}

/* Phase 2 — Skill-Monologe (learnDialogs).
   Bei Multi-Level-Skills ist learnDialogs eine Funktion level => string[]
   (eigener Monolog pro Stufe) → eine Audiodatei pro Stufe. */
const skillTree = evalGameFile('script/experience.js', 'EP_SKILL_TREE');
for (const node of skillTree) {
  if (!node.learnDialogs) continue;
  const perLevel = typeof node.learnDialogs === 'function'
    ? Array.from({ length: node.maxLevel }, (_, i) => ({
        suffix: `-l${i + 1}`, dialogs: node.learnDialogs(i + 1)
      }))
    : [{ suffix: '', dialogs: node.learnDialogs }];
  for (const { suffix, dialogs } of perLevel) {
    if (!dialogs || !dialogs.length) continue;
    units.push({
      id: `skill-${node.id}${suffix}`,
      phase: 2,
      category: 'skill-monolog',
      title: node.name + (suffix ? ` (Stufe ${suffix.slice(2)})` : ''),
      voice: NARRATOR_VOICE,
      style: NARRATOR_STYLE,
      text: dialogs.join('\n\n')
    });
  }
}

const totalChars = units.reduce((s, u) => s + u.text.length, 0);
fs.writeFileSync(
  path.join(__dirname, 'manifest.json'),
  JSON.stringify({ generated: new Date().toISOString(), units }, null, 2)
);
console.log(`manifest.json: ${units.length} Einheiten, ${totalChars} Zeichen`);
const byPhase = {};
for (const u of units) byPhase[u.phase] = (byPhase[u.phase] || 0) + 1;
for (const [p, n] of Object.entries(byPhase)) console.log(`  Phase ${p}: ${n} Einheiten`);
