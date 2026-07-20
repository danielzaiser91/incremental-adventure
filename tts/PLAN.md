# TTS-Vertonungsplan — Chroniken des vergessenen Weges

Ziel: Alle spielersichtbaren Texte als Audiodateien vertonen — kostenlos über das
Gemini-Free-Tier, verteilt über mehrere Wochen.

**Status-Übersicht und Aktivitäts-Log in dieser Datei werden nach JEDEM Batch
aktualisiert** (teils automatisch durch `generate-batch.js`, Checkboxen von Hand).

## Qualitäts-Check 19.07.2026 — abgeschlossen, Modellwechsel

User-Feedback nach Anhören der ersten 18 Dateien (Modell `gemini-2.5-flash-
preview-tts`): Vortrag klingt monoton, ohne Gefühl, Stimme nicht konsistent
über verschiedene Aufnahmen hinweg. Nach zwei Prompt-Iterationen (v2 zu
"over the top", v3 als Mittelweg) blieb die 2.5-Flash-Stimme insgesamt zu
schwach — im direkten A/B-Test gegen `gemini-3.1-flash-tts-preview` (gleicher
v3-Style-Prompt) war 3.1 klar besser: hörbar bessere Emotion, Pausen,
Stimmhöhen-Dynamik. User-Urteil: "akzeptabel" (noch nicht perfekt, aber ok).

**Ergebnis: Modellwechsel auf `gemini-3.1-flash-tts-preview`** (siehe
Rahmendaten unten). `story-1-1.wav` ist bereits die 3.1-Version.
Alle 18 zuvor mit 2.5-Flash generierten Dateien wurden gelöscht,
`progress.json` war zwischenzeitlich auf 0/65 zurückgesetzt.

Freigabe-Status: **erteilt** — normaler Batch-Betrieb läuft ab jetzt wieder,
mit dem neuen Modell.

## Rahmendaten

- **Modell: `gemini-3.1-flash-tts-preview`** (Wechsel 19.07.2026, siehe
  Qualitäts-Check oben). Preis lt. Google-Preisseite: $1,00/1 Mio.
  Input-Tokens, $20,00/1 Mio. Audio-Output-Tokens (bezahlt) — Free-Tier-
  Tageslimit für dieses Modell noch nicht empirisch verifiziert (Ablauf wie
  bei 2.5 Flash: das Skript stoppt sauber bei 429 und loggt die Quota-ID,
  daraus ergibt sich der reale Wert beim nächsten Lauf).
- Erzählerstimme: `Iapetus` (alle Ich-Texte: Story, Monologe, Objectives)
- Style-Prompt (v3, "Mitte" zwischen monoton und overacted) in
  `extract-manifest.js` — Konsistenz-Anker + maßvolle Emotions-Dynamik +
  Wortwörtlichkeits-Anweisung (gegen Artikel-/Wort-Drift)
- NPC-Stimmen: pro NPC eine eigene Stimme (Zuordnung in `extract-manifest.js`,
  wird bei Phase 3 festgelegt)
- Audio-Format: 24 kHz PCM → WAV in `tts/output/` (gitignored). Kompression zu
  Opus/MP3 folgt, sobald ffmpeg installiert ist — erst dann kommen Audiodateien
  ins Repo/Spiel.
- Täglicher Ablauf: `node tts/generate-batch.js` — nimmt die nächsten offenen
  Einheiten aus `tts/manifest.json` (Default-Limit vorläufig 30, bis das echte
  Tageslimit von 3.1 Flash TTS bekannt ist), wartet 21 s zwischen Requests
  (3 RPM), stoppt sauber bei 429 (Tageslimit) und loggt unten ins
  Aktivitäts-Log.
- **Automatisiert:** Geplante Aufgabe `tts-daily-batch-incremental-adventure`
  (Claude-Desktop, täglich ~22:00 Uhr) führt den Batch aus, pflegt diese Datei
  und pusht. Läuft nur, wenn die App offen ist — sonst beim nächsten App-Start.

## Meilenstein-Checkliste

- [ ] **Phase 0 — Setup**
  - [x] API-Key in `.env.local` (`GEMINI_API_KEY`)
  - [x] Extraktions-Skript (`extract-manifest.js`) für Story + Skill-Monologe
  - [x] Batch-Skript (`generate-batch.js`) mit Rate-Limit + Progress-Tracking
  - [x] ~~BLOCKER: alter Key Prepay mit 0 Credits~~ — erledigt 17.07.2026,
        12:15 Uhr: neuer Free-Tier-Key vom User, in `.env.local` eingetragen
  - [x] Echtes Free-Tier-Limit für `gemini-2.5-flash-preview-tts` verifiziert:
        **10 Requests/Tag** — Quota-ID `…PerDayPerProjectPerModel-FreeTier`,
        quotaValue 10. Inzwischen irrelevant, siehe Modellwechsel unten.
  - [x] Free-Tier-Limit für `gemini-3.1-flash-tts-preview` verifiziert:
        ebenfalls **10 Requests/Tag** (identische Quota-ID/-Wert wie beim
        alten Modell) — Batch-Default auf 10 zurückgesetzt
  - [ ] ffmpeg installieren → WAV→Opus-Konvertierung ergänzen
  - [ ] Einbau ins Spiel konzipieren (Abspiel-UI, **immer stumm starten** —
        Entstummen nur als bewusste Spieler-Aktion, niemals Autoplay mit Ton)
- [ ] **Phase 1 — Story-Chronik** (36 Einträge, story.js, Kapitel 1→4) — *läuft*
- [ ] **Phase 2 — Skill-Monologe** (22 `learnDialogs`, experience.js)
- [ ] **Phase 3 — Story-kritische NPCs** (~143 Knoten: Sivert 84, Brakka 23,
      Fremder 12, Mira 12, Oswin 12) — Extraktion npc.js noch zu ergänzen
- [ ] **Phase 4 — Neben-NPCs** (~24 Knoten: Korbin 7, Roswald 7, Vorarbeiter,
      Greta, Torben, Straßenkehrer)
- [ ] **Phase 5 — Quests & Objectives** (~186 Kurztexte, quests.js + objective.js)
- [ ] **Phase 6 — Welt-Flavor** (~250 Einheiten: Monster, Orte, Markt,
      Expedition, Pets, Alchemie — vorher kuratieren, `${...}`-Strings auslassen)
- [ ] **Phase 7 — optional: Achievements** (79 Einheiten)

Grobe Zeitschätzung bei 10/Tag (verifiziertes Limit für 3.1 Flash TTS, gleicher
Wert wie zuvor): Phase 1–2 bis ~23.07., Phase 3–4 bis ~12.08., Phase 5 bis
~31.08., Phase 6–7 bis ~Anfang Oktober 2026.

## TODO — Wort-Highlighting-Prototyp, offene Bugs (Test 20.07.2026, 00:23 Uhr)

Manueller Test durch User (nicht Browser-Automation) bei story-1.3 (Schlafplatz,
Nacht, "Die erste Nacht") — **keine Code-Änderungen vorgenommen, nur notiert.**

**Nächster Schritt vor jedem weiteren Test:** Alignment fehlt aktuell für 11 von
13 bereits vertonten Story-Einträgen (nur 1-1 und 1-2 haben `words.json`) —
`tts/align/story-1-1.txt`/`.words.json` und `story-1-2.txt`/`.words.json` sind
die einzigen vorhandenen Beispiele für den Alignment-Workflow (`tts/align/align.py`,
Python-venv in `tts/align/.venv`). Fehlende Einträge:
`story-1-3, story-1-4, story-1-5, story-1-6, story-1-7, story-1-8, story-2-1,
story-2-2, story-2-3, story-2-4, story-2-5`. Für ALLE bereits vorhandenen
`.wav`-Dateien das Alignment nachziehen, BEVOR erneut auf Highlighting/Seek/
Pagination getestet wird — sonst wird wieder ein bereits bekannter
Datenlücken-Zustand als "getestet" durchlaufen, ohne neue Erkenntnis zu liefern.
Dabei auch klären, ob der Alignment-Schritt in `generate-batch.js` künftig
automatisch direkt nach der Audio-Generierung mitläuft (ein manueller
Nachzieh-Schritt pro Batch ist fehleranfällig/vergessbar), statt als
nachgelagerter Extra-Lauf.

- **Kein Wort-Highlighting.** Erwartet für story-1.3: `tts/output/story-1-3.words.json`
  existiert noch nicht (nur 1-1 und 1-2 haben Alignment-Daten, siehe
  `tts/align/`). Vor dem Test bereits als bekannte Lücke angekündigt — sollte
  sich mit dem Alignment-Schritt für 1-3 von selbst lösen. Trotzdem gegenchecken,
  sobald `story-1-3.words.json` existiert (nicht nur annehmen, dass es dann läuft).
- **Audio stoppt nicht nach "erste" (Ende Seite 1), spielt einfach weiter.**
  Vermutlich derselbe Root Cause wie oben: `updateDialogAudio(audioSrc,
  pageStart, pageEnd)` bekommt `pageStart`/`pageEnd` ausschließlich aus den
  Wort-Zeitstempeln (`story.js`, `bindWordHighlight()`/Aufrufer) — ohne
  `words.json` sind beide vermutlich `undefined`. `applySeekNow()` UND
  `scheduleEndPause()` (`dialog.js`) brechen bei `typeof pageStart !== 'number'`
  sofort ab → kein Seitenende-Stopp, kein Seek. Prüfen, ob das tatsächlich der
  Mechanismus ist (durch Vergleich mit story-1-2, das Alignment-Daten hat und
  im automatisierten Test sauber stoppte).
- **"Weiter"-Klick hat keinerlei Effekt auf die laufende Audiowiedergabe**
  (kein Seek, kein Abschneiden) — konsistent mit obigem Verdacht: ohne
  Timestamp-Daten läuft die Datei einfach unabhängig von den Dialogseiten
  durch, statt seitenweise zu pausieren/zu springen.
  - **Zu klären, nicht nur zu fixen:** Ist das akzeptables Fallback-Verhalten
    für Einträge OHNE Alignment-Daten (Audio läuft einfach durch, unabhängig
    von Text-Pagination), oder sollte die Audio-Steuerung bei fehlenden
    Timestamps besser ganz versteckt bleiben, bis das Alignment nachgezogen
    ist? Aktuell wirkt es für den Spieler wie ein kaputter, nicht wie ein
    fehlender Feature-Zustand.
- **UX: letzter "Weiter"-Button einer Dialogseiten-Serie sollte anders
  beschriftet sein** als die Zwischen-Seiten, um anzuzeigen, dass der Klick
  den Dialog schließt (z.B. "Schließen"/"Verstanden" statt erneut "Weiter").
  Betrifft `showPaginatedDialog()`/`showMonologue()`/`showStoryEntryDialog()`
  (`dialog.js`/`story.js`) — letzte Seite müsste ihren Button-Text separat
  setzen können.

## Aktivitäts-Log

<!-- generate-batch.js hängt hier automatisch Zeilen an — Format:
- DD.MM.YYYY HH:MM — Batch N: X Dateien (IDs …), Y s Audio, Status -->
- 17.07.2026 12:03 — Batch 1 abgebrochen: 0 Dateien. Key ist Prepay mit 0 Credits → kein Free Tier (siehe BLOCKER in Phase 0). Gesamt: 0/65 im Manifest.
- 17.07.2026 12:26 — Batch: 10 Dateien (story-1-1 … story-2-2), 993 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 10/65 im Manifest.
- 17.07.2026 12:30 — Neuer Free-Tier-Key aktiv, Limit verifiziert (10/Tag). story-1-3 unplausibel (655 s statt ~42 s, Großteil Stille) → zur Neu-Generierung markiert; Plausibilitätsprüfung ins Batch-Skript eingebaut. Sauberer Stand: 9/65.
- 19.07.2026 15:52 — Batch: 9 Dateien (story-1-3 [Neuversuch, diesmal plausibel], story-2-3…story-2-7, story-3-0, story-3-1, story-3-3), 357 s Audio, Tageslimit erreicht (10 Requests). story-3-2 unplausibel (84,1 s statt ~16 s) → zur Neu-Generierung markiert. Gesamt: 18/65 im Manifest.
- 19.07.2026 15:57 — QUALITÄTS-SPERRE: User-Feedback (monoton, keine Konsistenz der Stimme) → alle 18 Audiodateien gelöscht, progress.json auf 0/65 zurückgesetzt, Stil-Prompt überarbeitet (Konsistenz-Anker + Emotions-/Tempo-Dynamik), `--only`-Flag in generate-batch.js ergänzt. Nächster Schritt: story-1-1 als Hörprobe generieren, sobald Kontingent verfügbar. Kein normaler Batch bis Freigabe.
- 19.07.2026 16:03 — Batch: 1 Dateien (story-1-1 … story-1-1), 25 s Audio, komplett. Gesamt: 1/65 im Manifest.
- 19.07.2026 16:13 — Batch: 1 Dateien (story-1-1 … story-1-1), 27 s Audio, komplett. Gesamt: 1/65 im Manifest.
- 19.07.2026 16:15 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 1/65 im Manifest.
- 19.07.2026 16:16 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 1/65 im Manifest.
- 19.07.2026 16:34 — Batch: 10 Dateien (story-1-2 … story-2-3), 419 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 11/65 im Manifest.
- 19.07.2026 22:20 — Batch: 2 Dateien (story-2-4 … story-2-5), 66 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 13/65 im Manifest.
- 20.07.2026 22:16 — Batch: 9 Dateien (story-2-6 … story-3-7), 318 s Audio, komplett. Gesamt: 22/65 im Manifest.
- 20.07.2026 22:30 — Batch: 1 Dateien (story-3-6 … story-3-6), 27 s Audio, komplett. Gesamt: 23/65 im Manifest.
- 20.07.2026 22:30 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 23/65 im Manifest.
