# Implementierungsplan — Chroniken des vergessenen Weges
Stand: 22.06.2026 | Priorisiert, technisch detailliert

---

## ARCHITEKTUR-VISION (festgehalten 22.06.2026)

### Weltkarte & Kapitelstruktur
- **1 neuer Ort pro Kapitel.** Treutheim = Kap 1, neue Stadt = Kap 2+, weitere folgen.
- **Weltkarte zeigt** neben Orten: Verbindungswege, Points of Interest (Jagdgebiet-Erweiterungen, Dungeons, Händlerkarawanen), Fortschritts-Indikator pro Ort ("Automatisiert", "Aktiv", …).
- **Navigation zwischen Orten ist instant** (kein Reise-Timer). Aber: "Expedition"-Tab als eigenständige Mechanik (Zeit → Expeditionsfortschritt, Erlebnisse, Story, Stärkung).

### Ortsstruktur & Tier-System
- Alle Rohstoffe, Arbeiten und Waren eines Orts gehören einem **Tier** (Treutheim = Tier 1, Stadt 2 = Tier 2). Spieler erkennt sofort den Qualitätsunterschied.
- Stadt 2 wird zugänglich **erst wenn Treutheim weitgehend automatisiert ist** (definierter Schwellwert noch festzulegen). Keine freie Rückkehr zu besseren Treutheim-Schlafplätzen wenn Stadt-2-Schlafoptionen schlechter wären → Tier-2-Optionen müssen Tier-1 übertreffen.

### Automatisierung & Treutheim-Rückzug
- Alle Tier-1-Arbeiten werden nach und nach automatisierbar: Feldarbeit ✓, Sammelplatz ✓, Nachtwache (geplant), Stadtwache (geplant).
- **Kein Hunger/Müdigkeit-Malus** bei automatisierten Aktionen (Zeitkristalle = parallele Zeit, nicht gedoppelte Erschöpfung). ✓ Implementiert 22.06.2026.
- Automatisierung erfordert Mindest-Manualarbeit als Unlock-Condition.

### Berufe je Kapitel (KEINE Spezialisierungswahl)
- Kap 1: Fokus Gold → Feldarbeit, Sammelplatz, Nachtwache
- Kap 2: Fokus Stärke → Stadtwache, Schmiede (erstes handwerkliches Gewerk)
- Kap 3: Fokus Magie → neue Berufe (Alchemie, Magieforschung)
- Kap 4+: Reputation, Diplomatie, Sprachen
- **Kein Mischmasch**: pro Kapitel ein klares Thema, eine Steigerungskurve.

### Zuhause = Heimatbasis (Treutheim, einmalig)
- "Mein Haus" in Treutheim: einmaliger Kauf über Oswin, 2000 Gold. Dauerhaft in `meta.hasHome`.
- In anderen Städten: Unterkunft (Miete), kein Eigentum — signalisiert "noch Gast hier".
- Das Haus schaltet: eigenen Schlafplatz + Schmiede als erste Sub-Location.
- Schmiede ist NICHT im Hauskauf inklusive → separater Umbau (≥ 1000–1500 Gold, genaue Balance bei Implementierung).
- Langfristig: Haus = Hub für persönliche/handwerkliche Features.

---

## ZULETZT IMPLEMENTIERT

- ✅ NPC-Verfügbarkeitsindikator (22.06.2026): farbiger Punkt auf NPC-Kacheln (grün=immer, gelb=abends, grau=unklar), mit Hover-Tooltip in Ich-Perspektive.
- ✅ Tooltip-Basiswert-Anzeige: "Errechnete Werte" zeigt jetzt Basiswert über Modifikatoren.
- ✅ Automatisierungs-Overhaul: kein Hunger/Müdigkeit, neue List-UI mit Unlock-Conditions, fieldPay_super im Tooltip.
- ✅ Save-Kompatibilität: Zeitkristall-Deduplication-Migration in save.js.

---

## 1. Stadtwache-Arbeitsplatz ★ PRIORITÄT 1

**Entscheidungen getroffen:**
- Tagesschicht (nicht Nacht — Nachtwache bleibt eigenständig)
- Ablehnen ist rückgängig machbar: Roswald fragt später erneut ("Hast du es dir nochmal überlegt?")
- Freischaltbar erst wenn Feldarbeit-Loop vollständig erworben ist (Skills + Automation)
- Wird zum "neuen Kern-Loop" von Kap 2 — löst Feldarbeit als Primärquelle ab
- Integriert sich in alle Kap-2-Features: eigenes Job-Level-System (Layer-2-Progression)
- Zukünftig automatisierbar (Zeitkristall-Slot, Unlock-Condition: `stadtwacheStats.count >= 50`)

**Gold-Rahmen:** ~25–35 Gold/Schicht (Basislohn), skaliert mit Level. Genau zu kalibrieren bei Implementierung.

**Unlock-Bedingung Feldarbeit-Loop:** `skills.longShift && skills.jobLeveling && skills.fieldworkMemory && automation.slots.some(s => s.action === 'feldarbeit')`.

**Technisch:**
1. `gameFlags.stadtwacheAccepted`, `gameFlags.stadtwacheDeclined` in state.js
2. Neuer Roswald-Dialog-Node `recruit` (npc.js) — erscheint nach `commanderRecruitmentShown`
3. `stadtwache` in `TOWN_CONTENT_IDS` + Nav-Button (nur wenn accepted)
4. `renderStadtwache(area)` in content.js
5. `startStadtwacheShift()` + `stadtwacheStats` in actions.js
6. Automation-Eintrag in automation.js

---

## 2. Super-Skills: verbleibende Endknoten ★ PRIORITÄT 2

**Entscheidungen getroffen:**
- **ironWill_super:** Hunger beeinflusst Müdigkeitsaufbau gar nicht mehr (Multiplikator → 0 statt 0.5)
  - Code: `* (superSkills.ironWill_super ? 0 : skills.ironWill ? 0.5 : 1)`
  - Quest: 10 Feldarbeiten im Hunger-Zustand → `workStats.hungryWorkCount`, zählt ab sofort (rückwirkend 0 für bestehende Saves)
- **fieldworkMemory_super:** Nachtwache-Level übersteht ebenfalls den Neuanfang
  - Code: in `startManualReset()` — `nightWatchStats.count` wenn `superSkills.fieldworkMemory_super`
  - Quest: Feldarbeit-Level 3 erreichen (`workStats.count >= 500`)
- **nightWatchLeveling_super:** Nachtwache-Schlaf-Penalty entfällt (statt −40 % kein Malus mehr)
  - Code: `NIGHTWATCH_RECOVERY_PENALTY` = 0 wenn super aktiv
  - Quest: 15 Nachtwachen absolvieren (`nightWatchStats.count >= 15`)
- **inventoryKeeper_super:** +3 Inventar-Slots (12 → 15)
  - Code: `INVENTORY_SLOT_COUNT + (superSkills.inventoryKeeper_super ? 3 : 0)` in inventory.js
  - Quest: Einmal mit voll belegtem Inventar (12 Items) einen Neuanfang überlebt haben
- **guildPrep_super:** Bis Kapitel-3-Design aufschieben — kein Super jetzt
- **clearMind_super** ✅ bereits implementiert
- **sleepLikeARock_super** ✅ bereits implementiert

**Technisch:** Nur SUPER_SKILL_DEFS in experience.js + Verdrahtung an 4 Stellen (actions.js, inventory.js). Kein Strukturumbau.

---

## 3. Kapitel 3 konzeptionieren ★ PRIORITÄT 3

**Eckpunkte (noch offen, Design-Dokument steht aus):**
- Neuer Ort (Stadt 2) = Tier-2-Zentrum
- Fokus: Magie — Alchemie, Magieforschung als erste neue Berufe
- Abenteurergilde als echte Institution (nicht nur Story-Gate wie bisher)
- "Der Schatten" = Antagonist, bereits im Sieg-Dialog von Kap 2 angedeutet
- Miras Brief-Mysterium = K3-Subplot
- Kap 1 → Kap 2-Übergang ist Prestige-Münze "Mut" (laut prestige-konzept.md); Kap 2 → Kap 3 ist "Einsicht"

**Nächster Schritt:** Design-Dokument `notes/kapitel3-design.md` schreiben (Weltbeschreibung, Story-Arc, neue Mechaniken, Tier-2-Rohstoffe/Arbeiten).

---

## 4. Eigenes Zuhause ★ PRIORITÄT 4

**Entscheidungen getroffen:**
- Einmaliger Kauf (kein Mieten), dauerhaft in `meta.hasHome` gespeichert
- **Käufer:** Oswin vermittelt das Haus (Dialog-Erweiterung)
- **Preis:** 2000 Gold
- Navigation: "Mein Haus" als neuer Treutheim-Ort mit eigenem Sub-Nav
  - Erster Sub-Nav-Eintrag: Schmiede (nach separatem Umbau)
  - Spätere Einträge: weitere Handwerksberufe
- Schlafplatz "Im eigenen Bett" = qualityTier 3+ (besser als Absteige)
- **Schmiede:** Separater Umbau-Schritt (mindestens 1000 Gold, genaue Zahl bei Implementierung kalibrieren — Spieler verdient Kap-2-Schichten á 25–35g)

**Technisch:**
1. `meta.hasHome: false` in state.js
2. Oswin bekommt neuen Dialog-Knoten wenn `resources.gold >= 2000` (kaufen + Flag setzen)
3. Schlaf-Option in SLEEP_OPTIONS (actions.js): `unlockCond: () => meta.hasHome`
4. `case 'meinhaus'` in content.js + `renderMeinHaus(area)` mit Sub-Nav-Logik
5. `meinhaus` in TOWN_CONTENT_IDS + Nav-Button (nur wenn `meta.hasHome`)
6. Schmiede-Umbau: eigene Aktion/Button in `renderMeinHaus`, eigenes Flag `meta.hasSmith`

---

## 5. Chapter-2-Ende Objective ★ PRIORITÄT 5

**Entscheidungen getroffen:**
- Text muss immersiv sein (kein "Kapitel 2" — Immersionsregel)
- Nav-Zustand: Treutheim bleibt zugänglich (Spieler soll noch grinden können)

**Text:**
> *"Treutheim liegt hinter mir — was als Kampf ums Überleben begann, hat mich weitergeführt als ich erwartet hatte. Der nächste Schritt ist noch nicht klar. Aber er kommt."*

**Technisch:** 1 Zeile in objective.js ändern. Trivial.

---

## 6. Haustiere — reguläre Kategorie ★ PRIORITÄT 6

**Entscheidungen getroffen (22.06.2026):**
- **Herkunft:** Greta (Krämerin) gibt Spieler einen Auftrag: Tiere in den Jagdgebieten fangen
- **Mechanik:** Auftrag erscheint nach Kap-2-Beginn (gameFlags.kapitel2Unlocked) als neuer Greta-Dialog
- **petlover / "Zeit miteinander verbringen":** Maximal 1x täglich GESAMT (nicht pro Tier) — identisch zum bestehenden Straßenkatzen-Limit
- **Jedes Tier gibt einen eigenen Bonus** (Beispiele noch festzulegen, z.B. Hund → Kampf, Vogel → XP, Hase → Hunger-Resistenz)
- **Bonus ist unendlich steigerbar** durch wiederholtes "Zeit verbringen" — Tierfreund-Skill (EP) schaltet das Leveln frei
- **Fangmechanik offen:** wahrscheinlich Chance-Drop nach bestimmten Kills im Jagdgebiet (ähnlich Zeitkristall-Drop), genaue Mechanik bei Implementierung festlegen

**Tiervorschläge (Bonustypen noch nicht final):**
- Hund: Kampfbonus (Schaden +X %)
- Rabe/Vogel: EP-Bonus (+X % EP pro Neuanfang)
- Hase: Hunger steigt langsamer
- Eichhörnchen: Rohstoff-Drop-Menge +X %

**Technisch:**
- `renderPets()` bekommt zweiten Block für reguläre Tiere
- Neues `pets.regular: []` im State oder über npcFlags/gameFlags tracking
- Greta: Neuer Dialog-Knoten nach `kraemerinBusiness.state === 'rewarded'` + Kapitel 2

---

## 7. Expedition-Tab ★ PRIORITÄT 7 (nach K3-Design)

**Konzept (festgehalten 22.06.2026):**
- Navigation ist instant (kein Reise-Timer), aber "Expedition" ist eine aktive Mechanik.
- Spieler tauscht Spielzeit gegen Expeditionsfortschritt.
- Expeditionen liefern: Story-Erlebnisse, Rohstoffe, Stärkungs-Events, Quest-Fortschritt.
- Offen: Wie viele Expeditionen? Einmalige Story-Expeditionen vs. wiederholbare Grinding-Expeditionen?

---

## 8. Miras Brief-Mysterium ★ PRIORITÄT 8 (nach K3-Design)

Abhängig von Kapitel-3-Design. Kein Design-Stand.

---

## BALANCING-OFFENE PUNKTE (aus balance.md)

1. **Kampf-HP nach Neuanfang:** `playerStats.hp` nach EP-Reset auf `maxHp` setzen? Aktuell: Nein.
2. **Waldtroll-Sperre bei <30 XP:** Sollte besser "Stärkelevel 2" als Bedingung sein statt fester XP-Wert.
3. **Schlafschuld + Nachtwache-Debuff:** Interagieren und können bei Hunger zur Todesspirale führen — bewusst belassen.
4. **Automatisierung auf Spieluhr-Stunden statt 30s Echtzeit** — langfristig besser, aktuell niedrige Priorität.

---

*Letzte Aktualisierung: 22.06.2026*
*Implementiert diese Session: NPC-Verfügbarkeitsindikator, Tooltip-Basiswert-Anzeige, Automatisierungs-Overhaul, Save-Deduplication.*
