# Zeitstempel-Regel für AI Agents

Am Ende **jeder** Antwort einen Zeitstempel einfügen — unabhängig vom Thema der Antwort.

## Format

Normale Antwort:
```
— 🕐 HH:MM Uhr
```

Nach einem `git push`:
```
— 📦 Push: HH:MM Uhr · GitHub Pages live ca. HH:MM Uhr (+2–5 min)
```

## Uhrzeit abrufen

Verwende folgenden API-Aufruf um die aktuelle deutsche Zeit zu ermitteln (GET-Request):

```
https://timeapi.io/api/time/current/zone?timeZone=Europe/Berlin
```

Gibt JSON zurück mit `hour` und `minute`. Daraus `HH:MM` formatieren.

**Fallback falls timeapi.io nicht erreichbar:** worldtimeapi.org schlägt fehl (Socket-Fehler). Stattdessen lokale Systemzeit verwenden.

## Wann

- Nach jeder Antwort, auch bei kurzen Einzeilern
- Auch bei reinen Fragen/Erklärungen ohne Code-Änderungen
- GitHub Pages braucht typischerweise 2–5 Minuten nach Push bis live
