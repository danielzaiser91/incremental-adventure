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
/* Stand 19.07.2026, Qualitäts-Überarbeitung: Feedback nach Anhören war
   "monoton, ohne Gefühl" und "klingt nicht nach derselben Person". Der Prompt
   ankert daher zuerst eine feste, unveränderliche Stimm-Identität (damit sie
   über getrennte API-Calls hinweg gleich klingt) und fordert danach explizit
   Emotions-/Tempo-/Lautstärke-Dynamik passend zur jeweiligen Szene. */
const NARRATOR_STYLE =
  'Du bist ein junger Mann von neunzehn Jahren mit einer klaren, mittelhohen, ' +
  'leicht rauen Stimme. Dieses Timbre und diese Sprechweise bleiben über alle ' +
  'Aufnahmen hinweg exakt gleich, unabhängig vom Inhalt — es ist immer dieselbe ' +
  'Person, die ihr Tagebuch abends leise für sich liest.\n' +
  'Trage den folgenden Text lebendig und emotional vor, niemals monoton: Passe ' +
  'Tempo, Tonhöhe, Lautstärke und Atmung an die Stimmung der jeweiligen Szene an ' +
  '— Angst klingt gehetzt, leiser und mit stockendem Atem; Wut wird härter, ' +
  'schärfer und lauter; Hoffnung heller und wärmer; Verzweiflung leise und ' +
  'brüchig; ruhige Reflexion langsamer und nachdenklich; Erleichterung spürbar ' +
  'lockerer. Wechsle diese Färbung innerhalb des Textes, sobald sich die ' +
  'Stimmung des Ich-Erzählers ändert. Lies auf Deutsch den folgenden Text:';

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
