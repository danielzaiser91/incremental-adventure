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
    id: 'waldtroll', name: 'Waldtroll', icon: '👹', zone: 'tief',
    maxHp: 60, damage: [10, 18], xpReward: 25, goldReward: [18, 30], mutReward: 1,
    desc: 'Ein graues, schwerfälliges Wesen aus Moos und Fels — langsam, aber wenn er trifft, spüre ich es noch Tage später.'
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
  return 30 + getStrengthLevelData(strength.xp).maxHpBonus;
}

/** Berechnet den Schaden, den der Spieler in einem Schlag macht. */
function rollPlayerDamage() {
  const data = getStrengthLevelData(strength.xp);
  const base = Math.floor(Math.random() * 6) + 5; // 5–10
  return Math.max(1, Math.round(base * data.damageMult));
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
    showToast(`Stärke gestiegen: ${data.label}! Max-HP: ${newMaxHp}`, 'event');
  }
}

/* ── Kampf-Kernfunktionen ─────────────────────────────────── */

/** Startet einen Kampf gegen das gewählte Monster. */
function startCombat(monsterId) {
  if (combat.active) return;
  const monster = MONSTER_DEFS.find(m => m.id === monsterId);
  if (!monster) return;
  if (playerStats.hp <= 0) {
    showToast('Ich bin zu geschwächt, um zu kämpfen. Erst schlafen.', 'error');
    return;
  }

  playerStats.maxHp = getPlayerMaxHp();
  combat.active  = true;
  combat.enemyId = monsterId;
  combat.enemyHp = monster.maxHp;
  combat.log     = [`Du begegnest: ${monster.icon} ${monster.name} (${monster.maxHp} HP).`];

  render();
}

/** Spieler greift an — ein Kampfzug. */
function performAttack() {
  if (!combat.active) return;
  const monster = MONSTER_DEFS.find(m => m.id === combat.enemyId);

  const playerDmg = rollPlayerDamage();
  combat.enemyHp = Math.max(0, combat.enemyHp - playerDmg);
  combat.log.unshift(`Du schlägst zu: −${playerDmg} HP (Gegner: ${combat.enemyHp}/${monster.maxHp}).`);

  if (combat.enemyHp <= 0) {
    endCombat(true, monster);
    return;
  }

  const enemyDmg = rollEnemyDamage(monster);
  playerStats.hp = Math.max(0, playerStats.hp - enemyDmg);
  combat.log.unshift(`${monster.icon} schlägt zurück: −${enemyDmg} HP (Du: ${playerStats.hp}/${playerStats.maxHp}).`);

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
    showToast('Du entkommen dem Kampf mit knapper Not.', 'info');
  } else {
    const enemyDmg = rollEnemyDamage(monster);
    playerStats.hp = Math.max(0, playerStats.hp - enemyDmg);
    combat.log.unshift(`Flucht misslungen! ${monster.icon} trifft dich beim Fliehen: −${enemyDmg} HP.`);
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

    // Waldtroll-Flag setzen + Roswald-Monolog auslösen
    if (monster.id === 'waldtroll' && !gameFlags.waldtrollKilled) {
      gameFlags.waldtrollKilled = true;
      maybeTriggerCommanderRecruitment(() => {});
    }

    let msg = `Sieg! +${gold} Gold, +${monster.xpReward} Stärke-XP.`;

    if (monster.mutReward > 0) {
      mut.points      += monster.mutReward;
      mut.totalEarned += monster.mutReward;
      msg += ` +${monster.mutReward} Mut.`;
    }

    if (Math.random() < 0.1) {
      zeitkristalle += 1;
      if (!gameFlags.automationDiscovered) {
        gameFlags.automationDiscovered = true;
        navUnseen.automation = true;
      }
      msg += ' Du findest einen Zeitkristall! ⌛';
    }

    combat.log.unshift(msg);
    showToast(msg, 'reward');

    // Story-Fortschritt nach erstem Kill (storyState 20101)
    if (!gameFlags.firstJagdgebietKill) {
      gameFlags.firstJagdgebietKill = true;
      storyState = 20101;
      render();
      maybeShowStoryDialog('2.1');
    }

    // Münzfund-Event: nach 5+ Kills im Jagdgebiet → Detektivquest vorantreiben
    if (killStats.total >= 5 && quests.theftInvestigation.state === 'active' &&
        !gameFlags.theftClueFoundInJagdgebiet) {
      gameFlags.theftClueFoundInJagdgebiet = true;
      quests.theftInvestigation.state = 'investigating';
      storyState = 20103;
      navUnseen.taverne = true; // Mira hat eine Botschaft
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
    const msg = `Du wirst besiegt und schleichst dich davon. ${goldLost > 0 ? `−${goldLost} Gold.` : ''}`;
    combat.log.unshift(msg);
    showToast(msg, 'error');
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

  const monsterCards = MONSTER_DEFS.map(m => {
    const isDeep    = m.zone === 'tief';
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
  }).join('');

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
      Schlafen stellt deine Lebenspunkte wieder her. Im Kampf besiegt zu werden kostet 20 % deines Goldes.
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
