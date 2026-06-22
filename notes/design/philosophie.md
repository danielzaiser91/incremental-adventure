# Design-Philosophie — Chroniken des vergessenen Weges

Leitprinzipien, die jede Design-Entscheidung in diesem Projekt prägen
sollten. Bei Zweifelsfällen: dieses Dokument vor neuen Features lesen.

## 1. Interaktion vor Fließtext

Das Spiel ist eine Story, aber die Story ist nicht das Interface.
Der Spieler soll fast immer klickbare, greifbare Elemente vor sich
sehen (Buttons, Karten, Fortschrittsbalken) — nicht Textwände.

- **Reaktionstexte** (Ergebnis einer Aktion, z.B. "+1 Gold") → Toast,
  schiebt sich kurz ein und wieder aus. Nie dauerhaft im Bild.
- **Story-Momente** (einmalige Erzählbeats) → modales Dialogfenster,
  zieht den vollen Fokus, erscheint genau einmal pro Trigger.
- **Nachlese** vergangener Story-Momente → Chronik (eigener Menüpunkt),
  nicht im Hauptspielfluss.
- Niemals zurück zu einem scrollenden Log/Chatfenster als Haupt-UI.

## 2. Immersion bricht nie für Komfort

Der Spieler darf nie Code-/Meta-Sprache lesen: kein "Kapitel 2", kein
"Reset 3 von 5 erforderlich", kein "Story State 10102". Alles, was der
Spieler sieht, muss aus der Perspektive der Spielfigur Sinn ergeben.

- Gesperrte Inhalte zeigen `???` statt echter Beschreibung und eine
  in-universe-Bedingung ("Erfordert ein eigenes Zuhause"), nie eine
  Zahl aus dem Fortschrittssystem.
- Debug-/Meta-Infos (Story State, Resets, Spieltag-Zähler) sind auf
  den Einstellungen-Screen beschränkt — das ist explizit der
  "Entwickler schaut zu"-Bereich, dort ist Meta-Sprache erlaubt.
- Vendor-/Ortsnamen sind erfunden und konsistent (z.B. "Treutheim"),
  nie generische Platzhalter wie "Stadt 1".

## 3. Features wachsen sichtbar von Anfang an

Jedes Feature startet mit einer einzigen zentralen Aktion (ein Button,
eine Karte), aber die UI-Struktur ist von Anfang an für viele Karten
ausgelegt (`action-grid`, `auto-fit`-Grid). Neue Mechaniken reihen
sich ein, statt das Layout umzubauen. Der Spieler soll spüren: "das
hier wird mit der Zeit mehr", nicht "das wurde nachträglich
reingequetscht".

Gleiches Prinzip für Händler: Marktplatz ist ein Hub mit Vendor-Karten,
kein Einzel-Laden — neue Händlertypen (Waffenschmied, etc.) sind als
weitere Karte im Hub gedacht, nicht als Sektion in einem bestehenden
Laden.

## 4. Reset/Prestige ist Fortschritt, nicht Bestrafung

Der Raub am Ende von Kapitel 1 nimmt dem Spieler das Gold, aber gibt
sofort etwas zurück: eine permanente Erleichterung (schnellere Arbeit)
und neue Kaufoptionen. Jeder erzwungene Rückschritt in der Story muss
mit einem sofort sichtbarenKompensations-Mechanismus einhergehen,
sonst fühlt sich der Reset wie ein Strafe statt wie ein neues Kapitel
an.

## 5. Zeit & Bedürfnisse sind Spielmechanik, nicht Deko

Tageszeit, Hunger und Müdigkeit beeinflussen tatsächlich, was der
Spieler tun kann (Felder nachts geschlossen, Erschöpfung blockiert
Arbeit, Hunger schwächt den Ertrag). Sie existieren, um Entscheidungen
zu erzeugen (schlafen vs. Nachtwache riskieren; Brot kaufen vs. Gold
sparen), nicht nur als Zahlen im Stats-Panel.

## 6. Sichtbarkeit erst bei Relevanz (Progressive Disclosure)

Eine Navigation/Karte für ein Feature erscheint erst in dem Moment, in
dem sie für die Spielfigur tatsächlich einen Grund hat zu existieren —
nicht vom ersten Frame an "vollständig", nur weil das technisch
einfacher ist. Ein Spieler, der zu Beginn fünf Orte gleichzeitig sieht,
von denen vier noch nichts für ihn bedeuten, hat keine Orientierung,
sondern Reizüberflutung ohne Kontext.

Konkretes Muster: jede Freischaltung hat (a) einen klaren, spielbaren
Auslöser (nicht "Spieltag 3 erreicht", sondern "zum ersten Mal hungrig
genug, dass es etwas kostet") und (b) einen begleitenden Ich-Monolog,
der dem Spieler *erklärt*, warum jetzt etwas Neues sichtbar wird,
statt dass es kommentarlos auftaucht. Beispiele in diesem Projekt:
Arbeitsplatz erscheint erst, nachdem der Wirt den Job vermittelt hat;
Marktplatz erst beim ersten Hunger-Debuff ("vielleicht finde ich etwas
Essbares..."); Schlafplatz erst beim ersten Einbruch der Nacht;
Quests/Inventar-Navigation erst, sobald es tatsächlich eine Quest bzw.
einen besessenen Gegenstand gibt. Die Taverne ist die bewusste
Ausnahme, weil die Jobsuche selbst von Anfang an dorthin verweist —
nicht jedes Feature braucht eine Hürde, nur jedes Feature braucht
einen *Grund*.

Bei jedem neuen Feature vor der Umsetzung fragen: "Wann genau wird das
für die Spielfigur zum ersten Mal relevant — und weiß der Spieler in
diesem Moment, WARUM es jetzt auftaucht?" Wenn die Antwort "von Anfang
an" ehrlich zutrifft (wie bei der Taverne), ist sofortige Sichtbarkeit
korrekt. Sonst: Freischalt-Flag + erklärender Monolog, nach demselben
Muster wie oben.

Die Hervorhebung selbst (`navUnseen`/`nav-btn-new`) ist dabei nicht nur
für die ALLERERSTE Sichtbarkeit eines Orts reserviert — sie darf auch
für einen bereits bekannten Ort erneut aufflammen, wenn dort etwas
Neues relevant wird, ohne dass sich der Ort selbst ändert (Beispiel:
die Taverne erscheint ab Tag 2 erneut hervorgehoben, weil Brakka jetzt
eine neue Aufgabe hat). Der Unterschied zu einer komplett neuen
Freischaltung: der begleitende Ich-Monolog ist hier optional, weil der
eigentliche Inhalt — das neue Gespräch selbst — die Erklärung schon
liefert; die Hervorhebung allein genügt als "hier gibt's was Neues".

Apropos Punkt 4 — Reset-Auslöser dürfen ebenfalls nicht automatisch
sein. Ein Meilenstein (z.B. der Raub) darf eine Fähigkeit/einen Tab
freischalten, aber NIE selbst einen Reset durchführen — das Auslösen
eines Prestige-Resets ist immer eine bewusste, vom Spieler über einen
echten Button initiierte Entscheidung, mit einer immersiven Begründung
beim ersten Mal und einer echten Abbrechen-Option danach (siehe
`script/experience.js`, `startManualReset()`).

## 7. Eine zentrale Render-Wahrheit

UI ist immer eine reine Funktion aus globalem State
(`storyState`, `resources`, `meta`, `needs`, `gameClock`, ...).
Jede Aktion ändert State und ruft `render()` — kein manuelles
DOM-Patchen außerhalb der rAF-Progressbar-Ausnahme. Das hält das Spiel
einfach debugbar und einfach speicherbar (State-Objekt → JSON).
