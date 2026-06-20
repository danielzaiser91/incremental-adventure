/* ══════════════════════════════════════════════════════════════
   story.js — Story-Registry
   Jeder Eintrag ist sowohl Quelle für den einmaligen Dialog-Popup
   als auch für den späteren Nachlese-Eintrag in der Chronik.
   Alle Texte sind aus der Ich-Perspektive der Spielfigur geschrieben —
   es handelt sich um ihre eigenen Gedanken/Erinnerungen, nie um eine
   "Du"-Anrede.
   Freischaltung über EINES von zwei Feldern:
   - unlockState: Eintrag erscheint, sobald storyState >= unlockState.
   - unlockFlag:  Eintrag erscheint, sobald die Funktion true liefert
     (für Ereignisse, die nicht an storyState hängen, z.B. "erster Schlaf").
   ══════════════════════════════════════════════════════════════ */

'use strict';

const STORY_ENTRIES = [
  {
    id:          '1.1',
    title:       'Das Stadttor',
    unlockState: 10101,
    text: [
      'Der Hof meiner Familie gab nie mehr her als Mehltau im Korn und einen Vater, der mehr fluchte als hoffte. Sechzehn Jahre habe ich davon geträumt, hier wegzukommen.',
      'Jetzt ist es so weit! Reichtum, Ruhm, Macht — ich will das alles. Raus aus dem Acker, hinein in ein Leben, das wirklich mir gehört. Ich kann es kaum erwarten.',
      'Treutheim liegt vor mir — die erste Stadt auf meinem Weg. Hier beginnt es: ein Job, etwas Gold, und der erste Schritt zum Abenteurer.'
    ]
  },
  {
    id:          '1.2',
    title:       'Zwielichtige Begegnung',
    unlockState: 10102,
    text: [
      'Ein Mann tritt aus dem Schatten einer Gasse.',
      'Seinen Namen kenne ich nicht. Aber seinen Blick werde ich nicht vergessen — er klebt an meinem Geldbeutel, nicht an meinem Gesicht.',
      'Er sagt kein Wort. Muss er auch nicht. Ab jetzt halte ich mein Gold dichter bei mir.'
    ]
  },
  {
    id:         '1.3',
    title:      'Die erste Nacht',
    unlockFlag: () => gameFlags.firstSleepTriggered,
    text: [
      'Jeder Knochen schwer. Der erste Tag ist vorbei. Nur der erste.',
      'Ehrlich? Hässlicher, als ich dachte. Schuften für ein paar Münzen, die kaum für Brot reichen.',
      'War es das, wofür ich mein Zuhause verlassen habe?',
      'Aber zuhause wartet derselbe Acker. Derselbe Tag, der sich wiederholt, bis er einen aufreibt.',
      'Nein. Ich will mehr sein als ein Paar müde Hände. Ich will ein Abenteurer werden.',
      'Manchmal, wenn ich erschöpft genug bin, spüre ich etwas Unerklärliches. Ein Kribbeln, das mehr verspricht, als ich mir einbilden sollte.',
      'Morgen geht es weiter. Wenn niemand es für mich ändert, ändere ich es selbst.'
    ]
  },
  {
    id:          '1.4',
    title:       'Der Raub',
    unlockState: 20100,
    text: [
      'Eine Hand packt mich im Schatten einer Gasse.',
      'Der Fremde — er hat die ganze Zeit gewartet.',
      'Er reißt mir den Geldbeutel von der Hüfte und ist verschwunden, bevor ich begreife, was passiert.',
      'Mein mühsam verdientes Gold. Fort.',
      'Das wird sich nicht wiederholen. Ich werde klüger sein. Härter. Ein neues Kapitel beginnt — und dieses Mal schreibe ich es selbst.'
    ]
  }
];

/** Findet einen Story-Eintrag per ID. */
function getStoryEntry(id) {
  return STORY_ENTRIES.find(e => e.id === id);
}

/** Prüft, ob ein Story-Eintrag laut seinem Freischalt-Kriterium sichtbar ist. */
function isStoryEntryUnlocked(entry) {
  if (entry.unlockState !== undefined) return storyState >= entry.unlockState;
  if (entry.unlockFlag) return entry.unlockFlag();
  return false;
}

/** Liefert alle Einträge, die bereits freigeschaltet sind, sortiert nach ID. */
function getUnlockedStoryEntries() {
  return STORY_ENTRIES
    .filter(isStoryEntryUnlocked)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/**
 * Zeigt den Dialog zu einem Story-Eintrag genau einmal an (beim ersten Freischalten).
 * @param {string} id
 * @param {Function} [onClose] - wird nach dem Schließen aufgerufen
 */
function maybeShowStoryDialog(id, onClose) {
  if (shownDialogs.includes(id)) {
    if (onClose) onClose();
    return;
  }
  const entry = getStoryEntry(id);
  if (!entry) {
    if (onClose) onClose();
    return;
  }
  shownDialogs.push(id);

  // Macht den Chronik-Button + den neuen Eintrag in der Chronik-Liste
  // hervorgehoben, bis der Spieler sie jeweils bemerkt (siehe state.js).
  // render() erneut aufrufen, weil der vorausgehende Aufruf (z.B. in
  // enterCity()) bereits VOR diesen Flags lief — der Dialog selbst stört
  // dabei nicht, er liegt als eigenes Overlay über der Zielleiste.
  chronikButtonUnseen = true;
  if (!chronikUnseenEntryIds.includes(id)) chronikUnseenEntryIds.push(id);
  render();

  showStoryEntryDialog(entry, onClose);
}

/**
 * Öffnet den Dialog eines Story-Eintrags. Jeder Absatz aus `entry.text` wird
 * als eigene, kurze Dialog-Seite gezeigt ("Weiter" blättert um) statt als
 * ein langer Textblock — das hält Spannung und Lesbarkeit hoch (siehe
 * SKILL.md, "Story-Dialoge: kurz und mehrstufig").
 */
function showStoryEntryDialog(entry, onClose) {
  const pages = Array.isArray(entry.text) ? entry.text : [entry.text];
  showPaginatedDialog(entry.title, splitLongDialogPages(pages), [
    { label: 'Weiter', onClick: () => closeDialog(onClose) }
  ]);
}
