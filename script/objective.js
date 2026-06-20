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
    if (gameFlags.resetLayerUnlocked) {
      return 'Mein Gold ist fort. Vielleicht ist es Zeit für einen Neuanfang — sieh dir "Erfahrung" an.';
    }
    return 'Verdiene weiter Gold — auch wenn mich jemand beobachtet.';
  }
  if (storyState >= 20100) {
    return 'Erkunde Treutheim erneut, um meinen nächsten Schritt zu finden.';
  }
  return 'Sieh dich um.';
}

/** Kurzes Label des aktuell jüngsten freigeschalteten Story-Eintrags, z.B. "1.2". */
function getCurrentChapterLabel() {
  const entries = getUnlockedStoryEntries();
  if (!entries.length) return '1.0';
  return entries[entries.length - 1].id;
}

/** Rendert die untere Zielleiste neu. */
function renderObjective() {
  const chapterEl   = document.getElementById('objective-chapter');
  const textEl      = document.getElementById('objective-text');
  const clockEl     = document.getElementById('objective-clock');
  const chronikBtn  = document.getElementById('objective-chronik-btn');

  if (chapterEl) chapterEl.textContent = `Kap ${getCurrentChapterLabel()}`;
  if (textEl)    textEl.textContent    = getObjectiveText();
  if (chronikBtn) chronikBtn.classList.toggle('active', currentContent === 'chronik');

  if (clockEl) {
    const night = isNight();
    clockEl.textContent = `${night ? '🌙' : '🕐'} ${getClockDisplay()} · Tag ${gameClock.day}`;
    clockEl.classList.toggle('objective-clock-warning', night);
  }
}
