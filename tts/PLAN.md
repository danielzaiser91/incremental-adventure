# TTS-Vertonungsplan — Chroniken des vergessenen Weges

Ziel: Alle spielersichtbaren Texte als Audiodateien vertonen — kostenlos über das
Gemini-Free-Tier, verteilt über mehrere Wochen.

**Status-Übersicht und Aktivitäts-Log in dieser Datei werden nach JEDEM Batch
aktualisiert** (teils automatisch durch `generate-batch.js`, Checkboxen von Hand).

## Rahmendaten

- Modell: `gemini-2.5-flash-preview-tts` (Free Tier: Input + Output kostenlos)
- Free-Tier-Limits (**verifiziert 17.07.2026** über 429-Antwort, Quota-ID
  `GenerateRequestsPerDayPerProjectPerModel-FreeTier`): **10 Requests/Tag**
  pro Modell, 3 Requests/Minute → 1 Batch = 10 Audiodateien/Tag
- Erzählerstimme: `Iapetus` (alle Ich-Texte: Story, Monologe, Objectives)
- NPC-Stimmen: pro NPC eine eigene Stimme (Zuordnung in `extract-manifest.js`,
  wird bei Phase 3 festgelegt)
- Audio-Format: 24 kHz PCM → WAV in `tts/output/` (gitignored). Kompression zu
  Opus/MP3 folgt, sobald ffmpeg installiert ist — erst dann kommen Audiodateien
  ins Repo/Spiel.
- Täglicher Ablauf: `node tts/generate-batch.js` — nimmt die nächsten 15 offenen
  Einheiten aus `tts/manifest.json`, wartet 21 s zwischen Requests (3 RPM),
  stoppt sauber bei 429 (Tageslimit) und loggt unten ins Aktivitäts-Log.
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
  - [x] Echtes Free-Tier-Limit verifiziert: **10 Requests/Tag** (nicht 15) —
        Quota-ID `…PerDayPerProjectPerModel-FreeTier`, quotaValue 10.
        Batch-Default entsprechend auf 10 gesetzt
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

Grobe Zeitschätzung bei 10/Tag (verifiziertes Limit): Phase 1–2 bis ~23.07.,
Phase 3–4 bis ~12.08., Phase 5 bis ~31.08., Phase 6–7 bis ~Anfang Oktober 2026.

## Aktivitäts-Log

<!-- generate-batch.js hängt hier automatisch Zeilen an — Format:
- DD.MM.YYYY HH:MM — Batch N: X Dateien (IDs …), Y s Audio, Status -->
- 17.07.2026 12:03 — Batch 1 abgebrochen: 0 Dateien. Key ist Prepay mit 0 Credits → kein Free Tier (siehe BLOCKER in Phase 0). Gesamt: 0/65 im Manifest.
- 17.07.2026 12:26 — Batch: 10 Dateien (story-1-1 … story-2-2), 993 s Audio, 429-Limit erreicht (Quota-Details siehe Konsole). Gesamt: 10/65 im Manifest.
- 17.07.2026 12:30 — Neuer Free-Tier-Key aktiv, Limit verifiziert (10/Tag). story-1-3 unplausibel (655 s statt ~42 s, Großteil Stille) → zur Neu-Generierung markiert; Plausibilitätsprüfung ins Batch-Skript eingebaut. Sauberer Stand: 9/65.
- 19.07.2026 15:52 — Batch: 9 Dateien (story-1-3 [Neuversuch, diesmal plausibel], story-2-3…story-2-7, story-3-0, story-3-1, story-3-3), 357 s Audio, Tageslimit erreicht (10 Requests). story-3-2 unplausibel (84,1 s statt ~16 s) → zur Neu-Generierung markiert. Gesamt: 18/65 im Manifest.
