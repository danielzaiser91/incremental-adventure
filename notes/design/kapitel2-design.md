# Kapitel 2 — Die Spur des Diebs
*Treutheim (erweitert) · Tier 1 · Prestige-Währung: Mut (⚔)*

---

## Story-Arc

Der Spieler wurde beraubt — aber hat überlebt. Jetzt geht er dem Dieb nach. Was als einfache Rachegeschichte beginnt, entpuppt sich als Teil eines organisierten Netzwerks unter einem Strippenzieher namens "der Schatten".

| Eintrag | Titel | Auslöser |
|---------|-------|---------|
| 2.1 | Erstes Blut | Erster Kill im Jagdgebiet |
| 2.2 | Korbins Geheimnis | Korbin in Taverne nach Kap-2-Unlock angesprochen |
| 2.3 | Eine Spur im Dunkeln | Eigene Münze unter Räuberbeute gefunden |
| 2.4 | Miras wahres Gesicht | Mira teilt ihre Informationen |
| 2.5 | Brakkas Schweigen bricht | Brakka nennt den Fremden als Bindeglied |
| 2.6 | Die Konfrontation | Fremder mit Beweisen gestellt |
| 2.7 | Das Ende des Anfangs | Kap-2-Abschluss (`storyState 20200`) |

**Wendepunkt 1:** Münze im Jagdgebiet → Raub war kein Zufall, sondern ein Netzwerk.
**Wendepunkt 2:** Fremder gibt zu, er war ein "Auswahltest" — der eigentliche Schatten ist noch frei.
**Kapitelende:** Sieg-Dialog + Konfetti. Der Schatten ist bekannt aber unerreicht. Kap 3 wird vorbereitet.

---

## Gameplay-Loop

```
Tag:
  → Stadtwache-Schicht (Gold, Kap-2-Kern-Job)
  → Rohstoffe sammeln (optional)
  → Feldarbeit (weiterhin möglich, aber nachrangig)

Abend/Nacht:
  → Jagdgebiet (Stärke, Gold, Mut, Zeitkristalle)
  → Nachtwache (alternativ)
  → Taverne: Quest-NPCs, Story-Gespräche

Neuanfang:
  → Mut ausgeben (analog zu EP — noch nicht implementiert)
  → Stärke-Progression: reset, aber Mut übersteht
```

**Kern-Fantasie:** Vom Handwerker zum Kämpfer. Die Stadt kennt mich schon, jetzt beweise ich mir selbst, wozu ich fähig bin.

---

## Neue Orte (gegenüber Kap 1)

| Ort | Freischaltbedingung |
|-----|-------------------|
| Jagdgebiet | Gildeneintritt via Brakka (`kapitel2Unlocked`) |
| Stadtwache | Roswald-Angebot nach Waldtroll-Sieg (`stadtwacheAccepted`) |
| Automatisierung | Erster Zeitkristall-Drop (`automationDiscovered`) |

---

## Mechaniken (neu in Kap 2)

| Mechanik | Details |
|----------|---------|
| **Kampfsystem** | Rundenbasiert (Angriff / Heilen / Fliehen); Spieler-HP + Stärke-Level; 4 Monster |
| **Stärke-Progression** | XP aus Kämpfen; 6 Level (Schaden/HP/Verteidigung skalieren) |
| **Mut** | Prestige-Währung aus Boss-Kills (Waldtroll: 1 Mut); übersteht Neuanfang |
| **Stadtwache** | Tages-Job; 5 Level (25–35 Gold/Schicht); Progressbar wie Feldarbeit |
| **Zeitkristalle** | Seltener Kampf-Drop; ermöglicht Automatisierung (30s-Tick, kein Hunger/Müdigkeit) |
| **Automatisierung** | Feldarbeit, Holz, Stein, Wildkraut, Stadtwache (ab 50 Schichten) |
| **Super-Skills** | 4 neue Endknoten (ironWill+, fieldworkMemory+, nightWatchLeveling+, inventoryKeeper+) |

---

## Monster (Jagdgebiet)

| Monster | Zone | HP | Schaden | Mut |
|---------|------|-----|---------|-----|
| Hungriger Wolf | Wald | 12 | 3–6 | 0 |
| Wilder Eber | Wald | 20 | 4–8 | 0 |
| Schwarzbär | Wald | 35 | 7–13 | 0 |
| Waldtroll ⭐ | Tief | 60 | 10–18 | 1 |

Waldtroll ist Gate-Keeper für: Roswald-Angebot (Stadtwache) + Endkonfrontation mit dem Fremden.

---

## NPCs (Kap-2-Relevanz)

| NPC | Rolle in Kap 2 |
|-----|---------------|
| Korbin | Erstes Hinweis-Gespräch über Raubserie ("der Schatten") |
| Mira | Kennt den Zusammenhang; teilt ihn nach Vertrauensaufbau |
| Brakka | Schmiede + Gilden-Gate + nennt den Fremden als Verdächtigen |
| Fremder (anonym) | Antagonist Kap 2; "Voraussucher" des Schattens |
| Roswald | Bietet Stadtwache an nach Waldtroll-Sieg; militärisch, direkt |
| Oswin | Lehrer-Gate für Super-Skills (Kap 1–2 Übergang) |
| Greta | Questkette Rohstoffe; gibt reguläre Haustiere (geplant) |

---

## Prestige-Währung: Mut

Entsteht durch Boss-Kills (Waldtroll → 1 Mut). Übersteht Neuanfang. Verwendung noch **nicht implementiert** — geplant als Kap 2→3 Übergangs-Prestige analog zu EP.

---

## Story-Fäden offen nach Kap 2

1. **Der Schatten** — Identität unbekannt, weiß vom Spieler (Fremder hat berichtet)
2. **Miras Brief** — sie hat Kontakte, die gefährlich sind; wohin führt das?
3. **Abenteurergilde** — Brakka hat den Zugang ermöglicht, aber die Gilde ist noch nicht ausgebaut
4. **Mut als Währung** — gesammelt, aber noch nicht nutzbar

---

## Übergang zu Kapitel 3

**Voraussetzungen (geplant):** Kap 2 vollständig abgeschlossen (`chapter2Complete`) + Treutheim weitgehend automatisiert.
**Prestige:** `meta.resets` + `mut` als Eingangskapital für Kap 3.
**Was sich ändert:** Neue Stadt (Tier 2), neue Berufe, Schatten als aktive Bedrohung.
