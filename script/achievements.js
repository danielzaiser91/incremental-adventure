/* ══════════════════════════════════════════════════════════════
   achievements.js — Errungenschaften: allgemeine + geheime Kategorie
   Layer-Struktur:
     0 = Treutheim (Kap 1, immer sichtbar)
     1 = Erfahrungs-Weg (Meta-Progression durch Resets)
     2 = Kap. 2 (Die Spur des Diebs)
     3 = Lethkar (Wissensdurst)
     4 = Velmark (Einfluss)
   Geheime Achievements: cat === ACH_CAT.SECRET, tauchen nur im Geheim-Tab auf.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const LAYER_LABELS = { 0: 'Treutheim', 1: 'Erfahrungs-Weg', 2: 'Kap. 2', 3: 'Lethkar', 4: 'Velmark' };

const ACHIEVEMENT_DEFS = [
  /* ── Treutheim / Kap 1 (layer 0) ─────────────────────────── */
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
    desc: 'Fünfzig Feldarbeiten in einem einzigen Anlauf absolvieren.',
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
  // 6 neue Layer-1-Achievements
  {
    id: 'totalGold5000', cat: ACH_CAT.NORMAL, layer: 1, icon: '💰', name: 'Fünftausend',
    desc: '5.000 Gold insgesamt verdienen.',
    check: () => resources.totalGoldEarned >= 5000,
    bonusMult: 0.05
  },
  {
    id: 'totalGold15000', cat: ACH_CAT.NORMAL, layer: 1, icon: '💰', name: 'Kleines Vermögen',
    desc: '15.000 Gold insgesamt verdienen.',
    check: () => resources.totalGoldEarned >= 15000,
    bonusMult: 0.10
  },
  {
    id: 'fiveSuperSkills', cat: ACH_CAT.NORMAL, layer: 1, icon: '🎓', name: 'Vielseitig ausgebildet',
    desc: 'Fünf Super-Fähigkeiten erlernen.',
    check: () => Object.keys(superSkills).length >= 5,
    bonusMult: 0.05
  },
  {
    id: 'twentyNightWatches', cat: ACH_CAT.NORMAL, layer: 1, icon: '🌒', name: 'Unermüdlicher Wächter',
    desc: 'Zwanzig Nachtwachen absolvieren.',
    check: () => nightWatchStats.count >= 20,
    bonusMult: 0.05
  },
  {
    id: 'twentyResets', cat: ACH_CAT.NORMAL, layer: 1, icon: '✦✦', name: 'Unbeirrt',
    desc: 'Zwanzigmal von vorn beginnen.',
    check: () => meta.resets >= 20,
    bonusMult: 0.10
  },
  {
    id: 'deepHunter', cat: ACH_CAT.NORMAL, layer: 1, icon: '🌲', name: 'Tiefer Jäger',
    desc: 'Tauche ins tiefe Jagdgebiet ein.',
    check: () => !!gameFlags.deepHuntingUnlocked,
    bonusMult: 0.05
  },

  /* ── Kap. 2 (layer 2) ────────────────────────────────────── */
  {
    id: 'kapitel2Reached', cat: ACH_CAT.NORMAL, layer: 2, icon: '🛡', name: 'Gildenmitglied',
    desc: 'Tritt der Abenteurergilde in Treutheim bei.',
    check: () => !!gameFlags.kapitel2Unlocked,
    bonusMult: 0.10
  },
  {
    id: 'miraLetterDone', cat: ACH_CAT.NORMAL, layer: 2, icon: '💌', name: 'Miras Botschaft',
    desc: 'Übermittle Miras Brief und erfahre, was dahintersteckt.',
    check: () => quests.miraLetter.state === QUEST_STATE.REWARDED
  },
  {
    id: 'waldtrollSlayer', cat: ACH_CAT.NORMAL, layer: 2, icon: '🪓', name: 'Waldtroll-Bezwinger',
    desc: 'Besiege den Waldtroll im tiefen Jagdgebiet.',
    check: () => !!gameFlags.waldtrollKilled,
    bonusMult: 0.05
  },
  {
    id: 'fremderFaced', cat: ACH_CAT.NORMAL, layer: 2, icon: '⚔', name: 'Auge in Auge',
    desc: 'Stelle den Dieb und konfrontiere ihn mit der Wahrheit.',
    check: () => !!gameFlags.fremderConfronted,
    bonusMult: 0.05
  },
  {
    id: 'guildReady', cat: ACH_CAT.NORMAL, layer: 2, icon: '⚔', name: 'Bereit für die Gilde',
    desc: 'Schließe die Vorbereitung auf die Abenteurergilde ab.',
    check: () => quests.guildRegistration.state === QUEST_STATE.REWARDED,
    bonusMult: 0.10
  },
  {
    id: 'chapter2Complete', cat: ACH_CAT.NORMAL, layer: 2, icon: '🏆', name: 'Chroniken des vergessenen Weges',
    desc: 'Den Weg von Treutheim bis zur Enthüllung des Schattens zurückgelegt.',
    check: () => !!gameFlags.chapter2Complete,
    bonusMult: 0.15
  },
  // 4 neue Kap-2-Achievements
  {
    id: 'firstCombatKill', cat: ACH_CAT.NORMAL, layer: 2, icon: '⚔', name: 'Erstes Blut',
    desc: 'Den ersten Gegner im Jagdgebiet besiegen.',
    check: () => (killStats.total || 0) >= 1,
    bonusMult: 0.05
  },
  {
    id: 'strengthLevel2', cat: ACH_CAT.NORMAL, layer: 2, icon: '💪', name: 'Kriegers Handwerk',
    desc: 'Stärke-Stufe 2 erreichen.',
    check: () => getStrengthLevel(strength.xp) >= 2,
    bonusMult: 0.05
  },
  {
    id: 'theftSolved', cat: ACH_CAT.NORMAL, layer: 2, icon: '🔍', name: 'Wahrheitssucher',
    desc: 'Die Spur des Diebs bis zum Ende verfolgen.',
    check: () => quests.theftInvestigation?.state === QUEST_STATE.REWARDED,
    bonusMult: 0.05
  },
  {
    id: 'firstMutPoint', cat: ACH_CAT.NORMAL, layer: 2, icon: '⚔', name: 'Mut bewiesen',
    desc: 'Den ersten Mut ⚔ verdienen.',
    check: () => (mut.totalEarned || mut.points || 0) >= 1,
    bonusMult: 0.05
  },

  /* ── Lethkar (layer 3) ───────────────────────────────────── */
  {
    id: 'lethkarArrival', cat: ACH_CAT.NORMAL, layer: 3, icon: '🏙', name: 'Ankunft in Lethkar',
    desc: 'Die nördliche Stadt zum ersten Mal betreten.',
    check: () => !!gameFlags.lethkarUnlocked,
    bonusMult: 0.05
  },
  {
    id: 'alchemieStart', cat: ACH_CAT.NORMAL, layer: 3, icon: '⚗', name: 'Erste Schritte',
    desc: 'Die Alchemie in Lethkar entdecken.',
    check: () => !!(typeof alchemie !== 'undefined' && alchemie.unlocked),
    bonusMult: 0.05
  },
  {
    id: 'alchemieLevel5', cat: ACH_CAT.NORMAL, layer: 3, icon: '⚗', name: 'Geselle',
    desc: 'Insgesamt fünf Alchemie-Level erreichen.',
    check: () => {
      try { return Object.values(alchemie.levels).reduce((s,v)=>s+v,0) >= 5; } catch(e) { return false; }
    },
    bonusMult: 0.05
  },
  {
    id: 'alchemieGeselle', cat: ACH_CAT.NORMAL, layer: 3, icon: '⚗', name: 'Meistergeselle',
    desc: 'Den Gesellenstatus in der Alchemie erreichen.',
    check: () => !!gameFlags.alchemieGeselleReached,
    bonusMult: 0.10
  },
  {
    id: 'firstEinsicht', cat: ACH_CAT.NORMAL, layer: 3, icon: '✦', name: 'Wissensdurst',
    desc: 'Den ersten Wissensdurst ✦ verdienen.',
    check: () => {
      try { return (einsicht.totalEarned || einsicht.points || 0) >= 1; } catch(e) { return false; }
    },
    bonusMult: 0.05
  },
  {
    id: 'einsicht50', cat: ACH_CAT.NORMAL, layer: 3, icon: '✦', name: 'Forscher',
    desc: 'Insgesamt 50 Wissensdurst ✦ verdienen.',
    check: () => {
      try { return (einsicht.totalEarned || 0) >= 50; } catch(e) { return false; }
    },
    bonusMult: 0.05
  },
  {
    id: 'firstTier2Kill', cat: ACH_CAT.NORMAL, layer: 3, icon: '🦁', name: 'Tier-2-Jäger',
    desc: 'Einen Tier-2-Gegner bezwingen.',
    check: () => !!gameFlags.firstTier2Kill,
    bonusMult: 0.05
  },
  {
    id: 'varenaVertrauen', cat: ACH_CAT.NORMAL, layer: 3, icon: '📜', name: 'Varenas Vertrauen',
    desc: 'Varena offenbart, wer hinter dem Netz steckt.',
    check: () => !!gameFlags.varenaRevealedValdrisIdent,
    bonusMult: 0.05
  },
  {
    id: 'valdrisGefunden', cat: ACH_CAT.NORMAL, layer: 3, icon: '🕵', name: 'Die Spur endet hier',
    desc: 'Valdris\' Lager aufspüren und erkunden.',
    check: () => !!gameFlags.valdrisOperationRaided,
    bonusMult: 0.05
  },
  {
    id: 'kap3Abschluss', cat: ACH_CAT.NORMAL, layer: 3, icon: '🏆', name: 'Im Schatten der Einsicht',
    desc: 'Kapitel 3 vollständig abschließen.',
    check: () => !!gameFlags.kap3Complete,
    bonusMult: 0.15
  },

  /* ── Velmark (layer 4) ───────────────────────────────────── */
  {
    id: 'velmarkAnkunft', cat: ACH_CAT.NORMAL, layer: 4, icon: '🌆', name: 'Velmarks Hafen',
    desc: 'Die Hafenstadt Velmark zum ersten Mal betreten.',
    check: () => !!gameFlags.velmarkUnlocked,
    bonusMult: 0.05
  },
  {
    id: 'ersteFraktion', cat: ACH_CAT.NORMAL, layer: 4, icon: '🤝', name: 'Erster Kontakt',
    desc: 'Erste Verbindung zu einer der drei Fraktionen.',
    check: () => !!(gameFlags.gildekontaktGeknuepft || gameFlags.bruderschaftkontaktGeknuepft || gameFlags.archivkontaktGeknuepft),
    bonusMult: 0.05
  },
  {
    id: 'dreiKontakte', cat: ACH_CAT.NORMAL, layer: 4, icon: '🤝', name: 'Dreifacher Kontakt',
    desc: 'Alle drei Fraktionen kontaktieren.',
    check: () => !!(gameFlags.gildekontaktGeknuepft && gameFlags.bruderschaftkontaktGeknuepft && gameFlags.archivkontaktGeknuepft),
    bonusMult: 0.05
  },
  {
    id: 'einfluss50', cat: ACH_CAT.NORMAL, layer: 4, icon: '⚜', name: 'Einflussreich',
    desc: 'Insgesamt 50 Einfluss ⚜ verdienen.',
    check: () => {
      try { return (einfluss.totalEarned || 0) >= 50; } catch(e) { return false; }
    },
    bonusMult: 0.05
  },
  {
    id: 'informantenNetz', cat: ACH_CAT.NORMAL, layer: 4, icon: '👁', name: 'Das Netzwerk',
    desc: 'Das Informantennetz in Velmark aufbauen.',
    check: () => !!gameFlags.informantenNetzFreigeschaltet,
    bonusMult: 0.05
  },
  {
    id: 'firstTier3Kill', cat: ACH_CAT.NORMAL, layer: 4, icon: '🥷', name: 'Unterwelt-Jäger',
    desc: 'Einen Tier-3-Gegner in Velmarks Kanal bezwingen.',
    check: () => !!gameFlags.firstTier3Kill,
    bonusMult: 0.05
  },
  {
    id: 'velmarkRuestung', cat: ACH_CAT.NORMAL, layer: 4, icon: '🛡', name: 'Gepanzert',
    desc: 'Die Velmarker Kettenrüstung erwerben.',
    check: () => !!meta.velmarkRuestung,
    bonusMult: 0.05
  },
  {
    id: 'zweiFraktionen', cat: ACH_CAT.NORMAL, layer: 4, icon: '⚜', name: 'Bewährter Verbündeter',
    desc: 'Zwei Fraktionen auf eine Reputation von mindestens 60 bringen.',
    check: () => {
      try { return [fraktionen.haendlergilde, fraktionen.bruderschaft, fraktionen.archiv].filter(r=>r>=60).length >= 2; } catch(e) { return false; }
    },
    bonusMult: 0.10
  },
  {
    id: 'dreiFraktionen', cat: ACH_CAT.NORMAL, layer: 4, icon: '⚜', name: 'Dreifach-Allianz',
    desc: 'Alle drei Fraktionen auf eine Reputation von mindestens 60 bringen.',
    check: () => {
      try { return [fraktionen.haendlergilde, fraktionen.bruderschaft, fraktionen.archiv].filter(r=>r>=60).length >= 3; } catch(e) { return false; }
    },
    bonusMult: 0.10
  },
  {
    id: 'kap4Abschluss', cat: ACH_CAT.NORMAL, layer: 4, icon: '🏆', name: 'Der Preis des Einflusses',
    desc: 'Kapitel 4 vollständig abschließen und Valdris stellen.',
    check: () => !!gameFlags.kap4Complete,
    bonusMult: 0.25
  },

  /* ── Geheime Achievements ───────────────────────────────────
     Sichtbar nur im Geheim-Tab; Name/Desc werden gesperrt angezeigt. */
  {
    id: 'streetCat', cat: ACH_CAT.SECRET, layer: 0, icon: '🐈', name: 'Eine stille Freundschaft',
    desc: 'Gewinne über mehrere Nächte das Vertrauen eines streunenden Straßentiers.',
    hint: 'Manche Freundschaften brauchen Geduld — und ein paar kalte, schlaflose Nächte.',
    check: () => !!pets.streetCat,
    bonusMult: 0.10
  },
  {
    id: 'imSchatten', cat: ACH_CAT.SECRET, layer: 1, icon: '🔍', name: 'Im Schatten',
    desc: 'Fünfmal angesprochen — bevor ich wusste, wer er wirklich ist.',
    hint: 'Manchmal sitzt die Antwort die ganze Zeit im selben Raum wie die Frage.',
    check: () => npcFlags.fremderTalkCount >= 5,
    bonusMult: 0.10
  },
  {
    id: 'fleissig', cat: ACH_CAT.SECRET, layer: 0, icon: '🌙', name: 'Fleißige Seele',
    desc: 'Zehn Nachtwachen absolvieren.',
    hint: 'Die Nacht hat ihren eigenen Rhythmus — wer ihn kennt, kennt die Stadt.',
    check: () => nightWatchStats.count >= 10,
    bonusMult: 0.10
  },
  {
    id: 'wanderndeSeele', cat: ACH_CAT.SECRET, layer: 1, icon: '♾', name: 'Wandernde Seele',
    desc: 'Fünfzehn Mal neu beginnen.',
    hint: 'Manche Dinge lernt man erst beim sechzehnten Anlauf.',
    check: () => meta.resets >= 15,
    bonusMult: 0.15
  },
  {
    id: 'jagdExperte', cat: ACH_CAT.SECRET, layer: 2, icon: '🏹', name: 'Auf der Jagd',
    desc: 'Fünfzig Gegner im Jagdgebiet besiegen.',
    hint: 'Das Jagdgebiet kennt keine Gnade — aber es respektiert Beharrlichkeit.',
    check: () => (killStats.total || 0) >= 50,
    bonusMult: 0.10
  },
  {
    id: 'fremderSpiegel', cat: ACH_CAT.SECRET, layer: 2, icon: '🪞', name: 'Spiegel',
    desc: 'Den zwielichtigen Mann dreimal ansprechen.',
    hint: 'Manchmal sagt ein Blick mehr als eine Aussage.',
    check: () => (npcFlags.fremderTalkCount || 0) >= 3,
    bonusMult: 0.10
  },
  {
    id: 'alchemieWahn', cat: ACH_CAT.SECRET, layer: 3, icon: '🔮', name: 'Alchemischer Wahn',
    desc: 'Insgesamt 15 Alchemie-Level erreichen.',
    hint: 'Die Elemente haben ihre eigene Logik — wer sie versteht, vergisst die Zeit.',
    check: () => {
      try { return Object.values(alchemie.levels).reduce((s,v)=>s+v,0) >= 15; } catch(e) { return false; }
    },
    bonusMult: 0.15
  },
  {
    id: 'nachtForschung', cat: ACH_CAT.SECRET, layer: 3, icon: '🌌', name: 'Die Nacht gehört der Forschung',
    desc: 'Achtzig Wissensdurst ✦ insgesamt verdienen.',
    hint: 'Was die anderen schlafen, lernt der Wissensdurstige.',
    check: () => {
      try { return (einsicht.totalEarned || 0) >= 80; } catch(e) { return false; }
    },
    bonusMult: 0.10
  },
  {
    id: 'velmarkSchatten', cat: ACH_CAT.SECRET, layer: 4, icon: '🌒', name: 'Im Halbdunkel',
    desc: 'Alle drei Fraktionen auf Reputation 50+ bringen.',
    hint: 'Nicht alle sehen, wie das Muster sich zusammenfügt.',
    check: () => {
      try { return [fraktionen.haendlergilde, fraktionen.bruderschaft, fraktionen.archiv].every(r=>r>=50); } catch(e) { return false; }
    },
    bonusMult: 0.10
  },
  {
    id: 'vollständig', cat: ACH_CAT.SECRET, layer: 4, icon: '👑', name: 'Vollständig',
    desc: 'Einhundert Einfluss ⚜ insgesamt verdienen.',
    hint: 'Einfluss ist wie Wasser — erst wenn er fließt, sieht man, wie weit er reicht.',
    check: () => {
      try { return (einfluss.totalEarned || 0) >= 100; } catch(e) { return false; }
    },
    bonusMult: 0.15
  },
  {
    id: 'kap2Prestige1', cat: ACH_CAT.NORMAL, layer: 4, icon: '🔄', name: 'Veteran',
    desc: 'Den zweiten Abschnitt ein erstes Mal als Veteran neu beginnen.',
    check: () => kap2ResetCount >= 1,
    bonusMult: 0.08
  },
  {
    id: 'kap2Prestige3', cat: ACH_CAT.SECRET, layer: 4, icon: '⚔', name: 'Dreifach erprobt',
    desc: 'Den zweiten Abschnitt dreimal als Veteran absolviert.',
    hint: 'Manche Wege werden durch Wiederholung erst klarer.',
    check: () => kap2ResetCount >= 3,
    bonusMult: 0.15
  },
  {
    id: 'kap3Prestige1', cat: ACH_CAT.NORMAL, layer: 4, icon: '↩', name: 'Wissbegierig',
    desc: 'Den Lethkarer Weg ein weiteres Mal beschreiten — mit mehr Wissen als beim ersten Mal.',
    check: () => kap3ResetCount >= 1,
    bonusMult: 0.10
  },
  {
    id: 'stadtfalkeAch', cat: ACH_CAT.SECRET, layer: 4, icon: '🦅', name: 'Freier Himmel',
    desc: 'Einen Stadtfalken als Begleiter gewinnen.',
    hint: 'Manche Tiere lassen sich nicht suchen — sie kommen von selbst.',
    check: () => !!pets.stadtfalke,
    bonusMult: 0.08
  }
];

/**
 * Multiplikativer Gold-Bonus: Normaler Pool und Geheim-Pool werden getrennt berechnet,
 * weil es weniger Geheim-Errungenschaften gibt — jede zählt dreifach.
 * Rückgabe: kombinierter Multiplikator (z.B. 1.5 = +50% Gold).
 */
function getAchievementGoldMult() {
  const normalMult = ACHIEVEMENT_DEFS
    .filter(d => d.bonusMult && d.cat === ACH_CAT.NORMAL && achievements[d.id])
    .reduce((acc, d) => acc * (1 + d.bonusMult), 1.0);
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
    try {
      if (!def.check()) return;
    } catch(e) { return; }

    achievements[def.id] = true;
    navUnseen.errungenschaften = true;
    const prefix = def.cat === ACH_CAT.SECRET ? '🏆 Geheime Errungenschaft' : '🏆 Errungenschaft';
    showToast(`${prefix} freigeschaltet: ${def.name}`, TOAST.EVENT);
    playSfx('achievement');
  });

  // Velmark-Wildtier-Unlocks (Kettenhund + Archivfalter)
  try {
    if ((fraktionen?.bruderschaft || 0) >= 30 && !wildPets.find(p => p.type === 'kettenhund')) {
      wildPets.push({ type: 'kettenhund', level: 1 });
      showToast('Ein Kettenhund der Eisernen Bruderschaft folgt mir nun.', TOAST.EVENT);
      playSfx('achievement');
    }
    if ((fraktionen?.archiv || 0) >= 30 && !wildPets.find(p => p.type === 'archivfalter')) {
      wildPets.push({ type: 'archivfalter', level: 1 });
      showToast('Ein Archivfalter hat sich mir angeschlossen — er lebt zwischen den Seiten alter Bücher.', TOAST.EVENT);
      playSfx('achievement');
    }
  } catch(e) {}
}

/** Wechselt zwischen "Allgemein" und "Geheim" auf der Errungenschaften-Seite. */
function setAchievementTab(tab) {
  achievementTab = tab;
  achievementLayerFilter = null; // Filter zurücksetzen beim Tab-Wechsel
  render();
}

/** Setzt den Layer-Filter im Allgemein-Tab. */
function setAchievementLayerFilter(f) {
  achievementLayerFilter = f;
  render();
}

/** Baut EINE Errungenschafts-Kachel (kompaktes Format). */
function achievementTileHtml(def, selectedId) {
  const unlocked = !!achievements[def.id];
  const isSelected = selectedId === def.id;

  if (def.cat === ACH_CAT.SECRET && !unlocked) {
    return `<div class="achievement-tile${isSelected ? ' achievement-tile-selected' : ''}"
              onclick="selectAchievementTile('${def.id}')">
      <div class="achievement-tile-icon">❔</div>
      <div class="achievement-tile-name">???</div>
      <div class="achievement-tile-dot"></div>
    </div>`;
  }

  return `<div class="achievement-tile${unlocked ? ' unlocked' : ''}${isSelected ? ' achievement-tile-selected' : ''}"
            onclick="selectAchievementTile('${def.id}')">
    <div class="achievement-tile-icon">${def.icon}</div>
    <div class="achievement-tile-name">${def.name}</div>
    <div class="achievement-tile-dot"></div>
  </div>`;
}

/** Baut das Detail-Panel für das ausgewählte Achievement. */
function achievementDetailHtml(def) {
  if (!def) return '';
  const unlocked = !!achievements[def.id];

  if (def.cat === ACH_CAT.SECRET && !unlocked) {
    const extraHint = def.id === 'streetCat' && gameFlags.streetSweeperTalked
      ? `<p class="achievement-hint-green">Vielleicht muss ich mehrmals draußen schlafen, um den scheuen Tieren zu begegnen.</p>`
      : '';
    return `
      <div class="achievement-detail">
        <strong>???</strong>
        <p style="margin:4px 0;color:var(--muted);font-style:italic">${def.hint}</p>
        ${extraHint}
      </div>`;
  }

  let bonusText = '';
  if (def.bonusMult && unlocked) {
    const isSecret = def.cat === ACH_CAT.SECRET;
    const factor = isSecret ? def.bonusMult * 3 : def.bonusMult;
    bonusText = `<div class="action-card-effect" style="margin-top:4px">×${(1 + factor).toFixed(2)} Gold${isSecret ? ' (Geheim)' : ''} — multiplikativ</div>`;
  }

  const statusText = unlocked
    ? `<span style="color:var(--success,#4caf50);font-size:0.8em">✓ Freigeschaltet</span>`
    : `<span style="color:var(--muted);font-size:0.8em">Noch nicht erreicht</span>`;

  return `
    <div class="achievement-detail">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:1.4em">${def.icon}</span>
        <strong>${def.name}</strong>
        ${statusText}
      </div>
      <p style="margin:0;color:var(--text-lo)">${def.desc}</p>
      ${bonusText}
    </div>`;
}

/* State für ausgewählte Kachel — reiner UI-State, nicht gespeichert */
let selectedAchievementId = null;

function selectAchievementTile(id) {
  selectedAchievementId = selectedAchievementId === id ? null : id;
  render();
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

  // Welche Layer sichtbar sind
  const layerVisible = {
    0: true,
    1: meta.resets >= 1 || normalDefs.filter(d => d.layer === 1).some(d => achievements[d.id]),
    2: !!gameFlags.kapitel2Unlocked,
    3: !!gameFlags.lethkarUnlocked,
    4: !!gameFlags.velmarkUnlocked,
  };

  if (achievementTab === ACH_CAT.SECRET) {
    const selectedDef = secretDefs.find(d => d.id === selectedAchievementId);
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Errungenschaften</div>
        ${bonusSummaryHtml}
        <div class="tab-bar">
          <button class="tab-btn" onclick="setAchievementTab('${ACH_CAT.NORMAL}')">Allgemein (${normalCount}/${normalDefs.length})</button>
          <button class="tab-btn active" onclick="setAchievementTab('${ACH_CAT.SECRET}')">Geheim (${secretCount}/${secretDefs.length})</button>
        </div>
        <div class="tab-panel">
          <div class="achievement-grid">${secretDefs.map(d => achievementTileHtml(d, selectedAchievementId)).join('')}</div>
          ${selectedDef ? achievementDetailHtml(selectedDef) : ''}
        </div>
      </div>`;
    return;
  }

  // "Allgemein"-Tab: Sub-Filter pro Layer + Abschnitte
  const visibleLayers = [0, 1, 2, 3, 4].filter(l => layerVisible[l]);

  // Layer-Filter-Bar
  const filterBtns = [
    `<button class="tab-btn${achievementLayerFilter === null ? ' active' : ''}" onclick="setAchievementLayerFilter(null)">Alle</button>`,
    ...visibleLayers.map(l =>
      `<button class="tab-btn${achievementLayerFilter === l ? ' active' : ''}" onclick="setAchievementLayerFilter(${l})">${LAYER_LABELS[l]}</button>`
    )
  ].join('');

  const activeLayers = achievementLayerFilter !== null
    ? visibleLayers.filter(l => l === achievementLayerFilter)
    : visibleLayers;

  const selectedDef = normalDefs.find(d => d.id === selectedAchievementId);

  const layerSections = activeLayers.map(layer => {
    const defs  = normalDefs.filter(d => d.layer === layer);
    const count = defs.filter(d => achievements[d.id]).length;
    return `
      <div class="achievement-layer-section">
        <div class="achievement-layer-label">${LAYER_LABELS[layer]} — ${count}/${defs.length}</div>
        <div class="achievement-grid">${defs.map(d => achievementTileHtml(d, selectedAchievementId)).join('')}</div>
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
      <div class="tab-bar" style="margin-top:4px;flex-wrap:wrap">${filterBtns}</div>
      <div class="tab-panel">
        ${layerSections}
        ${selectedDef ? achievementDetailHtml(selectedDef) : ''}
      </div>
    </div>`;
}
