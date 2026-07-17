/* ══════════════════════════════════════════════════════════════
   tts/generate-batch.js — täglicher Free-Tier-Batch
   Nimmt die nächsten offenen Einheiten aus manifest.json (Default 15,
   Free-Tier-Tageslimit), ruft Gemini TTS mit 21 s Abstand (3 RPM),
   schreibt WAV-Dateien nach tts/output/ und pflegt progress.json
   sowie das Aktivitäts-Log in PLAN.md.

   Aufruf:  node tts/generate-batch.js [--limit N]
   Stoppt sauber bei 429 (Tageslimit erreicht) und loggt die
   Quota-Details — daran ist ablesbar, ob der Key als Free Tier läuft.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');

const MODEL = 'gemini-2.5-flash-preview-tts';
/* Free-Tier-Tageslimit, verifiziert 17.07.2026 per 429-Quota
   (GenerateRequestsPerDayPerProjectPerModel-FreeTier, quotaValue 10). */
const BATCH_LIMIT_DEFAULT = 10;
const REQUEST_SPACING_MS = 21000; // 3 RPM mit Puffer
const OUT_DIR = path.join(__dirname, 'output');
const PROGRESS_FILE = path.join(__dirname, 'progress.json');
const PLAN_FILE = path.join(__dirname, 'PLAN.md');

function loadEnvKey() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    .find(l => l.startsWith('GEMINI_API_KEY='));
  if (!line) throw new Error('GEMINI_API_KEY fehlt in .env.local');
  return line.slice('GEMINI_API_KEY='.length).trim();
}

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

/* PCM (16-bit LE, mono) → WAV */
function wavFromPcm(pcm, sampleRate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);            // PCM
  header.writeUInt16LE(1, 22);            // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (16 bit mono)
  header.writeUInt16LE(2, 32);            // block align
  header.writeUInt16LE(16, 34);           // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synthesize(apiKey, unit) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${unit.style}\n\n${unit.text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: unit.voice } }
          }
        }
      })
    }
  );
  const body = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${body.slice(0, 2000)}`);
    err.status = res.status;
    throw err;
  }
  const json = JSON.parse(body);
  const part = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error('Keine Audio-Daten in Antwort: ' + body.slice(0, 500));
  const rateMatch = /rate=(\d+)/.exec(part.inlineData.mimeType || '');
  return {
    pcm: Buffer.from(part.inlineData.data, 'base64'),
    sampleRate: rateMatch ? Number(rateMatch[1]) : 24000
  };
}

function appendPlanLog(line) {
  fs.appendFileSync(PLAN_FILE, `- ${line}\n`);
}

function timestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : BATCH_LIMIT_DEFAULT;

  const apiKey = loadEnvKey();
  const manifest = loadJson(path.join(__dirname, 'manifest.json'), null);
  if (!manifest) throw new Error('manifest.json fehlt — erst node tts/extract-manifest.js');
  const progress = loadJson(PROGRESS_FILE, { done: {}, failed: {} });

  const pending = manifest.units.filter(u => !progress.done[u.id]);
  const batch = pending.slice(0, limit);
  if (!batch.length) { console.log('Nichts offen — alles vertont.'); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Batch: ${batch.length} von ${pending.length} offenen Einheiten (${manifest.units.length} gesamt)`);

  const okIds = [];
  let totalSeconds = 0;
  let stopReason = 'komplett';

  for (let i = 0; i < batch.length; i++) {
    const unit = batch[i];
    if (i > 0) await new Promise(r => setTimeout(r, REQUEST_SPACING_MS));
    process.stdout.write(`[${i + 1}/${batch.length}] ${unit.id} (${unit.text.length} Zeichen) … `);
    try {
      const { pcm, sampleRate } = await synthesize(apiKey, unit);
      const seconds = pcm.length / 2 / sampleRate;
      /* Plausibilität: ~16 Zeichen/s Sprechtempo. Deutlich längere Ausgaben
         sind erfahrungsgemäß Stille/Artefakte (siehe story-1-3 am 17.07.) —
         als Fehler werten, damit der nächste Batch sie neu generiert. */
      const expected = unit.text.length / 16;
      if (seconds > expected * 3 + 30) {
        throw new Error(`Unplausible Audiodauer ${seconds.toFixed(1)}s bei erwarteten ~${expected.toFixed(0)}s — vermutlich Stille/Artefakte`);
      }
      const file = `${unit.id}.wav`;
      fs.writeFileSync(path.join(OUT_DIR, file), wavFromPcm(pcm, sampleRate));
      progress.done[unit.id] = { file, seconds: Math.round(seconds * 10) / 10, date: new Date().toISOString() };
      delete progress.failed[unit.id];
      okIds.push(unit.id);
      totalSeconds += seconds;
      console.log(`OK, ${seconds.toFixed(1)}s`);
    } catch (e) {
      console.log(`FEHLER: ${e.message}`);
      progress.failed[unit.id] = { error: String(e.message).slice(0, 500), date: new Date().toISOString() };
      if (e.status === 429) {
        stopReason = /prepayment credits/i.test(e.message)
          ? 'Abbruch: Prepay-Credits aufgebraucht — Key läuft NICHT im Free Tier'
          : '429-Limit erreicht (Quota-Details siehe Konsole)';
        break;
      }
    } finally {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    }
  }

  const doneTotal = Object.keys(progress.done).length;
  appendPlanLog(
    `${timestamp()} — Batch: ${okIds.length} Dateien (${okIds[0] || '–'} … ${okIds[okIds.length - 1] || '–'}), ` +
    `${Math.round(totalSeconds)} s Audio, ${stopReason}. Gesamt: ${doneTotal}/${manifest.units.length} im Manifest.`
  );
  console.log(`\nFertig: ${okIds.length} Dateien, ${Math.round(totalSeconds)}s Audio. Gesamt ${doneTotal}/${manifest.units.length}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
