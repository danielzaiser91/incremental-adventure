/* ══════════════════════════════════════════════════════════════
   automation.js — Zeitkristall-Automatisierungs-System
   Zeitkristalle sind seltene Drops aus Kämpfen. Jeder Kristall kann
   einer Arbeit zugewiesen werden und führt sie selbsttätig aus, wenn
   Zeit vergeht — ohne Hunger oder Müdigkeit zu kosten.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Automatisierbare Aktionen ────────────────────────────────
   `unlockCond()`: Spieler muss die Arbeit ausreichend manuell
   geleistet haben, bevor er sie automatisieren kann.
   `lockedDesc()`: Anzeige im UI, was noch fehlt.
   `canRun()`: Prüft Laufzeit-Voraussetzungen (Tag, Werkzeug etc.).
   `run()`: Führt die Arbeit einmalig ohne Nebenwirkungen aus. */
const AUTOMATION_ACTIONS = [
  {
    id:    'feldarbeit',
    label: 'Feldarbeit',
    icon:  '⚒',
    unlockCond:  () => workStats.count >= 50,
    lockedDesc:  () => `Absolviere mindestens 50 Feldarbeiten (aktuell: ${Math.min(workStats.count, 50)}/50).`,
    canRun: () => !isNight(),
    run: () => {
      const reward = getWorkReward();
      workStats.count++;
      resources.gold            += reward;
      resources.totalGoldEarned += reward;
    }
  },
  {
    id:    'holz',
    label: 'Holz hacken',
    icon:  '🌲',
    unlockCond:  () => resources.totalResourcesSold >= 15,
    lockedDesc:  () => `Verkaufe mindestens 15 Rohstoffe bei Greta (aktuell: ${Math.min(resources.totalResourcesSold, 15)}/15).`,
    canRun: () => !isNight() && (resources.inventory['axt'] || 0) > 0,
    run: () => { grantItem('holz', RESOURCE_GATHER_AMOUNT); }
  },
  {
    id:    'stein',
    label: 'Steine sammeln',
    icon:  '🪨',
    unlockCond:  () => resources.totalResourcesSold >= 15,
    lockedDesc:  () => `Verkaufe mindestens 15 Rohstoffe bei Greta (aktuell: ${Math.min(resources.totalResourcesSold, 15)}/15).`,
    canRun: () => !isNight() && (resources.inventory['spitzhacke'] || 0) > 0,
    run: () => { grantItem('stein', RESOURCE_GATHER_AMOUNT); }
  },
  {
    id:    'pflanze',
    label: 'Wildkraut sammeln',
    icon:  '🌿',
    unlockCond:  () => resources.totalResourcesSold >= 15,
    lockedDesc:  () => `Verkaufe mindestens 15 Rohstoffe bei Greta (aktuell: ${Math.min(resources.totalResourcesSold, 15)}/15).`,
    canRun: () => !isNight() && (resources.inventory['sichel'] || 0) > 0,
    run: () => { grantItem('pflanze', RESOURCE_GATHER_AMOUNT); }
  },
  {
    id:    'stadtwache',
    label: 'Stadtwache-Schicht',
    icon:  '🛡',
    unlockCond:  () => gameFlags.stadtwacheAccepted && stadtwacheStats.count >= 50,
    lockedDesc:  () => gameFlags.stadtwacheAccepted
      ? `Absolviere mindestens 50 Schichten als Wächter (aktuell: ${Math.min(stadtwacheStats.count, 50)}/50).`
      : 'Erfordert die Stadtwache-Mitgliedschaft (Kommandant Roswald in der Taverne).',
    canRun: () => gameFlags.stadtwacheAccepted && !isNight(),
    run: () => {
      const reward = getStadtwacheReward();
      stadtwacheStats.count    += 1;
      resources.gold           += reward;
      resources.totalGoldEarned += reward;
    }
  }
];

/* ── Spielzeit-basierter Tick ─────────────────────────────── */

/* Schwelle in Spielminuten pro Automation-Tick.
   Entspricht WORK_CLOCK_MINUTES (actions.js) = 1 Feldarbeit Spielzeit. */
const AUTOMATION_CLOCK_PER_TICK = 60;

/** Wird von advanceClock() aufgerufen; feuert tickAutomation() für jede
    volle AUTOMATION_CLOCK_PER_TICK Spielminuten die vergangen sind. */
function tickAutomationClock(minutes) {
  if (!gameFlags.automationDiscovered || automation.slots.length === 0) return;
  automation.clockAccum = (automation.clockAccum || 0) + minutes;
  while (automation.clockAccum >= AUTOMATION_CLOCK_PER_TICK) {
    automation.clockAccum -= AUTOMATION_CLOCK_PER_TICK;
    tickAutomation();
  }
}

/** Richtet die Automatisierung ein (kein Timer mehr — läuft über Spielzeit). */
function setupAutomation() {}

/** Führt alle aktiven Automatisierungs-Slots einmal aus. */
function tickAutomation() {
  let changed = false;
  automation.slots.forEach(slot => {
    if (!slot.enabled) return;
    const action = AUTOMATION_ACTIONS.find(a => a.id === slot.action);
    if (!action || !action.canRun()) return;
    action.run();
    changed = true;
  });
  if (changed) render();
}

/* ── Slot-Management ──────────────────────────────────────── */

/** Weist einem freien Kristall die Aktion zu. Maximal 1 Kristall pro Aktion. */
function addAutomationSlot(actionId) {
  if (zeitkristalle <= 0) { showToast('Kein Zeitkristall verfügbar.', TOAST.ERROR); return; }
  if (automation.slots.length >= zeitkristalle) { showToast('Alle Zeitkristalle sind bereits verwendet.', TOAST.ERROR); return; }
  if (automation.slots.some(s => s.action === actionId)) { showToast('Diese Arbeit wird bereits automatisiert.', TOAST.INFO); return; }
  const action = AUTOMATION_ACTIONS.find(a => a.id === actionId);
  if (!action || (action.unlockCond && !action.unlockCond())) { showToast('Diese Arbeit ist noch nicht verfügbar.', TOAST.ERROR); return; }
  automation.slots.push({ action: actionId, enabled: true });
  setupAutomation();
  render();
}

function removeAutomationSlot(index) {
  if (index < 0 || index >= automation.slots.length) return;
  automation.slots.splice(index, 1);
  setupAutomation();
  render();
}

/** Entfernt den Slot für eine bestimmte Aktion (erste Fundstelle). */
function removeAutomationSlotByAction(actionId) {
  const idx = automation.slots.findIndex(s => s.action === actionId);
  if (idx !== -1) removeAutomationSlot(idx);
}

/* ── Render-Funktion ──────────────────────────────────────── */

function renderAutomation(el) {
  const maxSlots  = zeitkristalle;
  const usedSlots = automation.slots.length;
  const freeSlots = maxSlots - usedSlots;

  const actionCards = AUTOMATION_ACTIONS.map(action => {
    const unlocked    = !action.unlockCond || action.unlockCond();
    const assignedIdx = automation.slots.findIndex(s => s.action === action.id);
    const isActive    = assignedIdx !== -1;

    if (!unlocked) {
      return `
        <div class="auto-action-card auto-action-locked">
          <div class="auto-action-icon">${action.icon}</div>
          <div class="auto-action-body">
            <div class="auto-action-name">${action.label}</div>
            <div class="auto-action-locked-reason">🔒 ${action.lockedDesc()}</div>
          </div>
        </div>`;
    }

    const btn = isActive
      ? `<button class="auto-action-btn auto-action-btn-remove" onclick="removeAutomationSlotByAction('${action.id}')">Entfernen</button>`
      : freeSlots > 0
        ? `<button class="auto-action-btn" onclick="addAutomationSlot('${action.id}')">⌛ Einsetzen</button>`
        : `<button class="auto-action-btn btn-disabled" disabled title="Keine freien Kristalle">Kein Kristall frei</button>`;

    return `
      <div class="auto-action-card ${isActive ? 'auto-action-active' : ''}">
        <div class="auto-action-icon">${action.icon}</div>
        <div class="auto-action-body">
          <div class="auto-action-name">${action.label}</div>
          ${isActive ? `<div class="auto-action-status">⌛ Aktiv — alle ${AUTOMATION_CLOCK_PER_TICK} Spielminuten</div>` : ''}
        </div>
        ${btn}
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage-label">Automatisierung</div>

    <div class="auto-intro">
      <p>Mithilfe der Zeitkristalle kann ich gleichzeitig etwas anderes machen. Ich stimme sie auf eine Arbeit ein — und wenn tatsächlich Zeit vergeht, ist es so, als hätte ich diese Arbeit getan. Nur ohne die negativen Effekte.</p>
      <div class="auto-crystal-count">⌛ ${maxSlots} Zeitkristall${maxSlots !== 1 ? 'e' : ''} · ${usedSlots} aktiv · ${freeSlots} frei</div>
    </div>

    ${maxSlots === 0 ? `
      <div class="auto-empty">
        Noch keine Zeitkristalle gefunden. Sie sind seltene Drops aus Kämpfen im Jagdgebiet.
      </div>
    ` : ''}

    <div class="auto-action-list">${actionCards}</div>
  `;
}
