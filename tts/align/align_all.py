"""
Batch-Forced-Alignment fuer alle vertonten Einheiten, siehe tts/PLAN.md.
Laedt das WhisperX-Alignment-Modell EINMAL und richtet dann jede WAV-Datei
aus tts/output/ gegen ihren Manifest-Text aus — schreibt <id>.words.json
direkt neben die WAV (dasselbe Format, das das Spiel laedt).

Aufrufe (aus tts/align/, mit .venv/Scripts/python.exe):
  python align_all.py            # alle WAVs ohne words.json (Backlog)
  python align_all.py --single <unit-id>   # genau eine Einheit (fuer generate-batch.js)

Der Text kommt aus tts/manifest.json (unit.text) — keine separaten .txt-Dateien
noetig. Fehler bei einer Datei brechen den Lauf nicht ab.
"""
import sys
import json
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE, "..", "output")
MANIFEST = os.path.join(BASE, "..", "manifest.json")


def clean_text(text):
    # Anfuehrungszeichen/Regie-Marker bleiben drin — WhisperX ignoriert
    # Interpunktion beim Ausrichten; nur Mehrfach-Whitespace normalisieren.
    return re.sub(r"\s+", " ", text).strip()


def main():
    single_id = None
    if len(sys.argv) >= 3 and sys.argv[1] == "--single":
        single_id = sys.argv[2]

    with open(MANIFEST, "r", encoding="utf-8") as f:
        units = {u["id"]: u for u in json.load(f)["units"]}

    jobs = []
    for uid, unit in units.items():
        if single_id and uid != single_id:
            continue
        wav = os.path.join(OUT_DIR, uid + ".wav")
        out = os.path.join(OUT_DIR, uid + ".words.json")
        if os.path.exists(wav) and (single_id or not os.path.exists(out)):
            jobs.append((uid, wav, out, clean_text(unit["text"])))

    if not jobs:
        print("Nichts zu tun — alle vorhandenen WAVs haben bereits words.json.")
        return

    print(f"{len(jobs)} Datei(en) auszurichten. Lade Alignment-Modell (Deutsch)...")
    import whisperx
    device = "cpu"
    model_a, metadata = whisperx.load_align_model(language_code="de", device=device)

    ok = failed = 0
    for i, (uid, wav, out, text) in enumerate(jobs, 1):
        try:
            audio = whisperx.load_audio(wav)
            duration = len(audio) / 16000.0
            segments = [{"start": 0.0, "end": duration, "text": text}]
            result = whisperx.align(segments, model_a, metadata, audio, device,
                                    return_char_alignments=False)
            with open(out, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            ok += 1
            print(f"[{i}/{len(jobs)}] {uid}: {len(result.get('word_segments', []))} Woerter, {duration:.1f}s")
        except Exception as e:  # eine kaputte Datei soll den Backlog nicht stoppen
            failed += 1
            print(f"[{i}/{len(jobs)}] {uid}: FEHLER {e}")

    print(f"\nFertig: {ok} ok, {failed} Fehler.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
