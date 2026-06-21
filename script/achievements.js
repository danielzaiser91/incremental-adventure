/* ══════════════════════════════════════════════════════════════
   achievements.js — Errungenschaften: allgemeine + geheime Kategorie
   Allgemeine Errungenschaften sind nach Reset-Layer gruppiert.
   Eine Layer-Sektion erscheint erst, wenn meta.resets >= layer.
   Geheime zeigen statt Name/Beschreibung nur "???" + Hinweis.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* layer-Feld: in welcher Reset-Stufe diese Errungenschaft verortet ist.
   0 = vor erstem Reset erreichbar (immer sichtbar in Allgemein)
   1 = Erfahrungs-Layer (sichtbar ab meta.resets >= 1) */
const ACHIEVEMENT_DEFS = [
  {
    id: 'firstWork', cat: 'normal', layer: 0, icon: '⚒', name: 'Erste Schwielen',
    desc: 'Verrichte deine erste Feldarbeit.',
    check: () => workStats.count >= 1,
    bonusMult: 0.05
  },
  {
    id: 'kraemerinDone', cat: 'normal', layer: 0, icon: '🧺', name: 'Geschäftspartner',
    desc: 'Hilf Greta, ihr Sortiment zu erweitern.',
    check: () => quests.kraemerinBusiness.state === 'rewarded',
    bonusMult: 0.05
  },
  {
    id: 'firstReset', cat: 'normal', layer: 1, icon: '✦', name: 'Ein neuer Anfang',
    desc: 'Beginne zum ersten Mal ganz von vorn.',
    check: () => meta.resets >= 1,
    bonusMult: 0.10
  },
  {
    id: 'nightWatchDone', cat: 'normal', layer: 1, icon: '🌙', name: 'Wachsamer Geist',
    desc: 'Schließe die Nachtwache für Brakka ab.',
    check: () => quests.nightWatch.state === 'rewarded',
    bonusMult: 0.05
  },
  {
    id: 'guildReady', cat: 'normal', layer: 1, icon: '⚔', name: 'Bereit für die Gilde',
    desc: 'Schließe die Vorbereitung auf die Abenteurergilde ab.',
    check: () => quests.guildRegistration.state === 'rewarded',
    bonusMult: 0.10
  },
  {
    id: 'thriftMaster', cat: 'normal', layer: 1, icon: '🪙', name: 'Geschäftssinn',
    desc: 'Erlerne die Sparsamkeit vollständig (Stufe 2).',
    check: () => getSkillLevel('thrift') >= 2,
    bonusMult: 0.05
  },
  {
    id: 'streetCat', cat: 'secret', layer: 0, icon: '🐈', name: 'Eine stille Freundschaft',
    desc: 'Gewinne über mehrere Nächte das Vertrauen eines streunenden Straßentiers.',
    hint: 'Manche Freundschaften brauchen Geduld — und ein paar kalte, schlaflose Nächte.',
    check: () => !!pets.streetCat
  },
  {
    id: 'imSchatten', cat: 'secret', layer: 1, icon: '🔍', name: 'Im Schatten',
    desc: 'Du hast ihn fünfmal angesprochen, bevor du wusstest, wer er wirklich ist.',
    hint: 'Manchmal sitzt die Antwort die ganze Zeit im selben Raum wie die Frage.',
    check: () => npcFlags.fremderTalkCount >= 5
  },
  {
    id: 'chapter2Complete', cat: 'normal', layer: 1, icon: '🏆', name: 'Chroniken des vergessenen Weges',
    desc: 'Kapitel 1 und 2 vollständig abgeschlossen — die Wahrheit hinter dem Raub enthüllt.',
    check: () => gameFlags.chapter2Complete,
    bonusMult: 0.15
  }
];

/** Gesamter Gold-Bonus-Multiplikator aus freigeschalteten Errungenschaften. */
function getAchievementGoldBonus() {
  return ACHIEVEMENT_DEFS
    .filter(d => d.bonusMult && achievements[d.id])
    .reduce((sum, d) => sum + d.bonusMult, 0);
}

/** Prüft alle noch nicht erreichten Errungenschaften und schaltet sie bei
    erfüllter Bedingung frei. Wird aus render() heraus aufgerufen.
    Ruft selbst NIEMALS render() auf (würde render() rekursiv anstoßen). */
function checkAchievements() {
  ACHIEVEMENT_DEFS.forEach(def => {
    if (achievements[def.id]) return;
    if (!def.check()) return;

    achievements[def.id] = true;
    navUnseen.errungenschaften = true;
    const prefix = def.cat === 'secret' ? '🏆 Geheime Errungenschaft' : '🏆 Errungenschaft';
    showToast(`${prefix} freigeschaltet: ${def.name}`, 'event');
  });
}

/** Wechselt zwischen "Allgemein" und "Geheim" auf der Errungenschaften-Seite. */
function setAchievementTab(tab) {
  achievementTab = tab;
  render();
}

/** Baut EINE Errungenschafts-Kachel. */
function achievementCardHtml(def) {
  const unlocked = !!achievements[def.id];

  if (def.cat === 'secret' && !unlocked) {
    // Straßenkehrer-Hinweis: wenn der Spieler diesen NPC gesprochen hat,
    // wird der Hinweis auf der Karte dauerhaft erweitert.
    const extraHint = def.id === 'streetCat' && gameFlags.streetSweeperTalked
      ? `<p class="achievement-hint-green">Vielleicht muss ich mehrmals draußen schlafen, um den scheuen Tieren zu begegnen.</p>`
      : '';
    return `
      <div class="action-card action-card-locked">
        <div class="action-card-icon">❔</div>
        <div class="action-card-name">???</div>
        <p class="action-card-desc">${def.hint}</p>
        ${extraHint}
      </div>`;
  }

  const bonusText = def.bonusMult && unlocked
    ? `<div class="action-card-effect">+${Math.round(def.bonusMult * 100)}% Gold aus allen Quellen</div>`
    : '';

  return `
    <div class="action-card${unlocked ? ' achievement-card-done' : ' action-card-locked'}">
      <div class="action-card-icon">${def.icon}</div>
      <div class="action-card-name">${def.name}</div>
      <p class="action-card-desc">${def.desc}</p>
      ${bonusText}
    </div>`;
}

/* ── Errungenschaften-Seite ───────────────────────────────── */
function renderErrungenschaften(el) {
  const normalDefs = ACHIEVEMENT_DEFS.filter(d => d.cat === 'normal');
  const secretDefs = ACHIEVEMENT_DEFS.filter(d => d.cat === 'secret');
  const normalCount = normalDefs.filter(d => achievements[d.id]).length;
  const secretCount = secretDefs.filter(d => achievements[d.id]).length;

  const totalBonus = getAchievementGoldBonus();
  const bonusSummaryHtml = totalBonus > 0
    ? `<div class="achievement-bonus-bar">✦ Aktive Boni: <strong>+${Math.round(totalBonus * 100)}% Gold</strong> aus allen Quellen</div>`
    : '';

  if (achievementTab === 'secret') {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Errungenschaften</div>
        ${bonusSummaryHtml}
        <div class="tab-bar">
          <button class="tab-btn" onclick="setAchievementTab('normal')">Allgemein (${normalCount}/${normalDefs.length})</button>
          <button class="tab-btn active" onclick="setAchievementTab('secret')">Geheim (${secretCount}/${secretDefs.length})</button>
        </div>
        <div class="tab-panel">
          <div class="action-grid">${secretDefs.map(achievementCardHtml).join('')}</div>
        </div>
      </div>`;
    return;
  }

  // "Allgemein"-Tab: Abschnitte pro Layer
  const LAYER_LABELS  = { 0: 'Erstes Kapitel', 1: 'Erfahrungs-Weg' };
  const layerVisible  = { 0: true, 1: meta.resets >= 1 };

  const layerSections = [0, 1].map(layer => {
    if (!layerVisible[layer]) return '';
    const defs  = normalDefs.filter(d => d.layer === layer);
    const count = defs.filter(d => achievements[d.id]).length;
    return `
      <div class="achievement-layer-section">
        <div class="achievement-layer-label">${LAYER_LABELS[layer]} — ${count}/${defs.length}</div>
        <div class="action-grid">${defs.map(achievementCardHtml).join('')}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Errungenschaften</div>
      ${bonusSummaryHtml}
      <div class="tab-bar">
        <button class="tab-btn active" onclick="setAchievementTab('normal')">Allgemein (${normalCount}/${normalDefs.length})</button>
        <button class="tab-btn" onclick="setAchievementTab('secret')">Geheim (${secretCount}/${secretDefs.length})</button>
      </div>
      <div class="tab-panel">${layerSections}</div>
    </div>`;
}
