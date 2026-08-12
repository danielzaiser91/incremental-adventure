// Verifiziert: letzter Dialog-Button heißt "Schließen", Zwischenseiten "Weiter".
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///C:/code/ai/incremental%20adventure/index.html');
  await page.waitForFunction(() => typeof showMonologue === 'function');

  // Testfall 1: Monolog mit 2 Seiten
  const labels = await page.evaluate(async () => {
    const grab = () => [...document.querySelectorAll('#dialog-actions button')]
      .map(b => b.querySelector('.dialog-btn-main')?.textContent.trim() || b.textContent.trim());
    showMonologue('Test', ['Erste Seite.', 'Zweite Seite.']);
    const page1 = grab();
    document.querySelector('#dialog-actions button').click();
    const page2 = grab();
    return { page1, page2 };
  });
  console.log('Monolog Seite 1:', JSON.stringify(labels.page1), '| Seite 2:', JSON.stringify(labels.page2));

  // Testfall 2: Story-Eintrag (showStoryEntryDialog) mit Mehrseiten-Text
  const story = await page.evaluate(async () => {
    const grab = () => [...document.querySelectorAll('#dialog-actions button')]
      .map(b => b.querySelector('.dialog-btn-main')?.textContent.trim() || b.textContent.trim());
    closeDialog();
    await new Promise(r => setTimeout(r, 300));
    const entry = STORY_ENTRIES[0]; // 1.1, 3 Absätze
    showStoryEntryDialog(entry);
    const out = [grab()];
    while (out.length < 10) {
      const btn = document.querySelector('#dialog-actions button');
      const label = btn.querySelector('.dialog-btn-main')?.textContent.trim() || btn.textContent.trim();
      if (label !== 'Weiter') break;
      btn.click();
      out.push(grab());
    }
    return out;
  });
  console.log('Story-Seiten:', JSON.stringify(story));

  const ok = labels.page1[0] === 'Weiter' && labels.page2[0] === 'Schließen'
    && story[0][0] === 'Weiter' && story[story.length - 1][0] === 'Schließen';
  console.log(ok ? 'VERIFIKATION OK' : 'VERIFIKATION FEHLGESCHLAGEN');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
