# Kapitel 1 — Das Stadttor
*Treutheim · Tier 1 · Prestige-Währung: Erfahrungspunkte (EP)*

---

## Story-Arc

Ein Bauernjunge verlässt den Hof seines Vaters auf der Suche nach einem eigenen Leben. Treutheim ist die erste Station — keine Destination, sondern ein Anfang.

| Eintrag | Titel | Auslöser |
|---------|-------|---------|
| 1.1 | Das Stadttor | Stadttor betreten |
| 1.2 | Zwielichtige Begegnung | Gold-Meilenstein → Fremder taucht auf |
| 1.3 | Die erste Nacht | Erster Schlaf |
| 1.4 | Der Raub | Gold-Meilenstein → Raub findet statt |

**Wendepunkt:** Der Fremde raubt den Spieler. Das Geld ist weg — aber der Raub schaltet das EP-System frei. Aus Opfer wird jemand, der begreift: Wissen übersteht jeden Verlust.

**Kapitelende:** Kein explizites Sieg-Event. Der Spieler wählt selbst den Neuanfang im Erfahrungs-Tab.

---

## Gameplay-Loop

```
Aufwachen (Tag)
  → Feldarbeit (Gold, Hunger/Müdigkeit steigen)
  → bei Hunger: Marktplatz → Brot kaufen
  → Abend: Taverne (Mira, Wirt, Oswin, Straßenkehrer)
  → Nacht: Schlafplatz wählen
  → nächster Tag

Parallel: Rohstoffe sammeln → Greta verkaufen → Quests
Parallel: Nachtwache (Nacht-Job, früher Zugang zu Roswald)
```

**Kern-Fantasie:** Vom Niemand zum Handwerker. Aus jedem Neuanfang etwas mitnehmen, das bleibt.

---

## Freigeschaltete Orte (in Reihenfolge)

1. Treutheim (Übersicht) — sofort
2. Taverne — sofort, Wirt vermittelt Feldarbeit
3. Arbeitsplatz (Feldarbeit) — nach Wirt-Gespräch
4. Marktplatz — nach erstem Hunger-Debuff
5. Schlafplatz — nach erster Nacht
6. Sammelplatz (Rohstoffe) — nach Greta-Quest-Kette
7. Erfahrungs-Tab — nach dem Raub
8. Lehrhaus — nach Oswin-Gespräch (Ende Kap 1 / Übergang)

---

## Mechaniken

| Mechanik | Details |
|----------|---------|
| **Feldarbeit** | Kern-Job, Progressbar ~3s, Level-System (6 Stufen), Basislohn steigt |
| **Lange Schicht** | Skill: 2h-Schicht, doppelter Ertrag (EP-Baum, `longShift`) |
| **Hunger/Müdigkeit** | 0–100, Hunger reduziert Ertrag bei ≥80%, Müdigkeit verlängert Dauer |
| **Nachtwache** | Nacht-Job mit Schlaf-Debuff; Level-System nach Roswald-Training |
| **Rohstoffsammeln** | Holz/Stein/Wildkraut mit Werkzeug → Greta → Gold |
| **Schlaf** | Nur nachts; Qualität 0–3 (Straße/Absteige/Zimmer); beeinflusst Erholung |
| **Inventar** | 12 Slots, Ausrüstung (Lederhandschuhe, Werkzeug) separat |
| **EP & Neuanfang** | Manuell auslösbar; Gold/Inventar/Skills resetten; EP + Superflächenerskills bleiben |

---

## NPCs

| NPC | Ort | Rolle |
|-----|-----|-------|
| Wirt (anonym) | Taverne | Jobvermittlung Feldarbeit; Quest-Gate |
| Mira | Taverne (abends) | Soziales Hub; Hinweise; trinkt mit dir |
| Oswin | Taverne (abends) | Lehrer-Gate; Super-Skill-Einführung |
| Vorarbeiter | Arbeitsplatz | Bonus nach 10 Feldarbeiten (+1 Gold dauerhaft) |
| Greta (Krämerin) | Marktplatz | Händlerin + eigene Questkette (Rohstoffe) |
| Roswald | Taverne (abends) | Nachtwache-Training nach 3 Nachtwachen |
| Straßenkehrer | Treutheim | Flavor; kleiner Tip |

---

## EP-Skillbaum (Kap 1 relevant)

- **Lehrreiche Rückschläge** (1 EP) — Kern-Unlock, schaltet Job-Level frei
- **Geschickte Hände** (3 EP) — Feldarbeits-Level übersteht Neuanfang
- **Überzeugungskraft** (10 EP) — +1 Gold/Feldarbeit
- **Sparsamkeit** (4–8 EP) — Marktplatz −10/20 %
- **Fest verschnürt** (12 EP) — Inventar/Ausrüstung überstehen Neuanfang
- **Ich schlafe wie ein Stein** (10 EP) — +1 Schlafqualitätsstufe
- **Tierfreund**, **jobXpBonus**, **quickLearner** — verfügbar, aber Kap-2-relevant

**Super-Skills (Lehrer):** Stählerner Wille+, Muskelgedächtnis+, Eiserne Wacht+, Dicker Rucksack+

---

## Prestige-Währung: EP

Entsteht durch manuellen Neuanfang (Gold-abhängig). Übersteht alle Resets. Wird im Skillbaum ausgegeben. Schaltet nichts Neues inhaltlich frei — verstärkt nur den Kern-Loop.

---

## Übergang zu Kapitel 2

**Trigger:** Gold-Meilenstein → Raub-Ereignis (`storyState 20100`)
Spieler behält: EP, freigeschaltete Skills, `fieldworkMemory`-Level, Inventar (wenn `inventoryKeeper`).
Spieler verliert: Gold, normale Progression.

**Was sich ändert:** Abenteurergilde wird über Brakka zugänglich. Jagdgebiet öffnet sich. `mut` als zweite Prestige-Währung erscheint.
