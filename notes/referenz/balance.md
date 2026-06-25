# Balance- und Design-Kontrolldokument

Dient als Referenz bei Spieltest-Feedback: Was ist ein Bug, was ist Absicht?
Veraltete Werte sind als **⚠️ OBSOLET** markiert — im Zuge des Playtests prüfen und aktualisieren.

---

## Feldarbeit

| Wert | Aktuell | Ziel | Quelle |
|------|---------|------|--------|
| Basis-Dauer | 2000 ms | 2,5–3 Arbeiten/Minute | `WORK_DURATION_BASE_MS` in state.js |
| Mit fasterWork-Skill | 1200 ms (−40 %) | Klares Tempo-Gefühl | `meta.fasterWorkUnlocked`, actions.js |
| Basis-Gold Stufe 0 | 1 | Langsam, motiviert höhere Level | `WORK_LEVELS[0].goldBase` |
| Höchste Gold-Stufe (5) | 32 | Unerreichbar ohne Automation | `WORK_LEVELS[5].goldBase` |
| Müdigkeitsgewinn | 12,5 % | 4 Arbeiten → 50 % Müdigkeit | `WORK_TIREDNESS_GAIN` |
| Hungergewinn | 12,5 % | Synchron mit Müdigkeit | `WORK_HUNGER_GAIN` |

### Stufengrenzen (`WORK_LEVEL_THRESHOLDS`)
| Stufe | Durchgänge | goldBase | durationMod |
|-------|-----------|----------|-------------|
| 0→1 | 5 | 1 → 2 | 1,0 → 0,9 |
| 1→2 | 10 | 2 → 4 | 0,9 → 0,8 |
| 2→3 | 50 | 4 → 8 | 0,8 → 0,65 |
| 3→4 | 500.000 | 8 → 16 | 0,65 → 0,5 (nur mit Automation) |
| 4→5 | 100.000.000 | 16 → 32 | 0,5 → 0,35 (nur via Reset-Loops) |

---

## Müdigkeits-System

| Tier | Schwelle | durationMult |
|------|----------|--------------|
| Ausgeruht | 0–34 % | × 1,0 |
| Leicht müde | 35–54 % | × 1,15 |
| Müde | 55–74 % | × 1,45 |
| Sehr müde | 75–94 % | × 1,9 |
| Erschöpft | 95–100 % | × 2,8 |

**Schlafschuld (`sleepDebt`, 0–2):**
- 1 = Müdigkeitsaufbau × 1,2 (eingeschlafen mit > 70 %)
- 2 = Müdigkeitsaufbau × 1,4 (zweimal hintereinander)
- Abbau: vollständige Erholung (< 30 % nach Schlafen) −1

**Schlafqualität:**
- Straße: × 0,6 Erholung
- Absteige: × 1,0 Erholung
- ⚠️ PLAYTEST: Weitere Stufen (eigenes Bett, Lethkar, Velmark) noch nicht dokumentiert

---

## Hunger-System

| Tier | Schwelle | rewardMult | tirednessGainMult |
|------|----------|------------|-------------------|
| Satt | < 50 % | × 1,0 | × 1,0 |
| Hungrig | 50–79 % | × 0,85 | × 1,15 |
| Sehr hungrig | 80–99 % | × 0,5 | × 1,5 |
| Verhungernd | 100 % | × 0,1 | × 2,0 |

---

## Kampfsystem

### Spieler-Basiswerte
- HP-Basis: 30 + `maxHpBonus` pro Stärkelevel
- Basisschaden: 5–10 × `damageMult`
- Verteidigung: reduziert Schaden um `defenseBonus`

### Stärke-Stufen (`STRENGTH_LEVEL_THRESHOLDS` / `STRENGTH_LEVELS`)
| Stufe | XP | Label | damageMult | maxHpBonus | defenseBonus |
|-------|----|-------|------------|------------|--------------|
| 0 | 0 | Untrainiert | × 1,0 | 0 | 0 |
| 1 | 10 | Angehender Kämpfer | × 1,3 | +8 | 1 |
| 2 | 30 | Geübter Kämpfer | × 1,7 | +15 | 2 |
| 3 | 70 | Erfahrener Kämpfer | × 2,2 | +25 | 4 |
| 4 | 150 | Veteran | × 3,0 | +40 | 6 |
| 5 | 300 | Kriegsmeister | × 4,0 | +60 | 9 |

### Monster-Daten (`MONSTER_DEFS` in combat.js)

**Tier 1 — Treutheim-Region**
| Monster | HP | Schaden | XP | Gold | Zone |
|---------|----|---------|----|------|------|
| Hungriger Wolf | 12 | 3–6 | 3 | 3–7 | wald |
| Wilder Eber | 20 | 4–8 | 6 | 6–12 | wald |
| Schwarzbär | 35 | 7–13 | 12 | 10–18 | wald |
| Wegelagerer | 18 | 4–8 | 8 | 5–12 | wald |
| Waldtroll | 60 | 10–18 | 25 | 18–30 | tief |
| Sumpfwesen | 32 | 5–11 | 11 | 8–16 | tief |

**Tier 2 — Lethkar-Region**
| Monster | HP | Schaden | XP | Gold | Mut | Zone |
|---------|----|---------|----|------|-----|------|
| Steingolem | 80 | 12–22 | 35 | 25–40 | 1 | lethkar_tief |
| Schattenwolf | 55 | 15–25 | 28 | 20–35 | 0 | lethkar_wald |
| Nordbär | 100 | 14–26 | 42 | 30–50 | 2 | lethkar_wald |

**Tier 3 — Velmark-Region**
- ⚠️ PLAYTEST: Velmark-Monster nicht dokumentiert — aus combat.js ablesen

**Zeitkristall-Dropchance:** 10 % pro gewonnenem Kampf
**Niederlage:** −20 % Gold, HP auf 1

---

## Automatisierung

- Getriggert durch `advanceClock()` → `tickAutomationClock()` (spieluhr-basiert, nicht Echtzeit)
- Pro 60 Spielminuten ein `tickAutomation()`-Aufruf
- Jeder Zeitkristall = 1 Slot für eine automatische Aktion

> ⚠️ OBSOLET (Dokument-Altstand): "30 Sekunden Echtzeit-Tick" — stimmt nicht mehr, Automation läuft jetzt über Spieluhr

---

## EP-Skillbaum

> ⚠️ OBSOLET: Die Skill-Tabelle unten entspricht einem alten Stand (vor v0.15).
> Aktueller Baum: `EP_SKILL_TREE` in script/experience.js — dort nachlesen.
> Im Zuge des Playtests prüfen ob diese Tabelle erneuert werden soll.

---

## ⚠️ Offene Balancing-Fragen (Playtest)

1. **Kap 3 — Lethkar-Preise:** Alchemisten-Werkzeug 5000g, Essen 12–40g — grobe Schätzwerte, nie getestet. Ziel: ~X Minuten Spielzeit bis leistbar.
2. **Kap 4 — Fraktions-Ansehen:** Kosten pro Aktion und Zeit bis 30/80 Ansehen unbekannt.
3. **Kap 4 — Einfluss-Rate:** Wie viel ⚜ pro 20 Minuten akkumuliert der Spieler?
4. **Velmark-Monster:** Tier-3-Werte nicht in diesem Dokument — nachlesen in combat.js.
5. **Schlafqualität höhere Stufen:** Lethkar-Pension, Velmark-Pension, eigenes Bett — Werte nicht dokumentiert.
6. **Waldtroll-Sperre:** Aktuell < 30 XP hart gesperrt — sinnvoller wäre Stärkelevel 2 als Bedingung.
