# Implementierungsplan Kapitel 3 — Lethkar
*Stand: 22.06.2026 | Alle Design-Entscheidungen aus kapitel3-design.md*

---

## Reihenfolge der Implementierung

Kapitel 3 ist umfangreicher als Kapitel 2. Es muss in Schichten gebaut werden, damit jede Schicht einzeln testbar ist.

```
Schicht 1: Fundament (State, Nav, Weltkarte-Erweiterung, Mut-Gate)
Schicht 2: Lethkar-Orte (Übersicht, Unterkunft, Markt, Tier-2-UI-Rahmen)
Schicht 3: Alchemie-System (Kern-Mechanik, ein Aspekt, Progress-Tick)
Schicht 4: Alle 5 Aspekte + Meilensteine + Berufsstufe
Schicht 5: Story 3.1–3.5 + zugehörige NPC-Dialoge
Schicht 6: Tier-2-Kampf + Gilden-Quests
Schicht 7: Story 3.6–3.10 + Kap-3-Abschluss
Schicht 8: Einsicht-Prestige + Magie-Skillbaum-Grundgerüst
```

---

## A. State & Save

### Neu in `state.js`

```js
// Kapitel-3-Kernobjekte
let lethkar = {
  unlocked: false,         // false solange mut.points < 3
  visited:  false
};

let alchemie = {
  activeAspect: null,      // 'kraeuterkunde' | 'traenkebrauen' | ... | null
  lastTickTime:  null,     // ms-Timestamp für Echtzeit-Berechnung
  aspects: {
    kraeuterkunde:   { progress: 0, level: 0 },
    traenkebrauen:   { progress: 0, level: 0 },
    toxikologie:     { progress: 0, level: 0 },
    trankwirkung:    { progress: 0, level: 0 },
    heilungsmedizin: { progress: 0, level: 0 }
  }
};

let einsicht = {
  points:      0,
  totalEarned: 0
};
```

Neue `gameFlags`:
```js
lethkarUnlocked:           false,
alchemieLabUnlocked:       false,
gildenhausUnlocked:        false,
tier2JagdgebietUnlocked:   false,
varenaFirstTalk:           false,
alchemistMentorMet:        false,
kap3Complete:              false
```

Neue `navUnseen`-Einträge: `lethkar`, `alchemielabor`, `gildenhaus`

### Save/Load

- `alchemie` serialisieren + laden (mit Spread-Default für alle Aspekte)
- `einsicht` serialisieren (übersteht Reset → in `meta`-Bereich)
- `lastTickTime` beim Laden: elapsed Zeit berechnen → Progress nachführen (max. 4h offline-cap)
- `performHardReset()`: `alchemie`-Aspekte zurücksetzen, `einsicht` NICHT (ist Prestige)

---

## B. Alchemie-Engine (`alchemie.js` — neue Datei)

### Konstanten

```js
const ALCHEMIE_ASPECTS = [
  { id: 'kraeuterkunde',   name: 'Kräuterkunde',   icon: '🌿' },
  { id: 'traenkebrauen',   name: 'Tränke brauen',   icon: '⚗' },
  { id: 'toxikologie',     name: 'Toxikologie',     icon: '☠' },
  { id: 'trankwirkung',    name: 'Trankwirkung',    icon: '✨' },
  { id: 'heilungsmedizin', name: 'Heilungsmedizin', icon: '❤️' }
];

const ALCHEMIE_MAX_LEVEL = 5;

// Punkte nötig für Level-Up: 100 * 3^level
// Level 0→1: 100, 1→2: 300, 2→3: 900, 3→4: 2700, 4→5: 8100
function getAlchemieThreshold(level) {
  return Math.round(100 * Math.pow(3, level));
}

// Basis-Fortschritt pro Sekunde (level 0 = 1.0 Pkt/s)
// getAlchemieSpeed() inkludiert alle Modifier
function getAlchemieSpeed() {
  let speed = 1.0;
  // + Modifier aus EP-Skillbaum, Ausrüstung, Meilensteine
  if (skills.alchemieForschungstempo)   speed *= 1.5;
  if (meta.alchemistMentorBonus)        speed *= 1.2;
  if (equipment.alchemistenWerkzeug)    speed *= 1.5;
  return speed;
}
```

### Tick-System

```js
let alchemieTicker = null;

function setupAlchemieTicker() {
  if (alchemieTicker) { clearInterval(alchemieTicker); alchemieTicker = null; }
  if (!alchemie.activeAspect) return;
  alchemie.lastTickTime = Date.now();
  alchemieTicker = setInterval(tickAlchemie, 1000);
}

function tickAlchemie() {
  if (!alchemie.activeAspect) return;
  const aspect = alchemie.aspects[alchemie.activeAspect];
  if (aspect.level >= ALCHEMIE_MAX_LEVEL) return;
  const gain     = getAlchemieSpeed();
  const needed   = getAlchemieThreshold(aspect.level);
  aspect.progress += gain;
  if (aspect.progress >= needed) {
    aspect.progress = 0;
    aspect.level   += 1;
    onAspectLevelUp(alchemie.activeAspect, aspect.level);
  }
  alchemie.lastTickTime = Date.now();
  renderAlchemieProgress(); // Nur Progress-Bars patchen, kein volles render()
}
```

### Offline-Nachführung (beim Laden)

```js
function catchUpAlchemieProgress() {
  if (!alchemie.activeAspect || !alchemie.lastTickTime) return;
  const cap     = 4 * 60 * 60 * 1000; // 4h max offline
  const elapsed = Math.min(Date.now() - alchemie.lastTickTime, cap);
  const secs    = Math.floor(elapsed / 1000);
  for (let i = 0; i < secs; i++) tickAlchemieOffline();
}
```

### Meilenstein-Handler `onAspectLevelUp(aspectId, newLevel)`

Prüft alle Meilensteine und wendet Effekte an:
- Kräuterkunde 1: `meta.kraeuterkundeBonus += 1` (Rohstoff-Yield)
- Tränke brauen 1: `meta.traenkeTagesProduktion = 1` (täglicher Auto-Verkauf)
- Heilungsmedizin 1: `meta.maxHpBonus += 10`
- etc.

Zeigt Toast + optional kleinen Story-Monolog (einmalig).

---

## C. Weltkarte-Erweiterung (`nav.js` / `content.js`)

### Lethkar auf der Weltkarte

- Neue Weltkarte-Karte: "Lethkar" (nur sichtbar wenn `mut.points >= 3`, locked-Zustand davor mit Hinweis "Mut fehlt noch")
- navLevel 2 für Lethkar (analog Treutheim) — `navLevel` muss ggf. stadtspezifisch werden
- `LETHKAR_CONTENT_IDS = ['lethkar', 'alchemielabor', 'gildenhaus', 'unterkunft', 'lethmarkt', 'tier2jagdgebiet']`

### Stadtstruktur Lethkar

```
Lethkar (Übersicht)
  ├── Unterkunft (sofort — Miete, kein Eigentum)
  ├── Lethkarer Markt (sofort)
  ├── Alchemie-Labor (nach Story 3.4)
  ├── Gildenhaus (nach Story 3.3)
  └── Tier-2-Jagdgebiet (nach Gilden-Eintritt)
```

---

## D. Story & NPCs

### Story-Entries 3.1–3.10

Alle in `story.js` als neue `STORY_ENTRIES`-Objekte. Unlock via `unlockFlag` (Flags aus gameFlags).

### NPC-Definitionen (in `npc.js`)

**Varena** (Taverne Lethkar, abends):
- Node `start`: → `'greet'` oder `'brief'` (wenn Brief-Item im Inventar)
- Node `brief`: Enthüllt den Inhalt von Miras Brief
- Availability: `'evening'`

**Gildenmeisterin Thessa** (Gildenhaus):
- Mehrstufige Quest: Aufnahmeprüfung → Gilden-Missionen
- Node `apply`: nur wenn `strength.xp >= 50` (starker Spieler nötig)

**Alchemist Pereth** (Labor):
- Einführungs-Dialog → schaltet `alchemieLabUnlocked` frei
- Gibt `meta.alchemistMentorBonus = true` nach ausführlichem Gespräch

---

## E. Tier-2-Kampf

Neue Monster in `combat.js`:

| Monster | Zone | HP | Schaden | Einsicht |
|---------|------|----|---------|---------|
| Schattenwolf | Tier-2-Wald | 45 | 8–15 | 1 |
| Steingolem | Tier-2-Wald | 80 | 12–22 | 2 |
| Schattensöldner | Tier-2-Tief | 65 | 15–25 | 1 |
| Valdris' Wächter ⭐ | Tier-2-Tief | 120 | 20–35 | 3 |

Einsicht als Kampf-Drop (analog Mut aus Waldtroll).

---

## F. Einsicht-Skillbaum (Fundament)

In `experience.js` als separates Array `EINSICHT_SKILL_TREE` (analog `EP_SKILL_TREE`).
Eigener Tab in der Erfahrungs-Seite (3. Tab neben `skills` und `superSkills`).

Erste Knoten (Beispiele):
- **Forschungsinstinkt** (1 Einsicht): +25 % Alchemie-Tempo
- **Wissenshunger** (3 Einsicht): Jeder Aspekt-Level-Up gibt +1 Einsicht
- **Alchemistisches Auge** (5 Einsicht): Tränke brauen Level-Meilensteine geben doppeltes Gold

---

## G. Tagesproduktion (Alchemie → Gold)

Analog zu Automatisierung: `setInterval`-Tick prüft täglich (nach `advanceClock`, wenn neuer Spieltag beginnt), ob Tränke-brauen-Meilensteine aktiv sind, und zahlt automatisch Gold aus.

```js
// In clock.js oder actions.js, beim Tagesübergang:
function onNewDay() {
  const prod = meta.traenkeTagesProduktion || 0;
  if (prod > 0) {
    const goldPerTrank = getTraenkPreis(); // skaliert mit Tränke-brauen-Level
    const earned       = prod * goldPerTrank;
    resources.gold           += earned;
    resources.totalGoldEarned += earned;
    showToast(`Tagesertrag Alchemie: +${earned} Gold (${prod} Tränke).`, 'reward');
  }
}
```

---

## H. Offene Fragen (vor Implementierungsstart zu klären)

1. **Weltkarten-Architektur:** Treutheim und Lethkar als gleichwertige, wechselbare Städte — braucht navLevel ein Stadt-Konzept? Oder reicht ein Flag `currentCity: 'treutheim' | 'lethkar'`?
2. **Mut-Gate:** Wird Mut *verbraucht* beim Betreten Lethhars, oder nur geprüft? (Empfehlung: nur prüfen — Verbrauch wäre zu hart)
3. **Schlaf in Lethkar:** Unterkunft (Miete) — wie viel kostet eine Nacht? (Balancing gegen Treutheim-Preise)
4. **Magieforschung:** Wird das ein eigener Job (Nacht, analog Nachtwache) oder ein zweiter Aspekt-Pool innerhalb des Alchemie-Systems?
5. **NPC Roswald in Lethkar:** Soll er auftauchen? Stärkt die Kontinuität, aber muss erzählerisch motiviert sein.

---

## Abhängigkeiten zu anderen Dateien

| Datei | Änderung |
|-------|---------|
| `state.js` | `alchemie`, `einsicht`, `lethkar`, neue gameFlags |
| `save.js` | Serialisierung + Migration (CURRENT_SAVE_VERSION → 11) |
| `alchemie.js` | Neue Datei — nach `automation.js` laden |
| `index.html` | `<script src="script/alchemie.js">` |
| `combat.js` | Tier-2-Monster + Einsicht als Kampf-Drop |
| `story.js` | Story-Entries 3.1–3.10 |
| `npc.js` | Varena, Thessa, Pereth |
| `nav.js` | `LETHKAR_CONTENT_IDS` + Lethkar-Orts-Nav |
| `content.js` | `renderAlchemielabor()`, `renderGildenhaus()`, `renderLethkar()`, `renderUnterkunft()`, `renderLethmarkt()` |
| `objective.js` | Kap-3-Texte (3.1–3.10) |
| `experience.js` | `EINSICHT_SKILL_TREE`-Array + 3. Erfahrungs-Tab |
| `clock.js` | `onNewDay()` Hook für Alchemie-Tagesproduktion |
| `actions.js` | `getMaxHp()` berücksichtigt `meta.maxHpBonus` |
