/* ══════════════════════════════════════════════════════════════
   dialog.js — Modales Dialogfenster für einmalige Story-Momente
   Legt sich über das gesamte UI und zieht den vollen Fokus auf sich.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* Maximale Zeichenlänge einer einzelnen Dialog-Seite. Längere Texte werden
   automatisch an Satzgrenzen in mehrere Seiten aufgeteilt (siehe
   splitLongDialogPages()) — das hält die Dialogbox in einer vorhersehbaren
   Höhenspanne, statt bei jedem Knoten/jeder Seite spürbar zu "hüpfen". */
const DIALOG_MAX_PAGE_LENGTH = 200;
const DIALOG_HISTORY_LIMIT   = 30;

/** Teilt zu lange Textseiten an Satzgrenzen in mehrere kürzere Seiten auf.
    Kurze Seiten bleiben unverändert. */
function splitLongDialogPages(pages) {
  const result = [];
  pages.forEach(page => {
    if (page.length <= DIALOG_MAX_PAGE_LENGTH) { result.push(page); return; }

    const sentences = page.match(/[^.!?]+[.!?]+(\s+|$)/g) || [page];
    let current = '';
    sentences.forEach(sentence => {
      if (current && (current + sentence).length > DIALOG_MAX_PAGE_LENGTH) {
        result.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    });
    if (current.trim()) result.push(current.trim());
  });
  return result;
}

/**
 * Gemeinsame Grundlage für JEDEN mehrseitigen Dialog (Ich-Monologe,
 * Story-Einträge, NPC-Gespräche): zeigt genau EINE Textseite pro
 * Dialogfenster, blättert per "Weiter"-Button, und zeigt die eigentlichen
 * `finalButtons` erst auf der letzten Seite. So bleibt die Dialogbox über
 * jede Art von Dialog hinweg in einer ähnlichen, vorhersehbaren Höhe —
 * statt mehrere Absätze gleichzeitig zu stapeln (siehe SKILL.md).
 * @param {string} title
 * @param {string[]} pages - bereits ggf. per splitLongDialogPages() aufgeteilt
 * @param {{label:string, onClick:Function, disabled?:boolean, reason?:string}[]} finalButtons
 * @param {string} [audioSrc] - optionale Vertonung der GESAMTEN (noch nicht
 *   paginierten) Eintrags-Rohfassung; erscheint auf JEDER Seite als
 *   gleichbleibender Vorlese-Button (siehe showDialog()), damit der Spieler
 *   von jeder Seite aus starten/pausieren kann, ohne dass die Wiedergabe bei
 *   einem Seitenwechsel neu beginnt.
 */
function showPaginatedDialog(title, pages, finalButtons, rewardHtml, audioSrc) {
  let i = 0;
  const showPage = () => {
    const isLast = i === pages.length - 1;
    if (isLast) {
      // Kurze Sperre nach dem Seitenwechsel verhindert, dass ein schneller
      // Doppelklick auf "Weiter" versehentlich den ersten Final-Button trifft.
      // Closure-Ansatz: kein DOM-Neuaufbau, nur armed-Flag.
      let armed = false;
      setTimeout(() => { armed = true; }, 250);
      const guardedFinal = finalButtons.map(btn => ({
        ...btn,
        onClick: (...args) => { if (armed) btn.onClick(...args); }
      }));
      if (rewardHtml) {
        showDialog({ title, text: [pages[i]], html: `<p>${pages[i]}</p>${rewardHtml}`, buttons: guardedFinal, audioSrc });
      } else {
        showDialog({ title, text: [pages[i]], buttons: guardedFinal, audioSrc });
      }
    } else {
      showDialog({
        title,
        text: [pages[i]],
        buttons: [{ label: 'Weiter', onClick: () => { i += 1; showPage(); } }],
        audioSrc
      });
    }
  };
  showPage();
}

/**
 * Öffnet das modale Story-/Dialogfenster.
 * @param {{ title: string, text?: string[]|string, html?: string,
 *   buttons: {label:string, onClick:Function, disabled?:boolean, reason?:string}[],
 *   boxClass?: string }} opts
 *
 * `disabled` + `reason` erlauben sichtbare, aber gesperrte Antwortoptionen
 * (z.B. NPC-Dialogoptionen, die eine Bedingung wie Gold oder ein Item
 * voraussetzen) — der Grund erscheint als Tooltip auf dem Button.
 *
 * `html` ist ein Hintertürchen für Dialoge mit eigenem Markup (z.B. der
 * kategorisierte Changelog-Dialog, siehe save.js) — überschreibt `text`
 * für die ANZEIGE, `text` wird trotzdem (falls angegeben) fürs
 * `dialogHistory`-Log verwendet. `boxClass` setzt eine zusätzliche Klasse
 * auf `#dialog-box` (z.B. für eine größere Variante) — wird bei JEDEM
 * Aufruf zurückgesetzt, damit sie nicht in den nächsten, unabhängigen
 * Dialog durchsickert. `audioSrc` (optional) zeigt eine Vorlese-Steuerung,
 * siehe updateDialogAudio() — nie Autoplay, Wiedergabe startet standardmäßig
 * ausschließlich durch einen bewussten Klick (Ausnahme: die explizite,
 * standardmäßig AUSGESCHALTETE Autoplay-Einstellung). `audioPageStart`/
 * `audioPageEnd` (optional, Sekunden) grenzen den Textabschnitt der aktuell
 * angezeigten Seite innerhalb derselben Audiodatei ein (siehe story.js,
 * Wort-Highlighting-Prototyp): Seitenwechsel positioniert auf `audioPageStart`,
 * Erreichen von `audioPageEnd` pausiert automatisch — dieselbe Datei wird so
 * abschnittsweise "gesplittet", ohne separate Dateien pro Seite zu brauchen.
 */
function showDialog({ title, text, html, buttons, boxClass, audioSrc, audioPageStart, audioPageEnd }) {
  const overlay   = document.getElementById('dialog-overlay');
  const box       = document.getElementById('dialog-box');
  const titleEl   = document.getElementById('dialog-title');
  const textEl    = document.getElementById('dialog-text');
  const actionsEl = document.getElementById('dialog-actions');
  if (!overlay || !titleEl || !textEl || !actionsEl) return;

  titleEl.textContent = title;
  if (box) box.className = 'dialog-box' + (boxClass ? ` ${boxClass}` : '');
  updateDialogAudio(audioSrc, audioPageStart, audioPageEnd);

  const paragraphs = text ? (Array.isArray(text) ? text : [text]) : [];
  textEl.innerHTML = html ?? paragraphs.map(p => `<p>${p}</p>`).join('');

  // Jede gezeigte Dialogseite ist ein eigener Verlaufseintrag (siehe
  // dialogHistory, state.js) — getrennt von toastHistory, damit beide im
  // Einstellungs-Verlauf per Filter sauber unterscheidbar bleiben.
  if (paragraphs.length) {
    dialogHistory.unshift({ title, text: paragraphs, at: Date.now() });
    if (dialogHistory.length > DIALOG_HISTORY_LIMIT) dialogHistory.length = DIALOG_HISTORY_LIMIT;
  }

  actionsEl.innerHTML = '';
  (buttons && buttons.length ? buttons : [{ label: 'Weiter', onClick: closeDialog }])
    .forEach((btn, i) => {
      const b = document.createElement('button');
      b.className = 'action-btn dialog-btn' + (btn.disabled ? ' btn-disabled' : '');
      b.id = `dialog-btn-${i}`;

      // Sperrgrund nie nur im Tooltip: eigene, mit Schloss-Symbol markierte
      // Zeile unterhalb des Haupttexts, zusätzlich auch als Tooltip.
      if (btn.reason) {
        b.innerHTML = `<span class="dialog-btn-main">${btn.label}</span>` +
                       `<span class="dialog-btn-reason">🔒 ${btn.reason}</span>`;
        b.title = btn.reason;
      } else {
        b.textContent = btn.label;
      }

      if (btn.disabled) {
        b.disabled = true;
      } else {
        b.addEventListener('click', btn.onClick);
      }
      actionsEl.appendChild(b);
    });

  overlay.classList.remove('hidden');
  document.body.classList.add('dialog-open');

  requestAnimationFrame(() => overlay.classList.add('dialog-visible'));
}

/**
 * Prototyp der Vertonungs-Einbindung (TTS-Projekt, siehe tts/PLAN.md).
 * Zeigt/versteckt die Vorlese-Steuerung (`#dialog-audio-controls`: Play/Pause,
 * Lautstärke-Regler, Stumm-Taste) je nachdem, ob die aktuelle Dialogseite eine
 * `audioSrc` mitbringt, und bindet sie an das EINE geteilte, nie neu erzeugte
 * `<audio>`-Element (`#dialog-audio-player`, index.html) — dadurch läuft die
 * Wiedergabe über mehrere Dialogseiten desselben Eintrags hinweg weiter,
 * statt bei jedem "Weiter"-Klick neu anzusetzen. Lädt die Datei bewusst erst
 * BEIM ERSTEN Erscheinen dieser audioSrc (kein Preload). Schlägt das Laden
 * fehl (Datei existiert noch nicht, siehe tts/progress.json), versteckt sich
 * die Steuerung wieder selbst.
 *
 * Lautstärke/Stumm kommen aus den globalen Audio-Einstellungen
 * (audioSettings.narration*, siehe audio.js/renderSettings()) — Default
 * 10 % Lautstärke, unstumm, KEIN Autoplay (siehe unten). Die Stumm-Taste HIER
 * versteckt die Steuerung nicht mehr (wie in einer früheren Version), sondern
 * bleibt bedienbar — Stummschalten ist jetzt ein echter Toggle, kein Grund,
 * die ganze Steuerung zu verstecken.
 */
function updateDialogAudio(audioSrc, pageStart, pageEnd) {
  const wrap    = document.getElementById('dialog-audio-controls');
  const playBtn = document.getElementById('dialog-audio-play-btn');
  const volume  = document.getElementById('dialog-audio-volume');
  const muteBtn = document.getElementById('dialog-audio-mute-btn');
  const player  = document.getElementById('dialog-audio-player');
  if (!wrap || !playBtn || !volume || !muteBtn || !player) return;
  syncNarrationAudio();

  // Modul-globale Seitengrenzen fürs automatische Pausieren am Seitenende
  // (siehe scheduleEndPause() unten) — pro Seite neu gesetzt, unabhängig
  // davon, ob überhaupt Audio-Steuerung sichtbar ist.
  _currentPageEnd = typeof pageEnd === 'number' ? pageEnd : null;
  _currentPageStart = typeof pageStart === 'number' ? pageStart : null;

  if (!audioSrc) {
    wrap.classList.add('hidden');
    setActiveWordSpans(null);
    if (!player.paused) player.pause();
    restoreMusicAfterNarration();
    return;
  }

  // Musik während der Vertonung leiser stellen (siehe audio.js) — läuft pro
  // Seite erneut, ist aber idempotent (duckMusicForNarration() merkt sich
  // den Ausgangswert nur beim ERSTEN Mal).
  duckMusicForNarration();

  wrap.classList.remove('hidden');

  const setPlayIcon = playing => {
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Vorlesen pausieren' : 'Vorlesen');
    playBtn.classList.toggle('dialog-audio-playing', playing);
  };
  const setMuteIcon = () => {
    const muted = !audioSettings.narrationEnabled;
    muteBtn.textContent = muted ? '🔇' : '🔈';
    muteBtn.setAttribute('aria-label', muted ? 'Ton einschalten' : 'Stumm schalten');
    muteBtn.classList.toggle('dialog-audio-muted', muted);
  };

  const isNewSrc = player.dataset.src !== audioSrc;
  volume.value = audioSettings.narrationVolume;
  setMuteIcon();
  setPlayIcon(!player.paused && !isNewSrc);

  // Zwei GRUNDVERSCHIEDENE Fälle, bewusst nicht mehr über eine gemeinsame
  // Hilfsfunktion mit readyState-Prüfung geteilt (das war der Bug: bei einer
  // bereits fertig geladenen Datei — z.B. nach "Weiter" auf Seite 2/3 — kann
  // sich readyState nach einem Pause/Seek anders verhalten als direkt nach
  // dem ersten Laden, wodurch der Seek in den "warte auf loadedmetadata"-Zweig
  // fiel — dieses Event feuert aber kein zweites Mal, der Seek ging verloren
  // und die Wiedergabe lief einfach ab der letzten Position weiter, also von
  // 0 nach dem vorherigen automatischen Stopp. Ergebnis: "Weiter" spielte
  // wieder Seite 1 statt zur neuen Seite zu springen (User-Feedback
  // 19.07.2026).
  //
  // Fall A — Datei bereits geladen (gleicher Eintrag, nur Seitenwechsel):
  // Metadaten sind GARANTIERT vorhanden, Seek passiert immer sofort/synchron.
  const applySeekNow = () => {
    if (typeof pageStart !== 'number') return;
    try { player.currentTime = pageStart; } catch (_) {}
    scheduleEndPause();
  };
  // Fall B — Datei wird gerade FRISCH geladen (erster Klick/Autoplay auf
  // diesen audioSrc): Metadaten evtl. noch nicht da (bei `preload="none"`
  // lädt der Browser nichts von selbst — erst `play()` stößt das Laden an).
  // `play()` läuft deshalb IMMER zuerst, der Seek hängt sich separat an
  // `loadedmetadata` — kurzes Anspielen ab 0 bis die Metadaten da sind (bei
  // lokalen WAVs praktisch nicht hörbar), aber nie wieder gar kein Ton.
  const seekWhenFreshlyLoaded = () => {
    if (typeof pageStart !== 'number') return;
    if (player.readyState >= 1) applySeekNow();
    else player.addEventListener('loadedmetadata', applySeekNow, { once: true });
  };

  // Ereignis-Listener/Regler-Bindung nur EINMAL (nicht bei jedem Seitenwechsel
  // neu) — Ziel-Quelle/-Grenzen liegen in Modul-State bzw. Data-Attributen,
  // damit die Handler sie zur Klickzeit aktuell nachschlagen.
  if (!player.dataset.boundEvents) {
    player.dataset.boundEvents = '1';
    player.addEventListener('play',  () => { setPlayIcon(true); scheduleEndPause(); });
    player.addEventListener('pause', () => { setPlayIcon(false); clearEndPauseTimer(); });
    player.addEventListener('ended', () => setPlayIcon(false));
    // `timeupdate` bleibt als grobes Sicherheitsnetz (falls der Timer aus
    // irgendeinem Grund nicht feuert, z.B. Tab im Hintergrund gedrosselt) —
    // die eigentliche Präzision kommt vom Timer in scheduleEndPause().
    player.addEventListener('timeupdate', () => {
      highlightWordAt(player.currentTime);
      if (_currentPageEnd !== null && !player.paused && player.currentTime >= _currentPageEnd) {
        pauseAtPageEnd(player);
      }
    });
    player.addEventListener('error', () => {
      wrap.classList.add('hidden');
      setPlayIcon(false);
    });
    volume.addEventListener('input', () => setNarrationVolume(parseFloat(volume.value)));
    muteBtn.addEventListener('click', () => {
      setNarrationEnabled(!audioSettings.narrationEnabled);
      setMuteIcon();
    });
  }

  const load = () => { player.src = audioSrc; player.dataset.src = audioSrc; syncNarrationAudio(); };
  const play = () => player.play().catch(() => wrap.classList.add('hidden'));

  // Autoplay ist eine explizite, standardmäßig AUSGESCHALTETE Spieler-
  // Einstellung (siehe state.js audioSettings.narrationAutoplay). Gilt für
  // JEDEN Seitenwechsel (nicht nur den allerersten Klick) — sonst bräuchte
  // es nach jeder automatisch pausierten Seite wieder einen manuellen Klick,
  // was dem Sinn von "automatisch" widerspricht (User-Feedback 19.07.2026).
  if (!isNewSrc) {
    // Gleicher Eintrag, neue Dialogseite: Wiedergabe auf den Anfang des jetzt
    // gezeigten Textabschnitts umsetzen — "splittet" dieselbe Datei
    // abschnittsweise, ohne pro Seite eine eigene Audiodatei zu brauchen.
    applySeekNow();
    if (audioSettings.narrationAutoplay) play();
  }

  playBtn.onclick = () => {
    if (player.dataset.src !== audioSrc) { load(); play(); seekWhenFreshlyLoaded(); return; }
    if (player.paused) play();
    else player.pause();
  };

  if (isNewSrc && audioSettings.narrationAutoplay) {
    load();
    player.play().catch(() => {});
    seekWhenFreshlyLoaded();
  }
}

/**
 * Plant/verwirft den präzisen Stopp-Timer für das Ende der gerade
 * angezeigten Seite. `timeupdate` allein feuert zu selten (typischerweise
 * alle ~250ms), um knapp aufeinanderfolgende Wörter sauber zu trennen — beim
 * Testen war z.B. noch das erste Wort der NÄCHSTEN Seite hörbar, bevor
 * pausiert wurde (User-Feedback 19.07.2026). `setTimeout` mit der exakt
 * verbleibenden Zeit ist deutlich präziser. Wird bei jedem Seek/Play-Start
 * neu berechnet und bei jedem Pause verworfen, damit kein veralteter Timer
 * eine spätere, unabhängige Wiedergabe fälschlich unterbricht.
 */
let _pageEndTimer = null;

function clearEndPauseTimer() {
  if (_pageEndTimer) { clearTimeout(_pageEndTimer); _pageEndTimer = null; }
}

function scheduleEndPause() {
  clearEndPauseTimer();
  const player = document.getElementById('dialog-audio-player');
  if (_currentPageEnd === null || !player || player.paused) return;
  // `currentTime` ist NaN, solange keine Metadaten geladen sind (z.B. das
  // 'play'-Event feuert bereits, bevor preload="none" überhaupt etwas
  // geladen hat). NaN macht remainingMs zu NaN, und setTimeout(fn, NaN)
  // feuert dann SOFORT (Browser behandeln NaN wie 0ms) — die Wiedergabe
  // pausierte dadurch augenblicklich nach dem allerersten Play einer frisch
  // geladenen Datei (Bug, gefunden 19.07.2026 beim Testen von Autoplay).
  // Kein Problem: sobald die Metadaten da sind, ruft seekToPageStart()
  // scheduleEndPause() ohnehin erneut mit einem gültigen currentTime auf.
  if (Number.isNaN(player.currentTime)) return;
  const remainingMs = (_currentPageEnd - player.currentTime) * 1000;
  if (remainingMs <= 0) { pauseAtPageEnd(player); return; }
  _pageEndTimer = setTimeout(() => pauseAtPageEnd(player), remainingMs);
}

/** Pausiert am Seitenende UND setzt die Position auf den Seitenanfang
    zurück — sonst würde ein erneuter Play-Klick sofort wieder am (bereits
    erreichten) Seitenende ansetzen und nichts hörbar abspielen. */
function pauseAtPageEnd(player) {
  clearEndPauseTimer();
  player.pause();
  if (_currentPageStart !== null) { try { player.currentTime = _currentPageStart; } catch (_) {} }
}

/**
 * Wort-Highlighting-Prototyp: `spans` ist `[{el, start, end}]` für die GERADE
 * angezeigte Dialogseite (von story.js nach dem Rendern der Wort-`<span>`s
 * übergeben, siehe bindWordHighlight()). `null` schaltet die Hervorhebung ab
 * (Seiten/Einträge ohne Zeitstempel-Daten). Modul-globaler State statt
 * Parameter an jede Funktion, weil `timeupdate` unabhängig von story.js feuert.
 */
let _activeWordSpans = null;
/** Zeitpunkt (Sekunden), an dem die Wiedergabe der aktuell angezeigten Seite
    automatisch pausiert (siehe updateDialogAudio()) — `null` = keine Grenze. */
let _currentPageEnd = null;
/** Anfang der aktuell angezeigten Seite — Rücksprungziel nach dem
    automatischen Pausieren (siehe pauseAtPageEnd()). */
let _currentPageStart = null;

function setActiveWordSpans(spans) {
  if (_activeWordSpans) _activeWordSpans.forEach(w => w.el.classList.remove('dialog-word-active'));
  _activeWordSpans = spans && spans.length ? spans : null;
  if (_activeWordSpans) {
    const player = document.getElementById('dialog-audio-player');
    highlightWordAt(player ? player.currentTime : 0);
  }
}

function highlightWordAt(t) {
  if (!_activeWordSpans) return;
  for (const w of _activeWordSpans) {
    w.el.classList.toggle('dialog-word-active', t >= w.start && t < w.end);
  }
}

/**
 * Zeigt eine kurze Folge von Ich-Monolog-Seiten ("Weiter" blättert um, die
 * letzte Seite schließt + ruft `onClose` auf). Gemeinsame Grundlage für alle
 * ad-hoc Spielercharakter-Monologe (Jobsuche, Tavernen-Ankunft, erste Arbeit,
 * erster Level-Up, ...), die KEIN eigener `STORY_ENTRIES`-Eintrag sein müssen,
 * weil sie nicht in der Chronik nachlesbar sein sollen.
 * @param {string} title
 * @param {string[]} pages
 * @param {Function} [onClose]
 */
function showMonologue(title, pages, onClose) {
  showPaginatedDialog(title, splitLongDialogPages(pages), [
    { label: 'Weiter', onClick: () => closeDialog(onClose) }
  ]);
}

/**
 * Schließt das modale Dialogfenster.
 * @param {Function} [onClosed] - wird ERST nach Ende der Ausblend-Animation
 *   aufgerufen (180ms), nicht synchron. Wichtig bei verketteten Dialogen
 *   (z.B. story.js/actions.js): wenn `onClosed` selbst sofort einen neuen
 *   Dialog öffnet, würde der hier verzögerte `hidden`-Klassenwechsel sonst
 *   180ms später den FALSCHEN (neuen) Dialog unsichtbar machen, weil
 *   `overlay` von beiden Aufrufen geteilt wird. Deshalb läuft der
 *   Folge-Callback grundsätzlich erst nach Abschluss dieser Animation.
 */
function closeDialog(onClosed) {
  const overlay = document.getElementById('dialog-overlay');
  if (!overlay) { if (onClosed) onClosed(); return; }

  const player = document.getElementById('dialog-audio-player');
  if (player && !player.paused) player.pause();
  clearEndPauseTimer();
  setActiveWordSpans(null);
  _currentPageEnd = null;
  _currentPageStart = null;
  restoreMusicAfterNarration();

  overlay.classList.remove('dialog-visible');
  document.body.classList.remove('dialog-open');

  setTimeout(() => {
    overlay.classList.add('hidden');
    if (onClosed) onClosed();
  }, 180);
}

/* ── Konfetti-Animation ───────────────────────────────────────
   Erzeugt 120 farbige Partikel, die vom oberen Bildschirmrand fallen.
   Der Container wird nach 6 Sekunden automatisch entfernt. */
function launchConfetti() {
  const existing = document.getElementById('confetti-container');
  if (existing) existing.remove();

  const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e91e63'];
  const container = document.createElement('div');
  container.id = 'confetti-container';
  document.body.appendChild(container);

  for (let i = 0; i < 120; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    const size = 6 + Math.random() * 8;
    el.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `left:${Math.random() * 100}%`,
      `top:-${20 + Math.random() * 40}px`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
      `animation-duration:${2.5 + Math.random() * 2.5}s`,
      `animation-delay:${Math.random() * 1.5}s`
    ].join(';');
    container.appendChild(el);
  }

  setTimeout(() => { if (container.parentNode) container.remove(); }, 6000);
}
