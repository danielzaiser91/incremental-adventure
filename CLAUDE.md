# CLAUDE.md — Projektregeln für Claude Code

## ⚠️ PFLICHT bei jedem Commit mit Spieler-sichtbaren Änderungen

**Vor jedem `git commit` prüfen:**

| Änderung | Was muss mit in den Commit |
|---|---|
| Bugfix | `patchnotes/pending-status.md` + Patch-Version bump (`script/content.js`) |
| Neues Feature / Story | `patchnotes/pending-patchnotes.md` + Minor-Version bump |
| Bekannter Bug (noch offen) | `patchnotes/pending-status.md` unter "Bekannte Fehler" |
| Workflow / Dev-Dateien / Refactoring | nichts — kein Spieler-Impact |

**Faustregel:** "Würde ein Spieler das merken?" → Ja → pending-Update im selben Commit.

Der Discord-Bot springt NUR an wenn `pending-status.md` oder `pending-patchnotes.md` geändert wurde. Kein Update = keine Discord-Kommunikation.

## Versionsnummern

- `script/content.js` → Versionsstring im UI (z.B. `0.14.2-alpha`)
- `script/state.js` → `CURRENT_SAVE_VERSION` + `SAVE_CHANGELOG` nur bei Änderungen an gespeicherten Datenstrukturen

## Discord-Kanäle

- `#status` → `pending-status.md` → immer DELETE + neu POST mit @Hotfix-Ping
- `#patchnotes` → `pending-patchnotes.md` → PATCH bei gleicher Version, POST mit @Patchnotes bei neuer Version
