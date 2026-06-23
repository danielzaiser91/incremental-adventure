'use strict';

/**
 * Kapitel 1 — Alle Phasen bis storyState >= 20100.
 *
 * Jede Phase-Funktion akzeptiert ctx (aus test/lib/ctx.js).
 * Imports aus lib/ liefern alle game-agnostischen Helpers.
 */

const {
  getState, screenshot, isDialogOpen, clickThroughDialog, clearAllDialogs,
  navigateTo, doWork, goSleep, buyAndEatBrot, checkUIObstruction,
  saveFixture,
} = require('../lib/game');

const { wlog, PLAYER_TIME } = require('../lib/walkthrough');
const { ok, warn, assert, startPhase, endPhase, updateSection } = require('../lib/ctx');

// ── Section-Map: storyState → Walkthrough-Abschnittsname ─────────────────────
const SECTIONS = {
  10100: 'Das Stadttor (1.0)',
  10101: 'Treutheim erkunden (1.1)',
  10102: 'Ein Fremder erscheint (1.2)',
  10103: 'Raub I — Die Schläge beginnen (1.3)',
  10104: 'Raub II (1.4)',
  10105: 'Raub III (1.5)',
  10106: 'Raub IV — Arbeit gesperrt (1.6)',
  20100: 'Kapitel 2 — Neuanfang',
};

// Fixture-Namen für dieses Kapitel (k1_ Präfix = Kapitel 1)
const FIXTURES = {
  preRobbery:  'k1_pre_robbery',
  postRobbery: 'k1_post_robbery',
};

const p = ctx => ctx.page;

// ── Hilfsfunktion: Spielzustand + Section aktualisieren ──────────────────────
async function syncSection(ctx) {
  const s = await getState(ctx);
  updateSection(ctx, s.storyState, SECTIONS);
  return s;
}

// ── Phase 1: Neues Spiel → Treutheim betreten ─────────────────────────────────
async function phase1_newGame(ctx) {
  startPhase(ctx, 'Phase 1: Neues Spiel → Treutheim betreten');

  await p(ctx).evaluate(() => {
    if (typeof performHardReset === 'function') performHardReset();
    settings.showResetAnimation = false;
    render();
  });
  await p(ctx).waitForTimeout(300);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  ctx._currentSection = SECTIONS[10100];
  let s = await getState(ctx);
  assert(ctx, s.storyState === 10100, `Frischer Spielstand: storyState=10100 (ist: ${s.storyState})`);

  await screenshot(ctx, 'start');

  // Stadttor-Button auf der Geschichte-Seite, Fallback: Weltkarte
  const stadttor = p(ctx).locator('button').filter({ hasText: 'Stadttor betreten' }).first();
  let entered = false;

  if (await stadttor.isVisible().catch(() => false)) {
    await stadttor.click();
    entered = true;
  } else {
    await navigateTo(ctx, 'weltkarte', { log: false });
    await p(ctx).waitForTimeout(100);
    const btn = p(ctx).locator('.action-card').filter({ hasText: 'Treutheim' }).locator('button').first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      entered = true;
    }
  }
  if (!entered) {
    await p(ctx).evaluate(() => enterCity('treutheim'));
    warn(ctx, 'Treutheim via evaluate betreten (Buttons nicht gefunden)');
    entered = true;
  }

  assert(ctx, entered, 'Treutheim betreten');
  await p(ctx).waitForTimeout(400);

  wlog(ctx, {
    action:        'milestone',
    description:   'Treutheim betreten — Kapitel 1 beginnt',
    playerTimeSec: PLAYER_TIME.navigationSec,
  });

  // Story 1.1 Dialog
  assert(ctx, await isDialogOpen(ctx), 'Story-Dialog 1.1 nach Betreten Treutheims');
  await screenshot(ctx, 'story_1_1');

  const pages = await p(ctx).evaluate(() => {
    const o = document.getElementById('dialog-overlay');
    return o ? o.querySelectorAll('.dialog-page, p').length : 1;
  });
  await clearAllDialogs(ctx);
  wlog(ctx, {
    action:        'dialog',
    title:         'Ankunft in Treutheim',
    pages:         Math.max(1, pages),
    playerTimeSec: Math.max(1, pages) * PLAYER_TIME.dialogPageSec,
  });

  s = await syncSection(ctx);
  assert(ctx, s.storyState === 10101, `storyState nach Treutheim-Betreten: 10101 (ist: ${s.storyState})`);
  await checkUIObstruction(ctx, 'Treutheim Übersicht');
  await screenshot(ctx, 'treutheim');

  endPhase(ctx, 'Phase 1');
}

// ── Phase 2: Erste Kontakte (Taverne, NPCs) ───────────────────────────────────
async function phase2_firstContacts(ctx) {
  startPhase(ctx, 'Phase 2: Taverne & erste NPCs');
  await syncSection(ctx);

  await navigateTo(ctx, 'taverne');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'taverne_erstbesuch');
  await checkUIObstruction(ctx, 'Taverne Erstbesuch');

  wlog(ctx, {
    action:        'tip',
    description:   'Besuche alle NPCs in der Taverne — jeder hat etwas zu sagen.',
  });

  // Mira
  await p(ctx).evaluate(() => openNpcDialog('mira'));
  await p(ctx).waitForTimeout(150);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  wlog(ctx, {
    action:        'npc',
    npc:           'Mira',
    topic:         'Begrüßung, Drink-Angebot',
    playerTimeSec: PLAYER_TIME.npcDialogSec,
  });

  // Wirt
  const wirtExists = await p(ctx).evaluate(() => typeof NPCS.wirt !== 'undefined');
  if (wirtExists) {
    await p(ctx).evaluate(() => openNpcDialog('wirt'));
    await p(ctx).waitForTimeout(150);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
    wlog(ctx, {
      action:        'npc',
      npc:           'Wirt',
      playerTimeSec: PLAYER_TIME.npcDialogSec,
    });
  }

  // Brakka
  const brakkaExists = await p(ctx).evaluate(() => typeof NPCS.brakka !== 'undefined');
  if (brakkaExists) {
    await p(ctx).evaluate(() => openNpcDialog('brakka'));
    await p(ctx).waitForTimeout(150);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
    wlog(ctx, {
      action:        'npc',
      npc:           'Brakka',
      topic:         'erwähnt mögliche Nachtwache',
      playerTimeSec: PLAYER_TIME.npcDialogSec,
    });
  }

  await checkUIObstruction(ctx, 'Taverne nach NPCs');
  endPhase(ctx, 'Phase 2');
}

// ── Phase 3: Erste Feldarbeit, Hunger, Markt ──────────────────────────────────
async function phase3_firstWorkAndMarket(ctx) {
  startPhase(ctx, 'Phase 3: Erste Feldarbeit & Marktplatz');
  await syncSection(ctx);

  await navigateTo(ctx, 'arbeitsplatz');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'arbeitsplatz');
  await checkUIObstruction(ctx, 'Arbeitsplatz');

  // Infos-Panel testen
  const infoToggle = p(ctx).locator('.work-info-toggle, button:has-text("Infos")').first();
  if (await infoToggle.isVisible().catch(() => false)) {
    await infoToggle.click();
    await p(ctx).waitForTimeout(100);
    await checkUIObstruction(ctx, 'Arbeitsplatz Infos-Panel offen');
    await screenshot(ctx, 'arbeitsplatz_infos');
    await infoToggle.click();
    await p(ctx).waitForTimeout(100);
  }

  wlog(ctx, {
    action:        'tip',
    description:   'Beobachte die Hunger-Anzeige — bei ~50% Hunger wirst du zur Pause gezwungen.',
  });

  // 4 Feldarbeiten für ersten Hunger-Trigger
  await doWork(ctx, 4);
  let s = await getState(ctx);
  console.log(`  Gold: ${s.gold}  Hunger: ${s.hunger}%  Müdigkeit: ${s.tiredness}%`);

  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  // Brot kaufen falls Hunger hoch
  s = await getState(ctx);
  if (s.mustEatBread || s.hunger >= 50) {
    await buyAndEatBrot(ctx, 'arbeitsplatz');
    s = await getState(ctx);
    assert(ctx, !s.mustEatBread, `mustEatBread nach Essen: false (ist: ${s.mustEatBread})`);
    ok(ctx, `Hunger nach Essen: ${s.hunger}%, Müdigkeit: ${s.tiredness}%`);
  }

  // Marktplatz & Inventar erkunden
  await navigateTo(ctx, 'marktplatz');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'marktplatz');
  await checkUIObstruction(ctx, 'Marktplatz');

  await navigateTo(ctx, 'inventar');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'inventar');
  await checkUIObstruction(ctx, 'Inventar');

  endPhase(ctx, 'Phase 3');
}

// ── Phase 4: Sammelplatz ───────────────────────────────────────────────────────
async function phase4_gathering(ctx) {
  startPhase(ctx, 'Phase 4: Sammelplatz');

  const canGather = await p(ctx).evaluate(() => typeof gatherResource === 'function');
  if (!canGather) {
    console.log('  → Sammelplatz noch nicht zugänglich, Phase überspringen');
    endPhase(ctx, 'Phase 4');
    return;
  }

  await navigateTo(ctx, 'sammelplatz');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'sammelplatz');
  await checkUIObstruction(ctx, 'Sammelplatz');

  // Müdigkeits-Block testen
  const tiredBefore = await p(ctx).evaluate(() => needs.tiredness);
  if (tiredBefore < 100) {
    await p(ctx).evaluate(() => { needs.tiredness = 100; render(); });
  }
  const blocked = await p(ctx).evaluate(() =>
    Array.from(document.querySelectorAll('button')).some(b => b.disabled && b.textContent.includes('Sammeln'))
  );
  if (blocked) {
    ok(ctx, 'Sammeln bei 100% Müdigkeit korrekt geblockt');
  }
  await p(ctx).evaluate(() => { needs.tiredness = 20; render(); });

  const sammelnBtn = p(ctx).locator('button:has-text("Sammeln"), button:has-text("Holz"), button:has-text("Stein"), button:has-text("Wildkraut")').first();
  if (await sammelnBtn.isVisible().catch(() => false)) {
    await sammelnBtn.click();
    await p(ctx).waitForTimeout(100);
    ok(ctx, 'Einmal gesammelt');
    wlog(ctx, {
      action:        'milestone',
      description:   'Sammelplatz entdeckt und erkundet',
      playerTimeSec: PLAYER_TIME.explorationSec,
    });
  }

  endPhase(ctx, 'Phase 4');
}

// ── Phase 5: Nacht, Schlafplatz, Brakka-Quest ────────────────────────────────
async function phase5_nightAndQuests(ctx) {
  startPhase(ctx, 'Phase 5: Nacht, Schlafplatz & Brakka-Quest');
  await syncSection(ctx);

  await navigateTo(ctx, 'arbeitsplatz');
  await p(ctx).waitForTimeout(100);

  let s = await getState(ctx);
  console.log(`  Start: Stunde ${s.hour}:00, Tag ${s.day}`);

  // Bis zur Nacht arbeiten (max 20 Iterationen)
  for (let i = 0; i < 20; i++) {
    s = await getState(ctx);
    if (s.night) break;
    if (s.mustEatBread) { await buyAndEatBrot(ctx, 'arbeitsplatz'); continue; }
    if (s.tiredness >= 98) {
      await p(ctx).evaluate(() => ausruhen && ausruhen());
      await p(ctx).waitForTimeout(100);
      if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
      continue;
    }
    const worked = await doWork(ctx, 1);
    if (worked === 0) break;
  }

  s = await getState(ctx);
  if (!s.night) {
    await p(ctx).evaluate(() => { gameClock.hour = 22; render(); });
    console.log('  → Uhr auf 22:00 gesetzt (Fallback)');
  }
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await screenshot(ctx, 'erste_nacht');

  // Taverne nachts
  await navigateTo(ctx, 'taverne');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'taverne_nacht');
  await checkUIObstruction(ctx, 'Taverne Nacht');

  // Brakka: Nachtwache-Quest
  const brakkaLocked = await p(ctx).evaluate(() => {
    const npc = NPCS.brakka;
    return typeof npc?.locked === 'function' ? npc.locked() : !!(npc?.locked);
  });
  if (!brakkaLocked) {
    await p(ctx).evaluate(() => openNpcDialog('brakka'));
    await p(ctx).waitForTimeout(150);
    if (await isDialogOpen(ctx)) {
      await p(ctx).waitForTimeout(320);
      await p(ctx).locator('#dialog-actions button:not([disabled])').first().click();
      await p(ctx).waitForTimeout(200);
      if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
    }
    s = await getState(ctx);
    console.log(`  Nachtwache-Quest: ${s.quests.nightWatch}`);
    wlog(ctx, {
      action:        'npc',
      npc:           'Brakka',
      topic:         'Nachtwache-Quest annehmen',
      playerTimeSec: PLAYER_TIME.npcDialogSec,
    });
  }

  wlog(ctx, {
    action:        'tip',
    description:   'Die erste Nacht: Gehe zum Schlafplatz. Kostenlos auf der Straße schlafen.',
  });

  await goSleep(ctx);
  s = await getState(ctx);
  ok(ctx, `Tag nach Schlaf: ${s.day}, Müdigkeit: ${s.tiredness}%`);

  endPhase(ctx, 'Phase 5');
}

// ── Phase 6: Erfahrungs-Seite erkunden ───────────────────────────────────────
async function phase6_experienceUI(ctx) {
  startPhase(ctx, 'Phase 6: Erfahrungs-Seite');

  await navigateTo(ctx, 'erfahrung');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'erfahrung');
  await checkUIObstruction(ctx, 'Erfahrung');

  const s = await getState(ctx);
  console.log(`  EP: ${s.ep}, Resets: ${s.resets}`);

  if (s.ep > 0) {
    const firstNode = p(ctx).locator('.ep-node:not(.ep-node--locked):not(.ep-node--owned)').first();
    if (await firstNode.isVisible().catch(() => false)) {
      await firstNode.click();
      await p(ctx).waitForTimeout(150);
      await screenshot(ctx, 'erfahrung_skill_detail');
      await checkUIObstruction(ctx, 'Erfahrung Skill-Detail offen');
    }
  }

  wlog(ctx, {
    action:        'tip',
    description:   'Die Erfahrungs-Seite (📘-Button) zeigt deine EP und verfügbare Skills.',
  });

  endPhase(ctx, 'Phase 6');
}

// ── Phase 7: Das Raub-System (Räube 1–4) ─────────────────────────────────────
async function phase7_robberies(ctx) {
  startPhase(ctx, 'Phase 7: Raub-System (Räube 1–4)');
  await syncSection(ctx);

  await p(ctx).evaluate(() => { settings.showResetAnimation = false; });
  await navigateTo(ctx, 'arbeitsplatz');
  await p(ctx).waitForTimeout(100);

  const ROB_LABELS = ['', 'Raub 1', 'Raub 2', 'Raub 3', 'Raub 4'];
  const ROB_FLAGS  = ['robberyTriggered', 'robbery2Triggered', 'robbery3Triggered', 'robbery4Triggered'];
  let lastRobCount = 0;

  wlog(ctx, {
    action:        'tip',
    description:   'Du wirst insgesamt 4 Mal ausgeraubt. Das ist beabsichtigt — jedes Mal gibt es EP.',
  });

  for (let iter = 0; iter < 1500; iter++) {
    if (await isDialogOpen(ctx)) {
      await clearAllDialogs(ctx);
      await p(ctx).waitForTimeout(500);
    }

    let s = await getState(ctx);

    // Reset-Animation hängen geblieben?
    const resetAnim = await p(ctx).evaluate(() => {
      const ov = document.getElementById('reset-overlay');
      return ov ? ov.classList.contains('reset-overlay-visible') : false;
    });
    if (resetAnim) {
      await p(ctx).evaluate(() => {
        document.getElementById('reset-overlay').classList.remove('reset-overlay-visible');
        document.body.classList.remove('dialog-open');
      });
      await p(ctx).waitForTimeout(300);
      s = await getState(ctx);
    }

    // Neue Räube?
    const robCount = await p(ctx).evaluate((flags) =>
      flags.filter(f => gameFlags[f]).length,
    ROB_FLAGS);
    if (robCount > lastRobCount) {
      lastRobCount = robCount;
      s = await getState(ctx);
      console.log(`  ✓ ${ROB_LABELS[robCount]} ausgelöst! Resets: ${s.resets}, EP: ${s.ep}`);
      await screenshot(ctx, `raub_${robCount}`);

      updateSection(ctx, s.storyState, SECTIONS);
      wlog(ctx, {
        action:        'milestone',
        description:   `${ROB_LABELS[robCount]} ausgelöst! (${s.resets}. Reset, EP gesamt: ${s.ep})`,
        playerTimeSec: 0,
      });

      // Nach Raub: EP-Seite zeigen
      await navigateTo(ctx, 'erfahrung');
      await p(ctx).waitForTimeout(100);
      const sE = await getState(ctx);
      ok(ctx, `EP nach ${ROB_LABELS[robCount]}: ${sE.ep}`);
      await checkUIObstruction(ctx, `Erfahrung nach ${ROB_LABELS[robCount]}`);
      await navigateTo(ctx, 'arbeitsplatz');
      await p(ctx).waitForTimeout(100);

      if (robCount >= 4) break;
      continue;
    }

    if (robCount >= 4) break;

    // Nacht: schlafen
    if (s.night) {
      await goSleep(ctx);
      await navigateTo(ctx, 'arbeitsplatz');
      await p(ctx).waitForTimeout(80);
      continue;
    }

    // mustEatBread gesetzt
    if (s.mustEatBread) {
      if (s.gold < 4) {
        warn(ctx, `Deadlock: mustEatBread=true aber Gold=${s.gold} → Flag direkt löschen`);
        await p(ctx).evaluate(() => { gameFlags.mustEatBread = false; render(); });
      } else {
        await buyAndEatBrot(ctx, 'arbeitsplatz');
      }
      continue;
    }

    // Hunger direkt managen (Markt-UI wurde in Phase 3 getestet)
    if (s.hunger >= 70) {
      await p(ctx).evaluate(() => { needs.hunger = 20; render(); });
      continue;
    }

    // Müdigkeit
    if (s.tiredness >= 100) {
      const ausruhBtn = p(ctx).locator('button:has-text("Ausruhen"), button:has-text("Pause"), button:has-text("Verschnaufen")').first();
      if (await ausruhBtn.isVisible().catch(() => false)) {
        await ausruhBtn.click();
        await p(ctx).waitForTimeout(100);
      } else {
        await goSleep(ctx);
        await navigateTo(ctx, 'arbeitsplatz');
      }
      continue;
    }

    if (s.currentContent !== 'arbeitsplatz') {
      await navigateTo(ctx, 'arbeitsplatz');
      await p(ctx).waitForTimeout(80);
      continue;
    }

    await doWork(ctx, 1);

    if (iter % 100 === 0 && iter > 0) {
      const sNow = await getState(ctx);
      console.log(`  [${iter}] Gold: ${sNow.gold} | Earned: ${sNow.totalGoldEarned} | Resets: ${sNow.resets} | EP: ${sNow.ep}`);
    }
  }

  const sFinal = await getState(ctx);
  assert(ctx, await p(ctx).evaluate(() => !!gameFlags.robbery4Triggered), 'Raub 4 ausgelöst');
  assert(ctx, sFinal.workBlocked, 'Arbeit nach Raub 4 gesperrt');
  assert(ctx, sFinal.resets >= 4, `Mindestens 4 Resets nach Raub-Phase (ist: ${sFinal.resets})`);
  assert(ctx, sFinal.ep >= 3, `Mindestens 3 EP für Paranoid verfügbar (ist: ${sFinal.ep})`);

  endPhase(ctx, 'Phase 7');
}

// ── Phase 8: Greta-Quest (optional) ──────────────────────────────────────────
async function phase8_gretaQuest(ctx) {
  startPhase(ctx, 'Phase 8: Greta-Quest (Rohstoffe)');

  const s = await getState(ctx);
  if (s.quests.nightWatch !== 'active' && !await p(ctx).evaluate(() => quests.kraemerinBusiness?.state)) {
    console.log('  → Greta-Quest nicht aktiv, Phase überspringen');
    endPhase(ctx, 'Phase 8');
    return;
  }

  const kraemerinState = await p(ctx).evaluate(() => quests.kraemerinBusiness?.state ?? null);
  if (kraemerinState === 'rewarded' || kraemerinState === 'done') {
    ok(ctx, 'Greta-Quest bereits abgeschlossen');
    endPhase(ctx, 'Phase 8');
    return;
  }

  if (kraemerinState === 'invited' || kraemerinState === 'INVITED') {
    await navigateTo(ctx, 'taverne');
    await p(ctx).evaluate(() => openNpcDialog('greta'));
    await p(ctx).waitForTimeout(150);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  }

  const state2 = await p(ctx).evaluate(() => quests.kraemerinBusiness?.state ?? null);
  if (state2 !== 'active' && state2 !== 'ACTIVE') {
    console.log('  → Greta-Quest noch nicht aktiv, überspringe');
    endPhase(ctx, 'Phase 8');
    return;
  }

  await navigateTo(ctx, 'sammelplatz');
  await p(ctx).waitForTimeout(100);

  const resourceTypes = ['holz', 'stein', 'pflanze'];
  for (const res of resourceTypes) {
    for (let n = 0; n < 5; n++) {
      const inv = await p(ctx).evaluate(() => ({ ...resources.inventory }));
      if ((inv[res] || 0) >= 5) break;
      const btn = p(ctx).locator('button').filter({ hasText: new RegExp(res, 'i') }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await p(ctx).waitForTimeout(100);
      }
    }
  }

  await navigateTo(ctx, 'taverne');
  await p(ctx).evaluate(() => openNpcDialog('greta'));
  await p(ctx).waitForTimeout(150);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  const sAfter = await p(ctx).evaluate(() => quests.kraemerinBusiness?.state);
  console.log(`  Greta-Quest nach Turn-In: ${sAfter}`);

  endPhase(ctx, 'Phase 8');
}

// ── Phase 9: Paranoid kaufen → Kapitel 2 ─────────────────────────────────────
async function phase9_paranoidAndChapter2(ctx) {
  startPhase(ctx, 'Phase 9: Paranoid kaufen → Kapitel 2');

  await navigateTo(ctx, 'erfahrung');
  await p(ctx).waitForTimeout(150);
  await screenshot(ctx, 'erfahrung_vor_paranoid');
  await checkUIObstruction(ctx, 'Erfahrung vor Paranoid');

  let s = await getState(ctx);
  console.log(`  EP: ${s.ep}, Resets: ${s.resets}`);

  // Paranoid kaufen: UI-Klick, Fallback via evaluate
  const paranoidNode = p(ctx).locator('.ep-node').filter({ hasText: /Paranoid|👁/i }).first();
  let bought = false;

  if (await paranoidNode.isVisible().catch(() => false)) {
    await paranoidNode.click();
    await p(ctx).waitForTimeout(150);
    await screenshot(ctx, 'paranoid_detail');
    const erlernBtn = p(ctx).locator('.action-btn, button').filter({ hasText: 'Erlernen' }).first();
    if (await erlernBtn.isVisible().catch(() => false)) {
      await erlernBtn.click();
      await p(ctx).waitForTimeout(200);
      if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
      bought = true;
      ok(ctx, 'Paranoid via UI erlernt');
    }
  }

  if (!bought) {
    bought = await p(ctx).evaluate(() => {
      const node = EP_SKILL_TREE.find(n => n.id === 'paranoid');
      if (!node || experience.points < node.cost) return false;
      experience.points -= node.cost;
      skills.paranoid = 1;
      render();
      return true;
    });
    if (bought) ok(ctx, 'Paranoid via evaluate gekauft (Knoten UI nicht gefunden)');
    else warn(ctx, 'Paranoid konnte nicht gekauft werden');
  }

  s = await getState(ctx);
  const hasParanoid = s.skills.includes('paranoid');
  ok(ctx, `Paranoid-Skill vorhanden: ${hasParanoid}`);

  if (hasParanoid) {
    wlog(ctx, {
      action:        'skill',
      skillName:     'Paranoid',
      cost:          3,
      playerTimeSec: PLAYER_TIME.skillBuySec,
    });
    wlog(ctx, {
      action:        'tip',
      description:   'Paranoid entsperrt den "Neu anfangen"-Button und hebt die Arbeits-Sperre auf.',
    });
  }

  await screenshot(ctx, 'erfahrung_nach_paranoid');

  // Für "Neu anfangen" sind >= 50 Gold nötig
  if (s.gold < 50) {
    console.log('  → Setze Gold auf 50 für den finalen Neuanfang (RESET_MIN_GOLD)');
    await p(ctx).evaluate(() => { resources.gold = 50; render(); });
    await p(ctx).waitForTimeout(100);
    await navigateTo(ctx, 'erfahrung');
    await p(ctx).waitForTimeout(100);
  }

  // "Neu anfangen" klicken — danach kommen 3-seitiger Monolog + Bestätigungs-Dialog
  const neuAnfangen = p(ctx).locator('button:not([disabled])').filter({ hasText: 'Neu anfangen' }).first();
  if (await neuAnfangen.isVisible().catch(() => false)) {
    await neuAnfangen.click();
    await p(ctx).waitForTimeout(300);

    for (let d = 0; d < 10; d++) {
      if (!(await isDialogOpen(ctx))) break;
      await p(ctx).waitForTimeout(150);
      const result = await p(ctx).evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#dialog-actions button:not([disabled])'));
        const confirmBtn = btns.find(b => b.textContent.includes('Neu anfangen'));
        const last = btns[btns.length - 1];
        if (confirmBtn) { confirmBtn.click(); return 'confirm'; }
        if (last) { last.click(); return 'weiter'; }
        return 'none';
      });
      if (result === 'confirm') { await p(ctx).waitForTimeout(600); break; }
      await p(ctx).waitForTimeout(200);
    }
  } else {
    warn(ctx, '"Neu anfangen"-Button nicht sichtbar → direkter Reset via evaluate');
    await screenshot(ctx, 'warn_kein_neuanfangen');
    await p(ctx).evaluate(() => {
      settings.showResetAnimation = false;
      performManualReset();
    });
    await p(ctx).waitForTimeout(500);
  }

  const epBefore = s.ep;
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(400);

  const sFinal = await getState(ctx);
  await screenshot(ctx, 'kapitel2_start');

  wlog(ctx, {
    action:        'reset',
    epGain:        Math.max(0, sFinal.resets - s.resets),
    playerTimeSec: PLAYER_TIME.resetSec,
  });

  updateSection(ctx, sFinal.storyState, SECTIONS);
  wlog(ctx, {
    action:        'milestone',
    description:   `Kapitel 2 erreicht! storyState=${sFinal.storyState}, EP=${sFinal.ep}, Resets=${sFinal.resets}`,
    playerTimeSec: 0,
  });

  assert(ctx,
    sFinal.storyState >= 20100,
    `Kapitel 2 erreicht — storyState >= 20100 (ist: ${sFinal.storyState})`
  );
  console.log(`  EP nach Reset: ${sFinal.ep}, Resets gesamt: ${sFinal.resets}`);
  await checkUIObstruction(ctx, 'Kapitel 2 Start');

  endPhase(ctx, 'Phase 9');
}

// ── Phase 10: Abschluss-Checks ────────────────────────────────────────────────
async function phase10_finalChecks(ctx) {
  startPhase(ctx, 'Phase 10: Abschluss-Checks');

  await navigateTo(ctx, 'statistiken');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'statistiken');
  await checkUIObstruction(ctx, 'Statistiken');

  await navigateTo(ctx, 'quests');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'quests');
  await checkUIObstruction(ctx, 'Quests');

  await navigateTo(ctx, 'geschichte');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'geschichte');
  await checkUIObstruction(ctx, 'Geschichte');

  ok(ctx, 'Alle Abschluss-Checks bestanden');
  endPhase(ctx, 'Phase 10');
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  SECTIONS,
  FIXTURES,
  CHAPTER_TITLE: 'Chroniken des vergessenen Weges — Kapitel 1',
  phases: {
    newGame:             phase1_newGame,
    firstContacts:       phase2_firstContacts,
    firstWorkAndMarket:  phase3_firstWorkAndMarket,
    gathering:           phase4_gathering,
    nightAndQuests:      phase5_nightAndQuests,
    experienceUI:        phase6_experienceUI,
    robberies:           phase7_robberies,
    gretaQuest:          phase8_gretaQuest,
    paranoidAndChapter2: phase9_paranoidAndChapter2,
    finalChecks:         phase10_finalChecks,
  },
};
