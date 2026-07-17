# TTS-Vertonungsplan — Chroniken des vergessenen Weges

Ziel: Alle spielersichtbaren Texte als Audiodateien vertonen — kostenlos über das
Gemini-Free-Tier, verteilt über mehrere Wochen.

**Status-Übersicht und Aktivitäts-Log in dieser Datei werden nach JEDEM Batch
aktualisiert** (teils automatisch durch `generate-batch.js`, Checkboxen von Hand).

## Rahmendaten

- Modell: `gemini-2.5-flash-preview-tts` (Free Tier: Input + Output kostenlos)
- Free-Tier-Limits (letzter öffentlich dokumentierter Stand, im Zweifel
  [AI-Studio-Dashboard](https://aistudio.google.com/rate-limit) prüfen):
  **3 Requests/Minute, 15 Requests/Tag** → 1 Batch = 15 Audiodateien/Tag
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
  - [ ] **BLOCKER (17.07.2026):** Der vorhandene `GEMINI_API_KEY` (Projekt
        „Default Gemini Project") läuft im **Prepay-Modus mit 0 Credits** —
        jeder Request liefert 429 „prepayment credits depleted", es gibt für
        dieses Projekt **kein Free Tier**. Lösung: neuen API-Key aus einem
        Projekt OHNE Billing in [AI Studio](https://aistudio.google.com/apikey)
        anlegen und in `.env.local` eintragen — ODER Credits aufladen (dann
        ist die Gesamt-Vertonung für ~1,40–2,80 $ an einem Tag durch)
  - [ ] Echtes Free-Tier-Limit verifiziert (sobald ein Free-Tier-Key da ist:
        429-Quota-ID im Log ansehen — steht dort „FreeTier", stimmt die
        15/Tag-Annahme)
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

Grobe Zeitschätzung bei 15/Tag: Phase 1–2 bis ~21.07., Phase 3–4 bis ~06.08.,
Phase 5 bis ~19.08., Phase 6–7 bis ~Mitte September 2026.

## Aktivitäts-Log

<!-- generate-batch.js hängt hier automatisch Zeilen an — Format:
- DD.MM.YYYY HH:MM — Batch N: X Dateien (IDs …), Y s Audio, Status -->
- 17.07.2026 12:03 — Batch 1 abgebrochen: 0 Dateien. Key ist Prepay mit 0 Credits → kein Free Tier (siehe BLOCKER in Phase 0). Gesamt: 0/65 im Manifest.
