'use strict';

/**
 * Kapitel-agnostische Spiel-Helpers.
 * Alle Funktionen akzeptieren ctx als erstes Argument.
 * Tragen automatisch zum Walkthrough-Log (ctx.walkthrough) bei
 * und akkumulieren geschätzte Spielerzeit (ctx.playerTimeSec).
 */

const fs   = require('fs');
const path = require('path');
const { wlog, PLAYER_TIME } = require('./walkthrough');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const FIXTURE_DIR    = path.join(__dirname, '..', 'fixtures');
const WORK_MS        = 2000;

const p = ctx => ctx.page;

// ── Spielzustand ──────────────────────────────────────────────────────────────

async function getState(ctx) {
  return p(ctx).evaluate(() => ({
    storyState,
    gold:            resources.gold,
    totalGoldEarned: resources.totalGoldEarned,
    resets:          meta.resets,
    ep:              experience.points,
    hunger:          Math.round(needs.hunger),
    tiredness:       Math.round(needs.tiredness),
    mustEatBread:    gameFlags.mustEatBread,
    isWorking:       gameFlags.isWorking,
    workBlocked:     gameFlags.workBlockedByRobberies,
    skills:          Object.keys(skills).filter(k => skills[k] >= 1),
    currentContent,
    day:             gameClock.day,
    hour:            gameClock.hour,
    quests: {
      nightWatch: quests.nightWatch?.state,
    },
  }));
}

// ── Screenshots ───────────────────────────────────────────────────────────────

async function screenshot(ctx, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const idx  = String(ctx._screenshotIndex++).padStart(2, '0');
  await p(ctx).screenshot({ path: path.join(SCREENSHOT_DIR, `${idx}_${name}.png`) });
  console.log(`  📸 ${name}`);
}

function clearScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) return;
  fs.readdirSync(SCREENSHOT_DIR)
    .filter(f => f.endsWith('.png'))
    .forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
}

// ── Dialog-Handling ───────────────────────────────────────────────────────────

async function isDialogOpen(ctx) {
  return p(ctx).evaluate(() => {
    const o = document.getElementById('dialog-overlay');
    return o ? !o.classList.contains('hidden') : false;
  });
}

async function clickThroughDialog(ctx) {
  const closed = await p(ctx).evaluate(() => {
    const o = document.getElementById('dialog-overlay');
    if (!o || o.classList.contains('hidden')) return false;
    const btns = o.querySelectorAll('button:not([disabled])');
    if (btns.length > 0) { btns[0].click(); return true; }
    return false;
  });
  if (closed) await p(ctx).waitForTimeout(220);
  return closed;
}

/** Klickt alle offenen Dialoge weg. Gibt Anzahl der geschlossenen Dialoge zurück. */
async function clearAllDialogs(ctx) {
  let count = 0;
  while (await isDialogOpen(ctx)) {
    await clickThroughDialog(ctx);
    if (++count > 20) break;
  }
  return count;
}

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Navigiert zu einem Content-Bereich und schließt etwaige Eingangs-Monologe.
 * opts.log = false → kein wlog-Eintrag (für interne Navigationen in Helpers)
 */
async function navigateTo(ctx, contentId, { log = true } = {}) {
  await p(ctx).evaluate((id) => showContent(id), contentId);
  await p(ctx).waitForTimeout(80);
  await clearAllDialogs(ctx);
  if (log) {
    wlog(ctx, {
      action:        'navigate',
      location:      contentId,
      playerTimeSec: PLAYER_TIME.navigationSec,
    });
  }
}

// ── Feldarbeit ────────────────────────────────────────────────────────────────

/**
 * Führt n Feldarbeits-Zyklen aus (Animation wird übersprungen).
 * Bricht früh ab wenn ein Dialog aufgeht (Raub, Meilenstein, etc.).
 * Gibt tatsächlich abgeschlossene Zyklen zurück.
 */
async function doWork(ctx, n = 1) {
  let done = 0;
  for (let i = 0; i < n; i++) {
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
    const btn = p(ctx).locator('#btn-work:not([disabled])');
    if (!(await btn.isVisible().catch(() => false))) {
      console.log(`  ⚠️  doWork: Schuften-Button nicht sichtbar (i=${i})`);
      return done;
    }
    await btn.click();
    await p(ctx).waitForTimeout(10);
    const working = await p(ctx).evaluate(() => gameFlags.isWorking);
    if (!working) {
      console.log(`  ⚠️  doWork: isWorking=false nach Klick (i=${i})`);
      return done;
    }
    await p(ctx).evaluate(() => completeWork());
    await p(ctx).waitForFunction(() => !gameFlags.isWorking, { timeout: 2000 });
    ctx.saved.work += WORK_MS;
    done++;
    if (await isDialogOpen(ctx)) break;
  }
  if (done > 0) {
    wlog(ctx, {
      action:        'work',
      description:   `${done}× Feldarbeit`,
      count:         done,
      playerTimeSec: done * PLAYER_TIME.workSec,
    });
  }
  return done;
}

// ── Schlafen ─────────────────────────────────────────────────────────────────

/**
 * Schläft auf der Straße. Setzt Uhrzeit auf 22:00 wenn noch kein Abend.
 * Gibt den Spielstand nach dem Schlafen zurück.
 */
async function goSleep(ctx) {
  const s = await getState(ctx);
  if (s.hour < 22) {
    await p(ctx).evaluate(() => {
      gameClock.hour = 22;
      gameFlags.firstNightDialogShown = true;
      render();
    });
  }
  await navigateTo(ctx, 'schlafplatz', { log: false });
  const btn = p(ctx).locator('button:has-text("Schlafen"):not([disabled])').first();
  if (!(await btn.isVisible().catch(() => false))) {
    console.log('  ⚠️  goSleep: Schlafen-Button nicht gefunden');
    return null;
  }
  await btn.click();
  await p(ctx).waitForTimeout(200);
  if (await isDialogOpen(ctx)) await clickThroughDialog(ctx);
  const after = await getState(ctx);
  console.log(`  → Geschlafen (Tag ${after.day})`);
  wlog(ctx, {
    action:        'sleep',
    option:        'Straße',
    day:           after.day,
    playerTimeSec: PLAYER_TIME.sleepSec,
  });
  return after;
}

// ── Essen kaufen & verzehren ──────────────────────────────────────────────────

/**
 * Kauft Brot beim Krämer und isst es sofort.
 * Navigiert danach zu `returnTo` (falls angegeben).
 */
async function buyAndEatBrot(ctx, returnTo) {
  await navigateTo(ctx, 'marktplatz', { log: false });
  const kraemer = p(ctx).locator('.action-card').filter({ hasText: 'Krämer' }).first();
  if (await kraemer.isVisible().catch(() => false)) {
    await kraemer.locator('button').first().click();
    await p(ctx).waitForTimeout(100);
  }
  const kaufen = p(ctx).locator('button:has-text("Kaufen")').first();
  if (await kaufen.isVisible().catch(() => false)) {
    await kaufen.click();
    await p(ctx).waitForTimeout(100);
  }
  await navigateTo(ctx, 'inventar', { log: false });
  const verzehren = p(ctx).locator('button:has-text("Verzehren")').first();
  if (await verzehren.isVisible().catch(() => false)) {
    await verzehren.click();
    await p(ctx).waitForTimeout(100);
    wlog(ctx, {
      action:        'buy',
      vendor:        'Krämer',
      item:          'Brot',
      cost:          4,
      playerTimeSec: PLAYER_TIME.marketBuySec,
    });
    wlog(ctx, {
      action:        'use',
      item:          'Brot',
      playerTimeSec: PLAYER_TIME.inventoryUseSec,
    });
  }
  if (returnTo) await navigateTo(ctx, returnTo, { log: false });
}

// ── UI-Überlappungsprüfung ────────────────────────────────────────────────────

async function checkUIObstruction(ctx, context) {
  if (await isDialogOpen(ctx)) return;
  const issues = await p(ctx).evaluate(() => {
    const results = [];
    document.querySelectorAll('button:not([disabled])').forEach(btn => {
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const cx    = Math.round(rect.left + rect.width / 2);
      const cy    = Math.round(rect.top  + rect.height / 2);
      const topEl = document.elementFromPoint(cx, cy);
      if (topEl && topEl !== btn && !btn.contains(topEl)) {
        results.push({
          button:    btn.textContent.trim().substring(0, 20),
          coveredBy: topEl.textContent.trim().substring(0, 50),
          zIndex:    window.getComputedStyle(topEl).zIndex,
          cx, cy,
        });
      }
    });
    return results;
  });
  for (const issue of issues) {
    const msg = `[${context}] Button "${issue.button}" verdeckt durch "${issue.coveredBy}" (z=${issue.zIndex}, pos=${issue.cx},${issue.cy})`;
    console.log(`  ⚠️  ${msg}`);
    ctx.uiIssues.push(msg);
  }
}

// ── Fixture-System ────────────────────────────────────────────────────────────

/**
 * Speichert den aktuellen Spielstand als Fixture-JSON.
 * Wird nur ausgeführt wenn ctx.generateFixtures = true.
 * name: z.B. 'k1_pre_robbery' (Präfix kl_ = Kapitel 1)
 */
async function saveFixture(ctx, name) {
  if (!ctx.generateFixtures) return;
  const saveJson = await p(ctx).evaluate(() => {
    saveGame({ silent: true });
    return localStorage.getItem(SAVE_KEY);
  });
  if (!saveJson) {
    console.log(`  ⚠️  Fixture "${name}" nicht gespeichert — kein Spielstand`);
    return;
  }
  if (!fs.existsSync(FIXTURE_DIR)) fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(FIXTURE_DIR, `${name}.json`), saveJson);
  console.log(`  💾 Fixture gespeichert: fixtures/${name}.json`);
}

/**
 * Lädt eine Fixture-Datei in localStorage BEVOR die Seite aufgerufen wird.
 * Muss VOR page.goto() aufgerufen werden.
 */
async function loadFixture(page, name) {
  const fixturePath = path.join(FIXTURE_DIR, `${name}.json`);
  if (!fs.existsSync(fixturePath))
    throw new Error(`Fixture nicht gefunden: fixtures/${name}.json\n` +
      `Erst einen vollständigen Durchlauf machen: node test/run.js --chapter=1`);
  const saveJson = fs.readFileSync(fixturePath, 'utf8');
  await page.addInitScript({
    content: `localStorage.setItem('chronicles_v1', ${JSON.stringify(saveJson)});`,
  });
  console.log(`  📂 Fixture geladen: fixtures/${name}.json`);
}

module.exports = {
  getState,
  screenshot,
  clearScreenshots,
  isDialogOpen,
  clickThroughDialog,
  clearAllDialogs,
  navigateTo,
  doWork,
  goSleep,
  buyAndEatBrot,
  checkUIObstruction,
  saveFixture,
  loadFixture,
};
