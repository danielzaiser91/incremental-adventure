---
description: Release-Checkliste: Versionsnummer bestimmen + Discord-Kanal wählen, bevor gepusht oder gepostet wird
---

# Release-Checkliste

Vor jedem Push/Release diese Schritte durchführen:

## 1. Umfang der Änderungen bewerten

**Patch (0.x.x → 0.x.Y) — nur wenn ALLE Punkte zutreffen:**
- Ausschließlich Bugfixes und kleinste Korrekturen (Texte, Tippfehler, CSS-Pixel)
- Keine neuen Gameplay-Mechaniken, Skills, NPCs, Items oder Quests
- Keine strukturellen Änderungen an State, Save-Format oder Automatisierung
- Keine neuen UI-Bereiche oder Content-Seiten

**Minor (0.x.0 → 0.Y.0) — wenn MINDESTENS EINES zutrifft:**
- Neue Skills, Quests, NPCs, Items oder Händler
- Neue Gameplay-Mechaniken (z.B. Automatisierung, neue Aktionstypen)
- Neues Kapitel oder Story-Content
- Umfangreiche Überarbeitungen bestehender Systeme
- Neue UI-Bereiche oder Content-Seiten
- Save-Version-Bump mit Changelog-Eintrag

**Major (x.0.0 → Y.0.0):**
- Mit User absprechen

## 2. Version in content.js anpassen

Datei: `script/content.js` — Suche nach der Versions-Anzeige in `renderSettings()`.

## 3. Discord-Kanal wählen

| Version | Kanal | Webhook |
|---|---|---|
| Patch (0.x.Y) | `#status` | In `memory/discord_setup.md` |
| Minor/Major (0.Y.0 / Y.0.0) | `#patchnotes` | In `memory/discord_setup.md` |

## 4. Patchnotes-Inhalt filtern

**Niemals in Patchnotes erwähnen:**
- Änderungen an `dev.js` oder anderen Dev-Only-Features (Dev-Panel, Tastenkombinationen, Debug-Tools)
- Interne Refactors ohne Spieler-sichtbare Auswirkung
- Skill-/Instruktions-Dateien unter `.claude/`
- Commit-Messages, die mit `chore:` beginnen

Nur was ein normaler Spieler merkt oder nutzen kann, gehört in die Patchnotes.

## 5. WICHTIG: User fragen, bevor Discord-Nachricht abgeschickt wird

Nach der Bewertung dem User mitteilen:
- Welcher Umfang festgestellt wurde (Patch / Minor / Major)
- Warum (kurze Begründung, z.B. "neue Skills + Automatisierungs-Refactor")
- Welcher Discord-Kanal vorgesehen wäre

**Dann WARTEN bis der User bestätigt** — erst danach senden.

## Webhook-URLs

Stehen in `C:\Users\ih\.claude\projects\c--code-ai-incremental-adventure\memory\discord_setup.md` — dort nachlesen, nicht raten.
