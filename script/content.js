/* ══════════════════════════════════════════════════════════════
   content.js — Mittlere Spalte: interaktiver Feature-Bereich
   Im Fokus stehen klickbare Spielelemente, nicht Fließtext.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/** Ruft den passenden Sub-Renderer je nach currentContent auf. */
function renderContent() {
  const area = document.getElementById('content-area');
  if (!area) return;

  switch (currentContent) {
    case 'geschichte':    renderGeschichte(area);   break;
    case 'weltkarte':     renderWeltkarte(area);    break;
    case 'treutheim':     renderTreutheim(area);    break;
    case 'arbeitsplatz':  renderArbeitsplatz(area); break;
    case 'marktplatz':
      if (!marketVendor)            renderMarktplatzHub(area);
      else if (marketVendor === 'kraemer')  renderVendorKraemer(area);
      else if (marketVendor === 'schmiede') renderVendorSchmiede(area);
      else                           renderMarktplatzHub(area);
      break;
    case 'schlafplatz':   renderSchlafplatz(area);  break;
    case 'rohstoffe':     renderRohstoffe(area);    break;
    case 'taverne':       renderTaverne(area);      break;
    case 'inventar':      renderInventar(area);     break;
    case 'quests':        renderQuests(area);       break;
    case 'erfahrung':     renderErfahrung(area);    break;
    case 'errungenschaften': renderErrungenschaften(area); break;
    case 'pets':          renderPets(area);         break;
    case 'lehrer':        renderLehrer(area);        break;
    case 'jagdgebiet':    renderJagdgebiet(area);   break;
    case 'stadtwache':    renderStadtwache(area);   break;
    case 'meinhaus':      renderMeinHaus(area);     break;
    case 'schmiede':      renderSchmiede(area);     break;
    case 'automation':    renderAutomation(area);   break;
    case 'expedition':       renderExpedition(area);        break;
    case 'lethkar':          renderLethkar(area);           break;
    case 'alchemie':         renderAlchemie(area);          break;
    case 'lethkar_taverne':  renderLethkarTaverne(area);    break;
    case 'lethkar_markt':    renderLethkarMarkt(area);      break;
    case 'lethkar_schlafplatz': renderLethkarSchlafplatz(area); break;
    case 'chronik':       renderChronik(area);      break;
    case 'settings':      renderSettings(area);     break;
    default:              renderGeschichte(area);
  }
}

/* ── Generischer Werte-Modifikator-Tooltip ───────────────────────
   Überall dort, wo ein angezeigter Wert (Preis, Ertrag, Dauer, …) vom
   "neutralen" Basiswert abweicht, weil ein Skill/Debuff/Ausrüstungsstück
   ihn verändert, bekommt der Wert einen dezenten Hover-Indikator
   (gepunktete Unterstreichung). Im Tooltip steht der Basiswert, ein
   Trennstrich, und darunter JEDER aktive Effekt einzeln — grün, wenn er
   für den Spieler positiv ist (z.B. ein niedrigerer Preis), rot, wenn
   negativ (z.B. ein Debuff). Ohne Effekte gibt es keinen Indikator —
   ein unveränderter Basiswert braucht keinen Hinweis. */

/** Baut EINEN Effekt-Eintrag fürs Tooltip.
    @param {string} label - z.B. "Sparsamkeit" oder "Hungrig"
    @param {string} value - z.B. "-10%" oder "×0,85"
    @param {boolean} positive - bestimmt die Farbe (grün/rot) */
function valueEffectHtml(label, value, positive) {
  return `<div class="value-tooltip-effect ${positive ? 'value-tooltip-positive' : 'value-tooltip-negative'}">` +
    `<span>${label}</span><span>${value}</span></div>`;
}

/**
 * Umschließt einen bereits fertig formatierten Anzeige-String mit dem
 * Hover-Indikator + Tooltip — oder gibt ihn unverändert zurück, wenn die
 * Effekt-Liste leer ist (kein Unterschied zum Basiswert, kein Hinweis nötig).
 * @param {string} displayHtml - der im Layout sichtbare Wert, z.B. "14 Gold"
 * @param {string} baseLabel - z.B. "Basiskosten"
 * @param {string} baseValue - z.B. "16g"
 * @param {{label:string, value:string, positive:boolean}[]} effects
 */
function modifiedValueHtml(displayHtml, baseLabel, baseValue, effects) {
  if (!effects.length) return displayHtml;
  const effectRows = effects.map(e => valueEffectHtml(e.label, e.value, e.positive)).join('');
  return `<span class="value-modified" tabindex="0">${displayHtml}<span class="value-tooltip">` +
    `<div class="value-tooltip-base">${baseLabel}: ${baseValue}</div>` +
    `<hr class="value-tooltip-sep">${effectRows}</span></span>`;
}

/* ── Geschichte: rein erzählerischer Innenwelt-Bildschirm ────── */
function renderGeschichte(el) {
  if (storyState === 10100) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Vor den Toren Treutheims</div>
        <p class="location-card-desc">Ich habe es bis hierher geschafft. Jetzt oder nie.</p>
        <div class="feature-hero">
          <div class="feature-hero-icon">🏰</div>
          <button class="action-btn action-btn-primary" onclick="enterCity()">
            Das Stadttor betreten →
          </button>
        </div>
      </div>
    `;
    return;
  }

  if (storyState >= 20100) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Treutheim — danach</div>
        <div class="location-card">
          <div class="location-card-title">Ich bin nicht mehr dieselbe Person</div>
          <p class="location-card-desc">
            Wie es weitergeht, schreibt sich noch. Bis dahin lässt sich nachlesen, was bisher geschah.
          </p>
          <button class="action-btn" onclick="showContent('chronik')">📜 Zur Chronik</button>
        </div>
      </div>
    `;
    return;
  }

  const watchedBadge = storyState >= 10102
    ? `<div class="status-badge status-badge-warning">⚠ Ich habe das Gefühl, beobachtet zu werden.</div>`
    : '';

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Treutheim — Tag ${gameClock.day}</div>
      <div class="location-card">
        ${watchedBadge}
        <div class="location-card-title">Ich bin angekommen!</div>
        <p class="location-card-desc">
          Die Stadt ist lauter, schmutziger und kälter, als ich es mir erträumt hatte — aber sie ist
          auch voller Möglichkeiten, die es dort, wo ich herkomme, niemals gegeben hätte.
        </p>
        <p class="location-card-desc">
          Ich weiß, was ich will: nicht für immer ein gebeugter Rücken auf einem fremden Feld sein.
          Ich will ein Abenteurer werden — jemand mit einer Geschichte, die es wert ist, erzählt zu
          werden. Bis dahin ist es ein weiter Weg, und im Moment besteht er vor allem aus Schwielen
          und einem leeren Geldbeutel.
        </p>
      </div>
    </div>
  `;
}

/* ── Weltkarte: Übersicht bekannter (und unbekannter) Regionen ── */
function renderWeltkarte(el) {
  // Lethkar wird sichtbar sobald Kap-2 abgeschlossen und Mut ausreicht
  const canUnlockLethkar = storyState >= 20200 && mut.points >= 3 && !gameFlags.lethkarUnlocked;
  if (canUnlockLethkar) {
    gameFlags.lethkarUnlocked = true;
    maybeShowStoryDialog('3.0');
  }

  // Lethkar ist bekannt (Ziel auf Miras Brief) sobald der Brief entschlüsselt
  // wurde — auch wenn noch nicht freigeschaltet
  const lethkarHinted = storyState >= 20200 && mut.points < 3;

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Weltkarte</div>
      <div class="action-grid">

        <div class="action-card">
          <div class="action-card-icon">🏘</div>
          <div class="action-card-name">Treutheim</div>
          <p class="action-card-desc">Die erste Stadt auf meinem Weg — groß genug, um als Bauernsohn unbemerkt anzukommen.</p>
          <button class="action-btn" onclick="enterCity('treutheim')">Betreten</button>
        </div>

        ${gameFlags.lethkarUnlocked
          ? `<div class="action-card">
              <div class="action-card-icon">🏙</div>
              <div class="action-card-name">Lethkar</div>
              <p class="action-card-desc">Eine größere Stadt, drei Tage nördlich. Alchemisten, Händler, Geheimnisse — und die Adresse auf Miras Brief.</p>
              <button class="action-btn" onclick="enterCity('lethkar')">Betreten</button>
            </div>`
          : lethkarHinted
            ? `<div class="action-card action-card-locked">
                <div class="action-card-icon">🏙</div>
                <div class="action-card-name">Lethkar</div>
                <p class="action-card-desc">Drei Tage nördlich. Die Adresse aus dem Brief liegt dort. Ich bin noch nicht bereit — mir fehlt der Mut für diesen Schritt. (${mut.points}/3 ⚔)</p>
                <button class="action-btn btn-disabled" disabled>Noch nicht bereit</button>
              </div>`
            : `<div class="action-card action-card-locked">
                <div class="action-card-icon">🔒</div>
                <div class="action-card-name">???</div>
                <p class="action-card-desc">Unbekannte Gebiete jenseits der Hügel. Noch nicht erreichbar.</p>
                <button class="action-btn btn-disabled" disabled>Unentdeckt</button>
              </div>`
        }

      </div>
    </div>
  `;
}

/* ── Treutheim: Stadtkern mit immersiver Beschreibung + echten Orten ──
   Jeder Ort erscheint erst, sobald er relevant wird (siehe nav.js für die
   ausführliche Begründung) — "Die Felder" erst nach der Jobvermittlung,
   "Marktplatz" erst beim ersten Hunger-Debuff, "Schlafplatz" erst beim
   ersten Einbruch der Nacht. Die Taverne bleibt immer sichtbar. */
function renderTreutheim(el) {
  const places = [
    ...(gameFlags.jobUnlocked ? [{ id: 'arbeitsplatz', icon: '⚒',  name: 'Die Felder',
      desc: 'Vor den Stadtmauern erstrecken sich Felder, auf denen Tagelöhner wie ich für ein paar Münzen schuften.' }] : []),
    ...(gameFlags.hungerDialogShown ? [{ id: 'marktplatz', icon: '⚖',  name: 'Der Marktplatz',
      desc: 'Händler rufen ihre Waren aus. Es riecht nach frischem Brot, kaltem Metall und Schweiß.' }] : []),
    { id: 'taverne',      icon: '🍺', name: 'Die Taverne',
      desc: 'Hinter verrauchten Fenstern hallen Stimmen und Gelächter. Hier hört man, was wirklich in der Stadt los ist.' },
    ...(gameFlags.firstNightDialogShown ? [{ id: 'schlafplatz', icon: '🛏', name: 'Ein Platz zum Schlafen',
      desc: 'Wenn die Nacht kommt, brauche ich irgendwo ein Dach über dem Kopf — oder zumindest eine ruhige Ecke.' }] : []),
    ...(gameFlags.resourceGatheringUnlocked ? [{ id: 'rohstoffe', icon: '🌲', name: 'Sammelplatz',
      desc: 'Jenseits der Felder liegt ein Streifen Wildnis — Holz, Stein und Kräuter für jeden, der sie sammeln will.' }] : [])
  ];

  const cards = places.map(p => `
    <div class="action-card">
      <div class="action-card-icon">${p.icon}</div>
      <div class="action-card-name">${p.name}</div>
      <p class="action-card-desc">${p.desc}</p>
      <button class="action-btn" onclick="showContent('${p.id}')">Hingehen</button>
    </div>`).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Treutheim</div>
      <p class="location-card-desc" style="max-width: 480px; margin-bottom: 18px;">
        Eine Handelsstadt am Rand des Königreichs — laut, schmutzig und voller Möglichkeiten für
        jemanden, der von einem kargen Bauernhof kommt. Hier beginnt mein Weg.
      </p>
      <div class="action-grid">${cards}</div>
    </div>
  `;
}

/* ── Arbeitsplatz ─────────────────────────────────────────── */
function renderArbeitsplatz(el) {
  if (!gameFlags.jobUnlocked) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Arbeitsplatz</div>
        <div class="location-card">
          <p class="location-card-desc">Ich weiß noch nicht, wo ich hier arbeiten könnte.</p>
        </div>
      </div>
    `;
    return;
  }

  const night      = isNight();
  const busy       = gameFlags.isWorking;
  const pctStr     = Math.floor(workProgress) + '%';
  const reward     = getWorkReward();
  const tier       = getTirednessTier(needs.tiredness);
  const durationS  = (getWorkDurationMs() / 1000).toFixed(1);
  const tirednessGain = Math.round(getWorkTirednessGain());
  const hungerGain     = Math.round(getWorkHungerGain());

  const levelingUnlocked = skills.jobLeveling;
  const workLevel  = getWorkLevel(workStats.count);
  const progress   = getWorkLevelProgress(workStats.count);
  const currentDef = WORK_LEVELS[workLevel];
  const nextDef     = WORK_LEVELS[workLevel + 1];

  // Nur die nächste Stufe ist für die Entscheidung "weiterarbeiten?" relevant —
  // vergangene Boni hat der Spieler längst, künftige jenseits der nächsten
  // Stufe sind noch zu weit weg, um sie aufzulisten (siehe SKILL.md). Die
  // Vergleichs-Zeilen zeigen bewusst NUR die reinen Stufen-Basiswerte (ohne
  // Hunger/Müdigkeit/Ausrüstung) — Debuffs/Boni würden sonst den eigentlichen
  // Stufensprung verschleiern. Die tatsächlich wirkenden Werte inkl. jedes
  // einzelnen aktiven Effekts stehen separat unten in "Errechnete Werte".
  const xpLine = nextDef
    ? `${progress.into.toLocaleString('de-DE')} / ${progress.span.toLocaleString('de-DE')} Erfahrung`
    : 'Maximalstufe erreicht';

  let nextLevelBlock;
  if (nextDef) {
    const baseRewardNow     = currentDef.goldBase;
    const baseRewardNext    = nextDef.goldBase;
    const baseTirednessNow  = Math.round(WORK_TIREDNESS_GAIN * currentDef.gainMod);
    const baseTirednessNext = Math.round(WORK_TIREDNESS_GAIN * nextDef.gainMod);
    const baseHungerNow     = Math.round(WORK_HUNGER_GAIN * currentDef.gainMod);
    const baseHungerNext    = Math.round(WORK_HUNGER_GAIN * nextDef.gainMod);
    const baseDurationNow   = ((WORK_DURATION_BASE_MS * currentDef.durationMod) / 1000).toFixed(1);
    const baseDurationNext  = ((WORK_DURATION_BASE_MS * nextDef.durationMod) / 1000).toFixed(1);

    nextLevelBlock = `
      <div class="job-info-next-label">Nächste Stufe: Lvl ${workLevel + 1} — ${nextDef.label}</div>
      <div class="job-info-compare-row"><span>Ertrag (Basis)</span><span>${baseRewardNow}g → <strong>${baseRewardNext}g</strong></span></div>
      <div class="job-info-compare-row"><span>Müdigkeit/Arbeit (Basis)</span><span>${baseTirednessNow}% → <strong>${baseTirednessNext}%</strong></span></div>
      <div class="job-info-compare-row"><span>Hunger/Arbeit (Basis)</span><span>${baseHungerNow}% → <strong>${baseHungerNext}%</strong></span></div>
      <div class="job-info-compare-row"><span>Dauer (Basis)</span><span>${baseDurationNow}s → <strong>${baseDurationNext}s</strong></span></div>
      ${nextDef.specialEffect ? `<div class="job-info-special">✦ ${nextDef.specialEffect}</div>` : ''}`;
  } else {
    nextLevelBlock = `<div class="job-info-next-label">Keine weitere Stufe in Sicht</div>`;
  }

  // "Errechnete Werte": ganz unten im Panel, listet für jeden Wert, der
  // GERADE JETZT von irgendetwas (Ausrüstung, Skill, Hunger-/Müdigkeits-
  // Debuff, Stufen-Sonderbonus) abweicht, jeden einzelnen aktiven Effekt
  // plus den daraus resultierenden tatsächlichen Wert — Werte ohne jede
  // Abweichung tauchen hier gar nicht erst auf (siehe modifiedValueHtml()-
  // Philosophie: kein Hinweis ohne tatsächlichen Unterschied).
  const hungerTierNow = getHungerTier(needs.hunger);
  const rewardEffects = [];
  if (equipment.hands === 'ledergloves') rewardEffects.push({ label: 'Lederhandschuhe', value: '+1g', positive: true });
  if (equipment.guertel === 'arbeitsguertel') rewardEffects.push({ label: 'Arbeitsgürtel', value: '+1g', positive: true });
  if (gameFlags.foremanBonusGiven) rewardEffects.push({ label: 'Anerkennung des Vorarbeiters', value: '+1g', positive: true });
  if (skills.fieldPay) rewardEffects.push({ label: 'Überzeugungskraft', value: '+1g', positive: true });
  if (superSkills.fieldPay_super) rewardEffects.push({ label: 'Verhandlungskunst', value: '+1g', positive: true });
  if (hungerTierNow.id !== 'satt') rewardEffects.push({ label: `Hunger (${hungerTierNow.label})`, value: `×${hungerTierNow.rewardMult}`, positive: false });
  if (currentDef.specialRewardMult) rewardEffects.push({ label: currentDef.label, value: `×${currentDef.specialRewardMult}`, positive: true });
  if (currentDef.specialFlatBonus) rewardEffects.push({ label: 'Legendärer Ruf', value: `+${currentDef.specialFlatBonus}g`, positive: true });

  const tirednessEffects = [];
  if (hungerTierNow.id !== 'satt') {
    const dampened = skills.ironWill;
    const effMult = 1 + (hungerTierNow.tirednessGainMult - 1) * (dampened ? 0.5 : 1);
    tirednessEffects.push({
      label: `Hunger (${hungerTierNow.label})${dampened ? ' · gedämpft durch Eisernen Willen' : ''}`,
      value: `×${effMult.toFixed(2)}`, positive: false
    });
  }

  const durationEffects = [];
  if (meta.fasterWorkUnlocked) durationEffects.push({ label: 'Geübtere Hände (nach dem 1. Neuanfang)', value: '×0.6', positive: true });
  if (tier.id !== 'frisch') durationEffects.push({ label: `Müdigkeit (${tier.label})`, value: `×${tier.durationMult}`, positive: false });

  const baseRewardComputed    = currentDef.goldBase;
  const baseTirednessComputed = Math.round(WORK_TIREDNESS_GAIN * currentDef.gainMod);
  const baseDurationComputed  = ((WORK_DURATION_BASE_MS * currentDef.durationMod) / 1000).toFixed(1);

  const computedRows = [
    { label: 'Ertrag',           base: `${baseRewardComputed}g`,    target: `${reward}g`,        effects: rewardEffects },
    { label: 'Müdigkeit/Arbeit', base: `${baseTirednessComputed}%`, target: `${tirednessGain}%`, effects: tirednessEffects },
    { label: 'Dauer',            base: `${baseDurationComputed}s`,  target: `${durationS}s`,     effects: durationEffects }
  ].filter(row => row.effects.length > 0);

  const computedBlock = computedRows.length ? `
    <div class="job-info-computed">
      <span class="value-modified" tabindex="0">ⓘ Errechnete Werte<span class="value-tooltip job-info-computed-tooltip">
        ${computedRows.map(row => `
          <div class="value-tooltip-row-title">${row.label}: <strong>${row.target}</strong></div>
          <div class="value-tooltip-base-row">Basis: ${row.base}</div>
          ${row.effects.map(e => valueEffectHtml(e.label, e.value, e.positive)).join('')}
        `).join('<hr class="value-tooltip-sep">')}
      </span></span>
    </div>` : '';

  const jobInfoPanel = levelingUnlocked ? `
    <div class="job-info-panel${jobInfoPanelOpen ? ' open' : ''}">
      <div class="job-info-title">Feldarbeit</div>
      <div class="job-info-current">Lvl ${workLevel} — ${currentDef.label}</div>
      <div class="job-info-xp">${xpLine}</div>
      <div class="job-info-divider"></div>
      ${nextLevelBlock}
      ${computedBlock}
    </div>` : '';

  const exhausted = !night && needs.tiredness >= 100;

  let fieldCard;
  if (night) {
    fieldCard = `
      <div class="job-card-wrap">
        <div class="action-card action-card-locked">
          <div class="action-card-icon">⚒</div>
          <div class="action-card-name">Auf dem Feld schuften</div>
          <p class="action-card-desc">Die Felder liegen im Dunkeln. Niemand arbeitet hier nachts.</p>
          <button class="action-btn btn-disabled" disabled>Geschlossen</button>
        </div>
      </div>`;
  } else if (exhausted) {
    fieldCard = `
      <div class="job-card-wrap">
        <div class="action-card action-card-locked" style="width:260px;flex-shrink:0;">
          <div class="action-card-icon">⚒</div>
          <div class="action-card-name">Auf dem Feld schuften</div>
          <p class="action-card-desc">Ich bin am Limit. So kann ich nicht arbeiten.</p>
          <button class="action-btn btn-disabled" disabled>Zu erschöpft</button>
        </div>
        ${jobInfoPanel}
      </div>
      <div class="action-card" style="width:260px;">
        <div class="action-card-icon">😮‍💨</div>
        <div class="action-card-name">Kurz verschnaufen</div>
        <p class="action-card-desc">Eine kurze Pause — genug, um wieder in die Gänge zu kommen.</p>
        <button class="action-btn" onclick="ausruhen()">Pause einlegen</button>
        <div class="action-card-effect">🕐 Spielzeit: +15 Min · 😴 Müdigkeit: −10%</div>
      </div>`;
  } else {
    const hungerTier = getHungerTier(needs.hunger);
    const debuffNote = tier.id !== 'frisch'
      ? `<p class="action-card-warning">⚠ ${tier.label}: Arbeit dauert länger.</p>`
      : '';
    const hungerNote = hungerTier.id !== 'satt'
      ? `<p class="action-card-warning">⚠ ${hungerTier.label}: weniger Ertrag, schnellere Erschöpfung.</p>`
      : '';
    const lockedLevelingNote = (!levelingUnlocked && gameFlags.resetLayerUnlocked)
      ? `<p class="action-card-warning">📘 Lernfähigkeit noch nicht erlernt — siehe "Erfahrung".</p>`
      : '';
    const breadBlockNote = gameFlags.mustEatBread
      ? `<p class="action-card-warning">🍞 Zu schwach vor Hunger — erst Brot vom Marktplatz essen.</p>`
      : '';
    const infoToggleBtn = levelingUnlocked
      ? `<button class="job-info-toggle" onclick="toggleJobInfoPanel()" title="Stufen-Effekte anzeigen">${jobInfoPanelOpen ? '«' : '»'}</button>`
      : '';
    const xpBar = levelingUnlocked
      ? `<div class="job-xp-bar" title="Erfahrung in der Feldarbeit: Lvl ${workLevel} (${WORK_LEVELS[workLevel].label}), ${progress.into.toLocaleString('de-DE')}${progress.span ? ' / ' + progress.span.toLocaleString('de-DE') : ''} bis zur nächsten Stufe.">
          <div class="job-xp-bar-fill" style="height:${progress.pct}%"></div>
        </div>`
      : '';
    const longShiftDurationS  = ((getWorkDurationMs() / 1000) * LONG_SHIFT_MULT).toFixed(1);
    const longShiftReward     = getWorkReward() * LONG_SHIFT_MULT;
    const longShiftTiredness  = Math.round(getWorkTirednessGain() * LONG_SHIFT_MULT);
    const longShiftHunger     = Math.round(getWorkHungerGain() * LONG_SHIFT_MULT);
    const longShiftBusy       = busy && workShiftMult === LONG_SHIFT_MULT;
    const normalBusy          = busy && workShiftMult === 1;

    const longShiftCard = skills.longShift ? `
      <div class="action-card">
        <div class="action-card-icon">⏰</div>
        <div class="action-card-name">Lange Schicht (2h)</div>
        <p class="action-card-desc">Doppelte Investition, doppelter Ertrag. Wer durchhält, wird mehr.</p>
        <button class="action-btn ${busy || gameFlags.mustEatBread ? 'btn-disabled' : ''}"
          onclick="startLongShift()" ${busy || gameFlags.mustEatBread ? 'disabled' : ''}>
          ${longShiftBusy ? '⏳ Am Schuften…' : '⏰ Lange Schicht'}
        </button>
        <div class="reward-info">Belohnung: <span class="gold-amount">+${longShiftReward} Gold</span></div>
        <div class="action-card-effect">
          ⏱ Dauer: ${longShiftDurationS}s · 🕐 Arbeitszeit: +${WORK_CLOCK_MINUTES * LONG_SHIFT_MULT} Min · 😴 Müdigkeit: +${longShiftTiredness}% · 🍞 Hunger: +${longShiftHunger}%
        </div>
        ${debuffNote}${hungerNote}
      </div>` : '';

    fieldCard = `
      <div class="job-card-wrap">
        <div class="action-card action-card-primary job-card">
          ${infoToggleBtn}
          ${xpBar}
          <div class="action-card-icon">⚒</div>
          <div class="action-card-name">Auf dem Feld schuften</div>
          <p class="action-card-desc">
            Schwere Arbeit unter freiem Himmel. Schweiß, Erde — und am Ende ein paar Münzen.
          </p>

          <button
            class="action-btn action-btn-primary work-btn"
            id="btn-work"
            onclick="startWork()"
            ${busy || gameFlags.mustEatBread ? 'disabled' : ''}
          >
            ${normalBusy ? '⏳ Am Schuften…' : busy ? '⏳ Am Schuften…' : '⚒ Schuften'}
          </button>

          <div class="progress-container${busy ? '' : ' hidden'}" id="progress-container">
            <div class="progress-bar" id="progress-bar" style="width: ${workProgress}%"></div>
            <span class="progress-label" id="progress-label">${pctStr}</span>
          </div>

          <div class="reward-info">
            Belohnung: <span class="gold-amount">+${reward} Gold</span> pro Durchgang
          </div>
          <div class="action-card-effect">
            ⏱ Dauer: ${durationS}s · 🕐 Arbeitszeit: +${WORK_CLOCK_MINUTES} Min · 😴 Müdigkeit: +${tirednessGain}% · 🍞 Hunger: +${hungerGain}%
          </div>
          ${debuffNote}
          ${hungerNote}
          ${lockedLevelingNote}
          ${breadBlockNote}
        </div>
        ${jobInfoPanel}
      </div>
      ${longShiftCard}`;
  }

  let nightWatchCard = '';
  // Solange Brakka die Nachtwache nie erwähnt hat (Quest "unstarted"), gibt
  // es für die Figur keinen Grund, überhaupt zu wissen, dass das eine
  // Option ist — kein gesperrter Platzhalter mehr (Progressive Disclosure,
  // siehe philosophie.md Punkt 6 / SKILL.md).
  if (night && quests.nightWatch.state !== 'unstarted') {
    const state = quests.nightWatch.state;
    const used  = nightFlags.nightActivityUsedToday;
    const reward = getNightWatchReward();
    const nwLevelingUnlocked = skills.nightWatchLeveling;
    const nwLevel = getNightWatchLevel(nightWatchStats.count);
    const nwNextDef = NIGHTWATCH_LEVELS[nwLevel + 1];
    const levelNote = nwLevelingUnlocked
      ? `<div class="action-card-effect">Lvl ${nwLevel} — ${NIGHTWATCH_LEVELS[nwLevel].label}</div>
         ${nwNextDef ? `<div class="action-card-effect">Nächste Stufe: Lohn ${reward}g → <strong>${nwNextDef.goldBase}g</strong></div>` : ''}`
      : '';

    if (state === 'done') {
      nightWatchCard = `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">🌙</div>
          <div class="action-card-name">Nachtwache halten</div>
          <p class="action-card-desc">Ich sollte Brakka erst von der letzten Nacht berichten, bevor ich es wieder tue.</p>
          <button class="action-btn btn-disabled" disabled>Erst berichten</button>
        </div>`;
    } else {
      const blocked = used;
      const reason  = used
        ? 'Ich habe meine Nachtwache für heute bereits gehalten.'
        : 'Ein paar Münzen für jene, die der Dunkelheit nicht ausweichen — auf Kosten der Erholung danach.';
      nightWatchCard = `
        <div class="action-card${blocked ? ' action-card-locked' : ''}">
          <div class="action-card-icon">🌙</div>
          <div class="action-card-name">Nachtwache halten</div>
          <p class="action-card-desc">${reason}</p>
          <button class="action-btn ${blocked ? 'btn-disabled' : ''}" onclick="nightWatch()" ${blocked ? 'disabled' : ''}>
            ${used ? 'Bereits erledigt' : '🌙 Wache halten'}
          </button>
          <div class="reward-info">Belohnung: <span class="gold-amount">+${reward} Gold</span></div>
          ${levelNote}
          <div class="action-card-effect">
            😴 Schlaf-Erholung danach: ${getNightWatchRecoveryPenalty() > 0 ? `−${Math.round(getNightWatchRecoveryPenalty() * 100)}%` : 'kein Debuff (Eiserne Wacht)'}
          </div>
        </div>`;
    }
  }

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Arbeitsplatz — Felder vor der Stadtmauer</div>
      <div class="job-row">${fieldCard}</div>
      <div class="action-grid">
        ${nightWatchCard}
      </div>
    </div>
  `;
}

/* ── Sammelplatz: Rohstoffe für Gretas Auftrag ───────────────
   Bewusst schlank gehalten — drei gleichwertige Sammel-Aktionen, jede
   erst sichtbar/nutzbar, sobald das passende Werkzeug beim Krämer
   gekauft wurde (siehe TOOL_ITEMS, market.js). */
function renderRohstoffe(el) {
  const night = isNight();
  if (night) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Sammelplatz</div>
        <div class="location-card">
          <p class="location-card-desc">Im Dunkeln findet man hier nichts. Komm bei Tageslicht wieder.</p>
        </div>
      </div>
    `;
    return;
  }

  const blocked = gameFlags.mustEatBread;
  const cards = TOOL_ITEMS.map(tool => {
    const owned = (resources.inventory[tool.id] || 0) > 0;
    const resourceItem = RESOURCE_ITEMS.find(r => r.id === tool.resource);
    if (!owned) {
      return `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">${resourceItem.icon}</div>
          <div class="action-card-name">${RESOURCE_GATHER_LABELS[tool.resource]}</div>
          <p class="action-card-desc">Dafür brauche ich erst ${tool.name === 'Axt' ? 'eine' : 'einen'} ${tool.name} vom Krämer.</p>
          <button class="action-btn btn-disabled" disabled>Werkzeug fehlt</button>
        </div>`;
    }
    const have = resources.inventory[tool.resource] || 0;
    return `
      <div class="action-card${blocked ? ' action-card-locked' : ''}">
        <div class="action-card-icon">${resourceItem.icon}</div>
        <div class="action-card-name">${RESOURCE_GATHER_LABELS[tool.resource]} <span class="inventory-count">×${have}</span></div>
        <p class="action-card-desc">${RESOURCE_GATHER_DESC[tool.resource]}</p>
        ${blocked ? `<p class="action-card-warning">🍞 Zu schwach vor Hunger — erst Brot vom Marktplatz essen.</p>` : ''}
        <button class="action-btn ${blocked ? 'btn-disabled' : ''}" onclick="gatherResource('${tool.resource}')" ${blocked ? 'disabled' : ''}>
          Sammeln
        </button>
        <div class="action-card-effect">
          🕐 Spielzeit: +${RESOURCE_GATHER_MINUTES} Min · 😴 Müdigkeit: +${RESOURCE_GATHER_TIREDNESS}% · 🍞 Hunger: +${RESOURCE_GATHER_HUNGER}%
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Sammelplatz vor den Stadtmauern</div>
      <div class="action-grid">${cards}</div>
    </div>
  `;
}

/* ── Mein Haus ────────────────────────────────────────────── */
function renderMeinHaus(el) {
  const sleepOption = SLEEP_OPTIONS.find(o => o.id === 'home');
  const qualityTier = sleepOption ? getSleepQualityTier(sleepOption) : 3;

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Mein Haus</div>
      <div class="location-card">
        <p class="location-card-desc">Am Westrand von Treutheim. Kein Lärm, keine fremden Schritte. Es ist nicht viel — aber es gehört mir.</p>
        <div class="location-card-actions">
          <button class="goto-btn" onclick="showContent('schlafplatz')">🛏 Schlafen (Qualität ${qualityTier})</button>
          ${meta.hasSmith
            ? `<button class="goto-btn" onclick="showContent('schmiede')">⚒ Zur Schmiede</button>`
            : `<div class="action-card" style="margin-top:12px;">
                <div class="action-card-title">⚒ Schmiede ausbauen</div>
                <p class="action-card-desc">Ein Schlosser aus der Süderstraße könnte eine Schmiede einbauen. Oswin vermittelt das.</p>
                <div class="action-card-effect">Kosten: 1200 Gold · Sprich mit Oswin in der Taverne.</div>
              </div>`
          }
        </div>
      </div>
    </div>`;
}

function renderSchmiede(el) {
  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Schmiede</div>
      <div class="location-card">
        <p class="location-card-desc">Der Amboss steht noch unberührt. Der Ofen glüht zum ersten Mal. Hier wird noch nichts Großes entstehen — aber der Anfang ist gemacht.</p>
        <p class="location-card-desc" style="color:var(--muted);font-style:italic;">Schmiede-Handwerk kommt in einer der nächsten Versionen.</p>
      </div>
    </div>`;
}

/* ── Stadtwache ───────────────────────────────────────────── */
function renderStadtwache(el) {
  if (!gameFlags.stadtwacheAccepted) {
    el.innerHTML = `<div class="feature-stage"><div class="feature-stage-label">Stadtwache</div>
      <div class="location-card"><p class="location-card-desc">Ich habe noch keinen Platz bei der Stadtwache.</p></div></div>`;
    return;
  }

  const night      = isNight();
  const busy       = gameFlags.isStadtwacheShift;
  const busyWork   = gameFlags.isWorking;
  const pctStr     = Math.floor(stadtwacheProgress) + '%';
  const reward     = getStadtwacheReward();
  const durationS  = (getStadtwacheDurationMs() / 1000).toFixed(1);
  const tiredness  = Math.round(getStadtwacheTirednessGain());
  const hunger     = Math.round(getStadtwacheHungerGain());
  const level      = getStadtwacheLevel(stadtwacheStats.count);
  const levelDef   = STADTWACHE_LEVELS[level];
  const progress   = getStadtwacheLevelProgress(stadtwacheStats.count);
  const nextDef    = STADTWACHE_LEVELS[level + 1];
  const xpLine     = nextDef
    ? `${progress.into} / ${progress.span} Dienste`
    : 'Maximalstufe erreicht';

  const shiftBlock = night
    ? `<div class="action-card action-card-locked" style="width:260px;flex-shrink:0;">
        <div class="action-card-title">🛡 Schicht beginnen</div>
        <p class="action-card-desc">Die Stadtwache braucht mich tagsüber. Nachts liegt das Tor in anderen Händen.</p>
        <div class="action-card-effect">Komm bei Tagesanbruch wieder.</div>
      </div>`
    : needs.tiredness >= 100
    ? `<div class="action-card action-card-locked" style="width:260px;flex-shrink:0;">
        <div class="action-card-title">🛡 Schicht beginnen</div>
        <p class="action-card-desc">Ich bin zu erschöpft, um heute noch Schicht zu machen.</p>
      </div>`
    : `<div class="action-card ${busy ? 'action-card-active' : ''}" style="width:260px;" onclick="${busy || busyWork ? '' : 'startStadtwacheShift()'}">
        <div class="action-card-title">🛡 ${busy ? '⏳ Im Dienst…' : 'Schicht beginnen'}</div>
        <p class="action-card-desc">Eine Tagesschicht bei der Stadtwache — die Straßen sicher halten, den Lohn einstreichen.</p>
        <div class="reward-info">Lohn: <span class="gold-amount">+${reward} Gold</span></div>
        <div class="action-card-effect">⏱ Dauer: ${durationS}s · 🕐 Spielzeit: +8h · 😴 Müdigkeit: +${tiredness}% · 🍞 Hunger: +${hunger}%</div>
        ${busy ? `<div class="progress-track"><div class="progress-bar" id="stadtwache-progress-bar" style="width:${pctStr}"></div></div>
          <div class="progress-label" id="stadtwache-progress-label">${pctStr}</div>` : ''}
      </div>`;

  const xpPanel = `
    <div class="job-info-panel">
      <div class="xp-track">
        <div class="xp-track-label">Dienst-Erfahrung</div>
        <div class="xp-bar-row">
          <div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${progress.pct}%"></div></div>
          <span class="xp-bar-text">Stufe ${level} — ${levelDef.label}</span>
        </div>
        <div class="xp-bar-sub">${xpLine}</div>
      </div>
      ${nextDef ? `<div class="job-info-next-label">Nächste Stufe: Lvl ${level + 1} — ${nextDef.label}</div>
        <div class="job-info-compare-row"><span>Lohn</span><span>${levelDef.goldBase}g → <strong>${nextDef.goldBase}g</strong></span></div>
        <div class="job-info-compare-row"><span>Müdigkeit/Schicht</span><span>${Math.round(STADTWACHE_TIREDNESS_GAIN * levelDef.gainMod)}% → <strong>${Math.round(STADTWACHE_TIREDNESS_GAIN * nextDef.gainMod)}%</strong></span></div>
        <div class="job-info-compare-row"><span>Dauer</span><span>${((STADTWACHE_DURATION_BASE_MS * levelDef.durationMod)/1000).toFixed(1)}s → <strong>${((STADTWACHE_DURATION_BASE_MS * nextDef.durationMod)/1000).toFixed(1)}s</strong></span></div>` : ''}
    </div>`;

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Stadtwache</div>
      <div class="job-row">
        <div class="job-card-wrap">${shiftBlock}${xpPanel}</div>
      </div>
    </div>`;

  if (busy) scheduleStadtwache();
}

/* ── Schlafplatz ──────────────────────────────────────────── */
/* Zeigt jeden bereits freigeschalteten Schlafplatz immer (auch tagsüber)
   — nur das eigentliche Schlafen selbst ist nachts vorbehalten. Tagsüber
   werden die Karten als gesperrt mit Erklärung angezeigt, statt die ganze
   Seite hinter einer einzigen Textzeile zu verstecken. */
function renderSchlafplatz(el) {
  const night = isNight();
  const tier  = getTirednessTier(needs.tiredness);
  const dayLockReason = (tier.id === 'frisch' || tier.id === 'muede')
    ? 'Der Tag ist noch nicht vorbei. Ich sollte die Zeit nutzen, solange ich kann.'
    : 'Ich bin hundemüde — aber es ist noch nicht spät genug, um schlafen zu gehen. Das wäre vergeudete Zeit.';

  const recoveryMult = nightFlags.recoveryDebuff ? (1 - getNightWatchRecoveryPenalty()) : 1;
  const debuffNote = night && nightFlags.recoveryDebuff && getNightWatchRecoveryPenalty() > 0
    ? `<p class="action-card-warning">⚠ Nach der Nachtwache erhole ich mich heute −${Math.round(getNightWatchRecoveryPenalty() * 100)}% schlechter.</p>`
    : '';

  // Auf der Straße ist anfangs die einzige sichtbare Option — die Absteige
  // erscheint erst, nachdem die Figur weiß, wie schlecht sich das anfühlt
  // (siehe SLEEP_OPTIONS, `requiresFlag`).
  const visibleOptions = SLEEP_OPTIONS.filter(o =>
    (!o.requiresFlag || gameFlags[o.requiresFlag]) &&
    (!o.requiresMeta  || meta[o.requiresMeta])
  );
  const cards = visibleOptions.map(o => {
    const qualityTier = getSleepQualityTier(o);
    const reliefPct = night ? Math.round(100 * recoveryMult * getSleepQualityFactor(o)) : Math.round(100 * getSleepQualityFactor(o));
    const canAfford = resources.gold >= o.cost;
    const hungerEffect = o.hungerPenalty ? `🍞 Hunger +${o.hungerPenalty}%` : '🍞 Hunger ±0%';
    const reliefLabel = Math.round(100 * getSleepQualityFactor(o));
    const qualityBadge = `<div class="sleep-quality-badge">Schlafqualität ${qualityTier} ` +
      `<span class="info-hint" tabindex="0" title="Höhere Schlafqualität → mehr regenerierte Müdigkeit. Aktuell: −${reliefLabel}% Müdigkeit pro Schlaf.">ⓘ</span></div>`;

    if (!night) {
      return `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">${o.icon}</div>
          <div class="action-card-name">${o.name}</div>
          <p class="action-card-desc">${dayLockReason}</p>
          ${qualityBadge}
          <div class="action-card-effect">😴 Müdigkeit −${reliefPct}% · ${hungerEffect}</div>
          <button class="action-btn btn-disabled" disabled>Erst nachts möglich</button>
        </div>`;
    }
    return `
      <div class="action-card">
        <div class="action-card-icon">${o.icon}</div>
        <div class="action-card-name">${o.name}</div>
        <p class="action-card-desc">${o.desc}</p>
        ${qualityBadge}
        <div class="action-card-effect">😴 Müdigkeit −${reliefPct}% · ${hungerEffect}</div>
        <div class="action-card-cost ${canAfford ? 'cost-ok' : 'cost-too-high'}">${o.cost > 0 ? o.cost + ' Gold' : 'Kostenlos'}</div>
        <button class="action-btn ${canAfford ? '' : 'btn-disabled'}" onclick="sleep('${o.id}')" ${canAfford ? '' : 'disabled'}>
          Schlafen
        </button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Schlafplatz</div>
      ${debuffNote}
      <div class="action-grid">
        ${cards}

        <div class="action-card action-card-locked">
          <div class="action-card-icon">🔒</div>
          <div class="action-card-name">Im eigenen Bett schlafen</div>
          <p class="action-card-desc">???</p>
          <div class="action-card-cost">Erfordert ein eigenes Zuhause</div>
          <button class="action-btn btn-disabled" disabled>Gesperrt</button>
        </div>

      </div>
    </div>
  `;
}

/* ── Chronik (Nachlese bereits freigeschalteter Story-Einträge) ── */
function renderChronik(el) {
  const entries = getUnlockedStoryEntries();

  if (entries.length === 0) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Chronik</div>
        <p class="chronik-empty">Noch keine Einträge. Erkunde die Welt, um Geschichte zu schreiben.</p>
      </div>
    `;
    return;
  }

  const items = entries.map(e => {
    const isNew = chronikUnseenEntryIds.includes(e.id);
    return `
    <button class="chronik-entry ${isNew ? 'chronik-entry-new' : ''}" onmouseenter="markChronikEntrySeen('${e.id}', this)" onclick="reopenStoryEntry('${e.id}')">
      <span class="chronik-entry-id">${e.id}</span>
      <span class="chronik-entry-title">${e.title}</span>
      <span class="chronik-entry-arrow">›</span>
    </button>
  `;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Chronik — Bisherige Geschichte</div>
      <div class="chronik-list">${items}</div>
    </div>
  `;
}

/** Öffnet einen bereits freigeschalteten Story-Eintrag erneut zum Nachlesen. */
function reopenStoryEntry(id) {
  const entry = getStoryEntry(id);
  if (entry) showStoryEntryDialog(entry);
}

/** Markiert einen Chronik-Eintrag als gesehen (Hover) — entfernt seine
    Leucht-Hervorhebung dauerhaft. Direkter DOM-Eingriff statt render(),
    weil ein Hover-Effekt keinen vollständigen Neuaufbau der Seite
    rechtfertigt. */
function markChronikEntrySeen(id, el) {
  const idx = chronikUnseenEntryIds.indexOf(id);
  if (idx === -1) return;
  chronikUnseenEntryIds.splice(idx, 1);
  if (el) el.classList.remove('chronik-entry-new');
}

/* ── Einstellungen ────────────────────────────────────────── */
function renderSettings(el) {
  const { chapter, subchapter, step } = decodeState(storyState);
  const pad     = n => String(n).padStart(2, '0');
  const hasSave = !!localStorage.getItem(SAVE_KEY);

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Einstellungen</div>

      <div class="settings-group">
        <div class="settings-section-title">Spielstand</div>
        <div class="settings-buttons">
          <button class="action-btn settings-btn" onclick="saveGame()">
            💾 Spielstand speichern
          </button>
          <button
            class="action-btn settings-btn btn-load ${hasSave ? '' : 'btn-disabled'}"
            onclick="loadGame()"
            ${hasSave ? '' : 'disabled'}
          >
            📂 Spielstand laden${hasSave ? '' : ' — (kein Spielstand)'}
          </button>
        </div>
        <div class="settings-buttons-row" style="margin-top: 6px;">
          <button
            class="action-btn settings-btn-option ${hasSave ? '' : 'btn-disabled'}"
            onclick="exportSaveToClipboard()"
            ${hasSave ? '' : 'disabled'}
            title="Kopiert den gespeicherten Spielstand als Text in die Zwischenablage"
          >📋 Exportieren</button>
          <button
            class="action-btn settings-btn-option"
            onclick="importSaveFromClipboard()"
            title="Lädt einen Spielstand aus der Zwischenablage"
          >📥 Importieren</button>
        </div>
        <div class="settings-buttons" style="margin-top: 10px;">
          <button class="action-btn settings-btn" onclick="setAutoSaveEnabled(${!settings.autoSave.enabled})">
            ${settings.autoSave.enabled ? '☑' : '☐'} Automatisch speichern
          </button>
          ${settings.autoSave.enabled ? `
            <div class="settings-buttons-row" style="margin-top: 4px;">
              ${[[0.5, '30 Sek'], [1, '1 Min'], [2, '2 Min'], [5, '5 Min']].map(([min, label]) => `
                <button
                  class="action-btn settings-btn-option ${settings.autoSave.intervalMinutes === min ? 'active' : ''}"
                  onclick="setAutoSaveInterval(${min})"
                >${label}</button>
              `).join('')}
            </div>
          ` : ''}
          <button class="action-btn settings-btn" onclick="setAutoLoad(${!settings.autoLoad})">
            ${settings.autoLoad ? '☑' : '☐'} Beim Start automatisch laden
          </button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-section-title">Benachrichtigungen</div>
        <div class="settings-buttons settings-buttons-row">
          ${[1000, 3000, 5000].map(ms => `
            <button
              class="action-btn settings-btn-option ${settings.toastDurationMs === ms ? 'active' : ''}"
              onclick="setToastDuration(${ms})"
            >${ms / 1000}s</button>
          `).join('')}
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-section-title">Verhalten &amp; Animationen</div>
        <div class="settings-buttons">
          ${gameFlags.resetLayerUnlocked ? `
            <button class="action-btn settings-btn" onclick="toggleResetWarning('erfahrung')">
              ${settings.warnBeforeReset.erfahrung ? '☑' : '☐'} Vor Erfahrungs-Neuanfang warnen
            </button>
          ` : `<p class="chronik-empty" style="margin: 0;">Noch keine Reset-Ebene freigeschaltet.</p>`}
          <button class="action-btn settings-btn" onclick="setHideTextSelection(${!settings.hideTextSelection})">
            ${settings.hideTextSelection ? '☑' : '☐'} Textmarkierung ausblenden
          </button>
          ${gameFlags.resetAnimationSeen ? `
            <button class="action-btn settings-btn" onclick="setShowResetAnimation(${!settings.showResetAnimation})">
              ${settings.showResetAnimation ? '☑' : '☐'} Reset-Animation (Erfahrung) anzeigen
            </button>
          ` : ''}
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-section-title">Verlauf</div>
        <div class="tab-bar" style="max-width: 420px;">
          <button class="tab-btn ${historyFilter === 'toasts' ? 'active' : ''}" onclick="setHistoryFilter('toasts')">Meldungen (${toastHistory.length})</button>
          <button class="tab-btn ${historyFilter === 'dialoge' ? 'active' : ''}" onclick="setHistoryFilter('dialoge')">Dialoge (${dialogHistory.length})</button>
        </div>
        <div class="history-panel">
          ${historyFilter === 'toasts'
            ? (toastHistory.length
                ? toastHistory.map(t => `
                    <div class="history-entry history-entry-${t.type}">
                      <span class="history-entry-time">${new Date(t.at).toLocaleTimeString('de-DE')}</span>
                      <span class="history-entry-text">${t.text}</span>
                    </div>`).join('')
                : '<p class="chronik-empty" style="margin-top: 0;">Noch keine Meldungen.</p>')
            : (dialogHistory.length
                ? dialogHistory.map(d => `
                    <div class="history-entry history-entry-dialog">
                      <span class="history-entry-time">${new Date(d.at).toLocaleTimeString('de-DE')}</span>
                      <span class="history-entry-title">${d.title}</span>
                      ${d.text.map(p => `<span class="history-entry-text">${p}</span>`).join('')}
                    </div>`).join('')
                : '<p class="chronik-empty" style="margin-top: 0;">Noch keine Dialoge.</p>')
          }
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-section-title">Debug-Info</div>
        <div class="settings-info">
          <div class="info-row">
            <span class="info-label">Story State</span>
            <span class="info-value">${storyState}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Dekodiert</span>
            <span class="info-value">
              Kap.${chapter} · Unt.${pad(subchapter)} · Sch.${pad(step)}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Spieltag</span>
            <span class="info-value">${gameClock.day} (${formatClock()})</span>
          </div>
          <div class="info-row">
            <span class="info-label">Hunger / Müdigkeit</span>
            <span class="info-value">${Math.round(needs.hunger)}% / ${Math.round(needs.tiredness)}%</span>
          </div>
          <div class="info-row">
            <span class="info-label">Gold (gesamt verdient)</span>
            <span class="info-value">${resources.totalGoldEarned}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Kapitel-Resets</span>
            <span class="info-value">${meta.resets}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quest: Nachtwache</span>
            <span class="info-value">${quests.nightWatch.state}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Version</span>
            <span class="info-value">0.13.0-alpha</span>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-section-title">Community</div>
        <a href="https://discord.gg/NHenxsPh" target="_blank" class="discord-link-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          Discord — Chroniken des vergessenen Weges
        </a>
      </div>

      <div class="settings-group">
        <div class="settings-section-title danger-title">⚠ Gefahrenzone</div>
        <div class="settings-buttons">
          <button class="action-btn settings-btn btn-danger" onclick="resetGame()">
            Spielstand zurücksetzen
          </button>
        </div>
      </div>

    </div>
  `;

  if (gameFlags.devModeEnabled) {
    const devContainer = document.createElement('div');
    el.querySelector('.feature-stage').appendChild(devContainer);
    renderDevPanel(devContainer);
  }
}

/** Wechselt zwischen Meldungs- und Dialog-Verlauf in den Einstellungen. */
function setHistoryFilter(filter) {
  historyFilter = filter;
  render();
}

/* ══════════════════════════════════════════════════════════════
   LETHKAR — Stadtübersicht + Orte (Kapitel 3)
   ══════════════════════════════════════════════════════════════ */

function renderLethkar(el) {
  const places = [
    ...(alchemie.unlocked ? [{ id: 'alchemie', icon: '⚗', name: 'Das Laboratorium',
      desc: 'Ein Raum voller dampfender Tiegel und seltsamer Gerüche. Varena hat mir die Tür geöffnet.' }] : []),
    { id: 'lethkar_taverne', icon: '🍺', name: 'Die Silberne Glocke',
      desc: 'Ruhiger als in Treutheim. Hier treffen sich Gelehrte, Händler und Leute, die beides vorgeben.' },
    { id: 'lethkar_markt', icon: '⚖', name: 'Der Markt der Zutaten',
      desc: 'Alchemistische Rohstoffe, seltene Kräuter, abgefüllte Essenzen. Eine andere Welt als der Treutheimer Markt.' },
    { id: 'lethkar_schlafplatz', icon: '🛏', name: 'Schlafplatz',
      desc: 'Ein einfaches Zimmer in einer Pension nahe der Stadtmitte. Nicht billig — aber sicher.' }
  ];

  const cards = places.map(p => `
    <div class="action-card">
      <div class="action-card-icon">${p.icon}</div>
      <div class="action-card-name">${p.name}</div>
      <p class="action-card-desc">${p.desc}</p>
      <button class="goto-btn" onclick="showContent('${p.id}')">Hingehen</button>
    </div>`).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Lethkar</div>
      <p class="location-card-desc" style="margin-bottom:12px;">Eine alte Gelehrtenstadt im Norden. Pflastersteine statt Feldwege, Türme statt Kirchendächer — und überall dieser Geruch von Kräutern und heißem Metall.</p>
      <div class="action-grid">${cards}</div>
    </div>`;
}

function renderLethkarTaverne(el) {
  const npcs = NPCS_LETHKAR.filter(npc => npc.location === 'taverne');
  const npcCards = npcs.map(npc => {
    const locked = typeof npc.locked === 'function' ? npc.locked() : false;
    return `
      <div class="action-card ${locked ? 'action-card-locked' : ''}">
        <div class="action-card-icon">${npc.icon}</div>
        <div class="action-card-name">${npc.name}</div>
        <p class="action-card-desc">${npc.tagline}</p>
        ${locked
          ? `<button class="action-btn btn-disabled" disabled>Nicht zugänglich</button>`
          : `<button class="action-btn" onclick="openNpcDialog('${npc.id}')">Ansprechen</button>`
        }
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Die Silberne Glocke</div>
      <p class="location-card-desc" style="margin-bottom:12px;">Leise Musik. Dicker Kerzenrauch. Hier kann man Geheimnisse flüstern, ohne dass man es hört.</p>
      <div class="action-grid">${npcCards}</div>
    </div>`;
}

function renderLethkarMarkt(el) {
  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Markt der Zutaten</div>
      <p class="location-card-desc">Unzählige Waren aus der ganzen Region. Alchemistische Rohstoffe, gepreiste Essenzen, Werkzeug für Laborarbeiten.</p>
      <p class="location-card-desc" style="color:var(--muted);font-style:italic;margin-top:8px;">Händler und Kaufoptionen folgen in einer der nächsten Versionen.</p>
    </div>`;
}

function renderLethkarSchlafplatz(el) {
  const LETHKAR_SLEEP_OPTIONS = [
    {
      id: 'lethkar_pension', name: 'Pension "Zum ruhigen Mond"', icon: '🛏', cost: 8, qualityTier: 2,
      desc: 'Ein sauberes Bett, Stille, keine Fremden nebenan. Dafür muss man zahlen.', hungerPenalty: 0
    }
  ];

  if (!isNight()) {
    const tiredness = needs.tiredness;
    const tier = getTirednessTier(tiredness);
    const msg = tier.id === 'fresh' || tier.id === 'tired'
      ? 'Die Sonne steht noch hoch. Schlafen wäre vertane Zeit.'
      : 'Ich bin erschöpft — aber es ist noch kein Abend. Ich muss die Zeit nutzen.';
    el.innerHTML = `<div class="feature-stage"><div class="feature-stage-label">Schlafplatz</div><p class="location-card-desc">${msg}</p></div>`;
    return;
  }

  const cards = LETHKAR_SLEEP_OPTIONS.map(opt => {
    const canAfford = resources.gold >= opt.cost;
    const qualityBonus = getPetSleepBonus();
    const effectiveTier = opt.qualityTier + qualityBonus;
    return `
      <div class="action-card">
        <div class="action-card-icon">${opt.icon}</div>
        <div class="action-card-name">${opt.name}</div>
        <p class="action-card-desc">${opt.desc}</p>
        <div class="action-card-effect">Schlafqualität ${effectiveTier} · Kosten: ${opt.cost} Gold</div>
        <button class="action-btn ${canAfford ? '' : 'btn-disabled'}"
          onclick="sleepAt('lethkar_pension',${opt.cost},${opt.qualityTier})"
          ${canAfford ? '' : 'disabled'}>
          ${canAfford ? 'Einquartieren' : `Nicht genug Gold (${opt.cost}g)`}
        </button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Schlafplatz</div>
      <div class="action-grid">${cards}</div>
    </div>`;
}
