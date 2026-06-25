Lies vor deiner ersten Antwort: c:\code\ai\ai helper files\timestamp_prompt.md — und befolge die Regel ab sofort für jede Antwort.

# CLAUDE.md — Projektregeln für Claude Code

## ⚠️ PFLICHT bei jedem Commit mit Spieler-sichtbaren Änderungen

**Vor jedem `git commit` prüfen:**

| Änderung | Was muss mit in den Commit |
|---|---|
| Bugfix | `patchnotes/pending-status.md` (nur Bugfixes!) + Patch-Version bump (`version.json`, `script/state.js` GAME_VERSION + VERSION_NOTES) |
| Neues Feature / Story | `patchnotes/pending-patchnotes.md` + Minor-Version bump — NICHT in pending-status.md |
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

## Discord-Kanäle

- `#status` → `pending-status.md` → immer DELETE + neu POST mit @Hotfix-Ping
- `#patchnotes` → `pending-patchnotes.md` → PATCH bei gleicher Version, POST mit @Patchnotes bei neuer Version

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
