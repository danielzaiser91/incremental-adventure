# Wie prompte ich Claude Code richtig?
## Leitfaden für dieses Projekt

---

## Claudes Gedächtnissystem: Was landet wo?

Claude hat mehrere Schichten, in denen Informationen hinterlegt sein können.
Je nach Art der Information gehört sie an einen anderen Ort:

### SKILL.md — `.claude/skills/incremental-adventure/SKILL.md`
**Was:** Architekturregeln, hartgelernte Bugs, Design-Patterns, die beim Coden
direkt relevant sind. Wird am Anfang JEDER Session automatisch eingelesen.
**Merksatz:** Alles, was Claude beim Schreiben von Code wissen muss, um keinen
alten Fehler zu wiederholen oder gegen Projektregeln zu verstoßen.
**Beispiele:**
- "Dialog-Ketten immer mit `closeDialog(callback)`, nie direkt hintereinander"
- "First-Time-Momente brauchen Ich-Perspektiv-Dialoge beim ABSCHLUSS, nicht Start"
- "Render-Funktionen dürfen render() nicht selbst aufrufen"

### /memory/ — `C:\Users\ih\.claude\projects\...\memory\`
Persistentes Gedächtnis über Sessions hinweg. Vier Typen:
- **user_*.md** — Wer ist der User? (Rolle, Vorwissen, Präferenzen)
- **feedback_*.md** — Korrekturen und bestätigte Vorgehensweisen ("nicht so", "genau so")
- **project_*.md** — Was läuft gerade, warum, bis wann
- **reference_*.md** — Wo findet Claude externe Infos (z.B. Webhooks, Discord-Kanal-IDs)

**Webhooks und Secrets** → `memory/discord_setup.md` (type: reference).
Niemals ins Git-Repo, niemals in SKILL.md. Der /memory/-Ordner ist lokal und
wird nie committed.

### notes/ — Spieldesign-Dokumente des Users
Für Claude nur lesbares Hintergrundwissen. Claude schreibt hier nur rein,
wenn der User explizit bittet. Kein automatisches Laden.

### Faustregel: Wohin gehört was?
| Information | Ziel |
|-------------|------|
| Coding-Pattern oder Bug-Lehre | SKILL.md |
| Grundlegende Design-Philosophie (z.B. "first-time Momente") | SKILL.md |
| Dinge die nur BEIM CODEN relevant sind | SKILL.md |
| Webhooks, externe URLs, Kanal-IDs | memory/reference_*.md |
| User-Korrekturen ("mach X nicht mehr so") | memory/feedback_*.md |
| Was gerade gebaut wird, warum | memory/project_*.md |
| Spieldesign-Entscheidungen (Story, Balance) | notes/ (User's Dokumente) |
| Git-/Commit-History | Git (nicht im Memory) |
| Aktuelle Session-Aufgaben | Conversation context (nicht speichern) |

---

## Grundprinzip: Was du sagst, bekomme ich

Claude arbeitet am besten, wenn ein Prompt drei Dinge enthält:
1. **Was** soll gebaut werden (konkret, nicht vage)
2. **Wo** gehört es hin (welche Datei, welcher Bereich)
3. **Warum** — Spielgefühl oder Design-Absicht

Schlechtes Beispiel: *"Mach das Kampfsystem besser."*
Gutes Beispiel: *"Die Waldtroll-Sperre soll auf Stärkelevel 2 statt XP-Wert 30 basieren. Ändere in combat.js die `blocked`-Bedingung entsprechend."*

---

## Struktur eines guten Feature-Prompts

```
[Feature-Name]: [Ein-Satz-Zusammenfassung]

Mechanik:
- [Bullet-Point 1: Was passiert]
- [Bullet-Point 2: Unter welcher Bedingung]
- [Bullet-Point 3: Was sich verändert]

Spielgefühl:
[Warum fühlt sich das richtig an? Was ist der emotionale Kern?]

Dateien:
- [Datei 1]: [Was dort geändert wird]
- [Datei 2]: [Was dort geändert wird]

Nicht:
- [Was explizit NICHT implementiert werden soll]
```

---

## Dos und Don'ts

### ✓ Tu das

**Klare Priorisierung geben:**
> "Fang mit dem Jagdgebiet an, Automatisierung kommt danach."

**Den genauen Wortlaut vorgeben, wenn er wichtig ist:**
> Dialog: "Brakka nickt. 'Gut. Dann fang an.'"

**Spieltechnisches Vokabular nutzen:**
> "Das soll wie `fieldworkMemory` funktionieren — übersteht den Gold-Reset."

**Auf SKILL.md verweisen wenn relevant:**
> "Ich will das wie im SKILL.md-Kapitel Dialog-Chains beschrieben machen."

**Sagen wenn etwas Feature-Flag-geschützt sein soll:**
> "Nur sichtbar wenn `gameFlags.kapitel2Unlocked === true`."

### ✗ Lass das

**Zu offene Fragen:**
> "Mach das Kampfsystem interessanter." → Was genau?

**Implizite Erwartungen:**
> "Und natürlich auch auf Mobile optimieren." → Stand nie im Prompt.

**Widersprüchliche Anforderungen:**
> "Kein Text-Clutter, aber erkläre alles ausführlich." → Entscheide vorher.

---

## Session-Struktur

### Großer Batch vs. Einzelschritte

**Für viele Features auf einmal (dieser Projekt-Stil):**
- Liste alle Features als nummerierte Punkte
- Kennzeichne "Mega-Aufgaben" (komplexe Features) vs. "Kleine Anpassungen"
- Gib an: "Fang mit X an" (Prioritätsreihenfolge)

**Für Einzelkorrekturen:**
- Direkt: "In combat.js Zeile 87: `0.1` zu `0.05` ändern."
- Konkreter Bug-Report: "Wenn HP auf 0 fällt und Kampf endet, wird render() zweimal aufgerufen."

### Commit-Zeitpunkt

Nie mid-session committen. Sag am Ende:
> "Mach jetzt einen Commit mit einer kurzen Beschreibung aller Änderungen."

---

## Umgang mit SKILL.md

Die Datei `.claude/skills/incremental-adventure/SKILL.md` ist das lebende
Gedächtnis des Projekts. Claude liest sie zu Beginn jeder Session.

**Was du hinzufügen solltest:**
- Neue Patterns (z.B. "So funktioniert das Kampfsystem")
- Hartgelernte Bugs (z.B. "render() nie in checkAchievements() aufrufen")
- Design-Entscheidungen, die nicht offensichtlich sind

**Was NICHT rein gehört:**
- Dinge, die im Code stehen (lass den Code sprechen)
- Abgeschlossene Aufgaben (die landen im Commit-Log)

---

## Typische Fallstricke in diesem Projekt

| Problem | Lösung |
|---------|--------|
| Claude macht zu viel auf einmal | Prompt in Phasen aufteilen: "Erst Phase 1, dann fragen ob weiter" |
| Dialoge klingen zu modern/meta | Erinnere: "Kein Spielmeta in Dialogen. Nur was die Figur sagen würde." |
| Feature landet hinter falschem Flag | Explizit sagen: "Nur sichtbar nach [Flag X]" |
| Zu viele Kommentare im Code | Erinnere: "Default: keine Kommentare. Nur wenn das Warum nicht offensichtlich ist." |
| Claude erklärt statt zu tun | "Nicht erklären, direkt implementieren." |

---

## Nützliche Prompt-Snippets

```
"Alles umsetzen, keine Rückfragen."
"Commit erst am Ende der Session."
"Kein Meta-Sprache im Spieltext."
"Hinter gameFlags.X verstecken."
"Wie immer: keine Kommentare außer wenn das Warum nicht offensichtlich ist."
"Syntax-Check nach jeder neuen Datei."
```
