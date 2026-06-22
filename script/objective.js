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
  if (isNight()) {
    return 'Es ist spät. Suche dir einen Schlafplatz, bevor die Nacht vorüber ist.';
  }
  if (storyState < 10101) {
    return 'Betritt das Stadttor, um die Stadt zu erkunden.';
  }
  if (storyState === 10101) {
    if (!gameFlags.jobSearchDialogShown) return 'Finde einen Job und werde reich in Treutheim!';
    if (!gameFlags.tavernVisited)        return 'Gehe zur Taverne, um einen Job zu finden.';
    if (!gameFlags.jobUnlocked)          return 'Sprich mit dem Wirt in der Taverne.';
    return 'Arbeite auf dem Feld, um Gold zu verdienen.';
  }
  if (storyState === 10102) {
    return 'Verdiene weiter Gold — auch wenn mich jemand beobachtet.';
  }

  // Kapitel 2 — storyState 20100+ (Raub hat stattgefunden)
  if (storyState >= 20100 && !gameFlags.kapitel2Unlocked) {
    return 'Mein Gold ist fort. Es ist Zeit, klüger vorzugehen — sieh dir "Erfahrung" an und baue meinen Weg zur Abenteurergilde auf.';
  }
  if (storyState === 20100) {
    return 'Das Jagdgebiet südlich der Stadt wartet. Ich sollte zeigen, was ich drauf habe.';
  }
  if (storyState === 20101) {
    const q = quests.theftInvestigation;
    if (q.state === 'unstarted') return 'Im Jagdgebiet werde ich stärker. Und ich werde die Wahrheit über den Raub herausfinden — spreche mit Korbin in der Taverne.';
    return 'Die Spur des Diebs führt ins Jagdgebiet. Augen offen halten.';
  }
  if (storyState === 20102) {
    return 'Korbin weiß von einer Raubserie. Erkunde das Jagdgebiet weiter — die Antworten liegen dort draußen.';
  }
  if (storyState === 20103) {
    return 'Meine eigene Münze unter Räuberhabe. Mira weiß mehr — sie in der Taverne ansprechen.';
  }
  if (storyState === 20104) {
    return 'Mira hat gesprochen. Brakka kennt den Namen — ihn in der Schmiede aufsuchen.';
  }
  if (storyState === 20105) {
    const lvl = getStrengthLevel ? getStrengthLevel(strength.xp) : 0;
    if (!gameFlags.waldtrollKilled) return 'Brakka warnt: Der Voraussucher respektiert nur Stärke. Den Waldtroll im tiefen Jagdgebiet besiegen.';
    if (lvl < 3) return 'Brakka warnt: Erst stark genug werden (Stärke-Stufe 3+), dann den Fremden stellen.';
    return 'Ich bin bereit. Den zwielichtigen Mann in der Taverne mit den Beweisen konfrontieren.';
  }
  if (storyState === 20106) {
    return 'Die Konfrontation liegt hinter mir. Brakka und Mira davon berichten — dann Bilanz ziehen.';
  }
  if (storyState >= 20200) {
    if (gameFlags.lethkarUnlocked) {
      if (gameFlags.chapter3StoryComplete)
        return 'Valdris. Ein Name, eine Struktur, ein Netzwerk. Was ich damit anfange, liegt bei mir.';
      if (gameFlags.varenaDecodedBrief)
        return 'Der Brief ist entschlüsselt. Lethkar hält mehr bereit als ich gedacht hatte — Varena, Thessa, Pereth. Und irgendwo nördlich des Markts: ein Haus.';
      return 'Lethkar. Die Adresse aus dem Brief ist hier. Varena kann helfen — wenn ich ihr vertrauen kann.';
    }
    const mutNeeded = Math.max(0, 3 - mut.points);
    if (mutNeeded > 0)
      return `Treutheim liegt hinter mir. Der Weg nach Lethkar ist nah — aber noch fehlt mir der Mut, den er fordert. (Noch ${mutNeeded} Mut ⚔ benötigt)`;
    return 'Der Mut ist da. Der Weg nach Lethkar liegt offen. Auf der Weltkarte weiterziehen.';
  }
  return 'Sieh dich um.';
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
    chronikBtn.classList.toggle('active', currentContent === 'chronik');
    chronikBtn.classList.toggle('chronik-btn-new', chronikButtonUnseen);
  }

  if (clockEl) {
    const night = isNight();
    clockEl.textContent = `${night ? '🌙' : '🕐'} ${getClockDisplay()} · Tag ${gameClock.day}`;
    clockEl.classList.toggle('objective-clock-warning', night);
  }
}
