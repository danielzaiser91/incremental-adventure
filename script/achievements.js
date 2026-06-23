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
  /* ── Erstes Kapitel (layer 0) ─────────────────────────────── */
  {
    id: 'firstWork', cat: ACH_CAT.NORMAL, layer: 0, icon: '⚒', name: 'Erste Schwielen',
    desc: 'Erreiche Stufe 1 in der Feldarbeit.',
    check: () => getWorkLevel(workStats.count) >= 1,
    bonusMult: 0.05
  },
  {
    id: 'workExperienced', cat: ACH_CAT.NORMAL, layer: 0, icon: '💪', name: 'Durchgehalten',
    desc: 'Absolviere zehn Feldarbeiten und erreiche Stufe 2.',
    check: () => getWorkLevel(workStats.count) >= 2,
    bonusMult: 0.05
  },
  {
    id: 'firstHunger', cat: ACH_CAT.NORMAL, layer: 0, icon: '🍽', name: 'Kein Mittagessen',
    desc: 'Hunger dich bis an die Grenze — und mach trotzdem weiter.',
    check: () => !!gameFlags.hungerDialogShown
  },
  {
    id: 'firstSleep', cat: ACH_CAT.NORMAL, layer: 0, icon: '🛌', name: 'Erste Rast',
    desc: 'Schlafe zum ersten Mal in Treutheim.',
    check: () => !!gameFlags.firstSleepTriggered
  },
  {
    id: 'foremanTrust', cat: ACH_CAT.NORMAL, layer: 0, icon: '🤝', name: 'Ein gutes Wort',
    desc: 'Gewinne das Vertrauen des Vorarbeiters.',
    check: () => quests.foremanRaise.state === QUEST_STATE.REWARDED,
    bonusMult: 0.05
  },
  {
    id: 'kraemerinDone', cat: ACH_CAT.NORMAL, layer: 0, icon: '🧺', name: 'Geschäftspartner',
    desc: 'Hilf Greta, ihr Sortiment zu erweitern.',
    check: () => quests.kraemerinBusiness.state === QUEST_STATE.REWARDED,
    bonusMult: 0.05
  },
  {
    id: 'strangerEye', cat: ACH_CAT.NORMAL, layer: 0, icon: '👁', name: 'Fremder Blick',
    desc: 'Spüre, dass jemand deine Fortschritte beobachtet.',
    check: () => !!gameFlags.milestoneStrangerTriggered
  },
  {
    id: 'robberyVictim', cat: ACH_CAT.NORMAL, layer: 0, icon: '💸', name: 'Der Preis des Fortschritts',
    desc: 'Erlebe den Raub — und fange trotzdem wieder an.',
    check: () => !!gameFlags.robberyTriggered,
    bonusMult: 0.05
  },
  {
    id: 'nightWatchDone', cat: ACH_CAT.NORMAL, layer: 0, icon: '🌙', name: 'Wachsamer Geist',
    desc: 'Schließe die Nachtwache für Brakka ab.',
    check: () => quests.nightWatch.state === QUEST_STATE.REWARDED,
    bonusMult: 0.05
  },
  {
    id: 'firstHundredGold', cat: ACH_CAT.NORMAL, layer: 0, icon: '💰', name: 'Erste Hundert',
    desc: 'Verdiene im Laufe deines Lebens insgesamt 100 Gold.',
    check: () => resources.totalGoldEarned >= 100,
    bonusMult: 0.05
  },
  {
    id: 'streetCat', cat: ACH_CAT.SECRET, layer: 0, icon: '🐈', name: 'Eine stille Freundschaft',
    desc: 'Gewinne über mehrere Nächte das Vertrauen eines streunenden Straßentiers.',
    hint: 'Manche Freundschaften brauchen Geduld — und ein paar kalte, schlaflose Nächte.',
    check: () => !!pets.streetCat,
    bonusMult: 0.10
  },

  /* ── Erfahrungs-Weg (layer 1) ────────────────────────────── */
  {
    id: 'firstReset', cat: ACH_CAT.NORMAL, layer: 1, icon: '✦', name: 'Ein neuer Anfang',
    desc: 'Beginne zum ersten Mal ganz von vorn.',
    check: () => meta.resets >= 1,
    bonusMult: 0.10
  },
  {
    id: 'threeResets', cat: ACH_CAT.NORMAL, layer: 1, icon: '✦', name: 'Dritter Anlauf',
    desc: 'Beginne dreimal von vorn.',
    check: () => meta.resets >= 3,
    bonusMult: 0.05
  },
  {
    id: 'fiveResets', cat: ACH_CAT.NORMAL, layer: 1, icon: '✦', name: 'Fünfter Anlauf',
    desc: 'Beginne fünfmal von vorn.',
    check: () => meta.resets >= 5,
    bonusMult: 0.05
  },
  {
    id: 'tenResets', cat: ACH_CAT.NORMAL, layer: 1, icon: '✦✦', name: 'Zehnter Anlauf',
    desc: 'Beginne zehnmal von vorn.',
    check: () => meta.resets >= 10,
    bonusMult: 0.10
  },
  {
    id: 'thriftMaster', cat: ACH_CAT.NORMAL, layer: 1, icon: '🪙', name: 'Geschäftssinn',
    desc: 'Erlerne die Sparsamkeit vollständig (Stufe 2).',
    check: () => getSkillLevel(SKILL_ID.THRIFT) >= 2,
    bonusMult: 0.05
  },
  {
    id: 'superSkillEarned', cat: ACH_CAT.NORMAL, layer: 1, icon: '🎓', name: 'Meisterschüler',
    desc: 'Erlerne eine Super-Fähigkeit unter der Führung eines Lehrmeisters.',
    check: () => Object.keys(superSkills).length >= 1,
    bonusMult: 0.05
  },
  {
    id: 'threeSuperSkills', cat: ACH_CAT.NORMAL, layer: 1, icon: '🎓', name: 'Dreifach übertroffen',
    desc: 'Erlerne drei Super-Fähigkeiten.',
    check: () => Object.keys(superSkills).length >= 3,
    bonusMult: 0.10
  },
  {
    id: 'workLevel3', cat: ACH_CAT.NORMAL, layer: 1, icon: '⚒', name: 'Erfahrener Feldarbeiter',
    desc: 'Absolviere fünfzig Feldarbeiten in einem einzigen Kapitel.',
    check: () => getWorkLevel(workStats.count) >= 3,
    bonusMult: 0.05
  },
  {
    id: 'nightWatchVet', cat: ACH_CAT.NORMAL, layer: 1, icon: '🌒', name: 'Nacht-Veteran',
    desc: 'Absolviere fünfzehn Nachtwachen.',
    check: () => nightWatchStats.count >= 15,
    bonusMult: 0.05
  },
  {
    id: 'totalGold500', cat: ACH_CAT.NORMAL, layer: 1, icon: '💰', name: 'Fünfhundert',
    desc: 'Verdiene im Laufe deines Lebens insgesamt 500 Gold.',
    check: () => resources.totalGoldEarned >= 500,
    bonusMult: 0.05
  },
  {
    id: 'totalGold2000', cat: ACH_CAT.NORMAL, layer: 1, icon: '💰', name: 'Goldener Weg',
    desc: 'Verdiene im Laufe deines Lebens insgesamt 2000 Gold.',
    check: () => resources.totalGoldEarned >= 2000,
    bonusMult: 0.10
  },
  {
    id: 'kapitel2Reached', cat: ACH_CAT.NORMAL, layer: 1, icon: '🛡', name: 'Gildenmitglied',
    desc: 'Tritt der Abenteurergilde in Treutheim bei.',
    check: () => !!gameFlags.kapitel2Unlocked,
    bonusMult: 0.10
  },
  {
    id: 'miraLetterDone', cat: ACH_CAT.NORMAL, layer: 1, icon: '💌', name: 'Miras Botschaft',
    desc: 'Übermittle Miras Brief und erfahre, was dahintersteckt.',
    check: () => quests.miraLetter.state === QUEST_STATE.REWARDED
  },
  {
    id: 'waldtrollSlayer', cat: ACH_CAT.NORMAL, layer: 1, icon: '🪓', name: 'Waldtroll-Bezwinger',
    desc: 'Besiege den Waldtroll im tiefen Jagdgebiet.',
    check: () => !!gameFlags.waldtrollKilled,
    bonusMult: 0.05
  },
  {
    id: 'fremderFaced', cat: ACH_CAT.NORMAL, layer: 1, icon: '⚔', name: 'Auge in Auge',
    desc: 'Stelle den Dieb und konfrontiere ihn mit der Wahrheit.',
    check: () => !!gameFlags.fremderConfronted,
    bonusMult: 0.05
  },
  {
    id: 'guildReady', cat: ACH_CAT.NORMAL, layer: 1, icon: '⚔', name: 'Bereit für die Gilde',
    desc: 'Schließe die Vorbereitung auf die Abenteurergilde ab.',
    check: () => quests.guildRegistration.state === QUEST_STATE.REWARDED,
    bonusMult: 0.10
  },
  {
    id: 'guildPrepDone', cat: ACH_CAT.NORMAL, layer: 1, icon: '📜', name: 'Gildenvorbereitung',
    desc: 'Schalte die Fähigkeit "Vorbereitung auf die Gilde" im Erfahrungs-Baum frei.',
    check: () => getSkillLevel('guildPrep') >= 1,
    bonusMult: 0.05
  },
  {
    id: 'fullPackReset', cat: ACH_CAT.NORMAL, layer: 1, icon: '🎒', name: 'Vollgepackt',
    desc: 'Überstehe einen Neuanfang mit vollem Inventar.',
    check: () => !!gameFlags.fullInventoryReset
  },
  {
    id: 'lethkarReached', cat: ACH_CAT.NORMAL, layer: 1, icon: '🗺', name: 'Aufbruch',
    desc: 'Verlasse Treutheim hinter dir und ziehe nach Lethkar weiter.',
    check: () => !!gameFlags.lethkarUnlocked,
    bonusMult: 0.05
  },
  {
    id: 'chapter2Complete', cat: ACH_CAT.NORMAL, layer: 1, icon: '🏆', name: 'Chroniken des vergessenen Weges',
    desc: 'Kapitel 1 und 2 vollständig abgeschlossen — die Wahrheit hinter dem Raub enthüllt.',
    check: () => gameFlags.chapter2Complete,
    bonusMult: 0.15
  },
  {
    id: 'imSchatten', cat: ACH_CAT.SECRET, layer: 1, icon: '🔍', name: 'Im Schatten',
    desc: 'Du hast ihn fünfmal angesprochen, bevor du wusstest, wer er wirklich ist.',
    hint: 'Manchmal sitzt die Antwort die ganze Zeit im selben Raum wie die Frage.',
    check: () => npcFlags.fremderTalkCount >= 5,
    bonusMult: 0.10
  }
];

/**
 * Multiplikativer Gold-Bonus: Normaler Pool und Geheim-Pool werden getrennt berechnet,
 * weil es weniger Geheim-Errungenschaften gibt — jede zählt dreifach.
 * Rückgabe: kombinierter Multiplikator (z.B. 1.5 = +50% Gold).
 *
 * "Multiplikativ" = jede neue Errungenschaft multipliziert den bisherigen Bonus,
 * statt ihn aufzuaddieren — späte Errungenschaften haben damit genau so viel
 * relativen Einfluss wie frühe.
 */
function getAchievementGoldMult() {
  const normalMult = ACHIEVEMENT_DEFS
    .filter(d => d.bonusMult && d.cat === ACH_CAT.NORMAL && achievements[d.id])
    .reduce((acc, d) => acc * (1 + d.bonusMult), 1.0);
  // Geheime Errungenschaften: dreifacher Faktor, da weniger davon existieren
  const secretMult = ACHIEVEMENT_DEFS
    .filter(d => d.bonusMult && d.cat === ACH_CAT.SECRET && achievements[d.id])
    .reduce((acc, d) => acc * (1 + d.bonusMult * 3), 1.0);
  return normalMult * secretMult;
}

/** Bonus-Anteil als Bruch (für Rückwärts-Compat. und Anzeige: 0.5 = +50%). */
function getAchievementGoldBonus() {
  return getAchievementGoldMult() - 1;
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
    const prefix = def.cat === ACH_CAT.SECRET ? '🏆 Geheime Errungenschaft' : '🏆 Errungenschaft';
    showToast(`${prefix} freigeschaltet: ${def.name}`, TOAST.EVENT);
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

  if (def.cat === ACH_CAT.SECRET && !unlocked) {
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

  let bonusText = '';
  if (def.bonusMult && unlocked) {
    const isSecret = def.cat === ACH_CAT.SECRET;
    const factor = isSecret ? def.bonusMult * 3 : def.bonusMult;
    bonusText = `<div class="action-card-effect">×${(1 + factor).toFixed(2)} Gold${isSecret ? ' (Geheim)' : ''} — multiplikativ</div>`;
  }

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
  const normalDefs = ACHIEVEMENT_DEFS.filter(d => d.cat === ACH_CAT.NORMAL);
  const secretDefs = ACHIEVEMENT_DEFS.filter(d => d.cat === ACH_CAT.SECRET);
  const normalCount = normalDefs.filter(d => achievements[d.id]).length;
  const secretCount = secretDefs.filter(d => achievements[d.id]).length;

  const totalMult = getAchievementGoldMult();
  const normalMult = ACHIEVEMENT_DEFS
    .filter(d => d.bonusMult && d.cat === ACH_CAT.NORMAL && achievements[d.id])
    .reduce((acc, d) => acc * (1 + d.bonusMult), 1.0);
  const secretMult = ACHIEVEMENT_DEFS
    .filter(d => d.bonusMult && d.cat === ACH_CAT.SECRET && achievements[d.id])
    .reduce((acc, d) => acc * (1 + d.bonusMult * 3), 1.0);
  const bonusSummaryHtml = totalMult > 1
    ? `<div class="achievement-bonus-bar">
         ✦ Goldbonus: <strong>+${Math.round((totalMult - 1) * 100)}% auf alle Einnahmen</strong>
         <span class="achievement-bonus-detail">Errungenschaften ×${normalMult.toFixed(2)} · Geheim ×${secretMult.toFixed(2)}</span>
       </div>`
    : '';

  if (achievementTab === ACH_CAT.SECRET) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Errungenschaften</div>
        ${bonusSummaryHtml}
        <div class="tab-bar">
          <button class="tab-btn" onclick="setAchievementTab('${ACH_CAT.NORMAL}')">Allgemein (${normalCount}/${normalDefs.length})</button>
          <button class="tab-btn active" onclick="setAchievementTab('${ACH_CAT.SECRET}')">Geheim (${secretCount}/${secretDefs.length})</button>
        </div>
        <div class="tab-panel">
          <div class="action-grid">${secretDefs.map(achievementCardHtml).join('')}</div>
        </div>
      </div>`;
    return;
  }

  // "Allgemein"-Tab: Abschnitte pro Layer
  const LAYER_LABELS  = { 0: 'Erstes Kapitel', 1: 'Erfahrungs-Weg' };
  const layerVisible  = { 0: true, 1: meta.resets >= 1 || normalDefs.filter(d => d.layer === 1).some(d => achievements[d.id]) };

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
        <button class="tab-btn active" onclick="setAchievementTab('${ACH_CAT.NORMAL}')">Allgemein (${normalCount}/${normalDefs.length})</button>
        <button class="tab-btn" onclick="setAchievementTab('${ACH_CAT.SECRET}')">Geheim (${secretCount}/${secretDefs.length})</button>
      </div>
      <div class="tab-panel">${layerSections}</div>
    </div>`;
}
