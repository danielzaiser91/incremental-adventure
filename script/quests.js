/* ══════════════════════════════════════════════════════════════
   quests.js — Quest-Registry + Übersichtsseite
   Liest nur aus dem `quests`-State (state.js); Statusänderungen
   passieren bei den NPCs (npc.js) bzw. den Aktionen, die sie
   abschließen (z.B. nightWatch() in actions.js).
   ══════════════════════════════════════════════════════════════ */

'use strict';

const QUEST_DEFS = [
  {
    id:    'nightWatch',
    title: 'Nachtwache für Brakka',
    icon:  '🌙',
    descByState: {
      unstarted: 'Noch nicht begonnen. Vielleicht weiß jemand in der Taverne mehr über die Nachtwache.',
      active:    'Angenommen: Heute Nacht Wache vor dem Stadttor halten — dann zu Brakka zurückkehren.',
      done:      'Nachtwache gehalten! Erst zu Brakka in der Taverne zurückkehren, um zu berichten — vorher geht es nicht erneut.',
      rewarded:  'Abgeschlossen — Brakka hat sich bedankt. Ich kann von nun an jede Nacht als Stadtwache arbeiten.'
    }
  },
  {
    id:    'miraLetter',
    title: 'Ein Brief für Brakka',
    icon:  '✉',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Mira hat mir einen versiegelten Brief für Brakka mitgegeben. Ich sollte ihn in der Taverne abgeben.',
      rewarded:  'Abgeschlossen — der Brief ist bei Brakka angekommen.'
    }
  },
  {
    id:    'foremanRaise',
    title: 'Ein gutes Wort beim Vorarbeiter',
    icon:  '🍺',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Der Vorarbeiter hat mich heute Abend in die Taverne eingeladen.',
      rewarded:  'Abgeschlossen — mein Lohn ist dauerhaft gestiegen.'
    }
  }
];

/* Questgegenstände — bewusst getrennt vom normalen Spielerinventar
   dargestellt (siehe inventory.js): sie zählen nicht gegen
   INVENTORY_SLOT_COUNT und verschwinden automatisch nach Quest-Abgabe. */
const QUEST_ITEMS = [
  {
    id: 'sealedLetter', name: 'Versiegelter Brief', icon: '✉',
    desc: 'Mira hat mir diesen Brief anvertraut — er ist für Brakka bestimmt, niemand sonst.'
  }
];

const QUEST_STATE_LABELS = {
  unstarted: 'Unbekannt',
  active:    'In Arbeit',
  done:      'Bereit zur Abgabe',
  rewarded:  'Abgeschlossen'
};

/** Rendert die Quest-Übersicht. Noch nicht angenommene Quests bleiben unsichtbar —
    sie existieren für den Spieler erst, sobald er sie tatsächlich bekommen hat. */
function renderQuests(el) {
  const started = QUEST_DEFS.filter(q => quests[q.id].state !== 'unstarted');

  if (started.length === 0) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Quests</div>
        <p class="chronik-empty">Keine Quests vorhanden.</p>
      </div>
    `;
    return;
  }

  const cards = started.map(q => {
    const state = quests[q.id].state;
    const desc  = q.descByState[state];
    const doneClass = state === 'rewarded' ? ' quest-card-done' : '';
    return `
      <div class="action-card${doneClass}">
        <div class="action-card-icon">${q.icon}</div>
        <div class="action-card-name">${q.title}</div>
        <p class="action-card-desc">${desc}</p>
        <div class="quest-status quest-status-${state}">${QUEST_STATE_LABELS[state]}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Quests</div>
      <div class="action-grid">${cards}</div>
    </div>
  `;
}
