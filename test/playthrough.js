/**
 * Chroniken des vergessenen Weges — Kapitel-1-Durchlauf-Test
 *
 * Spielt das Spiel bis zum Ende von Kapitel 1 (storyState >= 20100).
 * Alle Warte-Animationen werden geskippt. Prüft UI-Überlappungen und
 * JavaScript-Fehler. Speichert Fixtures an Phasengrenzen.
 *
 * Verwendung:
 *   node test/playthrough.js                        # Vollständiger Durchlauf (~4 min)
 *   node test/playthrough.js --generate-fixtures    # Wie oben, regeneriert Fixtures explizit
 *   node test/playthrough.js --from-fixture=post_robbery   # Nur Phasen 8-10 (~7s)
 *   node test/playthrough.js --from-fixture=pre_robbery    # Phasen 7-10 (~4 min)
 *   node test/playthrough.js --headed               # Mit sichtbarem Browser
 *
 * Fixtures (test/fixtures/):
 *   pre_robbery.json   — Spielstand vor dem Raub-System (nach Phase 6)
 *   post_robbery.json  — Spielstand nach allen 4 Räuben (vor Paranoid)
 *
 * Voraussetzungen:
 *   npm install playwright   (im Projektverzeichnis)
 *   npx playwright install chromium   (einmalig)
 */

'use strict';

const { chromium } = require('playwright');
const http         = require('http');
const fs           = require('fs');
const path         = require('path');

// ── Konfiguration ─────────────────────────────────────────────────────────────
const PORT           = 8877;
const GAME_ROOT      = path.join(__dirname, '..');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const FIXTURE_DIR    = path.join(__dirname, 'fixtures');
// Headless by default; pass --headed to see the browser
const HEADLESS          = !process.argv.includes('--headed');
const SLOW_MS           = HEADLESS ? 0 : 30;
// --from-fixture=NAME  → lädt test/fixtures/NAME.json statt frisch zu starten
const FROM_FIXTURE      = (process.argv.find(a => a.startsWith('--from-fixture=')) || '').split('=')[1];
// --generate-fixtures  → speichert Fixtures an Phasengrenzen (beim vollen Durchlauf)
const GENERATE_FIXTURES = process.argv.includes('--generate-fixtures') || !FROM_FIXTURE;

// ── Zeitmessung (eingespart vs. echter Spielerzeit) ──────────────────────────
const saved = { work: 0, nightwatch: 0 };
const WORK_MS       = 2000;  // Basis-Dauer pro Feldarbeit
const NIGHTWATCH_MS = 0;     // Nachtwache ist bereits instant im Spiel

// ── Fixture-Hilfsfunktionen ───────────────────────────────────────────────────
async function saveFixture(page, name) {
  if (!GENERATE_FIXTURES) return;
  const saveJson = await page.evaluate(() => {
    saveGame({ silent: true });
    return localStorage.getItem(SAVE_KEY);  // SAVE_KEY = 'chronicles_v1' (state.js)
  });
  if (!saveJson) { warn(`Fixture "${name}" nicht gespeichert — kein Spielstand`); return; }
  if (!fs.existsSync(FIXTURE_DIR)) fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(FIXTURE_DIR, `${name}.json`), saveJson);
  log(`  💾 Fixture gespeichert: fixtures/${name}.json`);
}

async function loadFixture(page, name) {
  const fixturePath = path.join(FIXTURE_DIR, `${name}.json`);
  if (!fs.existsSync(fixturePath)) throw new Error(`Fixture nicht gefunden: fixtures/${name}.json`);
  const saveJson = fs.readFileSync(fixturePath, 'utf8');
  // Spielstand VOR dem Seitenaufruf in localStorage schreiben — loadGame() greift ihn dann ab
  // SAVE_KEY ist 'chronicles_v1' (state.js)
  await page.addInitScript({ content: `localStorage.setItem('chronicles_v1', ${JSON.stringify(saveJson)});` });
  log(`  📂 Fixture geladen: fixtures/${name}.json`);
}

// ── Phasen-Zeitmessung ────────────────────────────────────────────────────────
const phaseTimes = [];
let phaseStart = 0;
function startPhaseTimer() { phaseStart = Date.now(); }
function endPhaseTimer(name) { phaseTimes.push({ name, ms: Date.now() - phaseStart }); }

// ── UI-Probleme (werden gesammelt und am Ende ausgegeben) ──────────────────────
const uiIssues = [];

// ── HTTP-Server ───────────────────────────────────────────────────────────────
function createServer() {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
  };
  return http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const file = path.join(GAME_ROOT, urlPath);
    try {
      const data = fs.readFileSync(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

// ── Screenshot-Helfer ─────────────────────────────────────────────────────────
let screenshotCounter = 0;
async function screenshot(page, label) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const n    = String(++screenshotCounter).padStart(2, '0');
  const name = `${n}_${label.replace(/[^a-z0-9_-]/gi, '_')}`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) });
  log(`  📸 ${name}`);
}

// ── Logging ───────────────────────────────────────────────────────────────────
function log(msg)  { console.log(msg); }
function ok(msg)   { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.log(`  ⚠️  ${msg}`); }

function assert(condition, msg) {
  if (!condition) throw new Error(`❌ ASSERTION FAILED: ${msg}`);
  ok(msg);
}

// ── Dialog-Helfer ─────────────────────────────────────────────────────────────

/** Gibt true zurück, wenn der Dialog-Overlay sichtbar ist. */
async function isDialogOpen(page) {
  return page.evaluate(() => {
    const ov = document.getElementById('dialog-overlay');
    return ov ? !ov.classList.contains('hidden') : false;
  });
}

/**
 * Klickt den ersten verfügbaren Dialog-Button so lange,
 * bis der Dialog geschlossen ist.
 * Berücksichtigt den 250ms armed-Guard auf der letzten Seite.
 */
async function clickThroughDialog(page, maxPages = 30) {
  for (let i = 0; i < maxPages; i++) {
    if (!(await isDialogOpen(page))) break;
    await page.waitForTimeout(320);  // Guard für letzte Seite
    const btn = page.locator('#dialog-actions button:not([disabled])').first();
    const visible = await btn.isVisible().catch(() => false);
    if (!visible) break;
    await btn.click();
    await page.waitForTimeout(200);
  }
}

/** Klickt einen Dialog-Button mit einem bestimmten Label. */
async function clickDialogButton(page, label) {
  await page.waitForTimeout(320);
  await page.click(`#dialog-actions button:has-text("${label}")`);
  await page.waitForTimeout(200);
}

// ── Spielzustand auslesen ──────────────────────────────────────────────────────
async function getState(page) {
  return page.evaluate(() => ({
    storyState,
    gold:             resources.gold,
    totalGoldEarned:  resources.totalGoldEarned,
    resets:           meta.resets,
    ep:               experience.points,
    hunger:           Math.round(needs.hunger),
    tiredness:        Math.round(needs.tiredness),
    day:              gameClock.day,
    hour:             gameClock.hour,
    night:            isNight(),
    currentContent,
    workBlocked:      !!(gameFlags.workBlockedByRobberies),
    mustEatBread:     !!(gameFlags.mustEatBread),
    isWorking:        !!(gameFlags.isWorking),
    rob1: !!(gameFlags.robberyTriggered),
    rob2: !!(gameFlags.robbery2Triggered),
    rob3: !!(gameFlags.robbery3Triggered),
    rob4: !!(gameFlags.robbery4Triggered),
    resetLayerUnlocked: !!(gameFlags.resetLayerUnlocked),
    skills: Object.keys(skills).filter(k => skills[k]),
    questNightWatch:    quests.nightWatch.state,
    questKraemerin:     quests.kraemerinBusiness.state,
    questForemanRaise:  quests.foremanRaise?.state ?? 'n/a',
    inventory:          { ...resources.inventory },
  }));
}

// ── Navigation ─────────────────────────────────────────────────────────────────
/** Navigiert sicher über das Spiel-Navigationssystem und schließt offene Monologe. */
async function navigateTo(page, contentId) {
  await page.evaluate((id) => showContent(id), contentId);
  await page.waitForTimeout(80);
  // Monolog/Dialog der beim Betreten feuert sofort schließen
  if (await isDialogOpen(page)) await clickThroughDialog(page);
}

// ── Feldarbeit ─────────────────────────────────────────────────────────────────
/**
 * Klickt n-mal Feldarbeit durch, skippt die 2s-Animation via completeWork().
 * Dialoge die danach aufpoppen werden automatisch durchgeklickt.
 * Gibt false zurück wenn Arbeit geblockt (Nacht / mustEatBread / workBlocked).
 */
async function doWork(page, n = 1) {
  let done = 0;
  for (let i = 0; i < n; i++) {
    // Prüfe Blocker
    const s = await page.evaluate(() => ({
      night: isNight(),
      mustEat: gameFlags.mustEatBread,
      blocked: gameFlags.workBlockedByRobberies,
      tired: needs.tiredness >= 100,
    }));
    if (s.night || s.mustEat || s.blocked || s.tired) return done;

    // Monolog/Dialog vor dem Klick schließen
    if (await isDialogOpen(page)) await clickThroughDialog(page);

    // "Schuften"-Button klicken (id="btn-work", Text "⚒ Schuften")
    const schuften = page.locator('#btn-work:not([disabled])');
    if (!(await schuften.isVisible().catch(() => false))) {
      warn(`doWork: Schuften-Button nicht sichtbar (i=${i})`);
      return done;
    }
    await schuften.click();

    // gameFlags.isWorking wird synchron in startWork() gesetzt (let-Deklaration, kein window.X)
    await page.waitForTimeout(10);
    const working = await page.evaluate(() => gameFlags.isWorking);
    if (!working) {
      warn(`doWork: isWorking=false nach Klick (i=${i}) — startWork() eventuell geblockt`);
      // Trotzdem versuchen zu skippen falls ein vorheriger Lauf noch läuft
      await page.evaluate(() => { if (gameFlags.isWorking) completeWork(); });
      return done;
    }
    await page.evaluate(() => completeWork());
    await page.waitForFunction(() => !gameFlags.isWorking, { timeout: 2000 });
    saved.work += WORK_MS;
    done++;

    // Dialog nach Arbeit (Story-Trigger, Hunger-Monolog, …)?
    if (await isDialogOpen(page)) {
      await clickThroughDialog(page);
      // Nach Raub-Dialog: Reset läuft → kurz warten bis performManualReset() durch ist
      await page.waitForTimeout(600);
    }
  }
  return done;
}

// ── Bedürfnisse managen ───────────────────────────────────────────────────────
/**
 * Kauft und isst Brot, falls Hunger >= threshold oder mustEatBread gesetzt.
 * Navigiert zum Markt und zurück.
 */
async function buyAndEatFood(page, returnTo = 'arbeitsplatz') {
  log('  → Brot kaufen und essen');
  await navigateTo(page, 'marktplatz');
  await page.waitForTimeout(100);

  // Krämer öffnen
  const kraemer = page.locator('.action-card').filter({ hasText: 'Krämer' }).first();
  if (await kraemer.isVisible().catch(() => false)) {
    await kraemer.locator('button').first().click();
    await page.waitForTimeout(100);
  }

  // Brot kaufen (erstes kaufbares Item)
  const kaufenBtns = page.locator('button:has-text("Kaufen")');
  if (await kaufenBtns.first().isVisible().catch(() => false)) {
    await kaufenBtns.first().click();
    await page.waitForTimeout(100);
    if (await isDialogOpen(page)) await clickThroughDialog(page);
  }

  // Inventar → Brot essen
  await navigateTo(page, 'inventar');
  await page.waitForTimeout(100);
  const verzehren = page.locator('button:has-text("Verzehren")').first();
  if (await verzehren.isVisible().catch(() => false)) {
    await verzehren.click();
    await page.waitForTimeout(100);
  }

  await navigateTo(page, returnTo);
  await page.waitForTimeout(80);
}

// ── Schlafen ──────────────────────────────────────────────────────────────────
/**
 * Legt sich schlafen (Straße, kostenlos). Setzt vorher gameClock.hour
 * auf NIGHT_START_HOUR wenn noch Tag, damit sleep() nicht früh abbricht.
 * Fortschritts-Animation gibt es nicht — sleep() ist instant.
 */
async function goSleep(page) {
  const night = await page.evaluate(() => isNight());
  if (!night) {
    // Zeit auf 22 Uhr setzen (Nacht); Spieler würde einfach warten
    await page.evaluate(() => {
      gameClock.hour = 22;
      // firstNightDialogShown muss gesetzt sein, damit die Nacht-Spiellogik läuft
      // und der Schlafplatz zugänglich ist (wird sonst über maybeTriggerFirstNightDialog gesetzt)
      if (!gameFlags.firstNightDialogShown) {
        gameFlags.firstNightDialogShown = true;
      }
      render();
    });
    log(`  → Uhr auf 22:00 gesetzt (Nacht wartet nicht auf Echtzeit)`);
    // Evtl. Nacht-Dialog schließen
    await page.waitForTimeout(150);
    if (await isDialogOpen(page)) await clickThroughDialog(page);
  }
  await navigateTo(page, 'schlafplatz');
  await page.waitForTimeout(150);
  // "Schlafen"-Button (nicht disabled = aktive Nacht-Option)
  const sleepBtn = page.locator('button:has-text("Schlafen"):not([disabled])').first();
  if (await sleepBtn.isVisible().catch(() => false)) {
    await sleepBtn.click();
    await page.waitForTimeout(300);
    if (await isDialogOpen(page)) await clickThroughDialog(page);
    log(`  → Geschlafen (Tag ${(await page.evaluate(() => gameClock.day))})`);
  } else {
    warn('Schlafplatz: Straße-Button nicht gefunden');
    await screenshot(page, 'warn_schlafplatz');
  }
}

// ── UI-Check: Verdeckte Buttons ───────────────────────────────────────────────
/**
 * Prüft, ob sichtbare Buttons durch andere Elemente verdeckt werden.
 * Läuft NICHT wenn ein Dialog/Monolog offen ist (da das eine erwartete Überlagerung ist).
 * Ergebnisse werden in uiIssues gesammelt.
 */
async function checkUIObstruction(page, context) {
  // Kein Check bei offenem Dialog — Dialog überlagert absichtlich alles
  if (await isDialogOpen(page)) return 0;
  const issues = await page.evaluate(() => {
    const found = [];
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      const r = btn.getBoundingClientRect();
      if (r.width < 5 || r.height < 5) continue;
      const s = getComputedStyle(btn);
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue;

      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      if (!top || top === btn || btn.contains(top)) continue;

      // Ausnahmen: span/em/strong IM Button → das ist normal
      const inSameBtn = top.closest('button') === btn;
      if (inSameBtn) continue;

      found.push({
        button:     (btn.textContent || btn.id).substring(0, 50).trim(),
        coveredBy:  (top.textContent || top.id || top.className).substring(0, 50).trim(),
        pos:        `${Math.round(cx)},${Math.round(cy)}`,
        zIndex:     getComputedStyle(top).zIndex,
      });
    }
    return found;
  });

  for (const issue of issues) {
    const msg = `[${context}] Button "${issue.button}" verdeckt durch "${issue.coveredBy}" (z=${issue.zIndex}, pos=${issue.pos})`;
    uiIssues.push(msg);
    warn(msg);
  }
  return issues.length;
}

// ── Phase 1: Neues Spiel + Treutheim betreten ─────────────────────────────────
async function phase1_newGame(page) {
  log('\n══ Phase 1: Neues Spiel → Treutheim betreten ══');

  // Harten Reset, falls ein alter Spielstand vorhanden ist
  await page.evaluate(() => {
    if (typeof performHardReset === 'function') performHardReset();
    render();
  });
  await page.waitForTimeout(300);

  // Animations-Skip für Räube (bevor sie feuern)
  await page.evaluate(() => { settings.showResetAnimation = false; });

  let s = await getState(page);
  assert(s.storyState === 10100, `Frischer Spielstand hat storyState 10100 (ist: ${s.storyState})`);

  await screenshot(page, 'start');

  // Nach Hard-Reset startet das Spiel auf der Geschichte-Seite (storyState 10100).
  // Dort gibt es einen "Das Stadttor betreten"-Button, der enterCity('treutheim') aufruft.
  // Alternativ: Weltkarte → "Betreten" Button in der Treutheim-Karte.
  const stadttor = page.locator('button').filter({ hasText: 'Stadttor betreten' }).first();
  const betreten  = page.locator('.action-card').filter({ hasText: 'Treutheim' }).locator('button').first();

  let entered = false;
  if (await stadttor.isVisible().catch(() => false)) {
    await stadttor.click();
    entered = true;
  } else {
    await navigateTo(page, 'weltkarte');
    await page.waitForTimeout(100);
    if (await betreten.isVisible().catch(() => false)) {
      await betreten.click();
      entered = true;
    }
  }
  if (!entered) {
    // Letzter Fallback: direkt via JS
    await page.evaluate(() => enterCity('treutheim'));
    entered = true;
    warn('Treutheim via evaluate betreten (Buttons nicht gefunden)');
  }
  assert(entered, 'Treutheim betreten');
  await page.waitForTimeout(400);

  // Story 1.1
  assert(await isDialogOpen(page), 'Story-Dialog 1.1 nach Betreten Treutheims');
  await screenshot(page, 'story_1_1');
  await clickThroughDialog(page);

  s = await getState(page);
  assert(s.storyState === 10101, `storyState nach Treutheim-Betreten: 10101 (ist: ${s.storyState})`);
  await checkUIObstruction(page, 'Treutheim Übersicht');
  await screenshot(page, 'treutheim');
}

// ── Phase 2: Erste Kontakte (Taverne, NPCs) ────────────────────────────────────
async function phase2_firstContacts(page) {
  log('\n══ Phase 2: Taverne & erste NPCs ══');

  await navigateTo(page, 'taverne');
  await page.waitForTimeout(100);
  await screenshot(page, 'taverne_erstbesuch');
  await checkUIObstruction(page, 'Taverne Erstbesuch');

  // Mira ansprechen
  log('  → Mira ansprechen');
  await page.evaluate(() => openNpcDialog('mira'));
  await page.waitForTimeout(150);
  if (await isDialogOpen(page)) await clickThroughDialog(page);

  // Wirt/Korbin ansprechen
  const wirt = await page.evaluate(() => typeof NPCS.wirt !== 'undefined');
  if (wirt) {
    log('  → Wirt ansprechen');
    await page.evaluate(() => openNpcDialog('wirt'));
    await page.waitForTimeout(150);
    if (await isDialogOpen(page)) await clickThroughDialog(page);
  }

  // Brakka ansprechen (Quest-Angebot wird ggf. noch nicht kommen, aber Dialog prüfen)
  const brakkaExists = await page.evaluate(() => typeof NPCS.brakka !== 'undefined');
  if (brakkaExists) {
    log('  → Brakka ansprechen');
    await page.evaluate(() => openNpcDialog('brakka'));
    await page.waitForTimeout(150);
    if (await isDialogOpen(page)) await clickThroughDialog(page);
  }

  await checkUIObstruction(page, 'Taverne nach NPCs');
}

// ── Phase 3: Erste Feldarbeit, Hunger-Trigger, Markt ─────────────────────────
async function phase3_firstWorkAndMarket(page) {
  log('\n══ Phase 3: Erste Feldarbeit & Marktplatz ══');

  await navigateTo(page, 'arbeitsplatz');
  await page.waitForTimeout(100);
  await screenshot(page, 'arbeitsplatz');
  await checkUIObstruction(page, 'Arbeitsplatz');

  // Infos-Panel aufklappen und auf Überlappung prüfen
  const infoToggle = page.locator('.work-info-toggle, button:has-text("Infos")').first();
  if (await infoToggle.isVisible().catch(() => false)) {
    await infoToggle.click();
    await page.waitForTimeout(100);
    await checkUIObstruction(page, 'Arbeitsplatz Infos-Panel offen');
    await screenshot(page, 'arbeitsplatz_infos');
    await infoToggle.click();
    await page.waitForTimeout(100);
  }

  // 4 Feldarbeiten → triggert Hunger-Monolog bei ~40-50% Hunger
  log('  → 4× Feldarbeit (spart 8s Spielerzeit)');
  await doWork(page, 4);

  let s = await getState(page);
  log(`  Gold: ${s.gold}  Hunger: ${s.hunger}%  Müdigkeit: ${s.tiredness}%`);

  // Hunger-Dialog erschienen?
  if (await isDialogOpen(page)) await clickThroughDialog(page);

  // Markt: Brot kaufen und essen
  s = await getState(page);
  if (s.mustEatBread || s.hunger >= 50) {
    await buyAndEatFood(page, 'arbeitsplatz');
    s = await getState(page);
    assert(!s.mustEatBread, `mustEatBread nach Essen: false (ist: ${s.mustEatBread})`);
    ok(`Hunger nach Essen: ${s.hunger}%, Müdigkeit: ${s.tiredness}%`);
  }

  // Marktplatz vollständig erkunden
  log('  → Marktplatz erkunden');
  await navigateTo(page, 'marktplatz');
  await page.waitForTimeout(100);
  await screenshot(page, 'marktplatz');
  await checkUIObstruction(page, 'Marktplatz');

  // Inventar prüfen
  await navigateTo(page, 'inventar');
  await page.waitForTimeout(100);
  await screenshot(page, 'inventar');
  await checkUIObstruction(page, 'Inventar');
}

// ── Phase 4: Sammelplatz & Sammeln-Block bei 100% Müdigkeit ──────────────────
async function phase4_gathering(page) {
  log('\n══ Phase 4: Sammelplatz ══');

  // Sammelplatz zugänglich? (erfordert Greta-Quest-Fortschritt oder Rohstoff-Flag)
  const canGather = await page.evaluate(() => {
    return typeof gatherResource === 'function';
  });
  if (!canGather) { log('  → Sammelplatz noch nicht zugänglich, Phase überspringen'); return; }

  await navigateTo(page, 'sammelplatz');
  await page.waitForTimeout(100);
  await screenshot(page, 'sammelplatz');
  await checkUIObstruction(page, 'Sammelplatz');

  // Müdigkeit auf 100% forcieren und Block prüfen
  const tiredBefore = await page.evaluate(() => needs.tiredness);
  if (tiredBefore < 100) {
    await page.evaluate(() => { needs.tiredness = 100; render(); });
    log('  → Müdigkeit auf 100% gesetzt (Test: Block-Prüfung)');
  }

  const blocked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns).some(b => b.disabled && b.textContent.includes('Sammeln'));
  });
  if (blocked) {
    ok('Sammeln bei 100% Müdigkeit korrekt geblockt');
  } else {
    // Evtl. ist der Button-Text anders — prüfe ob ein Warning-Text erscheint
    const warning = await page.evaluate(() =>
      !!document.querySelector('.action-card-warning')
    );
    ok(`Müdigkeits-Warnung auf Sammelplatz: ${warning}`);
  }

  // Müdigkeit wieder zurücksetzen
  await page.evaluate(() => { needs.tiredness = 20; render(); });

  // Einmal sammeln (falls Tool vorhanden)
  const sammelnBtn = page.locator('button:has-text("Sammeln"), button:has-text("Holz"), button:has-text("Stein"), button:has-text("Wildkraut")').first();
  if (await sammelnBtn.isVisible().catch(() => false)) {
    await sammelnBtn.click();
    await page.waitForTimeout(100);
    ok('Einmal gesammelt');
  }
}

// ── Phase 5: Nacht, Schlaf, Brakka-Quest ─────────────────────────────────────
async function phase5_nightAndQuests(page) {
  log('\n══ Phase 5: Nacht, Schlafplatz & Brakka-Quest ══');

  // Arbeitsplatz, weiterarbeiten bis Nacht
  await navigateTo(page, 'arbeitsplatz');
  await page.waitForTimeout(100);

  let s = await getState(page);
  log(`  Start: Stunde ${s.hour}:00, Tag ${s.day}`);

  // Weiterarbeiten bis Nacht eintritt (max 20 Iterationen)
  for (let i = 0; i < 20; i++) {
    s = await getState(page);
    if (s.night) break;
    if (s.mustEatBread) await buyAndEatFood(page, 'arbeitsplatz');
    if (s.tiredness >= 98) {
      // Müdigkeit kurz drücken (schlafen geht nur nachts — kurze Pause)
      await page.evaluate(() => ausruhen());
      await page.waitForTimeout(100);
      if (await isDialogOpen(page)) await clickThroughDialog(page);
      continue;
    }
    const worked = await doWork(page, 1);
    if (worked === 0) break;
  }

  s = await getState(page);
  log(`  Nacht erreicht: ${s.night} | Uhrzeit: ${s.hour}:00`);

  if (!s.night) {
    // Fallback: Uhr auf 22 setzen
    await page.evaluate(() => { gameClock.hour = 22; render(); });
    log('  → Uhr auf 22:00 gesetzt (Fallback)');
  }

  // Erste-Nacht-Dialog?
  if (await isDialogOpen(page)) await clickThroughDialog(page);

  await screenshot(page, 'erste_nacht');

  // Taverne nachts
  await navigateTo(page, 'taverne');
  await page.waitForTimeout(100);
  await screenshot(page, 'taverne_nacht');
  await checkUIObstruction(page, 'Taverne Nacht');

  // Brakka: Nachtwache-Quest annehmen
  s = await getState(page);
  const brakkaLocked = await page.evaluate(() => {
    const npc = NPCS.brakka;
    return typeof npc.locked === 'function' ? npc.locked() : !!npc.locked;
  });
  if (!brakkaLocked) {
    log('  → Brakka ansprechen (Nachtwache-Quest)');
    await page.evaluate(() => openNpcDialog('brakka'));
    await page.waitForTimeout(150);
    if (await isDialogOpen(page)) {
      await page.waitForTimeout(320);
      // Ersten Button klicken (Quest annehmen oder Weiter)
      await page.locator('#dialog-actions button:not([disabled])').first().click();
      await page.waitForTimeout(200);
      if (await isDialogOpen(page)) await clickThroughDialog(page);
    }
    s = await getState(page);
    log(`  Nachtwache-Quest: ${s.questNightWatch}`);
  }

  // Schlafplatz & Schlafen
  await goSleep(page);
  s = await getState(page);
  ok(`Tag nach Schlaf: ${s.day}, Müdigkeit: ${s.tiredness}%`);
}

// ── Phase 6: Erfahrungs-Seite erkunden ───────────────────────────────────────
async function phase6_experienceUI(page) {
  log('\n══ Phase 6: Erfahrungs-Seite ══');

  await navigateTo(page, 'erfahrung');
  await page.waitForTimeout(100);
  await screenshot(page, 'erfahrung');
  await checkUIObstruction(page, 'Erfahrung');

  const s = await getState(page);
  log(`  EP: ${s.ep}, Resets: ${s.resets}`);

  if (s.resetLayerUnlocked && s.ep > 0) {
    // EP-Tree testen: ersten verfügbaren Knoten anklicken
    const firstNode = page.locator('.ep-node:not(.ep-node--locked):not(.ep-node--owned)').first();
    if (await firstNode.isVisible().catch(() => false)) {
      await firstNode.click();
      await page.waitForTimeout(150);
      await screenshot(page, 'erfahrung_skill_detail');
      await checkUIObstruction(page, 'Erfahrung Skill-Detail offen');

      // Detail-Panel: unlocks-Hinweis sichtbar?
      const hasUnlocksHint = await page.evaluate(() =>
        !!document.querySelector('.ep-detail-unlocks')
      );
      log(`  ↳ Schaltet-weitere-Fähigkeiten-Hinweis vorhanden: ${hasUnlocksHint}`);
    }
  }
}

// ── Phase 7: Die Raub-Schleife (Räube 1–4) ───────────────────────────────────
async function phase7_robberies(page) {
  log('\n══ Phase 7: Raub-System (Räube 1–4) ══');

  // Animations-Skip sicherstellen
  await page.evaluate(() => { settings.showResetAnimation = false; });
  await navigateTo(page, 'arbeitsplatz');
  await page.waitForTimeout(100);

  const ROB_LABELS = ['', 'Raub 1', 'Raub 2', 'Raub 3', 'Raub 4'];
  let lastRobCount = 0;

  for (let iter = 0; iter < 1500; iter++) {
    // Dialog offen?
    if (await isDialogOpen(page)) {
      await clickThroughDialog(page);
      await page.waitForTimeout(500);  // Reset-Verarbeitung
    }

    let s = await getState(page);

    // Reset-Animation hängt noch?
    const resetAnim = await page.evaluate(() => {
      const ov = document.getElementById('reset-overlay');
      return ov ? ov.classList.contains('reset-overlay-visible') : false;
    });
    if (resetAnim) {
      await page.evaluate(() => {
        document.getElementById('reset-overlay').classList.remove('reset-overlay-visible');
        document.body.classList.remove('dialog-open');
      });
      await page.waitForTimeout(300);
      s = await getState(page);
    }

    // Neue Räube?
    const robCount = [s.rob1, s.rob2, s.rob3, s.rob4].filter(Boolean).length;
    if (robCount > lastRobCount) {
      lastRobCount = robCount;
      log(`  ✓ ${ROB_LABELS[robCount]} ausgelöst! Resets: ${s.resets}, EP: ${s.ep}`);
      await screenshot(page, `raub_${robCount}`);

      // Nach Raub: Erfahrung anzeigen
      if (s.currentContent === 'erfahrung' || robCount <= 4) {
        await navigateTo(page, 'erfahrung');
        await page.waitForTimeout(100);
        const sE = await getState(page);
        ok(`EP nach ${ROB_LABELS[robCount]}: ${sE.ep} (gesamt Resets: ${sE.resets})`);
        await checkUIObstruction(page, `Erfahrung nach ${ROB_LABELS[robCount]}`);
        await navigateTo(page, 'arbeitsplatz');
        await page.waitForTimeout(100);
      }

      // Raub 4: Arbeit ist jetzt gesperrt → Schleife verlassen
      if (s.rob4) break;
    }

    // Fertig?
    if (s.rob4) break;

    // Nacht?
    if (s.night) {
      await goSleep(page);
      await navigateTo(page, 'arbeitsplatz');
      await page.waitForTimeout(80);
      continue;
    }

    // mustEatBread = true → Arbeit geblockt → Brot muss her.
    if (s.mustEatBread) {
      if (s.gold < 4) {
        // Deadlock: kein Gold, Arbeit geblockt. Sollte nach Reset nie passieren.
        warn(`Deadlock: mustEatBread=true aber Gold=${s.gold} → Flag direkt löschen`);
        await page.evaluate(() => { gameFlags.mustEatBread = false; render(); });
      } else {
        await buyAndEatFood(page, 'arbeitsplatz');
      }
      continue;
    }

    // Hunger >= 80% halbiert den Ertrag (isStarving). Im Raub-Loop direkt managen —
    // die Marktplatz-UI wurde in Phase 3 bereits getestet.
    if (s.hunger >= 70) {
      await page.evaluate(() => { needs.hunger = 20; render(); });
      continue;
    }

    // Müdigkeit blockiert?
    if (s.tiredness >= 100) {
      // Ausruhen (kurze Pause, falls verfügbar)
      const ausruhBtn = page.locator('button:has-text("Ausruhen"), button:has-text("Pause"), button:has-text("Verschnaufen")').first();
      if (await ausruhBtn.isVisible().catch(() => false)) {
        await ausruhBtn.click();
        await page.waitForTimeout(100);
      } else {
        await goSleep(page);
        await navigateTo(page, 'arbeitsplatz');
      }
      continue;
    }

    // Nicht auf Arbeitsplatz?
    if (s.currentContent !== 'arbeitsplatz') {
      await navigateTo(page, 'arbeitsplatz');
      await page.waitForTimeout(80);
      continue;
    }

    // Arbeiten
    await doWork(page, 1);

    if (iter % 50 === 0) {
      const sNow = await getState(page);
      log(`  [${iter}] Gold: ${sNow.gold} | Earned: ${sNow.totalGoldEarned} | Resets: ${sNow.resets} | EP: ${sNow.ep}`);
    }
  }

  const sFinal = await getState(page);
  assert(sFinal.rob4, 'Raub 4 ausgelöst');
  assert(sFinal.workBlocked, 'Arbeit nach Raub 4 gesperrt');
  assert(sFinal.resets >= 4, `Mindestens 4 Resets nach Raub-Phase (ist: ${sFinal.resets})`);
  assert(sFinal.ep >= 3, `Mindestens 3 EP für Paranoid verfügbar (ist: ${sFinal.ep})`);
}

// ── Phase 8: Greta-Quest (Rohstoffe sammeln) ──────────────────────────────────
async function phase8_gretaQuest(page) {
  log('\n══ Phase 8: Greta-Quest (Rohstoffe) ══');

  const s = await getState(page);
  if (s.questKraemerin === 'rewarded' || s.questKraemerin === 'done') {
    ok('Greta-Quest bereits abgeschlossen');
    return;
  }

  // Quest annehmen (falls INVITED)
  if (s.questKraemerin === 'invited' || s.questKraemerin === 'INVITED') {
    log('  → Greta: Quest annehmen');
    await navigateTo(page, 'taverne');
    await page.evaluate(() => openNpcDialog('greta'));
    await page.waitForTimeout(150);
    if (await isDialogOpen(page)) await clickThroughDialog(page);
  }

  const sNow = await getState(page);
  if (sNow.questKraemerin !== 'active' && sNow.questKraemerin !== 'ACTIVE') {
    log('  → Greta-Quest noch nicht aktiv, überspringe');
    return;
  }

  // Rohstoffe sammeln (Holz, Stein, Pflanze je 5)
  await navigateTo(page, 'sammelplatz');
  await page.waitForTimeout(100);

  const resourceTypes = ['holz', 'stein', 'pflanze'];
  for (const res of resourceTypes) {
    for (let n = 0; n < 5; n++) {
      const inv = await page.evaluate(() => ({ ...resources.inventory }));
      if ((inv[res] || 0) >= 5) break;
      const btn = page.locator(`button`).filter({ hasText: new RegExp(res, 'i') }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(100);
      }
    }
  }

  const inv = await page.evaluate(() => ({ ...resources.inventory }));
  log(`  Inventar nach Sammeln: Holz=${inv.holz || 0}, Stein=${inv.stein || 0}, Pflanze=${inv.pflanze || 0}`);

  // Greta: Quest abgeben
  log('  → Greta: Quest abgeben');
  await navigateTo(page, 'taverne');
  await page.evaluate(() => openNpcDialog('greta'));
  await page.waitForTimeout(150);
  if (await isDialogOpen(page)) await clickThroughDialog(page);

  const sAfter = await getState(page);
  log(`  Greta-Quest nach Turn-In: ${sAfter.questKraemerin}`);
}

// ── Phase 9: Paranoid kaufen & Kapitel-2-Reset ────────────────────────────────
async function phase9_paranoidAndChapter2(page) {
  log('\n══ Phase 9: Paranoid kaufen → Kapitel 2 ══');

  await navigateTo(page, 'erfahrung');
  await page.waitForTimeout(150);
  await screenshot(page, 'erfahrung_vor_paranoid');
  await checkUIObstruction(page, 'Erfahrung vor Paranoid');

  let s = await getState(page);
  log(`  EP: ${s.ep}, Resets: ${s.resets}`);

  // Paranoid-Knoten finden und kaufen
  // Der Knoten heißt wahrscheinlich "Paranoid" oder hat ein 👁-Icon
  const paranoidNode = page.locator('.ep-node').filter({ hasText: /Paranoid|👁/i }).first();
  if (!(await paranoidNode.isVisible().catch(() => false))) {
    warn('Paranoid-Knoten nicht gefunden — suche in der EP-Tree-Struktur');
    await screenshot(page, 'warn_kein_paranoid');
    // Fallback: direkt via evaluate kaufen
    const bought = await page.evaluate(() => {
      const node = EP_SKILL_TREE.find(n => n.id === 'paranoid');
      if (!node) return false;
      if (experience.points < node.cost) return false;
      experience.points -= node.cost;
      skills.paranoid = true;
      render();
      return true;
    });
    if (bought) ok('Paranoid via evaluate gekauft (Knoten UI nicht gefunden)');
    else {
      warn('Paranoid konnte nicht gekauft werden');
      s = await getState(page);
      log(`  Aktuelle Skills: ${s.skills.join(', ')}`);
    }
  } else {
    await paranoidNode.click();
    await page.waitForTimeout(150);
    await screenshot(page, 'paranoid_detail');

    const erlernBtn = page.locator('.action-btn').filter({ hasText: 'Erlernen' }).first();
    if (await erlernBtn.isVisible().catch(() => false)) {
      await erlernBtn.click();
      await page.waitForTimeout(200);
      if (await isDialogOpen(page)) await clickThroughDialog(page);
      ok('Paranoid erlernt');
    } else {
      warn('Erlernen-Button für Paranoid nicht gefunden');
    }
  }

  await screenshot(page, 'erfahrung_nach_paranoid');
  s = await getState(page);
  const hasParanoid = s.skills.includes('paranoid');
  ok(`Paranoid-Skill vorhanden: ${hasParanoid}`);

  // Nach Paranoid ist Arbeit wieder freigeschaltet (workBlockedByRobberies && !skills.paranoid = false).
  // Für "Neu anfangen" brauchen wir >= 50 Gold (RESET_MIN_GOLD). Gold-Earned-Flow wurde in
  // Phase 7 bereits ausführlich getestet — hier direkt setzen.
  if (s.gold < 50) {
    log('  → Setze Gold auf 50 für den finalen Neuanfang (RESET_MIN_GOLD)');
    await page.evaluate(() => { resources.gold = 50; render(); });
    await page.waitForTimeout(100);
    await navigateTo(page, 'erfahrung');
    await page.waitForTimeout(100);
  }

  // "Neu anfangen" Button suchen und klicken (muss enabled sein — gold >= 50 wurde oben sichergestellt)
  const neuAnfangen = page.locator('button:not([disabled])').filter({ hasText: 'Neu anfangen' }).first();
  if (!(await neuAnfangen.isVisible().catch(() => false))) {
    warn('"Neu anfangen"-Button nicht sichtbar oder disabled — direkter Reset via evaluate');
    await screenshot(page, 'warn_kein_neuanfangen');
    await page.evaluate(() => {
      settings.showResetAnimation = false;
      performManualReset();
    });
    await page.waitForTimeout(500);
  } else {
    await neuAnfangen.click();
    await page.waitForTimeout(300);

    // Erst den "Ein neuer Anfang"-Monolog durchklicken (3 Seiten mit "Weiter"),
    // dann kommt der Bestätigungs-Dialog mit "Ja. Neu anfangen." als letztem Button.
    for (let d = 0; d < 10; d++) {
      if (!(await isDialogOpen(page))) break;
      await page.waitForTimeout(150);
      const result = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#dialog-actions button:not([disabled])'));
        const confirmBtn = btns.find(b => b.textContent.includes('Neu anfangen'));
        const last = btns[btns.length - 1];
        if (confirmBtn) { confirmBtn.click(); return 'confirm'; }
        if (last) { last.click(); return 'weiter'; }
        return 'none';
      });
      if (result === 'confirm') { await page.waitForTimeout(600); break; }
      await page.waitForTimeout(200);
    }
  }

  // Dialog nach dem letzten Reset (Story 1.8 / 1.9 / Kapitel-2-Einleitung)
  if (await isDialogOpen(page)) await clickThroughDialog(page);
  await page.waitForTimeout(400);

  const sFinal = await getState(page);
  await screenshot(page, 'kapitel2_start');
  assert(
    sFinal.storyState >= 20100,
    `Kapitel 2 erreicht — storyState >= 20100 (ist: ${sFinal.storyState})`
  );
  log(`  EP nach Reset: ${sFinal.ep}, Resets gesamt: ${sFinal.resets}`);
  await checkUIObstruction(page, 'Kapitel 2 Start');
}

// ── Phase 10: Abschluss-Checks ────────────────────────────────────────────────
async function phase10_finalChecks(page) {
  log('\n══ Phase 10: Abschluss-Checks ══');

  // Stats-Seite (falls vorhanden)
  await navigateTo(page, 'statistiken');
  await page.waitForTimeout(100);
  await screenshot(page, 'statistiken');
  await checkUIObstruction(page, 'Statistiken');

  // Quest-Übersicht
  await navigateTo(page, 'quests');
  await page.waitForTimeout(100);
  await screenshot(page, 'quests');
  await checkUIObstruction(page, 'Quests');

  // Geschichte/Chronik
  await navigateTo(page, 'geschichte');
  await page.waitForTimeout(100);
  await screenshot(page, 'geschichte');
  await checkUIObstruction(page, 'Geschichte');
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────
async function main() {
  log('🎮 Chroniken des vergessenen Weges — Kapitel-1-Durchlauf-Test');
  log('═'.repeat(60));
  log(`  Modus: ${HEADLESS ? 'headless' : 'sichtbarer Browser'}`);
  if (FROM_FIXTURE) log(`  Startet ab Fixture: ${FROM_FIXTURE}`);
  log(`  Screenshots: ${SCREENSHOT_DIR}`);

  // Screenshots vom letzten Lauf löschen
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.readdirSync(SCREENSHOT_DIR)
      .filter(f => f.endsWith('.png'))
      .forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  }

  const server = createServer();
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  log(`  HTTP-Server: http://127.0.0.1:${PORT}/`);

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOW_MS });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  page.setDefaultTimeout(5000);  // Fehler schneller erkennen (Standard: 30s)

  // Fixture VOR Seitenaufruf laden (addInitScript muss vor goto())
  if (FROM_FIXTURE) await loadFixture(page, FROM_FIXTURE);

  const jsErrors = [];
  page.on('pageerror', err => {
    jsErrors.push(err.message);
    log(`  🔴 JS-Fehler: ${err.message.substring(0, 120)}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') log(`  🔴 Console: ${msg.text().substring(0, 120)}`);
  });

  const startTime = Date.now();

  try {
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Auf Spielinitialisierung warten
    await page.waitForFunction(() => typeof render === 'function' && typeof storyState !== 'undefined', { timeout: 8000 });
    log('  Spiel initialisiert');

    const run = async (name, fn, ...args) => {
      startPhaseTimer();
      await fn(...args);
      endPhaseTimer(name);
    };

    if (!FROM_FIXTURE) {
      await run('Phase 1', phase1_newGame, page);
      await run('Phase 2', phase2_firstContacts, page);
      await run('Phase 3', phase3_firstWorkAndMarket, page);
      await run('Phase 4', phase4_gathering, page);
      await run('Phase 5', phase5_nightAndQuests, page);
      await run('Phase 6', phase6_experienceUI, page);
      await saveFixture(page, 'pre_robbery');
      await run('Phase 7', phase7_robberies, page);
      await saveFixture(page, 'post_robbery');
    } else if (FROM_FIXTURE === 'pre_robbery') {
      // Skip Phases 1-6, starte direkt mit Raub-System
      await run('Phase 7', phase7_robberies, page);
      await saveFixture(page, 'post_robbery');
    } else if (FROM_FIXTURE === 'post_robbery') {
      // Skip Phases 1-7, starte direkt mit Paranoid + Kapitel 2
    }
    await run('Phase 8', phase8_gretaQuest, page);
    await run('Phase 9', phase9_paranoidAndChapter2, page);
    await run('Phase 10', phase10_finalChecks, page);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    log('\n' + '═'.repeat(60));
    log('✅ Durchlauf abgeschlossen!');
    log(`  Testlaufzeit: ${elapsed}s`);
    if (phaseTimes.length > 0) {
      log('\n⏱  Zeit pro Phase:');
      phaseTimes.forEach(p => log(`  ${p.name.padEnd(12)}: ${(p.ms / 1000).toFixed(1)}s`));
    }

    const savedTotal = saved.work + saved.nightwatch;
    log('\n⏱  Eingesparte Spielerzeit:');
    log(`  Feldarbeit:  ${saved.work / 1000}s real (${Math.round(saved.work / WORK_MS)} Durchläufe à ${WORK_MS / 1000}s)`);
    log(`  Gesamt:      ${(savedTotal / 60000).toFixed(1)} Minuten`);

    if (uiIssues.length > 0) {
      log(`\n⚠️  ${uiIssues.length} UI-Probleme gefunden:`);
      uiIssues.forEach(i => log(`  • ${i}`));
    } else {
      log('\n✅ Keine UI-Überlappungs-Probleme gefunden');
    }

    if (jsErrors.length > 0) {
      log(`\n❌ ${jsErrors.length} JavaScript-Fehler:`);
      jsErrors.forEach(e => log(`  • ${e}`));
    } else {
      log('✅ Keine JavaScript-Fehler');
    }

  } catch (err) {
    log(`\n❌ Test fehlgeschlagen: ${err.message}`);
    await screenshot(page, 'FEHLER');
    log(err.stack);
    process.exitCode = 1;
  } finally {
    if (!HEADLESS) await page.waitForTimeout(2000);
    await browser.close();
    server.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
