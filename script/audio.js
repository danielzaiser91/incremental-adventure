/* ══════════════════════════════════════════════════════════════
   audio.js — Synthetisches Audio-System (Web Audio API)
   Keine externen Dateien — alles prozedural erzeugt.
   Lädt nach save.js, vor main.js.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Audio-Einstellungen (in state.js deklariert, hier verwaltet) ─
   audioSettings = { musicEnabled, sfxEnabled, musicVolume, sfxVolume }
   Die Variable selbst lebt in state.js (wird gespeichert/geladen).
   Falls sie dort noch nicht existiert (Altstand), erzeugen wir einen
   Fallback-Default — merge in loadAudioSettings(). */

let _audioCtx = null;
let _musicGain = null;
let _sfxGain   = null;
let _currentMusicNodes = [];
let _currentTrack = null;
let _loopTimerId  = null;

/* ── AudioContext initialisieren / ggf. fortsetzen ──────────── */

function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    _musicGain = _audioCtx.createGain();
    _sfxGain   = _audioCtx.createGain();
    _musicGain.connect(_audioCtx.destination);
    _sfxGain.connect(_audioCtx.destination);
    syncAudioGains();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function syncAudioGains() {
  if (!_musicGain) return;
  _musicGain.gain.value = audioSettings.musicEnabled ? audioSettings.musicVolume * 0.4 : 0;
  _sfxGain.gain.value   = audioSettings.sfxEnabled   ? audioSettings.sfxVolume  * 0.6 : 0;
}

/* ── Musik stoppen ───────────────────────────────────────────── */

function stopCurrentMusic() {
  if (_loopTimerId !== null) { clearTimeout(_loopTimerId); _loopTimerId = null; }
  _currentMusicNodes.forEach(n => { try { n.stop(); } catch(_) {} });
  _currentMusicNodes = [];
  _currentTrack = null;
}

/* ── Musik abspielen ─────────────────────────────────────────── */

function playMusic(trackId) {
  if (_currentTrack === trackId) return;
  stopCurrentMusic();
  if (!audioSettings.musicEnabled) return;
  _currentTrack = trackId;
  const ctx = getAudioCtx();
  if (trackId === 'main')   _playMainAmbient(ctx);
  if (trackId === 'tavern') _playTavernMusic(ctx);
  if (trackId === 'combat') _playCombatMusic(ctx);
}

/* ── Main Ambient: Dm-Pentatonik, ruhig, melancholisch ────────── */

function _playMainAmbient(ctx) {
  const now = ctx.currentTime;

  // Bass-Drone (D2 = 73.42 Hz) — leises Fundament
  const drone  = ctx.createOscillator();
  drone.type   = 'sine';
  drone.frequency.value = 73.42;
  const droneG = ctx.createGain();
  droneG.gain.setValueAtTime(0, now);
  droneG.gain.linearRampToValueAtTime(0.12, now + 2);
  drone.connect(droneG).connect(_musicGain);
  drone.start(now);
  _currentMusicNodes.push(drone);

  // Arpeggierte Noten: Dm-Pentatonik (D F A C D F A)
  const notes   = [146.83, 174.61, 220, 261.63, 293.66, 349.23, 440];
  const pattern = [0, 2, 4, 2, 0, 3, 2, 0, 4, 2, 3, 1];
  const tempo   = 1.4;

  pattern.forEach((noteIdx, i) => {
    const osc  = ctx.createOscillator();
    osc.type   = 'triangle';
    osc.frequency.value = notes[noteIdx % notes.length];
    const g = ctx.createGain();
    const t = now + i * tempo;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.1);
    g.gain.linearRampToValueAtTime(0, t + tempo * 0.9);
    osc.connect(g).connect(_musicGain);
    osc.start(t);
    osc.stop(t + tempo);
    _currentMusicNodes.push(osc);
  });

  // Loop: nach Ende des Patterns neu starten
  const loopDuration = pattern.length * tempo;
  _loopTimerId = setTimeout(() => {
    if (_currentTrack === 'main') {
      // Drone sauber stoppen
      try { drone.stop(); } catch(_) {}
      _currentMusicNodes = _currentMusicNodes.filter(n => n !== drone);
      _currentTrack = null;
      _loopTimerId  = null;
      playMusic('main');
    }
  }, (loopDuration - 0.2) * 1000);
}

/* ── Taverne: F-Dur, fröhlich, rhythmisch ───────────────────── */

function _playTavernMusic(ctx) {
  const now   = ctx.currentTime;
  // F-Dur Töne: F A C F A C F A
  const notes   = [174.61, 220, 261.63, 349.23, 440, 523.25, 698.46, 880];
  const pattern = [0, 2, 1, 0, 3, 2, 1, 3, 0, 2, 4, 2, 1, 3, 0, 2];
  const tempo   = 0.5;

  pattern.forEach((noteIdx, i) => {
    const osc  = ctx.createOscillator();
    osc.type   = 'triangle';
    osc.frequency.value = notes[noteIdx % notes.length];
    const g = ctx.createGain();
    const t = now + i * tempo;
    // Rhythmische Akzente auf Zählzeit 1 und 3 (i % 4 === 0 oder 2)
    const vol = (i % 4 === 0) ? 0.10 : (i % 2 === 0) ? 0.07 : 0.05;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.linearRampToValueAtTime(0, t + tempo * 0.85);
    osc.connect(g).connect(_musicGain);
    osc.start(t);
    osc.stop(t + tempo);
    _currentMusicNodes.push(osc);
  });

  const loopDuration = pattern.length * tempo;
  _loopTimerId = setTimeout(() => {
    if (_currentTrack === 'tavern') {
      _currentTrack = null;
      _loopTimerId  = null;
      playMusic('tavern');
    }
  }, (loopDuration - 0.1) * 1000);
}

/* ── Kampf: dissonant, intensiv, Bass-Ostinato + Perkussion ─── */

function _playCombatMusic(ctx) {
  const now = ctx.currentTime;

  // Bass-Ostinato: schnelle Wiederholungen (D1 = 36.71 Hz Annäherung: 73.42/2)
  const bassFreqs = [73.42, 77.78, 69.30, 73.42]; // D, Eb, Db, D — leichte Dissonanz
  const beatLen   = 0.25; // Sechzehntel-Noten

  for (let step = 0; step < 16; step++) {
    const osc = ctx.createOscillator();
    osc.type  = 'sawtooth';
    osc.frequency.value = bassFreqs[step % bassFreqs.length];
    const g = ctx.createGain();
    const t = now + step * beatLen;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.02);
    g.gain.linearRampToValueAtTime(0, t + beatLen * 0.8);
    osc.connect(g).connect(_musicGain);
    osc.start(t);
    osc.stop(t + beatLen);
    _currentMusicNodes.push(osc);
  }

  // Perkussions-Effekt: Noise-Buffer als "Snare" auf Zählzeit 2 + 4
  try {
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer     = ctx.createBuffer(1, Math.floor(bufferSize), ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

    [1, 3].forEach(beat => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const bpf  = ctx.createBiquadFilter();
      bpf.type   = 'bandpass';
      bpf.frequency.value = 2000;
      bpf.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.08, now + beat * beatLen * 4);
      g.gain.linearRampToValueAtTime(0, now + beat * beatLen * 4 + 0.06);
      src.connect(bpf).connect(g).connect(_musicGain);
      src.start(now + beat * beatLen * 4);
      _currentMusicNodes.push(src);
    });
  } catch(_) {}

  const loopDuration = 16 * beatLen;
  _loopTimerId = setTimeout(() => {
    if (_currentTrack === 'combat') {
      _currentTrack = null;
      _loopTimerId  = null;
      playMusic('combat');
    }
  }, (loopDuration - 0.05) * 1000);
}

/* ══════════════════════════════════════════════════════════════
   SFX-Funktionen — alle kurz, alle über _sfxGain geleitet
   ══════════════════════════════════════════════════════════════ */

function playSfx(type) {
  if (!audioSettings.sfxEnabled) return;
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    switch (type) {
      case 'work':        _sfxWork(ctx, now);        break;
      case 'hit':         _sfxHit(ctx, now);         break;
      case 'miss':        _sfxMiss(ctx, now);        break;
      case 'victory':     _sfxVictory(ctx, now);     break;
      case 'defeat':      _sfxDefeat(ctx, now);      break;
      case 'alchemy':     _sfxAlchemy(ctx, now);     break;
      case 'achievement': _sfxAchievement(ctx, now); break;
      case 'coin':        _sfxCoin(ctx, now);        break;
      case 'sleep':       _sfxSleep(ctx, now);       break;
      case 'levelup':     _sfxLevelUp(ctx, now);     break;
      case 'click':       _sfxClick(ctx, now);       break;
    }
  } catch(_) {}
}

// Kurzes "thud" — Arbeit abgeschlossen
function _sfxWork(ctx, now) {
  const osc = ctx.createOscillator();
  osc.type  = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(120, now + 0.2);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, now);
  g.gain.linearRampToValueAtTime(0, now + 0.2);
  osc.connect(g).connect(_sfxGain);
  osc.start(now); osc.stop(now + 0.22);
}

// Scharfes "ping" — Treffer im Kampf
function _sfxHit(ctx, now) {
  const osc = ctx.createOscillator();
  osc.type  = 'square';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.20, now);
  g.gain.linearRampToValueAtTime(0, now + 0.15);
  osc.connect(g).connect(_sfxGain);
  osc.start(now); osc.stop(now + 0.18);
}

// "Whoosh" — Fehler im Kampf (Bandpass-Rauschen)
function _sfxMiss(ctx, now) {
  try {
    const bufSize = Math.floor(ctx.sampleRate * 0.3);
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type  = 'bandpass';
    bpf.frequency.value = 800;
    bpf.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, now);
    g.gain.linearRampToValueAtTime(0, now + 0.3);
    src.connect(bpf).connect(g).connect(_sfxGain);
    src.start(now); src.stop(now + 0.32);
  } catch(_) {}
}

// Dreiklang D-F#-A aufsteigend — Sieg
function _sfxVictory(ctx, now) {
  [[293.66, 0], [370, 0.1], [440, 0.2]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    osc.type  = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const t = now + delay;
    g.gain.setValueAtTime(0.18, t);
    g.gain.linearRampToValueAtTime(0, t + 0.3);
    osc.connect(g).connect(_sfxGain);
    osc.start(t); osc.stop(t + 0.35);
  });
}

// Absteigende Noten A-F-D — Niederlage
function _sfxDefeat(ctx, now) {
  [[440, 0], [349.23, 0.2], [293.66, 0.4]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    osc.type  = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const t = now + delay;
    g.gain.setValueAtTime(0.15, t);
    g.gain.linearRampToValueAtTime(0, t + 0.35);
    osc.connect(g).connect(_sfxGain);
    osc.start(t); osc.stop(t + 0.38);
  });
}

// Blubbern — Alchemie (Rauschen + LFO auf Bandpass)
function _sfxAlchemy(ctx, now) {
  try {
    const bufSize = Math.floor(ctx.sampleRate * 0.8);
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type  = 'bandpass';
    bpf.frequency.value = 400;
    bpf.Q.value = 3;
    // LFO auf Frequenz des Bandpass
    const lfo = ctx.createOscillator();
    lfo.type  = 'sine';
    lfo.frequency.value = 6;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain).connect(bpf.frequency);
    lfo.start(now); lfo.stop(now + 0.82);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.10, now);
    g.gain.linearRampToValueAtTime(0, now + 0.8);
    src.connect(bpf).connect(g).connect(_sfxGain);
    src.start(now); src.stop(now + 0.82);
  } catch(_) {}
}

// Helle aufsteigende Skala — Achievement freigeschaltet
function _sfxAchievement(ctx, now) {
  const freqs = [293.66, 329.63, 370, 415.30, 440, 587.33]; // D E F# Ab A D
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type  = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const t = now + i * 0.06;
    g.gain.setValueAtTime(0.15, t);
    g.gain.linearRampToValueAtTime(0, t + 0.18);
    osc.connect(g).connect(_sfxGain);
    osc.start(t); osc.stop(t + 0.2);
  });
}

// Helles "kling" — Münze / Gold
function _sfxCoin(ctx, now) {
  const osc = ctx.createOscillator();
  osc.type  = 'triangle';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, now);
  g.gain.linearRampToValueAtTime(0, now + 0.12);
  osc.connect(g).connect(_sfxGain);
  osc.start(now); osc.stop(now + 0.14);
}

// Sanftes Abklingen — Einschlafen
function _sfxSleep(ctx, now) {
  const osc = ctx.createOscillator();
  osc.type  = 'sine';
  osc.frequency.setValueAtTime(350, now);
  osc.frequency.linearRampToValueAtTime(180, now + 1.0);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, now);
  g.gain.linearRampToValueAtTime(0, now + 1.0);
  osc.connect(g).connect(_sfxGain);
  osc.start(now); osc.stop(now + 1.05);
}

// Aufsteigende Quinte — Level Up
function _sfxLevelUp(ctx, now) {
  const osc = ctx.createOscillator();
  osc.type  = 'triangle';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(450, now + 0.3);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, now);
  g.gain.linearRampToValueAtTime(0, now + 0.32);
  osc.connect(g).connect(_sfxGain);
  osc.start(now); osc.stop(now + 0.35);
}

// Minimales "tick" — UI-Klick
function _sfxClick(ctx, now) {
  const osc = ctx.createOscillator();
  osc.type  = 'sine';
  osc.frequency.value = 800;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.10, now);
  g.gain.linearRampToValueAtTime(0, now + 0.05);
  osc.connect(g).connect(_sfxGain);
  osc.start(now); osc.stop(now + 0.06);
}

/* ══════════════════════════════════════════════════════════════
   Kontext-Manager: welche Musik gerade passend ist
   ══════════════════════════════════════════════════════════════ */

function updateMusicForContext() {
  if (typeof combat !== 'undefined' && combat.active) {
    playMusic('combat');
    return;
  }
  const tavernIds = [CONTENT.TAVERNE, CONTENT.LETHKAR_TAVERNE];
  if (tavernIds.includes(currentContent)) {
    playMusic('tavern');
    return;
  }
  playMusic('main');
}

/* ══════════════════════════════════════════════════════════════
   Settings-Funktionen
   ══════════════════════════════════════════════════════════════ */

function setMusicVolume(v) {
  audioSettings.musicVolume = Math.max(0, Math.min(1, v));
  syncAudioGains();
  saveAudioSettings();
}

function setMusicEnabled(b) {
  audioSettings.musicEnabled = b;
  syncAudioGains();
  if (!b) stopCurrentMusic();
  else { _currentTrack = null; updateMusicForContext(); }
  saveAudioSettings();
}

function setSfxVolume(v) {
  audioSettings.sfxVolume = Math.max(0, Math.min(1, v));
  syncAudioGains();
  saveAudioSettings();
}

function setSfxEnabled(b) {
  audioSettings.sfxEnabled = b;
  syncAudioGains();
  saveAudioSettings();
}

/* ── Vorlese-Vertonung (Prototyp) ──────────────────────────────
   Eigenes HTMLAudioElement (#dialog-audio-player, index.html), KEIN Web-
   Audio-Gain-Node wie Musik/SFX oben — deshalb eigene Sync-Funktion statt
   syncAudioGains(). Lautstärke/Stumm gelten global für jede Vertonung,
   unabhängig davon, welcher Dialog gerade offen ist. */
function syncNarrationAudio() {
  const player = document.getElementById('dialog-audio-player');
  if (!player) return;
  player.volume = audioSettings.narrationVolume;
  player.muted  = !audioSettings.narrationEnabled;
}

function setNarrationVolume(v) {
  audioSettings.narrationVolume = Math.max(0, Math.min(1, v));
  syncNarrationAudio();
  saveAudioSettings();
}

function setNarrationEnabled(b) {
  audioSettings.narrationEnabled = b;
  syncNarrationAudio();
  saveAudioSettings();
}

function setNarrationAutoplay(b) {
  audioSettings.narrationAutoplay = b;
  saveAudioSettings();
}

/* ── Musik-Ducking während vertonter Dialoge ──────────────────────
   Solange ein Dialog mit TTS-Vertonung offen ist, wird die Musik auf 10%
   ABGESENKT, damit die Vorlese-Stimme verständlich bleibt — beim Schließen
   springt sie auf den vorherigen Wert zurück. Reine Absenkung, keine
   Anhebung: hat der Spieler die Musik selbst schon leiser als 10% (oder per
   musicEnabled=false ganz aus) eingestellt, bleibt das unangetastet — TTS
   soll niemals lauter/hörbarer machen, was der Spieler bewusst leiser
   wollte (User-Korrektur 19.07.2026). Rein TEMPORÄR: ändert
   `audioSettings.musicVolume` zwar kurzzeitig (damit syncAudioGains() den
   gewohnten Pfad nutzen kann), speichert aber NIE über saveAudioSettings()
   — der eigentliche User-Wert in localStorage bleibt unberührt. */
let _preDuckMusicVolume = null;

function duckMusicForNarration() {
  if (_preDuckMusicVolume !== null) return; // schon geduckt
  _preDuckMusicVolume = audioSettings.musicVolume;
  if (audioSettings.musicEnabled && audioSettings.musicVolume > 0.1) {
    audioSettings.musicVolume = 0.1;
    syncAudioGains();
  }
}

function restoreMusicAfterNarration() {
  if (_preDuckMusicVolume === null) return;
  audioSettings.musicVolume = _preDuckMusicVolume;
  _preDuckMusicVolume = null;
  syncAudioGains();
}

function saveAudioSettings() {
  try { localStorage.setItem('audioSettings', JSON.stringify(audioSettings)); } catch(_) {}
}

function loadAudioSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('audioSettings') || 'null');
    if (s && typeof s === 'object') audioSettings = { ...audioSettings, ...s };
  } catch(_) {}
}
