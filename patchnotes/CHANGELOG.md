# Changelog — Chroniken des vergessenen Weges

Alle Versionen, chronologisch von neu nach alt.

---

## v0.17.0-alpha
- **Story** Kapitel 3 — Lethkar zugänglich nach Kapitel-2-Abschluss + 3 Mut. Stadt mit Taverne, Markt, Schlafplatz, Laboratorium.
- **Story** NPCs Varena, Thessa, Pereth mit vollständiger Dialog-Baumstruktur — Story 3.0–3.6 (Valdris-Spur, Brief-Entschlüsselung, Lagerhaus-Auftrag).
- **Neuerung** Alchemie-System: 5 Aspekte (Feuer/Wasser/Erde/Luft/Äther) mit Echtzeit-Fortschritt, Level-Ups geben Wissensdurst ✦.
- **Neuerung** Alchemie-Meilensteine: Aspekt-Level-Ups schalten konkrete Gameplay-Boni frei (Kampf-Schaden, MaxHP, Rohstoff-Bonus, Luft-Gold u.a.).
- **Neuerung** Wissensdurst-Skillbaum: 5 permanente Fähigkeiten (Forschungsinstinkt, Wissensspeicher, Doppelte Erkenntnis …).
- **Neuerung** Lethkar Markt: Alchemisten-Werkzeug (5000g, +50% Alchemie-Tempo) + Lethkarer Verpflegung (Suppe, Mehrkornbrot, Kräuterwein).
- **Bugfix** Lethkar-NPC-Dialoge (Varena/Thessa/Pereth) konnten nicht geöffnet werden — `openNpcDialogWithDef` war nicht definiert.

## v0.16.4-alpha
- **Balance** EP-Mindestschwelle für Neuanfänge: 50 → 300 Gold. Raub 2 (200g) ergibt nun keine EP mehr — erst Raub 3 (300g) und Raub 4 (500g).
- **Balance** „Weitblick"-Breakpoints starten jetzt bei 300g und verdoppeln sich: 300, 600, 1200, 2400 …
- **Bugfix** Schuften-Karte: Progressbar erscheint jetzt über dem Button statt darunter — kein Layout-Sprung mehr beim Klick.

## v0.16.3-alpha
- **Bugfix** Zieltext nach dem 4. Raub und zu Beginn von Kapitel 2 enthielt UI-Begriffe („Erfahrungs-Baum", „Reiter") — ersetzt durch immersive Formulierungen.
- **Bugfix** Paranoid-Skill: Nachteil-Zeile bricht jetzt im Detail-Panel auf eine eigene Zeile um.

## v0.16.2-alpha
- **Bugfix** Raub-Resets werden beim Laden automatisch nachgeholt, falls sie durch einen früheren Bug übersprungen wurden.
- **Bugfix** Raub-Story-Dialoge öffnen zuverlässig nach NPC-Dialogen — kein verlorener Reset-Callback mehr aus brakka.turnIn.

## v0.16.1-alpha
- **Bugfix** Erster Raub löst jetzt zuverlässig einen Reset aus, auch wenn gleichzeitig der Monolog zur ersten Nachtwache gezeigt wird.
- **Bugfix** Kapitel-2-Sieg konnte nicht ausgelöst werden — der Sieg-Callback nach der Konfrontation wurde durch ein internes Dialog-Close sofort unterbrochen.

## v0.16.0-alpha
- **Bugfix** Essen lindert jetzt leichte Müdigkeit statt sie zu erhöhen: Brot −4%, Fisch −8%, Honigkuchen −15%, Kaffee −16% (netto).
- **Bugfix** Taverne-Tab leuchtet nicht mehr, wenn Greta Rohstoffe erwartet, die noch nicht gesammelt wurden.
- **Bugfix** Dialogseiten-Guard: zuverlässiger umgeschrieben — kein DOM-Neuaufbau mehr, robuster bei schnellen Klickfolgen.
- **Neuerung** Sammeln bei 100 % Müdigkeit nicht mehr möglich — erst schlafen.
- **Neuerung** Skill-Detail zeigt jetzt an, wenn ein Skill weitere Fähigkeiten freischaltet.

## v0.15.4-alpha
- **Neuerung** Essen erzeugt jetzt leichte Müdigkeit: Brot +4%, Fisch +8%, Honigkuchen +15%, Kaffee netto −16% (Linderung überwiegt).
- **Bugfix** Taverne-Tab leuchtet nur noch auf, wenn wirklich etwas zu tun ist — nicht mehr direkt nach dem Vorarbeiter-Gespräch tagsüber.
- **Bugfix** Erfahrung-Sidebar (EP-Zähler + Neu-anfangen) ist erst nach dem ersten Neuanfang sichtbar.
- **Bugfix** NPC-Dialoge: Letzte Seite aktiviert Antwort-Buttons erst nach kurzer Pause, verhindert versehentliches Schließen.
- **Bugfix** Icons (⚙ Einstellungen, Kap-Anzeige, Ziel) korrekt — Sonderzeichen-Kodierung wurde bei einem früheren Cache-Buster-Update korrumpiert.

## v0.15.3-alpha
- **Bugfix** Alte Spielstände aus Kapitel 2 (Einzel-Raub-System) werden jetzt als inkompatibel erkannt — Download-Option + Neustart statt stillem Weiterfahren.
- **Bugfix** Spielstand-Changelog erscheint jetzt auch für sehr alte Spielstände (v0.13.x), die die Änderungen in v0.14–v0.15 nie angezeigt bekamen.
- **Bugfix** Krämer öffnet jetzt immer mit dem Essen-Tab (statt dem zuletzt aktiven).

## v0.15.2-alpha
- **Bugfix** Der Paranoid-Skill-Ast erscheint jetzt erst nach dem 4. Raub (nicht schon nach dem 1.).
- **Bugfix** Feldarbeit-Infopanel («/») wird automatisch eingeklappt, wenn man zu erschöpft zum Arbeiten ist.
- **Bugfix** Feldarbeit-Infopanel liegt jetzt korrekt über dem Verschnaufen-Button (z-index-Fix).

## v0.15.1-alpha
- **Balance** Raub 2/3/4 Goldschwellen angehoben: 200/300/500 Gold (war 75/100/125).
- **Bugfix** „Neu anfangen" war sofort sichtbar, bevor man Paranoid erlernte — jetzt korrekt verborgen bis zum Kauf.

## v0.15.0-alpha
- **Story** Neues Raub-System: 4 automatische Raub-Events (50/200/300/500 Gold), jeder mit eigenem Story-Dialog und auto-Reset. Nach dem 4. Raub ist Arbeit gesperrt.
- **Story** Neuer Skill-Ast: „Paranoid" (5 Fähigkeiten) — kaufbar nach dem 4. Raub. Schaltet „Neu anfangen" und den restlichen Erfahrungs-Baum frei.
- **Story** Kapitel 1.8 „Paranoid" — Story-Chronik-Eintrag nach Kauf der gleichnamigen Fähigkeit.
- **Neuerung** Jede erlernte Fähigkeit im Erfahrungs-Baum zeigt jetzt einen immersiven Ich-Perspektiv-Monolog.
- **Neuerung** Errungenschaften: 23 neue Einträge (Kapitel 1 und Erfahrungs-Weg).
- **Neuerung** Mira und Brakka erklären jetzt auf Nachfrage, warum Mira den Brief nicht selbst überbracht hat.
- **Bugfix** „Wachsamer Geist" erscheint jetzt korrekt in der Kategorie „Erstes Kapitel".
- **Bugfix** Greta und Kommandant Roswald zeigen jetzt korrekte ❗-Badges wenn ihre Quests auf Aufmerksamkeit warten.

## v0.14.6-alpha
- **Bugfix** Raub: Gold verschwindet jetzt erst nach dem Dialog, nicht schon davor.
- **Bugfix** Nach einem Neuanfang bleibt die Navigation in der aktuellen Stadt — kein ungewolltes Zurückfallen auf die Weltkarte.
- **Neuerung** Mira zeigt jetzt ein ❗-Symbol, bevor man sie das erste Mal auf einen Drink eingeladen hat.
- **Neuerung** Alle Zielleisten-Texte sind jetzt konsequent in Ich-Perspektive geschrieben.

## v0.14.5-alpha
- **Bugfix** Der Raub-Dialog konnte bei ungünstigem Autosave-Timing nicht erscheinen und den Erfahrungs-Tab dauerhaft gesperrt lassen — das wird jetzt beim Laden automatisch repariert.
- **Neuerung** Erster Besuch in der Schmiede wird mit einem kurzen Ich-Monolog begrüßt.
- **Neuerung** Beim ersten Erreichen von 100 % Müdigkeit erscheint ein einmaliger Monolog.
- **Neuerung** Gold- und EP-Gewinne werden als kurze schwebende Zahl in der Charakter-Anzeige animiert.

## v0.14.4-alpha
- **Neuerung** „Längere Pause" auf 4 Stufen erweitert: Stufe 3 verlängert auf 60 Min., Stufe 4 reduziert zusätzlich den Hunger. Super-Skill: Hunger & Müdigkeit steigen dauerhaft 10 % langsamer.
- **Neuerung** Update-Banner erscheint jetzt im Dokumentenfluss statt als Overlay.

## v0.14.3-alpha
- **Neuerung** Nach einem Update erscheint ein Dialog mit allen Änderungen seit der letzten gespielten Version.
- **Bugfix** Update-Dialog und Spielstand-Changelog erscheinen jetzt nacheinander statt sich zu überschreiben.

## v0.14.2-alpha
- **Bugfix** Errungenschaften im Erfahrungs-Weg waren unsichtbar, obwohl bereits freigeschaltet.
- **Neuerung** Update-Banner: das Spiel meldet sich automatisch, wenn eine neue Version verfügbar ist.

## v0.14.1-alpha
- **Bugfix** Brakkas Questmarkierung erscheint erst nach dem Waffenschmied-Besuch.
- **Bugfix** Uhrzeit-Hinweise stapeln sich nicht mehr bei schnellen Aktionen.
- **Bugfix** Vorarbeiter-Tab in der Taverne leuchtet jetzt jeden Abend erneut.
