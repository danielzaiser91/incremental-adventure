# todo next time
Datum der letzten Session + TODOs beschreiben

21.06.2026 — Session abgeschlossen

## Was in dieser Session implementiert wurde:

### Quick Fixes:
- Mobile: CSS Grid `1fr` → `minmax(0,1fr)` (horizontal overflow behoben)
- Mobile: `100dvh` + `env(safe-area-inset-bottom)` (Systemleiste überdeckte Zielleiste)
- Klickbarer Zieltext (Tippen öffnet Dialog mit vollständigem Text)

### Story-System Kapitel 2 (große Implementierung):
- 7 neue Story-Einträge (2.1–2.7) inkl. Detektiv-Arc und Abschluss
- Detektiv-Quest "Die Spur des Diebs" (6 Stufen)
- Kapitel-2-Objectives für alle story-States (20100–20200)
- storyState=20100 wird jetzt beim Raub gesetzt (Bugfix: Chronik-Eintrag 1.4)
- Kill-Zähler + Story-Trigger nach erstem Kill (2.1), nach 5 Kills (Münzfund 2.3)
- Waldtroll-Kill-Flag als Tor zur Konfrontation
- NPC-Kapitel-2-Dialoge: Korbin (Raubserie), Mira (Enthüllung), Brakka (Zeuge), Fremder (Konfrontation)
- 3 neue geheime Errungenschaften + 1 große Kapitel-Errungenschaft
- Sieg-Dialog mit Konfetti am Ende von Kapitel 2
- Spielstand-Version auf 8 erhöht

## Offene Punkte / Nächste Session:

### Bekannte TODO:
- Discord Server einrichten + Link in den Sieg-Dialog eintragen
  (aktuell steht "Discord-Link folgt in Kürze")
- Kapitel 3 konzeptionieren (story-diagramm.md enthält erste Ideen)
- Chapter-2-Ende: `storyState >= 20200` Objective + nav

### Lose Enden (aus lose-enden.md):
- Eigener "Stadtwache"-Arbeitsplatz (Kommandant Roswalds Einladung einlösen)
- Miras Brief-Mysterium auflösen (K3-Subplot geplant)
- Eigenes Zuhause-Feature (Schlafplatz + Schmiede)
- Weitere Super-Skills (clearMind, guildPrep, sleepLikeARock etc.)
- Mehr Haustiere (reguläre Kategorie, nicht nur "Besonders")

----------------
