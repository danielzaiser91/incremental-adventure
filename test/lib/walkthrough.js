'use strict';

const fs = require('fs');

// ── Geschätzte Spielerzeit pro Aktionstyp ─────────────────────────────────────
// Werte basieren auf durchschnittlichem Lesetempo + typischen Reaktionszeiten.
// Können per Kapitel-Modul überschrieben werden, falls Mechaniken abweichen.
const PLAYER_TIME = {
  workSec:          2,    // Warten auf die 2s Feldarbeit-Animation
  dialogPageSec:    12,   // Eine Story-Dialog-Seite lesen
  monologuePageSec: 15,   // Eine längere Monolog-Seite (mehr Text)
  npcDialogSec:     25,   // Einen NPC-Dialogbaum durchlesen
  navigationSec:    3,    // Ort wechseln (Klick + Render)
  sleepSec:         8,    // Schlafplatz aufsuchen + Option wählen
  marketBuySec:     15,   // Markt öffnen → Händler → kaufen → zurück
  inventoryUseSec:  5,    // Inventar öffnen → Item verwenden
  explorationSec:   25,   // Neuen Ort erstmals erkunden (Texte + Optionen)
  questCheckSec:    10,   // Quests-Seite öffnen und lesen
  skillBuySec:      15,   // Skillbaum aufrufen + Skill kaufen
  resetSec:         20,   // "Neu anfangen" Monolog + Bestätigung
};

// ── Walkthrough-Eintrag ───────────────────────────────────────────────────────
/**
 * Fügt einen Eintrag zum Walkthrough-Log hinzu und akkumuliert die Spielerzeit.
 *
 * entry-Felder:
 *   section       string  — Abschnittsname aus dem Kapitel-sectionMap
 *   action        string  — 'work' | 'sleep' | 'dialog' | 'navigate' | 'buy' |
 *                           'use' | 'npc' | 'milestone' | 'skill' | 'reset' | 'tip'
 *   description   string  — Menschenlesbare Kurzbeschreibung
 *   playerTimeSec number  — Geschätzte Spielerzeit für DIESE eine Aktion
 *   [weitere]     *       — Aktion-spezifische Felder (count, cost, npc, ...)
 */
function wlog(ctx, entry) {
  ctx.playerTimeSec += entry.playerTimeSec || 0;
  ctx.walkthrough.push({
    section: ctx._currentSection,
    ...entry,
  });
}

// ── Formatierung ─────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (seconds < 90)  return `~${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const min = Math.round(seconds / 60);
    return `~${min} Minute${min !== 1 ? 'n' : ''}`;
  }
  const h   = Math.floor(seconds / 3600);
  const min = Math.round((seconds % 3600) / 60);
  return min > 0 ? `~${h}h ${min}min` : `~${h}h`;
}

function actionLine(stepNum, entry) {
  const n = `${stepNum}. `;
  switch (entry.action) {
    case 'navigate':
      return `${n}Gehe zu **${locationLabel(entry.location)}**.`;
    case 'work': {
      const pl = entry.count !== 1 ? `${entry.count}×` : '';
      return `${n}${pl} **Schuften** klicken (je 2s warten).`;
    }
    case 'sleep':
      return `${n}Gehe zum **Schlafplatz** → **„${entry.option || 'Schlafen'}"** wählen.`;
    case 'dialog': {
      const pages = entry.pages ? ` (${entry.pages} Seite${entry.pages > 1 ? 'n' : ''})` : '';
      return `${n}Dialog lesen: *„${entry.title || entry.description}"*${pages} → **Weiter** klicken.`;
    }
    case 'npc':
      return `${n}Mit **${entry.npc}** sprechen${entry.topic ? ': ' + entry.topic : ''}.`;
    case 'buy':
      return `${n}Beim **${entry.vendor || 'Händler'}**: **${entry.item}** kaufen (${entry.cost} Gold).`;
    case 'use':
      return `${n}Im **Inventar**: **${entry.item}** → **„Verzehren"** klicken.`;
    case 'skill':
      return `${n}Skill **„${entry.skillName}"** kaufen (${entry.cost} EP).`;
    case 'reset':
      return `${n}**„Neu anfangen"** klicken → Monolog lesen → **„Ja. Neu anfangen."** bestätigen.`;
    case 'milestone':
      return `\n> ⚡ **${entry.description}**\n`;
    case 'tip':
      return `\n> 💡 **Tipp:** ${entry.description}\n`;
    default:
      return `${n}${entry.description || entry.action}.`;
  }
}

function locationLabel(id) {
  const labels = {
    geschichte:   'Geschichte',
    weltkarte:    'Weltkarte',
    taverne:      'Taverne',
    arbeitsplatz: 'Arbeitsplatz',
    marktplatz:   'Marktplatz',
    inventar:     'Inventar',
    sammelplatz:  'Sammelplatz',
    schlafplatz:  'Schlafplatz',
    erfahrung:    'Erfahrung',
    quests:       'Quests',
    statistiken:  'Statistiken',
    chronik:      'Chronik',
  };
  return labels[id] || id;
}

// ── Hauptausgabe ──────────────────────────────────────────────────────────────

/**
 * Schreibt den Walkthrough als Markdown-Datei.
 *
 * @param {object} ctx         — ctx-Objekt mit ctx.walkthrough und ctx.playerTimeSec
 * @param {string} outputPath  — Ziel-Dateipfad (z.B. 'test/walkthrough_k1.md')
 * @param {string} chapterTitle — Kapitel-Überschrift (z.B. 'Kapitel 1')
 * @param {string[]} [tips]    — Optionale globale Tipps am Anfang
 */
function writeWalkthrough(ctx, outputPath, chapterTitle, tips = []) {
  // Einträge nach Section gruppieren (Reihenfolge des ersten Auftretens)
  const sectionOrder = [];
  const sections = {};
  for (const entry of ctx.walkthrough) {
    const sec = entry.section || 'Sonstiges';
    if (!sections[sec]) {
      sections[sec] = { entries: [], timeSec: 0 };
      sectionOrder.push(sec);
    }
    sections[sec].entries.push(entry);
    sections[sec].timeSec += entry.playerTimeSec || 0;
  }

  const lines = [
    `# ${chapterTitle} — Leitfaden`,
    '',
    '> Dieser Leitfaden wurde automatisch aus einem Testdurchlauf generiert.',
    '> Zeitangaben sind Schätzungen basierend auf durchschnittlichem Lesetempo.',
    '',
  ];

  if (tips.length > 0) {
    lines.push('## Allgemeine Tipps', '');
    tips.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }

  lines.push(
    `**Gesamte Spielzeit (geschätzt):** ${formatDuration(ctx.playerTimeSec)}`,
    '',
    '---',
    '',
  );

  for (const sectionName of sectionOrder) {
    const { entries, timeSec } = sections[sectionName];
    lines.push(`## ${sectionName}`);
    lines.push(`*Geschätzte Zeit für diesen Abschnitt: ${formatDuration(timeSec)}*`);
    lines.push('');

    // Aufeinanderfolgende work-Einträge zusammenfassen
    const batched = [];
    for (const entry of entries) {
      const prev = batched[batched.length - 1];
      if (entry.action === 'work' && prev?.action === 'work') {
        prev.count         = (prev.count || 1) + (entry.count || 1);
        prev.playerTimeSec = (prev.playerTimeSec || 0) + (entry.playerTimeSec || 0);
      } else {
        batched.push({ ...entry });
      }
    }

    let stepNum = 1;
    for (const entry of batched) {
      const line = actionLine(stepNum, entry);
      lines.push(line);
      if (!['milestone', 'tip'].includes(entry.action)) stepNum++;
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('*Generiert von `node test/run.js --mode=walkthrough`*');

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`  📄 Walkthrough gespeichert: ${outputPath}`);
}

module.exports = { PLAYER_TIME, wlog, writeWalkthrough, formatDuration };
