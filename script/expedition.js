/* ══════════════════════════════════════════════════════════════
   expedition.js — Expeditionen (Story + Grind)

   Story-Expeditionen: einmalig, schalten Inhalte/Story frei.
   Grind-Expeditionen: wiederholbar, liefern Ressourcen/Gold/XP.

   Laufende Expedition: expedition.activeExpedition ist gesetzt,
   mit startTime + durationMs. Abschluss via checkExpedition()
   (aus main.js oder Render-Aufruf) — kein eigener Timer, da das
   Spiel keinen Echtzeit-Ticker hat und Offline-Abschlüsse beim
   Laden geprüft werden.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Expeditions-Definitionen ─────────────────────────────── */

const EXPEDITION_STORY = [
  {
    id:       'ruins_of_aethren',
    name:     'Ruinen von Äthren',
    icon:     '🏚',
    desc:     'Westlich des Waldes sollen alte Ruinen liegen. Händler erwähnen Geschichten — Mauerreste aus einer untergegangenen Siedlung, vor dem Krieg.',
    duration: 60 * 60 * 1000, // 1h
    requires: () => gameFlags.jagdgebietUnlocked,
    reward: () => {
      resources.gold += 80;
      strength.xp += 30;
      showToast('Die Ruinen von Äthren. Kaum mehr als Steine — aber etwas Altes liegt in der Luft. +80 Gold, +30 Stärke-XP', TOAST.REWARD);
    },
    storyUnlock: null
  },
  {
    id:       'old_road_north',
    name:     'Die alte Nordstraße',
    icon:     '🛤',
    desc:     'Eine alte Handelsroute, die kaum noch jemand benutzt. Sie führt, heißt es, einst nach Lethkar.',
    duration: 90 * 60 * 1000, // 1.5h
    requires: () => gameFlags.jagdgebietUnlocked && expedition.storyCompleted.includes('ruins_of_aethren'),
    reward: () => {
      resources.gold += 150;
      mut.points      += 1;
      mut.totalEarned += 1;
      showToast('Die Nordstraße ist länger als gedacht. Und Spuren — frische. +150 Gold, +1 Mut ⚔', TOAST.REWARD);
    },
    storyUnlock: null
  }
];

const EXPEDITION_GRIND = [
  {
    id:       'patrol_outskirts',
    name:     'Stadtrand-Patrouille',
    icon:     '🚶',
    desc:     'Den Rand der Stadt abgehen, nach Unruhestiftern Ausschau halten. Keine Helden-Arbeit — aber solide bezahlt.',
    duration: 30 * 60 * 1000, // 30 min
    requires: () => true,
    reward: () => {
      const gold = 25 + Math.floor(Math.random() * 16);
      resources.gold += gold;
      resources.totalGoldEarned += gold;
      showToast(`Stadtrand-Patrouille abgeschlossen. +${gold} Gold.`, TOAST.REWARD);
    }
  },
  {
    id:       'herb_gathering',
    name:     'Wildkraut-Sammlung',
    icon:     '🌿',
    desc:     'Weiter draußen wachsen Kräuter, die in der Stadt gut verkäuflich sind. Zeitaufwändig, aber lohnenswert.',
    duration: 45 * 60 * 1000, // 45 min
    requires: () => gameFlags.resourceGatheringUnlocked,
    reward: () => {
      const qty = 2 + Math.floor(Math.random() * 3) + getWildPetResourceBonus();
      resources.inventory['wildkraut'] = (resources.inventory['wildkraut'] || 0) + qty;
      showToast(`Kräuter gesammelt: +${qty} Wildkraut.`, TOAST.REWARD);
    }
  },
  {
    id:       'woodcutting_run',
    name:     'Holzfäller-Ausflug',
    icon:     '🪓',
    desc:     'Einen halben Tag im Wald Holz schlagen. Schweiß-treibend — und eine gute Übung für den Arm.',
    duration: 60 * 60 * 1000, // 1h
    requires: () => gameFlags.resourceGatheringUnlocked,
    reward: () => {
      const qty = 3 + Math.floor(Math.random() * 3) + getWildPetResourceBonus();
      resources.inventory['holz'] = (resources.inventory['holz'] || 0) + qty;
      strength.xp += 10;
      showToast(`Holz gehackt: +${qty} Holz, +10 Stärke-XP.`, TOAST.REWARD);
    }
  },
  {
    id:       'bounty_hunt',
    name:     'Kopfgeld-Jagd',
    icon:     '🗡',
    desc:     'Der Stadtrat zahlt für gesuchte Banditen. Gefährlich — aber die Belohnung macht den Kopf klar.',
    duration: 90 * 60 * 1000, // 1.5h
    requires: () => gameFlags.jagdgebietUnlocked,
    reward: () => {
      const base  = 60 + Math.floor(Math.random() * 41);
      const gold  = Math.round(base * getWildPetCombatBonus());
      const xp    = 20 + Math.floor(Math.random() * 11);
      resources.gold += gold;
      resources.totalGoldEarned += gold;
      strength.xp += xp;
      showToast(`Kopfgeld eingestrichen. +${gold} Gold, +${xp} Stärke-XP.`, TOAST.REWARD);
    }
  }
];

/* ── Expedition starten / abschließen ─────────────────────── */

function startExpedition(id, type) {
  if (expedition.activeExpedition) {
    showToast('Noch eine Expedition unterwegs — erst zurückkehren.', TOAST.INFO);
    return;
  }
  if (isNight()) {
    showToast('Nachts trete ich keine Expedition an.', TOAST.INFO);
    return;
  }

  const def = type === 'story'
    ? EXPEDITION_STORY.find(e => e.id === id)
    : EXPEDITION_GRIND.find(e => e.id === id);
  if (!def) return;

  expedition.activeExpedition = {
    id,
    type,
    startTime:   Date.now(),
    durationMs:  def.duration
  };
  showToast(`Expedition gestartet: ${def.name}`, TOAST.EVENT);
  render();
}

function checkExpedition() {
  const active = expedition.activeExpedition;
  if (!active) return;

  const elapsed = Date.now() - active.startTime;
  if (elapsed < active.durationMs) return;

  const def = active.type === 'story'
    ? EXPEDITION_STORY.find(e => e.id === active.id)
    : EXPEDITION_GRIND.find(e => e.id === active.id);

  expedition.activeExpedition = null;

  const isFirstStoryExpedition = active.type === 'story' && expedition.storyCompleted.length === 0;

  if (active.type === 'story') {
    if (!expedition.storyCompleted.includes(active.id)) {
      expedition.storyCompleted.push(active.id);
    }
  } else {
    expedition.grindCounts[active.id] = (expedition.grindCounts[active.id] || 0) + 1;
  }

  if (def?.reward) def.reward();
  navUnseen.expedition = true;
  render();

  if (isFirstStoryExpedition) {
    setTimeout(() => {
      showMonologue('Zurück', [
        'Ich bin weit weg gewesen. Nicht nach Stunden gemessen — aber nach Gefühl.',
        'Die Ruinen waren nicht das, was ich erwartet hatte. Steine und Stille und ein Gefühl, das ich nicht benennen kann.',
        'Ich glaube, ich will das öfter tun. Raus. Weit weg. Ohne zu wissen, was mich erwartet.'
      ]);
    }, 300);
  }
}

/* ── Expedition-Render ────────────────────────────────────── */

let _expTimerInterval = null;

function _tickExpeditionTimer() {
  const active = expedition.activeExpedition;
  if (!active || currentContent !== CONTENT.EXPEDITION) {
    clearInterval(_expTimerInterval);
    _expTimerInterval = null;
    return;
  }
  const elapsed   = Date.now() - active.startTime;
  const progress  = Math.min(elapsed / active.durationMs, 1);
  const remaining = Math.max(active.durationMs - elapsed, 0);
  const mins      = Math.floor(remaining / 60000);
  const secs      = Math.floor((remaining % 60000) / 1000);
  const pct       = Math.floor(progress * 100);

  const barEl  = document.getElementById('exp-progress-bar');
  const textEl = document.getElementById('exp-timer-text');
  const btnEl  = document.getElementById('exp-return-btn');
  if (barEl)  barEl.style.width = pct + '%';
  if (textEl) textEl.textContent = progress >= 1
    ? '✓ Abgeschlossen — klicke Zurückkehren'
    : `Noch ${mins}m ${secs}s (${pct}%)`;
  if (btnEl && progress >= 1 && btnEl.hidden) {
    btnEl.hidden = false;
    clearInterval(_expTimerInterval);
    _expTimerInterval = null;
  }
}

function renderExpedition(el) {
  checkExpedition(); // Offline-Abschluss prüfen
  clearInterval(_expTimerInterval);
  _expTimerInterval = null;

  const active = expedition.activeExpedition;

  const activeBlock = active ? (() => {
    const def = active.type === 'story'
      ? EXPEDITION_STORY.find(e => e.id === active.id)
      : EXPEDITION_GRIND.find(e => e.id === active.id);
    const elapsed   = Date.now() - active.startTime;
    const progress  = Math.min(elapsed / active.durationMs, 1);
    const remaining = Math.max(active.durationMs - elapsed, 0);
    const mins      = Math.floor(remaining / 60000);
    const secs      = Math.floor((remaining % 60000) / 1000);
    const pct       = Math.floor(progress * 100);
    return `
      <div class="location-card" style="margin-bottom:16px;">
        <div class="action-card-icon">${def?.icon ?? '🚶'}</div>
        <div class="action-card-name">Unterwegs: ${def?.name ?? active.id}</div>
        <div class="xp-track" style="margin-top:8px;">
          <div class="xp-bar" id="exp-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="action-card-effect" style="margin-top:6px;" id="exp-timer-text">
          ${progress >= 1 ? '✓ Abgeschlossen — klicke Zurückkehren' : `Noch ${mins}m ${secs}s (${pct}%)`}
        </div>
        <button id="exp-return-btn" class="action-btn" onclick="checkExpedition();render()" ${progress >= 1 ? '' : 'hidden'}>Zurückkehren</button>
      </div>`;
  })() : '';

  const storyCards = EXPEDITION_STORY
    .filter(e => e.requires())
    .map(e => {
      const done = expedition.storyCompleted.includes(e.id);
      const locked = !!active;
      return `
        <div class="action-card ${done ? 'quest-card-done' : ''}">
          <div class="action-card-icon">${e.icon}</div>
          <div class="action-card-name">${e.name} ${done ? '<span style="font-size:0.8em;color:var(--muted)">(Abgeschlossen)</span>' : ''}</div>
          <p class="action-card-desc">${e.desc}</p>
          <div class="action-card-effect">⏱ ${Math.round(e.duration / 60000)} Minuten</div>
          ${done ? '' : `<button class="action-btn ${locked ? 'btn-disabled' : ''}" onclick="startExpedition('${e.id}','story')" ${locked ? 'disabled' : ''}>
            ${locked ? 'Bereits auf Expedition' : 'Aufbrechen'}
          </button>`}
        </div>`;
    }).join('');

  const grindCards = EXPEDITION_GRIND
    .filter(e => e.requires())
    .map(e => {
      const count  = expedition.grindCounts[e.id] || 0;
      const locked = !!active;
      return `
        <div class="action-card">
          <div class="action-card-icon">${e.icon}</div>
          <div class="action-card-name">${e.name}</div>
          <p class="action-card-desc">${e.desc}</p>
          <div class="action-card-effect">⏱ ${Math.round(e.duration / 60000)} Minuten${count > 0 ? ` · ${count}× abgeschlossen` : ''}</div>
          <button class="action-btn ${locked ? 'btn-disabled' : ''}" onclick="startExpedition('${e.id}','grind')" ${locked ? 'disabled' : ''}>
            ${locked ? 'Bereits auf Expedition' : 'Aufbrechen'}
          </button>
        </div>`;
    }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Expeditionen</div>
      ${activeBlock}
      ${storyCards.length ? `<div class="market-section-label">Story</div><div class="action-grid">${storyCards}</div>` : ''}
      ${grindCards.length ? `<div class="market-section-label">Wiederkehrend</div><div class="action-grid">${grindCards}</div>` : ''}
      ${!storyCards.length && !grindCards.length && !active
        ? '<p style="color:var(--muted);font-style:italic">Noch keine Expeditionen verfügbar. Wiederkommen, wenn ich mehr von der Welt kenne.</p>'
        : ''}
    </div>`;

  if (active && active.durationMs - (Date.now() - active.startTime) > 0) {
    _expTimerInterval = setInterval(_tickExpeditionTimer, 1000);
  }
}
