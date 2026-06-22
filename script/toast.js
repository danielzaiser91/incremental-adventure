/* ══════════════════════════════════════════════════════════════
   toast.js — Ephemere Reaktionstexte (z.B. "+1 Gold")
   Erscheinen oben rechts, fahren rein, bleiben kurz stehen,
   fahren wieder raus. Für Aktions-Feedback, NICHT für Story-Text.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const TOAST_ANIM_MS       = 280;
const TOAST_HISTORY_LIMIT = 50;

/**
 * Zeigt eine kurze Reaktions-Benachrichtigung an.
 * @param {string} text
 * @param {'reward'|'purchase'|'error'|'info'|'event'} [type]
 */
function showToast(text, type = 'info') {
  toastHistory.unshift({ text, type, at: Date.now() });
  if (toastHistory.length > TOAST_HISTORY_LIMIT) toastHistory.length = TOAST_HISTORY_LIMIT;

  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-text">${text}</span>`;
  container.appendChild(toast);

  // Reflow erzwingen, damit die Einschub-Animation sicher startet
  requestAnimationFrame(() => {
    toast.classList.add('toast-in');
  });

  const removeTimer = setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), TOAST_ANIM_MS);
  }, settings.toastDurationMs);

  toast.addEventListener('click', () => {
    clearTimeout(removeTimer);
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), TOAST_ANIM_MS);
  });
}

/** Ändert, wie lange neue Toasts sichtbar bleiben (Einstellungen). */
function setToastDuration(ms) {
  settings.toastDurationMs = ms;
  render();
}
