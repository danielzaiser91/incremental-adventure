# Konzept: Spezielle Dialog-basierte Jobs
Stand: 22.06.2026

## Idee: Tagesblock-Job mit Zeitverlauf

Ein neuer Job-Typ für zukünftige Kapitel, der sich deutlich von
Feldarbeit (Progressbar-Klicker) und Nachtwache (Nacht-Block) unterscheidet.

### Mechanik
- **Startfenster:** Job kann nur zwischen Uhrzeit A und B begonnen werden
  (z.B. nur zwischen 6:00 und 10:00 Spielzeit)
- **Gesamtdauer:** z.B. 8 Spielstunden (kein realer Timer — Spielzeit wird
  auf einmal vorangebracht, wie bei Nachtwache)
- **Dialoge als Story-Beats:** Bei 0h, 2h, 4h, 6h, 8h erscheint ein Dialog
  - Kann reine Flavor-Texte enthalten (Stimmung, Athmosphäre)
  - Oder interaktive Entscheidungen ("Hilf dem verletzten Händler / ignoriere ihn")
  - Entscheidungen beeinflussen Bonus am Ende (z.B. +Ruf, +Belohnung, +Lore)
- **Abschluss:** Gibt Belohnung, setzt Spieluhr auf Ende des Arbeitstages

### Anwendungsbeispiele
- Handelskarawanen-Begleitung (Kapitel 3+)
- Botendienst über mehrere Stadtteile
- Bewachungsauftrag für ein Lager

### Technisch
- Neuer Render-Bereich ähnlich wie Schlafplatz (kein Progressbar-Button,
  sondern ein "Schicht starten"-Button der direkt mehrere Dialoge in Folge auslöst)
- `advanceClock(n)` zwischen jedem Dialog-Schritt
- Ergebnis-State über ein temporäres Objekt (`activeJobSession: {}`)
- Flag im State: `gameFlags.isOnTagesblock = true` verhindert andere Aktionen

### Abgrenzung
- Feldarbeit/Stadtwache: Progressbar, beliebig oft tagsüber (Standard-Loop)
- Nachtwache: Nacht-Block, einmal pro Nacht
- Tagesblock: Startfenster, einmal pro Spieltag, mit Zwischen-Dialogen

---
*Implementierung: frühestens Kapitel 3 — erst wenn ein passender Job-Kontext da ist.*
