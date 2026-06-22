/* ══════════════════════════════════════════════════════════════
   alchemie.js — Alchemie-System (Kapitel 3, Lethkar)

   5 Aspekte: Feuer, Wasser, Erde, Luft, Äther.
   Fortschritt: 1 Punkt/Sekunde (Echtzeit, setInterval).
   Kosten pro Level-Up: 3^level * 100 Punkte.
   Einsicht-Generierung: pro Level-Up gibt es 1 Einsicht-Punkt.
   Offline-Aufholen: max. 4 Stunden.
   ══════════════════════════════════════════════════════════════ */

'use strict';

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
    if (currentContent === 'alchemie') render();
  }, 1000);
}

function tickAlchemie(seconds) {
  if (!alchemie.unlocked) return;
  const now = Date.now();
  alchemie.lastTick = now;

  for (const aspect of ALCHEMIE_ASPECTS) {
    const id = aspect.id;
    alchemie.progress[id] += seconds;
    let threshold = alchemieThreshold(alchemie.levels[id]);
    while (alchemie.progress[id] >= threshold) {
      alchemie.progress[id] -= threshold;
      alchemie.levels[id] += 1;
      einsicht.points      += 1;
      einsicht.totalEarned += 1;
      if (currentContent === 'alchemie' || currentContent === 'stats') {
        showToast(`${aspect.icon} ${aspect.name} Stufe ${alchemie.levels[id]}! +1 Wissensdurst ✦`, 'reward');
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

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Alchemie</div>
      <p style="color:var(--muted);margin-bottom:12px;">Wissensdurst: <strong>✦ ${einsicht.points}</strong> (gesamt erworben: ${einsicht.totalEarned})</p>
      <div class="action-grid">${bars}</div>
    </div>`;
}
