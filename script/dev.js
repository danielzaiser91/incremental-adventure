/* ══════════════════════════════════════════════════════════════
   dev.js — Entwickler-Optionen (versteckt hinter Konsolenbefehl)
   Aufruf in der Browser-Konsole: devMode()
   Schaltet ein Dev-Panel in den Einstellungen frei, über das Gold,
   EP, Stärke-XP und Flags direkt gesetzt werden können.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/** Aktiviert das Entwickler-Panel. In der Browser-Konsole aufrufen. */
window.devMode = function() {
  gameFlags.devModeEnabled = true;
  showToast('🛠 Entwickler-Modus aktiviert. Einstellungen → Dev-Panel.', 'event');
  render();
};

/** Rendert das Dev-Panel innerhalb der Einstellungs-Seite.
    Wird von renderSettings() (content.js) aufgerufen, wenn devModeEnabled. */
function renderDevPanel(container) {
  container.innerHTML = `
    <div class="settings-group dev-panel">
      <div class="settings-group-title">🛠 Entwickler-Optionen</div>

      <div class="dev-row">
        <label class="dev-label">Gold setzen</label>
        <input class="dev-input" id="dev-gold" type="number" value="${resources.gold}" min="0" max="9999999">
        <button class="dev-btn" onclick="devSetGold()">Setzen</button>
      </div>

      <div class="dev-row">
        <label class="dev-label">EP setzen</label>
        <input class="dev-input" id="dev-ep" type="number" value="${experience.points}" min="0" max="9999">
        <button class="dev-btn" onclick="devSetEp()">Setzen</button>
      </div>

      <div class="dev-row">
        <label class="dev-label">Stärke-XP setzen</label>
        <input class="dev-input" id="dev-stxp" type="number" value="${strength.xp}" min="0" max="99999">
        <button class="dev-btn" onclick="devSetStrengthXp()">Setzen</button>
      </div>

      <div class="dev-row">
        <label class="dev-label">HP setzen</label>
        <input class="dev-input" id="dev-hp" type="number" value="${playerStats.hp}" min="1" max="${playerStats.maxHp}">
        <button class="dev-btn" onclick="devSetHp()">Setzen</button>
      </div>

      <div class="dev-row">
        <label class="dev-label">Zeitkristalle</label>
        <input class="dev-input" id="dev-zk" type="number" value="${zeitkristalle}" min="0" max="99">
        <button class="dev-btn" onclick="devSetZeitkristalle()">Setzen</button>
      </div>

      <div class="dev-row">
        <label class="dev-label">Müdigkeit</label>
        <input class="dev-input" id="dev-tiredness" type="number" value="${Math.round(needs.tiredness)}" min="0" max="100">
        <button class="dev-btn" onclick="devSetTiredness()">Setzen</button>
      </div>

      <div class="dev-row">
        <label class="dev-label">Spielzeit</label>
        <button class="dev-btn" onclick="devAdvanceTime(60)">+1h</button>
        <button class="dev-btn" onclick="devAdvanceTime(240)">+4h</button>
        <button class="dev-btn dev-btn-warn" onclick="devJumpToNight()">→ Nacht</button>
      </div>

      <div class="dev-flags">
        <div class="dev-flag-title">Feature-Flags</div>
        ${devFlagToggle('kapitel2Unlocked',    'Kapitel 2 freigeschaltet')}
        ${devFlagToggle('jagdgebietUnlocked',   'Jagdgebiet zugänglich')}
        ${devFlagToggle('automationDiscovered', 'Automatisierung entdeckt')}
        ${devFlagToggle('resetLayerUnlocked',   'Erfahrungs-Tab (EP) sichtbar')}
        ${devFlagToggle('jobUnlocked',          'Arbeitsplatz freigeschaltet')}
        ${devFlagToggle('lehrerUnlocked',       'Lehrhaus freigeschaltet')}
        ${devFlagToggle('resourceGatheringUnlocked', 'Sammelplatz freigeschaltet')}
      </div>

      <div class="dev-row" style="margin-top:12px">
        <button class="dev-btn dev-btn-danger" onclick="devUnlockAll()">Alles freischalten</button>
        <button class="dev-btn dev-btn-danger" onclick="devFullReset()">Hard Reset</button>
      </div>
    </div>
  `;
}

function devFlagToggle(flag, label) {
  const checked = gameFlags[flag] ? 'checked' : '';
  return `
    <label class="dev-flag-row">
      <input type="checkbox" ${checked} onchange="devToggleFlag('${flag}', this.checked)">
      ${label}
    </label>
  `;
}

function devSetGold() {
  const v = parseInt(document.getElementById('dev-gold')?.value);
  if (!isNaN(v)) { resources.gold = Math.max(0, v); render(); }
}
function devSetEp() {
  const v = parseInt(document.getElementById('dev-ep')?.value);
  if (!isNaN(v)) { experience.points = Math.max(0, v); render(); }
}
function devSetStrengthXp() {
  const v = parseInt(document.getElementById('dev-stxp')?.value);
  if (!isNaN(v)) { strength.xp = Math.max(0, v); maybeStrengthLevelUp(); render(); }
}
function devSetHp() {
  const v = parseInt(document.getElementById('dev-hp')?.value);
  if (!isNaN(v)) { playerStats.hp = Math.max(1, Math.min(v, playerStats.maxHp)); render(); }
}
function devSetZeitkristalle() {
  const v = parseInt(document.getElementById('dev-zk')?.value);
  if (!isNaN(v)) {
    zeitkristalle = Math.max(0, v);
    if (v > 0 && !gameFlags.automationDiscovered) {
      gameFlags.automationDiscovered = true;
      navUnseen.automation = true;
    }
    render();
  }
}
function devSetTiredness() {
  const v = parseInt(document.getElementById('dev-tiredness')?.value);
  if (!isNaN(v)) { needs.tiredness = Math.max(0, Math.min(100, v)); render(); }
}
function devAdvanceTime(minutes) {
  advanceClock(minutes);
  render();
}
function devJumpToNight() {
  gameClock.hour   = NIGHT_START_HOUR;
  gameClock.minute = 0;
  render();
}
function devToggleFlag(flag, value) {
  gameFlags[flag] = value;
  if (flag === 'automationDiscovered' && value) navUnseen.automation = true;
  if (flag === 'jagdgebietUnlocked'   && value) navUnseen.jagdgebiet = true;
  render();
}
function devUnlockAll() {
  gameFlags.kapitel2Unlocked     = true;
  gameFlags.jagdgebietUnlocked   = true;
  gameFlags.automationDiscovered = true;
  gameFlags.resetLayerUnlocked   = true;
  gameFlags.jobUnlocked          = true;
  gameFlags.lehrerUnlocked       = true;
  gameFlags.resourceGatheringUnlocked = true;
  gameFlags.firstSleepTriggered  = true;
  gameFlags.hungerDialogShown    = true;
  gameFlags.firstNightDialogShown = true;
  navUnseen.automation = true;
  navUnseen.jagdgebiet = true;
  resources.gold = Math.max(resources.gold, 500);
  experience.points = Math.max(experience.points, 50);
  strength.xp = Math.max(strength.xp, 30);
  playerStats.maxHp = getPlayerMaxHp();
  playerStats.hp    = playerStats.maxHp;
  zeitkristalle = Math.max(zeitkristalle, 3);
  showToast('🛠 Alle Features freigeschaltet.', 'event');
  render();
}
function devFullReset() {
  if (!confirm('Spielstand wirklich vollständig zurücksetzen?')) return;
  performHardReset();
}
