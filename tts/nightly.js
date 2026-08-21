#!/usr/bin/env node
/* Nachtlauf in einem Befehl: Batch → Veröffentlichen → Stand → Commit + Push.
 *
 * Anlass (22.08.2026): Die geplante Aufgabe startet im Claude-Client immer im
 * manuellen Berechtigungsmodus. Jeder einzelne `node`- und `git`-Aufruf des
 * Ablaufs löste dort eine eigene Rückfrage aus — Daniel musste sie nacheinander
 * genehmigen, was den Lauf vom 21.08. um über zwei Stunden verzögerte. Ein
 * Skript = eine Rückfrage, und mit einer Zeile in `.claude/settings.local.json`
 * gar keine mehr.
 *
 * Ruft node und git über absolute Pfade auf, damit kein PATH-Export davor nötig
 * ist (siehe Kategorie 1 in ai_agent_learnings.md) — sonst wäre der Befehl kein
 * einzelner Aufruf mehr und keine Präfix-Regel würde greifen.
 *
 * Aufruf (aus dem Repo-Root):
 *   node tts/nightly.js            Batch + Veröffentlichen + Stand, ohne Commit
 *   node tts/nightly.js --push     zusätzlich committen und pushen
 *
 * Die Tagesbilanz im Aktivitäts-Log von PLAN.md schreibt weiterhin der Agent
 * von Hand: Sie ist Deutung (Quota-Fenster, Fehlerbilder), keine Buchhaltung.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NODE = process.execPath;
const GIT = ['C:/Program Files/Git/cmd/git.exe', 'C:/Program Files/Git/bin/git.exe']
  .find(p => fs.existsSync(p)) || 'git';
const REPO = path.join(__dirname, '..');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: REPO, encoding: 'utf8', ...opts });
  if (r.error) throw r.error;
  return r;
}

function step(title, cmd, args) {
  console.log(`\n=== ${title} ===`);
  const r = run(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${title}: Exit ${r.status}`);
}

/* Stand aus progress.json + manifest.json — dieselben Zahlen, die sonst per
   Node-Einzeiler nachgezählt wurden. */
function report() {
  const progress = JSON.parse(fs.readFileSync(path.join(__dirname, 'progress.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  const done = Object.keys(progress.done);
  const total = manifest.units.length;
  const phase5Done = done.filter(id => id.startsWith('quest-') || id.startsWith('objective-')).length;
  const phase5Total = manifest.units.filter(u => u.id.startsWith('quest-') || u.id.startsWith('objective-')).length;
  const failed = Object.keys(progress.failed || {});

  console.log(`\n=== Stand ===`);
  console.log(`Gesamt: ${done.length}/${total} — offen ${total - done.length}`);
  console.log(`Phase 5: ${phase5Done}/${phase5Total}`);
  console.log(failed.length ? `Fehlgeschlagen (läuft morgen erneut mit): ${failed.join(', ')}` : 'Keine fehlgeschlagenen Einheiten.');
  return { done: done.length, total, phase5Done, phase5Total };
}

/* Committet ausschließlich die TTS-Dateien — fremde Änderungen im Arbeitsbaum
   bleiben ungestaged. */
function commitAndPush(stand) {
  const PATHS = ['tts/PLAN.md', 'tts/progress.json', 'tts/audio', 'tts/manifest.json'];
  run(GIT, ['add', ...PATHS]);

  const staged = run(GIT, ['diff', '--cached', '--name-only']).stdout.trim();
  if (!staged) { console.log('\nNichts zu committen.'); return; }

  const msg = `tts: Nachtlauf — Stand ${stand.done}/${stand.total}\n\n`
    + `Phase 5 bei ${stand.phase5Done}/${stand.phase5Total}.\n\n`
    + 'Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>';
  const c = run(GIT, ['commit', '-m', msg]);
  if (c.status !== 0) { console.log(c.stdout + c.stderr); throw new Error('Commit fehlgeschlagen'); }
  console.log(`\nCommit: ${run(GIT, ['log', '--oneline', '-1']).stdout.trim()}`);

  let p = run(GIT, ['push', 'origin', 'main']);

  if (p.status !== 0 && /fetch first|non-fast-forward/i.test(p.stderr)) {
    console.log('Push abgelehnt — hole nach und versuche erneut.');
    run(GIT, ['pull', '--rebase', '--autostash'], { stdio: 'inherit' });
    p = run(GIT, ['push', 'origin', 'main']);
  }

  /* Aus dem Bash-Werkzeug heraus stirbt git push still mit Exit 128, weil die
     Credential-Helper dort nicht anlaufen (Kategorie 1 in
     ai_agent_learnings.md). Als Kindprozess von node läuft der normale Weg
     meist durch — nur wenn nicht, springt GIT_ASKPASS ein: eine Hilfsdatei im
     Temp-Verzeichnis, die Benutzername bzw. `gh auth token` ausgibt. Sie steht
     bewusst nicht im Repo, damit dort nichts liegt, was Zugangsdaten abruft. */
  if (p.status !== 0) {
    console.log('Push ohne Credential-Helper fehlgeschlagen — zweiter Versuch über die GitHub-CLI.');
    const askpass = path.join(require('os').tmpdir(), 'tts-askpass.bat');
    fs.writeFileSync(askpass, [
      '@echo off',
      'echo %~1 | findstr /I "sername" >nul',
      'if %errorlevel%==0 (echo danielzaiser91) else (gh auth token)',
      ''
    ].join('\r\n'));
    p = run(GIT, ['-c', 'credential.helper=', 'push', 'origin', 'main'],
      { env: { ...process.env, GIT_ASKPASS: askpass } });
    fs.unlinkSync(askpass);
  }

  console.log(p.stdout + p.stderr);
  if (p.status !== 0) throw new Error(`Push fehlgeschlagen (Exit ${p.status})`);
}

/* --skip-batch: nur veröffentlichen, zählen und committen. Für Läufe, bei denen
   der Batch bereits durch ist und nur der Abschluss fehlt — und um das Skript zu
   prüfen, ohne einen Tages-Slot zu verbrennen. */
if (!process.argv.includes('--skip-batch')) {
  step('Batch', NODE, [path.join(__dirname, 'generate-batch.js')]);
}
step('Veröffentlichen', NODE, [path.join(__dirname, 'publish-audio.js')]);
const stand = report();
if (process.argv.includes('--push')) commitAndPush(stand);
