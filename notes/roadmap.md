# Roadmap — Chroniken des vergessenen Weges

Stand: Stadt heißt **Treutheim** (vorher "Aschenfurt"). Der
Arbeitsplatz ist nicht mehr von Anfang an sichtbar — eine kleine
Dialogkette (Stadt betreten → Taverne → Wirt) führt erst dorthin, der
Wirt vermittelt die Feldarbeit ("jeder fängt mal klein an"). Feldarbeit
hat jetzt 6 feste Lohnstufen (1/2/4/8/16/32 Gold je Level, sichtbar als
vertikale Erfahrungsleiste direkt in der Job-Kachel + aufklappbares
Boni-Info-Panel). Für die geplante Fünf-Akte-Langzeit-Storyline
(Gold- → Stärke- → Magie- → Zeit- → Götter-Prestige) siehe
`notes/prestige-konzept.md`. Kapitel 1 ansonsten abgeschlossen, inkl.
Tag/Nacht-Zyklus, Hunger/Müdigkeit
(als weiche Debuffs, kein Hard-Block mehr), Marktplatz-Hub, Inventar-
System, Taverne mit NPCs/Dialog-Bäumen, Quest-System mit eigener
Übersichtsseite (zeigt erst Inhalte nach Annahme), globalem
immer-sichtbarem Nav-Bereich (Geschichte/Quests/Inventar) getrennt vom
ortsbezogenen Nav-Bereich, Chronik als eigener Buch-Button in der
Zielleiste, Feldarbeit mit Erfahrungs-/Level-System (5 Stufen, schwächt
negative und verstärkt positive Effekte der Arbeit), Schlafen an die
Nacht gekoppelt (nicht an Müdigkeit), Toasts mit konfigurierbarer
Anzeigedauer + gespeichertem Verlauf, sowie durchgängiger
Ich-Perspektive in kurzen, mehrstufigen Story-Dialogen. Dieses Dokument
sammelt geplante/diskutierte Erweiterungen, damit sie nicht aus dem
Kopf verloren gehen.

## Kapitel 1 — Status: fertig

- Story: Stadttor → Fremder beobachtet dich → Raub → Übergang.
- Arbeitsplatz: Feldarbeit (Tag, debufft statt blockiert bei
  Müdigkeit), Nachtwache (Nacht, 1×/Tag, **erst nach Quest-Annahme bei
  Brakka freigeschaltet**).
- Marktplatz-Hub: Krämer (Brot, Fisch/Honigkuchen ab Spieltag 3/5,
  Lederhandschuhe nach Reset 1 — alles landet im Inventar statt sofort
  konsumiert zu werden), Schmiede (Schmiedeofen — dauerhaft gesperrt bis
  Haus), Waffenschmied (gesperrt, Lore: "verkauft nur an registrierte
  Abenteurer").
- Schlafplatz: Straße (kostenlos) / Absteige (5 Gold) / eigenes Bett
  (gesperrt bis Haus).
- Inventar: eigene Seite, listet gekaufte Verbrauchsgüter, "Verzehren"
  wendet den Effekt erst dann an.
- Taverne: Korbin (Wirt, herzlich), Mira (charmant), Oswin (hochnäsig,
  gated Dialogoption ab 100 Gold), Brakka (Schmied, Quest-Geber).
- Quest "Nachtwache": unstarted → active (bei Brakka angenommen) →
  done (Nachtwache gehalten) → rewarded (+15 Gold bei Brakka).
- Bedürfnisse: Hunger (ab 80%: -50% Ertrag, +50% Müdigkeitsaufbau —
  niemals Hard-Block), Müdigkeit (gestaffelte Debuffs auf Dauer/Ertrag,
  niemals Hard-Block; nur die Nacht selbst sperrt Feldarbeit hart).
- Chronik: 1.1 Stadttor, 1.2 Zwielichtige Begegnung, 1.3 Der Raub.

## Bekannte Stellschrauben (Balancing, noch nicht final getunt)

- Raub-Schwelle aktuell bei 50 Gesamt-Gold — vom User als evtl. zu
  früh für die angepeilten ~5 Minuten Spielzeit eingeschätzt. Noch
  nicht angepasst.
- Tiredness-Tier-Werte (1.3x/1.7x/2.2x Dauer, 0.8x/0.5x/0.3x Ertrag)
  und Hunger-Beschleunigung (1.5x Müdigkeitsaufbau ab 80% Hunger) sind
  Erstentwürfe nach dem Soft-Lock-Fix — spielgetestet bis "ein
  Spieltag durchgespielt", nicht über mehrere Tage/Resets hinweg.
- Mira/Oswin-Dialogoptionen sind reine Flavor-Beispiele für gated
  Dialoge, ohne mechanische Belohnung. Falls Dialoge später echten
  Nutzen bringen sollen (Items, Infos, Rabatte), hier ansetzen.
- Feldarbeits-Level (`WORK_LEVEL_THRESHOLDS` in `actions.js`): Stufe 4
  (500.000×) und Stufe 5 (100.000.000×) sind absichtlich praktisch
  unerreichbar. Noch offen, was sie zusätzlich freischalten sollen —
  Ideen: ein sichtbarer Titel/Spitzname, eine einmalige Bonus-Belohnung,
  oder ein Late-Game-Item, das jede Arbeit mehrfach zählen lässt, damit
  die Schwelle überhaupt in endlicher Zeit erreichbar wird.

## Zwielichtiger Mann (Taverne) — angelegt, aber noch dünn

Seit dem letzten Feedback-Durchgang gibt es in der Taverne einen
gesperrten NPC ("Ein zwielichtiger Mann"), der erst nach dem
Beobachtet-Meilenstein (storyState >= 10102) ansprechbar wird. Aktuell
nur 2 Dialogknoten, kein mechanischer Effekt — reine Vorahnung auf den
Raub. Könnte später zur Quelle für Hinweise/Vorwarnung vor dem Raub
ausgebaut werden, oder zu einer optionalen Konfrontation.

## Geplante Kapitel-2-Inhalte (bewusst noch NICHT ausprogrammiert)

- **Eigenes Zuhause/Haus** als zentrales Mittelfrist-Ziel:
  - Schaltet den Schmiedeofen (Schmiede) frei.
  - Schaltet "Im eigenen Bett schlafen" (Schlafplatz) frei — vermutlich
    beste Erholung, kein Gold-Preis.
  - Vermutlich ein großer Gold-Sink oder eigene Quest-Linie.
- **Waffenschmied-Freischaltung**: Die Lore (Brakka erklärt "nur
  registrierte Abenteurer") legt nahe, dass der Status "registrierter
  Abenteurer" ein eigenes Freischalt-Kriterium werden sollte — aktuell
  bewusst NICHT an die Nachtwache-Quest gekoppelt (Scope-Entscheidung,
  siehe Konversation). Müsste eigene Bedingung bekommen (z.B. eine
  größere Abenteurer-Quest-Linie, nicht nur eine Nachtwache).
- Weitere Vendoren denkbar nach demselben Hub-Pattern (Alchemist,
  Kräuterhändler, ...) — Architektur ist darauf ausgelegt.
- Weitere Quests nach demselben State-Machine-Pattern
  (`unstarted/active/done/rewarded`, siehe SKILL.md) — Taverne ist als
  zentraler Quest-Hub gedacht, weitere NPCs können weitere Quests geben.
- Kapitel-2-Story selbst (nach dem Raub) ist inhaltlich komplett offen.
  `storyState 20100` ist aktuell nur ein Platzhalter-Screen
  ("Treutheim — Ein neuer Anfang").

## Offene Design-Fragen für später

- Soll Müdigkeit/Hunger auch über reale Zeit (nicht nur Aktionen)
  steigen? Aktuell bewusst nein (siehe SKILL.md, "Spielzeit läuft
  nicht in Echtzeit").
- Soll es eine Konsequenz geben, wenn der Spieler trotz Hunger/
  Müdigkeit einfach immer weiter Nachtwache hält statt zu schlafen
  (aktuell nur durch 1×/Tag-Limit und Erschöpfungs-Cap gebremst)?
- Lederhandschuhe-Freischaltung hängt aktuell an `meta.resets >= 1`
  (Meta-Counter) — das ist eine reine Code-Bedingung ohne
  In-Game-Begründung. Funktioniert, weil der Spieler die Bedingung nie
  sieht (Karte erscheint einfach), aber bei weiteren
  Reset-abhängigen Items lohnt sich eine erzählerische Verankerung
  (z.B. "Der Krämer vertraut dir erst, nachdem du etwas durchgemacht
  hast").
