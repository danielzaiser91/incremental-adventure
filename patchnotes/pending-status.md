## 🐛 Bug-Status — Chroniken des vergessenen Weges

**Aktuelle Version:** v0.16.1-alpha

**Bekannte Fehler:** Keine kritischen Fehler bekannt.

**In v0.16.1 gefixt:**
- Erster Raub löst jetzt zuverlässig einen Reset aus, auch wenn gleichzeitig der Monolog zur ersten Nachtwache gezeigt wird (Dialog-Überschreibungs-Bug)
- Kapitel-2-Sieg konnte nicht ausgelöst werden — der Sieg-Callback nach der Konfrontation wurde durch ein internes Dialog-Close sofort unterbrochen

**In v0.16.0 gefixt:**
- Essen lindert jetzt leichte Müdigkeit (Brot −4%, Fisch −8%, Honigkuchen −15%, Kaffee −16% netto) — Richtung war vorher falsch
- Taverne-Tab leuchtet nicht mehr, wenn Greta Rohstoffe erwartet, die noch nicht gesammelt wurden
- Dialog-Guard robuster — kein DOM-Neuaufbau mehr, zuverlässiger bei schnellen Klickfolgen

**In v0.15.4 gefixt:**
- Icons (⚙ Einstellungen, Kap-Anzeige, Ziel) korrekt — Sonderzeichen-Kodierung war korrumpiert
- Taverne-Tab leuchtet jetzt NPC-zustands-basiert — keine manuellen Flags mehr
- Erfahrung-Sidebar erst nach erstem Neuanfang sichtbar

🔗 https://danielzaiser91.github.io/incremental-adventure/
