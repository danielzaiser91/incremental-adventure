---
name: incremental-adventure
description: Lessons learned & architecture map for "Chroniken des vergessenen Weges" (statisches HTML/JS/CSS Incremental-Adventure). Lesen, bevor an diesem Projekt gearbeitet wird — spart Exploration-Tokens.
---

# Chroniken des vergessenen Weges — Projekt-Gedächtnis

Liest dieses Dokument zuerst, bevor du Dateien explorierst. Es ersetzt
das erneute Erkunden der Struktur und nennt Fallstricke, die schon
einmal Zeit gekostet haben.

## Architektur in einem Satz

Kein Build-Step, kein Bundler, keine ES-Module. `index.html` lädt
~14 `<script>`-Tags aus `script/` in fester Reihenfolge; jede Datei
deklariert globale `function`/`let` — das ist beabsichtigt, kein
Versehen.

## Warum keine ES-Module

`<script type="module">` scheitert beim Öffnen von `index.html` via
`file://` an CORS (kein Server nötig sollte funktionieren). Deshalb:
klassische globale Funktionen, Trennung nur über Dateigrenzen +
Kommentar-Header. Nicht zu ES-Modulen migrieren, ohne das mit dem User
abzuklären.

## Datei-Lade-Reihenfolge ist eine Abhängigkeitskette

`index.html` lädt: `state.js → clock.js → needs.js → story.js →
market.js → inventory.js → toast.js → dialog.js → npc.js → quests.js →
experience.js → objective.js → nav.js → content.js → stats.js →
actions.js → save.js → main.js`.

Funktionen aus späteren Dateien dürfen früher deklarierte Daten
referenzieren (z.B. `actions.js` nutzt `isStarving()` aus `needs.js`),
aber nicht umgekehrt zur Ladezeit (nur zur Laufzeit nach
`DOMContentLoaded`, da ist alles geladen). Neue Datei → in
`index.html` an der richtigen Stelle in der Kette einfügen, sonst
`ReferenceError`.

## Zentrales Render-Pattern

`render()` in `main.js` ruft `renderNav() → renderContent() →
renderStats() → renderObjective()` auf und wird nach **jeder**
Zustandsänderung komplett neu aufgerufen (kein Diffing, kein virtuelles
DOM). UI ist reine Funktion aus globalem State. Bei neuen Features:
State ändern, dann `render()` aufrufen — nicht versuchen, einzelne
DOM-Knoten manuell zu patchen (Ausnahme: die rAF-Progressbar in
`actions.js`, die bewusst direkt das DOM patcht, um den 2-Sekunden-Loop
nicht 50×/Sekunde komplett neu zu rendern).

## Navigation/Content müssen synchron bleiben

`showContent(id)` (in `nav.js`) ist der **einzige** Weg, den
Content-Bereich zu wechseln — auch von Quick-Link-Buttons im
Content-Bereich selbst aus. Es setzt automatisch `navLevel` passend
(`TOWN_CONTENT_IDS` Liste). Niemals `currentContent = '...'` direkt
setzen und dabei `navLevel` vergessen — das war ein konkreter Bug
(Nav lief nicht mit, wenn Quick-Links geklickt wurden).

## Zwei unabhängige Navigations-Ebenen

`nav.js` rendert zwei Bereiche nebeneinander, die sich gegenseitig
NICHT zurücksetzen:
- **Global** (`GLOBAL_CONTENT_IDS`: `geschichte`/`quests`/`inventar`):
  immer sichtbar, unabhängig von `navLevel`. Klick ändert nur
  `currentContent`, lässt `navLevel` unverändert.
- **Ortsbezogen** (`TOWN_CONTENT_IDS` + `navTo()`/`navLevel`):
  Weltkarte → Treutheim → Arbeitsplatz/Marktplatz/Taverne/Schlafplatz.

`chronik` ist bewusst in KEINER der beiden Listen — sie hat ihren
eigenen, kleinen Buch-Icon-Button in der unteren Zielleiste
(`#objective-chronik-btn`, `index.html` + `objective.js`), weil sie
seltener gebraucht wird als die anderen globalen Seiten und nicht
dieselbe Priorität wie Quests/Inventar/Geschichte verdient. `showContent
('chronik')` funktioniert trotzdem ganz normal (lässt `navLevel`
unverändert, weil nicht in `TOWN_CONTENT_IDS`).

Das erlaubt z.B. "von Quests aus zurück zum zuletzt offenen
Arbeitsplatz", weil der Orts-Bereich beim Öffnen von Quests stehen
bleibt. Bei neuen globalen Seiten (z.B. später "Charakterbogen"): in
`GLOBAL_CONTENT_IDS` aufnehmen, NICHT in `TOWN_CONTENT_IDS` — sonst
kollabiert der Orts-Bereich beim Öffnen.

**Namens-Kollisionsfalle:** Ein Orts-Button hieß zwischenzeitlich
"Marktplatz-Übersicht" (der Aschenfurt-Stadtmitte-Knoten) während es
gleichzeitig einen echten "Marktplatz"-Button (Händlerviertel) gab —
Substring-Verwechslung sowohl für Spieler als auch für
Playwright-`text=`-Selektoren. Nav-Label dürfen sich nicht gegenseitig
als Substring enthalten.

## Immersion-Regel (vom User mehrfach betont)

Spieler-sichtbarer Text darf **niemals** Meta-/Code-Begriffe nennen:
kein "Kapitel X", kein "Reset Y von Z", kein "Story State". Solche
Werte dürfen nur in `renderSettings()` (Debug-Bereich) auftauchen.
Gesperrte Inhalte zeigen `???` als Beschreibung und eine
in-universe-Bedingung (z.B. "Erfordert ein eigenes Zuhause"), nie eine
nackte Zahl/Bedingung aus dem Code. Vor dem Schreiben neuer
UI-Strings: würde eine Spielfigur das so sagen?

## Story-State-Encoding

`storyState` ist ein Integer `KKUUSS` (Kapitel·Unterkapitel·Schritt,
`decodeState()` in `state.js`). Das ist **unabhängig** von den
Chronik-Einträgen in `story.js` (IDs wie `'1.1'`, `'1.2'`). Die
Zielleisten-Anzeige "Kap 1.2" kommt nicht aus `decodeState()`, sondern
aus `getCurrentChapterLabel()` (`objective.js`), die den höchsten
freigeschalteten `STORY_ENTRIES`-Eintrag nimmt. Bei neuen Story-Punkten
immer einen `STORY_ENTRIES`-Eintrag mit passendem `unlockState`
ergänzen, sonst taucht er nicht in der Chronik/Zielleiste auf.

## Spielzeit läuft nicht in Echtzeit

`gameClock` (`clock.js`) wird ausschließlich durch Aktionen
vorangetrieben (`advanceClock(minutes)` in Arbeit/Nachtwache/Schlafen),
nicht durch `setInterval`. Bewusste Entscheidung gegen Echtzeit-Ticker:
einfacher zu testen (kein Timing-Flakiness), kein Hintergrund-Timer,
der beim Save/Load synchronisiert werden müsste.

## Bedürfnisse & Nacht-Gating

`needs.js` (Hunger/Müdigkeit 0–100) + `isNight()` (`clock.js`) gaten
Aktionen direkt in den `render*`-Funktionen (z.B. `renderArbeitsplatz`
zeigt nachts eine andere Karte). `isExhausted()` existiert NICHT mehr
(siehe Tier-System unten) — nur `isNight()` blockiert hart, alles
andere ist ein weicher Debuff über `getTirednessTier()`/
`isStarving()`. Neue zeit-/bedürfnisabhängige Mechaniken sollten
diesem Muster folgen: Render-Funktion prüft den Zustand und baut
bedingt unterschiedliches HTML, statt globale CSS-Klassen zu togglen.

## Marktplatz ist ein Hub, kein Einzel-Laden

`market.js`: `VENDORS`-Array (Hub-Karten) + pro Händler ein
`renderVendor<Name>()`. Neue Händler (z.B. später Waffenhändler):
Eintrag zu `VENDORS` hinzufügen + eigene `renderVendorXyz()`-Funktion +
Case in `content.js`s `renderContent()`-Dispatcher für `marktplatz`.
`marketVendor` (State) ist `null` = Hub, sonst die Vendor-ID.
`showContent('marktplatz')` setzt `marketVendor` immer auf `null`
zurück (Navigation geht stets zur Übersicht).

## Testen ohne echten Browser im Sandbox-Terminal

Kein `chromium-cli`-Skill in dieser Umgebung vorhanden. Funktionierender
Weg: `npx playwright install chromium` (lädt nach
`%LOCALAPPDATA%\ms-playwright`, einmalig ~115 MB) + eigenes
Node-Skript mit `require('playwright')` (lokal installieren, **nicht**
`npx playwright` für das Test-Skript selbst — `npx` löst das Modul
nicht für `require()` auf). Python `http.server` im Projektordner für
den simplen Static-Server reicht.

**Schneller testen, nicht Echtzeit abwarten:** Für zeit-/
bedürfnisabhängige Mechaniken (Müdigkeit, Hunger, Tageszeit,
Gold-Meilensteine) nicht 50 reale Klicks simulieren — stattdessen
`page.evaluate(() => { resources.gold = X; gameClock.hour = 23;
render(); })` nutzen, um State direkt zu setzen, dann nur den
*einen* Schritt real klicken, der die Logik triggert (z.B.
`checkMilestones()` oder einen Render-Branch). Spart Testzeit um
Größenordnungen.

**Playwright `text=`-Selektor ist Substring-Match**, nicht exakt.
Bei mehrdeutigen Treffern (z.B. ein Nav-Button "📜 Chronik" und ein
`<em>Chronik</em>` im Fließtext gleichzeitig im DOM) scopen mit
`'#nav-content >> text=Chronik'` statt der nackten Text-Locator.

**`waitForSelector('.foo.hidden')` mit Default-State `visible`
schlägt fehl**, wenn `.hidden` `display:none` setzt — das Element ist
nie "visible" in diesem Zustand. Stattdessen
`waitForSelector('#foo', { state: 'hidden' })` verwenden.

## Müdigkeit blockiert nie hart — Tier-System statt Cap

Frühe Version hatte `isExhausted()` (tiredness >= 100 → Arbeiten-Button
disabled). Das erzeugte einen Soft-Lock: Spieler erreichten nie den
Abend/die Nacht, weil sie schon mittags feststeckten. Fix in
`needs.js`: `getTirednessTier(tiredness)` liefert ein `durationMult`
statt eines Booleans — Arbeit wird mit steigender Müdigkeit länger,
aber **niemals** deaktiviert. Nur `isNight()` darf eine Aktion hart
sperren (Tag/Nacht ist ein harter Gate, Bedürfniswerte sind immer
weiche Debuffs). Bei neuen Bedürfnis-/Statuswerten dieses Muster
wiederverwenden, nicht wieder einen harten Block einbauen.

**Wichtig (User-Korrektur):** Müdigkeit darf NUR die Dauer beeinflussen,
nicht den Ertrag — `getTirednessTier()` hatte ursprünglich auch ein
`rewardMult`, das wieder entfernt wurde. Nur Hunger (`isStarving()`)
schwächt den Ertrag (`getWorkReward()` in `actions.js`, −50 % bei
Hunger ≥ 80 %). Grund für die Trennung: Müdigkeit soll Geduld kosten
(länger warten), Hunger soll Kraft kosten (weniger schaffen) — zwei
unterschiedliche Strafen für zwei unterschiedliche Bedürfnisse, nicht
dieselbe Strafe doppelt vergeben.

## Inventar-Pattern: Kauf ≠ Konsum

`buyFood()` (`market.js`) erhöht nur `resources.inventory[id]`, wendet
aber nie direkt einen Effekt an. `useFood()` (`inventory.js`) ist der
einzige Ort, der Hunger/Müdigkeit tatsächlich verändert. Bei neuen
Verbrauchsgütern (Tränke, Tränke o.ä.) demselben Zweiklang folgen:
Kauf füllt Inventar, eine separate `use*()`-Funktion auf der
Inventar-Seite wendet den Effekt an. Permanente Ausrüstung
(Lederhandschuhe) ist bewusst **kein** Inventar-Item — sie hat kein
"Verzehren", sondern nur einen Besitz-Flag in `meta`.

## Dialog-Baum-Engine (NPCs)

`npc.js`: jeder NPC hat `start` (String oder Funktion für
zustandsabhängigen Einstieg, siehe Brakka/Quest) + `nodes` (Graph aus
Text + `options`). `openNpcDialog(npcId, nodeId)` rendert über das
bestehende `showDialog()` (kein separates Dialog-System). Optionen
können `locked: () => bool` + `reason` tragen → erscheinen sichtbar,
aber per `disabled`-Attribut + Tooltip gesperrt (siehe `dialog.js`
`showDialog`-Erweiterung). Neue NPCs/Dialoge: einfach einen weiteren
Eintrag in `NPCS` ergänzen, keine Änderung an `dialog.js` nötig, außer
neue Optionsfelder gebraucht werden.

## Quest-Pattern

`quests.<name>.state` läuft durch eine kleine String-State-Machine
(`'unstarted' → 'active' → 'done' → 'rewarded'`, siehe
`quests.nightWatch` in `state.js`). Der NPC-Dialog liest den State, um
den passenden Knoten zu zeigen (`brakka.start` in `npc.js`); die
Aktion selbst (`nightWatch()` in `actions.js`) schaltet `'active' →
'done'`; der Turn-in-Dialog schaltet `'done' → 'rewarded'` und zahlt
die Belohnung aus. Eine gated aktion (hier: Nachtwache) liest direkt
`quests.<name>.state`, statt einen eigenen Freischalt-Flag zu pflegen
— eine Quest *ist* der Freischalt-Mechanismus.

## UI-Transparenz-Konvention

Seit dem Hunger/Müdigkeits-Feedback gilt: jede Aktion mit
Ressourcenkosten zeigt ihre Kosten *vor* dem Klick als separate
`.action-card-effect`-Zeile (z.B. "⏱ Dauer: 2.4s · 😴 Müdigkeit: +15%
· 🍞 Hunger: +8%"), getrennt von der erzählerischen
`.action-card-desc`. Aktive Debuffs erscheinen zusätzlich als
`.action-card-warning` auf der Karte selbst UND als `.needs-note` im
Stats-Panel (rechte Spalte) — Redundanz ist hier gewollt, der Spieler
soll den Effekt nicht verpassen können. Bei neuen Mechaniken mit
Kosten/Boni dieses Drei-Stellen-Muster (Karte-Effekt-Zeile,
Karte-Warnung, Stats-Notiz) übernehmen statt nur eine Stelle zu pflegen.

## Tooltips dürfen nie die einzige Informationsquelle sein

Konkreter User-Befund: Oswins gesperrte Dialogoption zeigte den
Gold-Bedarf ("Erfordert 100 Gold") nur als `title`-Tooltip — auf
Touch-Geräten/beim schnellen Klicken praktisch unsichtbar. Regel seit
diesem Fix: **jede Kosten-/Sperr-Information muss im sichtbaren
Text stehen** (Button-Label, Karten-Text, o.ä.). Ein Tooltip darf
zusätzlich vorhanden sein, aber nie der einzige Ort.

Umsetzung (verfeinert nach weiterem Feedback — anfangs wurde der
Sperrgrund einfach an das Label angehängt, was lange "Label — Grund"-
Sätze ergab): `npc.js`s `buildOptionLabel(opt)` hängt nur `cost` an den
Haupttext an. Der Sperrgrund (`reason`) wird **getrennt** als eigenes
Feld an `showDialog()` übergeben; `dialog.js` rendert ihn als eigene
Zeile mit Schloss-Symbol unterhalb des Haupttexts
(`.dialog-btn-main` / `.dialog-btn-reason`, CSS `.dialog-btn:has(.dialog-btn-reason)`
schaltet den Button auf `flex-direction: column`), zusätzlich weiterhin
als `title`-Tooltip. Dieses Muster (Haupttext + optionale, visuell
abgesetzte Sperrgrund-Zeile, nie verschmolzen in einen Satz) auf jede
neue UI-Stelle mit Kosten/Bedingungen anwenden.

## NPC-Dialogaktionen müssen render() selbst aufrufen

`openNpcDialog()` aktualisiert nur das Dialogfenster, nicht den Rest
der UI (Stats-Panel, Zielleiste etc.) — die liegen in einem anderen
DOM-Teilbaum. Konkreter Bug: Mira's Drink-Aktion zog Gold ab, aber die
Gold-Anzeige rechts blieb bis zur nächsten Navigation unverändert.
Fix: der Button-Klick-Handler in `openNpcDialog()` ruft nach
`opt.action()` immer `render()` auf — bei jeder neuen NPC-Option mit
Seiteneffekt auf State automatisch mit abgedeckt, nicht vergessen wenn
der Klick-Handler-Code mal umgebaut wird.

## Gold-Balance: Preise an Lohn koppeln, nicht den Lohn an Preise

Erstentwurf hatte 1 Gold/Arbeit (Schuften), aber 8–30 Gold für Brot/
Drink/Fisch — krasses Ungleichgewicht (User: "für 1g Stundenlohn kann
sich niemand ein 8g Bier leisten"). Fix: Basislohn unverändert
gelassen (bewusst der "harte Start" von Kapitel 1), Preise stattdessen
auf das 3- bis 5-fache eines einzelnen Arbeitsgangs gedeckelt (Brot 4,
Mira-Drink 3, Fisch 8, Honigkuchen 14, Lederhandschuhe 16). Bei neuen
kaufbaren Inhalten: Preis immer gegen den aktuellen Basislohn der
jeweiligen Spielphase prüfen, nicht isoliert "was fühlt sich nach
einem Bier an" festlegen.

## Wiederholbare NPC-Interaktionen brauchen einen Grund oder ein Limit

Mira's Drink-Option war ursprünglich beliebig oft wiederholbar, ohne
Effekt außer Gold-Verlust — wirkte wie ein sinnloser Gold-Sink. Fix:
`npcFlags.miraDrinkGiven` macht die Option einmalig und gibt ihr einen
kleinen, sofort sichtbaren Gegenwert (Hunger-Linderung); danach
wechselt der NPC dauerhaft in einen "freundlich erinnert sich"-Knoten
(`start: () => npcFlags.X ? 'friendly' : 'greet'`, dasselbe Pattern wie
Brakkas Quest-Start). Bei neuen NPC-Interaktionen mit Kosten: entweder
ein klares, der Kosten angemessenes Gegenstück geben, oder die
Interaktion bewusst einmalig machen — nie einen Button, der nur Gold
abzieht und nichts zurückgibt.

## Story-Texte: strikt Ich-Perspektive, Freischaltung auch ohne storyState

Alle Story-/Chronik-Texte (`story.js`) sind aus der Sicht der
Spielfigur geschrieben ("ich", nie "du") — auch Status-Text auf der
Geschichte-Seite (`renderGeschichte()` in `content.js`). `STORY_ENTRIES`
unterstützt zwei Freischalt-Arten: `unlockState` (Zahl, klassisch über
`storyState`) ODER `unlockFlag: () => bool` für Ereignisse, die nicht
an die Kapitel-Fortschritts-Zahl gekoppelt sind (z.B. "1.3 Die erste
Nacht" hängt an `gameFlags.firstSleepTriggered`, nicht an `storyState`
— wichtig, weil das erste Einschlafen früher oder später als andere
Meilensteine passieren kann und ein `storyState`-Bump hier die
Meilenstein-Bedingungen anderer Trigger zerstören könnte, die exakt
auf einen `storyState`-Wert prüfen).

## Story-Dialoge: kurz und mehrstufig statt ein langer Textblock

`showDialog()` rendert zwar ein Array von Absätzen, aber `story.js`s
`showStoryEntryDialog()` zeigt **nicht** alle auf einmal — jeder Absatz
ist eine eigene Dialog-Seite, "Weiter" blättert zur nächsten, der
letzte Klick schließt + ruft `onClose` auf. Grund (User-Feedback):
lange Textblöcke überfordern, mehrere kurze Einblendungen bauen
stattdessen Spannung auf. Richtwert beim Schreiben neuer
`STORY_ENTRIES`: jeder Absatz max. ~200 Zeichen, die meisten deutlich
kürzer; lieber einen Gedanken auf zwei Seiten verteilen als eine Seite
mit zwei Gedanken überladen. NPC-Dialoge (`npc.js`) folgen demselben
Prinzip bereits von Natur aus über ihren Node-Graphen — hier ging es
nur um die linearen Story-Popups.

## Zeitlose vs. momentane Beschreibungen

Text wie "die Stadt, in der ich **gerade** mein Glück suche" liest
sich falsch, sobald die Handlung weiterzieht (spätere Städte, anderes
Kapitel). Regel: Beschreibungen von Orten/Personen, die dauerhaft im
UI stehen (Weltkarte-Karte, Stadt-Übersicht, NPC-Tagline), müssen
zeitlose Tatsachen ausdrücken ("die erste Stadt auf meinem Weg"), keine
Momentaufnahmen ("gerade", "aktuell", "im Moment"). Nur explizit
einmalige Dialog-Popups (`story.js`) dürfen sich auf den exakten
Augenblick beziehen, weil sie nur einmal gezeigt werden und danach nur
noch in der Chronik nachlesbar sind.

## Zielleiste: nur grobe Richtung, keine Mikro-Anleitung

`getObjectiveText()` (`objective.js`) hatte zeitweise einen Eintrag wie
"Du bist erschöpft … Erwäge, schlafen zu gehen" — das ist eine
Reaktion auf einen Bedürfniswert, kein Story-Meilenstein, und ergab
zudem keinen Sinn mehr, nachdem Schlafen ans Nacht-Gating gekoppelt
wurde (s.u.). Regel: Zielleisten-Text darf nur den nächsten **großen**
Schritt der Haupthandlung benennen (Stadttor betreten, Arbeiten,
wachsam bleiben, Platz zurückfinden). Bedürfniswerte/Debuffs haben
bereits eigene, sichtbare Anzeigen (Stats-Panel, Karten-Warnungen) —
sie gehören nicht zusätzlich in die Zielleiste.

## Schlafen ist an die Nacht gekoppelt, nicht an Müdigkeit

`sleep()` (`actions.js`) bricht früh ab, wenn `!isNight()`.
`renderSchlafplatz()` zeigt tagsüber gar keine Schlafmöglichkeiten,
sondern einen erklärenden Ich-Text, der je nach Müdigkeits-Tier
variiert (frisch/müde: "ich sollte den Tag nutzen"; sehr
müde/erschöpft: "Sonne steht noch hoch, Schlafen wäre vergeudete
Zeit"). Grund: Müdigkeit blockiert laut Tier-System nie hart (siehe
oben), aber Schlafen sollte trotzdem nicht als Mittagsschläfchen
missbraucht werden können, um den Tiredness-Wert künstlich
zurückzusetzen. Bei neuen zeitabhängigen Aktionen: lieber die
Render-Funktion komplett anders rendern (wie hier), statt nur den
Button zu disablen — der Spieler braucht einen Grund, keinen toten
Button.

## Erfahrungs-/Level-System für wiederholte Aktionen

Pattern eingeführt für Feldarbeit (`actions.js`): ein einfacher
Zähler (`workStats.count` in `state.js`) + eine Schwellen-Tabelle
(`WORK_LEVEL_THRESHOLDS`) + eine parallele Bonus-Tabelle
(`WORK_LEVEL_BONUS`, gleicher Index = gleiches Level) mit
Multiplikatoren auf Dauer/Ertrag/Bedürfniskosten. `getWorkLevel(count)`
ist reine Ableitung, kein eigener gespeicherter State außer dem
Zähler. Anzeige folgt der UI-Transparenz-Konvention: ein immer
sichtbarer Balken + Text (`.xp-track`) auf der jeweiligen
Aktions-Seite, Tooltip nur als Erklärung *warum* der Wert steigt, nie
als einzige Infoquelle. Bei neuen wiederholbaren Aktionen (Schmieden,
Verhandeln, …) dasselbe Dreier-Pattern (Zähler + Schwellen + Boni)
wiederverwenden, statt eine Sonderlösung pro Aktivität zu bauen. Zwei
der hier verwendeten Schwellen (500.000 / 100.000.000) sind absichtlich
praktisch unerreichbar — als Haken für ein zukünftiges
Meta-Progressions-Feature, nicht als echtes Kurzfrist-Ziel.

## Toasts: z-index über dem Dialog, Position bewusst gewählt

Toasts erschienen vor dem Wechsel kurz "verschwommen" hinter dem
Dialog-Overlay, weil `#toast-container` (`z-index: 500`) unter dem
Dialog (`z-index: 1000` + `backdrop-filter: blur`) lag — Reaktionen
während eines offenen Dialogs (z.B. Mira's Drink) waren dadurch kaum
lesbar. Fix: Toast-Container auf `z-index: 1100` (über dem Dialog).
Zusätzlich Position von "oben rechts über der Stats-Spalte" auf "oben,
horizontal begrenzt auf `nav-w` bis `stats-w`" geändert (Animation
jetzt von oben statt von rechts) — Gold/Bedürfnisse in der rechten
Spalte bleiben dadurch immer lesbar, auch während ein Toast einfährt.
Anzeigedauer (`settings.toastDurationMs`) und Verlauf (`toastHistory`,
max. 10 Einträge) sind jetzt Spieler-Einstellungen statt Konstanten —
beide werden mitgespeichert (`save.js`), gehören aber zu `settings`,
nicht zu Spielfortschritt-Resets (`resetGame()` setzt sie auf
Default zurück, nicht auf "0 Einträge ohne Erklärung").

## Quests/Übersichtsseiten erst nach erstem Inhalt zeigen

`renderQuests()` filtert auf `state !== 'unstarted'` und zeigt bei
leerem Ergebnis "Keine Quests vorhanden." — eine Übersichtsseite, die
von Anfang an leere Platzhalter-Karten für noch nicht erhaltene Inhalte
zeigt, wirkt wie ein Spoiler/Fehler statt wie eine leere Liste. Gleiches
Prinzip wie das Inventar (zeigt nur tatsächlich besessene Items). Bei
neuen Übersichtsseiten (z.B. später ein Ausrüstungs- oder
Fähigkeiten-Tab): erst filtern auf "tatsächlich vorhanden/begonnen",
dann erst bei komplett leerem Ergebnis einen Leertext zeigen.

## "Übersicht" ist kein guter Seitentitel

Der Aschenfurt-Stadtmitte-Bildschirm hieß zwitschenzeitlich
"Aschenfurt — Übersicht" und zeigte nur Navigations-Buttons ohne
echten Inhalt — wirkte wie eine technische Zwischenseite statt wie ein
Ort in der Spielwelt. Fix: Seitentitel ohne das Wort "Übersicht",
Inhalt mit echter, kurzer Ortsbeschreibung + eigenen Action-Cards (mit
Symbol + Kurzbeschreibung + Button) statt einer reinen Button-Liste,
die die linke Navigation im Mittelteil duplizierte. Navigation bleibt
ausschließlich links (`nav.js`); der mittlere Bereich beschreibt die
Welt UND bietet Aktionen, statt nur Links zu wiederholen.

## Mehrstufige, ortsgebundene Dialogketten statt sofort sichtbarer Features

"Arbeitsplatz" war ursprünglich von Anfang an sichtbar. Auf User-
Wunsch (Immersion: die Figur weiß zu Beginn schlicht nicht, wo es
Arbeit gibt) wurde das durch eine kleine Kette aus drei Trigger-Punkten
ersetzt: `maybeTriggerJobSearchDialog()` (gehängt an `navTo(2)` in
`nav.js`, erstes Betreten der Stadt) → `maybeTriggerTavernArrivalDialog()`
(gehängt an `showContent('taverne')`) → der Wirt-NPC-Dialog selbst
(`npc.js`, `wirt.start` zeigt `jobAdvice` statt `greet`, solange
`gameFlags.jobUnlocked` falsch ist). Jeder Schritt setzt ein eigenes
`gameFlags`-Flag, das die Zielleiste (`objective.js`) abfragt, um den
nächsten Schritt zu benennen. Nav-Button UND Stadt-Karte für das
Feature bleiben ausgeblendet (nicht nur gesperrt!), bis das
freischaltende Flag wahr ist — siehe `nav.js`s `places`-Array und
`renderTreutheim()` in `content.js`, beide filtern per Spread-Trick
(`...(flag ? [...] : [])`). Bei neuen "erst entdecken, dann
freischalten"-Features dasselbe Muster verwenden: Trigger-Funktion(en)
an die Navigations-Aktion hängen, die zum Ort führt, nicht an
`render()` selbst (sonst feuert der Dialog bei jedem Re-Render erneut).

## Levelbasierte Belohnungs-Skalierung: feste Stufen-Tabelle statt Formel

Der Feldarbeits-Ertrag wurde von einem Multiplikator-Faktor
(`rewardMod`) auf eine explizite `goldBase`-Spalte in `WORK_LEVELS`
umgestellt (1 → 2 → 4 → 8 → 16 → 32, Verdopplung pro Stufe), weil der
User konkrete Werte pro Stufe vorgab statt einer Formel. Lektion: wenn
Spieldesign-Vorgaben konkrete Zahlen pro Stufe nennen (nicht
"+10% pro Level"), direkt eine Tabelle mit diesen Zahlen anlegen statt
eine Formel zu konstruieren, die zufällig dieselben ersten zwei Werte
trifft — die Tabelle bleibt erklärbar und exakt nachvollziehbar.
`getWorkLevelProgress()` liefert den Fortschritt *innerhalb* der
aktuellen Stufe (zur aktuellen Stufen-Schwelle relativ, nicht zur
absoluten Lebenszeit-Zahl) — dadurch wirkt die Anzeige nach jedem
Level-Up wie ein Reset auf 0%, ohne dass der zugrundeliegende
Lebenszeit-Zähler (`workStats.count`, bestimmt weiterhin die Stufe)
tatsächlich genullt werden muss.

## Aufklappbares Seiten-Panel statt Tooltip für Detailinfos

Die Job-Kachel hat einen Toggle-Button (`»`/`«`,
`toggleJobInfoPanel()` in `actions.js`, UI-State `jobInfoPanelOpen` in
`state.js` — bewusst NICHT gespeichert, reiner Anzeige-Zustand), der
ein Info-Panel seitlich neben der Kachel ausfährt (`width: 0 → 230px`
per CSS-Transition) statt eines Tooltips. Vorteil gegenüber Tooltip:
mehrere Zeilen Tabellen-Inhalt (alle Level + Boni) sind dauerhaft
lesbar, nicht nur bei Hover, und es bleibt trotzdem standardmäßig
eingeklappt, um die Kachel nicht zu überladen. Bei weiteren
Mechaniken mit "viele Werte, die man im Detail nachschlagen will, aber
nicht ständig sehen muss": dieses Slide-Panel-Pattern statt Tooltip
verwenden.

## Quest-Hinweis-Badges: Datenfeld am NPC, nicht eigene Liste

`brakka.questId = 'nightWatch'` in `npc.js` plus eine Zeile in
`renderTaverne()` (`quests[npc.questId].state === 'unstarted'` →
Badge) reicht aus, um anzuzeigen, welcher NPC eine noch nicht
angenommene Aufgabe hat. Bewusst kein separates "welche NPCs haben
Quests"-Register — die Quest-Zuordnung gehört an den NPC-Datensatz
selbst, damit beim Hinzufügen eines neuen Quest-NPCs nur ein Feld
ergänzt werden muss.

## Toast-Container-Ausrichtung kann sich unabhängig vom Eintritts-Ort ändern

Erst zentriert über dem Band zwischen Nav und Stats-Spalte, dann auf
User-Wunsch ("links von der rechten Leiste" statt "mittig") auf
`align-items: flex-end` umgestellt — die Toasts hängen jetzt rechts im
selben Band, direkt angrenzend an die Stats-Spalte, fahren aber
weiterhin von oben ein. Lektion: Position (welches Band) und
Ausrichtung (wo innerhalb des Bands) sind zwei separate
CSS-Entscheidungen (`left`/`right` vs. `align-items`) — bei
Feedback zur Toast-Position zuerst klären, welche der beiden Achsen
gemeint ist.

## Hunger und Müdigkeit sind zwei verschiedene Strafen, nicht eine doppelt

User-Korrektur: Müdigkeit darf NUR die Arbeitsdauer verlängern, Hunger
darf NUR den Ertrag schwächen (plus den Müdigkeitsaufbau beschleunigen)
— die beiden Bedürfniswerte dürfen sich nicht im selben Hebel
überschneiden. `getTirednessTier()` (`needs.js`) liefert nur noch
`durationMult`; `getHungerTier()` liefert `rewardMult` +
`tirednessGainMult`. Hunger ist außerdem gestaffelt wie Müdigkeit
(`satt` → `hungrig` (≥50) → `sehr-hungrig` (≥80) → `verhungernd` (≥100,
−90% Ertrag) statt eines einzelnen Boolean-Schwellwerts
(`isStarving()` bleibt als reines `id !== 'satt'`-Bequemlichkeits-Helper
erhalten, liefert aber selbst keine Multiplikatoren mehr). Bei neuen
Bedürfnis-/Statuswerten: vor dem Implementieren festlegen, *welcher*
Wert *welchen* Spielmechanik-Hebel kontrolliert, und das nicht
vermischen, auch wenn es anfangs einfacher wäre, beide auf denselben
Multiplikator wirken zu lassen.

## Info-Panels: nur die nächste Entscheidung zeigen, nicht die ganze Tabelle

Das Job-Info-Panel zeigte ursprünglich alle 6 Feldarbeits-Stufen
gleichzeitig. User-Feedback: vergangene Stufen-Boni hat der Spieler
längst, und Stufen jenseits der nächsten sind noch zu weit weg, um
Entscheidungsrelevanz zu haben — eine komplette Tabelle ist mehr
Information, als im Moment gebraucht wird. Fix: Panel zeigt nur (a)
aktuelle Stufe + Label, (b) numerischen XP-Fortschritt
(`getWorkLevelProgress()`, "into / span Erfahrung" — nicht nur eine
Tooltip-Prozentzahl, sondern die konkreten Zahlen sichtbar im Panel)
und (c) die Boni der NÄCHSTEN Stufe relativ zur aktuellen. Allgemeines
Muster: ein Info-Panel beantwortet "was bringt mir der nächste Schritt
konkret", nicht "zeig mir das komplette Tabellenblatt".

## Verkettete Ersteinblendungs-Dialoge statt paralleler Aufrufe

Mehrere "beim ersten Mal X"-Monologe (erste Arbeit, erster Hunger-
Debuff, erstes Level-Up, erste Nacht) können theoretisch im selben
Spielzug ausgelöst werden (z.B. löst die erste Feldarbeit gleichzeitig
Hunger UND ggf. die Nachtschwelle aus). `showDialog()` ersetzt den
Overlay-Inhalt sofort beim Aufruf — zwei Aufrufe direkt nacheinander
würden den ersten Dialog unsichtbar überschreiben, bevor der Spieler
ihn lesen kann. Fix in `actions.js`: alle `maybeTrigger*Dialog()`-
Funktionen nehmen einen optionalen `onDone`-Callback (Default No-Op);
zeigen sie nichts (Bedingung nicht erfüllt), rufen sie `onDone()`
sofort auf, sonst erst nach dem Schließen. Aufrufer verketten sie
explizit (`maybeTriggerA(() => maybeTriggerB(() => maybeTriggerC()))`)
statt sie lose hintereinander aufzurufen. Bei jeder neuen
Ersteinblendung dieses Verkettungs-Pattern fortsetzen, nicht wieder
unverkettete Parallel-Aufrufe einbauen.

**Versteckte Race Condition dabei gefunden und gefixt:** `closeDialog()`
entfernt `dialog-visible` sofort, setzt die `hidden`-Klasse aber erst
180ms später per `setTimeout` (Ausblend-Animation). Wenn der
`onClose`-Callback eines Dialogs synchron einen NEUEN Dialog öffnet
(genau das tut die Verkettung oben), lief der alte `setTimeout` trotzdem
weiter und setzte 180ms später `hidden` auf denselben, von beiden
Dialogen geteilten `#dialog-overlay` — der gerade erst geöffnete neue
Dialog verschwand dadurch unsichtbar wieder. Fix: `closeDialog(onClosed)`
nimmt jetzt selbst einen Callback und ruft ihn ERST NACH dem
`setTimeout` auf (`dialog.js`); `showMonologue()` und
`showStoryEntryDialog()` (`story.js`) übergeben ihr `onClose` dort hinein,
statt es synchron direkt nach `closeDialog()` aufzurufen. Bei jeder
neuen Stelle, die einen Dialog schließt und danach etwas auslöst, das
möglicherweise einen weiteren Dialog öffnet: `closeDialog(callback)`
verwenden, nie `closeDialog(); callback();` direkt hintereinander.

## Progressive Disclosure: Sichtbarkeit von Nav/Karten an Spiel-Flags koppeln

Auf expliziten User-Wunsch zeigen Treutheims Orte sich nicht mehr alle
gleichzeitig von Anfang an — jeder Ort erscheint erst, sobald ein Flag
in `gameFlags` sagt, dass er relevant ist (siehe `notes/philosophie.md`,
Prinzip 6, für die ausführliche Begründung). Konkrete Flags:
`jobUnlocked` (Arbeitsplatz), `hungerDialogShown` (Marktplatz),
`firstNightDialogShown` (Schlafplatz). Jedes Flag wird GENAU an der
Stelle gesetzt, an der auch der erklärende Monolog gezeigt wird — Flag
und Erklärung sind ein Paar, nie getrennt. Umsetzung an drei Stellen
gleichzeitig pro Feature (sonst inkonsistent):
1. `nav.js`s `places`-Array (linke Navigation, Spread-Conditional
   `...(flag ? [[...]] : [])`),
2. `content.js`s `renderTreutheim()` (Stadt-Übersichtskarten, gleiches
   Spread-Pattern),
3. ggf. ein eigener Fallback in der Ziel-Render-Funktion selbst (siehe
   `renderArbeitsplatz()`s `if (!gameFlags.jobUnlocked) {...return;}`),
   falls die Seite trotz ausgeblendeter Navigation direkt erreichbar
   bleibt (z.B. über alte Bookmarks/Tests).

Auch die globale Nav (`renderGlobalNavSection()`) folgt jetzt demselben
Prinzip: "Quests" erscheint erst, wenn `Object.values(quests).some(q =>
q.state !== 'unstarted')` (irgendeine Quest existiert bereits),
"Inventar" erst, wenn `gameFlags.everOwnedItem` (im Krämer ODER bei
Mira gesetzt — überall, wo `resources.inventory` zum ersten Mal einen
Eintrag bekommt). Die Taverne ist bewusst NIE gated, weil die
Job-Suche selbst von Anfang an dorthin verweist — nicht jedes Feature
braucht eine Freischalt-Bedingung, nur jedes Feature braucht einen in
sich stimmigen Grund für seinen Sichtbarkeits-Zeitpunkt.

## Prestige-Reset muss eine bewusste Spieler-Aktion sein, nie automatisch

User-Korrektur, nachdem der automatische Kapitel-1→2-Übergang
(`completeChapterTransition()`, direkt an `checkMilestones()` gehängt)
als "zu plötzlich, zu schlecht erklärt" empfunden wurde: ein
Prestige-Reset (Ressourcen weg, dafür permanenter Fortschritt) darf
NIE automatisch bei Erreichen eines Schwellwerts passieren, auch wenn
das Erreichen des Schwellwerts selbst (hier: der Raub) automatisch
sein kann. Fix-Pattern (`script/experience.js`):
1. Das automatische Ereignis (Raub) nimmt nur die Ressource UND
   schaltet die Möglichkeit zum Reset frei (`gameFlags.resetLayerUnlocked`).
2. Der Reset selbst läuft ausschließlich über einen Button, den der
   Spieler aktiv klickt (`startManualReset()`), mit einer in-universe
   Erklärung, warum das Aufgeben von Ressourcen gegen eine andere
   Form von Fortschritt sinnvoll ist ("Was ich gelernt habe, kann mir
   niemand nehmen") — NIE nur eine Bestätigungs-Checkbox ohne Kontext.
3. Beim ersten Mal ein ausführlicher Monolog (mehrere Seiten), danach
   nur noch eine kurze Bestätigung mit echtem Abbrechen-Button — die
   Begründung muss nicht jedes Mal wiederholt werden, aber die
   Möglichkeit, NICHT zu resetten, muss immer da sein (zwei Buttons,
   nicht nur "Weiter").

## EP-Skillbaum-Pattern: ein Array, zwei generische Helfer

`EP_SKILL_TREE` (`experience.js`) ist ein flaches Array von Knoten mit
`requires` (zeigt auf eine andere Skill-ID oder `null`), `maxLevel` und
`costs[]` (Preis für Stufe i→i+1). `getSkillLevel(id)`/`setSkillLevel(id,
level)` abstrahieren, ob ein Skill ein Boolean (`maxLevel:1`) oder eine
Zahl (`maxLevel>1`, z.B. "Sparsamkeit" mit 2 Stufen) im `skills`-Objekt
ist — der Rest des Baum-Codes (Anzeige, Kauf-Validierung) behandelt
beide Fälle identisch. Bei neuen Skills mit Stufen: NICHT einen eigenen
Boolean pro Stufe anlegen, sondern `maxLevel`+`costs[]` nutzen und über
diese zwei Helfer lesen/schreiben.

## `levelOverride`-Parameter für "Was-wäre-wenn"-Vorschauen

User-Feedback: Level-Up-Vorschauen, die nur relative Prozentsätze
zeigen ("−25 % Müdigkeit"), verwirren, wenn der real beobachtete
Unterschied viel kleiner aussieht (Basiswerte sind klein, Rundung
verschluckt den Unterschied). Fix: `getWorkReward()`,
`getWorkDurationMs()`, `getWorkTirednessGain()`, `getWorkHungerGain()`
(`actions.js`) nehmen jetzt alle ein optionales `levelOverride` —
ruft man sie ohne Argument auf, nutzen sie den echten aktuellen Level
(`getWorkLevel(workStats.count)`); mit Argument berechnen sie exakt
dieselbe Formel für eine HYPOTHETISCHE Stufe, ohne den echten
Fortschritt zu verändern. So kann `content.js` "Jetzt → Danach" mit
konkreten Endwerten unter den AKTUELLEN Hunger-/Müdigkeits-/
Ausrüstungs-Bedingungen zeigen (die eigentliche Information, die der
Spieler wissen will), während die reine, modifikatorfreie
Stufentabellen-Differenz nur noch als Tooltip ("Basiswerte ⓘ")
existiert. Bei neuen Level-Systemen mit Vorschau-Bedarf: lieber gleich
einen Override-Parameter einbauen, als hinterher zwei Funktionen zu
duplizieren.

## Job-Leveling ist jetzt hinter einem Skill verriegelt

`getWorkLevel(count)` gibt `0` zurück, wenn `!skills.jobLeveling` —
das genügt, um das GESAMTE Level-System (Dauer, Ertrag, Müdigkeit,
Anzeige) ohne Sonderfälle zu deaktivieren, weil alle anderen
Funktionen ausschließlich über `getWorkLevel()` an die Stufe kommen.
`workStats.count` läuft im Hintergrund trotzdem weiter (zählt einfach
weiter hoch), damit der Fortschritt beim späteren Kauf des Skills
sofort sichtbar wird, statt bei 0 neu anfangen zu müssen. Bei neuen
"hinter einem Skill verriegelten" Mechaniken: denselben Trick nutzen —
EINE zentrale Ableitungsfunktion gated, nicht jede einzelne Stelle, die
davon liest.

## Sichtbarkeits-Hervorhebung für neue Nav-Elemente: ein Dict reicht

`navUnseen` (`state.js`) ist ein simples `{id: boolean}`-Dict. `nav.js`
hängt die CSS-Klasse `nav-btn-new` an jeden Button, dessen ID noch
`true` ist; `showContent(id)` setzt es beim ersten Klick auf `false`
UND ruft `maybeShowNavIntro(id)` (`actions.js`, `NAV_INTRO_TEXT`-Dict)
auf, falls für diese ID eine Kurzbemerkung definiert ist. Die
Hervorhebung selbst ist unabhängig davon, ob die jeweilige Freischaltung
bereits einen eigenen Erklär-Monolog hatte (z.B. Hunger-Dialog für den
Marktplatz) — beides ist bewusst getrennt: die Hervorhebung ist ein
reiner UI-Hinweis "hier ist was Neues", die Kurzbemerkung eine
zusätzliche, IMMER vorhandene Ich-Reaktion auf den ersten Klick.

## Layout-Sprünge durch bedingt eingefügte Elemente: aus dem Fluss nehmen

Konkreter User-Befund: Marktplatz-Hub → Krämer betreten ließ den
"Zurück"-Button oben erscheinen, der alle Elemente darunter (inkl. dem
Button, den man gerade noch sehen wollte) nach unten schob — der
Mauszeiger landete nicht mehr über dem nächsten sinnvollen Klickziel.
Lektion: wenn ein Element NUR auf manchen Seiten erscheint und alles
andere sonst identisch bleibt (hier: `.vendor-back-btn`), gehört es NIE
in den normalen Dokumentfluss — `position: absolute` auf einem
`position: relative`-Container (`#content-area`) lässt es ohne Einfluss
auf die Position aller anderen Elemente erscheinen/verschwinden. Bei
neuen bedingten Top-of-Page-Elementen (Badges, Zurück-Buttons,
Warnhinweise, die nur manchmal da sind) zuerst prüfen, ob sie sich aus
dem Fluss nehmen lassen, bevor mehr Elemente darunter potenziell
hüpfen.

## Ausrüstungs-Slot-Pattern: Kauf ≠ Besitz ≠ Wirkung

Die Lederhandschuhe waren vorher ein einzelner Boolean
(`meta.ledergloves`), der beim Kauf direkt den Effekt aktivierte. Auf
User-Wunsch jetzt dreistufig wie Verbrauchsgüter, nur mit einem
zusätzlichen Schritt: Kauf → Inventar (`resources.inventory.ledergloves`,
wirkt noch nichts) → Ausrüsten (`equipItem()`, `inventory.js`, verschiebt
in `equipment.hands`) → ERST DANN wirkt der Effekt (`getWorkReward()`
prüft `equipment.hands === 'ledergloves'`, nicht das Inventar). Neue
Ausrüstung braucht einen Eintrag in `EQUIPMENT_ITEMS` (`id`, `slot`,
`effect`-Text) + die Slot-ID in `EQUIPMENT_SLOTS` — der Rest
(Inventar-Anzeige, Aus-/Anziehen) ist bereits generisch.

## Tageslimits brauchen einen Reset-Hook und eine einmalige Erklärung

`dailyPurchases` (`state.js`, `{itemId: count}`) wird in `startNewDay()`
(`clock.js`) komplett geleert — das ist der einzige Ort, an dem ein
neuer Spieltag beginnt, also der einzig richtige Ort für den Reset.
`FOOD_ITEMS`-Einträge mit `dailyLimit` (Brot 3/Tag, Fisch 2/Tag,
Honigkuchen 1/Tag) werden in `buyFood()` gegen `dailyPurchases[itemId]`
geprüft; beim ERSTEN Erreichen irgendeines Limits ein einmaliger
erklärender Monolog (`maybeShowFoodLimitDialog(itemName)`, parametrisiert
statt Brot-spezifisch), danach nur noch eine kurze Fehlermeldung als
Toast — dieselbe "ausführlich beim ersten Mal, kurz danach"-Abstufung
wie beim manuellen Reset oben.

## Geteilte Schwellen statt zweimal dieselbe Zahl hart codieren

Der Raub UND das Mindest-Gold für einen lohnenden Neuanfang sollten
laut User-Wunsch beide bei 50 Gold liegen. Statt die `50` zweimal in
`actions.js` (Raub) und `experience.js` (Reset-Minimum) zu schreiben,
gibt es eine einzige Konstante `GOLD_MILESTONE_THRESHOLD` (`state.js`),
von der sich `RESET_MIN_GOLD` ableitet. Lektion für jede künftige "diese
zwei Werte sollen immer zusammenpassen"-Anforderung: eine Konstante an
der Wurzel, niemals zwei Stellen, die zufällig denselben Wert enthalten
und beim nächsten Balancing-Pass leise auseinanderlaufen.

## EP-Gewinn kann gestaffelt UND gekappt sein — ein Skill hebt die Kappung auf

Der Neuanfang gibt ohne den Skill "Weitblick" immer nur 1 EP (+1 mit
"Klarer Kopf"), sobald die Mindestschwelle erreicht ist — unabhängig
davon, wie viel MEHR Gold der Spieler zusätzlich angesammelt hat. Erst
"Weitblick" macht aus der binären Schwelle eine Reihe exponentiell
wachsender Meilensteine (`EP_GOLD_BREAKPOINTS`, Vielfache von
`GOLD_MILESTONE_THRESHOLD`): jeder erreichte Meilenstein zählt dann
einzeln. Das verhindert, dass simples Goldhorten von Anfang an die
EP-Ökonomie sprengt, UND macht den Skill spürbar wertvoll, statt nur
eine weitere Zahl im Baum zu sein. Für die UI-Anzeige (Punkt 7 des
User-Auftrags: "wie viel Gold brauche ich noch") gibt es eine separate
Hilfsfunktion (`getNextEpGoldTarget()`), die NICHT denselben Pfad wie
die tatsächliche Berechnung nimmt, sondern nur den nächsten Zielwert für
die Anzeige ermittelt — Berechnung und Anzeige bewusst getrennt, damit
sich die Anzeige-Logik ändern lässt, ohne die EP-Mathematik zu berühren.

## Einmalige, zähler-basierte Belohnungen sind kein Skill-Kauf

Der Vorarbeiter-Bonus (+1 Gold/Feldarbeit nach der 10. Feldarbeit) wird
NICHT mit EP gekauft, sondern automatisch durch einen Zähler ausgelöst
(`workStats.count >= FOREMAN_BONUS_THRESHOLD`), genau wie die anderen
"Ersteinblendungs"-Monologe (Hunger, erste Nacht, ...). Trotzdem
verdient er einen sichtbaren Platz im Erfahrungs-Tab, weil er dort
thematisch hingehört (dauerhafter Charakter-Fortschritt) — dafür eine
EIGENE Sektion "Was das Leben mich gelehrt hat", getrennt von "Was ich
bewusst gelernt habe" (dem EP-Skillbaum). Lektion: nicht jeder dauerhafte
Bonus muss durch dieselbe Mechanik (Kauf) entstehen, aber alle dauerhaften
Boni gehören an einen gemeinsamen, auffindbaren Ort — sonst verteilt sich
"was macht meinen Charakter stärker?" über das ganze Spiel.

## Mehrfach nutzbare aufgeschobene Quest-Aktionen brauchen einen Zwischenzustand

Die Nachtwache sollte laut User-Wunsch GENAU EINMAL möglich sein, bevor
sie bei Brakka abgegeben wird — danach beliebig oft. Der Quest-State
`'done'` (zwischen `'active'` und `'rewarded'`) ist genau dieser
Zwischenzustand: `nightWatch()` selbst prüft `state === 'active' ||
state === 'rewarded'` (NICHT `!== 'unstarted'`), damit `'done'` blockiert
bleibt, bis Brakka die Abgabe entgegennimmt. Lektion: wenn eine Aktion
"einmal, dann gesperrt, dann nach einem Ereignis wieder beliebig oft"
sein soll, reicht ein simples Boolean-Flag nicht — es braucht einen
eigenen Zwischenzustand in der Quest-State-Machine selbst.

## Questgegenstände brauchen einen eigenen Speicher, kein Inventar-Reuse

`questItems` (`state.js`) ist bewusst eine eigene Variable, getrennt von
`resources.inventory` — sie zählt NICHT gegen `INVENTORY_SLOT_COUNT` und
wird beim Abgeben der Quest direkt auf 0 gesetzt, nicht "verzehrt" wie
Nahrung. `QUEST_ITEMS` (`quests.js`) ist die Registry (nur `id`, `name`,
`icon`, `desc` — kein Effekt, kein Knopf im Inventar, weil die einzige
gültige Aktion über den jeweiligen NPC-Dialog läuft, nicht über das
Inventar selbst). Lektion: sobald ein Gegenstand nur für EINE
NPC-Interaktion existiert und danach spurlos verschwindet, gehört er nie
in dasselbe Datenmodell wie Gegenstände, die der Spieler frei verwendet.

## Erzwungene Geschenke dürfen Inventar-Kapazität nie hart blockieren

`grantItem(itemId, qty)` (`inventory.js`) ist jetzt der EINZIGE Weg, wie
Gegenstände ins Inventar gelangen (Käufe UND NPC-Geschenke laufen
beide darüber). Ist kein Slot mehr frei (`INVENTORY_SLOT_COUNT`,
12 Plätze, ein Platz pro besessenem Gegenstands-TYP, nicht pro Stück),
landet der neue Gegenstand im `overflowBag` statt verloren zu gehen oder
den Kauf/das Geschenk hart zu blockieren — der Spieler kann ihn später
per `moveFromOverflow()` einsortieren, sobald wieder Platz ist. Lektion:
ein hartes Kapazitätslimit, das Items bei Vollbelegung einfach
verschwinden lässt, fühlt sich nach einem Bug an, selbst wenn es
"technisch korrekt" ist — ein Überlauf-Fach ist fast immer die bessere
UX als ein blockierter Erwerb.

## NPCs mit Bedingung: ausblenden statt "Nicht ansprechbar" zeigen

Mira (vor der ersten Nacht), der zwielichtige Mann (vor `storyState
10102`) und der Vorarbeiter (vor `quests.foremanRaise.state === 'active'`)
zeigten anfangs eine ausgegraute "Nicht ansprechbar"-Karte, solange ihre
Bedingung nicht erfüllt war. Auf User-Wunsch konsequent zu Progressive
Disclosure (Punkt 6) umgestellt: `renderTaverne()` filtert NPCs mit
`locked() === true` jetzt komplett aus der Liste heraus, statt sie
gesperrt anzuzeigen — ein Gast existiert für den Spieler erst, sobald er
ihn tatsächlich treffen kann, kein Vorab-Teaser über sein Dasein.

Weil ein neuer Gast dadurch ohne jede Karte einfach "da" ist, sobald man
die Taverne erneut öffnet, braucht der Spieler ein anderes Signal dafür,
dass sich dort etwas geändert hat: an JEDER Stelle, die eine
NPC-Bedingung umschaltet (z.B. `gameFlags.firstNightDialogShown = true`
in `maybeTriggerFirstNightDialog()`, `quests.foremanRaise.state =
'active'` in `maybeTriggerForemanBonusDialog()`, `storyState = 10102` in
`checkMilestones()`), wird zusätzlich `navUnseen.taverne = true` gesetzt
— dieselbe Hervorhebungs-Mechanik wie bei brandneuen Nav-Einträgen (siehe
Punkt "Sichtbarkeits-Hervorhebung für neue Nav-Elemente" oben), nur ohne
zwingenden Intro-Monolog. Lektion: ausblenden statt sperren UND erneut
hervorheben sind zwei Seiten derselben Medaille — wer NPCs/Inhalte
verschwinden lässt, bis sie relevant werden, muss ihr Wieder-Erscheinen
über einen anderen Kanal ankündigen, sonst übersieht der Spieler sie
einfach.

## Konvergenz-Knoten im Skillbaum: zwei Voraussetzungen, zwei Kostenarten

"Vorbereitung auf die Gilde" (`guildPrep`, `experience.js`) ist der erste
EP-Skill, der BEIDE Äste als Voraussetzung braucht statt nur einen.
Statt `requires` (eine ID) gibt es dafür `requiresAll` (ein Array);
`getNodeRequirements(node)` normalisiert beides auf eine einheitliche
Liste, damit `buyNextSkillLevel()` nicht zwischen beiden Fällen
unterscheiden muss. Derselbe Knoten ist außerdem der erste mit echten
Gold-Kosten zusätzlich zu EP (`goldCosts`, parallel zu `costs`) — auch
hier: ein optionales Feld, das bei Abwesenheit auf 0 zusammenfällt,
statt einen zweiten Kauf-Pfad zu bauen. Visuell bekommt ein
Konvergenz-Knoten eine gespiegelte Gabel-Verbindung (`.skill-connector-
merge`) unterhalb der letzten Baumzeile, sichtbar erst wenn ALLE
Voraussetzungen erfüllt sind.

## Story-Enden brauchen einen Sammelplatz, sonst gehen sie im Dialogtext unter

Lose Fäden wie "Brakka erklärt nie, wie man Abenteurer wird" fallen nur
auf, wenn man sie aktiv sucht — sie sind keine Fehler, die ein Test
findet. `notes/lose-enden.md` ist jetzt der feste Ort dafür: jeder
offene Faden bekommt einen Eintrag mit Status (offen / in Bearbeitung /
absichtliches Foreshadowing) und ggf. Integrations-Vorschlägen. Bei
jeder neuen Dialog-Runde kurz gegenchecken, ob sich ein Punkt erledigt
hat. Wichtig: ein halb gelöster Faden (wie hier die Gilde) bekommt
einen klar markierten Vertröstungs-Dialog ("Eine Sache nach der
anderen"), bis die richtige Lösung steht — nie einfach unkommentiert
unbeantwortet stehen lassen.

## NPCs mit zeitabhängiger Sichtbarkeit: `locked` darf mehrere Bedingungen kombinieren

Der Vorarbeiter ist nicht nur an die Quest gebunden, sondern zusätzlich
an `!isNight()` — er hat den Spieler ausdrücklich für ABENDS in die
Taverne eingeladen, der Dialogtext sagt das auch explizit. `locked` ist
einfach eine Funktion, die beliebig viele Bedingungen kombinieren kann
(`quests.x.state === 'unstarted' || !isNight()`); es gibt keinen Grund,
dafür ein zweites Feld einzuführen. Lektion: wenn ein NPC im Text einen
Zeitpunkt nennt ("komm heute Abend"), muss `locked()` diesen Zeitpunkt
auch tatsächlich durchsetzen — sonst klafft Text und Mechanik auseinander.

## Mehrstufige Sammel-/Verkaufs-Ketten: Zwischenzustände explizit benennen

Gretas Questkette (`kraemerinBusiness`) hat VIER Zustände statt der
üblichen drei: `unstarted` → `invited` (nach dem Theken-Gespräch beim
Krämer) → `active` (nach dem Taverne-Gespräch, Sammelplatz freigeschaltet)
→ `rewarded` (nach Abgabe, Verkauf + neue Ausrüstung freigeschaltet).
Der zusätzliche `invited`-Zustand existiert, weil zwei UNABHÄNGIGE
Auslöser (Markt-Dialog vs. Taverne-NPC) beteiligt sind — ohne ihn könnte
man nicht unterscheiden "noch nicht eingeladen" von "eingeladen, aber
noch nicht das eigentliche Angebot gehört". Lektion: sobald eine
Quest über mehr als einen Ort/NPC läuft, braucht jeder Übergabepunkt
seinen eigenen Zustand, auch wenn das mehr ist als das übliche
unstarted/active/rewarded.

## Gain-Werte erst spät runden, sonst frisst die Rundung die Kalibrierung

Hunger-/Müdigkeitskosten der Feldarbeit wurden so kalibriert, dass 4
Durchgänge auf einer Stufe exakt einen Ziel-Prozentsatz ergeben (50%,
40%, 30%, …). `getWorkTirednessGain()`/`getWorkHungerGain()` geben dafür
bewusst UNGERUNDETE Floats zurück — `Math.round()` passiert erst an der
Anzeige-Stelle (`content.js`), nie am eigentlichen State-Update
(`adjustHunger()`/`adjustTiredness()`). Würde man pro Aufruf runden,
würde sich der Rundungsfehler über mehrere Durchgänge aufsummieren und
die sorgfältig kalibrierten Zielwerte verfehlen. Lektion: bei jeder
Größe, die sich über mehrere Schritte aufaddiert UND einen exakten
Long-Term-Zielwert haben soll, so spät wie möglich runden.

## Ein UI-Wert, zwei Anzeigeorte — beide müssen dieselbe Funktion aufrufen

Konkreter Bug: die Job-Kachel zeigte den Hunger-Zuwachs als rohen
Konstanten-Wert (`WORK_HUNGER_GAIN`), während das Info-Panel direkt
daneben den tatsächlich LEVEL-ABHÄNGIGEN Wert (`getWorkHungerGain()`)
zeigte — zwei verschiedene Zahlen für dieselbe Sache auf derselben
Seite. Passiert leicht, wenn ein Wert zuerst als Konstante gebaut wird
und erst später levelabhängig gemacht wird, aber nicht JEDE
Anzeigestelle mitgezogen wird. Lektion: sobald ein Basiswert eine
abgeleitete Funktion bekommt, alle Vorkommen der ursprünglichen
Konstante im UI suchen und ersetzen — eine Konstante, die noch an einer
Stelle direkt verwendet wird, während eine Funktion sie anderswo schon
ersetzt hat, ist ein Garant für genau diesen Bug.

## Verzögerte Hervorhebung: Bedingung ≠ Sichtbarkeits-Bedingung

Der Vorarbeiter wartet nur ABENDS in der Taverne — die Hervorhebung der
Taverne-Navigation darf deshalb nicht beim Auslösen seiner Einladung
(tagsüber, nach der 10. Feldarbeit) erscheinen, sondern erst, wenn
`isNight()` tatsächlich zutrifft. Da Zeit nur durch Spieleraktionen
vergeht (kein Hintergrund-Timer), reicht ein einfacher Check bei jedem
`render()` (`checkEveningArrivals()`, aufgerufen aus `main.js`) — kein
Event-System nötig. Lektion: wenn ein NPC im Text einen Zeitpunkt nennt,
muss JEDE davon abhängige UI-Reaktion (nicht nur seine eigene
`locked()`-Bedingung) denselben Zeitpunkt prüfen, nicht den Moment, in
dem die zugehörige Quest aktiviert wurde.

## Gold-Gewinne außerhalb des Kern-Loops müssen denselben Meilenstein-Check auslösen

`checkMilestones()` lief nur in `completeWork()`/`nightWatch()` — Gold
aus NPC-Dialog-Belohnungen (Brakka, Vorarbeiter, Mira/Brakka-Brief) lief
daran vorbei. Folge: der Raub-Trigger (Gold-Schwelle + storyState) konnte
sich verzögern, je nachdem, ÜBER WELCHEN WEG der Spieler die
Gold-Schwelle erreichte — für den Spieler nicht nachvollziehbar, wirkte
wie ein zufälliger Bug ("der Trigger wurde übersprungen"). Lektion: JEDE
Stelle, die `resources.totalGoldEarned` erhöht, muss densel­ben
zentralen Konsistenz-Check aufrufen — nicht nur die "offensichtlichen"
Haupt-Loops. Suche dafür gezielt nach allen `totalGoldEarned +=`-Stellen,
wenn ein neuer Gold-Gewinn-Pfad hinzukommt.

## Generischer N-Spalten-Baum statt fest codierter 2-Spalten-Logik

Der Skillbaum musste von 2 auf 3 Äste wachsen (neuer mittlerer Ast:
Besitz/Schlaf). Die ursprüngliche Implementierung hatte feste
`left`/`right`-Variablen und CSS-Klassen für genau 2 Spalten — das hätte
sich nicht erweitert, sondern hätte für jede neue Spaltenzahl neue
Spezialfälle gebraucht. Die generelle Lösung: `EP_TREE_BRANCHES` ist ein
Array von Ketten (beliebig viele, beliebig lang), `columnCenterPct(i,
total)` übersetzt "Spalte i von total" in eine Prozent-Position, und
Connector-Linien (`.stl-stem`/`.stl-bar`) werden per Inline-Style
positioniert statt über feste CSS-Klassen. Lektion: sobald eine
UI-Struktur "geht von 2 auf N" droht, lohnt sich die generische Variante
sofort — der Umbau auf 3 Spalten hätte sonst dieselbe Arbeit nochmal für
4 Spalten erfordert.

## Speicherstand-Zukunftssicherheit: Validierung + Defaults, kein Versions-Branching

`applySaveData()` (`save.js`) wirft NUR, wenn die Grundform unbrauchbar
ist (kein Objekt, `storyState`/`resources` fehlen) — alles andere wird
mit `{ ...defaults, ...save.feld }` aufgefüllt. Das bedeutet: ein alter
Spielstand, dem ein neues Feld fehlt, lädt einfach mit dem Default für
dieses Feld, ohne dass man jemals `if (save.version < X)`-Migrations-
code schreiben muss. Schlägt das Laden trotzdem fehl (korruptes JSON,
fundamental andere Form), zeigt `showIncompatibleSaveDialog()` einen
Dialog mit "Neu anfangen" statt eines stillen Fehlers oder eines
halb kaputten Zustands. `performHardReset()` ist bewusst aus
`resetGame()` herausgezogen (ohne das native `confirm()`), damit der
Inkompatibilitäts-Dialog (der bereits eine eigene Bestätigung ist) nicht
noch ein zweites, hässliches Browser-Popup obendrauf zeigt.

## Auto-Load braucht die Einstellung VOR dem eigentlichen Laden

`shouldAutoLoad()` liest `settings.autoLoad` direkt aus dem rohen JSON
in `localStorage`, OHNE den Spielstand schon über `applySaveData()`
anzuwenden — sonst bräuchte man ein Henne-Ei-Problem ("um zu wissen, ob
ich laden soll, muss ich erst laden"). Bei kaputtem JSON liefert die
Funktion bewusst `true` zurück (nicht `false`): der Spieler soll den
Inkompatibilitäts-Dialog sehen, statt dass das Problem einfach
verschwiegen wird, weil das Parsen schon beim Sichtbarkeits-Check
fehlschlug.

## Zwei getrennte Verläufe, ein gemeinsamer Filter

Toast- und Dialog-Verlauf (`toastHistory`/`dialogHistory`, beide max.
100 Einträge) sind bewusst zwei separate Arrays mit eigenem Logging-Ort
(`toast.js` bzw. `dialog.js`, jeweils an der einen Stelle, durch die
JEDE Toast-/Dialog-Anzeige läuft) — eine gemeinsame Liste hätte bedeutet,
dass ein Schwall Toasts die letzten paar Dialogzeilen aus dem
Sichtfenster drängt. Die UI (`content.js`, `renderSettings()`) zeigt
beide trotzdem in EINEM "Verlauf"-Bereich, umschaltbar per Tab-Leiste
(`historyFilter`, dieselbe `.tab-bar`-Komponente wie im Erfahrungs-Tab) —
getrennte Datenhaltung und gemeinsame Präsentation sind hier zwei
unabhängige Entscheidungen.

## Hervorhebung beenden ≠ Block beenden — zwei verschiedene Bedingungen

Die Brot-Hervorhebung (Marktplatz→Krämer→Brot) und der harte Arbeits-
Block (`mustEatBread`) sahen anfangs wie dieselbe Bedingung aus, sind es
aber nicht: die Hervorhebung soll verschwinden, sobald der Spieler Brot
BESITZT (er hat gefunden, was er sucht), der Block bleibt aber bestehen,
bis er es tatsächlich ISST (`useFood()`). Lektion: wenn eine UI-Führung
(Hervorhebung) und eine Spielmechanik-Sperre (Block) zufällig an
derselben Flag hängen, sind das oft zwei Bedingungen, die nur zufällig
zeitlich zusammenfallen — sobald der User-Test zeigt, dass sie
unterschiedlich lange gelten sollen, getrennt auswerten, nicht eine
zweite Flag für denselben Zustand einführen.

## Export/Import über denselben Speicherpfad wie Speichern/Laden

`exportSaveToClipboard()`/`importSaveFromClipboard()` (`save.js`) lesen/
schreiben direkt `localStorage[SAVE_KEY]` und rufen danach `loadGame()`
ganz normal auf — kein eigener Parse-/Validierungspfad. Dadurch profitiert
der Import automatisch von derselben Inkompatibilitäts-Behandlung wie
ein normales Laden (`showIncompatibleSaveDialog()` bei kaputtem Text aus
der Zwischenablage). Die Clipboard-API erfordert einen sicheren Kontext
(HTTPS oder localhost) — schlägt `navigator.clipboard.*` fehl, einfach
einen Toast zeigen, kein harter Fehler.

## Changelog-Dialog: Versionsnummer als reiner Vergleichswert, nicht als Migrationslogik

`CURRENT_SAVE_VERSION` + `SAVE_CHANGELOG` (`state.js`) beantworten NUR
die Frage "was sollte der Spieler über die Zeit zwischen seinem
Spielstand und jetzt wissen" — sie haben nichts mit der Lade-Validierung
zu tun (die bleibt vollständig Form-basiert, siehe den Eintrag weiter
oben zu `applySaveData()`). `showSaveChangelogDialog()` sammelt einfach
alle `SAVE_CHANGELOG`-Einträge mit `version > geladene Version`,
flacht sie zu einer Liste ab und zeigt sie EINMALIG nach erfolgreichem
Laden — der nächste Speichervorgang stempelt automatisch die aktuelle
Nummer, daher kein eigener "schon gesehen"-Flag nötig. Wichtige Regel
für die Zukunft: bei jedem inhaltlich spürbaren Update `CURRENT_SAVE_
VERSION` um 1 erhöhen UND einen neuen `SAVE_CHANGELOG`-Eintrag mit
2–4 sehr kurzen Stichpunkten ergänzen — sonst sammelt sich unter einer
Versionsnummer wieder ein ganzer Rattenschwanz an Änderungen, wie es
rückwirkend für Version 4 nötig war (mehrere Feature-Runden, die vor
Einführung dieses Systems alle denselben hartcodierten `version: 3`
geschrieben haben).

## Bisher nicht behobene/offene Punkte

Mögliche Spezial-Freischaltungen für die absurd hohen Feldarbeits-
Levelschwellen (500.000 / 100.000.000 Durchgänge) sind noch nicht
definiert — Ideen aus der Diskussion: ein sichtbarer Titel/Spitzname
("Legende der Felder"), eine einmalige Bonus-Belohnung, oder ein
Late-Game-Multiplikator-Item, das die effektive Zähl-Geschwindigkeit
erhöht (z.B. "jede Arbeit zählt als 10"), damit die Schwelle überhaupt
in endlicher Zeit erreichbar wird. Noch nicht implementiert, bewusst
nur als Haken im Code (`WORK_LEVEL_THRESHOLDS`) hinterlassen. Siehe
sonst `notes/roadmap.md` für geplante Kapitel-2-Inhalte (Haus,
Waffenschmied-Freischaltung, weitere Vendors/Quests, weitere
NPC-Dialoge zum zwielichtigen Mann) und `notes/prestige-konzept.md`
für die grobe Fünf-Akte-Langzeit-Storyline (Gold- → Stärke- →
Magie/Intelligenz- → Zeit- → Götter-Prestige) inklusive Vorschlägen,
wie das bestehende `meta.resets`-System zu einer benannten,
spielerseitig sichtbaren Prestige-Währung ausgebaut werden könnte.
