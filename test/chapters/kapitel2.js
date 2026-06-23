'use strict';

/**
 * Kapitel 2 — Phasen von storyState 20100 bis 20200.
 *
 * Jede Phase-Funktion akzeptiert ctx (aus test/lib/ctx.js).
 * Der Test startet in Phase 1 immer mit einem frischen Spielstand
 * und injiziert den Kapitel-1-Abschlusszustand direkt — unabhängig
 * vom Kapitel-1-Durchlauf.
 */

const {
  getState, screenshot, isDialogOpen, clearAllDialogs,
  navigateTo, checkUIObstruction, saveFixture,
} = require('../lib/game');

const { wlog, PLAYER_TIME } = require('../lib/walkthrough');
const { ok, warn, assert, startPhase, endPhase, updateSection } = require('../lib/ctx');

// ── Kapitel-2-spezifische Spielerzeit-Konstanten ──────────────────────────────
const K2_TIME = {
  combatSec: 45,  // Wolvs/Wildschwein: Angriff + Gegner-Klicks ≈ 45s
  bossSec:   90,  // Waldtroll: dramatischer, länger ≈ 90s
};

// ── Section-Map: storyState → Walkthrough-Abschnittsname ─────────────────────
const SECTIONS = {
  20100: 'Kapitel 2 — Vorbereitung (2.0)',
  20101: 'Das Jagdgebiet (2.1)',
  20102: 'Die Spur des Diebs (2.2)',
  20103: 'Ein Fund (2.3)',
  20104: 'Mira weiß mehr (2.4)',
  20105: 'Brakka enthüllt alles (2.5)',
  20106: 'Die Konfrontation (2.6)',
  20200: 'Kapitel 2 abgeschlossen',
};

// Fixture-Namen für dieses Kapitel (k2_ Präfix = Kapitel 2)
const FIXTURES = {
  postGuild:         'k2_post_guild',
  postInvestigation: 'k2_post_investigation',
};

const CHAPTER_TITLE = 'Chroniken des vergessenen Weges — Kapitel 2';

const p = ctx => ctx.page;

async function syncSection(ctx) {
  const s = await getState(ctx);
  updateSection(ctx, s.storyState, SECTIONS);
  return s;
}

// ── Kampf-Helper ──────────────────────────────────────────────────────────────

/**
 * Führt n Kämpfe gegen monsterId durch.
 * Setzt enemy-HP auf 1 und klickt dann Angreifen — sofortiger Sieg.
 * Schließt alle post-Kampf-Dialoge (Monologe, Story-Events).
 */
async function doFight(ctx, monsterId, n = 1) {
  let wins = 0;
  for (let i = 0; i < n; i++) {
    // HP auffüllen (Kampf darf nicht durch Tod abbrechen)
    await p(ctx).evaluate(() => {
      playerStats.hp = playerStats.maxHp;
      render();
    });

    // Kampf starten
    await p(ctx).evaluate((id) => startCombat(id), monsterId);
    await p(ctx).waitForTimeout(100);

    const combatActive = await p(ctx).evaluate(() => combat.active);
    if (!combatActive) {
      warn(ctx, `doFight: Kampf gegen ${monsterId} konnte nicht gestartet werden (i=${i})`);
      break;
    }

    // Monster sofort töten: HP auf 1, dann Angriff
    await p(ctx).evaluate(() => { combat.enemyHp = 1; render(); });
    await p(ctx).waitForTimeout(50);

    const attackBtn = p(ctx).locator('button').filter({ hasText: 'Angreifen' });
    if (await attackBtn.isVisible().catch(() => false)) {
      await attackBtn.click();
    } else {
      await p(ctx).evaluate(() => performAttack());
      warn(ctx, `doFight: Angreifen-Button nicht sichtbar — evaluate-Fallback (i=${i})`);
    }
    await p(ctx).waitForTimeout(100);

    await p(ctx).waitForFunction(() => !combat.active, { timeout: 3000 }).catch(() => {
      console.log(`  ⚠️  doFight: Kampf ${i + 1} nicht beendet (Timeout)`);
    });

    // Post-Kampf-Dialoge: Story-Events und Monologe (z.B. Waldtroll, firstCombatDefeated)
    // setTimeout(400) in combat.js → warten + mehrfach prüfen
    await p(ctx).waitForTimeout(600);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
    await p(ctx).waitForTimeout(300);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

    wins++;
  }

  wlog(ctx, {
    action:        'combat',
    monster:       monsterId,
    count:         wins,
    description:   `${wins}× ${monsterId} besiegt`,
    playerTimeSec: wins * (monsterId === 'waldtroll' ? K2_TIME.bossSec : K2_TIME.combatSec),
  });
  return wins;
}

// ── Phase 1: Setup — Kapitel-2-Startstate herstellen ─────────────────────────

async function phase1_setup(ctx) {
  startPhase(ctx, 'Phase 1: Setup — Kapitel-2-Startstate');

  await p(ctx).evaluate(() => {
    if (typeof performHardReset === 'function') performHardReset();
    settings.showResetAnimation = false;

    // Kapitel-1-Abschluss-Zustand (äquivalent zum Ende von Kapitel 1, Phase 10)
    storyState        = 20100;
    meta.resets       = 5;
    resources.gold    = 2000;
    experience.points = 110;

    // Nachtwache abgeschlossen (Brakka-Voraussetzung)
    quests.nightWatch.state        = 'rewarded';
    quests.guildRegistration.state = 'unstarted';

    // Paranoid (Kapitel-1-Endskill) + Gilde-Voraussetzungen direkt setzen
    skills.paranoid           = true;
    skills.nightWatchLeveling = true;  // Voraussetzung für guildPrep
    skills.goldBreakthrough   = true;  // Voraussetzung für guildPrep

    // Flaggen die nach Kapitel-1-Verlauf gesetzt sein müssen
    gameFlags.jobUnlocked            = true;   // Korbin hat Feldarbeit erklärt (Phase 1 Kap 1)
    gameFlags.workBlockedByRobberies = false;  // Nach Paranoid-Kauf aufgehoben
    gameFlags.firstNightDialogShown  = true;

    // Mira-Vertrauen: Drink wurde bereits ausgegeben
    npcFlags.miraDrinkGiven = true;

    render();
  });

  await p(ctx).waitForTimeout(300);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  const s = await syncSection(ctx);
  assert(ctx, s.storyState === 20100, `Setup: storyState=20100 (ist: ${s.storyState})`);

  wlog(ctx, {
    action:        'milestone',
    description:   `Kapitel 2 gestartet — storyState=${s.storyState}, Resets=${s.resets}, EP=${s.ep}`,
    playerTimeSec: 0,
  });

  endPhase(ctx, 'Phase 1');
}

// ── Phase 2: guildPrep kaufen + Gilden-Registrierung ─────────────────────────

async function phase2_guildRegistration(ctx) {
  startPhase(ctx, 'Phase 2: guildPrep kaufen + Gilden-Registrierung');
  await syncSection(ctx);

  // Erfahrungs-Seite aufrufen und guildPrep via API kaufen
  await navigateTo(ctx, 'erfahrung');
  await p(ctx).waitForTimeout(100);
  await screenshot(ctx, 'k2_erfahrung_start');

  const boughtState = await p(ctx).evaluate(() => {
    buyNextSkillLevel('guildPrep');
    return quests.guildRegistration.state;
  });
  await p(ctx).waitForTimeout(300);

  // learnDialog: 3 Seiten (clearAllDialogs klickt alle durch)
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(100);

  assert(ctx, boughtState === 'active' || await p(ctx).evaluate(() => quests.guildRegistration.state === 'active'),
    'guildRegistration.state = active nach guildPrep-Kauf');

  wlog(ctx, {
    action:        'skill',
    skillName:     'Vorbereitung auf die Gilde',
    cost:          100,
    description:   '100 EP + 1000 Gold → Brakkas Gilden-Quest gestartet',
    playerTimeSec: PLAYER_TIME.skillBuySec,
  });

  // Erster Brakka-Besuch → guildExplain
  await navigateTo(ctx, 'taverne');
  await p(ctx).evaluate(() => openNpcDialog('brakka'));
  await p(ctx).waitForTimeout(150);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);  // "Verstanden." → guildExplainedByBrakka=true

  wlog(ctx, {
    action: 'npc',
    npc:    'Brakka',
    topic:  'Gilde-Erklärung — Anforderungen',
    playerTimeSec: PLAYER_TIME.npcDialogSec,
  });

  // Zweiter Brakka-Besuch → guildReadyCheck → Option [1] "Ja. Ich bin bereit."
  await p(ctx).evaluate(() => openNpcDialog('brakka'));
  // 300ms warten — showPaginatedDialog hat einen 250ms-Guard auf Final-Buttons,
  // der zu frühe Doppelklicks verhindert. Dieser ist ein Single-Page-Dialog.
  await p(ctx).waitForTimeout(300);
  assert(ctx, await isDialogOpen(ctx), 'guildReadyCheck-Dialog offen');

  // Explizit Option [1] klicken (Option [0] wäre "Noch nicht.")
  await p(ctx).evaluate(() => {
    const btns = document.querySelectorAll('#dialog-actions button:not([disabled])');
    if (btns.length > 1) btns[1].click();
    else if (btns.length === 1) btns[0].click();
  });
  await p(ctx).waitForTimeout(300);

  // guildEnd-Node: 3 Seiten → "Das Jagdgebiet. Ich verstehe."
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  const kapitel2Unlocked  = await p(ctx).evaluate(() => !!gameFlags.kapitel2Unlocked);
  const jagdgebietUnlocked = await p(ctx).evaluate(() => !!gameFlags.jagdgebietUnlocked);
  assert(ctx, kapitel2Unlocked,   'kapitel2Unlocked nach Brakka-Bestätigung');
  assert(ctx, jagdgebietUnlocked, 'jagdgebietUnlocked nach Gilde-Registrierung');

  wlog(ctx, {
    action: 'npc',
    npc:    'Brakka',
    topic:  '"Ja, ich bin bereit" → Jagdgebiet freigeschaltet',
    playerTimeSec: PLAYER_TIME.npcDialogSec,
  });
  wlog(ctx, {
    action:        'milestone',
    description:   'Jagdgebiet freigeschaltet — kapitel2Unlocked=true',
    playerTimeSec: 0,
  });

  await checkUIObstruction(ctx, 'Nach Gilde-Registrierung');
  await screenshot(ctx, 'k2_gilde_freigeschaltet');
  endPhase(ctx, 'Phase 2');
}

// ── Phase 3: Erster Jagdgebiet-Kill (storyState 20101) ───────────────────────

async function phase3_firstHunt(ctx) {
  startPhase(ctx, 'Phase 3: Erster Jagdgebiet-Kill');
  await syncSection(ctx);

  await navigateTo(ctx, 'jagdgebiet');
  await screenshot(ctx, 'k2_jagdgebiet_erstbesuch');
  await checkUIObstruction(ctx, 'Jagdgebiet Erstbesuch');

  wlog(ctx, {
    action:        'navigate',
    location:      'jagdgebiet',
    description:   'Jagdgebiet — erste Monster warten',
    playerTimeSec: PLAYER_TIME.explorationSec,
  });
  wlog(ctx, {
    action:        'tip',
    description:   'Kämpfe kosten Lebenspunkte. Schlafen stellt HP wieder her.',
  });

  const wins = await doFight(ctx, 'wolf', 1);
  assert(ctx, wins === 1, 'Erster Wolf besiegt');

  const s = await syncSection(ctx);
  assert(ctx, s.storyState >= 20101, `storyState >= 20101 nach erstem Kill (ist: ${s.storyState})`);

  const firstKill = await p(ctx).evaluate(() => !!gameFlags.firstJagdgebietKill);
  assert(ctx, firstKill, 'firstJagdgebietKill gesetzt');

  await screenshot(ctx, 'k2_nach_erstem_kill');
  endPhase(ctx, 'Phase 3');
}

// ── Phase 4: Korbin-Quest starten (storyState 20102) ─────────────────────────

async function phase4_korbinQuest(ctx) {
  startPhase(ctx, 'Phase 4: Korbin — Diebstahlquest');
  await syncSection(ctx);

  await navigateTo(ctx, 'taverne');

  // Korbin: chapter2intro [0] → chapter2reveal [0] → Quest ACTIVE
  await p(ctx).evaluate(() => openNpcDialog('wirt'));
  await p(ctx).waitForTimeout(150);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(400);
  // Story 2.2 dialog
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  const questState = await p(ctx).evaluate(() => quests.theftInvestigation.state);
  assert(ctx, questState === 'active', `theftInvestigation = active (ist: ${questState})`);

  const s = await syncSection(ctx);
  assert(ctx, s.storyState === 20102, `storyState = 20102 (ist: ${s.storyState})`);

  wlog(ctx, {
    action:        'npc',
    npc:           'Korbin, der Wirt',
    topic:         'Diebstahlquest erhalten: Die Spur des Diebs',
    playerTimeSec: PLAYER_TIME.npcDialogSec,
  });

  await screenshot(ctx, 'k2_korbin_quest');
  endPhase(ctx, 'Phase 4');
}

// ── Phase 5: 4 weitere Kills → Münzfund (storyState 20103) ──────────────────

async function phase5_coinClue(ctx) {
  startPhase(ctx, 'Phase 5: 4 weitere Kills + Münzfund');
  await syncSection(ctx);

  await navigateTo(ctx, 'jagdgebiet');

  // 4 Wölfe (Gesamt: 5+) → Münzfund-Event nach dem 5. Kill
  const wins = await doFight(ctx, 'wolf', 4);
  ok(ctx, `${wins}/4 Wölfe besiegt`);

  // Münzfund-Monolog (setTimeout 400ms in combat.js) + Story 2.3 könnten noch offen sein
  await p(ctx).waitForTimeout(700);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(300);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  const questState = await p(ctx).evaluate(() => quests.theftInvestigation.state);
  assert(ctx, questState === 'investigating', `theftInvestigation = investigating (ist: ${questState})`);

  const s = await syncSection(ctx);
  assert(ctx, s.storyState === 20103, `storyState = 20103 (ist: ${s.storyState})`);

  wlog(ctx, {
    action:        'tip',
    description:   'Die gefundene Münze ist ein Beweis. Mira in der Taverne kennt den Hintergrund.',
  });

  await screenshot(ctx, 'k2_muenzfund');
  endPhase(ctx, 'Phase 5');
}

// ── Phase 6: Mira (Detektiv) → storyState 20104 ──────────────────────────────

async function phase6_miraDetective(ctx) {
  startPhase(ctx, 'Phase 6: Mira — Detektivspur');
  await syncSection(ctx);

  // Mira ist nur abends verfügbar
  await p(ctx).evaluate(() => { gameClock.hour = 22; render(); });
  await navigateTo(ctx, 'taverne');

  // Mira → detectiveAsk [0] → detectiveReveal [0] → setzt miraRevealedInfo, storyState 20104
  await p(ctx).evaluate(() => openNpcDialog('mira'));
  await p(ctx).waitForTimeout(150);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(400);
  // Story 2.4 dialog
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  const miraRevealed = await p(ctx).evaluate(() => !!gameFlags.miraRevealedInfo);
  assert(ctx, miraRevealed, 'miraRevealedInfo gesetzt');

  const questAfterMira = await p(ctx).evaluate(() => quests.theftInvestigation.state);
  assert(ctx, questAfterMira === 'mira_consulted', `theftInvestigation = mira_consulted (ist: ${questAfterMira})`);

  const s = await syncSection(ctx);
  assert(ctx, s.storyState === 20104, `storyState = 20104 (ist: ${s.storyState})`);

  wlog(ctx, {
    action:        'npc',
    npc:           'Mira',
    topic:         'Detektivspur: Brakka kennt den Täter',
    playerTimeSec: PLAYER_TIME.npcDialogSec,
  });

  // Zweiter Mira-Besuch → letterOffer (theftInvestigation ist jetzt MIRA_CONSULTED, nicht mehr INVESTIGATING)
  await p(ctx).evaluate(() => openNpcDialog('mira'));
  await p(ctx).waitForTimeout(150);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);  // [0] = "Ich kümmere mich darum."
  await p(ctx).waitForTimeout(200);

  const miraLetter = await p(ctx).evaluate(() => quests.miraLetter.state);
  if (miraLetter === 'active') {
    wlog(ctx, {
      action:        'npc',
      npc:           'Mira',
      topic:         'Brief für Brakka erhalten',
      playerTimeSec: PLAYER_TIME.npcDialogSec,
    });
  } else {
    warn(ctx, `miraLetter.state = ${miraLetter} (erwartet: active)`);
  }

  await screenshot(ctx, 'k2_mira_detective');
  endPhase(ctx, 'Phase 6');
}

// ── Phase 7: Brief zu Brakka + Brakka enthüllt (storyState 20105) ────────────

async function phase7_brakkaReveal(ctx) {
  startPhase(ctx, 'Phase 7: Brief liefern + Brakka-Enthüllung');
  await syncSection(ctx);

  await navigateTo(ctx, 'taverne');

  // Erster Brakka-Besuch: receiveLetter (wenn Brief aktiv) ODER detectiveReveal
  await p(ctx).evaluate(() => openNpcDialog('brakka'));
  await p(ctx).waitForTimeout(150);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(300);

  const miraLetterState = await p(ctx).evaluate(() => quests.miraLetter.state);

  if (miraLetterState === 'delivered') {
    // Brief zugestellt → Mira Bescheid geben → dann Brakka nochmal für detectiveReveal
    await p(ctx).evaluate(() => openNpcDialog('mira'));
    await p(ctx).waitForTimeout(150);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);  // letterDelivered → REWARDED
    wlog(ctx, {
      action:        'npc',
      npc:           'Mira',
      topic:         'Brief zugestellt (+6 Gold)',
      playerTimeSec: PLAYER_TIME.npcDialogSec,
    });

    // Brakka nochmal → detectiveReveal → storyState 20105
    await p(ctx).evaluate(() => openNpcDialog('brakka'));
    await p(ctx).waitForTimeout(150);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
    await p(ctx).waitForTimeout(400);
    // Story 2.5 dialog
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  } else {
    // Brief-Quest nicht aktiv → directe detectiveReveal-Node wurde bereits abgehandelt
    // Story 2.5 könnte bereits durch den ersten clearAllDialogs-Aufruf geschlossen worden sein
    await p(ctx).waitForTimeout(400);
    if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  }

  const brakkaRevealed = await p(ctx).evaluate(() => !!gameFlags.brakkaRevealedSuspect);
  assert(ctx, brakkaRevealed, 'brakkaRevealedSuspect gesetzt');

  const questState = await p(ctx).evaluate(() => quests.theftInvestigation.state);
  assert(ctx, questState === 'brakka_consulted', `theftInvestigation = brakka_consulted (ist: ${questState})`);

  const s = await syncSection(ctx);
  assert(ctx, s.storyState === 20105, `storyState = 20105 (ist: ${s.storyState})`);

  wlog(ctx, {
    action:        'npc',
    npc:           'Brakka',
    topic:         'Verdächtiger enthüllt: der Fremde in der Taverne ist der Voraussucher',
    playerTimeSec: PLAYER_TIME.npcDialogSec,
  });
  wlog(ctx, {
    action:        'tip',
    description:   'Jetzt: Waldtroll besiegen + Stärke-Stufe 3 erreichen — dann den Fremden stellen.',
  });

  await screenshot(ctx, 'k2_brakka_enthuellung');
  endPhase(ctx, 'Phase 7');
}

// ── Phase 8: Stärke Lvl 3 + Waldtroll (waldtrollKilled) ─────────────────────

async function phase8_waldtrollAndStrength(ctx) {
  startPhase(ctx, 'Phase 8: Stärke Lvl 3 + Waldtroll');
  await syncSection(ctx);

  // Stärke direkt auf Level 3 setzen (70 XP) — erspart langen Grind in Tests
  await p(ctx).evaluate(() => {
    strength.xp    = 70;
    strength.level = getStrengthLevel(70);
    playerStats.maxHp = getPlayerMaxHp();
    playerStats.hp    = playerStats.maxHp;
    render();
  });

  const lvl = await p(ctx).evaluate(() => getStrengthLevel(strength.xp));
  assert(ctx, lvl >= 3, `Stärke-Level >= 3 (ist: ${lvl})`);

  await navigateTo(ctx, 'jagdgebiet');
  await screenshot(ctx, 'k2_vor_waldtroll');

  wlog(ctx, {
    action:        'milestone',
    description:   'Stärke-Stufe 3 erreicht — Tiefjagdgebiet (Waldtroll) zugänglich',
    playerTimeSec: 0,
  });

  const wins = await doFight(ctx, 'waldtroll', 1);
  assert(ctx, wins === 1, 'Waldtroll besiegt');

  // Waldtroll-Monolog (setTimeout 400ms) + maybeTriggerCommanderRecruitment (weiterer Monolog)
  await p(ctx).waitForTimeout(600);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(500);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  const waldtrollKilled = await p(ctx).evaluate(() => !!gameFlags.waldtrollKilled);
  assert(ctx, waldtrollKilled, 'waldtrollKilled gesetzt');

  const commanderShown = await p(ctx).evaluate(() => !!gameFlags.commanderRecruitmentShown);
  ok(ctx, `commanderRecruitmentShown = ${commanderShown}`);

  wlog(ctx, {
    action:        'milestone',
    description:   'Waldtroll besiegt → Kommandant Roswald hat das Gerücht gehört',
    playerTimeSec: 0,
  });

  await screenshot(ctx, 'k2_nach_waldtroll');
  endPhase(ctx, 'Phase 8');
}

// ── Phase 9: Konfrontation → Kapitel-2-Sieg (storyState 20200) ───────────────

async function phase9_confrontation(ctx) {
  startPhase(ctx, 'Phase 9: Konfrontation + Kapitel-2-Sieg');
  await syncSection(ctx);

  // Abend setzen falls noch nicht
  const s0 = await getState(ctx);
  if (s0.hour < 20) {
    await p(ctx).evaluate(() => { gameClock.hour = 22; render(); });
  }

  await navigateTo(ctx, 'taverne');

  // Voraussetzungen prüfen
  const canConfront = await p(ctx).evaluate(() =>
    quests.theftInvestigation.state === 'brakka_consulted' &&
    gameFlags.waldtrollKilled &&
    getStrengthLevel(strength.xp) >= 3
  );
  assert(ctx, canConfront, 'Konfrontations-Bedingungen erfüllt (Quest=BRAKKA_CONSULTED, waldtrollKilled, Stärke≥3)');

  await p(ctx).evaluate(() => openNpcDialog('fremder'));
  await p(ctx).waitForTimeout(150);
  assert(ctx, await isDialogOpen(ctx), 'Fremder-Dialog offen');

  // confrontation: 6 Textseiten + Option [0] "Und das Gold...?" → confrontationEnd
  // confrontationEnd: 2 Textseiten + Option [0] "Ich lasse ihn gehen." → action → Story 2.6
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);
  await p(ctx).waitForTimeout(400);
  // Story 2.6 dialog (falls noch nicht durch clearAllDialogs geschlossen)
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);

  // Nach Story 2.6: onClose-Callback → setTimeout(triggerChapter2Victory, 800)
  // triggerChapter2Victory → Story 2.7 → callback → storyState=20200 → Victory-Dialog
  await p(ctx).waitForTimeout(1400);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);  // Story 2.7
  await p(ctx).waitForTimeout(600);
  if (await isDialogOpen(ctx)) await clearAllDialogs(ctx);  // Victory-Dialog

  const s = await syncSection(ctx);
  assert(ctx, s.storyState === 20200, `Kapitel 2 abgeschlossen: storyState = 20200 (ist: ${s.storyState})`);

  const questFinal = await p(ctx).evaluate(() => quests.theftInvestigation.state);
  assert(ctx, questFinal === 'rewarded', `theftInvestigation = rewarded (ist: ${questFinal})`);

  const ch2Complete = await p(ctx).evaluate(() => !!gameFlags.chapter2Complete);
  assert(ctx, ch2Complete, 'chapter2Complete = true');

  wlog(ctx, {
    action:        'npc',
    npc:           'Ein zwielichtiger Mann',
    topic:         'Konfrontation: Die Wahrheit ans Licht gebracht',
    playerTimeSec: PLAYER_TIME.npcDialogSec,
  });
  wlog(ctx, {
    action:        'milestone',
    description:   '🏆 Kapitel 2 abgeschlossen! storyState=20200',
    playerTimeSec: 0,
  });

  await screenshot(ctx, 'k2_sieg');
  endPhase(ctx, 'Phase 9');
}

// ── Phase 10: Abschluss-Checks ────────────────────────────────────────────────

async function phase10_finalChecks(ctx) {
  startPhase(ctx, 'Phase 10: Abschluss-Checks');

  const s = await getState(ctx);
  assert(ctx, s.storyState === 20200, `Finale storyState = 20200 (ist: ${s.storyState})`);

  await navigateTo(ctx, 'quests', { log: false });
  await checkUIObstruction(ctx, 'Quests nach Kap 2');

  await navigateTo(ctx, 'statistiken', { log: false });
  await checkUIObstruction(ctx, 'Statistiken');

  await navigateTo(ctx, 'geschichte', { log: false });
  await checkUIObstruction(ctx, 'Geschichte');

  await screenshot(ctx, 'k2_abschluss');

  endPhase(ctx, 'Phase 10');
}

// ── Exports ───────────────────────────────────────────────────────────────────

const phases = {
  setup:                phase1_setup,
  guildRegistration:    phase2_guildRegistration,
  firstHunt:            phase3_firstHunt,
  korbinQuest:          phase4_korbinQuest,
  coinClue:             phase5_coinClue,
  miraDetective:        phase6_miraDetective,
  brakkaReveal:         phase7_brakkaReveal,
  waldtrollAndStrength: phase8_waldtrollAndStrength,
  confrontation:        phase9_confrontation,
  finalChecks:          phase10_finalChecks,
};

const PHASE_ORDER = [
  { name: 'Phase 1 — Setup',             key: 'setup',                fixture: null },
  { name: 'Phase 2 — Gilden-Reg.',       key: 'guildRegistration',    fixture: FIXTURES.postGuild },
  { name: 'Phase 3 — Erster Kill',       key: 'firstHunt',            fixture: null },
  { name: 'Phase 4 — Korbin-Quest',      key: 'korbinQuest',          fixture: null },
  { name: 'Phase 5 — Münzfund',          key: 'coinClue',             fixture: FIXTURES.postInvestigation },
  { name: 'Phase 6 — Mira Detective',    key: 'miraDetective',        fixture: null },
  { name: 'Phase 7 — Brakka Enthüllt',   key: 'brakkaReveal',         fixture: null },
  { name: 'Phase 8 — Waldtroll',         key: 'waldtrollAndStrength', fixture: null },
  { name: 'Phase 9 — Konfrontation',     key: 'confrontation',        fixture: null },
  { name: 'Phase 10 — Abschluss',        key: 'finalChecks',          fixture: null },
];

module.exports = { phases, PHASE_ORDER, SECTIONS, FIXTURES, CHAPTER_TITLE };
