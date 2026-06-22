# todo next time

Alle priorisierten Aufgaben stehen jetzt vollständig in `notes/implementierungsplan.md`.
Diese Datei wird künftig nur noch für Session-End-Notizen (was diese Session implementiert wurde)
und kurzfristige TODOs genutzt, die noch nicht in den Plan eingeflossen sind.

---

## Letzte Session (22.06.2026)

### Implementiert:
- NPC-Verfügbarkeitsindikator: farbiger Dot (grün/gelb/grau) auf allen NPC-Kacheln der Taverne, mit Hover-Tooltip (npc.js + style.css)
- Tooltip-Basiswert: "Errechnete Werte" zeigt jetzt Basiswert über den Modifikatoren (content.js, style.css)
- Automatisierungs-Overhaul: kein Hunger/Müdigkeit, neue Karten-UI, Unlock-Conditions, neuer Intro-Text (automation.js, style.css)
- Save-Deduplication: alte Saves mit mehrfach assignierten Zeitkristallen werden beim Laden bereinigt (save.js)

### Design-Entscheidungen getroffen (in implementierungsplan.md):
- ironWill_super: zählt ab sofort, rückwirkend null
- Eigenes Zuhause: Oswin, 2000 Gold, Schmiede separat ≥1000 Gold
- Haustiere: Greta-Quest (Kap-2), Jagdgebiet-Fang, je Tier anderer Bonus, unendlich steigerbar, 1x/Tag gesamt
