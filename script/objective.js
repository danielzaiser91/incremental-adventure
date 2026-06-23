/* ══════════════════════════════════════════════════════════════
   objective.js — Untere Zielleiste
   Zeigt dem Spieler jederzeit, was als Nächstes zu tun ist,
   sowie den aktuellen Story-Fortschritt und die Spieluhr.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/** Ermittelt den aktuellen Zieltext anhand von storyState/Ressourcen. */
function getObjectiveText() {
  // Bewusst nur grobe Richtungen für den nächsten GROSSEN Schritt der Story —
  // keine Mikro-Hinweise auf einzelne Aktionen (siehe SKILL.md).
  // Die Tageszeit ändert das Ziel NICHT — 1 Story-Abschnitt = 1 Ziel.
  if (storyState < 10101) {
    return 'Ich sollte das Stadttor betreten und die Stadt erkunden.';
  }
  if (storyState === 10101) {
    if (!gameFlags.jobSearchDialogShown) return 'Einen Job finden, Gold verdienen — das ist mein Plan in Treutheim.';
    if (!gameFlags.tavernVisited)        return 'Ich sollte zur Taverne — dort weiß man, wo man Arbeit findet.';
    if (!gameFlags.jobUnlocked)          return 'Mit dem Wirt in der Taverne sprechen.';
    return 'Auf dem Feld arbeiten und Gold verdienen.';
  }
  if (storyState === 10102) {
    return 'Irgendetwas stimmt nicht — dieses Gefühl, beobachtet zu werden, lässt mich nicht los. Ich halte den Kopf unten und mache weiter.';
  }

  // Raub-Sequenz — storyStates 10103–10106 (nach 1.–4. Raub)
  if (storyState === 10103) {
    return 'Ausgeraubt und wieder bei Null — aber das Erlebnis steckt jetzt in meinen Händen. Die Arbeit fühlt sich leichter an als beim ersten Mal. Weitermachen und das nächste Polster aufbauen.';
  }
  if (storyState === 10104) {
    return 'Schon wieder. Das ist kein Zufall mehr — ich weiß es. Ich bin wütend, aber aufgeben kommt nicht infrage. Noch mehr zusammentragen, schneller als zuvor.';
  }
  if (storyState === 10105) {
    return 'Dreimal. Jemand zieht im Hintergrund die Fäden und wartet, bis ich genug angehäuft habe. Ich weiß es — und mache trotzdem weiter. Noch mehr.';
  }
  if (storyState === 10106) {
    if (skills.paranoid >= 1) {
      return 'Ich habe meinen Kopf wieder klar. Ein bewusster Neuanfang liegt vor mir — klüger diesmal.';
    }
    return 'Viermal — das ist kein Pech, das ist Methode. Einfach weiter schuften bringt nur den nächsten Raub. Die Antwort steckt in dem, was mich diese vier Erlebnisse gelehrt haben — ich muss aufhören zu arbeiten und anfangen zu denken.';
  }

  // Kapitel 2 — storyState 20100+ (Raub hat stattgefunden)
  if (storyState >= 20100 && !gameFlags.kapitel2Unlocked) {
    return 'Mein Gold ist fort — bewusst zurückgelassen. Die Rückschläge haben mich verändert; jetzt muss ich daraus echte Stärke machen und den Weg zur Abenteurergilde ernsthaft angehen.';
  }
  if (storyState === 20100) {
    return 'Das Jagdgebiet südlich der Stadt wartet. Ich werde zeigen, was ich drauf habe.';
  }
  if (storyState === 20101) {
    const q = quests.theftInvestigation;
    if (q.state === QUEST_STATE.UNSTARTED) return 'Im Jagdgebiet werde ich stärker — und die Wahrheit über den Raub werde ich auch herausfinden. Ich sollte Korbin in der Taverne ansprechen.';
    return 'Die Spur des Diebs führt ins Jagdgebiet. Ich halte die Augen offen.';
  }
  if (storyState === 20102) {
    return 'Korbin weiß von einer Raubserie. Ich sollte das Jagdgebiet weiter erkunden — die Antworten liegen dort draußen.';
  }
  if (storyState === 20103) {
    return 'Meine eigene Münze unter Räuberhabe. Mira weiß mehr — ich muss sie in der Taverne ansprechen.';
  }
  if (storyState === 20104) {
    return 'Mira hat gesprochen. Brakka kennt den Namen — ich suche ihn in der Schmiede auf.';
  }
  if (storyState === 20105) {
    const lvl = getStrengthLevel ? getStrengthLevel(strength.xp) : 0;
    if (!gameFlags.waldtrollKilled) return 'Brakka warnt: Der Voraussucher respektiert nur Stärke. Ich muss den Waldtroll im tiefen Jagdgebiet besiegen.';
    if (lvl < 3) return 'Brakka warnt: Ich muss erst stark genug werden (Stärke 3+), bevor ich den Fremden stelle.';
    return 'Ich bin bereit — den zwielichtigen Mann in der Taverne mit den Beweisen stellen.';
  }
  if (storyState === 20106) {
    return 'Die Konfrontation liegt hinter mir. Ich sollte Brakka und Mira berichten, was ich herausgefunden habe.';
  }
  if (storyState >= 20200) {
    if (gameFlags.lethkarUnlocked) {
      if (gameFlags.chapter3StoryComplete)
        return 'Valdris. Ein Name, eine Struktur, ein Netzwerk. Was ich damit anfange, liegt bei mir.';
      if (gameFlags.varenaDecodedBrief)
        return 'Der Brief ist entschlüsselt. Lethkar hält mehr bereit als ich gedacht hatte — Varena, Thessa, Pereth. Und irgendwo nördlich des Markts: ein Haus.';
      return 'Lethkar. Die Adresse aus dem Brief ist hier. Varena kann mir helfen — wenn ich ihr vertrauen kann.';
    }
    const mutNeeded = Math.max(0, 3 - mut.points);
    if (mutNeeded > 0)
      return `Treutheim liegt hinter mir. Der Weg nach Lethkar ist nah — aber mir fehlt noch der Mut dazu. (Noch ${mutNeeded} Mut ⚔ benötigt)`;
    return 'Der Mut ist da. Der Weg nach Lethkar liegt offen — auf der Weltkarte weiterziehen.';
  }
  return 'Ich sollte mich umsehen.';
}

/** Kurzes Label des aktuell jüngsten freigeschalteten Story-Eintrags, z.B. "1.2". */
function getCurrentChapterLabel() {
  const entries = getUnlockedStoryEntries();
  if (!entries.length) return '1.0';
  return entries[entries.length - 1].id;
}

/** Öffnet einen Dialog mit dem vollständigen Zieltext. */
function showObjectiveDialog() {
  const text = getObjectiveText();
  showMonologue('Aktuelles Ziel', [text]);
}

/** Rendert die untere Zielleiste neu. */
function renderObjective() {
  const chapterEl   = document.getElementById('objective-chapter');
  const textEl      = document.getElementById('objective-text');
  const clockEl     = document.getElementById('objective-clock');
  const chronikBtn  = document.getElementById('objective-chronik-btn');

  if (chapterEl) chapterEl.textContent = `Kap ${getCurrentChapterLabel()}`;
  if (textEl) {
    textEl.textContent = getObjectiveText();
    textEl.onclick = showObjectiveDialog;
  }
  if (chronikBtn) {
    chronikBtn.classList.toggle('active', currentContent === CONTENT.CHRONIK);
    chronikBtn.classList.toggle('chronik-btn-new', chronikButtonUnseen);
  }

  if (clockEl) {
    const night = isNight();
    clockEl.textContent = `${night ? '🌙' : '🕐'} ${getClockDisplay()} · Tag ${gameClock.day}`;
    clockEl.classList.toggle('objective-clock-warning', night);
  }
}
