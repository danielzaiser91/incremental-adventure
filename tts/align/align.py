"""
Forced-Alignment-Test (WhisperX) fuer TTS-Vertonung, siehe tts/PLAN.md.
Richtet den BEKANNTEN Text (aus story.js) gegen eine bereits generierte
Audiodatei aus -- keine ASR-Vermutung, echtes Forced Alignment.

Aufruf: .venv/Scripts/python align.py <audio.wav> <text.txt> <out.json>
"""
import sys
import json
import whisperx

def main():
    audio_path, text_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

    with open(text_path, "r", encoding="utf-8") as f:
        text = f.read().strip()

    device = "cpu"
    audio = whisperx.load_audio(audio_path)
    duration = len(audio) / 16000.0  # load_audio resampled auf 16kHz mono

    print(f"Audio: {audio_path} ({duration:.1f}s), Text: {len(text)} Zeichen")
    print("Lade Alignment-Modell (Deutsch)...")
    model_a, metadata = whisperx.load_align_model(language_code="de", device=device)

    segments = [{"start": 0.0, "end": duration, "text": text}]
    result = whisperx.align(
        segments, model_a, metadata, audio, device,
        return_char_alignments=False
    )

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    words = result.get("word_segments", [])
    print(f"\n{len(words)} Woerter ausgerichtet. Erste 15:")
    for w in words[:15]:
        print(f"  {w.get('start', '?'):>6} - {w.get('end', '?'):>6}  {w['word']}")
    print(f"\nGeschrieben nach {out_path}")

if __name__ == "__main__":
    main()
