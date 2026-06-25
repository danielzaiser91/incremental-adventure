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
  showToast('🛠 Entwickler-Modus aktiviert. Einstellungen → Dev-Panel.', TOAST.EVENT);
  render();
};

/** Lauscht auf die Tastenkombination "daniel" (ohne Eingabefeld), wenn
    man sich auf der Einstellungs-Seite befindet — aktiviert den Dev-Modus. */
function setupDevKeyListener() {
  let buf = '';
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (currentContent !== CONTENT.SETTINGS) { buf = ''; return; }
    buf += e.key.toLowerCase();
    if (buf.length > 6) buf = buf.slice(-6);
    if (buf === 'daniel') {
      buf = '';
      if (!gameFlags.devModeEnabled) devMode();
    }
  });
}

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

      <div class="dev-presets">
        <div class="dev-flag-title">Spielstand-Vorlagen (Balancing-Tests)</div>
        <div class="dev-row">
          <button class="dev-btn dev-btn-warn" onclick="devLoadPreset('kap3')">▶ Start Kapitel 3</button>
          <button class="dev-btn dev-btn-warn" onclick="devLoadPreset('kap4')">▶ Start Kapitel 4</button>
          <button class="dev-btn dev-btn-warn" onclick="devLoadPreset('finale')">▶ Vor Finale</button>
        </div>

        <div class="dev-test-zone-header">
          <span>🧪 Test-Zone</span>
          <div class="dev-test-slot-btns">
            <button class="dev-btn" onclick="devSaveTestSlot()" title="Echten Spielstand sichern (vor dem Testen)">💾 Backup sichern</button>
            <button class="dev-btn" onclick="devLoadTestSlot()" title="Gesicherter Spielstand wiederherstellen">↩ Backup laden</button>
          </div>
        </div>

        <div class="dev-test-guide">

          <div class="dev-test-block">
            <div class="dev-test-title">📋 Kap 3 — Balancing testen</div>
            <ul class="dev-test-summary">
              <li>Wie lange, bis du dir das <b>Alchemisten-Werkzeug</b> leisten kannst?
                <details><summary>Wie geht das?</summary><span>Backup sichern → „▶ Start Kapitel 3" laden → Navigation oben → <b>Weltkarte</b> → <b>Lethkar</b> → <b>Marktplatz</b> → Alchemisten-Händler öffnen. Notiere den Preis des Werkzeugs, schau rechts auf dein Gold.</span></details>
              </li>
              <li>Wie viel Gold verdienst du in <b>10 Minuten</b> Spielzeit?
                <details><summary>Wie geht das?</summary><span>Weltkarte → Lethkar → <b>Arbeitsplatz</b>. Starte eine Uhr. Klicke verfügbare Aktionen (Wildkraut, Feldarbeit, Alchemie) und starte jede direkt neu wenn sie fertig ist. Nach 10 Min: Gold-Anzeige rechts ablesen.</span></details>
              </li>
              <li>Wirken die <b>Essenspreise</b> fair gegenüber deinem Verdienst?
                <details><summary>Wie geht das?</summary><span>Marktplatz → Lebensmittel-Händler öffnen. Preise von Brot, Suppe etc. mit deinem Gold/10min vergleichen.</span></details>
              </li>
            </ul>
            <div class="dev-test-feedback">💬 Feedback:<br>
              <code>Kap3: Werkzeug [sofort / nach ~X Min] | Gold/10min: ~[X] | Essen: [fair/teuer/billig]</code>
            </div>
          </div>

          <div class="dev-test-block">
            <div class="dev-test-title">📋 Kap 4 — Balancing testen</div>
            <ul class="dev-test-summary">
              <li>Wie lange dauert es, eine Fraktion auf <b>Ansehen 30</b> zu bringen?
                <details><summary>Wie geht das?</summary><span>Backup sichern → „▶ Start Kapitel 4" laden → Weltkarte → <b>Velmark</b>. Du siehst drei Fraktionen mit Fortschrittsbalken (0–100). Wähle eine aus und starte immer wieder ihre Aktionen. Zeit stoppen bis Balken auf 30.</span></details>
              </li>
              <li>Wie lange dauert es weiter bis <b>Ansehen 80</b>?
                <details><summary>Wie geht das?</summary><span>Gleiche Fraktion weiterspielen bis 80. Gesamtzeit notieren.</span></details>
              </li>
              <li>Wie viel <b>Einfluss ⚜</b> hast du nach 20 Minuten — reicht das?
                <details><summary>Wie geht das?</summary><span>Einfluss ⚜ steht rechts in der Statusleiste. Nach 20 Min ablesen. Schau ob du dir Aktionen leisten kannst (deren Kosten stehen auf den Aktions-Karten).</span></details>
              </li>
              <li>10.000 Gold Start — <b>zu viel / zu wenig / passend</b>?</li>
            </ul>
            <div class="dev-test-feedback">💬 Feedback:<br>
              <code>Kap4: Fraktion →30: [X] Min | →80: [X] Min | Einfluss/20min: ~[X] | Gold-Start: [zu viel/wenig/ok]</code>
            </div>
          </div>

          <div class="dev-test-block">
            <div class="dev-test-title">📋 Vor Finale — Story &amp; Bugs testen</div>
            <ul class="dev-test-summary">
              <li>Beide Endungen (<b>Gericht</b> + <b>Exil</b>) komplett durchspielen — hängt etwas?
                <details><summary>Wie geht das?</summary><span>Backup sichern → „▶ Vor Finale" laden → Navigation oben → <b>Quests</b> → Quest „Die Konfrontation" starten. Dialog Seite für Seite durchklicken. Beim ersten Durchgang Richtung <b>Gericht</b> wählen. Danach <b>Backup laden</b> und nochmal, diesmal <b>Exil</b>.</span></details>
              </li>
              <li>Erscheinen am Ende <b>Konfetti</b> und eine <b>Errungenschaft</b>?
                <details><summary>Wo schauen?</summary><span>Konfetti erscheint groß auf dem Bildschirm. Errungenschaft kommt als Popup oben rechts oder direkt nach dem Dialog. Falls beides ausbleibt, bitte notieren.</span></details>
              </li>
              <li>Gibt es Dialog-Stellen, die sich <b>seltsam oder unfertig</b> anfühlen?</li>
            </ul>
            <div class="dev-test-feedback">💬 Feedback:<br>
              <code>Finale: Gericht [ok / Bug: ...] | Exil [ok / Bug: ...] | Konfetti [ja/nein] | Auffälligkeiten: [...]</code>
            </div>
          </div>

        </div>
      </div>

      <div class="dev-row" style="margin-top:8px">
        <label class="dev-label">Changelog</label>
        <span style="font-size:0.85em">v</span>
        <select class="dev-input" id="dev-cl-from" style="width:52px">
          ${Array.from({length: CURRENT_SAVE_VERSION}, (_, i) => `<option value="${i}"${i === 0 ? ' selected' : ''}>v${i}</option>`).join('')}
        </select>
        <span style="font-size:0.85em">→ v</span>
        <select class="dev-input" id="dev-cl-to" style="width:52px">
          ${Array.from({length: CURRENT_SAVE_VERSION}, (_, i) => `<option value="${i+1}"${i+1 === CURRENT_SAVE_VERSION ? ' selected' : ''}>v${i+1}</option>`).join('')}
        </select>
        <button class="dev-btn" onclick="devShowChangelog()">Anzeigen</button>
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
  showToast('🛠 Alle Features freigeschaltet.', TOAST.EVENT);
  render();
}
function devFullReset() {
  if (!confirm('Spielstand wirklich vollständig zurücksetzen?')) return;
  performHardReset();
}

function devLoadPreset(preset) {
  if (!confirm(`Spielstand auf Vorlage "${preset}" setzen? Aktueller Stand wird überschrieben.`)) return;

  // ── Gemeinsame Basis: Kap1 + Kap2 komplett ───────────────
  function baseKap2() {
    // Flags
    Object.assign(gameFlags, {
      jobUnlocked: true, firstSleepTriggered: true, hungerDialogShown: true,
      firstNightDialogShown: true, resourceGatheringUnlocked: true,
      lehrerUnlocked: true, resetLayerUnlocked: true,
      kapitel2Unlocked: true, jagdgebietUnlocked: true,
      automationDiscovered: true, waffenschmiedRejected: true,
      stadtwacheAccepted: true, mirasBriefGiven: true,
      fremderIdentityKnown: true, kampfTrainingDone: true,
      kapitel2FinaleStarted: true,
    });
    navUnseen.automation = false; navUnseen.jagdgebiet = false;
    // Ressourcen
    resources.gold = 500; needs.hunger = 20; needs.tiredness = 10;
    playerStats.maxHp = 120; playerStats.hp = 120;
    strength.xp = 200; experience.points = 30;
    zeitkristalle = 3; mut.points = 5; mut.totalEarned = 5;
    // Quests Kap1+2 auf rewarded
    const r = QUEST_STATE.REWARDED;
    quests.nightWatch      = { state: r };
    quests.oswinsAuftrag   = { state: r };
    quests.erstesZuhause   = { state: r };
    quests.gildePruefung   = { state: r };
    quests.fremderGeheimnis = { state: r, stufe: 3 };
    quests.miraSuche       = { state: r };
    quests.kampfRoutine    = { state: r };
    quests.waldtrollJagd   = { state: r };
    quests.gildaAufstieg   = { state: r };
    quests.brennenderMut   = { state: r };
    quests.kapitel2Finale  = { state: r };
    gameFlags.consecutiveNightwatch = 0;
    storyState = 20901; // Ende Kap 2
  }

  if (preset === 'kap3') {
    baseKap2();
    gameFlags.lethkarUnlocked    = true;
    gameFlags.mirasBriefDecoded  = false; // Lethkar-Einstieg: Brief noch nicht entschlüsselt
    resources.gold = 2000;
    storyState = 30100;
    showToast('🛠 Vorlage geladen: Start Kapitel 3 (Lethkar)', TOAST.EVENT);
  }

  if (preset === 'kap4') {
    baseKap2();
    Object.assign(gameFlags, {
      lethkarUnlocked: true, mirasBriefDecoded: true,
      varenaMetFirst: true, thessaMetFirst: true, perethMetFirst: true,
      varenaDecodedBrief: true, thessaTrustGained: true,
      perethQuestStarted: true, lagerhausVisited: true,
      chapter3StoryComplete: true, valdrisOperationRaided: true,
      varenaRevealedValdrisIdent: true, alchemieGeselleReached: true,
      kap3Complete: true, velmarkUnlocked: true,
      valdrisSpurenGefunden: true, perethKontaktLethkar: true,
      perethFoundInVelmark: true, informantenNetzFreigeschaltet: true,
      hafenarbeitUnlocked: true, harroMet: true,
      gildekontaktGeknuepft: true, bruderschaftkontaktGeknuepft: true,
      archivkontaktGeknuepft: true,
    });
    const r = QUEST_STATE.REWARDED;
    quests.varenaErstkontakt  = { state: r };
    quests.alchemieInitiierung = { state: r };
    quests.thessaGeheimnis    = { state: r, gespraeche: 3 };
    quests.tier2Boss          = { state: r };
    quests.wissensdurst10     = { state: r };
    quests.valdrisSpuren      = { state: r, orte: 3 };
    quests.lethkarMarkt       = { state: r };
    quests.perethKontakt      = { state: r };
    quests.alchemieGeselle    = { state: r };
    quests.kapitel3Abschluss  = { state: r };
    quests.gildeSchulden      = { state: r };
    mut.points = 8; mut.totalEarned = 8;
    einfluss.points = 50; einfluss.totalEarned = 50;
    fraktionen.haendlergilde = 10; fraktionen.bruderschaft = 10; fraktionen.archiv = 10;
    resources.gold = 10000;
    storyState = 40100;
    showToast('🛠 Vorlage geladen: Start Kapitel 4 (Velmark)', TOAST.EVENT);
  }

  if (preset === 'finale') {
    devLoadPreset('kap4'); // Basis laden (rekursiv), dann überschreiben
    Object.assign(gameFlags, {
      gildekontaktGeknuepft: true, bruderschaftkontaktGeknuepft: true, archivkontaktGeknuepft: true,
      ersteAllianzGeknuepft: true, valdrisBriefErhalten: true,
      zweiAllianzGekuepft: true, valdrisAngebotGemacht: true, valdrisAngebotAbgelehnt: true,
      allianzKomplett: true, velmarkStadtwacheUnlocked: true,
      archivDurchsuchenUnlocked: true, unterweltVerhandlungUnlocked: true,
      gorrsEidGeleistet: true, harroSchuldenBezahlt: true,
      gorrMet: true, seleMet: true, yevaMetFirst: true,
      valdrisDokumentGefunden: true,
      // Valdris-Profil komplett aufgedeckt
      valdrisProfilHerkunft: true, valdrisProfilNetzwerk: true,
      valdrisProfilMotive: true, valdrisProfilKontakte: true,
      valdrisProfilSchwaeche: true, valdrisProfilAufenthaltsort: true,
    });
    const r = QUEST_STATE.REWARDED;
    quests.gildeInvestition   = { state: r };
    quests.gildeKorruption    = { state: r };
    quests.bruderschaftBeweis = { state: r };
    quests.gorrsVergangenheit = { state: r };
    quests.gorrsEid           = { state: r };
    quests.archivRecherche    = { state: r };
    quests.seleWissen         = { state: r };
    quests.dasDokument        = { state: r };
    quests.dieKonfrontation   = { state: QUEST_STATE.ACTIVE };
    fraktionen.haendlergilde = 80; fraktionen.bruderschaft = 80; fraktionen.archiv = 80;
    einfluss.points = 300; einfluss.totalEarned = 300;
    resources.gold = 25000;
    storyState = 40900;
    showToast('🛠 Vorlage geladen: Vor Valdris-Finale', TOAST.EVENT);
    return; // rekursiver Aufruf hat bereits render() via baseKap2 nicht aufgerufen
  }

  saveGame();
  render();
}

const DEV_TEST_SLOT = 'chronicles_dev_test_slot';

function devSaveTestSlot() {
  const current = localStorage.getItem(SAVE_KEY);
  if (!current) { showToast('Kein Spielstand vorhanden.', TOAST.ERROR); return; }
  localStorage.setItem(DEV_TEST_SLOT, current);
  showToast('💾 Backup gesichert — Spielstand vor dem Test gespeichert.', TOAST.EVENT);
}

function devLoadTestSlot() {
  const slot = localStorage.getItem(DEV_TEST_SLOT);
  if (!slot) { showToast('Kein Backup vorhanden — zuerst sichern.', TOAST.ERROR); return; }
  if (!confirm('Backup laden? Spielstand wird auf den gesicherten Stand zurückgesetzt.')) return;
  localStorage.setItem(SAVE_KEY, slot);
  location.reload();
}

function devShowChangelog() {
  const from = parseInt(document.getElementById('dev-cl-from')?.value ?? 0);
  const to   = parseInt(document.getElementById('dev-cl-to')?.value ?? CURRENT_SAVE_VERSION);
  if (from >= to) { showToast('Von-Version muss kleiner als Bis-Version sein.', TOAST.ERROR); return; }
  showSaveChangelogDialog(from, [], to, true);
}
