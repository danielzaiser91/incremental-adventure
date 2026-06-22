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

- ✅ Stadtwache-Arbeitsplatz (22.06.2026, v0.12.0): Tagesjob mit Level-System (5 Stufen), 25–35 Gold/Schicht, Progressbar wie Feldarbeit, Automation-Slot ab 50 Schichten. Roswald bietet Job nach Waldtroll-Sieg an.
- ✅ Super-Skills (22.06.2026, v0.12.0): ironWill+, fieldworkMemory+, nightWatchLeveling+, inventoryKeeper+ vollständig implementiert.
- ✅ Kap-2-Ende Objective-Text (22.06.2026, v0.12.0): immersiver Abschluss-Satz.
- ✅ NPC-Verfügbarkeitsindikator (22.06.2026): farbiger Punkt auf NPC-Kacheln (grün=immer, gelb=abends, grau=unklar), mit Hover-Tooltip in Ich-Perspektive.
- ✅ Tooltip-Basiswert-Anzeige: "Errechnete Werte" zeigt jetzt Basiswert über Modifikatoren.
- ✅ Automatisierungs-Overhaul: kein Hunger/Müdigkeit, neue List-UI mit Unlock-Conditions, fieldPay_super im Tooltip.
- ✅ Save-Kompatibilität: Zeitkristall-Deduplication-Migration in save.js.

---

## 1. Kapitel 3 — Lethkar ★ PRIORITÄT 1

**Design abgeschlossen:** `notes/kapitel3-design.md` + `notes/implementierungsplan_kap3.md`

Kurz-Summary:
- Stadt: **Lethkar** (Tier 2)
- Freischalt-Bedingung: `mut.points >= 3` (Mut wird geprüft, nicht verbraucht)
- Kern-Job: **Alchemie** — 5 Echtzeit-Progress-Bars (Aspekte), Spieler wählt aktiven Aspekt
- Prestige: **Einsicht** (übersteht Neuanfang, Magie-Skillbaum)
- Story: 3.1–3.10, Antagonist Valdris (Der Schatten), Miras Brief als Subplot
- Detaillierter Implementierungsplan: → `implementierungsplan_kap3.md`

---

## 2. Eigenes Zuhause ★ PRIORITÄT 2

**Entscheidungen getroffen:**
- Einmaliger Kauf (kein Mieten), dauerhaft in `meta.hasHome` gespeichert
- **Käufer:** Oswin vermittelt das Haus (Dialog-Erweiterung)
- **Preis:** 2000 Gold — sinnvoll ab Kap-2-Mitte (Stadtwache ~30g/Schicht → ~67 Schichten)
- **Timing:** Verfügbar sobald `storyState >= 20100` (Kap 2 läuft) — kein chapter2Complete nötig
- Navigation: "Mein Haus" als neuer Treutheim-Ort, eigenes Sub-Nav
- Schlafplatz "Im eigenen Bett" = qualityTier 3 (besser als Gasthof-Zimmer Tier 2)
- Schmiede: separater Umbau 1200 Gold, Flag `meta.hasSmith` — schaltet Schmiede-Job frei (Kap-2-Handwerk)
- **Das Haus übersteht Neuanfänge** (in `meta`, nicht in normalem State) — macht den Kauf dauerhaft bedeutsam

**Schmiede-Job (Folge-Feature, nach Hauskauf):**
- Handwerkliches Gewerk mit eigenem Level-System (analog Stadtwache)
- Schmiedet Ausrüstungsgegenstände (Waffen = Kampfbonus, Rüstung = Verteidigung)
- Kann langfristig ins Berufssystem (Kap-2-Variation des Alchemie-Aspekt-Konzepts) eingebettet werden

**Technisch:**
1. `meta.hasHome: false`, `meta.hasSmith: false` in state.js
2. Oswin: neuer Knoten `houseOffer` wenn `resources.gold >= 2000 && storyState >= 20100`
3. Schlaf-Option in `SLEEP_OPTIONS` (actions.js): `unlockCond: () => meta.hasHome`
4. `renderMeinHaus(area)` in content.js mit Sub-Nav (Schlafen / Schmiede-Umbau / später mehr)
5. `'meinhaus'` in `TOWN_CONTENT_IDS` + Nav-Button (nur wenn `meta.hasHome`)
6. Schmiede-Seite: `renderSchmiede(area)`, Nav-Button (nur wenn `meta.hasSmith`)

---

## 3. Haustiere — reguläre Kategorie ★ PRIORITÄT 3

**Entscheidungen getroffen (22.06.2026):**
- **Herkunft:** Greta gibt Auftrag nach Kap-2-Beginn (`kapitel2Unlocked`) + Greta-Questkette abgeschlossen
- **Fangmechanik:** Chance-Drop nach Jagdgebiet-Kills (wie Zeitkristalle) — Drop-Rate an Monster-Stärke koppeln
- **Tier-Bonustypen (final):**
  - 🐕 Hund: Kampf-Schaden +5/10/15 % je Level
  - 🐦 Rabe: EP-Gewinn pro Neuanfang +15/30/45 % je Level
  - 🐇 Hase: Hunger steigt 10/20/30 % langsamer je Level
  - 🐿 Eichhörnchen: Rohstoff-Menge beim Sammeln +1/2/3 je Level
- **Level-Cap:** Level 3 pro Tier, maximal 1 Level-Up pro Spieltag (identisch Straßenkatzen-Limit GESAMT)
- **Tierfreund-Skill** (EP-Baum) als Voraussetzung für Level-Ups
- Boni sind kumulativ: alle Haustiere gleichzeitig aktiv

**Fangmechanik detail:**
- Wolf/Eber/Bär droppen nichts
- Waldtroll: 5 % Hunde-Chip-Drop
- Tief-Zone generell: 3 % Raben-Feder-Drop
- Wald-Zone generell: 4 % Hase-Spur-Drop / Eichhörnchen-Drop
- Drop-Item landet im Inventar → "Tier fangen"-Button in Greta-Dialog

**Technisch:**
- `pets.regular: []` — Array von `{ type: 'hund'|'rabe'|..., level: 1 }`
- `renderPets()`: zweiter Block "Wildtiere" unter Straßenkatzen-Block
- Greta-Dialog: neuer Knoten `petQuest` + `petCatch` wenn entsprechendes Drop-Item im Inventar

---

## 4. Expedition-Tab ★ PRIORITÄT 4

**Design-Entscheidung (22.06.2026):**
Zwei getrennte Typen — same UI, different data:
- **Story-Expeditionen** (einmalig): Führen Story-Fäden fort, verbrauchen Spielzeit, können nicht wiederholt werden. Belohnung: Einmalige Boni, Story-Einträge.
- **Grind-Expeditionen** (wiederholbar): Kurze Zeitinvestition → Rohstoffe/Gold/Einsicht. Skalieren mit Stärke/Level.

**Mechanik:**
- Spieler startet Expedition → wählt Dauer (2h/4h/8h Spielzeit)
- Während der Expedition: andere Aktionen noch möglich, aber Expedition läuft passiv
- Rückkehr = Ergebnisse sammeln (wie Automatisierung, aber einmalig pro Start)
- Freischaltung: nach Kap-2-Beginn (`kapitel2Unlocked`) für Grind-Typ; Story-Typ erscheint nur wenn Story-Flag gesetzt

**Technisch (Fundament):**
- `expedition: { active: null, startTime: null, endTime: null }` in state.js
- `EXPEDITION_DEFS` Array (analog AUTOMATION_ACTIONS)
- `renderExpedition(area)` in content.js
- Neuer Tab in Globaler Nav (erscheint nach erstem Kap-2-Jagdgebiet-Kill)

---

## 5. Miras Brief-Mysterium ★ PRIORITÄT 5

**Design-Entscheidung (22.06.2026):**
Miras Brief ist ein **konkretes Inventar-Item** (kein reines Flag). Es liegt nach Miras Enthüllung (Story 2.4) im Inventar — unlesbar, weil verschlüsselt. In Lethkar gibt Varena den Schlüssel (Story 3.2).

**Implementierung:**
- Item `miras_brief` in `QUEST_ITEMS` (unverkäuflich, bleibt im Inventar durch `inventoryKeeper`)
- Mira: neuer Node nach Story 2.4 → gibt Brief ins Inventar (`grantItem('miras_brief', 1)`)
- Inventar-Anzeige: Brief zeigt "Unlesbar — findet jemanden in Lethkar, der hilft"
- Varena in Lethkar: Node `brief` — entschlüsselt Brief, triggert Story 3.2
- Brief-Item nach Entschlüsselung: Icon ändert sich, Text zeigt Inhalt (einmalig)

---

## BALANCING-OFFENE PUNKTE

1. **Kampf-HP nach Neuanfang:** → **Entscheidung: Ja** — `playerStats.hp` auf `maxHp` setzen nach Reset, sonst unfair wenn Spieler mit 5 HP neustartet. Triviale Änderung in `runManualReset()`.
2. **Waldtroll-Sperre:** → **Entscheidung: Stärkelevel 2** statt fester XP-Wert (aktuell 30 XP). Stärkelevel 2 = 30 XP — identisch in der Praxis, aber robuster wenn Levelthresholds sich ändern. Änderung in `combat.js` oder `content.js`.
3. **Schlafschuld + Nachtwache-Debuff:** → **Belassen** — bewusste Spannung, kein Bug.
4. **Automatisierung auf Spieluhr:** → **Niedrige Priorität.** Wird relevant, wenn Expeditionen fertig sind (dann macht Spieluhr-Kopplung wieder Sinn).

---

*Letzte Aktualisierung: 22.06.2026*
*Implementiert heute: Stadtwache (v0.12.0), 4× Super-Skills, Kap-2-Ende Objective-Text, NPC-Verfügbarkeitsindikator, Automatisierungs-Overhaul, Save-Deduplication.*
