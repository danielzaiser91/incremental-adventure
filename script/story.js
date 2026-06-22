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
  },

  /* ══ KAPITEL 2: Die Spur des Diebs ════════════════════════ */

  {
    id:          '2.1',
    title:       'Erstes Blut',
    unlockState: 20101,
    text: [
      'Das erste Mal. Die Stille danach hat eine eigene Schwere.',
      'Ich hatte keine Zeit, Angst zu haben — nur zu handeln. Und es hat funktioniert.',
      'Vielleicht bin ich doch mehr als ein Bauernjunge mit leeren Taschen. Vielleicht war der Raub nicht das Ende meiner Geschichte, sondern ihr eigentlicher Anfang.'
    ]
  },
  {
    id:          '2.2',
    title:       'Korbins Geheimnis',
    unlockFlag:  () => gameFlags.korbinChapter2Talked,
    text: [
      'Korbin zieht mich nah an sich heran, sein Atem riecht nach Bier und Vorsicht.',
      '"Drei Neue in diesem Monat. Immer dasselbe: ankommen, schuften, beraubt werden. Du bist nicht der Erste, Fremder."',
      '"Es gibt jemanden in dieser Stadt, den alle hier den Schatten nennen. Er wählt die Neuen aus. Jemanden, dem er vertraut, schickt er vor — einen Beobachter. Der entscheidet, ob jemand lohnend genug ist."',
      'Mir wird kalt, obwohl die Taverne warm ist.'
    ]
  },
  {
    id:          '2.3',
    title:       'Eine Spur im Dunkeln',
    unlockFlag:  () => gameFlags.theftClueFoundInJagdgebiet,
    text: [
      'Zwischen den armseligen Habseligkeiten eines Räubers, den ich eben niedergestreckt habe, finde ich etwas.',
      'Eine Münze. Meine Münze — ich erkenne den eingestanzten Kratzer, den ich selbst einmal durch einen Sturz verursacht habe.',
      'Der Dieb hat das Gold nicht behalten. Er hat es weitergegeben — an jemanden hier draußen, der mit diesen Räubern in Verbindung steht.',
      'Das ist kein einfacher Straßenraub. Das ist ein Netzwerk.'
    ]
  },
  {
    id:          '2.4',
    title:       'Miras wahres Gesicht',
    unlockFlag:  () => gameFlags.miraRevealedInfo,
    text: [
      'Mira lächelt nicht mehr. Zum ersten Mal seit ich sie kenne, fühlt sich das Gespräch mit ihr wie eines unter Gleichen an.',
      '"Der Brief, den ich dir für Brakka gegeben habe — es war eine Warnung. Brakka weiß, wer der Schatten ist. Er hat nur nie geredet."',
      '"Ich auch nicht. Weil es gefährlich ist, zu reden. Aber du fragst. Und das verändert etwas."',
      'Sie dreht sich weg, als könnte sie es bereuen, wenn sie mich noch länger ansieht.'
    ]
  },
  {
    id:          '2.5',
    title:       'Brakkas Schweigen bricht',
    unlockFlag:  () => gameFlags.brakkaRevealedSuspect,
    text: [
      'Brakka stellt den Hammer ab. Das erste Mal, seit ich ihn kenne.',
      '"Der Mann, der immer in der Taverne sitzt — er ist kein Dieb. Er ist der Voraussucher. Er beobachtet, er wählt aus, er meldet zurück."',
      '"Ich kenne dieses Gesicht seit Jahren. Er hat immer zugeschaut. Ich war zu feige, etwas zu sagen."',
      'Er sieht mich an, schwer wie Eisen. "Wenn du das beenden willst — hab etwas in der Hand, wenn du ihn stellst."'
    ]
  },
  {
    id:          '2.6',
    title:       'Die Konfrontation',
    unlockFlag:  () => gameFlags.fremderConfronted,
    text: [
      'Ich lege die Münze auf den Tisch zwischen uns. Der Fremde rührt sich nicht.',
      '"Du bist nicht wie die anderen", sagt er schließlich, leiser als ich erwartet hatte. "Die anderen haben aufgehört. Du nicht."',
      '"Ich habe dich ausgewählt. Nicht nur, um dich auszurauben — um zu sehen, was du daraus machst."',
      'Er schiebt die Münze zurück zu mir. "Der Schatten wird wissen wollen, wer du bist. Ich werde ihm sagen, dass du jemand bist, mit dem man rechnen muss."',
      'Ich nehme die Münze. Kein Sieg. Keine Niederlage. Nur: eine neue Rechnung, offen.'
    ]
  },
  {
    id:          '2.7',
    title:       'Das Ende des Anfangs',
    unlockState: 20200,
    text: [
      'Ich sitze auf den Stufen vor der Taverne und denke nach.',
      'Ich bin angekommen als Niemand. Ein Bauernjunge mit leeren Taschen und vollen Träumen.',
      'Jetzt? Ich habe Blut vergossen, Gold verdient und verloren, Freunde gemacht und Feinde entdeckt, die ich nicht mal gesucht hatte.',
      'Treutheim ist nicht das Ziel. Es war immer nur die erste Station.',
      'Der Schatten ist noch da draußen. Und er weiß, dass ich existiere.',
      'Das ist kein Ende. Das ist der Beginn von etwas viel Größerem.'
    ]
  },

  /* ── Kapitel 3: Lethkar ──────────────────────────────────── */
  {
    id:          '3.0',
    title:       'Lethkar',
    unlockFlag:  () => gameFlags.lethkarUnlocked,
    text: [
      'Drei Tage Weg. Keine Räuber — aber auch keine Gastfreundschaft.',
      'Lethkar ist größer als Treutheim. Andere Gerüche, andere Gesichter. Hier weiß niemand, wer ich bin.',
      'Das ist ein Vorteil. Vielleicht.',
      'Die Adresse aus dem Brief liegt nördlich des Markts. Aber ich gehe nicht hin. Noch nicht.'
    ]
  },
  {
    id:          '3.1',
    title:       'Erste Schritte in Lethkar',
    unlockFlag:  () => gameFlags.varenaMetFirst,
    text: [
      'In der Taverne sitzt eine Frau mit einem Alchemistenabzeichen und schaut mich so an, als hätte sie erwartet, dass ich komme.',
      '"Du siehst aus wie jemand, der aus Treutheim kommt." Ich frage mich, was man mir ansieht.',
      'Varena. Ihr Name bleibt hängen. Und die Art, wie sie redet — präzise. Kein Wort zu viel.'
    ]
  },
  {
    id:          '3.2',
    title:       'Der entschlüsselte Brief',
    unlockFlag:  () => gameFlags.varenaDecodedBrief,
    text: [
      '"Valdris." Der Name liegt jetzt in der Luft, nicht mehr auf Papier.',
      'Ich weiß, wo das Haus ist. Ich weiß, dass ich nicht allein hingehen soll.',
      'Mira hat mir mehr mitgegeben als ich dachte. Ich hoffe, dass sie weiß, was sie getan hat.'
    ]
  },
  {
    id:          '3.3',
    title:       'Das Laboratorium',
    unlockFlag:  () => alchemie.unlocked,
    text: [
      'Es riecht nach Schwefel, nassen Steinen und irgendwas Süßlichem, das ich nicht einordnen kann.',
      'Varena zeigt mir die fünf Aspekte. Feuer, Wasser, Erde, Luft — und Äther.',
      '"Das hier ist kein Handwerk." Sie tippt auf den Tisch. "Das ist Verstehen."',
      'Ich glaube ihr. Das bedeutet nicht, dass ich es schon tue.'
    ]
  },
  {
    id:          '3.4',
    title:       'Thessa und ihre Bücher',
    unlockFlag:  () => gameFlags.thessaTrustGained,
    text: [
      '"Du weißt mehr als du zeigst", sagt Thessa. "Das ist gut."',
      'Sie schiebt mir ein Buch über den Tisch — Aufzeichnungen über Lethkarer Händler-Netzwerke. Namen, Verbindungen, Schulden.',
      'Valdris\' Name taucht dreimal auf. Immer als Gläubiger. Nie als Schuldner.',
      'Das erklärt einiges. Und macht es komplizierter.'
    ]
  },
  {
    id:          '3.5',
    title:       'Pereth und das Lagerhaus',
    unlockFlag:  () => gameFlags.perethQuestStarted,
    text: [
      '"Du bist der Typ, der aus Treutheim kommt und Fragen über Valdris stellt." Pereth ist direkter als ich erwartet hatte.',
      '"Ich hab für ihn gearbeitet. Einmal reicht." Er lehnt sich zurück. "Das Lagerhaus am Südtor gehört einem seiner Strohleute."',
      '"Was da drin ist, weiß ich nicht. Aber ich will es wissen. Und du kannst rein, ohne aufzufallen."',
      'Ich sage ja. Ich bin mir nicht sicher, ob das klug war.'
    ]
  },
  {
    id:          '3.6',
    title:       'Die Schatten-Organisation',
    unlockFlag:  () => gameFlags.chapter3StoryComplete,
    text: [
      'Es ergibt jetzt ein Bild. Kein vollständiges — aber genug.',
      'Valdris ist kein Söldnerführer. Er ist ein Knotenpunkt. Informationen, Geld, Leute — alles fließt durch ihn.',
      '"Der Schatten" ist größer als ich gedacht hatte. Valdris ist nur ein Name.',
      'Hinter ihm steckt mehr. Und es weiß, dass ich hier bin.'
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
