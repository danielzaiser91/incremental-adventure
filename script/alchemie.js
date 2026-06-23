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

function alchemieThreshold(level) {
  return Math.pow(3, level) * 100;
}

let alchemieInterval = null;

function startAlchemieTick() {
  if (alchemieInterval) return;
  alchemieInterval = setInterval(() => {
    if (!alchemie.unlocked) return;
    tickAlchemie(1);
    // Render nur wenn Alchemie-Tab gerade offen
    if (currentContent === CONTENT.ALCHEMIE) render();
  }, 1000);
}

function tickAlchemie(seconds) {
  if (!alchemie.unlocked) return;
  const now = Date.now();
  alchemie.lastTick = now;

  const speedMult = alchemieSpeedMultiplier();
  const wdPerLevel = 1 + (wissensdurstSkills.doppelteErkenntnis ? 1 : 0);
  for (const aspect of ALCHEMIE_ASPECTS) {
    const id = aspect.id;
    alchemie.progress[id] += seconds * speedMult;
    let threshold = alchemieThreshold(alchemie.levels[id]);
    while (alchemie.progress[id] >= threshold) {
      alchemie.progress[id] -= threshold;
      alchemie.levels[id]   += 1;
      einsicht.points       += wdPerLevel;
      einsicht.totalEarned  += wdPerLevel;
      if (currentContent === CONTENT.ALCHEMIE || currentContent === 'stats') {
        showToast(`${aspect.icon} ${aspect.name} Stufe ${alchemie.levels[id]}! +${wdPerLevel} Wissensdurst ✦`, TOAST.REWARD);
      }
      threshold = alchemieThreshold(alchemie.levels[id]);
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
        <p style="color:var(--muted);font-style:italic">Varena erklärt dir die Grundlagen, sobald du ihr Vertrauen gewonnen hast.</p>
      </div>`;
    return;
  }

  const bars = ALCHEMIE_ASPECTS.map(aspect => {
    const id       = aspect.id;
    const level    = alchemie.levels[id];
    const progress = alchemie.progress[id];
    const thresh   = alchemieThreshold(level);
    const pct      = Math.min((progress / thresh) * 100, 100).toFixed(1);
    return `
      <div class="action-card">
        <div class="action-card-icon">${aspect.icon}</div>
        <div class="action-card-name">${aspect.name} <span style="font-size:0.8em;color:var(--muted)">Stufe ${level}</span></div>
        <p class="action-card-desc">${aspect.desc}</p>
        <div class="xp-track" title="${Math.floor(progress)} / ${thresh}">
          <div class="xp-bar" style="width:${pct}%"></div>
        </div>
        <div class="action-card-effect" style="margin-top:4px;">${Math.floor(progress)} / ${thresh} · ${pct}%</div>
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

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Alchemie</div>
      <p style="color:var(--muted);margin-bottom:12px;">Wissensdurst: <strong>✦ ${einsicht.points}</strong> (gesamt erworben: ${einsicht.totalEarned})</p>
      <div class="action-grid">${bars}</div>
      <div class="feature-stage-label" style="margin-top:24px;">Wissensdurst-Fähigkeiten</div>
      <p style="color:var(--muted);font-size:0.85em;margin-bottom:12px;">Permanente Verbesserungen — bleiben auch nach einem Neuanfang erhalten.</p>
      <div class="action-grid">${skillCards}</div>
    </div>`;
}
