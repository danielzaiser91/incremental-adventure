/* ══════════════════════════════════════════════════════════════
   alchemie.js — Alchemie-System (Kapitel 3, Lethkar)

   5 Aspekte: Feuer, Wasser, Erde, Luft, Äther.
   Fortschritt: 1 Punkt/Sekunde (Echtzeit, setInterval).
   Kosten pro Level-Up: 3^level * 100 Punkte.
   Einsicht-Generierung: pro Level-Up gibt es 1 Einsicht-Punkt.
   Offline-Aufholen: max. 4 Stunden.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const WISSENSDURST_SKILLS = [
  {
    id: 'forschungsinstinkt', name: 'Forschungsinstinkt', icon: '🔍',
    cost: 1, requires: null,
    desc: 'Wissen zieht weiteres Wissen an.',
    effect: 'Alle Alchemie-Aspekte steigen 25% schneller.'
  },
  {
    id: 'wissensspeicher', name: 'Wissensspeicher', icon: '📚',
    cost: 2, requires: null,
    desc: 'Manche Erkenntnisse brennen sich ein — für immer.',
    effect: 'Wissensdurst bleibt bei einem Neuanfang erhalten.'
  },
  {
    id: 'doppelteErkenntnis', name: 'Doppelte Erkenntnis', icon: '✨',
    cost: 3, requires: 'forschungsinstinkt',
    desc: 'Ein Level-Up bringt oft mehr mit sich als gedacht.',
    effect: 'Jeder Aspekt-Level-Up gibt +1 zusätzlichen Wissensdurst.'
  },
  {
    id: 'aspektmeister', name: 'Aspektmeister', icon: '🌊',
    cost: 5, requires: 'forschungsinstinkt',
    desc: 'Wenn man erst versteht, wie Wissen fließt, fließt es schneller.',
    effect: 'Aspekte steigen nochmals 2× schneller (stapelt mit Forschungsinstinkt).'
  },
  {
    id: 'alchemistischesGedaechtnis', name: 'Alch. Gedächtnis', icon: '🧠',
    cost: 4, requires: 'wissensspeicher',
    desc: 'Der Körper vergisst. Das Wissen nicht.',
    effect: '50% des Aspekt-Levels bleibt bei einem Neuanfang erhalten.'
  }
];

function alchemieSpeedMultiplier() {
  let m = 1;
  if (wissensdurstSkills.forschungsinstinkt) m *= 1.25;
  if (wissensdurstSkills.aspektmeister)      m *= 2;
  if (meta.alchemieWerkzeug)                 m *= 1.5;
  return m;
}

function buyWissensdurstSkill(id) {
  const skill = WISSENSDURST_SKILLS.find(s => s.id === id);
  if (!skill || wissensdurstSkills[id]) return;
  if (skill.requires && !wissensdurstSkills[skill.requires]) return;
  if (einsicht.points < skill.cost) return;
  einsicht.points -= skill.cost;
  wissensdurstSkills[id] = true;
  showToast(`Fähigkeit erlernt: ${skill.name}`, TOAST.REWARD);
  render();
}

const ALCHEMIE_ASPECTS = [
  { id: 'feuer',  name: 'Feuer',  icon: '🔥', desc: 'Transformation, Zerstörung, Reinigung.' },
  { id: 'wasser', name: 'Wasser', icon: '💧', desc: 'Fluss, Anpassung, Heilung.' },
  { id: 'erde',   name: 'Erde',   icon: '🪨', desc: 'Beständigkeit, Geduld, Grundlage.' },
  { id: 'luft',   name: 'Luft',   icon: '💨', desc: 'Bewegung, Freiheit, Verbindung.' },
  { id: 'aether', name: 'Äther',  icon: '✨', desc: 'Das Fünfte Element. Verbindet alle anderen — schwer zu greifen.' }
];

/* Spielwirksame Meilensteine je Aspekt — freigeschaltet beim Erreichen des
   angegebenen Levels. Jeder Eintrag trägt desc (für die UI) und bonus
   (Slug, den die jeweilige Spielfunktion prüft). */
const ALCHEMIE_MILESTONES = {
  feuer:  [
    { level: 1, desc: '+10 % Kampf-Schaden',             bonus: 'feuer1' },
    { level: 3, desc: '+25 % Kampf-Schaden (gesamt)',     bonus: 'feuer3' }
  ],
  wasser: [
    { level: 1, desc: '+10 Max-HP',                       bonus: 'wasser1' },
    { level: 3, desc: '+8 HP-Regen nach jedem Kampfsieg', bonus: 'wasser3' }
  ],
  erde:   [
    { level: 1, desc: '+1 Rohstoff je Sammelaktion',      bonus: 'erde1' },
    { level: 3, desc: '+3 Rohstoffe gesamt (+2 extra)',   bonus: 'erde3' }
  ],
  luft:   [
    { level: 1, desc: '+1 Gold je Feldarbeit',            bonus: 'luft1' },
    { level: 3, desc: '+2 Gold zusätzlich (gesamt +3)',   bonus: 'luft3' }
  ],
  aether: [
    { level: 1, desc: '+1 extra Wissensdurst je Level-Up', bonus: 'aether1' },
    { level: 3, desc: 'EP-Neuanfang gibt +1 Wissensdurst', bonus: 'aether3' }
  ]
};

/* ── Getter-Funktionen — werden von anderen Dateien aufgerufen ───────────── */

/** Bonus-Goldmultiplikator aus Luft-Aspekt (flacher Bonus, kein Mult). */
function getAlchemieLuftGoldBonus() {
  if (!alchemie.unlocked) return 0;
  const lvl = alchemie.levels.luft;
  if (lvl >= 3) return 3;
  if (lvl >= 1) return 1;
  return 0;
}

/** Bonus-Rohstoffe je Sammelaktion aus Erde-Aspekt. */
function getAlchemieErdeRohstoffBonus() {
  if (!alchemie.unlocked) return 0;
  const lvl = alchemie.levels.erde;
  if (lvl >= 3) return 3;
  if (lvl >= 1) return 1;
  return 0;
}

/** Bonus-MaxHP aus Wasser-Aspekt. */
function getAlchemieWasserMaxHp() {
  if (!alchemie.unlocked) return 0;
  return alchemie.levels.wasser >= 1 ? 10 : 0;
}

/** HP-Regen nach Kampfsieg aus Wasser-Aspekt (Level 3). */
function getAlchemieWasserHpRegen() {
  if (!alchemie.unlocked) return 0;
  return alchemie.levels.wasser >= 3 ? 8 : 0;
}

/** Multiplikator auf Kampf-Schaden aus Feuer-Aspekt. */
function getAlchemieFeuerschadenMult() {
  if (!alchemie.unlocked) return 1;
  const lvl = alchemie.levels.feuer;
  if (lvl >= 3) return 1.35;
  if (lvl >= 1) return 1.10;
  return 1;
}

/** Extra Wissensdurst je Alchemie-Level-Up aus Äther-Aspekt (Level 1). */
function getAlchemieAetherLevelUpBonus() {
  if (!alchemie.unlocked) return 0;
  return alchemie.levels.aether >= 1 ? 1 : 0;
}

/** Liefert true wenn Äther Level 3 — EP-Reset gibt +1 Wissensdurst. */
function alchemieAetherResetBonus() {
  return alchemie.unlocked && alchemie.levels.aether >= 3;
}

/** Berufsstufe basierend auf Summe aller Aspekt-Levels. */
function getAlchemieBerufsstufe() {
  const total = Object.values(alchemie.levels).reduce((s, v) => s + v, 0);
  if (total >= 25) return 'Großmeister';
  if (total >= 20) return 'Meister';
  if (total >= 15) return 'Experte';
  if (total >= 10) return 'Geselle';
  if (total >= 5)  return 'Lehrling';
  return 'Novize';
}

function alchemieThreshold(level) {
  return Math.pow(3, level) * 100;
}

let alchemieInterval   = null;
let _alchemieSfxTick   = 0; // Gedrosselt: SFX nur alle 5 Sekunden

function startAlchemieTick() {
  if (alchemieInterval) return;
  alchemieInterval = setInterval(() => {
    if (!alchemie.unlocked) return;
    tickAlchemie(1);
    // Gedrosselter Alchemie-SFX (nur alle 5 Sekunden, nicht jeden Frame)
    _alchemieSfxTick = (_alchemieSfxTick + 1) % 5;
    if (_alchemieSfxTick === 0 && currentContent === CONTENT.ALCHEMIE) playSfx('alchemy');
    // Render nur wenn Alchemie-Tab gerade offen
    if (currentContent === CONTENT.ALCHEMIE) render();
  }, 1000);
}

function tickAlchemie(seconds) {
  if (!alchemie.unlocked) return;
  const now = Date.now();
  alchemie.lastTick = now;

  const speedMult  = alchemieSpeedMultiplier();
  const wdBase     = 1 + (wissensdurstSkills.doppelteErkenntnis ? 1 : 0);
  for (const aspect of ALCHEMIE_ASPECTS) {
    const id = aspect.id;
    alchemie.progress[id] += seconds * speedMult;
    let threshold = alchemieThreshold(alchemie.levels[id]);
    while (alchemie.progress[id] >= threshold) {
      alchemie.progress[id] -= threshold;
      alchemie.levels[id]   += 1;
      const newLevel = alchemie.levels[id];

      // Äther Level 1: jeder Level-Up (egal welcher Aspekt) gibt +1 extra Wissensdurst
      const aetherBonus  = getAlchemieAetherLevelUpBonus();
      const falterMult   = typeof getWildPetAlchemieWissensdurstBonus === 'function'
        ? (1 + getWildPetAlchemieWissensdurstBonus()) : 1;
      const wdGain       = Math.round((wdBase + aetherBonus) * falterMult);
      einsicht.points      += wdGain;
      einsicht.totalEarned += wdGain;

      // Toast + Milestone-Hinweis
      const milestone = (ALCHEMIE_MILESTONES[id] || []).find(m => m.level === newLevel);
      const milestoneHint = milestone ? ` — ${milestone.desc}` : '';
      showToast(`${aspect.icon} ${aspect.name} Stufe ${newLevel}! +${wdGain} ✦${milestoneHint}`, TOAST.REWARD);

      // MaxHP aktualisieren wenn Wasser-Meilenstein frisch erreicht
      if (id === 'wasser' && (newLevel === 1)) {
        const newMaxHp = getPlayerMaxHp();
        playerStats.maxHp = newMaxHp;
        playerStats.hp    = Math.min(playerStats.hp + 10, newMaxHp);
      }

      threshold = alchemieThreshold(newLevel);
    }
  }
}

function catchUpAlchemie() {
  if (!alchemie.unlocked || !alchemie.lastTick) return;
  const MAX_CATCHUP_SECONDS = 4 * 60 * 60;
  const elapsed = Math.floor((Date.now() - alchemie.lastTick) / 1000);
  const catchup = Math.min(elapsed, MAX_CATCHUP_SECONDS);
  if (catchup > 0) tickAlchemie(catchup);
}

function renderAlchemie(el) {
  if (!alchemie.unlocked) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Alchemie</div>
        <p style="color:var(--muted);font-style:italic">Varena erklärt mir die Grundlagen, sobald ich ihr Vertrauen gewonnen habe.</p>
      </div>`;
    return;
  }

  const bars = ALCHEMIE_ASPECTS.map(aspect => {
    const id        = aspect.id;
    const level     = alchemie.levels[id];
    const progress  = alchemie.progress[id];
    const thresh    = alchemieThreshold(level);
    const pct       = Math.min((progress / thresh) * 100, 100).toFixed(1);
    const milestones = (ALCHEMIE_MILESTONES[id] || []).map(m => {
      const unlocked = level >= m.level;
      return `<div class="alchemie-milestone ${unlocked ? 'alchemie-milestone-unlocked' : ''}">` +
        `<span class="alchemie-milestone-level">Stufe ${m.level}</span> ${m.desc}` +
        `</div>`;
    }).join('');
    return `
      <div class="action-card">
        <div class="action-card-icon">${aspect.icon}</div>
        <div class="action-card-name">${aspect.name} <span style="font-size:0.8em;color:var(--muted)">Stufe ${level}</span></div>
        <p class="action-card-desc">${aspect.desc}</p>
        <div class="xp-track" title="${Math.floor(progress)} / ${thresh}">
          <div class="xp-bar" style="width:${pct}%"></div>
        </div>
        <div class="action-card-effect" style="margin-top:4px;">${Math.floor(progress)} / ${thresh} · ${pct}%</div>
        ${milestones ? `<div class="alchemie-milestones">${milestones}</div>` : ''}
      </div>`;
  }).join('');

  const skillCards = WISSENSDURST_SKILLS.map(skill => {
    const owned    = !!wissensdurstSkills[skill.id];
    const reqMet   = !skill.requires || !!wissensdurstSkills[skill.requires];
    const canBuy   = !owned && reqMet && einsicht.points >= skill.cost;
    const locked   = !owned && !reqMet;
    const reqSkill = skill.requires ? WISSENSDURST_SKILLS.find(s => s.id === skill.requires) : null;

    let btnLabel, btnClass, btnAttr;
    if (owned) {
      btnLabel = '✓ Erlernt'; btnClass = 'btn-disabled'; btnAttr = 'disabled';
    } else if (locked) {
      btnLabel = `Erfordert: ${reqSkill.name}`; btnClass = 'btn-disabled'; btnAttr = 'disabled';
    } else if (!canBuy) {
      btnLabel = `${skill.cost} ✦ (fehlt ${skill.cost - einsicht.points})`; btnClass = 'btn-disabled'; btnAttr = 'disabled';
    } else {
      btnLabel = `${skill.cost} ✦ kaufen`; btnClass = ''; btnAttr = `onclick="buyWissensdurstSkill('${skill.id}')"`;
    }

    return `
      <div class="action-card${owned ? ' quest-card-done' : locked ? ' action-card-locked' : ''}">
        <div class="action-card-icon">${skill.icon}</div>
        <div class="action-card-name">${skill.name}</div>
        <p class="action-card-desc">${skill.desc}</p>
        <div class="action-card-effect">${skill.effect}</div>
        <button class="action-btn ${btnClass}" ${btnAttr}>${btnLabel}</button>
      </div>`;
  }).join('');

  const berufsstufe = getAlchemieBerufsstufe();
  const totalLevels = Object.values(alchemie.levels).reduce((s, v) => s + v, 0);

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Alchemie</div>
      <div class="alchemie-header">
        <span class="alchemie-berufsstufe">${berufsstufe}</span>
        <span class="alchemie-wissensdurst">✦ ${einsicht.points} Wissensdurst <span style="color:var(--text-lo);font-size:0.8em;">(${einsicht.totalEarned} gesamt)</span></span>
      </div>
      <div class="action-grid">${bars}</div>
      <div class="feature-stage-label" style="margin-top:24px;">Wissensdurst-Fähigkeiten</div>
      <p style="color:var(--muted);font-size:0.85em;margin-bottom:12px;">Permanente Verbesserungen — bleiben auch nach einem Neuanfang erhalten.</p>
      <div class="action-grid">${skillCards}</div>
    </div>`;
}
