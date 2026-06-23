/* ══════════════════════════════════════════════════════════════
   dialog.js — Modales Dialogfenster für einmalige Story-Momente
   Legt sich über das gesamte UI und zieht den vollen Fokus auf sich.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* Maximale Zeichenlänge einer einzelnen Dialog-Seite. Längere Texte werden
   automatisch an Satzgrenzen in mehrere Seiten aufgeteilt (siehe
   splitLongDialogPages()) — das hält die Dialogbox in einer vorhersehbaren
   Höhenspanne, statt bei jedem Knoten/jeder Seite spürbar zu "hüpfen". */
const DIALOG_MAX_PAGE_LENGTH = 200;
const DIALOG_HISTORY_LIMIT   = 30;

/** Teilt zu lange Textseiten an Satzgrenzen in mehrere kürzere Seiten auf.
    Kurze Seiten bleiben unverändert. */
function splitLongDialogPages(pages) {
  const result = [];
  pages.forEach(page => {
    if (page.length <= DIALOG_MAX_PAGE_LENGTH) { result.push(page); return; }

    const sentences = page.match(/[^.!?]+[.!?]+(\s+|$)/g) || [page];
    let current = '';
    sentences.forEach(sentence => {
      if (current && (current + sentence).length > DIALOG_MAX_PAGE_LENGTH) {
        result.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    });
    if (current.trim()) result.push(current.trim());
  });
  return result;
}

/**
 * Gemeinsame Grundlage für JEDEN mehrseitigen Dialog (Ich-Monologe,
 * Story-Einträge, NPC-Gespräche): zeigt genau EINE Textseite pro
 * Dialogfenster, blättert per "Weiter"-Button, und zeigt die eigentlichen
 * `finalButtons` erst auf der letzten Seite. So bleibt die Dialogbox über
 * jede Art von Dialog hinweg in einer ähnlichen, vorhersehbaren Höhe —
 * statt mehrere Absätze gleichzeitig zu stapeln (siehe SKILL.md).
 * @param {string} title
 * @param {string[]} pages - bereits ggf. per splitLongDialogPages() aufgeteilt
 * @param {{label:string, onClick:Function, disabled?:boolean, reason?:string}[]} finalButtons
 */
function showPaginatedDialog(title, pages, finalButtons) {
  let i = 0;
  const showPage = () => {
    const isLast = i === pages.length - 1;
    if (isLast) {
      // Kurze Sperre nach dem Seitenwechsel verhindert, dass ein schneller
      // Doppelklick auf "Weiter" versehentlich den ersten Final-Button trifft.
      const guarded = finalButtons.map(btn => ({ ...btn,
        onClick: () => { /* leer bis Guard abläuft */ }
      }));
      showDialog({ title, text: [pages[i]], buttons: guarded });
      setTimeout(() => {
        const actionsEl = document.getElementById('dialog-actions');
        if (!actionsEl) return;
        actionsEl.innerHTML = '';
        finalButtons.forEach((btn, idx) => {
          const b = document.createElement('button');
          b.className = 'action-btn dialog-btn' + (btn.disabled ? ' btn-disabled' : '');
          b.id = `dialog-btn-${idx}`;
          if (btn.reason) {
            b.innerHTML = `<span class="dialog-btn-main">${btn.label}</span>` +
                          `<span class="dialog-btn-reason">🔒 ${btn.reason}</span>`;
            b.title = btn.reason;
          } else {
            b.textContent = btn.label;
          }
          if (btn.disabled) b.disabled = true;
          else b.addEventListener('click', btn.onClick);
          actionsEl.appendChild(b);
        });
      }, 250);
    } else {
      showDialog({
        title,
        text: [pages[i]],
        buttons: [{ label: 'Weiter', onClick: () => { i += 1; showPage(); } }]
      });
    }
  };
  showPage();
}

/**
 * Öffnet das modale Story-/Dialogfenster.
 * @param {{ title: string, text?: string[]|string, html?: string,
 *   buttons: {label:string, onClick:Function, disabled?:boolean, reason?:string}[],
 *   boxClass?: string }} opts
 *
 * `disabled` + `reason` erlauben sichtbare, aber gesperrte Antwortoptionen
 * (z.B. NPC-Dialogoptionen, die eine Bedingung wie Gold oder ein Item
 * voraussetzen) — der Grund erscheint als Tooltip auf dem Button.
 *
 * `html` ist ein Hintertürchen für Dialoge mit eigenem Markup (z.B. der
 * kategorisierte Changelog-Dialog, siehe save.js) — überschreibt `text`
 * für die ANZEIGE, `text` wird trotzdem (falls angegeben) fürs
 * `dialogHistory`-Log verwendet. `boxClass` setzt eine zusätzliche Klasse
 * auf `#dialog-box` (z.B. für eine größere Variante) — wird bei JEDEM
 * Aufruf zurückgesetzt, damit sie nicht in den nächsten, unabhängigen
 * Dialog durchsickert.
 */
function showDialog({ title, text, html, buttons, boxClass }) {
  const overlay   = document.getElementById('dialog-overlay');
  const box       = document.getElementById('dialog-box');
  const titleEl   = document.getElementById('dialog-title');
  const textEl    = document.getElementById('dialog-text');
  const actionsEl = document.getElementById('dialog-actions');
  if (!overlay || !titleEl || !textEl || !actionsEl) return;

  titleEl.textContent = title;
  if (box) box.className = 'dialog-box' + (boxClass ? ` ${boxClass}` : '');

  const paragraphs = text ? (Array.isArray(text) ? text : [text]) : [];
  textEl.innerHTML = html ?? paragraphs.map(p => `<p>${p}</p>`).join('');

  // Jede gezeigte Dialogseite ist ein eigener Verlaufseintrag (siehe
  // dialogHistory, state.js) — getrennt von toastHistory, damit beide im
  // Einstellungs-Verlauf per Filter sauber unterscheidbar bleiben.
  if (paragraphs.length) {
    dialogHistory.unshift({ title, text: paragraphs, at: Date.now() });
    if (dialogHistory.length > DIALOG_HISTORY_LIMIT) dialogHistory.length = DIALOG_HISTORY_LIMIT;
  }

  actionsEl.innerHTML = '';
  (buttons && buttons.length ? buttons : [{ label: 'Weiter', onClick: closeDialog }])
    .forEach((btn, i) => {
      const b = document.createElement('button');
      b.className = 'action-btn dialog-btn' + (btn.disabled ? ' btn-disabled' : '');
      b.id = `dialog-btn-${i}`;

      // Sperrgrund nie nur im Tooltip: eigene, mit Schloss-Symbol markierte
      // Zeile unterhalb des Haupttexts, zusätzlich auch als Tooltip.
      if (btn.reason) {
        b.innerHTML = `<span class="dialog-btn-main">${btn.label}</span>` +
                       `<span class="dialog-btn-reason">🔒 ${btn.reason}</span>`;
        b.title = btn.reason;
      } else {
        b.textContent = btn.label;
      }

      if (btn.disabled) {
        b.disabled = true;
      } else {
        b.addEventListener('click', btn.onClick);
      }
      actionsEl.appendChild(b);
    });

  overlay.classList.remove('hidden');
  document.body.classList.add('dialog-open');

  requestAnimationFrame(() => overlay.classList.add('dialog-visible'));
}

/**
 * Zeigt eine kurze Folge von Ich-Monolog-Seiten ("Weiter" blättert um, die
 * letzte Seite schließt + ruft `onClose` auf). Gemeinsame Grundlage für alle
 * ad-hoc Spielercharakter-Monologe (Jobsuche, Tavernen-Ankunft, erste Arbeit,
 * erster Level-Up, ...), die KEIN eigener `STORY_ENTRIES`-Eintrag sein müssen,
 * weil sie nicht in der Chronik nachlesbar sein sollen.
 * @param {string} title
 * @param {string[]} pages
 * @param {Function} [onClose]
 */
function showMonologue(title, pages, onClose) {
  showPaginatedDialog(title, splitLongDialogPages(pages), [
    { label: 'Weiter', onClick: () => closeDialog(onClose) }
  ]);
}

/**
 * Schließt das modale Dialogfenster.
 * @param {Function} [onClosed] - wird ERST nach Ende der Ausblend-Animation
 *   aufgerufen (180ms), nicht synchron. Wichtig bei verketteten Dialogen
 *   (z.B. story.js/actions.js): wenn `onClosed` selbst sofort einen neuen
 *   Dialog öffnet, würde der hier verzögerte `hidden`-Klassenwechsel sonst
 *   180ms später den FALSCHEN (neuen) Dialog unsichtbar machen, weil
 *   `overlay` von beiden Aufrufen geteilt wird. Deshalb läuft der
 *   Folge-Callback grundsätzlich erst nach Abschluss dieser Animation.
 */
function closeDialog(onClosed) {
  const overlay = document.getElementById('dialog-overlay');
  if (!overlay) { if (onClosed) onClosed(); return; }

  overlay.classList.remove('dialog-visible');
  document.body.classList.remove('dialog-open');

  setTimeout(() => {
    overlay.classList.add('hidden');
    if (onClosed) onClosed();
  }, 180);
}

/* ── Konfetti-Animation ───────────────────────────────────────
   Erzeugt 120 farbige Partikel, die vom oberen Bildschirmrand fallen.
   Der Container wird nach 6 Sekunden automatisch entfernt. */
function launchConfetti() {
  const existing = document.getElementById('confetti-container');
  if (existing) existing.remove();

  const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e91e63'];
  const container = document.createElement('div');
  container.id = 'confetti-container';
  document.body.appendChild(container);

  for (let i = 0; i < 120; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    const size = 6 + Math.random() * 8;
    el.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `left:${Math.random() * 100}%`,
      `top:-${20 + Math.random() * 40}px`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
      `animation-duration:${2.5 + Math.random() * 2.5}s`,
      `animation-delay:${Math.random() * 1.5}s`
    ].join(';');
    container.appendChild(el);
  }

  setTimeout(() => { if (container.parentNode) container.remove(); }, 6000);
}
