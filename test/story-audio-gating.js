// Verifiziert die Audio-UI-Schranke (User-Entscheidung 12.08.2026):
// Story-Einträge MIT Wort-Zeitstempeln zeigen die Vorlese-Steuerung,
// Einträge OHNE zeigen sie nicht (statt einer kaputt wirkenden Wiedergabe).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--mute-audio'] });
  const page = await browser.newPage();
  await page.goto('file:///C:/code/ai/incremental%20adventure/index.html');
  await page.waitForFunction(() => typeof showStoryEntryDialog === 'function');

  // Echte Alignment-Daten für 1.1 in den Cache legen (unter file:// läuft
  // der fetch-Prefetch nicht — so testen wir die Schranke deterministisch).
  const words = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'tts', 'audio', 'story-1-1.words.json'), 'utf8'));

  const result = await page.evaluate(async (wordData) => {
    const visible = () => {
      const el = document.getElementById('dialog-audio-controls');
      return el && !el.classList.contains('hidden');
    };
    _storyWordsCache['1.1'] = wordData.word_segments || wordData;
    showStoryEntryDialog(STORY_ENTRIES[0]);            // 1.1 — MIT Timing
    const withWords = visible();
    closeDialog();
    await new Promise(r => setTimeout(r, 300));
    delete _storyWordsCache['1.4'];
    showStoryEntryDialog(STORY_ENTRIES.find(e => e.id === '1.4')); // OHNE Timing
    const withoutWords = visible();
    return { withWords, withoutWords };
  }, words);

  console.log('Mit Timing sichtbar:', result.withWords, '| Ohne Timing sichtbar:', result.withoutWords);
  const ok = result.withWords === true && result.withoutWords === false;
  console.log(ok ? 'VERIFIKATION OK' : 'VERIFIKATION FEHLGESCHLAGEN');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
