# Prestige-Konzept — Die fünf Wendepunkte

Dieses Dokument hält die grobe Langzeit-Storyline fest, die der User
vorgegeben hat, plus die Ableitung, wie sich daraus ein klassisches
Prestige-System (Inkremental-Spiel-Pattern: Reset gegen permanenten
Fortschritt) bauen lässt. Das Spiel steckt inhaltlich mitten in Akt I,
ABER: die in diesem Dokument vorgeschlagene Akt-I→II-Prestige-Mechanik
(„meta.resets als benannte, sichtbare Währung statt unsichtbarem
Zähler") ist inzwischen umgesetzt — siehe `script/experience.js`. Der
Raub schaltet nur noch den Tab "Erfahrung" frei; der eigentliche
Neuanfang (Gold gegen EP, Skillbaum) ist eine bewusste Spieler-Aktion,
kein Automatismus mehr. Die Akt II–V-Inhalte unten sind weiterhin
unimplementiert — Akt I selbst ist jetzt mechanisch vollständig.

## Die Storyline in fünf Akten

Der Charakter verfolgt nacheinander fünf verschiedene Theorien davon,
wie man "groß" wird — jede schlägt am Ende nicht fehl, sondern stößt
an eine Grenze, die nur die *nächste* Theorie überwinden kann. Das ist
der eigentliche Motor der Prestige-Resets: nicht "ich habe verloren",
sondern "diese Strategie alleine reicht nicht mehr".

### Akt I — Gold-Prestige (aktueller Spielstand)

**Überzeugung:** "Reichtum ist die Antwort. Wenn ich genug Gold habe,
bin ich frei."

Der Charakter kommt als verarmter Bauernsohn nach Treutheim, lernt
mühsam Feldarbeit, verdient seine ersten Münzen — und wird beraubt.
Der Raub *ist* der erste Prestige-Reset: das Gold ist weg, aber die
Erfahrung (Feldarbeits-Level, `meta.fasterWorkUnlocked`,
`meta.ledergloves`) bleibt. Die Lektion direkt danach: Gold allein
macht nicht sicher — es macht zum Ziel für jeden mit einem Messer.

**Übergang zu Akt II:** Nach ein, zwei weiteren Rückschlägen (z.B.
erneuter Diebstahl trotz mehr Vorsicht, oder eine Situation, in der
Gold ihm nicht hilft — ein Streit, eine Bedrohung, ein Wettkampf)
erkennt der Charakter: "Ich brauche keinen volleren Geldbeutel. Ich
brauche die Fähigkeit, mich zu verteidigen. Ich muss stärker werden."

### Akt II — Stärke-Prestige (Str)

**Überzeugung:** "Wenn ich stark genug bin, kann mir niemand mehr
etwas nehmen."

Der Charakter wird zum Abenteurer im klassischen Sinn: Kämpfe,
körperliches Training, vielleicht erste Aufträge als Wache oder
Söldner. Stärke löst tatsächlich viele Akt-I-Probleme (er wird nicht
mehr einfach beraubt). Aber irgendwann trifft er auf einen Gegner, den
reine Kraft nicht besiegt — ein magisches Wesen, eine verzauberte
Falle, ein Rätsel, das sich nicht aufschlagen lässt. Die Niederlage
hier ist nicht körperlich, sondern eine Mauer, an der Muskeln nichts
nützen.

**Übergang zu Akt III:** "Kraft alleine reicht nicht. Da draußen gibt
es Dinge, die ich nicht einmal verstehe, geschweige denn schlagen
kann. Ich muss klüger werden — ich muss Magie lernen."

(Hier zahlt sich das Foreshadowing aus Kapitel 1 aus: das "Kribbeln"
in der "Erste Nacht"-Reflexion (`story.js`, Eintrag 1.3) war die erste
Andeutung von latentem magischem Talent, das der Charakter selbst noch
nicht einordnen konnte.)

### Akt III — Magie-/Intelligenz-Prestige (Int)

**Überzeugung:** "Wissen und Magie sind die wahre Macht. Wer versteht,
wie die Welt funktioniert, kann sie formen."

Der Charakter wird zum Magier/Gelehrten: Zaubersprüche, Artefakte,
Bibliotheken, Lehrmeister. Dieser Akt löst die Probleme aus Akt II
(er kann jetzt Dinge bekämpfen/verstehen, die reine Kraft nicht
schafft) — bis er an eine Grenze stößt, die nichts mit Macht zu tun
hat: Zeit. Vielleicht ein Ritual, das Jahrzehnte dauert; ein Feind, der
unsterblich ist und einfach wartet, bis der Charakter stirbt; ein
Fehler, der sich nur durch Zurückgehen in der Zeit korrigieren lässt.

**Übergang zu Akt IV:** "Ich kann zaubern, ich verstehe die Welt — aber
ich habe trotzdem nicht genug *Zeit*. Manche Dinge brauchen länger, als
ein Leben hergibt."

### Akt IV — Zeit-Prestige

**Überzeugung:** "Wenn ich die Zeit selbst beeinflussen kann, ist
nichts mehr unerreichbar."

Hier kippt das Spiel sichtbar ins Kosmische: Zeitmagie, Schleifen,
vielleicht ein wiederholtes Erleben derselben Spanne mit wachsendem
Wissen (mechanisch: das klassische Inkremental-"noch ein Run, aber
schneller"-Gefühl wird hier zur Story selbst). Der Charakter wird
mächtiger als jedes sterbliche Wesen — und stößt dann auf etwas, das
selbst Zeit nicht beeindruckt: etwas, das außerhalb der Zeit steht.
Eine Gottheit, ein uralter Wächter, das Konzept von Schicksal selbst.

**Übergang zu Akt V:** "Zeit war die letzte sterbliche Grenze. Was
jetzt noch vor mir steht, ist nicht mehr sterblich."

### Akt V — Götter-Prestige (offenes Ende)

**Überzeugung:** noch unklar — das ist bewusst die am wenigsten
ausgearbeitete Stufe, weil sie am weitesten weg ist. Mögliche
Richtungen (nicht entschieden, nur Material):
- Der Charakter wird selbst zu etwas Gottähnlichem (Apotheose).
- Der Charakter stellt sich gegen eine Gottheit, nicht um sie zu
  ersetzen, sondern um eine von ihr gesetzte Grenze für alle
  Sterblichen aufzuheben.
- Das eigentliche Ziel verschiebt sich hier von "werde mächtiger" zu
  "was bedeutet das alles" — eine philosophische Wendung als
  Abschluss, kein reiner Zahlen-Wettlauf mehr.

## Wie die Akte mechanisch zusammenhängen (Prestige-Layer-Vorschlag)

Jeder Akt-Übergang ist ein Reset mit genau einer neuen,
aktspezifischen Prestige-Währung, die NUR durch den Abschluss des
jeweiligen Akts entsteht und NUR für aktspezifische permanente
Upgrades ausgegeben wird. Vorschlag für Namen + Quelle + Verwendung:

| Akt-Übergang | Prestige-Währung | Entsteht durch | Schaltet frei |
|---|---|---|---|
| I → II | **Mut** (oder „Entschlossenheit") | Abschluss Akt I (aktuell: der Raub) | dauerhafte Grundwerte für Akt II (Start-Stärke, Waffenschmied-Zugang, schnellere Heilung) |
| II → III | **Einsicht** | erste Niederlage gegen einen Gegner, den Stärke nicht löst | Zugang zu Magier-Lehrmeistern, erste Zauber-Slots |
| III → IV | **Wissen** | Abschluss eines Zeit-kritischen Magie-Rituals/Problems | Zeitmagie-Grundfähigkeiten, "ein Lauf dauert kürzer"-Meta-Effekte |
| IV → V | **Schicksal** | Sieg über/Begegnung mit etwas Zeitlosem | Akt-V-Inhalte (noch offen) |

Wichtig: das aktuelle `meta.resets`/`meta.fasterWorkUnlocked`/
`meta.ledergloves`-System aus Kapitel 1 ist im Kern **bereits** die
Akt-I→II-Prestige-Mechanik — nur noch ungenannt und nicht als
eigene Währung sichtbar. Der pragmatischste nächste Schritt ist NICHT,
ein komplett neues System zu bauen, sondern das bestehende zu benennen
und sichtbar zu machen (siehe Vorschlagsliste unten, Punkt 1–3).

## Vorschlagsliste: nächste Schritte

Konkrete, umsetzbare Vorschläge, sortiert ungefähr nach Aufwand:

1. ~~**`meta.resets` in eine benannte Prestige-Währung umwandeln.**~~
   **Umgesetzt** als "Erfahrung" (EP) statt "Mut" — siehe
   `script/experience.js`. Sichtbar im Stats-Panel, eigene Tab-Seite.
   Der erste Reset gibt immer genau 1 EP; jeder weitere erst ab
   `GOLD_MILESTONE_THRESHOLD` (50 Gold, bewusst identisch mit der
   Raub-Schwelle, siehe `state.js`) — darunter 0 EP. Ohne den Skill
   "Weitblick" ist der Gewinn ab der Schwelle hart auf 1 EP (+1 mit
   "Klarer Kopf") gekappt, unabhängig von noch mehr Gold; erst
   "Weitblick" lässt jeden weiteren exponentiellen Gold-Meilenstein
   (`EP_GOLD_BREAKPOINTS`) zusätzlich zählen (siehe `computeEpGain()`).
2. ~~**Einen echten Upgrade-Screen bauen.**~~ **Umgesetzt** als
   Skillbaum mit 7 Knoten (`EP_SKILL_TREE`), zwei Ästen: Arbeit
   (Job-Leveling-Freischaltung → Feldarbeits-Level-Persistenz →
   Hunger-Resistenz, plus ein Seitenzweig "Nächtliche Routine" für ein
   Nachtwache-Level-System) und Wirtschaft (Sparsamkeit-Rabatt →
   EP-Bonus pro Reset → "Weitblick" für die Gold-Meilenstein-Skalierung
   oben). `meta.fasterWorkUnlocked` hängt weiterhin automatisch am
   Reset (bewusst nicht in den Baum verschoben, um genau einen
   "kostenlosen" Basis-Trost beizubehalten) — alles andere ist jetzt
   eine Spielerentscheidung. Zusätzlich gibt es seit diesem Update eine
   vom Skillbaum getrennte Sektion "Was das Leben mich gelehrt hat" für
   automatisch (nicht per EP gekaufte) dauerhafte Boni, z.B. den
   Vorarbeiter-Bonus nach 10 Feldarbeiten.
3. **Akt-I-Ende (Akt II-Trigger) inhaltlich vorbereiten.** Der Raub ist
   aktuell der einzige Rückschlag. Für den Akt-I→II-Übergang braucht es
   laut Storyline "ein, zwei weitere Fehlschläge" — z.B. ein zweiter
   Diebstahl-Versuch, der trotz Vorsicht halb gelingt, oder eine
   Situation, in der Gold explizit NICHT hilft (ein NPC, der sich nicht
   bestechen lässt; eine Bedrohung, die Geld ignoriert). Das motiviert
   den Wechsel zu "ich brauche Stärke" erzählerisch, statt ihn nur per
   Cutscene zu behaupten.
4. **Den zwielichtigen Mann (Taverne) als Brücke nutzen.** Er ist
   aktuell ein dünner Foreshadowing-NPC ohne mechanischen Effekt. Er
   eignet sich gut als wiederkehrende Figur über mehrere Akte hinweg —
   z.B. als jemand, der den Charakter immer wieder vor etwas warnt, das
   erst in einem späteren Akt relevant wird (frühe Hinweise auf den
   "starken magischen Gegner" aus Akt II→III).
5. **Das "Kribbeln" aus Eintrag 1.3 weiterverfolgen.** Es ist die
   einzige bisherige Anspielung auf latente Magie. Es sollte 1–2 weitere
   Mal subtil wieder auftauchen (z.B. bei besonders harter körperlicher
   Anstrengung, oder in einem Moment der Angst), bevor Akt III es
   offiziell zum Thema macht — sonst wirkt der Magie-Twist unmotiviert.
6. **Akt II inhaltlich grob skizzieren, sobald Akt I näher am Ende ist.**
   Konkret: was bedeutet "Stärke-Prestige" mechanisch? Vorschlag:
   ein zweites Arbeits-/Trainings-System parallel zur Feldarbeit
   (Kampftraining mit eigenem Level analog zum Feldarbeits-XP-System,
   siehe `actions.js`/`WORK_LEVELS` als wiederverwendbares Pattern),
   plus erste echte Kampf-Encounter statt reiner Klick-Arbeit.
7. **Sprachliche Konsistenz für "Theorien, die scheitern" einführen.**
   Jeder Akt-Übergang sollte erzählerisch denselben Rhythmus haben:
   Überzeugung aufbauen → an Grenze stoßen → Einsicht, dass *diese*
   Lösung nicht reicht (nicht: "ich habe verloren", sondern "das war
   nicht die richtige Frage"). Das hält die Storyline über fünf Akte
   hinweg erkennbar als EINE Geschichte, nicht fünf verschiedene Spiele.
8. **Akt V bewusst nicht vorab festnageln.** Da der User selbst sagt,
   das Ende sei offen ("Gott-Prestige?"), sollte hier nicht zu früh
   etwas Endgültiges entschieden werden — die Richtung (Apotheose vs.
   Konfrontation vs. philosophischer Abschluss) lässt sich erst sinnvoll
   wählen, wenn Akt III/IV inhaltlich stehen.

## Wie der Akt-I-Prestige-Reset jetzt tatsächlich funktioniert

(Ursprünglich stand hier eine Klarstellung, dass der automatische
Kapitel-1→2-Übergang bereits implizit ein Prestige-Reset sei. Das ist
inzwischen überholt — der Übergang ist nicht mehr automatisch.)

Der Raub (`checkMilestones()` in `actions.js`) nimmt nur das Gold und
schaltet den Tab "Erfahrung" frei. Der eigentliche Reset
(`performManualReset()` in `script/experience.js`) ist eine bewusste
Spieler-Aktion über den Button "Neu anfangen":

- **Was zurückgesetzt wird:** `resources.gold` (zurück auf 0),
  `storyState` (springt einmalig auf Kapitel 2, beim ersten Reset),
  `workStats.count` (Feldarbeits-Level) — AUSSER der Skill
  "Geschickte Hände" wurde erlernt, dann bleibt es erhalten —, sowie
  `nightWatchStats.count` (Nachtwache-Level, hat aktuell kein
  Memory-Pendant und setzt sich bei jedem Reset zurück).
- **Was NICHT zurückgesetzt wird (= die Prestige-Währung/der
  Fortschritt, der bleibt):** `resources.totalGoldEarned` (Lebenszeit-
  Zähler, nie zurückgesetzt), `experience.points`/`totalEarned` (die
  eigentliche Prestige-Währung), `meta.resets` (zählt diesen Reset
  selbst), und die davon
  abhängigen Freischaltungen `meta.fasterWorkUnlocked` (40 % schnellere
  Feldarbeit dauerhaft) und der Zugang zu den Lederhandschuhen im
  Krämer-Sortiment (`meta.resets >= 1`).
- **Was das konkret freischaltet:** aktuell zwei Dinge — dauerhaft
  schnellere Feldarbeit und ein kaufbares Ertrags-Upgrade. Das ist
  bewusst noch minimal (Kapitel-1-Erstentwurf), aber strukturell exakt
  das Muster, das in Akt II–V wiederverwendet werden sollte (siehe
  Tabelle oben).
