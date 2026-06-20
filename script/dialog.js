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
    showDialog({
      title,
      text: [pages[i]],
      buttons: isLast ? finalButtons : [{
        label: 'Weiter',
        onClick: () => { i += 1; showPage(); }
      }]
    });
  };
  showPage();
}

/**
 * Öffnet das modale Story-/Dialogfenster.
 * @param {{ title: string, text: string[]|string,
 *   buttons: {label:string, onClick:Function, disabled?:boolean, reason?:string}[] }} opts
 *
 * `disabled` + `reason` erlauben sichtbare, aber gesperrte Antwortoptionen
 * (z.B. NPC-Dialogoptionen, die eine Bedingung wie Gold oder ein Item
 * voraussetzen) — der Grund erscheint als Tooltip auf dem Button.
 */
function showDialog({ title, text, buttons }) {
  const overlay   = document.getElementById('dialog-overlay');
  const titleEl   = document.getElementById('dialog-title');
  const textEl    = document.getElementById('dialog-text');
  const actionsEl = document.getElementById('dialog-actions');
  if (!overlay || !titleEl || !textEl || !actionsEl) return;

  titleEl.textContent = title;

  const paragraphs = Array.isArray(text) ? text : [text];
  textEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

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
