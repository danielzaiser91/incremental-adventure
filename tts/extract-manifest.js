/* ══════════════════════════════════════════════════════════════
   tts/extract-manifest.js — baut tts/manifest.json
   Extrahiert vertonbare Einheiten aus den Spieldateien, aktuell:
   - Phase 1: STORY_ENTRIES (script/story.js) — 1 Datei pro Eintrag
   - Phase 2: EP_SKILL_TREE learnDialogs (script/experience.js)
   - Phase 3/4: NPC-Dialogknoten (script/npc.js), siehe `ACTIVE_NPC_PHASES`
   - Phase 5: Quest-Beschreibungen (script/quests.js) + Zieltexte
     (script/objective.js)
   Spätere Phasen (Welt-Flavor, Achievements) werden hier ergänzt.
   Idempotent: bestehende manifest.json wird überschrieben, die
   Fortschritts-Daten liegen separat in progress.json.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

/* Spieldateien deklarieren nur Konstanten/Funktionen — Top-Level führt nichts
   aus. Ein leerer Sandbox-Kontext reicht; Funktionswerte (unlockFlag etc.)
   werden nie aufgerufen. */
function evalGameFile(relPath, resultExpr, sandbox = {}) {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return vm.runInNewContext(src + '\n;' + resultExpr, sandbox, { filename: relPath });
}

/* npc.js referenziert im Gegensatz zu story.js/experience.js schon beim Laden
   fremde Globals (z.B. `location: CONTENT.TAVERNE`). Dieser Stub-Sandbox
   liefert für jede unbekannte Variable und jeden Property-Zugriff darauf
   wieder denselben Proxy — echte Built-ins (Object, Math, …) bleiben echt. */
function stubSandbox() {
  const stub = new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive || k === 'toString' ? () => '' : stub),
    apply: () => stub,
    construct: () => stub
  });
  return new Proxy({}, {
    has: () => true,
    get: (t, k) => (k in globalThis ? globalThis[k] : (k in t ? t[k] : stub)),
    set: (t, k, v) => { t[k] = v; return true; }
  });
}

const NARRATOR_VOICE = 'Iapetus';
/* Stand 19.07.2026, Qualitäts-Überarbeitung v3: v1 war "langweilig, kein
   Charakter" + Wortfehler ("die" statt "der" erste Atemzug). v2 (Anweisung,
   Emotion "lieber zu stark als zu schwach" zu übertreiben) war dann "over the
   top". v3 zielt auf die Mitte: präsente, charaktervolle Stimme mit klarer
   emotionaler Dynamik, aber glaubwürdig/natürlich statt theatralisch
   übertrieben. Wortwörtlichkeits-Anweisung bleibt (gegen Text-Drift). */
const NARRATOR_STYLE =
  'Du bist ein junger Mann von neunzehn Jahren mit einer kräftigen, präsenten ' +
  'Stimme voller Charakter — kein leises, zurückhaltendes Vorlesen, sondern ein ' +
  'Erzähler, der mit echter innerer Beteiligung spricht. Dieses Timbre und ' +
  'diese Sprechweise bleiben über alle Aufnahmen hinweg exakt gleich, ' +
  'unabhängig vom Inhalt — es ist immer dieselbe Person.\n' +
  'Sprich niemals monoton oder gleichförmig, aber auch nicht theatralisch oder ' +
  'überzogen — glaubwürdig und natürlich, wie ein echter Mensch, der seine ' +
  'eigene Geschichte erzählt. Lass die Stimmung der jeweiligen Szene spürbar, ' +
  'aber maßvoll durchscheinen: Angst klingt angespannt und mit leicht ' +
  'stockendem Atem; Wut wird fester und schärfer im Ton, nicht laut schreiend; ' +
  'Hoffnung klingt wärmer und offener; Verzweiflung leiser und brüchig; ruhige ' +
  'Reflexion langsamer und nachdenklich; Erleichterung hörbar gelöster. Wechsle ' +
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

/* ── Phase 3/4 — NPC-Dialogknoten ──────────────────────────────
   Pro NPC eine feste, einmal gewählte Gemini-Stimme (ändert sich nie mehr,
   sonst klingt derselbe Charakter zwischen zwei Knoten wie zwei Personen)
   plus eine Persona-Zeile, die aus der `tagline` des NPCs abgeleitet ist.
   Knotentexte mischen Erzähl-Regie ("Korbin lacht trocken.") mit wörtlicher
   Rede — beides spricht die NPC-Stimme, der Erzähler (Iapetus) bleibt für
   Story/Monologe reserviert. */
const NPC_PROFILES = {
  /* Phase 3 — story-kritische NPCs */
  sivert: { phase: 3, voice: 'Charon', persona:
    'ein ruhiger, wohlüberlegter Agrarberater Mitte vierzig, der auf Reisen ist. ' +
    'Er sagt wenig und meint jedes Wort: sachlich, unaufgeregt, mit leiser ' +
    'Autorität und kurzen Denkpausen — nie hektisch, nie werbend' },
  brakka: { phase: 3, voice: 'Algenib', persona:
    'ein kräftiger Schmied mit rauer, tiefer Stimme und trockenem Humor. ' +
    'Er redet kurz angebunden und poltert gern, hat aber ein warmes Herz unter ' +
    'der harten Schale — Spott klingt bei ihm freundlich, nie gehässig' },
  fremder: { phase: 3, voice: 'Enceladus', persona:
    'ein zwielichtiger Mann am Rand des Schankraums, dessen Blick ständig ' +
    'wandert. Er spricht leise und gedämpft, halb verschluckt, immer auf der ' +
    'Hut — lauernd und ausweichend, niemals laut' },
  mira: { phase: 3, voice: 'Aoede', persona:
    'eine junge, charmante und gewitzte Frau mit einem Lächeln in der Stimme. ' +
    'Sie spricht leicht und spielerisch, gern mit neckischem Unterton, und ' +
    'lässt durchklingen, dass sie mehr weiß, als sie zugibt' },
  oswin: { phase: 3, voice: 'Orus', persona:
    'ein hochnäsiger Mann, der nur mit denen spricht, die etwas vorzuweisen ' +
    'haben. Sein Ton ist kühl, gedehnt und betont gelangweilt, mit spöttischem ' +
    'Unterton und herablassender Höflichkeit' },
  /* Phase 4 — Neben-NPCs (Stimmen vorab festgelegt, noch nicht aktiv) */
  wirt: { phase: 4, voice: 'Umbriel', persona:
    'ein herzlicher Wirt mit warmer, gelassener Stimme, der Fremden gegenüber ' +
    'aber wachsam bleibt und die Stimme senkt, wenn es heikel wird' },
  kommandant: { phase: 4, voice: 'Alnilam', persona:
    'ein strammer, disziplinierter Wachkommandant. Klare, feste Kommandostimme, ' +
    'knappe Sätze, sparsam mit Lob' },
  vorarbeiter: { phase: 4, voice: 'Gacrux', persona:
    'ein wortkarger, fairer Vorarbeiter mit rauer, gesetzter Stimme — wer ' +
    'ordentlich schuftet, hört den Respekt heraus' },
  greta: { phase: 4, voice: 'Despina', persona:
    'eine geschäftstüchtige, freundliche Krämerin; flüssig und zugewandt im Ton, ' +
    'mit hörbarer Begeisterung, sobald sie eine neue Idee hat' },
  torben: { phase: 4, voice: 'Rasalgethi', persona:
    'ein Gildenvorsteher, der jeden hat kommen und gehen sehen: gemessen, ' +
    'nüchtern, mit einem Anflug von Müdigkeit hinter der Sachlichkeit' },
  strassenkehrer: { phase: 4, voice: 'Zubenelgenubi', persona:
    'ein alter Straßenkehrer, der jede Gasse kennt und gern darüber redet — ' +
    'plaudernd, umgangssprachlich, mit brüchiger Altersstimme' }
};
const ACTIVE_NPC_PHASES = new Set([3, 4]);

function npcStyle(persona) {
  return (
    `Du sprichst eine feste Rolle: ${persona}. Dieses Timbre und diese ` +
    'Sprechweise bleiben über alle Aufnahmen hinweg exakt gleich, unabhängig ' +
    'vom Inhalt — es ist immer dieselbe Person.\n' +
    'Der Text mischt kurze Regie-/Beschreibungssätze mit wörtlicher Rede in ' +
    'Anführungszeichen. Sprich beides in derselben Rollenstimme: die ' +
    'Beschreibungssätze etwas ruhiger und zurückgenommen, die wörtliche Rede ' +
    'voll in der Rolle. Anführungszeichen selbst werden nicht mitgesprochen.\n' +
    'Sprich niemals monoton, aber auch nicht theatralisch überzogen — ' +
    'glaubwürdig und natürlich. Lass die Stimmung der Szene maßvoll ' +
    'durchscheinen und wechsle die Färbung, sobald sie sich im Text ändert.\n' +
    'Lies den folgenden Text auf Deutsch exakt wortwörtlich vor, ohne Wörter zu ' +
    'verändern, hinzuzufügen oder wegzulassen:'
  );
}

const npcs = evalGameFile('script/npc.js', 'NPCS', stubSandbox());
const npcSkipped = [];
for (const [npcId, npc] of Object.entries(npcs)) {
  const profile = NPC_PROFILES[npcId];
  if (!profile) { npcSkipped.push(`${npcId} (kein Stimmprofil)`); continue; }
  if (!ACTIVE_NPC_PHASES.has(profile.phase)) continue;
  for (const [nodeId, node] of Object.entries(npc.nodes || {})) {
    /* Knoten mit dynamischem Text (text: () => …) hängen vom Spielstand ab —
       nicht statisch vertonbar, bewusst ausgelassen. */
    if (!Array.isArray(node.text) || !node.text.length) {
      npcSkipped.push(`${npcId}.${nodeId} (kein statisches text-Array)`);
      continue;
    }
    units.push({
      id: `npc-${npcId}-${nodeId}`,
      phase: profile.phase,
      category: 'npc-dialog',
      title: `${npc.name} — ${nodeId}`,
      voice: profile.voice,
      style: npcStyle(profile.persona),
      text: node.text.join('\n\n')
    });
  }
}

/* ── Phase 5 — Quests & Objectives ─────────────────────────────
   Beides sind Ich-Texte des Spielers (Tagebuch-/Zielperspektive) → Erzähler-
   stimme Iapetus, kein eigenes Stimmprofil.
   Quests: pro Quest eine Einheit je Zustand aus `descByState`. Zustände mit
   dynamischem Text (`descByState.x` als Funktion) hängen vom Spielstand ab und
   werden ausgelassen — dieselbe Regel wie bei den NPC-Knoten.
   Objectives: `getObjectiveText()` ist Code, keine Datenstruktur — die Texte
   werden daher aus dem Quelltext der Funktion gelesen. Nur einfache String-
   Literale; Template-Literale (`${mutNeeded}` etc.) sind laufzeitabhängig und
   fallen bewusst heraus. Die ID ist ein Kurz-Hash des Textes, weil es keinen
   stabilen Schlüssel gibt (eine laufende Nummer würde sich bei jeder Umsortie-
   rung im Code verschieben und bereits vertonte Einheiten neu zuordnen).
   Ausgelassen: `getExplicitGoalText()` — reine Funktionslabels ("Die Taverne
   aufsuchen.") bzw. Zahlenanzeigen. */
const questSkipped = [];
const questDefs = evalGameFile('script/quests.js', 'QUEST_DEFS');
for (const q of questDefs) {
  for (const [state, desc] of Object.entries(q.descByState || {})) {
    if (typeof desc !== 'string' || !desc.trim()) {
      questSkipped.push(`${q.id}.${state} (kein statischer Text)`);
      continue;
    }
    units.push({
      id: `quest-${q.id}-${state}`,
      phase: 5,
      category: 'quest-desc',
      title: `${q.title} — ${state}`,
      voice: NARRATOR_VOICE,
      style: NARRATOR_STYLE,
      text: desc
    });
  }
}

function objectiveTexts() {
  const src = fs.readFileSync(path.join(ROOT, 'script/objective.js'), 'utf8');
  const start = src.indexOf('{', src.indexOf('function getObjectiveText'));
  let depth = 0, end = start;
  for (; end < src.length; end++) {
    if (src[end] === '{') depth++;
    else if (src[end] === '}' && --depth === 0) break;
  }
  const body = src.slice(start, end);
  return [...body.matchAll(/return\s+'((?:[^'\\]|\\.)*)'/g)]
    .map(m => m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
}

for (const text of objectiveTexts()) {
  const hash = crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
  units.push({
    id: `objective-${hash}`,
    phase: 5,
    category: 'objective',
    title: text.slice(0, 48) + (text.length > 48 ? '…' : ''),
    voice: NARRATOR_VOICE,
    style: NARRATOR_STYLE,
    text
  });
}

/* TTS-Text-Overrides: Ersatztexte NUR für die Vertonung, wenn der
   Originaltext von der API reproduzierbar abgelehnt wird (Spieltext in den
   script/-Dateien bleibt unverändert!).
   Aktuell leer — der Eintrag für `npc-greta-turnIn` ist am 12.08.2026 wieder
   entfernt worden: Die Sonden-Diagnostik hat gezeigt, dass nicht der Text den
   HTTP 400 auslöst, sondern der Persona-Stil-Prompt (siehe
   TTS_STYLE_OVERRIDES unten). Ein Ersatztext wäre sogar schädlich, weil das
   Wort-Highlighting die gesprochenen Wörter gegen den ANGEZEIGTEN Spieltext
   ausrichtet — Abweichungen verschieben die Hervorhebung. */
const TTS_TEXT_OVERRIDES = {};
for (const u of units) {
  if (TTS_TEXT_OVERRIDES[u.id]) u.text = TTS_TEXT_OVERRIDES[u.id];
}

/* TTS-Stil-Overrides: einzelne Knoten, die NICHT mit dem Stil-Prompt ihrer
   Kategorie generiert werden. Anlass (12.08.2026): `npc-greta-turnIn`
   scheiterte 8× mit HTTP 400; die Gratis-Sonde mit unverändertem Text und
   unveränderter Stimme, aber Erzähler-Stil statt Greta-Persona lieferte
   sofort HTTP 200 mit Audio. Auslöser ist also der Prompt, nicht der Text.
   Der Erzähler-Stil selbst taugt für Greta trotzdem nicht — er beschreibt
   einen neunzehnjährigen jungen Mann. Deshalb hier eine umformulierte
   Greta-Persona: gleiche Rolle, andere Worte. Die Stimme (Despina) bleibt
   unverändert, damit Greta über alle Knoten dieselbe Person bleibt.
   Fällt dieser Knoten erneut auf 400, ist der belegte Ausweichweg der reine
   `NARRATOR_STYLE` (einmal mit HTTP 200 bestätigt). */
const TTS_STYLE_OVERRIDES = {
  /* Umformulierte Persona getestet 12.08.2026, 23:0x Uhr — erneut HTTP 400.
     Damit liegt es nicht an der Wortwahl der Rollenzeile, sondern am
     NPC-Prompt-Aufbau in Kombination mit genau diesem Knotentext. Es gilt
     wieder der einzige belegte Weg: */
  'npc-greta-turnIn': NARRATOR_STYLE,
  /* `npc-mira-greet` — derselbe Befund, belegt am 14.08.2026 mit zwei
     kostenlosen Sonden bei erschöpfter Quota: Original-Stil → HTTP 400,
     Erzähler-Stil bei unveränderter Stimme (Aoede) → HTTP 429, die
     Kombination passiert also die Validierung. Der Knoten scheiterte seit
     26.07.2026 an 3× HTTP 400 und stand seither in `SKIP_IDS`; er ist dort
     jetzt heraus und läuft mit Erzähler-Stil regulär mit. Die Stimme bleibt
     Aoede, damit Mira über alle Knoten dieselbe Person bleibt. */
  'npc-mira-greet': NARRATOR_STYLE
};
for (const u of units) {
  if (TTS_STYLE_OVERRIDES[u.id]) u.style = TTS_STYLE_OVERRIDES[u.id];
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
const skipped = [...npcSkipped, ...questSkipped];
if (skipped.length) console.log(`  übersprungen: ${skipped.join(', ')}`);
