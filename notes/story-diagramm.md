# Story-Diagramm — Chroniken des vergessenen Weges

Dieses Diagramm dient als Referenz für alle Kapitel-Entscheidungen, Story-Pfade
und Spielerentscheidungen. Es wird pro Kapitel vor der Implementierung aktualisiert.

---

## Zeitleiste & Pacing

| Beat | storyState | ~Spielzeit ab Kapitelstart | Bedingung | Ziel-Zustand |
|------|------------|---------------------------|-----------|--------------|
| K1 Start | 10100 | 0 min | Frisch geladen | Stadttor betreten |
| 1.1 | 10101 | 1 min | Stadttor betreten | Job finden (Taverne) |
| 1.2 | 10102 | 3 min | 10+ Gold verdient | Weiter schuften |
| 1.3 | (unlockFlag) | 5–8 min | Erste Nacht | Schlafen oder Wachen |
| 1.4 | 20100 | 10–20 min | 50 Gold verdient → Raub | Neuanfang (EP) |
| — (resets) | 20100 | Stunden | Resets + Skills | Gilde vorbereiten |
| **K2 Start** | **20100 + kapitel2Unlocked** | 0 min (K2) | Gildenbeitritt | Jagdgebiet |
| 2.1 | 20101 | 1 min | Erster Kill | Erkunde Jagdgebiet |
| 2.2 | 20102 | 3 min | Korbin-Gespräch | Spur des Diebs starten |
| 2.3 | 20103 | 8 min | 5+ Kills + Münzfund | Mira befragen |
| 2.4 | 20104 | 15 min | Mira-Gespräch | Brakka befragen |
| 2.5 | 20105 | 30 min | Brakka-Gespräch | Fremder konfrontieren |
| 2.6 | 20106 | 60+ min | Konfrontation (Stärke 3+ + Troll) | Wahrheit enthüllt |
| **K2 Ende** | **20200** | 90–120 min | Konfrontation abgeschlossen | Sieg-Dialog |

---

## Kapitel 1 — Der Aufstieg eines Niemands

```
[START: Weltansicht]
    |
    v
[Stadttor betreten] ──> Story 1.1 "Das Stadttor"
    |
    v
[Taverne: Wirt fragen] ──> Job erhalten (Feldarbeit)
    |
    v
[Feldarbeit] ──> Gold verdienen
    |
    +── (10+ Gold totalEarned) ──> Story 1.2 "Zwielichtige Begegnung"
    |                               Fremder taucht in der Taverne auf
    |
    v
[Erste Nacht] ──> Story 1.3 "Die erste Nacht"
    |
    +── Auf der Straße schlafen ──> Straßenkatze-Event (geheim)
    +── In der Absteige schlafen ──> Kein Sonder-Event
    |
    v
[50+ Gold totalEarned] ──> Story 1.4 "Der Raub"
    |                        Gold wird auf 0 gesetzt
    |                        storyState → 20100
    |                        EP-Layer freigeschaltet
    v
[Neuanfang (EP)] ──> [EP-Skillbaum] ──────────────────────────────────────┐
    |                                                                       |
    |── guildPrep Skill kaufen ──> Gilde-Quest bei Brakka               Resets
    |                                                                   (mehrfach)
    v
[Brakka: "Ich bin bereit"] ──> kapitel2Unlocked = true ──> KAPITEL 2
```

**Nebenquests K1:**
- ✉ Brief für Brakka (Mira → Brakka → Mira) — offenes Mysterium
- 🌙 Nachtwache (Brakka → Kommandant Roswald)
- 🧺 Gretas Geschäftsidee (Rohstoffsammeln)
- 🍺 Vorarbeiter-Bonus (10 Feldarbeiten)

**Geheime Errungenschaften K1:**
- 🐈 Straßenkatze (mehrfach auf der Straße schlafen)

---

## Kapitel 2 — Die Spur des Diebs

```
[KAPITEL 2 START: Jagdgebiet freigeschaltet]
    |
    v
[Erster Monster-Kill] ──> Story 2.1 "Erstes Blut"
    | storyState → 20101
    v
[Korbin in der Taverne ansprechen]
    |── (Neues Gesprächsthema: Raubserie)
    |── Quest "Die Spur des Diebs" startet
    |── Story 2.2 "Korbins Geheimnis"
    | storyState → 20102
    v
[5+ Kills im Jagdgebiet] ──> Münzfund-Event
    |── gameFlags.theftClueFoundInJagdgebiet = true
    |── Story 2.3 "Eine Spur im Dunkeln"
    |── Quest → 'investigating'
    | storyState → 20103
    v
[Mira ansprechen (neuer Dialog)]
    |── Quest → 'mira_consulted'
    |── Story 2.4 "Miras wahres Gesicht"
    | storyState → 20104
    v
[Brakka ansprechen (neuer Dialog)]
    |── Quest → 'brakka_consulted'
    |── Story 2.5 "Brakkas Schweigen bricht"
    | storyState → 20105
    v
[Fremder konfrontieren]
    |── Bedingung: Stärke-Lvl 3 + min. 1 Waldtroll-Kill
    |── Quest → 'confronted'
    |── Story 2.6 "Die Konfrontation"
    | storyState → 20106
    v
[Sieg-Dialog] ──> 🎊 Konfetti
    |── Großes Achievement: "Chroniken des vergessenen Weges — Kapitel 1&2"
    |── Discord-Link
    |── Teaser Kapitel 3
    | storyState → 20200
    v
[KAPITEL 2 ENDE]
```

**Geheime Errungenschaften K2:**
- 🔍 "Im Schatten" — Fremden 5+ Mal ansprechen (er war immer da)
- 🗝 "Altes Gold" — Detektivquest abschließen während < 10 Gold im Beutel
- 🏆 "Chroniken des vergessenen Weges" — Kapitel 2 abgeschlossen

---

## Wiederkehrende NPCs und Beziehungsbögen

| NPC | K1 Rolle | K2 Rolle | Beziehungsbogen |
|-----|----------|----------|-----------------|
| Korbin | Jobvermittler, Kneipenwirt | Informant, Gerüchteküche | Neutral → vertrauter Kontakt |
| Brakka | Mentor, Questgeber | Zeuge, Enthüller | Respekt → echtes Vertrauen |
| Mira | Mysterium, Briefbotin | Wissende, Vertraute | Flirt → echte Verbündete |
| Oswin | Hochnäsiger Reicher | — | Unverändert arrogant |
| Fremder | Bedrohliches Foreshadowing | Konfrontation, Enthüllung | Feind? → ambivalentes Ende |
| Vorarbeiter | Arbeitgeber | — | Respekt verdient |
| Greta | Questedgeber | — | Geschäftspartner |
| Kommandant Roswald | Ausbilder | — | Autoritätsfigur |

---

## Spielerentscheidungen mit Konsequenz

| Entscheidung | Konsequenz |
|---|---|
| Brief für Brakka annehmen (Mira) | Quest-Bonus + spätere Enthüllung des Mysteriums |
| Fremden 5x ansprechen | Geheime Errungenschaft |
| Auf der Straße schlafen statt in Absteige | Straßenkatze-Progress |
| Waldtroll kämpfen (stark genug) | Tor für Endkonfrontation |
| Detektivquest mit < 10 Gold | Geheime Errungenschaft |

---

## Geplant für Kapitel 3 (Teaser)

- Die Figur des „Schattens" — wer ist er wirklich?
- Die Abenteurergilde als echte Organisation mit eigenen Missionen
- Eine neue Stadt jenseits von Treutheim
- Das eigene Zuhause (Schlafplatz + Schmiede freischalten)
- Mehr Haustiere, mehr Companions
