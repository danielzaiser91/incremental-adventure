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
  Input-Tokens, $20,00/1 Mio. Audio-Output-Tokens (bezahlt). Free-Tier-
  Tageslimit verifiziert: **10 Requests/Tag**. **Jeder Request zählt — auch
  fehlgeschlagene.** Belegt für HTTP 503 (28.07.2026), Leerantworten
  (`finishReason: OTHER`, 31.07.2026) und zuletzt **HTTP 400** (03.08.2026:
  6 OK + 4× 400 = 10 Requests, der elfte lief sofort ins 429 — die frühere
  Notiz „HTTP 400 verbraucht keine Quota" ist damit widerlegt).
  **Wichtig (07.08.2026): HTTP 400 wird VOR der Quota-Prüfung zurückgegeben.**
  Ein Retry, der 400 statt 429 liefert, beweist also NICHT, dass noch Quota
  übrig ist — nur ein Request, der die Validierung passiert, zeigt den echten
  Quota-Stand. Zum Prüfen des Tagesstands daher immer eine unauffällige,
  bisher fehlerfreie Einheit verwenden. Konsequenz:
  Same-Day-Retry nach einem Fehlschlag nur, solange die Tagessumme aller
  Requests unter 10 liegt (siehe Aktivitäts-Log) — praktisch also fast nie,
  weil das Batch-Skript bis 10 Requests durchläuft.
- **HTTP 400 ist transient, nicht einheitsspezifisch (09.08.2026 belegt).**
  `npc-vorarbeiter-praiseFarewell` (3× 400, davon einmal bei leerer Quota) und
  `npc-kommandant-kampfRoutineOffer` liefen unverändert durch — ohne jede
  Textänderung. Die Vermutung „400 bei leerer Quota ⇒ Fehler steckt im Text"
  (Log 07.08.) ist damit widerlegt: Da 400 vor der Quota-Prüfung greift, sagt
  ein 400 bei leerer Quota **nichts** über die Ursache aus, es beweist nur, dass
  die Validierung zuerst läuft. Konsequenz: 400er-Einheiten gehören **nicht** in
  `SKIP_IDS` — sie kosten zwar einen Tages-Slot, holen sich aber irgendwann
  selbst. Reproduzierbare Leerantworten (`finishReason: OTHER`) rechtfertigten
  bis 22.08.2026 einen SKIP-Eintrag — **auch das ist überholt:** Der
  Stil-Override hat `npc-fremder-finaleDialog` nach 4 Leerantworten auf Anhieb
  gelöst (22.08., siehe Log). Der Persona-Stil-Prompt ist damit Auslöser
  **beider** Dauer-Fehlerbilder, 400 wie Leerantwort; `SKIP_IDS` braucht es
  vor einem Override-Versuch nicht mehr.
  **Ausnahme — hartnäckige 400er sind eine Stil-Text-Wechselwirkung
  (14.08.2026 an zwei Fällen belegt).** Scheitert ein NPC-Knoten *dauerhaft*
  mit 400 (Greta `turnIn`: 9×, Mira `greet`: 3×), liegt es weder am Text noch
  an der Stimme, sondern am **Persona-Stil-Prompt aus `NPC_PROFILES` in
  Kombination mit genau diesem Knotentext** — Nachbarknoten desselben NPC mit
  demselben Prompt-Aufbau laufen durch. **Rezept:** Bei leerer Tagesquota zwei
  kostenlose Sonden (`tts/probe.js <id>` und `… --narrator-style`, Stimme
  unverändert); 400 → 429 im Vergleich beweist den Stil als Auslöser. Fix ist
  ein Eintrag in `TTS_STYLE_OVERRIDES` (`extract-manifest.js`) auf
  `NARRATOR_STYLE` und Streichung aus `SKIP_IDS`. Nicht funktioniert hat in
  beiden Fällen das Naheliegende: umformulierte Persona-Rollenzeile (erneut
  400) und Ersatztext (`TTS_TEXT_OVERRIDES` — zusätzlich schädlich fürs
  Wort-Highlighting, das gegen den ANGEZEIGTEN Spieltext ausrichtet). Preis
  des Fixes: Der Knoten klingt neutraler als die übrigen Knoten desselben NPC
  (Stimme bleibt gleich, Spielweise wird zur Erzählerstimme) → Hörprobe.
- Erzählerstimme: `Iapetus` (alle Ich-Texte: Story, Monologe, Objectives)
- Style-Prompt (v3, "Mitte" zwischen monoton und overacted) in
  `extract-manifest.js` — Konsistenz-Anker + maßvolle Emotions-Dynamik +
  Wortwörtlichkeits-Anweisung (gegen Artikel-/Wort-Drift)
- NPC-Stimmen: pro NPC eine feste eigene Stimme, Zuordnung + Persona-Prompt in
  `NPC_PROFILES` (`extract-manifest.js`), festgelegt 26.07.2026 — Sivert
  `Charon`, Brakka `Algenib`, Fremder `Enceladus`, Mira `Aoede`, Oswin `Orus`;
  Phase 4 vorbereitet: Korbin `Umbriel`, Roswald `Alnilam`, Vorarbeiter
  `Gacrux`, Greta `Despina`, Torben `Rasalgethi`, Straßenkehrer
  `Zubenelgenubi`. Stimmen nie nachträglich ändern (sonst klingt derselbe
  Charakter zwischen zwei Knoten wie zwei Personen). NPC-Knoten mischen
  Regie-Sätze und wörtliche Rede — beides spricht die NPC-Stimme, `Iapetus`
  bleibt dem Erzähler vorbehalten.
- Audio-Format & Verzeichnisse (seit 12.08.2026): `tts/output/` ist die
  gitignorierte Werkstatt (WAV + `output/opus/` + words.json, alles von
  `generate-batch.js` automatisch erzeugt). Veröffentlicht wird über
  `tts/publish-audio.js` nach `tts/audio/` (committed, Opus 32 kbps +
  words.json) — nur Einheiten, die BEIDES haben; daraus lädt das Spiel.
- Täglicher Ablauf: `node tts/generate-batch.js` — nimmt die nächsten offenen
  Einheiten aus `tts/manifest.json` (Default-Limit 10 = Tageslimit),
  wartet 21 s zwischen Requests
  (3 RPM), stoppt sauber bei 429 (Tageslimit) und loggt unten ins
  Aktivitäts-Log.
- **Automatisiert:** Geplante Aufgabe `tts-daily-batch-incremental-adventure`
  (Claude-Desktop, täglich ~22:00 Uhr) führt den Batch aus, pflegt diese Datei
  und pusht. Läuft nur, wenn die App offen ist — sonst beim nächsten App-Start.
- **Umgebungs-Stolperfalle im Bash-Werkzeug (10.08.2026):** Dort fehlen `node`
  und die Kernwerkzeuge im PATH, und `git push` stirbt still mit Exit 128, weil
  die Credential-Helper nicht anlaufen. Rezept (PATH-Export + `GIT_ASKPASS`-Bat
  mit `gh auth token`) steht in Kategorie 1 von
  `C:\code\ai\ai helper files\ai_agent_learnings.md`.

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
  - [x] WAV→Opus-Konvertierung — **umgesetzt 12.08.2026:** alle 163 Bestands-
        WAVs nach `output/opus/` konvertiert (14 MB gesamt, 32 kbps voip);
        `generate-batch.js` erledigt Opus + Alignment seit heute automatisch
        pro neuer Einheit (`postProcess()`). ffmpeg ist in
        `ai_agent_tools.md` dokumentiert.
  - [x] Einbau ins Spiel — **Entscheidung 12.08.2026 (Daniel): direkt
        umsetzen.** Umsetzungsstand: Story-Audio lädt jetzt aus dem
        committeten `tts/audio/` (Opus + words.json, befüllt über
        `tts/publish-audio.js`); die Audio-UI erscheint NUR bei Einträgen
        mit Wort-Timing (Fallback-Frage damit entschieden; verifiziert per
        `test/story-audio-gating.js`). Offen bis zum Abhaken: Alignment-
        Backlog fertig → restliche Paare veröffentlichen → Minor-Release
        v0.23.0 mit pending-patchnotes (Discord-Freigabe durch Daniel laut
        Release-Checkliste). **Abgehakt 15.08.2026:** alle drei Bedingungen
        erfüllt — v0.23.0 ist draußen (Spielstand heute 0.23.2-alpha), und
        alle 199 vertonten Einheiten liegen als vollständiges Paar in
        `tts/audio/` (0 mangels Wort-Timing zurückgehalten). Neue Einheiten
        werden ab jetzt im laufenden Batch-Betrieb mitveröffentlicht.
- [x] **Phase 1 — Story-Chronik** (36 Einträge, story.js, Kapitel 1→4) — *komplett (23.07.2026)*
- [x] **Phase 2 — Skill-Monologe** (29 `learnDialogs`, experience.js) — *komplett (26.07.2026)*
- [x] **Phase 3 — Story-kritische NPCs** (65 Knoten: Brakka 23, Mira 12,
      Oswin 12, Fremder 12, Sivert 6) — *komplett 65/65 (22.08.2026)*
      (zwei zeitweise blockierte Knoten, beide inzwischen vertont:
      `npc-mira-greet` — 3× HTTP 400 „invalid argument", und
      `npc-fremder-finaleDialog` — 3× Leerantwort `finishReason: OTHER`.
      **Stand 15.08.2026:** `npc-mira-greet` ist vertont — die Sonden vom
      14.08. zeigten Original-Stil → 400, Erzähler-Stil bei unveränderter
      Stimme Aoede → 429; mit dem daraufhin gesetzten Stil-Override lief der
      Knoten am 15.08. als erste Einheit des Batches auf Anhieb mit HTTP 200
      durch. Damit derselbe Mechanismus und derselbe Fix wie bei
      `npc-greta-turnIn`: der Persona-Stil-Prompt ist der Auslöser, nicht der
      Text. (Hörprobe zurückgestellt, siehe unten.)
      `npc-fremder-finaleDialog` (4× Leerantwort `finishReason: OTHER`, für
      die die Sonde nichts hergibt: sie passiert die Validierung und liefert
      bei leerer Quota nur ein 429) stand vom 07.08. bis 22.08.2026 in
      `SKIP_IDS`. Mit dem am 22.08. gesetzten Stil-Override lief er am selben
      Abend als erste Einheit des Batches mit HTTP 200 durch — damit ist der
      Override auch für den Leerantwort-Fehlermodus belegt, nicht nur für 400.
      `SKIP_IDS` ist leer, `progress.json` führt keine fehlgeschlagene
      Einheit mehr).
      Extraktion aus npc.js ist in `extract-manifest.js` ergänzt; die frühere
      Schätzung „~143 Knoten, Sivert 84" war falsch (Zeilen statt Knoten
      gezählt). Ausgelassen: `oswin.business` (dynamischer Text als Funktion,
      hängt vom Spielstand ab → nicht statisch vertonbar).
- [x] **Phase 4 — Neben-NPCs** (24 statische Knoten: Korbin 7, Roswald 7,
      Greta 3, Vorarbeiter 3, Torben 3, Straßenkehrer 1 — je ein dynamischer
      Knoten bei Roswald und Greta fällt weg) — *komplett 24/24 (14.08.2026)*.
      Der letzte offene Knoten `npc-greta-turnIn` (9 HTTP 400 in Folge über
      6 Tage) lief am 14.08.2026, 08:20 Uhr mit dem am 12.08. eingebauten
      Stil-Override (`TTS_STYLE_OVERRIDES` → `NARRATOR_STYLE`, Stimme Despina
      unverändert) auf Anhieb mit HTTP 200 durch. (Hörprobe zurückgestellt,
      siehe unten — klingt Greta in `turnIn` neben `offer`/`idle` irgendwann
      zu neutral, ist der nächste Hebel eine Umformulierung des KNOTENTEXTES
      in `script/npc.js` mit der Dialog-KI, kein weiterer Prompt-Versuch.)
      `ACTIVE_NPC_PHASES` steht auf `{3, 4}`.
- [ ] **Phase 5 — Quests & Objectives** (177 Kurztexte) — *ab 09.08.2026 im
      Manifest*: 139 Quest-Beschreibungen (`descByState` aus quests.js, ein
      Eintrag pro Zustand, ID `quest-<questId>-<state>`) + 38 Zieltexte aus
      `getObjectiveText()` (objective.js). Beides Ich-Perspektive → Erzähler-
      stimme Iapetus. Objective-IDs sind ein Kurz-Hash des Textes
      (`objective-<sha1[0..8]>`), weil es dort keinen stabilen Schlüssel gibt.
      Ausgelassen: 7 Quest-Zustände mit Funktions-Text (`gildePruefung.active`,
      `brennenderMut.active`, `wissensdurst10.active`, `lethkarMarkt.active`,
      `gildeSchulden.active`, `bruderschaftBeweis.active`,
      `archivRecherche.active`), das Template-Literal in `getObjectiveText()`
      (Mut-Zähler) und `getExplicitGoalText()` (reine Funktionslabels/Zahlen).
      Manifest umfasst damit 331 Einheiten. *Stand 24.08.2026 (Nachtlauf):
      125/177 (Quests 125/139, Objectives 0/38).*
- [ ] **Phase 6 — Welt-Flavor** (~250 Einheiten: Monster, Orte, Markt,
      Expedition, Pets, Alchemie — vorher kuratieren, `${...}`-Strings auslassen)
- ~~**Phase 7 — Achievements** (79 Einheiten)~~ — **gestrichen 12.08.2026**
      (Entscheidung Daniel: Achievements liest man eher, als dass man sie
      hört; der Plan endet mit Phase 6)

Grobe Zeitschätzung bei 10/Tag (Stand 26.07.2026, nach Korrektur der
Phase-3-Knotenzahl von ~143 auf 65): Phase 1–2 erledigt, Phase 3 bis ~02.08.,
Phase 4 bis ~05.08., Phase 5 bis ~24.08., Phase 6–7 bis ~Ende September 2026.

## Zurückgestellt — kein aktives Todo (Entscheidung Daniel, 22.08.2026)

Daniel: „ich will nichts gegenhören, es soll einfach nur alles vertont werden,
todos können raus, irgendwann kommt die probe und feedback, aber erstmal nicht
als aktives todo." Diese drei Punkte stehen deshalb hier und **nicht** mehr im
Footer oder in der Meilenstein-Checkliste. Sie kommen zurück, wenn er von sich
aus eine Hörrunde ansetzt:

- Hörprobe der zwei Ausnahme-Aufnahmen (Greta `turnIn`, Mira `greet`) — Stimme
  jeweils unverändert, Spielweise durch den Stil-Override neutraler.
- Gegencheck des Wort-Highlightings im laufenden Spiel (Hervorhebung, Seek,
  Seitenende-Stopp), jetzt wo Audio aus `tts/audio/` geladen wird.
- Allgemeine Qualitätsrunde über den vertonten Bestand.

Bis dahin gilt: Der Batch läuft durch, alles wird vertont, nichts wartet auf
eine Freigabe.

## TODO — Wort-Highlighting-Prototyp, offene Bugs (Test 20.07.2026, 00:23 Uhr)

**Stand 12.08.2026 — Großteil erledigt:** Alignment-Rückstand läuft seit heute
als Backlog-Lauf (`align_all.py`, Idle-Priorität) und ist ins Batch-Skript
integriert (kein manueller Nachzieh-Schritt mehr). Die Fallback-Frage ist
entschieden und umgesetzt: keine Audio-UI ohne Wort-Timing. Der letzte
„Weiter"-Button heißt jetzt „Schließen" (v0.22.10). Aus diesem Abschnitt steht
nur noch der Gegencheck des Wort-Highlightings per Hör-Test aus — und der ist
seit 22.08.2026 zurückgestellt (siehe Abschnitt darüber).

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
- 22.07.2026 12:47 — Batch: 9 Dateien (story-3-9 … story-4-7), 320 s Audio, komplett. Gesamt: 32/65 im Manifest.
- 22.07.2026 12:47 — Batch: 1 Dateien (story-3-8 … story-3-8), 37 s Audio, komplett. Gesamt: 33/65 im Manifest.
- 22.07.2026 22:10 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 33/65 im Manifest.
- 23.07.2026 22:16 — Batch: 10 Dateien (story-4-8 … skill-sleepLikeARock), 268 s Audio, komplett. Gesamt: 43/65 im Manifest.
- 25.07.2026 00:30 — Batch: 10 Dateien (skill-thrift-l1 … skill-quickLearner-l1), 189 s Audio, komplett. Gesamt: 53/65 im Manifest.
- 25.07.2026 22:14 — Batch: 9 Dateien (skill-quickLearner-l2 … skill-instinkt), 187 s Audio, komplett. Gesamt: 62/65 im Manifest.
- 25.07.2026 22:15 — Batch: 1 Dateien (skill-quickLearner-l4 … skill-quickLearner-l4), 10 s Audio, komplett. Gesamt: 63/65 im Manifest.
- 26.07.2026 22:11 — Batch: 2 Dateien (skill-kaltbluetig … skill-unzerstoerbar), 39 s Audio, komplett. Gesamt: 65/65 im Manifest.
- 26.07.2026 22:18 — Batch: 7 Dateien (npc-mira-drink … npc-mira-letterDelivered), 92 s Audio, komplett. Gesamt: 72/130 im Manifest.
- 26.07.2026 22:18 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 72/130 im Manifest.
- 26.07.2026 22:20 — Phasen 1+2 abgeschlossen (65/65). Manifest um Phase 3 erweitert (NPC-Dialogknoten aus npc.js, 65 Einheiten, feste Stimme + Persona pro NPC) → 130 Einheiten gesamt. OFFEN: `npc-mira-greet` scheitert reproduzierbar (2×) mit HTTP 400 „Request contains an invalid argument" — kein Quota-/Billing-Fehler, Text ist unauffällig (96 Zeichen, nur Umlaute als Nicht-ASCII), identische Request-Struktur wie die 7 erfolgreichen Mira-Knoten desselben Laufs. Steht in progress.json unter „failed", nächster Batch versucht es automatisch erneut; falls es erneut scheitert, gezielt untersuchen (Verdacht: inhaltlicher Filter auf dieser Textkombination).
- 27.07.2026 22:15 — Batch: 9 Dateien (npc-mira-detectiveAsk … npc-oswin-greet), 168 s Audio, komplett. Gesamt: 81/130 im Manifest.
- 27.07.2026 22:16 — Batch: 1 Dateien (npc-oswin-houseOffer … npc-oswin-houseOffer), 41 s Audio, komplett. Gesamt: 82/130 im Manifest.
- 27.07.2026 22:17 — `npc-mira-greet` scheitert weiterhin (3. Versuch, gleicher HTTP 400 „Request contains an invalid argument") — kein Quota-/Billing-Fehler, verbraucht keine Quota. Ab jetzt nicht mehr blind im Batch wiederholen, sondern gezielt untersuchen (Verdacht: inhaltlicher Filter / Zeichenkombination im Text dieses Knotens). Tagesausbeute trotzdem voll: 10 erfolgreiche Generierungen.
- 28.07.2026 22:15 — Batch: 9 Dateien (npc-oswin-greetHomeOwner … npc-brakka-explain), 194 s Audio, komplett. Gesamt: 91/130 im Manifest.
- 28.07.2026 22:16 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 91/130 im Manifest.
- 28.07.2026 22:17 — Zwei Erkenntnisse aus dem Lauf: (1) `SKIP_IDS` in `generate-batch.js` ergänzt — `npc-mira-greet` läuft nicht mehr blind im Batch mit, weil es sonst einen der 10 Slots blockiert (mit `--only` weiterhin gezielt testbar). (2) **HTTP 503 verbraucht Quota.** `npc-oswin-houseBought` scheiterte als erster Request des Batches mit 503 („model experiencing high demand"); der anschließende Einzel-Retry lief sofort in ein echtes 429 mit quotaValue 10 — 9 erfolgreiche + 1× 503 = 10 verbrauchte Requests. Anders als Leerantworten (`finishReason: OTHER`) darf ein 503 also NICHT als kostenloser Fehlschlag behandelt und am selben Tag nachgeholt werden. `npc-oswin-houseBought` steht in „failed" (429) und wird morgen automatisch mitgenommen.
- 29.07.2026 22:15 — Batch: 10 Dateien (npc-oswin-houseBought … npc-brakka-brakkaWarum), 186 s Audio, komplett. Gesamt: 101/130 im Manifest.
- 31.07.2026 03:58 — Batch: 10 Dateien (npc-brakka-gildeDetails … npc-brakka-whyMiraSent), 290 s Audio, komplett. Gesamt: 111/130 im Manifest.
- 31.07.2026 22:15 — Batch: 7 Dateien (npc-fremder-greet … npc-fremder-postConfrontation), 140 s Audio, komplett. Gesamt: 118/130 im Manifest.
- 31.07.2026 22:16 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 118/130 im Manifest.
- 31.07.2026 22:17 — **Widerspruch zur bisherigen Quota-Annahme:** Der Lauf bestand aus genau 10 Requests (7 OK, 2 Leerantworten `finishReason: OTHER` bei `npc-fremder-cryptic` und `npc-fremder-fremderGeheimnisCue`, 1× HTTP 503 bei `npc-fremder-identityReveal`). Der anschließende Same-Day-Retry von `npc-fremder-cryptic` lief sofort in ein echtes 429 (quotaValue 10). Damit zählen offenbar **alle Requests** gegen das Tageslimit — auch Leerantworten, entgegen der bisher notierten Regel „`OTHER` verbraucht keine Quota" (Stand 20.07.2026). Ab dem nächsten Lauf gilt daher: nach einer Leerantwort höchstens EIN Retry, und nur solange die Summe aller Requests des Tages unter 10 liegt. Die drei Fehlschläge stehen in „failed" und werden morgen automatisch mitgenommen.
- 01.08.2026 22:15 — Batch: 8 Dateien (npc-fremder-fremderGeheimnisCue … npc-sivert-profiDone), 177 s Audio, komplett. Gesamt: 126/130 im Manifest.
- 02.08.2026 22:11 — Batch: 2 Dateien (npc-fremder-cryptic … npc-sivert-masterDone), 33 s Audio, komplett. Gesamt: 128/130 im Manifest.
- 02.08.2026 22:12 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 128/130 im Manifest.
- 02.08.2026 23:46 — Batch: 6 Dateien (npc-wirt-jobAdvice … npc-wirt-chapter2greet), 111 s Audio, komplett. Gesamt: 134/154 im Manifest.
- 02.08.2026 23:50 — Tagesbilanz: 10 Requests (8 OK, 2 Leerantworten). `npc-fremder-finaleDialog` liefert jetzt zum **3. Mal** `finishReason: OTHER` ohne Audio (410 Zeichen, Enceladus-Stimme) — wie `npc-mira-greet` (3× HTTP 400) ab jetzt nicht mehr blind im Batch mitschleifen, sondern gezielt untersuchen (Textkürzung/Umformulierung testen). Phase 3 damit als abgeschlossen markiert (63/65, 2 dauerhaft blockiert). Manifest um **Phase 4** erweitert (`ACTIVE_NPC_PHASES = {3, 4}`, +24 Neben-NPC-Knoten → 154 gesamt); ausgelassen mangels statischem text-Array: `oswin.business`, `greta.reminder`, `greta.petCatch`, `kommandant.recruit`.
- 03.08.2026 22:15 — Batch: 6 Dateien (npc-wirt-chapter2idle … npc-kommandant-recruitAccepted), 97 s Audio, komplett. Gesamt: 140/154 im Manifest.
- 03.08.2026 22:15 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 140/154 im Manifest.
- 04.08.2026 00:15 — **Widerlegt: HTTP 400 verbraucht doch Quota.** Tagesbilanz 03.08.: 6 OK + 4× HTTP 400 „Request contains an invalid argument" = 10 Requests; der Same-Day-Retry von `npc-vorarbeiter-praiseFarewell` (Request 11) lief sofort ins 429 mit quotaValue 10. Die Rahmendaten-Notiz „HTTP 400 verbraucht keine Quota" ist damit korrigiert — es zählt jeder Request, unabhängig vom Ausgang. Neu in „failed": `npc-vorarbeiter-praiseFarewell`, `npc-greta-turnIn`, `npc-kommandant-offer`, `npc-kommandant-recruitDeclined`. Auffällig: 400er traten bis gestern nur bei einem einzigen Knoten (`npc-mira-greet`) auf, heute bei vier auf einmal quer über drei NPCs/Stimmen (Gacrux, Despina, Alnilam) — die Texte sind unauffällig (Regie-Satz + wörtliche Rede, 54–330 Zeichen), erfolgreiche Knoten desselben Laufs sehen strukturell identisch aus. Verdacht daher eher API-seitige Änderung/Instabilität als Inhaltsfilter. Ein Retry-Durchgang am nächsten Tag zeigt, ob es transient war; erst bei erneutem Scheitern gezielt untersuchen.
- 07.08.2026 18:22 — Batch: 5 Dateien (npc-kommandant-recruitDeclined … npc-strassenkehrer-greet), 91 s Audio, komplett. Gesamt: 145/154 im Manifest.
- 07.08.2026 18:23 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 145/154 im Manifest.
- 07.08.2026 18:23 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 145/154 im Manifest.
- 07.08.2026 18:25 — Tagesbilanz: 12 Requests (5 OK, 3× HTTP 400, 2× HTTP 503, 1× Leerantwort `OTHER`, 1× 429). **Neue Erkenntnis: HTTP 400 wird vor der Quota-Prüfung ausgewertet.** Der Same-Day-Retry von `npc-greta-turnIn` lieferte 400 statt 429 — das sah nach freier Quota aus, war aber keine; der anschließende Probe-Request mit einer unauffälligen Einheit (`npc-torben-willkommen`) lief sofort ins 429 mit quotaValue 10. Merksatz: Quota-Stand nur mit einer bisher fehlerfreien Einheit prüfen, nie mit einer 400er-Einheit. Weiterer Beleg gegen die Inhaltsfilter-These: `npc-greta-turnIn` lieferte im Batch 503 und beim Retry 400 — derselbe Text, zwei verschiedene Fehler → API-seitige Instabilität. `npc-fremder-finaleDialog` scheiterte zum **4. Mal** mit `finishReason: OTHER` und ist jetzt wie `npc-mira-greet` in `SKIP_IDS` aufgenommen, damit es keinen Tages-Slot mehr verbrennt (mit `--only` weiterhin testbar).
- 07.08.2026 22:11 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 145/154 im Manifest.
- 07.08.2026 22:12 — Zweiter Lauf desselben Tages (geplante Aufgabe um 22:10, Quota war seit 18:22 erschöpft): 0 neue Dateien, erwartungsgemäß. **Nebenbefund mit Erkenntniswert:** Die beiden ersten Einheiten des Laufs, `npc-vorarbeiter-praiseFarewell` und `npc-greta-turnIn`, lieferten bei *nachweislich leerer Quota* erneut HTTP 400 — erst die dritte Einheit (`npc-kommandant-offer`) bekam das 429. Das bestätigt die Regel „400 wird vor der Quota-Prüfung ausgewertet" ein zweites Mal und erlaubt zugleich einen kostenlosen Test: Da diese beiden Knoten auch quotafrei mit 400 scheitern (jeweils 3. Fehlschlag in Folge), ist ihr Fehler **nicht** transiente API-Last, sondern einheitsspezifisch — dieselbe Signatur wie `npc-mira-greet`. Nächster Schritt für diese beiden: gezielte Textuntersuchung (Kürzen/Umformulieren, dann `--only`), nicht weitere Blind-Retries. Praktischer Nutzen: 400er-Kandidaten lassen sich an einem Tag mit erschöpfter Quota gratis prüfen.
- 09.08.2026 02:06 — Batch: 4 Dateien (npc-vorarbeiter-praiseFarewell … npc-torben-idle), 79 s Audio, komplett. Gesamt: 149/154 im Manifest.
- 09.08.2026 02:06 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 149/154 im Manifest.
- 09.08.2026 02:07 — Batch: 1 Dateien (npc-kommandant-kampfRoutineOffer … npc-kommandant-kampfRoutineOffer), 20 s Audio, komplett. Gesamt: 150/154 im Manifest.
- 09.08.2026 02:07 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 150/154 im Manifest.
- 09.08.2026 02:12 — Tagesbilanz: 10 Requests (5 OK, 5× HTTP 400), Quota damit ausgeschöpft, kein 429 mehr provoziert. **Widerlegt: HTTP 400 ist doch transient.** `npc-vorarbeiter-praiseFarewell` lief als erste Einheit des Batches problemlos durch — dieselbe Einheit, die am 07.08. bei nachweislich leerer Quota mit 400 scheiterte und daraufhin als „einheitsspezifisch" eingestuft wurde. Ebenso `npc-kommandant-kampfRoutineOffer` beim ersten Retry. Beide Texte sind unverändert. Der Trugschluss vom 07.08. lag darin, aus „400 auch ohne Quota" auf eine Textursache zu schließen — 400 wird schlicht vor der Quota-Prüfung ausgewertet und sagt über die Ursache nichts. Konsequenz in den Rahmendaten festgehalten: 400er kommen **nicht** in `SKIP_IDS`, nur wiederholte Leerantworten. Restlich offen: `npc-greta-turnIn` (5. 400) und `npc-kommandant-offer` (4. 400) — beide bleiben im normalen Batch. Da diese zwei allein die Tagesquota nicht füllen, wurde das Manifest um **Phase 5** erweitert (177 Einheiten: 139 Quest-Beschreibungen + 38 Zieltexte) → 331 Einheiten gesamt, damit morgen wieder 10 Slots nutzbar sind. **Nebenbefund:** ffmpeg ist inzwischen installiert und im PATH (`Gyan.FFmpeg` via winget) — der Phase-0-Punkt „WAV→Opus-Konvertierung" ist damit nicht mehr blockiert.
- 10.08.2026 22:59 — Batch: 9 Dateien (npc-kommandant-offer … quest-miraLetter-rewarded), 68 s Audio, komplett. Gesamt: 159/331 im Manifest.
- 10.08.2026 23:02 — Tagesbilanz: 10 Requests (9 OK, 1× HTTP 400), Quota damit ausgeschöpft, kein 429 provoziert, kein Same-Day-Retry (Leerantworten gab es keine). **Phase 5 hat begonnen** — die ersten 8 Quest-Beschreibungen (`quest-nightWatch-*`, `quest-miraLetter-*`) sind vertont. `npc-kommandant-offer` lief nach 4 vorherigen 400ern unverändert durch und bestätigt damit erneut, dass HTTP 400 transient ist. Einziger Rest aus Phase 4: `npc-greta-turnIn` (jetzt 6. 400 in Folge) — bleibt im normalen Batch, aber der Knoten ist damit der hartnäckigste 400er-Fall; falls er auch nach zwei weiteren Läufen nicht durchgeht, gezielt per Textkürzung untersuchen statt weiter blind mitzuschleifen.
- 12.08.2026 13:15 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 163/331 im Manifest.
- 12.08.2026 13:16 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 163/331 im Manifest.
- 12.08.2026 13:35 — Manueller Arbeitsblock (Session): npc-greta-turnIn 7.+8. HTTP 400 (auch mit Textvariante) → SKIP_IDS + probe.js-Diagnostik an die Nacht-Routine übergeben. Opus-Pipeline + Auto-Alignment in generate-batch.js integriert, 163 Bestands-WAVs konvertiert. v0.22.10 released (Dialog-Button „Schließen“). Einbau-Entscheidung Daniel: direkt umsetzen — Spiel lädt aus tts/audio/ (56 Paare veröffentlicht), Audio-UI nur mit Wort-Timing. Phase 7 gestrichen. Alignment-Backlog läuft. 2 Quota-Slots verbraucht, 8 für die Nacht-Routine übrig.
- 12.08.2026 22:15 — Batch: 8 Dateien (quest-kraemerinBusiness-invited … quest-commanderTraining-active), 40 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 171/331 im Manifest.
- 12.08.2026 22:16 — `publish-audio.js`: 8 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 8 Einheiten fehlerfrei.
- 12.08.2026 22:19 — **Diagnostik `npc-greta-turnIn` aufgeklärt (Sonde 1 von 4 reichte).** `node tts/probe.js npc-greta-turnIn --narrator-style` (Stimme Despina unverändert, nur Stil getauscht) lieferte **HTTP 200 mit Audio** — der Knoten ist damit generierbar. Ergebnis: Weder Text noch Stimme lösen die 8 HTTP 400 aus, sondern der **Greta-Persona-Stil-Prompt** aus `NPC_PROFILES`. Die restlichen drei Sonden entfielen planmäßig, weil ein 200 einen Quota-Slot kostet. **Nebenbefund zur Quota:** Die Sonde war der 12. Request des Tages und lief NACH einem echten 429 (Request 11) trotzdem durch — die Tagesgrenze von 10 ist also nicht hart, das 429 kam mit `retryDelay: 18s`. Nicht überinterpretieren, aber im Blick behalten. Nächster Schritt für den Knoten: Greta-Stil-Prompt umformulieren (Verdacht: der Rollensatz „geschäftstüchtige, freundliche Krämerin …" in Kombination mit dem Regie-/Rede-Absatz), dann aus `SKIP_IDS` nehmen und regulär mitlaufen lassen — keine weiteren Blind-Retries.
- 12.08.2026 23:03 — Batch: 0 Dateien (– … –), 0 s Audio, komplett. Gesamt: 171/331 im Manifest.
- 12.08.2026 23:04 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 171/331 im Manifest.
- 12.08.2026 23:05 — Batch: 0 Dateien (– … –), 0 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 171/331 im Manifest.
- 12.08.2026 23:05 — **Greta-Fix vorbereitet, Hörprobe scheitert an der Quota.** Zwei Erkenntnisse aus drei Requests: (1) Eine *umformulierte Greta-Persona* im gleichen NPC-Prompt-Aufbau (`npcStyle(...)`, Rollenzeile neu getextet) liefert erneut **HTTP 400** — es liegt also nicht an der Wortwahl der Rollenzeile, sondern am NPC-Prompt-Aufbau in Kombination mit genau diesem Knotentext. Bemerkenswert: Greta-`offer` und -`idle` liefen mit exakt demselben Aufbau problemlos durch, es ist also eine Text-Stil-Wechselwirkung, kein reiner Prompt- und kein reiner Textfehler. (2) Derselbe Knoten mit `NARRATOR_STYLE` bekam **429 statt 400** — die Kombination passiert die Validierung, es fehlt nur Quota. Umgesetzt: `TTS_TEXT_OVERRIDES` ist wieder leer (der Ersatztext wäre für das Wort-Highlighting sogar schädlich, weil ausgerichtet wird gegen den ANGEZEIGTEN Spieltext), neu ist `TTS_STYLE_OVERRIDES` mit `npc-greta-turnIn → NARRATOR_STYLE`, und der Knoten ist aus `SKIP_IDS` heraus. Der nächste Batch generiert ihn als erste Einheit; **Daniel prüft die Aufnahme per Gehör** — der Erzähler-Stil beschreibt einen neunzehnjährigen jungen Mann, die Stimme bleibt aber Despina. Klingt sie zu neutral neben Gretas zwei anderen Knoten, ist der nächste Hebel eine Umformulierung des KNOTENTEXTES in `script/npc.js` (Spieltext, mit der Dialog-KI), nicht ein weiterer Prompt-Versuch.
- 12.08.2026 23:07 — Greta-Bestand geklärt: Sie hat 5 Dialogknoten, davon 3 statisch und damit vertonbar (`offer`, `turnIn`, `idle`) — `reminder` und `petCatch` bauen ihren Text zur Laufzeit aus dem Spielstand und bleiben ausgelassen. `offer` und `idle` sind fertig; **es fehlt genau eine Zeile**, `turnIn`.
- 14.08.2026 08:24 — **Nachgetragener Lauf (Log-Zeile fehlte).** Zwischen 08:20 und 08:24 Uhr sind 8 Einheiten entstanden (`npc-greta-turnIn`, `quest-commanderTraining-rewarded`, `quest-oswinsAuftrag-*` 4 Stück, `quest-erstesZuhause-unstarted`/`-active`) — belegt durch die Dateizeitstempel in `tts/output/` und die Einträge in `progress.json`; im Aktivitäts-Log stand dazu **nichts**, veröffentlicht und committet war ebenfalls nichts. Vermutlich der wegen geschlossener App verschobene Nachtlauf vom 13.08., dessen Sitzung nach dem Batch abbrach (`generate-batch.js` hängt die Log-Zeile selbst an, sie fehlt aber im Arbeitsverzeichnis und im Commit). **Merksatz für künftige Läufe: erst `progress.json`/Dateizeitstempel gegen die letzte Log-Zeile abgleichen, sonst verschwindet ein ganzer Tagesertrag lautlos aus der Chronik.** Wichtigstes Ergebnis des Laufs: `npc-greta-turnIn` lief mit dem Stil-Override auf Anhieb durch (HTTP 200) — **Phase 4 ist damit komplett (24/24)**.
- 14.08.2026 22:31 — Batch: 10 Dateien (quest-erstesZuhause-rewarded … quest-gildePruefung-done), 60 s Audio, komplett. Gesamt: 189/331 im Manifest.
- 14.08.2026 22:32 — `publish-audio.js`: 18 neue Paare nach `tts/audio/` veröffentlicht (die 8 aus dem Morgenlauf + die 10 aus dem Abendbatch), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 18 Einheiten fehlerfrei.
- 14.08.2026 22:35 — **`npc-mira-greet` aufgeklärt — derselbe Mechanismus wie bei Greta.** Zwei kostenlose Sonden nach dem Batch (Quota erschöpft): `node tts/probe.js npc-mira-greet --narrator-style` → **HTTP 429** („wäre gültig"), Kontrollsonde mit Original-Stil → **HTTP 400** („Auslöser"). Stimme in beiden Fällen unverändert Aoede, Text unverändert. Damit ist der **Mira-Persona-Stil-Prompt** der Auslöser der drei 400er vom 26./27.07., nicht der Knotentext — und die Kontrollsonde schließt aus, dass es bloß Transienz war. Umgesetzt: `TTS_STYLE_OVERRIDES` um `npc-mira-greet → NARRATOR_STYLE` ergänzt, Knoten aus `SKIP_IDS` genommen, Manifest neu erzeugt. Der nächste Batch generiert ihn als erste Einheit. **Daniel prüft beide Ausnahme-Aufnahmen per Gehör** (Greta `turnIn`, Mira `greet`): die Stimme bleibt jeweils dieselbe, die Spielweise wird neutraler. Übrig als einziger dauerhaft blockierter Knoten: `npc-fremder-finaleDialog` (Leerantwort `finishReason: OTHER`) — dort hilft die Sonde nicht, weil sie nur 400 gegen 429 unterscheidet und dieser Knoten die Validierung passiert.
- 14.08.2026 22:36 — Tagesbilanz: 18 erfolgreiche Generierungen an einem Kalendertag (8 um 08:20, 10 um 22:26) plus 2 kostenlose Sonden. **Das Tageslimit von 10 hängt an einem Quota-Fenster, das nicht um Mitternacht deutscher Zeit umschlägt** (Verdacht: Pacific-Mitternacht ≈ 09:00 unserer Zeit) — der Morgenlauf zählte offenbar noch zum Vortag. Praktische Folge: Ein Nachlauf am frühen Morgen ist kein verschwendeter Slot, sondern schöpft das Kontingent des Vortages nach. Nicht überinterpretieren, aber im Blick behalten.
- 15.08.2026 22:16 — Batch: 10 Dateien (npc-mira-greet … quest-miraSuche-rewarded), 66 s Audio, komplett. Gesamt: 199/331 im Manifest.
- 15.08.2026 22:17 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 15.08.2026 22:18 — **Der Stil-Override-Fix ist jetzt an beiden Fällen bestätigt.** `npc-mira-greet` lief als erste Einheit des Batches mit HTTP 200 durch — nach 3 HTTP 400 am 26./27.07. und ohne jede Änderung an Text oder Stimme (Aoede), nur mit `TTS_STYLE_OVERRIDES → NARRATOR_STYLE`. Damit ist das am 12.08. an Greta entdeckte Rezept zweimal unabhängig belegt: Bei einem *dauerhaft* mit 400 scheiternden NPC-Knoten ist der Persona-Stil-Prompt der Auslöser, und zwei kostenlose Sonden bei leerer Quota (400 gegen 429) reichen als Beweis. **Phase 3 steht damit bei 64/65**, dauerhaft blockiert bleibt allein `npc-fremder-finaleDialog` (Leerantwort `finishReason: OTHER`, für die die Sonde nichts hergibt). **Offen für Daniel: Hörprobe** der beiden Ausnahme-Aufnahmen (Greta `turnIn`, Mira `greet`) — Stimme unverändert, Spielweise neutraler.
- 15.08.2026 22:19 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — der erste vollständig fehlerfreie Zehnerlauf seit dem 29.07. Keine Sonden nötig: Die 400er-Diagnostik für `npc-greta-turnIn` und `npc-mira-greet` ist abgeschlossen und geloggt (12.08. bzw. 14.08.), der Schritt entfällt in künftigen Läufen. Phase 5 steht bei 46/177 (Quests 46/139, Objectives 0/38); bei 10/Tag ist sie um den 28.08. herum durch, danach folgt Phase 6 (Welt-Flavor, Extraktion steht noch aus).
- 17.08.2026 22:16 — Batch: 10 Dateien (quest-kampfRoutine-unstarted … quest-gildaAufstieg-active), 53 s Audio, komplett. Gesamt: 209/331 im Manifest.
- 17.08.2026 22:17 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 18.08.2026 01:22 — Tagesbilanz zum Lauf vom 17.08.: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — zweiter fehlerfreier Zehnerlauf in Folge. Keine Sonden (400er-Diagnostik ist seit 14.08. abgeschlossen und geloggt). Am 16.08. lief kein Batch (kein Log-Eintrag, keine neuen Dateien in `tts/output/` — App war vermutlich zu); der Gegencheck `progress.json`/Dateizeitstempel gegen die letzte Log-Zeile zeigt keinen verschwundenen Tagesertrag. Phase 5 steht bei 56/177 (Quests 56/139, Objectives 0/38); bei 10/Tag ist sie um den 30.08. herum durch, danach Phase 6 (Welt-Flavor, Extraktion steht noch aus). Nachtrag zur Chronik: Die Abschluss-Schritte dieses Laufs (Veröffentlichen, Log, Commit) liefen erst gegen 01:20, weil die Sitzung zwischen Batch und Abschluss pausierte — Batch und Audio-Dateien stammen belegt aus 22:15/22:16.
- 19.08.2026 06:39 — Batch: 10 Dateien (quest-gildaAufstieg-done … quest-varenaErstkontakt-unstarted), 53 s Audio, komplett. Gesamt: 219/331 im Manifest.
- 19.08.2026 06:41 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 19.08.2026 06:42 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — dritter fehlerfreier Zehnerlauf in Folge. Keine Sonden (400er-Diagnostik ist seit 14.08. abgeschlossen und geloggt). **Am 18.08. lief kein Batch** (keine Log-Zeile, keine Einträge mit diesem Datum in `progress.json`, keine neuen Dateien in `tts/output/`) — App war zu; dieser Lauf ist der nachgeholte. Der Gegencheck `progress.json` gegen die letzte Log-Zeile zeigt keinen verschwundenen Tagesertrag. **Folge aus der Quota-Fenster-Notiz vom 14.08.:** Ein Lauf um 06:39 fällt vermutlich noch ins Kontingent des Vortags (Pacific-Mitternacht ≈ 09:00 unserer Zeit) — der reguläre Nachtlauf um 22:00 kann heute also erneut 10 Einheiten schaffen. Phase 5 steht bei 66/177 (Quests 66/139, Objectives 0/38); bei 10/Tag ist sie um den 30.08. herum durch, danach Phase 6 (Welt-Flavor, Extraktion steht noch aus). Dauerhaft blockiert bleibt allein `npc-fremder-finaleDialog` (Leerantwort `finishReason: OTHER`, in `SKIP_IDS`).
- 20.08.2026 06:55 — Batch: 10 Dateien (quest-varenaErstkontakt-active … quest-thessaGeheimnis-rewarded), 60 s Audio, komplett. Gesamt: 229/331 im Manifest.
- 20.08.2026 06:56 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 20.08.2026 06:57 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — vierter fehlerfreier Zehnerlauf in Folge. Keine Sonden (400er-Diagnostik ist seit 14.08. abgeschlossen und geloggt). **Am 19.08. lief der reguläre Nachtlauf um 22:00 nicht** (keine Log-Zeile, keine Dateien mit diesem Zeitstempel in `tts/output/`) — App war zu; die Vermutung vom Vortag, das Vortags-Kontingent lasse sich per Morgenlauf zusätzlich nachschöpfen, blieb deshalb ungetestet. Der Gegencheck `progress.json` (229 Einträge) gegen die letzte Log-Zeile und die 219 WAVs vor dem Lauf zeigt keinen verschwundenen Tagesertrag. Phase 5 steht bei 76/177 (Quests 76/139, Objectives 0/38); bei 10/Tag ist sie um den 30.08. herum durch, danach Phase 6 (Welt-Flavor, Extraktion steht noch aus). Dauerhaft blockiert bleibt allein `npc-fremder-finaleDialog` (Leerantwort `finishReason: OTHER`, in `SKIP_IDS`).
- 20.08.2026 22:17 — Batch: 10 Dateien (quest-tier2Boss-unstarted … quest-valdrisSpuren-rewarded), 61 s Audio, komplett. Gesamt: 239/331 im Manifest.
- 20.08.2026 22:18 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 20.08.2026 22:20 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — fünfter fehlerfreier Zehnerlauf in Folge. Keine Sonden (400er-Diagnostik ist seit 14.08. abgeschlossen und geloggt). **Die Quota-Fenster-Vermutung vom 14.08. ist damit belegt:** Heute liefen ZWEI volle Zehnerläufe an einem Kalendertag durch (06:55 und 22:17, zusammen 20 Generierungen, kein einziges 429). Der Morgenlauf schöpfte das Kontingent des Quota-Tages, der am 19.08. gegen 09:00 begann und ungenutzt blieb; der Abendlauf das des heutigen. Das Fenster schlägt also **nicht** um Mitternacht deutscher Zeit um, sondern rund um 09:00 (Pacific-Mitternacht). Anders als am 14.08. (8+10) war der Morgenlauf diesmal kein verschobener Vortagslauf, sondern ein zusätzlicher — genau der Test, der am 19.08. mangels laufender App ausblieb. **Praktische Folge: Fällt ein Nachtlauf aus, holt ein Lauf vor 09:00 des Folgetages ihn vollständig nach, ohne dem neuen Tag Slots wegzunehmen.** Phase 5 steht bei 86/177 (Quests 86/139, Objectives 0/38); bei 10/Tag ist sie um den 28.08. herum durch, danach Phase 6 (Welt-Flavor, Extraktion steht noch aus). Dauerhaft blockiert bleibt allein `npc-fremder-finaleDialog` (Leerantwort `finishReason: OTHER`, in `SKIP_IDS`).
- 22.08.2026 00:36 — Batch: 10 Dateien (quest-lethkarMarkt-unstarted … quest-alchemieGeselle-rewarded), 54 s Audio, komplett. Gesamt: 249/331 im Manifest.
- 22.08.2026 00:37 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 22.08.2026 00:40 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — sechster fehlerfreier Zehnerlauf in Folge. Keine Sonden (400er-Diagnostik ist seit 14.08. abgeschlossen und geloggt). **Am 21.08. lief kein Batch um 22:00**; die geplante Aufgabe startete zwar um 22:09, der Batch selbst lief erst um 00:36 des Folgetages, weil die Sitzung dazwischen pausierte (dasselbe Muster wie in der Nacht 17./18.08.). Für die Quota ist das folgenlos: Nach der am 20.08. belegten Fenster-Regel (Umschlag ~09:00 unserer Zeit) fiel dieser Lauf noch ins Kontingent des 21.08., das sonst ungenutzt verfallen wäre — und der reguläre Nachtlauf heute um 22:00 hat wieder volle 10 Slots. Der Gegencheck `progress.json` (239 Einträge) gegen die letzte Log-Zeile und die 239 WAVs vor dem Lauf zeigt keinen verschwundenen Tagesertrag. Phase 5 steht bei 96/177 (Quests 96/139, Objectives 0/38); bei 10/Tag ist sie um den 30.08. herum durch, danach Phase 6 (Welt-Flavor, Extraktion steht noch aus). Dauerhaft blockiert bleibt allein `npc-fremder-finaleDialog` (Leerantwort `finishReason: OTHER`, in `SKIP_IDS`).
- 22.08.2026 01:05 — **Zwei Entscheidungen von Daniel, beide vollzogen.** (1) *Keine Hörproben als aktives Todo:* „ich will nichts gegenhören, es soll einfach nur alles vertont werden, todos können raus, irgendwann kommt die probe und feedback, aber erstmal nicht als aktives todo." Die drei Rückmelde-Punkte (Ausnahme-Aufnahmen Greta/Mira, Wort-Highlighting-Gegencheck, allgemeine Qualitätsrunde) stehen ab jetzt im neuen Abschnitt „Zurückgestellt" und tauchen weder im Footer noch in der Checkliste auf. (2) *Letzten Dauer-Ausfall wieder mitlaufen lassen:* `npc-fremder-finaleDialog` (4× Leerantwort `finishReason: OTHER`, seit 07.08. in `SKIP_IDS`) bekommt einen Eintrag in `TTS_STYLE_OVERRIDES` auf `NARRATOR_STYLE` und ist aus `SKIP_IDS` heraus — `SKIP_IDS` ist damit leer. Belegt ist der Hebel für diesen Fehlermodus **nicht**: Bei Greta und Mira löste er HTTP 400 ab, hier liegt eine Leerantwort vor, und die Gratis-Sonde kann darüber nichts sagen, weil der Knoten die Validierung passiert. Er kostet aber höchstens einen Tages-Slot, und Daniels Vorgabe ist, dass am Ende alles vertont ist. Scheitert er zwei weitere Male, ist der nächste Schritt eine Umformulierung des KNOTENTEXTES in `script/npc.js` mit der Dialog-KI — kein weiterer Prompt-Versuch. Der nächste Batch nimmt ihn als erste Einheit.
- 22.08.2026 01:20 — **Nachtlauf läuft ab jetzt über `tts/nightly.js` (ein Befehl statt acht).** Anlass ist die Verzögerung des 21.08.-Laufs um über zwei Stunden: Die geplante Aufgabe startet im Claude-Client immer im manuellen Berechtigungsmodus, und `.claude/settings.local.json` erlaubt bisher nur `Edit(tts/**)` — jeder einzelne `node`- und `git`-Aufruf löste deshalb eine eigene Rückfrage aus, die Daniel erst bemerken und genehmigen musste. Das neue Skript führt Batch, Veröffentlichen, Zählung und Commit+Push nacheinander aus und ruft node/git über absolute Pfade auf, damit kein PATH-Export davorsteht (sonst wäre es kein einzelner Befehl mehr und keine Präfix-Regel würde greifen). `--skip-batch` lässt die Generierung aus, `--push` schaltet Commit und Push zu. Die Tagesbilanz im Log schreibt weiterhin der Agent von Hand — sie ist Deutung, keine Buchhaltung. **Nebenbefund mit Erkenntniswert:** `git push` als Kindprozess von node läuft mit dem normalen Credential-Helper durch (Exit 0). Die Exit-128-Falle aus Kategorie 1 der Learnings gilt also nur für git, das direkt aus dem Bash-Werkzeug gestartet wird; das `GIT_ASKPASS`-Rezept bleibt im Skript nur als zweiter Versuch stehen und erzeugt seine Hilfsdatei im Temp-Verzeichnis, nicht im Repo.
- 22.08.2026 22:28 — Batch: 10 Dateien (npc-fremder-finaleDialog … quest-gildeInvestition-active), 76 s Audio, komplett. Gesamt: 259/331 im Manifest.
- 22.08.2026 22:30 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — siebter fehlerfreier Zehnerlauf in Folge. `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht, 0 zurückgehalten; Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei. Erster Lauf komplett über `tts/nightly.js --push` (ein Befehl, eine Freigabe) — der Ablauf lief ohne Zwischenfall durch, Batch 22:10–22:28, Commit `ad56344` gepusht. **Der Tagesertrag ist `npc-fremder-finaleDialog`:** Der seit 07.08. blockierte Knoten (4× Leerantwort `finishReason: OTHER`) lief mit dem gestern gesetzten Stil-Override als erste Einheit auf Anhieb mit HTTP 200 durch. Damit ist der Override-Hebel **auch für den Leerantwort-Fehlermodus** belegt, nicht nur für die 400er von Greta und Mira — die gestern notierte Einschränkung („belegt ist er für diesen Fehlermodus nicht") ist eingelöst, die Umformulierung des Knotentextes in `script/npc.js` entfällt. Konsequenz für künftige Dauer-Ausfälle: Vor jedem SKIP-Eintrag steht erst ein `TTS_STYLE_OVERRIDES`-Versuch, unabhängig davon, ob der Knoten mit 400 oder mit Leerantwort scheitert. **Phase 3 ist damit komplett (65/65)**, `progress.json` führt keine fehlgeschlagene Einheit mehr, `SKIP_IDS` ist leer — erstmals seit dem 26.07. steht kein einziger Knoten mehr aus. Der Gegencheck vor dem Lauf (249 Einträge in `progress.json`, 249 WAVs in `tts/output/`, neuester vom 22.08. 00:36) deckt sich mit der letzten Log-Zeile; kein verschwundener Tagesertrag. Phase 5 steht bei 105/177 (Quests 105/139, Objectives 0/38); bei 10/Tag ist sie um den 29.08. herum durch, danach Phase 6 (Welt-Flavor, Extraktion steht noch aus).
- 23.08.2026 22:16 — Batch: 10 Dateien (quest-gildeInvestition-invested … quest-gorrsVergangenheit-unstarted), 47 s Audio, komplett. Gesamt: 269/331 im Manifest.
- 23.08.2026 22:17 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 23.08.2026 22:18 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — **achter fehlerfreier Zehnerlauf in Folge**. Keine Sonden (400er-Diagnostik ist seit 14.08. abgeschlossen und geloggt). Zweiter Lauf komplett über `tts/nightly.js --push`, wieder ohne Zwischenfall und mit einer einzigen Freigabe; Commit `82c1042` gepusht. Der Gegencheck vor dem Lauf (259 Einträge in `progress.json`, 259 WAVs in `tts/output/`, neuester vom 22.08. 22:28, 0 fehlgeschlagene) deckt sich mit der letzten Log-Zeile — kein verschwundener Tagesertrag. Ohne Ausnahme-Knoten und ohne Fehlerbilder ist der Lauf reine Fließarbeit; auffällig ist nur, **wie kurz die Quest-Kurztexte inzwischen sind**: 47 s Audio auf 10 Einheiten (Ø 4,7 s), drei davon `unstarted`-Zustände mit 20 Zeichen und rund 2 s. Die Phase-5-Restlaufzeit hängt damit an der Stückzahl, nicht an der Audiolänge. Phase 5 steht bei 115/177 (Quests 115/139, Objectives 0/38); die verbleibenden 62 offenen Einheiten des Manifests sind **ausnahmslos** Phase 5 — bei 10/Tag ist sie um den 29.08. herum durch. Danach folgt Phase 6 (Welt-Flavor), deren Extraktion weiterhin aussteht: `extract-manifest.js` muss dafür erst um die kuratierte Auswahl erweitert werden (`${...}`-Strings auslassen). Das ist der nächste Arbeitsschritt, sobald das Manifest leerläuft — nicht erst dann anzufangen wäre besser, kostet aber keine Quota und kann deshalb ohne Eile in einem der nächsten Läufe vorgezogen werden.
- 24.08.2026 23:06 — Batch: 10 Dateien (quest-gorrsVergangenheit-active … quest-archivRecherche-dok2), 50 s Audio, komplett. Gesamt: 279/331 im Manifest.
- 24.08.2026 23:07 — `publish-audio.js`: 10 neue Paare nach `tts/audio/` veröffentlicht (Opus + words.json), 0 zurückgehalten. Opus-Konvertierung und Alignment liefen für alle 10 Einheiten fehlerfrei.
- 24.08.2026 23:10 — Tagesbilanz: 10 Requests, 10 erfolgreich, kein 400, kein 503, keine Leerantwort — **neunter fehlerfreier Zehnerlauf in Folge**. Dritter Lauf komplett über `tts/nightly.js --push`, eine Freigabe, kein Zwischenfall; Commit `49bccbb` gepusht. Der Gegencheck vor dem Lauf (269 Einträge in `progress.json`, 269 WAVs in `tts/output/`, neuester vom 23.08. 22:16, 538 Dateien = 269 vollständige Paare in `tts/audio/`, 0 fehlgeschlagene) deckt sich mit der letzten Log-Zeile — kein verschwundener Tagesertrag. Nebenbei bereinigt: Die Batch-Zeile vom 23.08. 22:16 stand doppelt in der Chronik, das Duplikat ist raus. Der Lauf ist reine Fließarbeit ohne Fehlerbild; auffällig bleibt allein die Kürze der Quest-Kurztexte — 50 s Audio auf 10 Einheiten (Ø 5,0 s), die beiden `unstarted`-Zustände mit 20 Zeichen und rund 2 s. Phase 5 steht bei 125/177 (Quests 125/139, Objectives 0/38); die 52 offenen Einheiten des Manifests sind **ausnahmslos** Phase 5 — bei 10/Tag ist sie um den 29./30.08. herum durch, und die letzten 38 davon sind am Stück die Objectives. Danach folgt Phase 6 (Welt-Flavor), deren Extraktion weiterhin aussteht: `extract-manifest.js` muss dafür erst um die kuratierte Auswahl erweitert werden (`${...}`-Strings auslassen). Sie kostet keine Quota und ist damit der einzige Arbeitsschritt, der sich vor das Leerlaufen des Manifests ziehen lässt — spätestens im Lauf vom 29.08. gehört er erledigt, sonst steht der erste Tag nach Phase 5 ohne Nachschub da.
