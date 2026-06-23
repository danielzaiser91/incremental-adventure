## 🐛 Bug-Status — Chroniken des vergessenen Weges

**Aktuelle Version:** v0.16.4-alpha

**Bekannte Fehler:** Keine kritischen Fehler bekannt.

**In v0.16.4 gefixt/geändert:**
- EP-Mindestschwelle für Neuanfänge angehoben: 50 → 300 Gold (Raub 2 bei 200g gibt nun keine EP mehr)
- "Weitblick"-Gold-Meilensteine starten jetzt bei 300g und verdoppeln sich (300, 600, 1200, 2400 …)
- Schuften-Karte: Progressbar erscheint jetzt über dem Button — kein Layout-Sprung mehr beim Klick

**In v0.16.3 gefixt:**
- Zieltext nach dem 4. Raub und zu Beginn von Kapitel 2 enthielt UI-Begriffe ("Erfahrungs-Baum", "Reiter") — ersetzt durch immersive Formulierungen
- Paranoid-Skill: Nachteil-Zeile bricht jetzt im Detail-Panel auf eine eigene Zeile um

**In v0.16.2 gefixt:**
- Raub-Resets werden beim nächsten Laden automatisch nachgeholt, falls sie durch den Bug in v0.16.1 übersprungen wurden (Spielstand-Selbstheilung)
- Raub-Story-Dialoge öffnen jetzt zuverlässig nach NPC-Dialogen — verhindert, dass der Reset-Callback aus brakka.turnIn oder anderen NPC-Aktionen verloren geht

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
