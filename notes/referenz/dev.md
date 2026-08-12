# Dev-Geheimnisse

Diese Datei enthält Informationen, die nur für den Entwickler bestimmt sind.
**Niemals in Changelogs, Patchnotes oder spielersichtigen Texten erwähnen.**

---

## Dev-Modus

Aktivierung in der Browser-Konsole:

```js
devMode()
```

Setzt `gameFlags.devModeEnabled = true` und entsperrt den Debug-Bereich in den Einstellungen.
Alternativ auf der Einstellungs-Seite die Buchstabenfolge `daniel` tippen (schaltet um).

**Beenden:** Knopf „Beenden" ganz oben im Dev-Panel (`disableDevMode()`), oder erneut `daniel`
tippen.

**Build-Badge oben links** (`#dev-build-badge`, index.html): zeigt den Cache-Bust-Stand
(`style.css?v=N`) und ist nur im Dev-Modus sichtbar. `updateDevBadge()` (dev.js) schaltet die
`hidden`-Klasse, aufgerufen aus `render()` (main.js) — die Zahl im Badge wird von Hand gepflegt,
sie muss zum `?v=`-Parameter in `index.html` passen.

Implementiert in [script/dev.js](../script/dev.js).

---

## Weitere Dev-Optionen (hier ergänzen)

<!-- Zukünftige Cheats, Test-Kommandos, versteckte Flags etc. gehören hierher. -->
