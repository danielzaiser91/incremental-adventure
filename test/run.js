'use strict';

/**
 * Test-Runner für alle Kapitel
 *
 * Verwendung:
 *   node test/run.js                                   # Kapitel 1, vollständig
 *   node test/run.js --chapter=1 --headed              # Mit sichtbarem Browser
 *   node test/run.js --from-fixture=k1_pre_robbery     # Ab Raub-Phase
 *   node test/run.js --from-fixture=k1_post_robbery    # Nur Paranoid + Kapitel 2
 *   node test/run.js --generate-fixtures               # Fixtures neu erstellen
 *   node test/run.js --mode=walkthrough                # + walkthrough_k1.md erzeugen
 *
 * Fixtures:
 *   k1_pre_robbery  — nach Phase 6  (vor dem Raub-Loop)
 *   k1_post_robbery — nach Phase 7  (alle 4 Räube abgeschlossen)
 *
 * Kapitel-2-Test (noch nicht implementiert):
 *   node test/run.js --chapter=2    → lädt test/chapters/kapitel2.js
 */

const { chromium } = require('playwright');
const path         = require('path');
const fs           = require('fs');

const { createCtx, updateSection }     = require('./lib/ctx');
const { createServer, startServer }    = require('./lib/server');
const { clearScreenshots, loadFixture, saveFixture, getState } = require('./lib/game');
const { writeWalkthrough, formatDuration } = require('./lib/walkthrough');

// ── Konfiguration (Kommandozeilenargumente) ───────────────────────────────────
const PORT      = 8877;
const GAME_ROOT = path.join(__dirname, '..');

const HEADLESS  = !process.argv.includes('--headed');
const SLOW_MS   = HEADLESS ? 0 : 30;
const CHAPTER   = Number((process.argv.find(a => a.startsWith('--chapter=')) || '').split('=')[1] || 1);
const MODE      = (process.argv.find(a => a.startsWith('--mode=')) || '').split('=')[1] || 'speedrun';
const FROM_FIXTURE = (process.argv.find(a => a.startsWith('--from-fixture=')) || '').split('=')[1] || '';
const GEN_FIXTURES = process.argv.includes('--generate-fixtures') || !FROM_FIXTURE;

// ── Kapitel-Modul laden ───────────────────────────────────────────────────────
const chapterPath = path.join(__dirname, 'chapters', `kapitel${CHAPTER}.js`);
if (!fs.existsSync(chapterPath)) {
  console.error(`❌ Kapitel-Modul nicht gefunden: ${chapterPath}`);
  console.error(`   Verfügbar: ${fs.readdirSync(path.join(__dirname, 'chapters')).join(', ')}`);
  process.exit(1);
}
const chapter = require(chapterPath);
const { phases, FIXTURES, SECTIONS, CHAPTER_TITLE } = chapter;

// ── Phases in Ausführungsreihenfolge ─────────────────────────────────────────
// Für Kapitel 1: 10 Phasen, die ab einem bestimmten Fixture übersprungen werden.
// fixture-Feld: Spielstand der NACH dieser Phase gespeichert wird.
// Das bestimmt auch von wo aus ein --from-fixture-Start möglich ist.
const PHASE_ORDER_K1 = [
  { name: 'Phase 1 — Stadttor',        key: 'newGame',             fixture: null },
  { name: 'Phase 2 — Taverne & NPCs',  key: 'firstContacts',       fixture: null },
  { name: 'Phase 3 — Feldarbeit',      key: 'firstWorkAndMarket',  fixture: null },
  { name: 'Phase 4 — Sammelplatz',     key: 'gathering',           fixture: null },
  { name: 'Phase 5 — Nacht & Quests',  key: 'nightAndQuests',      fixture: null },
  { name: 'Phase 6 — Erfahrungs-UI',   key: 'experienceUI',        fixture: FIXTURES?.preRobbery },
  { name: 'Phase 7 — Raub-System',     key: 'robberies',           fixture: FIXTURES?.postRobbery },
  { name: 'Phase 8 — Greta-Quest',     key: 'gretaQuest',          fixture: null },
  { name: 'Phase 9 — Paranoid',        key: 'paranoidAndChapter2', fixture: null },
  { name: 'Phase 10 — Abschluss',      key: 'finalChecks',         fixture: null },
];

/** Ermittelt welche Phasen aufgrund des FROM_FIXTURE übersprungen werden sollen. */
function getSkipCount(fromFixture, phases) {
  if (!fromFixture) return 0;
  // Zählt Phasen VOR dem Fixture
  for (let i = 0; i < phases.length; i++) {
    if (phases[i].fixture === fromFixture) return i + 1; // Phasen 0..i überspringen
    // Backwards-Compat: alte Namen ohne kN_-Präfix matchen (z.B. 'post_robbery' → 'k1_post_robbery')
    if (phases[i].fixture && fromFixture.replace(/^k\d+_/, '') === phases[i].fixture.replace(/^k\d+_/, '')) {
      return i + 1;
    }
  }
  return 0;
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`🎮 ${CHAPTER_TITLE || `Kapitel ${CHAPTER}`} — Test-Runner`);
  console.log('═'.repeat(60));
  console.log(`  Modus:   ${MODE} | ${HEADLESS ? 'headless' : 'headed'}`);
  if (FROM_FIXTURE) console.log(`  Fixture: ${FROM_FIXTURE}`);
  console.log(`  Kapitel: ${CHAPTER}`);

  clearScreenshots();

  const server = createServer(GAME_ROOT);
  await startServer(server, PORT);
  console.log(`  Server: http://127.0.0.1:${PORT}/`);

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOW_MS });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  page.setDefaultTimeout(5000);

  // Fixture vor dem Seitenaufruf laden (muss VOR goto() sein)
  if (FROM_FIXTURE) await loadFixture(page, FROM_FIXTURE);

  const ctx = createCtx({ page, mode: MODE, generateFixtures: GEN_FIXTURES });

  page.on('pageerror', err => {
    ctx.jsErrors.push(err.message);
    console.log(`  🔴 JS-Fehler: ${err.message.substring(0, 120)}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  🔴 Console: ${msg.text().substring(0, 120)}`);
  });

  const startTime = Date.now();

  try {
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(
      () => typeof render === 'function' && typeof storyState !== 'undefined',
      { timeout: 8000 }
    );
    console.log('  Spiel initialisiert');

    // Section aus aktuellem storyState initialisieren (wichtig beim Fixture-Start)
    if (SECTIONS) {
      const initState = await getState(ctx);
      updateSection(ctx, initState.storyState, SECTIONS);
    }

    const phaseOrder = PHASE_ORDER_K1; // TODO: per Kapitel variieren wenn Kapitel 2 kommt
    const skipCount  = getSkipCount(FROM_FIXTURE, phaseOrder);
    console.log(`  Übersprungene Phasen: ${skipCount} (Fixture: "${FROM_FIXTURE || '—'}")`);

    let fixtureAfterPhase = skipCount; // Index des nächsten Fixture-Speicherpunkts

    for (let i = skipCount; i < phaseOrder.length; i++) {
      const { name, key, fixture } = phaseOrder[i];
      const fn = phases[key];
      if (!fn) { console.log(`  ⚠️  Phase "${key}" nicht implementiert, überspringe`); continue; }

      await fn(ctx);

      // Fixture nach dieser Phase speichern (wenn zugewiesen)
      if (fixture && ctx.generateFixtures) {
        await saveFixture(ctx, fixture);
      }
    }

    // ── Abschlussbericht ──────────────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const savedMin = (ctx.saved.work / 60000).toFixed(1);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Durchlauf abgeschlossen!');
    console.log(`  Testlaufzeit:         ${elapsed}s`);
    console.log(`  Eingesparte Anim-Zeit: ${savedMin} Minuten (${Math.round(ctx.saved.work / 2000)} Feldarbeit-Durchläufe)`);
    console.log(`  Geschätzte Spielerzeit: ${formatDuration(ctx.playerTimeSec)}`);

    if (ctx.phaseTimes.length > 0) {
      console.log('\n⏱  Zeit pro Phase:');
      ctx.phaseTimes.forEach(pt => {
        console.log(`  ${pt.name.padEnd(30)}: ${(pt.ms / 1000).toFixed(1)}s`);
      });
    }

    if (ctx.uiIssues.length > 0) {
      console.log(`\n⚠️  ${ctx.uiIssues.length} UI-Überlappungs-Probleme:`);
      ctx.uiIssues.forEach(i => console.log(`  • ${i}`));
    } else {
      console.log('\n✅ Keine UI-Überlappungs-Probleme');
    }

    if (ctx.jsErrors.length > 0) {
      console.log(`\n❌ ${ctx.jsErrors.length} JavaScript-Fehler:`);
      ctx.jsErrors.forEach(e => console.log(`  • ${e}`));
    } else {
      console.log('✅ Keine JavaScript-Fehler');
    }

    // Walkthrough ausgeben (--mode=walkthrough)
    if (MODE === 'walkthrough' && ctx.walkthrough.length > 0) {
      const walkthroughPath = path.join(__dirname, `walkthrough_k${CHAPTER}.md`);
      const tips = [
        'Arbeite immer wenn möglich — Gold ist der Schlüssel zu allem.',
        'Schlafen geht nur nachts — der Tag ist zum Arbeiten.',
        'Kaufe Brot beim Krämer wenn Hunger > 50% (kostet 4 Gold).',
        'Schau dir die Erfahrungs-Seite (📘) nach jedem Raub an.',
      ];
      writeWalkthrough(ctx, walkthroughPath, CHAPTER_TITLE || `Kapitel ${CHAPTER}`, tips);
    }

  } catch (err) {
    console.log(`\n❌ Test fehlgeschlagen: ${err.message}`);
    const { screenshot } = require('./lib/game');
    await screenshot(ctx, 'FEHLER').catch(() => {});
    console.log(err.stack);
    process.exitCode = 1;
  } finally {
    if (!HEADLESS) await page.waitForTimeout(2000);
    await browser.close();
    server.close();
  }
}

main();
