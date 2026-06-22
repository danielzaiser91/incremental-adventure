# Kapitel 3 — Im Schatten der Einsicht
*Lethkar · Tier 2 · Prestige-Währung: Einsicht*

**Status: Design abgeschlossen — Implementierung ausstehend**
*Letzte Aktualisierung: 22.06.2026*

---

## Entscheidungsprotokoll (22.06.2026)

- **Stadtname:** Lethkar ✅
- **Alchemie-Mechanik:** Echtzeit-Progress-Bars pro Aspekt, Spieler wählt aktiven Aspekt ✅
- **Mut als Eingangskapital:** `mut.points >= 3` als Freischalt-Bedingung für Lethkar ✅

---

## Story-Arc

Treutheim ist erschöpft und weitgehend automatisiert. Der Fremde hat den Schatten über den Spieler informiert. Die Abenteurergilde ruft nach Lethkar — dort ist das Netzwerk des Schattens aktiver, und Miras Brief führt zu einer Kontaktperson.

**Hauptthema:** Wer ist der Schatten, und was will er wirklich?

| ID | Titel | Auslöser | Kern-Beat |
|----|-------|---------|-----------|
| 3.1 | Ankunft in Lethkar | Lethkar betreten | Stadt ist anders — größer, kälter, unübersichtlicher |
| 3.2 | Der Brief spricht | Miras Kontakt (Varena) gefunden | Brief enthüllt: Schatten sammelt nicht Gold, er sammelt Menschen |
| 3.3 | Die echte Gilde | Erste Gilden-Mission angenommen | Gilde in Lethkar ist eine Institution, keine Durchreiche |
| 3.4 | Der Alchemist | Alchemie-Mentor getroffen | Lernmechanik eingeführt; Mentor hat eigene Vergangenheit mit Schatten |
| 3.5 | Ein bekanntes Muster | Lethkarer Räuber folgen demselben Schema wie in Treutheim | Schatten operiert überall gleich — System, kein Zufall |
| 3.6 | Verrat | Gilden-Mitglied arbeitet für den Schatten | Niemand ist sicher; Spieler steht allein |
| 3.7 | Einsicht I | Spieler zerstört Schattens Lethkar-Operation | Was er sammelt, ist keine Ware — es sind Loyalitäten |
| 3.8 | Der Name | Varena nennt einen Namen | Schatten = Valdris; hat Verbindungen zu einer Macht jenseits Lethhars |
| 3.9 | Einsicht II | Prestige-Moment; Alchemie-Durchbruch gibt Spieler einen Vorteil | "Ich bin nicht mehr der Gejägte." |
| 3.10 | Der nächste Horizont | Kap-3-Abschluss; Konfetti + Kap-4-Teaser | Valdris ist geflohen. Sein Ziel: Einfluss über Stadtgrenzen hinaus. Das erfordert andere Mittel. |

**Goldener Faden zu Kap 4:**
Valdris baut keine kriminelle Bande — er baut eine Macht. Kap 4 ist kein weiteres Aufspüren. Es ist ein Krieg: der Spieler muss eigene Allianzen, Reputation und Einfluss aufbauen, bevor Valdris seinen Plan abschließt.

---

## Gameplay-Loop

```
Tag:
  → Alchemie-Forschung (Aspekt wählen → Echtzeit-Progress)
  → Lethkarer Marktplatz (Tränke automatisch verkauft, Tier-2-Waren)
  → Gilden-Quests (Missionen, Belohnungen in Einsicht + Gold)

Abend/Nacht:
  → Magieforschung (Nacht-Pendant zur Alchemie, eigene Aspekte)
  → Neue Monster Tier 2 (stärker, Belohnungen in Einsicht)
  → NPC-Gespräche (Varena, Gildenmeisterin, Mentor)

Neuanfang:
  → Einsicht als neue Prestige-Währung
  → Magie-Skillbaum (separater Baum)
  → Mut bleibt aus Kap 2 erhalten
```

**Kern-Fantasie:** Vom Kämpfer zum Wissenden. Stärke allein reicht nicht — Verständnis der Welt ist die eigentliche Waffe.

---

## Alchemie — Berufs-System

Alchemie ist der Kap-3-Kern-Job. Kein Klick-und-warte — der Spieler wählt einen **Aspekt**, der dann in Echtzeit Fortschritt macht.

### 5 Aspekte

| Aspekt | Icon | Auswirkung auf Spiel |
|--------|------|---------------------|
| **Kräuterkunde** | 🌿 | Rohstoff-Yields beim Sammeln; unlock seltener Zutaten |
| **Tränke brauen** | ⚗ | Gold-Einkommen (Tränke → Markt); Produktionsrate + Preis skalieren |
| **Toxikologie** | ☠ | Kampf: Giftschaden auf Feinde; eigene Giftresistenz |
| **Trankwirkung** | ✨ | Effektivität aller Tränke beim Benutzen (Heilen, Boni) |
| **Heilungsmedizin** | ❤️ | Max-HP-Bonus; HP-Regen nach Kampf; Schlaf-Erholung + |

### Progress-Kurve (Diminishing Returns)

Punkte nötig pro Level-Up:

| Level | Punkte nötig | Zeit bei 1 Pkt/s | Zeit bei 2 Pkt/s |
|-------|-------------|-----------------|-----------------|
| 0 → 1 | 100 | 1 min 40s | 50s |
| 1 → 2 | 300 | 5 min | 2 min 30s |
| 2 → 3 | 900 | 15 min | 7 min 30s |
| 3 → 4 | 2 700 | 45 min | 22 min |
| 4 → 5 | 8 100 | 135 min | 67 min |

*Maximalstufe pro Aspekt: 5. Alle 5 auf max = Großmeister.*

### Meilensteine (Auswahl)

| Aspekt | Level | Bonus |
|--------|-------|-------|
| Kräuterkunde 1 | +1 Rohstoff je Sammelaktion |
| Kräuterkunde 2 | Seltene Zutat (Mondkraut) wird sammelbar |
| Tränke brauen 1 | 1 Trank/Tag → 10g automatisch |
| Tränke brauen 2 | 2 Tränke/Tag → je 20g |
| Tränke brauen 3 | 3 Tränke/Tag → je 35g; eigene Tränke im Inventar |
| Toxikologie 1 | Kampf: +2 Giftschaden/Runde bei vergifteten Gegnern |
| Toxikologie 2 | −30 % eingehender Gift-Schaden |
| Trankwirkung 1 | +25 % Heilwert aller Tränke |
| Trankwirkung 2 | Tränke geben temporären Schadensbonus |
| Heilungsmedizin 1 | +10 Max-HP |
| Heilungsmedizin 2 | +5 HP-Regen nach jedem Kampf |
| Heilungsmedizin 3 | Schlaf regeneriert 10 % mehr |

### Berufsstufe (Gesamt-Level)

Summe aller Aspekt-Levels bestimmt den Titel:

| Summe | Titel |
|-------|-------|
| 0–4 | Novize |
| 5–9 | Lehrling |
| 10–14 | Geselle |
| 15–19 | Experte |
| 20–24 | Meister |
| 25 | Großmeister |

### Modifier-Quellen

- **Forschungstempo+** (EP-Baum Kap 3): +25/50/75/100 % Fortschritt/s
- **Forschungsertrag+** (Gilden-Belohnung): Bonus-Punkte pro abgeschlossenem Level
- **Mentors Rat** (Einmal-Bonus nach Story 3.4): +20 % auf alle Aspekte dauerhaft
- **Alchemisten-Werkzeug** (Marktplatz Lethkar, ~500g): +50 % Tempo

---

## Neue Orte in Lethkar

| Ort | Freischaltbedingung |
|-----|-------------------|
| Lethkar (Übersicht) | Kap-3-Beginn |
| Alchemie-Labor | Nach Mentor-Gespräch (Story 3.4) |
| Gildenhaus | Nach Story 3.3 |
| Lethkarer Markt | Sofort |
| Unterkunft (Miete) | Sofort (kein Eigentum — Spieler ist Gast) |
| Tier-2-Jagdgebiet | Nach Gilden-Mitgliedschaft bestätigt |

---

## Prestige-Währung: Einsicht

- Entsteht durch: Aspekt-Level-Ups, Gilden-Missionen, bestimmte Story-Entscheidungen
- Verwendung: Magie-Skillbaum (eigener Baum, parallel zu EP-Baum)
- Übersteht Neuanfang
- Eindruck: Einsicht ist nicht "mehr Gold" oder "mehr Stärke" — es ist Verständnis. Magie-Skills verändern wie das Spiel funktioniert, nicht nur wie schnell es geht.

---

## Kapitel 4 — Ausblick

**Thema:** Krieg der Schatten — Reputation, Diplomatie, Einfluss
**Antagonist:** Valdris (jetzt namentlich bekannt) baut eine überregionale Macht auf
**Mechanik:** Fraktionssystem — verschiedene Stadtfraktionen haben Meinungen vom Spieler; Diplomatiegespräche; Sprachen-System (unlock neuer Dialogoptionen/Gebiete)
**Prestige:** Einfluss als neue Währung
**Kern-Fantasie:** Vom Wissenden zum Anführer. Alone you can't stop Valdris — you need allies.

---

## NPCs Kap 3

| NPC | Ort | Rolle |
|-----|-----|-------|
| Varena | Lethkar (Taverne) | Miras Kontakt; Händlerin mit Netzwerkwissen |
| Gildenmeisterin Thessa | Gildenhaus | Questgeberin; streng, misstrauisch gegenüber Fremden |
| Alchemist Pereth | Labor | Mentor; selbst ehemaliges Schattens-Opfer |
| Valdris | (unsichtbar bis 3.8) | Der Schatten; erscheint nie direkt bis Kap 4 |
| Roswald (optional) | Lethkar-Garnison | Kann nach Lethkar versetzt worden sein — Kontinuität |
