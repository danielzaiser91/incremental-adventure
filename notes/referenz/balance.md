# Balance- und Design-Kontrolldokument

Dieses Dokument hält alle spielbaren Zahlenwerte mit Begründung fest.
Dient als Referenz bei Spieltest-Feedback: Was ist ein Bug, was ist Absicht?

---

## Feldarbeit

| Wert | Aktuell | Ziel | Quelle |
|------|---------|------|--------|
| Basis-Dauer | 2000 ms | 2,5–3 Arbeiten/Minute | `WORK_DURATION_BASE_MS` in state.js |
| Schneller mit Skill | 1200 ms (−40%) | Klares Gefühl von Tempo | `fasterWorkUnlocked`, actions.js |
| Basis-Gold pro Arbeit | 1 | Langsam, motiviert höhere Level | `goldBase` Stufe 0, actions.js |
| Höchste Gold-Stufe | 32 (Stufe 5) | Unerreichbar ohne Automatisierung | `goldBase` Stufe 5 = Legende |
| Müdigkeitsgewinn pro Arbeit | 12,5 % | 4 Arbeiten → 50 % Müdigkeit (Tier-Grenze) | `WORK_TIREDNESS_GAIN` |
| Hungergewinn pro Arbeit | 12,5 % | Synchron mit Müdigkeit | `WORK_HUNGER_GAIN` |

### Stufengrenzen Feldarbeit (`WORK_LEVEL_THRESHOLDS`)
- Stufe 0→1: 5 Durchgänge (wenige Minuten Echtzeit)
- Stufe 1→2: 10 Durchgänge
- Stufe 2→3: 50 Durchgänge
- Stufe 3→4: 500.000 — bewusst absurd, nur mit Automation erreichbar
- Stufe 4→5: 100.000.000 — nur via Automation + viele Resets

**Design-Absicht:** Der natürliche Play-Loop deckt Stufen 0–3 ab. Stufen 4–5 existieren als "Vorausgriff" für das Automatisierungssystem.

---

## Müdigkeits-System (überarbeitet v7)

| Tier | Schwelle | Dauer-Multiplikator | Vorher (v6) |
|------|----------|---------------------|-------------|
| Ausgeruht | 0–34 % | × 1,0 | 0–49 %: × 1,0 |
| Leicht müde | 35–54 % | × 1,15 | (neu) |
| Müde | 55–74 % | × 1,45 | 50–79 %: × 1,3 |
| Sehr müde | 75–94 % | × 1,9 | 80–99 %: × 1,7 |
| Erschöpft | 95–100 % | × 2,8 | 100 %: × 2,2 |

**Schlafschuld (`sleepDebt`):**
- 0 = kein Debuff
- 1 = Müdigkeitsaufbau +20 % (eingeschlafen mit >70 %, aufgewacht mit >30 %)
- 2 = Müdigkeitsaufbau +40 % (zweimal hintereinander schlecht geschlafen)
- Abbau: vollständige Erholung (<30 % Müdigkeit nach dem Schlafen) senkt Stufe um 1

**Schlafqualitäts-Stufen (unverändert):**
- Straße (Tier 1): × 0,6 Erholung → max. 60 % Erholung pro Nacht
- Absteige (Tier 3): × 1,0 Erholung → 100 % Erholung pro Nacht

---

## Hunger-System (unverändert)

| Tier | Schwelle | Ertrag | Müdigkeitsaufbau |
|------|----------|--------|-----------------|
| Satt | < 50 % | × 1,0 | × 1,0 |
| Hungrig | 50–79 % | × 0,85 | × 1,15 |
| Sehr hungrig | 80–99 % | × 0,5 | × 1,5 |
| Verhungernd | 100 % | × 0,1 | × 2,0 |

---

## Kampfsystem (Kapitel 2, neu in v7)

### Spieler-Basiswerte
- HP: 30 + Stärkelevel-Bonus
- Basisschaden: 5–10 (zufällig, × Stärke-Multiplikator)
- Verteidigung: reduziert eingehenden Schaden um `defenseBonus` (min. 0)

### Stärke-Stufen (`STRENGTH_LEVELS`)
| Stufe | XP-Schwelle | Label | Schaden× | HP-Bonus | Verteidigung |
|-------|-------------|-------|----------|----------|--------------|
| 0 | 0 | Untrainiert | × 1,0 | 0 | 0 |
| 1 | 10 | Angehender Kämpfer | × 1,3 | +8 | 1 |
| 2 | 30 | Geübter Kämpfer | × 1,7 | +15 | 2 |
| 3 | 70 | Erfahrener Kämpfer | × 2,2 | +25 | 4 |
| 4 | 150 | Veteran | × 3,0 | +40 | 6 |
| 5 | 300 | Kriegsmeister | × 4,0 | +60 | 9 |

### Monster-Daten (`MONSTER_DEFS`)
| Monster | HP | Schaden | XP | Gold | Mut | Zone |
|---------|----|---------|----|------|-----|------|
| Hungriger Wolf | 12 | 3–6 | 3 | 3–7 | 0 | wald |
| Wilder Eber | 20 | 4–8 | 6 | 6–12 | 0 | wald |
| Schwarzbär | 35 | 7–13 | 12 | 10–18 | 0 | wald |
| Waldtroll | 60 | 10–18 | 25 | 18–30 | 1 | tief (≥30 XP benötigt) |

**Zeitkristall-Dropchance:** 10 % pro gewonnenem Kampf.

**Niederlage:** −20 % Gold, HP auf 1 gesetzt.

---

## Automatisierung (Zeitkristall-System, neu in v7)

- Tick-Intervall: alle 30 Sekunden Echtzeit
- Jeder Zeitkristall = 1 Automatisierungs-Slot
- Verfügbare Aktionen: Feldarbeit, Holz hacken, Steine sammeln, Wildkraut sammeln
- Kein Überprüfung ob Nacht: Feldarbeit-Slot prüft `!isNight()` selbst

---

## EP-Skillbaum (unverändert, zur Referenz)

| Skill | Kosten | Effekt |
|-------|--------|--------|
| Lehrreiche Rückschläge | 1 EP | Job-Level wirken (Voraussetzung) |
| Sparsamkeit Stufe 1 | 1 EP | Marktpreise −10 % |
| Sparsamkeit Stufe 2 | 2 EP | Marktpreise −20 % |
| Eiserner Wille | 2 EP | Hunger-Müdigkeitsaufbau halbiert |
| Feldlohn | 2 EP | +1 Gold pro Feldarbeit |
| Aufmerksamer Lehrling | 2 EP | +1 Job-XP pro Feldarbeit |
| Schneller Lerner Stufe 1–5 | 1+1+2+2+3 EP | +10 % Job-XP je Stufe |
| Gedächtnisarbeit | 3 EP | Job-Level übersteht Neuanfang |
| Klarer Geist | 2 EP | +1 EP pro Neuanfang |
| Weitblick | 3 EP | Gold-Meilensteine zählen einzeln |
| Vorbereitung auf die Gilde | 5 EP | Brakka-Gilden-Questkette |
| Inventarwächter | 3 EP | Inventar übersteht Neuanfang |
| Ich schlafe wie ein Stein | 2 EP | +1 Schlafqualitäts-Stufe |
| Tierfreund | 2 EP | Haustiere können leveln |
| Nächtliche Routine | 3 EP | Nachtwache-Level-System |

---

## Bekannte Balancing-Lücken (TODO)

1. **Kampf-HP nach Neuanfang:** Sollte `playerStats.hp` nach einem EP-Reset (Neuanfang) auf `maxHp` zurückgesetzt werden? Aktuell: Nein (HP bleibt, ist persistenter als Gold).
2. **Waldtroll-Sperre bei <30 XP** ist ein fester Wert (nicht von Stärke-Level abhängig). Bei Überarbeitung sollte Stärkelevel 2 als Bedingung statt 30 XP gelten.
3. **Schlafschuld + Nachtwache-Debuff** interagieren: Beide erhöhen Müdigkeitsaufbau. Kann bei aktiver Schuld + Nachtwache + Hunger zu Todesspirale führen — bewusst belassen als Strafmechanismus.
4. **Automatisierung ohne Zeit-Vorstellung:** 30s Echtzeit ist willkürlich. Idealerweise sollte Automation auf Spieluhr-Stunden laufen, nicht auf Echtzeit.
