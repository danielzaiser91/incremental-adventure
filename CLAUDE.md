Lies `c:\code\ai\ai helper files\timestamp_prompt.md` und befolge die Regel für jede Antwort.
Pflicht-Auslöser (lies die Datei sofort, bevor du antwortest):
- Gesprächsbeginn / erste Antwort
- Kontext wurde komprimiert (erkennbar: Zusammenfassung am Anfang mit "This session is being continued from a previous conversation")

# CLAUDE.md — Projektregeln für Claude Code

## ⚠️ PFLICHT bei jedem Commit mit Spieler-sichtbaren Änderungen

**Vor jedem `git commit` prüfen:**

| Änderung | Was muss mit in den Commit |
|---|---|
| Bugfix | `patchnotes/pending-status.md` (Version + Bugfixes eintragen) + Patch-Version bump (`version.json`, `script/state.js` GAME_VERSION + VERSION_NOTES) |
| Neues Feature / Story | `patchnotes/pending-patchnotes.md` + Minor-Version bump + **Version in `pending-status.md` aktualisieren** |
| Feature ohne Minor-Bump (Nachtrag) | `patchnotes/pending-patchnotes.md` ergänzen → Bot macht PATCH (Edit) der bestehenden Nachricht |
| Bekannter Bug (noch offen) | `patchnotes/pending-status.md` unter "Bekannte Fehler" |
| Workflow / Dev-Dateien / Refactoring | nichts — kein Spieler-Impact |

**Faustregel:** "Würde ein Spieler das merken?" → Ja → pending-Update im selben Commit.

Der Discord-Bot springt NUR an wenn `pending-status.md` oder `pending-patchnotes.md` geändert wurde. Kein Update = keine Discord-Kommunikation.

## Versionsnummern — bei jedem Bump diese Dateien anpassen

- `version.json` → wird vom Spiel alle 3 Min gefetcht für Update-Banner
- `script/state.js` → `GAME_VERSION` Konstante + neuer Eintrag in `VERSION_NOTES` mit spielersichtbaren Änderungen
- `script/content.js` → nutzt `GAME_VERSION` automatisch, keine manuelle Änderung nötig
- `script/state.js` → `CURRENT_SAVE_VERSION` + `SAVE_CHANGELOG` **nur** bei Änderungen an gespeicherten Datenstrukturen
- `CHANGELOG.md` (Projekt-Root) → immer aktualisieren: Patch-Versionen als Unterabschnitt, Minor/Major als neuer Abschnitt

## Discord-Kanäle

| Kanal | Channel-ID | Verwendung |
|---|---|---|
| `#patchnotes` | `1518367613640507552` | Minor/Major-Releases → `pending-patchnotes.md` → PATCH (gleiche Version) / POST mit @Patchnotes (neue Version) |
| `#status` | `1518378043830304808` | Patch-Versionen + Bugs → `pending-status.md` → immer DELETE + neu POST mit @Hotfix-Ping |
| `#feedback` | `1518385990409129984` | Spieler-Bug-Reports — nur lesen, nicht schreiben |
| `#allgemein` | `1518367128686952491` | Allgemeiner Chat |
| `#spoiler-erlaubt` | `1518372670163390504` | Spoiler-Diskussionen |
| `#willkommen` | `1518381095635124357` | Willkommens-Kanal |
| `#kapitel-1` | `1518385791682740426` | Kapitel-1-Diskussionen |
| `#kapitel-2` | `1518385813103050822` | Kapitel-2-Diskussionen |
| `#moderator-only` | `1518391365333946540` | Nur Mods |
| `#eingangshalle` | `1518590738211012628` | Eingangsbereich |

**Server-ID:** `1518367128074457209`
**Bot-ID:** `1519669988229779506` (Chroniken Bot — Token in my_secrets.md Zeile 22)

## Patchnotes-Format (pending-patchnotes.md)

Struktur: **Allgemein** (keine Spoiler) → dann pro Kapitel ein Abschnitt mit Discord-Spoiler-Tag:

```
**Allgemein**
• Änderung ohne Kapitel-Bezug

**Kapitel 2** *(zum Aufdecken anklicken)*
||Dialoge überarbeitet:
- NPC1 · NPC2 · NPC3

Bugfixes:
- Fix 1
- Fix 2||

**Kapitel 3** *(zum Aufdecken anklicken)*
||Kapitel-3-Inhalt hier.||
```

- `||Text||` = Discord-Spoiler (Spieler klickt zum Aufdecken) — **mehrzeilig erlaubt**, `||` öffnet und schließt den Block
- ⚠️ Spoilerblock muss mit einem **Buchstaben** beginnen (nicht `•` oder `-`), sonst erkennt Discord `||` nicht als Spoiler-Opener
- Einträge innerhalb des Spoilers als Liste mit `-` pro Zeile — keine langen `·`-Ketten
- Kategorien innerhalb des Spoilers (z.B. "Dialoge überarbeitet:" / "Bugfixes:") mit Leerzeile trennen
- Allgemein = kapitelunabhängige Features/Fixes, nie in Spoiler
- Je tiefer das Kapitel, desto weiter unten in der Nachricht

## Spieler-sichtbare Texte & Dialoge

Alle NPC-Dialoge, Story-Texte, Monologe und immersiven Beschreibungen werden mit der spezialisierten **Dialog-/Roman-KI** geschrieben (Subagent-Typ `fable`). Das gilt für:
- Neue NPC-Dialogknoten (nodes in npc.js)
- Story-Einträge (story.js)
- Monologe (showMonologue-Aufrufe in actions.js, content.js etc.)
- Beschreibungstexte von Locations, Karten, Items

Einzige Ausnahme: kurze funktionale Labels (Button-Texte, Toast-Nachrichten mit reinen Werten wie "+300 Gold").
