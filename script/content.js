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
    case 'chronik':       renderChronik(area);      break;
    case 'settings':      renderSettings(area);     break;
    default:              renderGeschichte(area);
  }
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
            Mehr folgt in Kürze. Sieh in der <em>Chronik</em> nach, was bisher geschah.
          </p>
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
  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Weltkarte</div>
      <div class="action-grid">

        <div class="action-card">
          <div class="action-card-icon">🏘</div>
          <div class="action-card-name">Treutheim</div>
          <p class="action-card-desc">Die erste Stadt auf meinem Weg — groß genug, um als Bauernsohn unbemerkt anzukommen.</p>
          <button class="action-btn" onclick="navTo(2)">Betreten</button>
        </div>

        <div class="action-card action-card-locked">
          <div class="action-card-icon">🔒</div>
          <div class="action-card-name">???</div>
          <p class="action-card-desc">Unbekannte Gebiete jenseits der Hügel. Noch nicht erreichbar.</p>
          <button class="action-btn btn-disabled" disabled>Unentdeckt</button>
        </div>

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
  // Stufe sind noch zu weit weg, um sie aufzulisten (siehe SKILL.md). Gezeigt
  // werden konkrete "Jetzt → Danach"-Werte unter den AKTUELLEN Hunger-/
  // Müdigkeits-/Ausrüstungs-Bedingungen — die reine, modifikatorfreie
  // Stufen-Grundverbesserung steckt nur noch im Tooltip, weil sie allein
  // (ohne die tatsächlichen Werte) zu Verwirrung geführt hat.
  const xpLine = nextDef
    ? `${progress.into.toLocaleString('de-DE')} / ${progress.span.toLocaleString('de-DE')} Erfahrung`
    : 'Maximalstufe erreicht';

  let nextLevelBlock;
  if (nextDef) {
    const afterReward    = getWorkReward(workLevel + 1);
    const afterDurationS = (getWorkDurationMs(workLevel + 1) / 1000).toFixed(1);
    const afterTiredness = Math.round(getWorkTirednessGain(workLevel + 1));
    const afterHunger    = Math.round(getWorkHungerGain(workLevel + 1));

    const baseGoldDelta     = nextDef.goldBase - currentDef.goldBase;
    const baseDurationDelta = Math.round((1 - nextDef.durationMod) * 100);
    const baseGainDelta     = Math.round((1 - nextDef.gainMod) * 100);
    const baseTooltip = `Grundverbesserung ohne Hunger/Müdigkeit/Ausrüstung: +${baseGoldDelta}g Ertrag, ` +
      `−${baseGainDelta}% Müdigkeits-/Hungeraufbau, −${baseDurationDelta}% Dauer.`;

    nextLevelBlock = `
      <div class="job-info-next-label">Nächste Stufe: Lvl ${workLevel + 1} — ${nextDef.label}</div>
      <div class="job-info-compare-row"><span>Ertrag</span><span>${reward}g → <strong>${afterReward}g</strong></span></div>
      <div class="job-info-compare-row"><span>Müdigkeit/Arbeit</span><span>${tirednessGain}% → <strong>${afterTiredness}%</strong></span></div>
      <div class="job-info-compare-row"><span>Hunger/Arbeit</span><span>${hungerGain}% → <strong>${afterHunger}%</strong></span></div>
      <div class="job-info-compare-row"><span>Dauer</span><span>${durationS}s → <strong>${afterDurationS}s</strong></span></div>
      <div class="job-info-base-note" title="${baseTooltip}">Basiswerte ⓘ</div>`;
  } else {
    nextLevelBlock = `<div class="job-info-next-label">Keine weitere Stufe in Sicht</div>`;
  }

  const jobInfoPanel = levelingUnlocked ? `
    <div class="job-info-panel${jobInfoPanelOpen ? ' open' : ''}">
      <div class="job-info-title">Feldarbeit</div>
      <div class="job-info-current">Lvl ${workLevel} — ${currentDef.label}</div>
      <div class="job-info-xp">${xpLine}</div>
      <div class="job-info-divider"></div>
      ${nextLevelBlock}
    </div>` : '';

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
          ${debuffNote}
          ${hungerNote}
          ${lockedLevelingNote}
          ${breadBlockNote}

          <button
            class="action-btn action-btn-primary work-btn"
            id="btn-work"
            onclick="startWork()"
            ${busy || gameFlags.mustEatBread ? 'disabled' : ''}
          >
            ${busy ? '⏳ Am Schuften…' : '⚒ Schuften'}
          </button>

          <div class="progress-container${busy ? '' : ' hidden'}" id="progress-container">
            <div class="progress-bar" id="progress-bar" style="width: ${workProgress}%"></div>
            <span class="progress-label" id="progress-label">${pctStr}</span>
          </div>

          <div class="reward-info">
            Belohnung: <span class="gold-amount">+${reward} Gold</span> pro Durchgang
          </div>
          <div class="action-card-effect">
            ⏱ Dauer: ${durationS}s · 🕐 Spielzeit: +${WORK_CLOCK_MINUTES} Min · 😴 Müdigkeit: +${tirednessGain}% · 🍞 Hunger: +${hungerGain}%
          </div>
        </div>
        ${jobInfoPanel}
      </div>`;
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
            😴 Schlaf-Erholung danach: −${Math.round(NIGHTWATCH_RECOVERY_PENALTY * 100)}%
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
    : 'Ich bin hundemüde — aber die Sonne steht noch hoch. Jetzt schon zu schlafen wäre vergeudete Zeit.';

  const recoveryMult = nightFlags.recoveryDebuff ? (1 - NIGHTWATCH_RECOVERY_PENALTY) : 1;
  const debuffNote = night && nightFlags.recoveryDebuff
    ? `<p class="action-card-warning">⚠ Nach der Nachtwache erhole ich mich heute −${Math.round(NIGHTWATCH_RECOVERY_PENALTY * 100)}% schlechter.</p>`
    : '';

  // Auf der Straße ist anfangs die einzige sichtbare Option — die Absteige
  // erscheint erst, nachdem die Figur weiß, wie schlecht sich das anfühlt
  // (siehe SLEEP_OPTIONS, `requiresFlag`).
  const visibleOptions = SLEEP_OPTIONS.filter(o => !o.requiresFlag || gameFlags[o.requiresFlag]);
  const cards = visibleOptions.map(o => {
    const qualityTier = getSleepQualityTier(o);
    const reliefPct = night ? Math.round(100 * recoveryMult * getSleepQualityFactor(o)) : Math.round(100 * getSleepQualityFactor(o));
    const canAfford = resources.gold >= o.cost;
    const hungerEffect = o.hungerPenalty ? `🍞 Hunger +${o.hungerPenalty}%` : '🍞 Hunger ±0%';
    const qualityBadge = `<div class="sleep-quality-badge">Schlafqualität ${qualityTier}/${SLEEP_QUALITY_MAX}</div>`;

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

  const items = entries.map(e => `
    <button class="chronik-entry" onclick="reopenStoryEntry('${e.id}')">
      <span class="chronik-entry-id">${e.id}</span>
      <span class="chronik-entry-title">${e.title}</span>
      <span class="chronik-entry-arrow">›</span>
    </button>
  `).join('');

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
        <div class="settings-section-title" style="margin-top: 14px;">Letzte Meldungen</div>
        <div class="toast-history">
          ${toastHistory.length
            ? toastHistory.map(t => `<div class="toast-history-item toast-history-${t.type}">${t.text}</div>`).join('')
            : '<p class="chronik-empty" style="margin-top: 0;">Noch keine Meldungen.</p>'
          }
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-section-title">Warnungen</div>
        <div class="settings-buttons">
          ${gameFlags.resetLayerUnlocked ? `
            <button class="action-btn settings-btn" onclick="toggleResetWarning('erfahrung')">
              ${settings.warnBeforeReset.erfahrung ? '☑' : '☐'} Vor Neuanfang (Erfahrung) warnen
            </button>
          ` : `<p class="chronik-empty" style="margin: 0;">Noch keine Reset-Ebene freigeschaltet.</p>`}
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
            <span class="info-value">0.8.0-alpha</span>
          </div>
        </div>
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
}
