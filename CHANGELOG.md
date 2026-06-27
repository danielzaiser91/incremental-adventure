# Changelog — Chroniken des vergessenen Weges

Alle Versionen, neueste zuerst. Patch-Versionen (Bugfix-only) werden als Unterabschnitte geführt.

---

## v0.22 — Feldarbeit-Meisterschaft & Schlaf-Feintuning

**Neuerungen**
- Feldarbeit-Stufen 4 und 5 sind in Kapitel 2/3 erreichbar (neue narrative Freischaltungen)
- Neuer NPC Sivert (Agrarberater) in Roswalds Schenke — erscheint ab Feldarbeit-Stufe 3, kostet 800 Gold
- Nachtwache-Erholungs-Malus (−40 %) wird durch Schlaf-Boni abgeschwächt; Minimum 10 % Malus bleibt
- Körpergedächtnis-Durchbruch in Kap. 3: Feldarbeit-Stufe 5 über narrative Sequenz erreichbar

**Bugfixes & Balance (v0.22.1–v0.22.9)**

### v0.22.9
- Yevas Handelsnetz-Quest startete nicht: Investitionsangebot nach Gilden-Quest nicht erreichbar, Wartetimer nie gestartet — behoben

### v0.22.8
- Gildenmeisterin Yeva war nicht ansprechbar wenn „Yeva's Schuldner" bereits aktiv — Kontakt-Flag wird beim Laden repariert
- Velmarker Kettenrüstung erschien nicht im Inventar und reduzierte keinen Kampfschaden — Equipment-System integriert
- Velmark-Essen landete nicht im Inventar (alte buyVelmarkFood-Funktion überschrieb die neue)

### v0.22.7
- Quest „Drei Schichten, keine Ausreden": zählte fälschlich Nachtwache statt Stadtwache, Fortschritt zeigte immer 0/3
- Stadtwache-Karte hatte keinen sichtbaren Button — Klick funktionierte nur auf einem unsichtbaren Div
- Velmark-Preise korrigiert: Essen 200–900g, Schlafplatz 300–800g, Kettenrüstung 6.000g

### v0.22.6
- Eichhörnchen-Bonus (+X Rohstoffe/Aktion) wurde nie angewendet — Holz, Steine, Wildkraut zählen jetzt korrekt

### v0.22.5
- Waldtroll-Kampfbelohnung: 18–30g → 120–200g
- Waldtroll-Quest-Belohnung (Brakka): 25g → 750g
- Gildenprüfung-Belohnung (Brakka): 15g → 200g

### v0.22.4
- Waldtroll-Quest blieb nach Sieg auf „In Arbeit" — Abschluss-Check im Kampf fehlte; alte Saves werden beim Laden repariert
- Update-Banner: Klick auf „Aktualisieren" erzwingt jetzt cache-freies Laden
- Update-Banner erscheint nach 15 Sekunden statt 3 Minuten

### v0.22.3
- Velmark freigeschaltet bevor alle Kap.-3-Quests abgeschlossen — Abschiedsdialog bei Varena erschien zu früh
- Lethkar-Markt: kein Verkaufsangebot vorhanden, „Handel in der Kälte" nicht abschließbar — Verkaufsstand hinzugefügt

### v0.22.2
- Valdris' Lager: „Erkunden"-Button löste einen Absturz aus (Funktion nicht definiert)

### v0.22.1
- Inventar: Werkzeuge (Axt, Spitzhacke, Sichel) belegten fälschlich Inventarplätze — zählen nicht mehr gegen das Limit
- Gildenprüfung: Kills seit Spielstart gezählt statt ab Quest-Annahme; Abschluss-Trigger fehlte — Quest zeigt jetzt Fortschritt (X/5)
- Quest „Ein Dach über dem Kopf" blieb auf „In Arbeit" obwohl Haus vorhanden
- Schmiede zeigte „Erfordert Zuhause" auch nach Hauskauf — Hinweis führt jetzt korrekt zu Oswin
- Miras verschlüsselter Brief zeigte Funktionscode statt Beschreibung im Inventar
- Sieg-Dialog (Kap. 2 Ende) erschien zu früh nach der Fremden-Konfrontation — wartet jetzt auf Finales-Abschluss

---

## v0.21 — Dialog-Überarbeitung & Questfix

**Neuerungen / Qualität**
- Alle NPC-Dialoge und Story-Texte komplett überarbeitet — natürlicheres, fließendes Deutsch auf Romanqualität

**Bugfixes**
- gildeInvestition: Quest konnte nie abgeschlossen werden (Timer lief nie)
- gildeKorruption: Quest durch falschen State-Namen blockiert
- brennenderMut: kein Turn-in bei Brakka möglich; Schwelle korrigiert (3 Nächte statt 5)
- oswinsAuftrag: Oswin reagierte nicht auf laufende Quest

**Bugfixes (v0.21.1–v0.21.3)**

### v0.21.3
- Schlafqualität: alle Schlafplätze erholten bei hohem Skill-Bonus gleich viel — eigene Obergrenzen pro Schlafplatz (Straße 55 %, Absteige 72 %, Eigenes Bett 100 %)

### v0.21.2
- Schlafplatz: „Im eigenen Bett" erschien doppelt wenn Zuhause vorhanden

### v0.21.1
- Musik startete nach Seitenaufruf nicht (Browser-Autoplay-Sperre)

---

## v0.20 — 29 neue Quests & Kapitel 4

**Neuerungen**
- 29 neue Quests: Kap. 2 (8), Kap. 3 (10), Kap. 4 (10) — vollständige NPC-Dialoge, Quest-Ketten, Belohnungen
- Neuer NPC Harro (Hafen-Schuldner); erweiterter Gorr/Sele/Yeva-Dialog mit 3-stufigen Quest-Ketten pro Fraktion
- Velmarks Hafen: neue Spielfläche mit Hafenarbeit, Stadtwache, Unterwelt-Verhandlung, Archiv-Durchsuchen
- Valdris-Profil: 6 aufdeckbare Felder — vollständiges Bild des Antagonisten
- Finale Konfrontation: Vorbereitungsphase + Valdris-Finale als Abschluss von Kapitel 4
- 4 neue Tier-1/2-Monster (Bandit, Sumpfwesen, Eisengolem, Giftschlange) + 2 Tier-3 (Hafenwächter, Valdris-Agent)
- 5 neue Errungenschaften: Vollständigkeit Kap. 2/3/4, Valdris enthüllt, Hafenmeister

---

## v0.19 — Prestige-System & Velmark-Fraktionen

**Neuerungen**
- Kap.-2-Prestige: „Als Veteran zurückkehren" — Ruf als Metawährung, 5 Ruf-Fähigkeiten (Max-HP, Kampfschaden, Startgold u. a.)
- Kap.-3-Prestige: Lethkar erneut besuchen — Wissensdurst ✦ als dauerhafter Bonus pro Neustart
- Velmark: Pereth als Kontakt, Fraktions-NPCs (Yeva, Gorr, Sele) mit Dialog-Bäumen
- Neues Haustier: Stadtfalke — erscheint wenn Informantennetz wächst, dauerhafter Einfluss-Bonus
- 4 neue Errungenschaften: Veteran, Dreifach erprobt, Wissbegierig, Freier Himmel
- Informantennetz: tickt jede Minute automatisch Einfluss nach, solange Pereth freigeschaltet

---

## v0.18 — Kapitel 3 Abschluss + Kapitel 4: Velmark

**Story**
- Kapitel 3 Abschluss: Story 3.7–3.10 — Valdris' Lager, Varenas Enthüllung, Alchemie-Durchbruch, Kap.-3-Sieg-Dialog
- Kapitel 4 — Velmark: Fraktionssystem, Einfluss (⚜), Informantennetz, Story 4.1–4.10 inkl. Sieg-Dialog

**Neuerungen**
- Audio-System: Hintergrundmusik (Ambient, Taverne, Kampf) + 11 Soundeffekte — synthetisch via Web Audio API
- 50+ neue Errungenschaften für alle Kapitel + 8 geheime; kompaktes Kachel-UI mit Filter-Tabs
- Drei Fraktionen in Velmark: Händlergilde, Eiserne Bruderschaft, Stadtarchiv — je Reputationsbalken + NPC-Dialog
- Tier-2-Monster geben Wissensdurst ✦ als Kampf-Drop; Tier-3-Kämpfe in der Unterwelt geben ⚜ Einfluss
- Haustiere: Hauskatze (15 NW), Eule (20 NW), Wolf-Welpe (Waldtroll-Drop); überarbeitetes UI
- Geschichte-Seite: zustandsbasierte Ich-Texte für jede Story-Phase

**Bugfixes**
- Alchemisten-Werkzeug wird bei hartem Reset korrekt zurückgesetzt
- Erstkontakt-Story (4.2) triggert jetzt korrekt
- Erfahrungs-Baum: „Schaltet weitere Fähigkeiten frei" verschwindet nach Erwerb

---

## v0.17 — Kapitel 3: Lethkar & Alchemie

**Story**
- Kapitel 3: Lethkar zugänglich (Kap. 2 abgeschlossen + 3 Mut) — Stadtübersicht, Taverne, Markt, Schlafplatz
- NPCs: Varena (entschlüsselt Miras Brief), Thessa, Pereth mit vollständiger Story 3.0–3.6

**Neuerungen**
- Alchemie-System: 5 Aspekte (Feuer, Wasser, Erde, Luft, Äther) in Echtzeit — Wissensdurst als Prestige-Währung
- Alchemie-Meilensteine: Level-Ups schalten Gameplay-Boni frei (Kampfschaden, MaxHP, Rohstoff-Bonus u. a.)
- Wissensdurst-Fähigkeiten: 5 permanente Skills (Forschungsinstinkt, Wissensspeicher, Doppelte Erkenntnis …)
- Lethkar Markt: Alchemisten-Werkzeug (+50 % Alchemie-Tempo) und Lethkarer Verpflegung

**Bugfixes**
- Lethkar-NPC-Dialoge (Varena, Thessa, Pereth) konnten nicht geöffnet werden — openNpcDialogWithDef fehlte

---

## v0.16 — Überlebt und gelernt

**Neuerungen / Qualität**
- Quest-Belohnungen mit dauerhaftem Effekt werden direkt im Dialog hervorgehoben
- Benachrichtigungen bleiben jetzt 5 Sekunden sichtbar (vorher 2,6 s)
- Essen lindert jetzt leichte Müdigkeit: Brot −4 %, Fisch −8 %, Honigkuchen −15 %, Kaffee −16 %
- Skill-Detail zeigt an wenn ein Skill weitere Fähigkeiten freischaltet
- Zielleiste anklicken zeigt konkretes Teilziel (Goldstand vs. nächste Schwelle)

**Bugfixes (v0.16.1–v0.16.4)**

### v0.16.4
- EP-Mindestschwelle für Neuanfänge: 50g → 300g; Raub 2 (200g) gibt keine EP mehr
- „Weitblick"-Breakpoints starten bei 300g und verdoppeln sich: 300, 600, 1200, 2400 …
- Schuften-Karte: Progressbar erscheint jetzt über dem Button, kein Layout-Sprung

### v0.16.3
- Zieltext nach dem 4. Raub und Kap.-2-Start enthielt UI-Begriffe — ersetzt durch immersive Formulierungen
- Paranoid-Skill: Nachteil-Zeile bricht korrekt auf eigene Zeile um

### v0.16.2
- Raub-Resets werden beim Laden automatisch nachgeholt (früherer Bug übersprungen)
- Raub-Story-Dialoge öffnen zuverlässig nach NPC-Dialogen — kein verlorener Reset-Callback mehr

### v0.16.1
- Erster Raub löst jetzt zuverlässig einen Reset aus auch bei gleichzeitigem Nachtwache-Monolog
- Kapitel-2-Sieg konnte nicht ausgelöst werden — Sieg-Callback wurde durch Dialog-Close sofort unterbrochen

---

## v0.15 — Das Paranoia-System

**Neuerungen**
- 4 automatische Raub-Events bei 50/200/300/500 Gold — Story-Dialog + Auto-Reset
- Nach dem 4. Raub ist Arbeit gesperrt bis „Paranoid" erlernt wurde
- Neuer Skill-Ast: Paranoid → Scharf beobachtet → Instinkt → Kaltblütig → Unzerstörbar
- Story 1.5–1.8: Chronik-Einträge für die Räube und die Paranoia-Erkenntnis
- Skill-Lern-Dialoge: immersiver Ich-Monolog beim Kauf jeder Fähigkeit
- 23 neue Errungenschaften (Kap. 1 + Erfahrungs-Weg)
- Achievement-Bonus jetzt multiplikativ

**Bugfixes (v0.15.1–v0.15.4)**

### v0.15.4 / v0.15.3
- Alte Spielstände aus Kap. 2 (Einzel-Raub-System) werden als inkompatibel erkannt — Download + Neustart
- Essen erzeugt jetzt leichte Müdigkeit (umgekehrt zu v0.16: hier als Debuff eingeführt)
- Krämer öffnet immer mit dem Essen-Tab

### v0.15.2
- Paranoid-Skill-Ast erscheint erst nach dem 4. Raub (nicht schon nach dem 1.)
- Feldarbeit-Infopanel wird bei Erschöpfung automatisch eingeklappt

### v0.15.1
- Raub 2/3/4 Goldschwellen angehoben: 200/300/500g (war 75/100/125g)
- „Neu anfangen" war sichtbar bevor man Paranoid erlernte — korrekt verborgen bis zum Kauf

---

## v0.14 — Kapitel 3 Abschluss & Wissensdurst-Skillbaum

**Neuerungen**
- Pereth gibt einen echten Auftrag: Lagerhaus am Südtor erkunden — Belohnung 300 Gold + Story 3.6
- Wissensdurst-Skillbaum: 5 permanente Fähigkeiten die einen Neuanfang überleben
- Neue Fähigkeit „Längere Pause" (4 Stufen + Super-Skill: Hunger & Müdigkeit dauerhaft −10 %)
- Update-Banner: zeigt alle Änderungen seit der letzten gespielten Version
- Zeitkristall-Automatisierung läuft spielzeitbasiert (60 Spielminuten) statt Echtzeit-Intervall

**Bugfixes (v0.14.1–v0.14.6)**

### v0.14.6
- Raub: Gold verschwindet erst nach dem Dialog, nicht davor
- Nach Neuanfang bleibt Navigation in der aktuellen Stadt
- Mira zeigt ❗-Symbol vor dem ersten Drink-Angebot
- Alle Zielleisten-Texte in Ich-Perspektive

### v0.14.5
- Raub-Dialog konnte bei Autosave-Timing-Problem den Erfahrungs-Tab dauerhaft sperren — beim Laden repariert
- Erster Schmiedebesuch, erste 100 % Müdigkeit: einmalige Ich-Monologe
- Gold- und EP-Gewinne als schwebende Animation in der Charakter-Anzeige

### v0.14.4
- „Längere Pause" auf 4 Stufen erweitert
- Update-Banner im Dokumentenfluss statt als Overlay

### v0.14.3
- Nach einem Update erscheint ein Dialog mit allen Änderungen seit der letzten Version
- Update-Dialog und Spielstand-Changelog erscheinen nacheinander statt sich zu überschreiben

### v0.14.2
- Errungenschaften im Erfahrungs-Weg waren unsichtbar obwohl freigeschaltet
- Update-Banner: automatische Erkennung neuer Versionen

### v0.14.1
- Brakkas Questmarkierung erscheint erst nach Waffenschmied-Besuch
- Uhrzeit-Hinweise stapeln sich nicht mehr
- Vorarbeiter-Tab leuchtet jeden Abend erneut

---

## v0.13 — Haustiere, Lethkar & Expeditionen

**Neuerungen**
- Eigenes Zuhause: Oswin vermittelt Hauskauf (2.000g) und Schmiede-Umbau (1.200g) — bestes Schlaflevel kostenlos
- Haustiere: seltene Drops aus dem Jagdgebiet → Greta tauscht sie gegen Hund, Rabe, Hase, Eichhörnchen (je mit Bonus)
- Expeditionen: zwei einmalige Story-Expeditionen + vier wiederholbare Grind-Expeditionen mit Echtzeit-Timer
- Neue Story-Momente: erster Kampfverlust, erster Waldtroll-Sieg, erste abgeschlossene Expedition, erstes Betreten des Hauses
- Update-Banner: automatische Erkennung neuer Versionen

**Kapitel 3 (Vorschau)**
- Lethkar zugänglich: Varena, Thessa, Pereth mit Alchemie-System und Valdris-Quest-Linie
- Alchemie: 5 Aspekte in Echtzeit, Wissensdurst als Prestige-Währung
- Tier-2-Monster im Jagdgebiet nach Lethkar-Freischaltung

---

## v0.12 — Stadtwache & Super-Skills

**Neuerungen**
- Vier neue Super-Skills für bestehende Fähigkeiten (Eiserner Wille+, Geschickte Hände+, Nächtliche Routine+, Fest verschnürt+)
- Stadtwache: neuer Tagesjob — erreichbar nach dem Waldtroll-Sieg, mit Level-System und Belohnungs-Progression

---

## v0.11 — Stabilisierung

**Neuerungen / Qualität**
- Autospeicher-Intervalle wählbar: 30 Sek, 1 Min, 2 Min, 5 Min
- Chronik-Button und neue Einträge leuchten bis der Spieler sie bemerkt
- Diverse Balance- und Dialog-Korrekturen

---

## v0.10 — Kapitel 2: Die Wildnis ruft

**Neuerungen**
- Greta, die Krämerin: eigene Questkette (Rohstoffe sammeln und Laden aufbauen)
- Neuer Sammelplatz: Holz, Stein und Wildkraut am Stadtrand
- Kommandant Roswald und die Nachtwache-Karriere (nächtliche Schichten für Gold und EP)
- Jagdgebiet: Wölfe, Skelette, Waldtroll — eigenes Kampfsystem mit HP und Ausrüstungs-Slots
- Zeitkristalle: seltene Drops schalten Automatisierungs-Slots frei
- Erfahrungs-Skillbaum auf drei Äste erweitert; neue Super-Skills; Inventar-Rückverkauf
- Lehrhaus: Oswin vermittelt besondere Lektionen
- Automatisches Speichern/Laden

**v0.10.1 — Story, Mobile & QoL**
- Responsive Design für Mobilgeräte (Drawer-Layout, Touch-optimiert)
- NPC-Kacheln zeigen Verfügbarkeits-Punkte mit Hover-Info
- Neue EP-Fähigkeit „Lange Schicht": 2-Stunden-Feldarbeit mit doppeltem Ertrag
- Neue Super-Skills: Klarer Horizont und Traumloser Schlaf
- Spur des Diebs: Detektiv-Quest durch Kapitel 2 mit Sieg-Dialog + Kap.-3-Teaser
- Drei neue geheime Errungenschaften + Kapitel-2-Errungenschaft
- Beschädigter Spielstand: Download-Button + Discord-Link statt blindem Neustart
