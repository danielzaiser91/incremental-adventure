# Lose Dialog-/Handlungsenden — Sammelstelle

Dieses Dokument sammelt Versprechen und Andeutungen im Spiel, die (noch)
nicht eingelöst wurden, damit sie nicht in einzelnen Dialogtexten
untergehen. Bei jeder neuen größeren Dialog-Runde hier kurz
durchschauen, ob sich ein Punkt erledigt hat oder ein neuer dazukommt.

## 0. "Neuer Arbeitsplatz Nachtwache" (Kommandant Roswald)

Nach 3x Nachtwache lädt Kommandant Roswald den Spieler in die Taverne ein
und gibt eine kurze Unterweisung, die das EP-Level-System für die
Nachtwache freischaltet (Skill "Nächtliche Routine"). Erreicht der
Spieler dort Stufe 3 (Lvl-Index 2, höchste Stufe) und arbeitet danach
einmal auf dem Feld, fragt Roswald, ob der Spieler der Stadtwache fest
beitreten möchte ("neuer Arbeitsplatz Nachtwache" laut Auftrag) —
**bewusst nur als Einladungs-Monolog umgesetzt, kein eigener Arbeitsplatz
gebaut.** Nächster Ausbauschritt: ein eigener "Stadtwache"-Arbeitsplatz
analog zu den Feldern (eigene Mechanik/Belohnungskurve, eigener Ort in
Treutheim), inklusive einer echten Annahme-/Ablehnungs-Entscheidung mit
Konsequenz.

## 1. Abenteurergilde-Registrierung (Brakka)

**Ursprünglicher loser Faden:** Brakka erwähnte beim ersten Gespräch
("offer"-Knoten), dass der Waffenschmied nur an registrierte Abenteurer
verkauft, und fragte, ob der Spieler wissen wolle, wie man das wird —
aber die Antwort blieb bei "Halte heute Nacht Wache, dann reden wir
weiter" stehen. Nach der Nachtwache-Belohnung gab es nie eine
Rückkehr zu diesem Thema.

**Status: in Bearbeitung.** Seit diesem Update gibt es einen
durchgängigen Pfad:
1. Vorläufiger Vertröstungs-Dialog im `idle`-Knoten Brakkas ("Und die
   Sache mit der Abenteurergilde?" → "Eine Sache nach der anderen.").
2. Gretas Questkette (siehe Punkt unten) führt zu einem teuren
   EP-Skill am Ende des Erfahrungsbaums: **"Vorbereitung auf die
   Gilde"** (100 EP + 1000 Gold, benötigt beide Endknoten
   "Nächtliche Routine" und "Weitblick").
3. Kauf dieses Skills schaltet bei Brakka die Quest
   `guildRegistration` frei — er erklärt (Knoten `guildExplain`), dass
   die Gilde teure Ausrüstung und mentale Vorbereitung verlangt, und
   bittet den Spieler, wiederzukommen, wenn er bereit ist.
4. Bestätigt der Spieler im `guildReadyCheck`-Knoten, dass er bereit
   ist, endet das Gespräch mit einem bewusst leicht meta gehaltenen
   Absatz: aktuelles Inhalts-Ende, Hinweis auf zukünftige Updates und
   den (noch linklosen) Discord.

**Was NICHT implementiert ist** (bewusst, siehe Auftrag "nur bis hier
entwickeln"): die eigentliche Gildenmitgliedschaft, ein echtes
Ausrüstungs-/Vorbereitungs-Minispiel für "teure Ausrüstung + mentale
Vorbereitung" (aktuell nur narrativ behauptet, nicht mechanisch
geprüft), der Waffenschmied-Vendor bleibt weiterhin gesperrt, Akt II
beginnt nicht automatisch.

### Vorschläge für die spätere Gilde-Integration

Der User-Vorschlag ("am Ende des Erfahrungsbaums") ist umgesetzt. Für
den nächsten Ausbauschritt, ein paar Ideen:

- **Eigene Gilden-Prestige-Währung** statt direktem Akt-II-Sprung —
  passend zu `prestige-konzept.md`s Vorschlag einer "Mut"/"Entschlossenheit"-
  Währung für den Akt-I→II-Übergang. Die "Vorbereitung auf die
  Gilde"-Investition könnte der eigentliche Auslöser für genau diesen
  Übergang werden, statt nur eine Konversation freizuschalten.
- **Eine echte Prüfung statt nur "Ja, ich bin bereit"**: ein kurzer
  Encounter oder eine Mini-Quest mit konkreten Anforderungen (z.B.
  Mindest-Gold UND Mindest-Ausrüstung gleichzeitig vorweisen), damit
  "bereit sein" mechanisch geprüft wird, nicht nur behauptet.
- **Mitgliedschafts-Vorteile** als konkretes Ziel: Rabatt beim
  Waffenschmied, Zugriff auf Aufträge/Encounter, ein Gilden-Rang-System
  mit eigenen Stufen — das würde auch den Waffenschmied-Vendor (aktuell
  rein dekorativ gesperrt) endlich mit Inhalt füllen.
- **Brakka als wiederkehrender Mentor über mehrere Akte** (bereits in
  `prestige-konzept.md` als Idee genannt) — die Gilden-Szene wäre ein
  guter Ankerpunkt dafür.

## 2. Mira's versiegelter Brief — Inhalt nie offenbart

Mira gibt dem Spieler einen versiegelten Brief für Brakka mit ("lass
es niemand anderen sehen"), Brakka nimmt ihn entgegen ("Sag Mira, ich
kümmere mich drum") — aber WAS im Brief stand und WARUM er so geheim
sein musste, wird nie aufgelöst. Bewusst als kleines, offenes Mysterium
stehen gelassen; eignet sich gut als späterer Subplot (z.B. Mira als
Informantin, ein Komplott, eine Schuld, die Brakka und Mira verbindet).

## 3. "Eigenes Zuhause" — referenziert, aber nicht erreichbar

Zwei verschiedene Stellen verweisen auf ein "eigenes Zuhause" als
Freischalt-Bedingung, ohne dass es einen Weg gibt, eines zu bekommen:
- Schlafplatz: "Im eigenen Bett schlafen" (gesperrt)
- Schmiede: "Schmiedeofen" (gesperrt)

Vermutlich Teil eines späteren Hausbau-/Sesshaftigkeits-Features. Bis
dahin bleiben beide Karten bewusst als sichtbare, aber gesperrte
Zukunftsversprechen stehen (kein Bug, aber im Hinterkopf behalten).

## 4. Der zwielichtige Mann: "Niemand Wichtiges. Noch nicht."

Bewusstes Foreshadowing, kein Bug — bereits in `prestige-konzept.md`
als möglicher Akt-I→II-Brücken-Charakter vorgesehen ("wiederkehrende
Figur, die vor späteren Gefahren warnt"). Hier nur als Querverweis
gelistet, damit diese Andeutung nicht doppelt unabhängig aufgegriffen
wird.

## 5. Oswin: "Vielleicht bist du doch nicht völlig wertlos"

Nach Freischaltung des "Geschäfte"-Gesprächs (100 Gold) gibt es eine
vage Anspielung auf etwas Größeres, aber keine Folgequest. Niedrige
Priorität — könnte reiner Flavour-Charakter bleiben, oder später eine
eigene kleine Questkette bekommen (Geschäftsmann-Kontakte, Handelsrouten,
o.ä.).

## 6. Feldarbeits-Endstufen (Querverweis)

`WORK_LEVEL_THRESHOLDS` Stufe 4/5 (500.000 / 100.000.000 Durchgänge)
sind absichtlich praktisch unerreichbar ohne ein zukünftiges
Beschleunigungs-Feature. Bereits ausführlich in `SKILL.md` unter
"Bisher nicht behobene/offene Punkte" dokumentiert — hier nur
verlinkt, nicht dupliziert.
