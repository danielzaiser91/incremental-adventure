/* ══════════════════════════════════════════════════════════════
   automation.js — Zeitkristall-Automatisierungs-System
   Zeitkristalle (zeitkristalle in state.js) sind seltene Drops aus
   Kämpfen. Jeder Kristall kann als "eingefrorene Zeit" einem
   Automatisierungs-Slot zugewiesen werden, der dann selbsttätig eine
   Aktion pro Spielstunde ausführt.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Automatisierbare Aktionen ────────────────────────────────
   `canRun()`: prüft, ob die Aktion gerade ausführbar ist (Tag, kein
   Hunger-Block, ausreichend Ressourcen).
   `run()`: führt die Aktion einmalig durch, wie ein unsichtbarer Klick. */
const AUTOMATION_ACTIONS = [
  {
    id:    'feldarbeit',
    label: 'Feldarbeit',
    icon:  '⚒',
    desc:  'Führt einmal pro Spielstunde eine Feldarbeit durch.',
    canRun: () => !isNight() && !gameFlags.mustEatBread && !gameFlags.isWorking,
    run:    () => {
      if (!AUTOMATION_ACTIONS.find(a => a.id === 'feldarbeit').canRun()) return;
      const reward = getWorkReward();
      const tGain  = getWorkTirednessGain();
      const hGain  = getWorkHungerGain();
      workStats.count++;
      resources.gold         += reward;
      resources.totalGoldEarned += reward;
      adjustTiredness(tGain);
      adjustHunger(hGain);
    }
  },
  {
    id:    'holz',
    label: 'Holz hacken',
    icon:  '🌲',
    desc:  'Sammelt einmal pro Spielstunde ein Stück Holz (benötigt Axt).',
    canRun: () => !isNight() && (resources.inventory['axt'] || 0) > 0,
    run:    () => {
      if (!AUTOMATION_ACTIONS.find(a => a.id === 'holz').canRun()) return;
      grantItem('holz', RESOURCE_GATHER_AMOUNT);
      adjustTiredness(RESOURCE_GATHER_TIREDNESS);
      adjustHunger(RESOURCE_GATHER_HUNGER);
    }
  },
  {
    id:    'stein',
    label: 'Steine sammeln',
    icon:  '🪨',
    desc:  'Sammelt einmal pro Spielstunde einen Stein (benötigt Spitzhacke).',
    canRun: () => !isNight() && (resources.inventory['spitzhacke'] || 0) > 0,
    run:    () => {
      if (!AUTOMATION_ACTIONS.find(a => a.id === 'stein').canRun()) return;
      grantItem('stein', RESOURCE_GATHER_AMOUNT);
      adjustTiredness(RESOURCE_GATHER_TIREDNESS);
      adjustHunger(RESOURCE_GATHER_HUNGER);
    }
  },
  {
    id:    'pflanze',
    label: 'Wildkraut sammeln',
    icon:  '🌿',
    desc:  'Sammelt einmal pro Spielstunde Wildkraut (benötigt Sichel).',
    canRun: () => !isNight() && (resources.inventory['sichel'] || 0) > 0,
    run:    () => {
      if (!AUTOMATION_ACTIONS.find(a => a.id === 'pflanze').canRun()) return;
      grantItem('pflanze', RESOURCE_GATHER_AMOUNT);
      adjustTiredness(RESOURCE_GATHER_TIREDNESS);
      adjustHunger(RESOURCE_GATHER_HUNGER);
    }
  }
];

/* ── Interner Timer ───────────────────────────────────────── */

let automationTimerId = null;

/** Richtet den Automatisierungs-Tick-Timer neu ein.
    Wird von main.js nach dem Init und von setAutomationSlot() aufgerufen. */
function setupAutomation() {
  if (automationTimerId) { clearInterval(automationTimerId); automationTimerId = null; }
  if (!gameFlags.automationDiscovered || automation.slots.length === 0) return;

  // Ein Tick pro 30 Sekunden Echtzeit ≈ ~1 Spielstunde (die Spieluhr läuft
  // variabel durch die Arbeit, hier ist es ein festes Echtzeit-Intervall).
  automationTimerId = setInterval(tickAutomation, 30_000);
}

/** Führt alle aktiven Automatisierungs-Slots einmal aus. */
function tickAutomation() {
  let changed = false;

  automation.slots.forEach((slot, i) => {
    if (!slot.enabled) return;
    const action = AUTOMATION_ACTIONS.find(a => a.id === slot.action);
    if (!action || !action.canRun()) return;
    action.run();
    changed = true;
  });

  if (changed) render();
}

/* ── Slot-Management ──────────────────────────────────────── */

/** Weist einem Slot eine Aktion zu oder schaltet ihn aus.
    `index` -1 fügt einen neuen Slot hinzu (kostet einen Zeitkristall). */
function addAutomationSlot(actionId) {
  if (zeitkristalle <= 0) {
    showToast('Kein Zeitkristall verfügbar.', 'error');
    return;
  }
  if (automation.slots.length >= zeitkristalle) {
    showToast('Alle Zeitkristalle sind bereits verwendet.', 'error');
    return;
  }
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

function setAutomationSlotEnabled(index, enabled) {
  if (!automation.slots[index]) return;
  automation.slots[index].enabled = enabled;
  setupAutomation();
  render();
}

function setAutomationSlotAction(index, actionId) {
  if (!automation.slots[index]) return;
  automation.slots[index].action = actionId;
  render();
}

/* ── Render-Funktion ──────────────────────────────────────── */

function renderAutomation(el) {
  const maxSlots   = zeitkristalle;
  const usedSlots  = automation.slots.length;
  const freeSlots  = maxSlots - usedSlots;

  const actionOptions = AUTOMATION_ACTIONS.map(a =>
    `<option value="${a.id}">${a.icon} ${a.label}</option>`
  ).join('');

  const slotRows = automation.slots.map((slot, i) => {
    const action  = AUTOMATION_ACTIONS.find(a => a.id === slot.action) || AUTOMATION_ACTIONS[0];
    const onOpts  = AUTOMATION_ACTIONS.map(a =>
      `<option value="${a.id}" ${a.id === slot.action ? 'selected' : ''}>${a.icon} ${a.label}</option>`
    ).join('');
    return `
      <div class="auto-slot">
        <div class="auto-slot-crystal">⌛</div>
        <select class="auto-slot-select" onchange="setAutomationSlotAction(${i}, this.value)">${onOpts}</select>
        <label class="auto-slot-toggle">
          <input type="checkbox" ${slot.enabled ? 'checked' : ''} onchange="setAutomationSlotEnabled(${i}, this.checked)">
          Aktiv
        </label>
        <button class="auto-slot-remove" onclick="removeAutomationSlot(${i})" title="Slot entfernen">✕</button>
        <div class="auto-slot-desc">${action.desc}</div>
      </div>
    `;
  }).join('');

  const addSection = freeSlots > 0 ? `
    <div class="auto-add-row">
      <select id="auto-new-action-select">${actionOptions}</select>
      <button class="action-btn auto-add-btn" onclick="addAutomationSlot(document.getElementById('auto-new-action-select').value)">
        + Slot hinzufügen (⌛ kostet 1 Zeitkristall)
      </button>
    </div>
  ` : '';

  el.innerHTML = `
    <div class="feature-stage-label">Automatisierung</div>

    <div class="auto-intro">
      <p>
        Zeitkristalle enthalten eingefrorene Zeit. Jeder Kristall kann einem Automatisierungs-Slot
        zugewiesen werden, der dann selbsttätig eine Aktion ausführt — alle 30 Sekunden einmal.
      </p>
      <div class="auto-crystal-count">
        ⌛ ${maxSlots} Zeitkristall${maxSlots !== 1 ? 'e' : ''} verfügbar · ${usedSlots} verwendet · ${freeSlots} frei
      </div>
    </div>

    ${usedSlots === 0 && maxSlots === 0 ? `
      <div class="auto-empty">
        Noch keine Zeitkristalle gefunden. Sie sind seltene Drops aus Kämpfen im Jagdgebiet.
      </div>
    ` : ''}

    ${slotRows ? `<div class="auto-slots">${slotRows}</div>` : ''}
    ${addSection}
  `;
}
