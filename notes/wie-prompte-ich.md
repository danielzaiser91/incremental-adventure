# Wie prompte ich Claude Code richtig?
## Leitfaden für dieses Projekt

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
