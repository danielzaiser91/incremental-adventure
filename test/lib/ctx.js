'use strict';

/**
 * Erstellt das zentrale Kontext-Objekt, das durch alle Phasen-
 * und Hilfsfunktionen durchgereicht wird. Fasst allen geteilten
 * Zustand zusammen statt ihn als Modul-Globals zu streuen.
 */
function createCtx({ page, mode = 'speedrun', generateFixtures = false }) {
  return {
    page,
    mode,            // 'speedrun' | 'casual' | 'walkthrough'
    generateFixtures,

    // Gesammelte Ergebnisse
    walkthrough:    [],   // wlog()-Einträge für Walkthrough-Ausgabe
    uiIssues:       [],   // UI-Überlappungs-Funde
    jsErrors:       [],   // JS-Fehler aus dem Browser
    phaseTimes:     [],   // { name, ms } pro Phase

    // Akkumulatoren
    playerTimeSec:  0,    // Geschätzte echte Spielerzeit (Summe aller wlog-Einträge)
    saved:          { work: 0 },  // Eingesparte Test-Zeit durch Animation-Skip

    // Interner Zustand (wird von Helfer-Funktionen geschrieben)
    _screenshotIndex: 1,
    _currentSection:  'Unbekannt',
    _phaseStart:      0,
  };
}

// ── Assertions ────────────────────────────────────────────────────────────────

function ok(ctx, msg) {
  console.log(`  ✓ ${msg}`);
}

function warn(ctx, msg) {
  console.log(`  ⚠️  ${msg}`);
}

function assert(ctx, condition, msg) {
  if (!condition) throw new Error(`❌ ASSERTION FAILED: ${msg}`);
  ok(ctx, msg);
}

// ── Phasen-Timing ─────────────────────────────────────────────────────────────

function startPhase(ctx, label) {
  console.log(`\n══ ${label} ══`);
  ctx._phaseStart = Date.now();
}

function endPhase(ctx, name) {
  ctx.phaseTimes.push({ name, ms: Date.now() - ctx._phaseStart });
}

// ── Section-Tracking ──────────────────────────────────────────────────────────

/** Aktualisiert ctx._currentSection basierend auf dem aktuellen storyState.
 *  sectionMap: { storyState (number): sectionLabel (string) } — wird von jedem
 *  Kapitel-Modul mitgebracht und ist die Grundlage der Walkthrough-Gliederung. */
function updateSection(ctx, storyState, sectionMap) {
  const keys = Object.keys(sectionMap).map(Number).sort((a, b) => b - a);
  const key  = keys.find(k => storyState >= k);
  if (key !== undefined) ctx._currentSection = sectionMap[key];
}

module.exports = { createCtx, ok, warn, assert, startPhase, endPhase, updateSection };
