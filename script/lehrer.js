/* ══════════════════════════════════════════════════════════════
   lehrer.js — Das Lehrhaus: Super-Skill-Freischaltungen
   Verfügbar, sobald Oswin in der Taverne auf die Lehrmeisterin
   hingewiesen hat (gameFlags.lehrerUnlocked).
   ══════════════════════════════════════════════════════════════ */

'use strict';

/** Gibt den Super-Skill-Def zurück, der für einen gegebenen Skill-ID
    freigeschaltet werden kann — nur wenn der Basis-Skill auf Maximum ist
    UND der Super-Skill noch nicht erworben wurde. */
function getAvailableSuperDef(superSkillId) {
  return SUPER_SKILL_DEFS.find(d => d.id === superSkillId);
}

/** Schließt eine Super-Skill-Quest ab und schaltet den Super-Skill frei. */
function completeSuperSkillQuest(id) {
  const def = SUPER_SKILL_DEFS.find(d => d.id === id);
  if (!def || !def.questDone()) return;
  if (superSkills[id]) return;

  superSkills[id] = true;
  navUnseen.lehrer = true;
  showToast(`${def.icon} Lehrmeisterschaft erworben: ${def.name}`, 'event');
  render();
}

/* ── Lehrhaus-Seite ──────────────────────────────────────── */
function renderLehrer(el) {
  // Welche Super-Skills sind gerade relevant (Basis-Skill auf Max, noch nicht erworben)?
  const available = SUPER_SKILL_DEFS.filter(def => {
    const node = EP_SKILL_TREE.find(n => n.id === def.forSkill);
    return node && getSkillLevel(def.forSkill) >= node.maxLevel;
  });

  const completedCards = SUPER_SKILL_DEFS.filter(def => superSkills[def.id]).map(def => `
    <div class="action-card quest-card-done">
      <div class="action-card-icon">${def.icon}</div>
      <div class="action-card-name">${def.name}</div>
      <div class="action-card-effect">${def.shortDesc}</div>
      <div class="quest-status quest-status-done">Erworben ✓</div>
    </div>`).join('');

  const availableCards = available.filter(def => !superSkills[def.id]).map(def => {
    const done = def.questDone();
    return `
    <div class="action-card">
      <div class="action-card-icon">${def.icon}</div>
      <div class="action-card-name">${def.name}</div>
      <div class="action-card-effect">${def.shortDesc}</div>
      <div class="lehrer-quest-desc">${def.questDesc}</div>
      <div class="lehrer-quest-progress ${done ? 'lehrer-quest-done' : ''}">${def.questProgress()}</div>
      <button class="action-btn ${done ? '' : 'btn-disabled'}"
        onclick="completeSuperSkillQuest('${def.id}')"
        ${done ? '' : 'disabled'}>
        ${done ? 'Können beweisen ✓' : 'Aufgabe noch nicht erfüllt'}
      </button>
      <div class="quest-status ${done ? 'quest-status-done' : 'quest-status-active'}">
        ${done ? 'Bereit zum Abschluss' : 'In Bearbeitung'}
      </div>
    </div>`;
  }).join('');

  const lockedDefs = SUPER_SKILL_DEFS.filter(def => {
    const node = EP_SKILL_TREE.find(n => n.id === def.forSkill);
    return node && getSkillLevel(def.forSkill) < node.maxLevel && !superSkills[def.id];
  }).map(def => {
    const node = EP_SKILL_TREE.find(n => n.id === def.forSkill);
    return `
    <div class="action-card action-card-locked">
      <div class="action-card-icon">❔</div>
      <div class="action-card-name">${def.name}</div>
      <div class="action-card-hint">Erfordert "${node.name}" auf Maximalstufe</div>
    </div>`;
  }).join('');

  const nothingAvailable = !available.some(d => !superSkills[d.id]) && !SUPER_SKILL_DEFS.some(d => superSkills[d.id]);

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Das Lehrhaus</div>
      <p class="location-card-desc">
        Die Lehrmeisterin nimmt keine Anfänger an. Wer ihr zeigt, dass er das Fundament beherrscht,
        dem offenbart sie, was dahinter liegt.
      </p>

      ${completedCards ? `
        <div class="market-section-label">Erworben</div>
        <div class="action-grid">${completedCards}</div>
      ` : ''}

      ${availableCards ? `
        <div class="market-section-label">Verfügbar</div>
        <div class="action-grid">${availableCards}</div>
      ` : ''}

      ${lockedDefs ? `
        <div class="market-section-label">Gesperrt</div>
        <div class="action-grid">${lockedDefs}</div>
      ` : ''}

      ${nothingAvailable ? `
        <p class="chronik-empty" style="margin-top: 16px;">
          Noch keine Fähigkeit vollständig erlernt. Kehre zurück, wenn du weiter bist.
        </p>
      ` : ''}
    </div>
  `;
}
