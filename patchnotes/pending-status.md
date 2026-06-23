## 🐛 Bug-Status — Chroniken des vergessenen Weges

**Aktuelle Version:** v0.15.0-alpha

**Bekannte Fehler:** Keine kritischen Fehler bekannt.

**Zuletzt hinzugefügt in v0.15.0:**
- Neues Raub-System: 4 automatische Raub-Events (1.5–1.7) mit jeweils eigenem Dialog + Auto-Reset
- Neuer Skill-Ast „Paranoid" (5 Fähigkeiten) — parallele Baumstruktur neben dem normalen Erfahrungs-Baum
- „Neu anfangen"-Karte erst sichtbar, wenn „Paranoid" gekauft wurde (neues System)
- Reihe 2 des normalen Skill-Baums erst sichtbar nach Kauf von „Paranoid"
- Arbeitsplatz gesperrt nach 4. Raub, bis „Paranoid" erlernt wird
- Mira/Brakka-Dialog: neuer Ast erklärt, warum Mira den Brief nicht selbst brachte
- NPC-Badges: Greta (INVITED) und Kommandant Roswald (Rekrutierungsphase) korrigiert
- Alle Skill-Lern-Dialoge: immersiver Ich-Monolog beim Kauf jeder Fähigkeit
- 23 neue Errungenschaften (10 für Kapitel 1, 20 für Erfahrungs-Weg)

**Zuletzt behoben/hinzugefügt in v0.14.5/v0.14.6:**
- Der Raub-Dialog konnte bei ungünstigem Autosave-Timing verschwinden und den Erfahrungs-Tab dauerhaft gesperrt lassen — wird beim nächsten Laden automatisch repariert
- Raub: Gold verschwindet jetzt erst nach dem Dialog, nicht schon davor
- Nach einem Neuanfang bleibt die Navigation in der aktuellen Stadt
- Erster Besuch in der Schmiede: Willkommens-Monolog
- Beim ersten Erreichen von 100% Müdigkeit erscheint ein einmaliger Hinweis-Monolog
- Gold- und EP-Gewinne werden als schwebende Zahl in der Charakter-Anzeige animiert
- Mira zeigt jetzt ein ❗-Symbol vor dem ersten Drink
- Alle Zielleisten-Texte in Ich-Perspektive

**Zuletzt behoben in v0.14.3/v0.14.4:**
- Update-Dialog und Spielstand-Changelog erscheinen jetzt nacheinander statt sich zu überschreiben
- „Längere Pause"-Skill auf 4 Stufen + Super-Skill erweitert
- Update-Banner blockiert keine UI-Elemente mehr

**Ältere Fixes (v0.14.1 / v0.14.0):**
- Brakka-❗ erschien schon ab Tag 2, jetzt erst nach dem Waffenschmied-Besuch
- Uhrzeit-Hinweise stapelten sich bei schnellen Aktionen
- Taverne-Tab für Vorarbeiter leuchtete einmalig und war verpassbar
- Müdigkeits-Anzeige ab 95% wurde weiß statt rot
- Zeitkristall-Automation lief noch echtzeit-basiert statt spielzeitbasiert

🔗 https://danielzaiser91.github.io/incremental-adventure/
