# Kapitel 4 — "Der Preis des Einflusses"

## Die Kernfantasie

Kap 1: Wer arm ist, wird bestohlen.
Kap 2: Wer schwach ist, verliert.
Kap 3: Wer nicht versteht, wird manipuliert.
Kap 4: **Wer allein kämpft, verliert gegen Systeme.**

Valdris ist in Velmark nicht mehr fliehend — er ist zuhause. Er hat keine Bande,
er hat ein Netzwerk aus Menschen, die ihm etwas schulden. Das zerstört man nicht
mit Stärke. Man muss ein eigenes Netz bauen.

## Story-Arc: 10 Beats

### 4.1 — Velmark
Ankunft. Große Handelsstadt, laut, überwältigend.
Niemand kennt mich. Zum ersten Mal seit Treutheim bin ich wieder ein Niemand —
aber diesmal weiß ich, was das bedeutet.
Trigger: velmarkUnlocked (Weltkarte nach kap3Complete)

### 4.2 — Drei Säulen
Velmark wird von drei Kräften zusammengehalten:
- Händlergilde (Geld regiert)
- Eiserne Bruderschaft (Söldner, Wachen, Gewalt)
- Stadtarchiv (Legitimität, Aufzeichnungen, Geschichte)
Valdris hat in allen dreien einen Fuß drin — aber noch keine Hand.
Trigger: erste Erkundungsaktion in Velmark

### 4.3 — Pereth, wieder
Pereth ist hier. Nicht für Valdris tätig — er ist ihm einen Schritt voraus
und einen hinter mir. Er kennt Velmark, hat Schulden, will raus.
Er wird mein erster Informant.
Trigger: perethFoundInVelmark (Pereth-NPC in Velmark angesprochen)

### 4.4 — Der erste Schritt
Erste Fraktion angesprochen, erste Quest abgeschlossen.
Die Tür, die zuerst aufgeht, hängt von der eigenen Geschichte ab:
Mut → Bruderschaft | Einsicht → Archiv | Gold → Gilde.
Trigger: eine Fraktion auf Reputation ≥ 30

### 4.5 — Valdris sieht mich
Ein Brief. Kein Absender. Aber die Handschrift.
Er weiß, dass ich hier bin. Er fragt nicht, was ich will —
er setzt voraus, dass wir dasselbe wollen.
Trigger: valdrisBriefErhalten (automatisch nach 4.4)

### 4.6 — Zwei Säulen
Zwei von drei Fraktionen verbündet. Valdris macht Gegenzüge.
Trigger: zwei Fraktionen auf Reputation ≥ 60

### 4.7 — Das Angebot
Er sitzt mir gegenüber. Zum ersten Mal. Ruhiger als erwartet.
"Ich baue etwas Dauerhaftes. Du auch. Warum nicht zusammen?"
Trigger: valdrisAngebotGemacht (automatisch nach 4.6)

### 4.8 — Keine Kompromisse
Ablehnung. Nicht weil ich ein besserer Mensch bin —
sondern weil sein "Dauerhaftes" auf anderen liegt, und das wäre bald auf mir.
Trigger: valdrisAngebotAbgelehnt (Button-Klick in Dialog)

### 4.9 — Das Netz steht
Alle drei Fraktionen. Valdris ist eingekreist — politisch, nicht militärisch.
Trigger: allianzKomplett (alle drei Fraktionen ≥ 80 Reputation)

### 4.10 — Das Ende
Das letzte Gespräch war kurz. Er ist gegangen, weil er musste.
Epilog: Briefe an Varena, Mira, Brakka. Pereth. Velmark.
Trigger: kap4Complete (Konfrontation abgeschlossen)

## Neue Mechanik: Einfluss (⚜)

Kein weiterer Prestige-Reset. Einfluss wird gesammelt und direkt eingesetzt.
Das ist das Ende der Prestige-Schleife.

Quellen:
- Fraktion-Quests: 2–5 ⚜
- Tier-3-Kämpfe (Valdris' Söldner): 1 ⚜
- Diplomatie-Aktionen: 1–3 ⚜
- Pereth-Informationen einsetzen: 2 ⚜

Verwendung:
- Fraktions-Reputation erhöhen (direkter Kauf)
- Diplomatie-Aktionen freischalten (Einmalkosten)
- Informanten anwerben

## Fraktionssystem

Drei Fraktionen mit je einem Reputations-Balken (0–100):
- ≥ 30: "Bekannt" — erste Quests verfügbar
- ≥ 60: "Verbündet" — Diplomatie-Aktionen und Händler-Boni
- ≥ 80: "Vollverbündet" — für Allianz gegen Valdris erforderlich

| Fraktion | Leitressource | Voraussetzung | Kap-1–3-Verbindung |
|---|---|---|---|
| Händlergilde | Gold | 500 Gold verfügbar | Kap-1-Loop |
| Eiserne Bruderschaft | Stärke + Mut | Mut ≥ 5, Stärkelevel ≥ 5 | Kap-2-Kampf |
| Stadtarchiv | Einsicht + Alchemie | Einsicht ≥ 10, Alchemie Geselle | Kap-3-System |

## Features

### Diplomatie-Aktionen (neue Action-Karten)
- Verhandeln (Händlergilde): kostet Gold → Einfluss + Reputation
- Einschüchtern (Bruderschaft): kostet Mut → Einfluss, kann scheitern
- Überzeugen (Archiv): kostet Einsicht → Einfluss + neue Dialog-Optionen

### Informantennetz (passiver Tick, analog Alchemie)
- Freigeschaltet nach Pereth-Quest
- 1–5 Informanten, jeder gibt 1 ⚜ / Minute passiv
- Neue Informanten werden mit Einfluss angeworben

### Tier-3-Kämpfe (Velmark-Jagdgebiet)
- Velmarker Stadtwache (korrumpiert)
- Valdris-Söldner
- Gildenwächter
- Drops: Einfluss + Gold + Velmark-Rohstoffe

### Velmark-Markt
- Informationshändlerin: Hinweise gegen Gold/Einsicht
- Waffenschmied (eingelöster Kap-1-Platzhalter)
- Alchemie-Spezialist: erweiterte Aspekt-Materialien

### Pereth als Verbündeter
- 4-stufiger Dialog-Baum
- Kostet Einfluss oder Gold je Stufe
- Gibt exklusive Valdris-Schwachstellen frei
- Epilog: bleibt oder geht (beide Wege haben Text)

## Harmonisierung mit Kap 1–3

| Früheres System | Kap-4-Rolle |
|---|---|
| Gold (Kap 1) | Händlergilde-Quests, Velmark-Markt, Bestechung |
| EP/Skills (Kap 1) | Schneller-Lerner → kürzere Verhandlungszeiten |
| Mut (Kap 2) | Bruderschaft-Aktionen (Einschüchtern, Risikoaktionen) |
| Stärke (Kap 2) | Tier-3-Kämpfe vorausgesetzt |
| Einsicht (Kap 3) | Archiv-Fraktion; Überzeugen-Aktion |
| Alchemie (Kap 3) | Kampfboni jetzt notwendig, nicht optional; Archiv schätzt es |
| Wissensdurst-Skills (Kap 3) | Forschungsinstinkt → Informantennetz-Bonus |

## Was Kap 4 NICHT bekommt
- Keinen weiteren Prestige-Reset
- Keine neue Alchemie-Neuerfindung
- Keine weiteren Prestige-Währungen nach Einfluss
