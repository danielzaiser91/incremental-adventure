/* ══════════════════════════════════════════════════════════════
   clock.js — Tageszeit-System
   Die Spielzeit schreitet nur durch Spieleraktionen voran (Arbeit,
   Nachtwache, Schlafen) — kein Echtzeit-Timer im Hintergrund.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const NIGHT_START_HOUR = 22; // Ab hier: "Es ist spät, Zeit zu schlafen"
const NIGHT_END_HOUR   = 5;  // Vor dieser Stunde gilt es ebenfalls als Nacht
const MORNING_HOUR     = 7;  // Stunde, zu der ein neuer Spieltag beginnt

/** Ist es im Spiel gerade Nacht (Felder/Händler geschlossen)? */
function isNight() {
  return gameClock.hour >= NIGHT_START_HOUR || gameClock.hour < NIGHT_END_HOUR;
}

/** Lässt die Spieluhr um die angegebenen Minuten voranschreiten. */
function advanceClock(minutes) {
  gameClock.minute += minutes;
  while (gameClock.minute >= 60) {
    gameClock.minute -= 60;
    gameClock.hour += 1;
  }
  if (gameClock.hour >= 24) {
    gameClock.hour -= 24;
  }
  if (minutes > 0) showTimeToast(minutes);
  if (minutes > 0) tickAutomationClock(minutes);
}

/** Kurzer, schwebender Hinweis direkt über der Uhrzeit (unten rechts) —
    signalisiert, dass gerade Spielzeit vergangen ist. Existiert bereits
    ein Toast, wird er aktualisiert statt gestapelt. */
function showTimeToast(minutes) {
  const anchor = document.querySelector('.objective-right');
  if (!anchor) return;

  let el = anchor.querySelector('.time-toast');
  if (el) {
    const prev = parseInt(el.dataset.min || '0', 10);
    const total = prev + minutes;
    el.dataset.min = total;
    el.textContent = `+${total} Min`;
    clearTimeout(el._timer);
  } else {
    el = document.createElement('div');
    el.className = 'time-toast';
    el.dataset.min = minutes;
    el.textContent = `+${minutes} Min`;
    anchor.appendChild(el);
    requestAnimationFrame(() => el.classList.add('time-toast-in'));
  }

  el._timer = setTimeout(() => el.remove(), 1100);
}

/** Formatiert die aktuelle Uhrzeit als "HH:MM". */
function formatClock() {
  const h = String(gameClock.hour).padStart(2, '0');
  const m = String(gameClock.minute).padStart(2, '0');
  return `${h}:${m}`;
}

/** Text für die Uhrzeit-Anzeige — weicht nachts dem Schlaf-Hinweis. */
function getClockDisplay() {
  return isNight() ? 'Es ist spät, Zeit zu schlafen' : formatClock();
}

/** Beendet den aktuellen Spieltag und beginnt den nächsten Morgen. */
function startNewDay() {
  gameClock.day += 1;
  gameClock.hour = MORNING_HOUR;
  gameClock.minute = 0;
  nightFlags.nightActivityUsedToday = false;
  dailyPurchases = {};

  // Ab Tag 2 hat Brakka eine neue Aufgabe anzubieten — die Taverne
  // verdient deshalb noch einmal einen kurzen Hinweis in der Navigation,
  // obwohl sie selbst längst kein "neuer" Ort mehr ist.
  if (gameClock.day === 2 && quests.nightWatch.state === QUEST_STATE.UNSTARTED) {
    navUnseen.taverne = true;
  }

  // Vorarbeiter-Abend-Hinweis täglich zurücksetzen, damit der Tab jede Nacht
  // erneut leuchtet, solange der Spieler das Gespräch noch nicht geführt hat.
  if (quests.foremanRaise.state === QUEST_STATE.ACTIVE && !gameFlags.foremanBonusGiven) {
    gameFlags.foremanEveningAlerted = false;
  }
}
