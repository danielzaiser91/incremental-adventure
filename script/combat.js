/* ══════════════════════════════════════════════════════════════
   combat.js — Kapitel 2: Kampfsystem, Stärke-Progression, Jagdgebiet
   Greift auf state.js (playerStats, strength, mut, combat, zeitkristalle)
   zu. Alle UI-Funktionen schreiben in ein übergebenes `el` — kein
   direktes DOM-Zugriff außerhalb von render()-Aufrufen.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Monster-Definitionen ─────────────────────────────────────
   `damage` ist ein [min, max]-Bereich; `goldReward` ebenfalls.
   `mutReward`: wie viel Mut-Prestige-Währung ein Sieg bringt. */
const MONSTER_DEFS = [
  {
    id: 'wolf', name: 'Hungriger Wolf', icon: '🐺', zone: 'wald',
    maxHp: 12, damage: [3, 6], xpReward: 3, goldReward: [3, 7], mutReward: 0,
    desc: 'Ein magerer Wolf, der mich mit gelben Augen fixiert. Hungrig. Gefährlich.'
  },
  {
    id: 'wildschwein', name: 'Wilder Eber', icon: '🐗', zone: 'wald',
    maxHp: 20, damage: [4, 8], xpReward: 6, goldReward: [6, 12], mutReward: 0,
    desc: 'Ein massiver Eber mit scharfen Hauern. Schneller als er aussieht.'
  },
  {
    id: 'baer', name: 'Schwarzbär', icon: '🐻', zone: 'wald',
    maxHp: 35, damage: [7, 13], xpReward: 12, goldReward: [10, 18], mutReward: 0,
    desc: 'Ein breiter Bär, doppelt so groß wie ich erwartet hatte. Sein Blick ist schwer und ruhig.'
  },
  {
    id: 'bandit', name: 'Wegelagerer', icon: '🗡️', zone: 'wald',
    maxHp: 18, damage: [4, 8], xpReward: 8, goldReward: [5, 12], mutReward: 0,
    desc: 'Ein schlecht gekleideter Mann mit einem rostigen Messer. Er wirkt hungrig — und verzweifelt.'
  },
  {
    id: 'waldtroll', name: 'Waldtroll', icon: '👹', zone: 'tief',
    maxHp: 60, damage: [10, 18], xpReward: 25, goldReward: [18, 30], mutReward: 1,
    desc: 'Ein graues, schwerfälliges Wesen aus Moos und Fels — langsam, aber wenn er trifft, spüre ich es noch Tage später.'
  },
  {
    id: 'sumpfwesen', name: 'Sumpfwesen', icon: '🐊', zone: 'tief',
    maxHp: 32, damage: [5, 11], xpReward: 11, goldReward: [8, 16], mutReward: 0,
    desc: 'Halb Tier, halb Schlamm. Riecht schlimmer als es aussieht — und es sieht bereits schrecklich aus.'
  },
  // ── Tier-2: Lethkar-Region (nur sichtbar wenn lethkarUnlocked)
  {
    id: 'steingolem', name: 'Steingolem', icon: '🗿', zone: 'lethkar_tief',
    maxHp: 80, damage: [12, 22], xpReward: 35, goldReward: [25, 40], mutReward: 1,
    tier: 2,
    desc: 'Uralt. Aus dem Fels gemeißelt oder aus ihm erwacht — ich kann es nicht sagen. Er bewegt sich langsam, aber unaufhaltsam.'
  },
  {
    id: 'schattenwolf', name: 'Schattenwolf', icon: '🐾', zone: 'lethkar_wald',
    maxHp: 55, damage: [15, 25], xpReward: 28, goldReward: [20, 35], mutReward: 0,
    tier: 2,
    desc: 'Schwarz wie Tinte, kaum sichtbar zwischen den Nordbäumen. Schnell. Sehr schnell.'
  },
  {
    id: 'nordbaer', name: 'Nordbär', icon: '🐻‍❄️', zone: 'lethkar_wald',
    maxHp: 100, damage: [14, 26], xpReward: 42, goldReward: [30, 50], mutReward: 2,
    tier: 2,
    desc: 'Größer als jeder Bär, den ich in Treutheim gesehen habe. Fellfarbe weiß-grau, fast silbern. Nicht angreifbar ohne Plan.'
  },
  {
    id: 'eisengolem', name: 'Eisengolem', icon: '🤖', zone: 'lethkar_tief',
    maxHp: 130, damage: [18, 30], xpReward: 55, goldReward: [35, 55], mutReward: 2,
    tier: 2,
    desc: 'Schwerer als Stein, kälter als Eisen. Bewegt sich wie ein Traum — so langsam, dass man glaubt, man hätte Zeit. Man hat sie nicht.'
  },
  {
    id: 'giftschlange', name: 'Riesengiftschlange', icon: '🐍', zone: 'lethkar_wald',
    maxHp: 70, damage: [20, 32], xpReward: 40, goldReward: [28, 45], mutReward: 1,
    tier: 2,
    desc: 'Länger als ich groß bin. Ihre Augen folgen mir, auch wenn ich mich nicht bewege.'
  },
  // ── Tier-3: Velmarks Unterwelt (nur sichtbar wenn velmarkUnlocked)
  {
    id: 'kanalratte', name: 'Kanalratte', icon: '🐀', zone: 'velmark_kanal',
    maxHp: 70, damage: [16, 26], xpReward: 30, goldReward: [40, 70], mutReward: 0, einflussReward: 1,
    tier: 3,
    desc: 'Klein, schnell, bissig — und sie kennt die Kanäle besser als ich. Unterschätzt wird sie nur einmal.'
  },
  {
    id: 'soeldner', name: 'Söldner des Netzwerks', icon: '⚔️', zone: 'velmark_kanal',
    maxHp: 120, damage: [20, 34], xpReward: 55, goldReward: [70, 110], mutReward: 1, einflussReward: 2,
    tier: 3,
    desc: 'Valdris\' Handlanger. Gut bezahlt, gut ausgerüstet. Redet nicht viel.'
  },
  {
    id: 'schattenkämpfer', name: 'Schattenkämpfer', icon: '🗡️', zone: 'velmark_schatten',
    maxHp: 160, damage: [24, 40], xpReward: 80, goldReward: [90, 140], mutReward: 2, einflussReward: 3,
    tier: 3,
    desc: 'Wer ihn schickt, bleibt unbekannt. Er hat keine Farben, keine Abzeichen — nur ein Messer und den Auftrag.'
  },
  {
    id: 'hafenwächter', name: 'Hafenwächter', icon: '🛡️', zone: 'velmark_hafen',
    maxHp: 100, damage: [18, 28], xpReward: 45, goldReward: [55, 85], mutReward: 1, einflussReward: 2,
    tier: 3,
    desc: 'Breit, ruhig, mit Augen, die alles registrieren. Harro\'s Mann. Redet nicht — bewegt sich einfach in den Weg.'
  },
  {
    id: 'valdrisAgent', name: 'Valdris\' Agent', icon: '🕵️', zone: 'velmark_schatten',
    maxHp: 200, damage: [30, 48], xpReward: 100, goldReward: [100, 160], mutReward: 2, einflussReward: 5,
    tier: 3,
    visibleWhen: () => gameFlags.valdrisDokumentGefunden,
    desc: 'Kein Name. Keine Farben. Nur der Auftrag. Ich weiß, dass er von Valdris persönlich geschickt wurde.'
  }
];

/* ── Stärke-Stufen ────────────────────────────────────────────
   `damageMult`: Faktor auf Spieler-Basisschaden (5–10).
   `maxHpBonus`: Extra-HP oben auf die Basis von 30.
   `defenseBonus`: Abzug von eingehendem Schaden (Minimum 0). */
const STRENGTH_LEVEL_THRESHOLDS = [0, 10, 30, 70, 150, 300];
const STRENGTH_LEVELS = [
  { label: 'Untrainiert',        damageMult: 1.0, maxHpBonus: 0,  defenseBonus: 0 },
  { label: 'Angehender Kämpfer', damageMult: 1.3, maxHpBonus: 8,  defenseBonus: 1 },
  { label: 'Geübter Kämpfer',    damageMult: 1.7, maxHpBonus: 15, defenseBonus: 2 },
  { label: 'Erfahrener Kämpfer', damageMult: 2.2, maxHpBonus: 25, defenseBonus: 4 },
  { label: 'Veteran',            damageMult: 3.0, maxHpBonus: 40, defenseBonus: 6 },
  { label: 'Kriegsmeister',      damageMult: 4.0, maxHpBonus: 60, defenseBonus: 9 }
];

/* ── Stärke-Hilfsfunktionen ───────────────────────────────── */

function getStrengthLevel(xp) {
  let level = 0;
  for (let i = 1; i < STRENGTH_LEVEL_THRESHOLDS.length; i++) {
    if (xp >= STRENGTH_LEVEL_THRESHOLDS[i]) level = i;
  }
  return level;
}

function getStrengthLevelData(xp) {
  return STRENGTH_LEVELS[getStrengthLevel(xp)];
}

function getStrengthLevelProgress(xp) {
  const level = getStrengthLevel(xp);
  const from  = STRENGTH_LEVEL_THRESHOLDS[level];
  const to    = STRENGTH_LEVEL_THRESHOLDS[level + 1];
  if (!to) return { level, pct: 100, into: xp - from, span: 0 };
  return { level, pct: Math.min(100, ((xp - from) / (to - from)) * 100), into: xp - from, span: to - from };
}

/** Berechnet den aktuellen MaxHP-Wert des Spielers. */
function getPlayerMaxHp() {
  const alchemieHp = typeof getAlchemieWasserMaxHp === 'function' ? getAlchemieWasserMaxHp() : 0;
  const rufHp = typeof getRufMaxHpBonus === 'function' ? getRufMaxHpBonus() : 0;
  return 30 + getStrengthLevelData(strength.xp).maxHpBonus + alchemieHp + rufHp;
}

/** Berechnet den Schaden, den der Spieler in einem Schlag macht. */
function rollPlayerDamage() {
  const data        = getStrengthLevelData(strength.xp);
  const base        = Math.floor(Math.random() * 6) + 5; // 5–10
  const alchemieMult = typeof getAlchemieFeuerschadenMult === 'function' ? getAlchemieFeuerschadenMult() : 1;
  const rufMult      = typeof getRufCombatDmgBonus === 'function' ? (1 + getRufCombatDmgBonus()) : 1;
  // Wolf-Welpe Bonus: fester Schadenszuwachs (via pets.js)
  const wolfBonus = typeof getWildPetCombatDamageBonus === 'function' ? getWildPetCombatDamageBonus() : 0;
  return Math.max(1, Math.round(base * data.damageMult * alchemieMult * rufMult) + wolfBonus);
}

/** Berechnet den Schaden, den ein Monster nach Abzug der Verteidigung macht. */
function rollEnemyDamage(monster) {
  const def  = getStrengthLevelData(strength.xp).defenseBonus;
  const raw  = Math.floor(Math.random() * (monster.damage[1] - monster.damage[0] + 1)) + monster.damage[0];
  return Math.max(1, raw - def);
}

/** Stärke-Level aktuell halten (nach XP-Gewinn prüfen). */
function maybeStrengthLevelUp() {
  const newLevel = getStrengthLevel(strength.xp);
  if (newLevel > strength.level) {
    strength.level = newLevel;
    const data = STRENGTH_LEVELS[newLevel];
    const newMaxHp = getPlayerMaxHp();
    playerStats.maxHp = newMaxHp;
    playerStats.hp    = Math.min(playerStats.hp + data.maxHpBonus, newMaxHp);
    showToast(`Stärke gestiegen: ${data.label}! Max-HP: ${newMaxHp}`, TOAST.EVENT);
  }
}

/* ── Kampf-Kernfunktionen ─────────────────────────────────── */

/** Startet einen Kampf gegen das gewählte Monster. */
function startCombat(monsterId) {
  if (combat.active) return;
  const monster = MONSTER_DEFS.find(m => m.id === monsterId);
  if (!monster) return;
  if (playerStats.hp <= 0) {
    showToast('Ich bin zu geschwächt, um zu kämpfen. Erst schlafen.', TOAST.ERROR);
    return;
  }

  playerStats.maxHp = getPlayerMaxHp();
  combat.active  = true;
  combat.enemyId = monsterId;
  combat.enemyHp = monster.maxHp;
  combat.log     = [`Ich begegne: ${monster.icon} ${monster.name} (${monster.maxHp} HP).`];

  // Tracking: erste Erkundung der tiefen Jagdzone (für Achievement)
  if ((monster.zone === 'tief' || monster.zone === 'lethkar_tief') && !gameFlags.deepHuntingUnlocked) {
    gameFlags.deepHuntingUnlocked = true;
  }

  render();
}

/** Spieler greift an — ein Kampfzug. */
function performAttack() {
  if (!combat.active) return;
  const monster = MONSTER_DEFS.find(m => m.id === combat.enemyId);

  const tier3Bonus = (monster.tier === 3 && typeof getWildPetTier3DmgBonus === 'function')
    ? getWildPetTier3DmgBonus() : 0;
  const playerDmg = Math.round(rollPlayerDamage() * (1 + tier3Bonus));
  combat.enemyHp = Math.max(0, combat.enemyHp - playerDmg);
  combat.log.unshift(`Ich schlage zu: −${playerDmg} HP (Gegner: ${combat.enemyHp}/${monster.maxHp}).`);
  playSfx('hit');

  if (combat.enemyHp <= 0) {
    endCombat(true, monster);
    return;
  }

  const enemyDmg = rollEnemyDamage(monster);
  playerStats.hp = Math.max(0, playerStats.hp - enemyDmg);
  combat.log.unshift(`${monster.icon} schlägt zurück: −${enemyDmg} HP (Ich: ${playerStats.hp}/${playerStats.maxHp}).`);

  if (playerStats.hp <= 0) {
    endCombat(false, monster);
    return;
  }

  render();
}

/** Spieler flieht aus dem Kampf (50% Erfolgschance). */
function performFlee() {
  if (!combat.active) return;
  const monster = MONSTER_DEFS.find(m => m.id === combat.enemyId);

  if (Math.random() < 0.5) {
    combat.active = false;
    combat.log    = [];
    showToast('Ich entkamm dem Kampf mit knapper Not.', TOAST.INFO);
  } else {
    const enemyDmg = rollEnemyDamage(monster);
    playerStats.hp = Math.max(0, playerStats.hp - enemyDmg);
    combat.log.unshift(`Flucht misslungen! ${monster.icon} trifft mich beim Fliehen: −${enemyDmg} HP.`);
    playSfx('miss');
    if (playerStats.hp <= 0) { endCombat(false, monster); return; }
  }

  render();
}

/** Beendet den Kampf, verteilt Belohnungen oder Strafe. */
function endCombat(won, monster) {
  combat.active = false;

  if (won) {
    const gold = Math.floor(Math.random() * (monster.goldReward[1] - monster.goldReward[0] + 1)) + monster.goldReward[0];
    resources.gold += gold;
    resources.totalGoldEarned += gold;
    strength.xp += monster.xpReward;
    killStats.total += 1;
    maybeStrengthLevelUp();

    // First-Kill-Tracking für Achievements
    if (!gameFlags.firstTier2Kill && monster.tier === 2) {
      gameFlags.firstTier2Kill = true;
    }
    if (!gameFlags.firstTier3Kill && monster.tier === 3) {
      gameFlags.firstTier3Kill = true;
    }

    // Waldtroll-Flag setzen → persönlicher Moment → dann Roswald
    if (monster.id === 'waldtroll' && !gameFlags.waldtrollKilled) {
      gameFlags.waldtrollKilled = true;
      render();
      setTimeout(() => {
        showMonologue('Das war der Waldtroll', [
          'Er ist tot. Ich bin nicht tot. Das fühlt sich bedeutsamer an, als ich erwartet hatte.',
          'Ich stehe noch hier. Meine Hände zittern ein bisschen. Das ist normal, glaube ich.',
          'Ich glaube, das ist das Schwerste, was ich je getan habe. Und ich möchte Schwereres.'
        ], () => maybeTriggerCommanderRecruitment(() => {}));
      }, 400);
    }

    // Wolf-Welpe: seltener Drop nach Waldtroll-Kill (10% Chance)
    if (monster.id === 'waldtroll' && !pets.wolfWelpe && Math.random() < 0.10) {
      pets.wolfWelpe = { level: 0 };
      showToast('Ein Wolf-Welpe folgt mir aus dem Wald... 🐺', TOAST.EVENT);
      navUnseen.pets = true;
    }

    // Wasser-Aspekt Level 3: HP-Regen nach Kampfsieg
    const waterRegen = typeof getAlchemieWasserHpRegen === 'function' ? getAlchemieWasserHpRegen() : 0;
    if (waterRegen > 0) {
      playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + waterRegen);
    }

    let msg = `Sieg! +${gold} Gold, +${monster.xpReward} Stärke-XP.`;
    if (waterRegen > 0) msg += ` +${waterRegen} HP (Wasser).`;

    if (monster.mutReward > 0) {
      mut.points      += monster.mutReward;
      mut.totalEarned += monster.mutReward;
      msg += ` +${monster.mutReward} Mut ⚔.`;
    }

    if (monster.einflussReward > 0 && typeof einfluss !== 'undefined') {
      einfluss.points      = (einfluss.points || 0) + monster.einflussReward;
      einfluss.totalEarned = (einfluss.totalEarned || 0) + monster.einflussReward;
      msg += ` +${monster.einflussReward} Einfluss ⚜.`;
    }

    if (Math.random() < 0.1) {
      zeitkristalle += 1;
      if (!gameFlags.automationDiscovered) {
        gameFlags.automationDiscovered = true;
        navUnseen.automation = true;
      }
      msg += ' Du findest einen Zeitkristall! ⌛';
    }

    // Tier-Drop-Logic (nur wenn Greta-Quest abgeschlossen + kein Tier dieser Art bereits)
    if (gameFlags.kapitel2Unlocked && quests.kraemerinBusiness.state === QUEST_STATE.REWARDED) {
      const rufBonus = typeof getRufTier2DropBonus === 'function' && monster.tier === 2 ? getRufTier2DropBonus() : 0;
      const alreadyHas = type => wildPets.some(p => p.type === type);
      const dropTable = [];
      if (!alreadyHas('hund'))          dropTable.push({ item: 'hundespur',         chance: (monster.zone === 'tief' ? 0.06 : 0.03) * (1 + rufBonus) });
      if (!alreadyHas('rabe'))          dropTable.push({ item: 'rabenfeder',        chance: (monster.zone === 'tief' ? 0.05 : 0.02) * (1 + rufBonus) });
      if (!alreadyHas('hase'))          dropTable.push({ item: 'hasenspur',         chance: (monster.zone === 'wald' ? 0.05 : 0.02) * (1 + rufBonus) });
      if (!alreadyHas('eichhoernchen')) dropTable.push({ item: 'eichhoernchennuss', chance: (monster.zone === 'wald' ? 0.05 : 0.02) * (1 + rufBonus) });
      for (const entry of dropTable) {
        if (Math.random() < entry.chance) {
          questItems[entry.item] = (questItems[entry.item] || 0) + 1;
          showToast(`Du findest: ${QUEST_ITEMS.find(qi => qi.id === entry.item)?.name}. Greta wüsste damit etwas anzufangen.`, TOAST.EVENT);
          navUnseen.inventar = true;
          break; // max. 1 Tier-Drop pro Kampf
        }
      }
    }

    combat.log.unshift(msg);
    showToast(msg, TOAST.REWARD);
    playSfx('victory');

    // Story-Fortschritt nach erstem Kill (storyState 20101)
    if (!gameFlags.firstJagdgebietKill) {
      gameFlags.firstJagdgebietKill = true;
      storyState = 20101;
      render();
      maybeShowStoryDialog('2.1');
    }

    // Münzfund-Event: nach 5+ Kills im Jagdgebiet → Detektivquest vorantreiben
    if (killStats.total >= 5 && quests.theftInvestigation.state === QUEST_STATE.ACTIVE &&
        !gameFlags.theftClueFoundInJagdgebiet) {
      gameFlags.theftClueFoundInJagdgebiet = true;
      quests.theftInvestigation.state = QUEST_STATE.INVESTIGATING;
      storyState = 20103;
      render();
      setTimeout(() => {
        showMonologue('Ein Fund', [
          'Zwischen den Habseligkeiten des besiegten Räubers finde ich etwas Vertrautes.',
          'Eine Münze — mit dem eingestanzten Kratzer, den ich selbst einmal durch einen Sturz verursacht habe. Meine Münze.',
          'Das ist kein Zufall.'
        ], () => { maybeShowStoryDialog('2.3'); });
      }, 400);
    }
  } else {
    const goldLost = Math.floor(resources.gold * 0.2);
    resources.gold = Math.max(0, resources.gold - goldLost);
    playerStats.hp = 1;
    const msg = `Besiegt — ich schleiche mich davon. ${goldLost > 0 ? `−${goldLost} Gold.` : ''}`;
    combat.log.unshift(msg);
    showToast(msg, TOAST.ERROR);
    playSfx('defeat');

    if (!gameFlags.firstCombatDefeated) {
      gameFlags.firstCombatDefeated = true;
      render();
      setTimeout(() => {
        showMonologue('Der Boden ist härter als erwartet', [
          'Ich liege auf dem Rücken und starre in die Baumwipfel. Ich weiß nicht genau, wie ich dorthin gekommen bin.',
          goldLost > 0
            ? `Mein Beutel ist leichter. ${goldLost} Gold weg — bezahlt an das Jagdgebiet, ob ich will oder nicht.`
            : 'Wenigstens mein Gold ist noch da.',
          'Das nächste Mal bin ich vorbereitet. Oder zumindest schneller beim Weglaufen.'
        ]);
      }, 400);
    }
  }

  render();
}

/* ── Render-Funktionen ────────────────────────────────────── */

/** Jagdgebiet-Seite: Übersicht der Monster und Spieler-Stats. */
function renderJagdgebiet(el) {
  const lvlData  = getStrengthLevelData(strength.xp);
  const progress = getStrengthLevelProgress(strength.xp);
  const hpColor  = playerStats.hp > playerStats.maxHp * 0.4 ? '' : 'style="color:var(--accent)"';

  if (combat.active) {
    renderKampf(el);
    return;
  }

  const visibleMonsters = MONSTER_DEFS.filter(m => {
    if (m.visibleWhen && !m.visibleWhen()) return false;
    if (!m.tier) return true;
    if (m.tier === 2) return gameFlags.lethkarUnlocked;
    if (m.tier === 3) return gameFlags.velmarkUnlocked;
    return false;
  });
  const monsterCards = visibleMonsters.map(m => {
    const isDeep    = m.zone === 'tief' || m.zone === 'lethkar_tief';
    const blocked   = isDeep && getStrengthLevel(strength.xp) < 2;
    const blockNote = blocked ? '<div class="hunt-blocked">Erfordert Stärke-Stufe 2.</div>' : '';
    const btnAttr   = blocked ? 'disabled' : `onclick="startCombat('${m.id}')"`;

    return `
      <div class="monster-card ${blocked ? 'monster-locked' : ''}">
        <div class="monster-icon">${m.icon}</div>
        <div class="monster-info">
          <div class="monster-name">${m.name}</div>
          <div class="monster-desc">${m.desc}</div>
          <div class="monster-stats">
            HP: ${m.maxHp} · Schaden: ${m.damage[0]}–${m.damage[1]}
            · XP: ${m.xpReward} · Gold: ${m.goldReward[0]}–${m.goldReward[1]}
            ${m.mutReward > 0 ? ` · Mut: ${m.mutReward}` : ''}
          </div>
          ${blockNote}
        </div>
        <button class="action-btn hunt-btn" ${btnAttr}>Jagen</button>
      </div>
    `;
  }).join('');  // monster cards end

  const progressBar = progress.span > 0
    ? `<div class="strength-progress-bar"><div class="strength-progress-fill" style="width:${progress.pct.toFixed(1)}%"></div></div>
       <div class="strength-progress-label">${progress.into}/${progress.span} XP bis zur nächsten Stufe</div>`
    : `<div class="strength-progress-label">Höchste Stufe erreicht!</div>`;

  el.innerHTML = `
    <div class="feature-stage-label">Das Jagdgebiet</div>

    <div class="hunt-player-card">
      <div class="hunt-player-row">
        <span class="hunt-label">Lebenspunkte</span>
        <span class="hunt-value" ${hpColor}>${playerStats.hp} / ${playerStats.maxHp} HP</span>
      </div>
      <div class="hunt-hp-bar">
        <div class="hunt-hp-fill" style="width:${Math.round(playerStats.hp / playerStats.maxHp * 100)}%"></div>
      </div>
      <div class="hunt-player-row">
        <span class="hunt-label">Stärke-Stufe</span>
        <span class="hunt-value">${lvlData.label} (Lvl ${progress.level})</span>
      </div>
      ${progressBar}
      <div class="hunt-player-row" style="margin-top:6px">
        <span class="hunt-label">Mut</span>
        <span class="hunt-value">${mut.points} ⚔</span>
      </div>
    </div>

    <div class="hunt-info-text">
      Schlafen stellt meine Lebenspunkte wieder her. Im Kampf besiegt zu werden kostet 20 % meines Goldes.
    </div>

    <div class="hunt-monster-list">
      ${monsterCards}
    </div>
  `;
}

/** Kampf-Seite: aktiver Kampf gegen ein Monster. */
function renderKampf(el) {
  if (!combat.active) { renderJagdgebiet(el); return; }
  const monster = MONSTER_DEFS.find(m => m.id === combat.enemyId);

  const hpPct      = Math.round(playerStats.hp / playerStats.maxHp * 100);
  const enemyHpPct = Math.round(combat.enemyHp / monster.maxHp * 100);
  const logHtml    = combat.log.slice(0, 6).map(t => `<div class="combat-log-line">${t}</div>`).join('');

  el.innerHTML = `
    <div class="feature-stage-label">Kampf</div>

    <div class="combat-screen">
      <div class="combat-combatants">
        <div class="combat-side">
          <div class="combat-fighter-label">Ich</div>
          <div class="combat-hp-bar">
            <div class="combat-hp-fill combat-hp-player" style="width:${hpPct}%"></div>
          </div>
          <div class="combat-hp-text">${playerStats.hp} / ${playerStats.maxHp} HP</div>
        </div>
        <div class="combat-vs">VS</div>
        <div class="combat-side">
          <div class="combat-fighter-label">${monster.icon} ${monster.name}</div>
          <div class="combat-hp-bar">
            <div class="combat-hp-fill combat-hp-enemy" style="width:${enemyHpPct}%"></div>
          </div>
          <div class="combat-hp-text">${combat.enemyHp} / ${monster.maxHp} HP</div>
        </div>
      </div>

      <div class="combat-log">${logHtml}</div>

      <div class="combat-actions">
        <button class="action-btn combat-attack-btn" onclick="performAttack()">⚔ Angreifen</button>
        <button class="action-btn combat-flee-btn" onclick="performFlee()">🏃 Fliehen</button>
      </div>
    </div>
  `;
}

/** HP nach dem Schlafen anteilig zur Schlafqualität wiederherstellen.
    Wird aus finishSleep() (actions.js) aufgerufen, BEVOR startNewDay(). */
function restoreHpFromSleep(option) {
  const factor  = getSleepQualityFactor(option);
  const missing = playerStats.maxHp - playerStats.hp;
  playerStats.hp = Math.min(playerStats.maxHp, Math.round(playerStats.hp + missing * factor));
}
