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
    case CONTENT.GESCHICHTE:         renderGeschichte(area);         break;
    case CONTENT.WELTKARTE:          renderWeltkarte(area);          break;
    case CONTENT.TREUTHEIM:          renderTreutheim(area);          break;
    case CONTENT.ARBEITSPLATZ:       renderArbeitsplatz(area);       break;
    case CONTENT.MARKTPLATZ:
      if (!marketVendor)                       renderMarktplatzHub(area);
      else if (marketVendor === VENDOR.KRAEMER)  renderVendorKraemer(area);
      else if (marketVendor === VENDOR.SCHMIEDE) renderVendorSchmiede(area);
      else                                       renderMarktplatzHub(area);
      break;
    case CONTENT.SCHLAFPLATZ:        renderSchlafplatz(area);        break;
    case CONTENT.ROHSTOFFE:          renderRohstoffe(area);          break;
    case CONTENT.TAVERNE:            renderTaverne(area);            break;
    case CONTENT.INVENTAR:           renderInventar(area);           break;
    case CONTENT.QUESTS:             renderQuests(area);             break;
    case CONTENT.ERFAHRUNG:          renderErfahrung(area);          break;
    case CONTENT.ERRUNGENSCHAFTEN:   renderErrungenschaften(area);   break;
    case CONTENT.PETS:               renderPets(area);               break;
    case CONTENT.LEHRER:             renderLehrer(area);             break;
    case CONTENT.JAGDGEBIET:         renderJagdgebiet(area);         break;
    case CONTENT.STADTWACHE:         renderStadtwache(area);         break;
    case CONTENT.MEINHAUS:           renderMeinHaus(area);           break;
    case CONTENT.SCHMIEDE:           renderSchmiede(area);           break;
    case CONTENT.AUTOMATION:         renderAutomation(area);         break;
    case CONTENT.EXPEDITION:         renderExpedition(area);         break;
    case CONTENT.LETHKAR:            renderLethkar(area);            break;
    case CONTENT.ALCHEMIE:           renderAlchemie(area);           break;
    case CONTENT.LETHKAR_TAVERNE:    renderLethkarTaverne(area);     break;
    case CONTENT.LETHKAR_MARKT:      renderLethkarMarkt(area);       break;
    case CONTENT.LETHKAR_SCHLAFPLATZ:renderLethkarSchlafplatz(area); break;
    case CONTENT.VELMARK:            renderVelmark(area);            break;
    case CONTENT.VELMARK_FRAKTIONEN: renderVelmarkFraktionen(area);  break;
    case CONTENT.VELMARK_JAGDGEBIET:  renderVelmarkJagdgebiet(area);   break;
    case CONTENT.VELMARK_MARKT:       renderVelmarkMarkt(area);        break;
    case CONTENT.VELMARK_SCHLAFPLATZ: renderVelmarkSchlafplatz(area);  break;
    case CONTENT.VELMARK_HAFEN:      renderVelmarkHafen(area);        break;
    case CONTENT.VALDRIS_PROFIL:     renderValdrisProfil(area);       break;
    case CONTENT.VALDRIS_FINALE:     renderValdrisFinale(area);       break;
    case CONTENT.CHRONIK:            renderChronik(area);            break;
    case CONTENT.SETTINGS:           renderSettings(area);           break;
    case CONTENT.RUF_FAEHIGKEITEN:   renderRufFaehigkeiten(area);    break;
    default:                         renderGeschichte(area);
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
  // Vor dem Stadttor — einziger Zustand mit Action-Button
  if (storyState === 10100) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Vor den Toren Treutheims</div>
        <p class="location-card-desc">Ich habe es bis hierher geschafft. Jetzt oder nie.</p>
        <div class="feature-hero">
          <div class="feature-hero-icon">🏰</div>
          <button class="action-btn action-btn-primary" onclick="enterCity('treutheim')">
            Das Stadttor betreten →
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Chronik-Link — wird unter Post-Kap-1-Texten angezeigt
  const chronikBtn = `<button class="action-btn action-btn-sm" onclick="showContent('${CONTENT.CHRONIK}')" style="margin-top:10px">📜 Chronik</button>`;

  // ── Kap 1 Phasen (10101–10106) ───────────────────────────
  if (storyState < 20100) {
    let label, title, text, subHtml = '';

    if (storyState === 10101) {
      label = 'Treutheim — erste Schritte';
      title = 'Angekommen';
      text  = 'Größer, lauter, unordentlicher als erwartet — aber auch voller Möglichkeiten, die es dort, wo ich herkomme, nie gegeben hat.';
    } else if (storyState === 10102) {
      label = 'Treutheim';
      title = 'Ich werde beobachtet';
      text  = 'Irgendetwas stimmt nicht. Jemand beobachtet mich — ich spüre es in der Stille zwischen den Blicken.';
    } else if (storyState === 10103) {
      label   = 'Nach dem ersten Raub';
      title   = 'Alles weg';
      text    = 'Die Hände zittern noch — nicht vor Angst, vor blankem Unglauben. Er hat es beiläufig gemacht. Als wäre ich keine Bedrohung.';
      subHtml = `<p class="location-card-desc" style="color:var(--muted);font-style:italic">Weitermachen. Schneller diesmal.</p>`;
    } else if (storyState === 10104) {
      label = 'Nach dem zweiten Raub';
      title = 'Kein Zufall';
      text  = 'Er weiß, wann ich komme. Das ist System — und ich bin das Opfer, das es noch nicht begriffen hat.';
    } else if (storyState === 10105) {
      label = 'Nach dem dritten Raub';
      title = 'Dreimal';
      text  = 'Ich stehe gegen eine Wand und warte auf den vierten. Etwas muss sich ändern — nicht beim nächsten Anlauf. Jetzt.';
    } else if (storyState === 10106) {
      label = 'Nach dem vierten Raub';
      if (skills.paranoid >= 1) {
        title = 'Paranoid — und klüger';
        text  = 'Ja, ich bin paranoid. Aber paranoid macht mich schärfer. Der nächste Anlauf wird anders.';
      } else {
        title = 'Vier Mal';
        text  = 'Ich bin wütend genug, um endlich klug zu handeln.';
      }
    } else {
      // Fallback für Kap-1-Zwischenzustände
      label = `Treutheim — Tag ${gameClock.day}`;
      title = 'Angekommen';
      text  = 'Größer, lauter, unordentlicher als erwartet — aber auch voller Möglichkeiten, die es dort, wo ich herkomme, nie gegeben hat.';
    }

    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">${label}</div>
        <div class="location-card">
          <div class="location-card-title">${title}</div>
          <p class="location-card-desc">${text}</p>
          ${subHtml}
        </div>
      </div>`;
    return;
  }

  // ── Kap-2-Phasen (20100–20106) ───────────────────────────
  if (storyState < 20200) {
    let label, title, text, subHtml = '';

    if (storyState === 20100 && !gameFlags.kapitel2Unlocked) {
      // Bewusster Neuanfang-Zustand (storyState 20100 aber Kap2 noch nicht aktiv)
      label = 'Treutheim — Wendepunkt';
      title = 'Der bewusste Neuanfang';
      text  = 'Mein Gold ist fort — diesmal absichtlich zurückgelassen. Die Rückschläge haben mich verändert. Zeit, daraus Stärke zu machen.';
    } else if (storyState === 20100) {
      label = 'Treutheim — Gildenmitglied';
      title = 'Ich gehöre dazu';
      text  = 'Ein Siegel, ein Name in einem Buch. Das fühlt sich anders an — nicht nur ein Titel, sondern ein erster echter Schritt.';
    } else if (storyState === 20101) {
      label = 'Das Jagdgebiet';
      if (quests.theftInvestigation?.state && quests.theftInvestigation.state !== 'unstarted') {
        title = 'Die Spur';
        text  = 'Die Spur des Diebs führt ins Jagdgebiet. Ich halte die Augen offen.';
      } else {
        title = 'Das Jagdgebiet ruft';
        text  = 'Stärker werden und die Wahrheit finden — beides wartet dort draußen.';
      }
    } else if (storyState === 20102) {
      label = 'Spuren';
      title = 'Korbin hat geredet';
      text  = 'Eine Raubserie. Jemand sammelt gezielt — und ich war sein Ziel. Die Antwort liegt draußen.';
    } else if (storyState === 20103) {
      label = 'Ein Fund';
      title = 'Meine eigene Münze';
      text  = 'Unter Räuberhabe. Das ist kein Zufall mehr — das ist ein Fingerzeig. Mira weiß mehr.';
    } else if (storyState === 20104) {
      label = 'Mira hat gesprochen';
      title = 'Mira hat gesprochen';
      text  = 'Ein Name. Eine Methode. Und ein Rat: erst stark genug werden, dann stellen.';
    } else if (storyState === 20105) {
      label = 'Stärke beweisen';
      if (!gameFlags.waldtrollKilled) {
        title = 'Erst die Stärke';
        text  = 'Brakka warnt: er respektiert nur Kraft. Der Waldtroll muss fallen.';
      } else if (getStrengthLevel(strength.xp) < 3) {
        title = 'Noch nicht bereit';
        text  = 'Der Troll liegt hinter mir — aber für den Fremden brauche ich noch mehr.';
      } else {
        title = 'Bereit';
        text  = 'Der Troll liegt hinter mir. Jetzt stelle ich den Fremden.';
      }
    } else if (storyState === 20106) {
      label = 'Konfrontation';
      title = 'Die Konfrontation';
      text  = 'Er wusste, wer ich bin. Ich weiß jetzt, wer er ist. Brakka und Mira verdienen die Wahrheit.';
    } else {
      label = 'Treutheim';
      title = 'Ein neues Kapitel';
      text  = 'Die Gilde wartet. Mein nächster Schritt wird größer sein als alles, was ich bisher gewagt habe.';
    }

    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">${label}</div>
        <div class="location-card">
          <div class="location-card-title">${title}</div>
          <p class="location-card-desc">${text}</p>
          ${subHtml}
          ${chronikBtn}
        </div>
      </div>`;
    return;
  }

  // ── storyState >= 20200: Post-Kap-2 (Lethkar / Velmark) ─
  let label, title, text, icon = '', extraHtml = '';

  if (gameFlags.kap4Complete) {
    icon  = '🌆';
    label = 'Velmark — Ende';
    title = 'Der Weg hat ein Ende';
    text  = 'Das Netz ist zerschnitten, Valdris gestellt. Geblieben ist die Stille danach — und ich, ein anderer als der, der einst aufbrach.';
    extraHtml = `<button class="action-btn action-btn-sm" onclick="showContent('${CONTENT.CHRONIK}')" style="margin-top:6px">📜 Chronik</button>`;
  } else if (gameFlags.allianzKomplett) {
    label = 'Velmark — Alle Fraktionen';
    title = 'Alle Fraktionen vereint';
    text  = 'Drei Fraktionen stehen hinter mir. Valdris ist eingekreist. Es ist Zeit für das letzte Gespräch.';
  } else if (gameFlags.velmarkUnlocked) {
    icon  = '🌆';
    label = 'Velmark';
    title = 'Velmarks Netz';
    text  = 'Drei Fraktionen, ein Geflecht aus Schulden — und irgendwo darin Valdris. Ich beginne, Faden um Faden.';
  } else if (gameFlags.kap3Complete) {
    icon  = '🗺';
    label = 'Lethkar liegt hinter mir';
    title = 'Lethkar liegt hinter mir';
    text  = 'Valdris zieht sich nach Osten zurück. Der nächste Schritt wartet auf der Weltkarte.';
  } else if (gameFlags.lethkarUnlocked) {
    icon  = '🏙';
    label = 'Lethkar';
    // Lethkar-interner Zustand anhand von Flags
    if (gameFlags.chapter3StoryComplete) {
      title = 'Am Ende von Lethkar';
      text  = 'Alles, was hier zu tun war, ist getan. Der Weg weist nach Osten.';
    } else if (gameFlags.valdrisOperationRaided) {
      title = 'Das Lager ist durchsucht';
      text  = 'Valdris ist fort. Doch die Spuren verraten, wohin er sich zurückgezogen hat.';
    } else if (gameFlags.varenaRevealedValdrisIdent) {
      title = 'Varena hat gesprochen';
      text  = 'Ein Name, und dahinter eine ganze Geschichte. Das Netz ist größer, als ich ahnte — und Valdris steckt mittendrin.';
    } else if (gameFlags.alchemieGeselleReached) {
      title = 'Geselle';
      text  = 'Das Feuer kennt jetzt meine Hände. Varena hat bemerkt, was in mir steckt.';
    } else if (alchemie && alchemie.unlocked) {
      title = 'Die Alchemie ruft';
      text  = 'Die Werkstatt wartet. Jede Stufe bringt mich Varena näher — und der Wahrheit.';
    } else {
      title = 'Lethkar';
      text  = 'Kälter als Treutheim, mehr Schatten als Licht. Aber auch mehr Wissen — und Varena, die weiß, was Miras Brief wirklich bedeutet.';
    }
  } else {
    // Kap-2-Ende, noch kein Lethkar
    label = 'Der Weg nach Norden';
    title = 'Der Weg nach Norden';
    text  = 'Der Mut ist da. Lethkar wartet — die Adresse aus dem Brief weist mir den Weg.';
  }

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">${icon ? icon + ' ' : ''}${label}</div>
      <div class="location-card">
        <div class="location-card-title">${title}</div>
        <p class="location-card-desc">${text}</p>
        ${extraHtml}
        ${chronikBtn}
      </div>
    </div>`;
}

/* ── Weltkarte: Übersicht bekannter (und unbekannter) Regionen ── */
function renderWeltkarte(el) {
  // Lethkar wird sichtbar sobald Kap-2 abgeschlossen und Mut ausreicht
  const canUnlockLethkar = storyState >= 20200 && mut.points >= 3 && !gameFlags.lethkarUnlocked;
  if (canUnlockLethkar) {
    gameFlags.lethkarUnlocked = true;
    maybeShowStoryDialog('3.0');
  }

  // Velmark wird sichtbar sobald Kap-3 vollständig abgeschlossen
  const canUnlockVelmark = gameFlags.kap3Complete && !gameFlags.velmarkUnlocked;
  if (canUnlockVelmark) {
    gameFlags.velmarkUnlocked = true;
    navUnseen.velmark = true;
    render();
    setTimeout(() => maybeShowStoryDialog('4.1'), 400);
    return;
  }

  // Lethkar ist bekannt (Ziel auf Miras Brief) sobald der Brief entschlüsselt
  // wurde — auch wenn noch nicht freigeschaltet
  const lethkarHinted = storyState >= 20200 && mut.points < 3;
  const velmarkHinted  = gameFlags.lethkarUnlocked && !gameFlags.velmarkUnlocked;

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

        ${gameFlags.velmarkUnlocked
          ? `<div class="action-card">
              <div class="action-card-icon">🌆</div>
              <div class="action-card-name">Velmark</div>
              <p class="action-card-desc">Eine Handelsstadt im Osten — Valdris' Heimat. Drei Fraktionen, ein Netz aus Loyalitäten, und eine offene Rechnung.</p>
              <button class="action-btn" onclick="enterCity('velmark')">Betreten</button>
            </div>`
          : velmarkHinted
            ? `<div class="action-card action-card-locked">
                <div class="action-card-icon">🌆</div>
                <div class="action-card-name">Velmark</div>
                <p class="action-card-desc">Dorthin, woher Valdris kommt. Ich bin noch nicht bereit aufzubrechen.</p>
                <button class="action-btn btn-disabled" disabled>Noch nicht bereit</button>
              </div>`
            : ''
        }

      </div>

      ${gameFlags.chapter2Complete ? `
        <div class="prestige-offer" style="margin-top:18px;padding:12px;border:1px solid var(--border);border-radius:6px;background:var(--bg2);">
          <p style="color:var(--text-mid);margin-bottom:8px;">Was ich in Treutheim durchlebt habe, könnte ich erneut durchleben — mit mehr Erfahrung und Stärke.</p>
          <button class="action-btn" onclick="showKap2PrestigeDialog()">
            🔄 Als Veteran zurückkehren (+${3 + kap2ResetCount * 2} Ruf)
          </button>
        </div>` : ''}

      ${gameFlags.kap3Complete ? `
        <div class="prestige-offer" style="margin-top:12px;padding:12px;border:1px solid var(--border);border-radius:6px;background:var(--bg2);">
          <p style="color:var(--text-mid);margin-bottom:8px;">Ich könnte nach Lethkar zurückkehren — die Alchemie erneut ergründen, tiefer als beim ersten Mal.</p>
          <button class="action-btn" onclick="showKap3PrestigeDialog()">
            ↩ Nach Lethkar zurück (+${5 + kap3ResetCount * 3} Wissensdurst ✦)
          </button>
        </div>` : ''}

    </div>
  `;
}

/* ── Prestige-Bestätigungs-Dialoge ──────────────────────────────────── */

function showKap2PrestigeDialog() {
  const earned = 3 + kap2ResetCount * 2;
  showDialog({
    title: 'Als Veteran zurückkehren?',
    text: [
      'Meine bisherigen Errungenschaften in Treutheim bleiben, aber der Fortschritt in Kapitel 2 wird zurückgesetzt.',
      `Ich behalte 25 % meines Goldes${getRufStartGold() > 0 ? ` + ${getRufStartGold()} Startgold (Schnellstart)` : ''}, alle EP, Mut und Ruf-Fähigkeiten.`,
      `Ich erhalte +${earned} Ruf, die ich dauerhaft für Kampf-Boni einsetzen kann.`
    ],
    buttons: [
      {
        label: `🔄 Zurückkehren (+${earned} Ruf)`,
        onClick: () => closeDialog(() => performKap2PrestigeReset())
      },
      { label: 'Abbrechen', onClick: () => closeDialog() }
    ]
  });
}

function showKap3PrestigeDialog() {
  const earned = 5 + kap3ResetCount * 3;
  showDialog({
    title: 'Nach Lethkar zurückkehren?',
    text: [
      'Der Alchemie-Fortschritt wird zurückgesetzt, aber alle freigeschalteten Wissensdurst-Fähigkeiten bleiben.',
      `Ich erhalte +${earned} Wissensdurst ✦ — mehr als beim ersten Mal.`,
      'EP, Mut, Ruf und alles aus Treutheim bleibt vollständig erhalten.'
    ],
    buttons: [
      {
        label: `↩ Zurückkehren (+${earned} ✦)`,
        onClick: () => closeDialog(() => performKap3PrestigeReset())
      },
      { label: 'Abbrechen', onClick: () => closeDialog() }
    ]
  });
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

  if (gameFlags.workBlockedByRobberies && !skills.paranoid) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Arbeitsplatz</div>
        <div class="location-card">
          <p class="location-card-desc">
            Ich kann nicht weiterarbeiten. Nicht so.
          </p>
          <p class="location-card-desc">
            Viermal ausgeraubt, viermal wieder von vorn. Das ist kein Pech — das ist ein System, und ich spiele mit, ohne es zu verstehen.
          </p>
          <p class="location-card-desc">
            Ich werde noch wahnsinnig. Bevor ich wieder eine Schaufel in die Hand nehme, muss ich mir einen Plan machen.
          </p>
          <p class="location-card-desc action-card-warning">
            → Im Erfahrungs-Baum liegt die Antwort.
          </p>
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

  const exhausted = !night && needs.tiredness >= 100;
  if (exhausted && jobInfoPanelOpen) jobInfoPanelOpen = false;

  const jobInfoPanel = levelingUnlocked ? `
    <div class="job-info-panel${jobInfoPanelOpen ? ' open' : ''}">
      <div class="job-info-title">Feldarbeit</div>
      <div class="job-info-current">Lvl ${workLevel} — ${currentDef.label}</div>
      <div class="job-info-xp">${xpLine}</div>
      <div class="job-info-divider"></div>
      ${nextLevelBlock}
      ${computedBlock}
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
      ${(() => {
        const restLevel     = getSkillLevel(SKILL_ID.LONGER_REST);
        const mins          = getRestDurationMins();
        const recovery      = Math.round(10 * getRestRecoveryMult());
        const hungerReduce  = getRestHungerReduction();
        const name          = restLevel >= 1 ? 'Lange Pause' : 'Kurz verschnaufen';
        const desc          = restLevel >= 3
          ? 'Eine tiefe, ausgedehnte Ruhepause — Körper und Geist erholen sich vollständig.'
          : restLevel >= 1
            ? 'Eine ausgedehnte Ruhepause — Körper und Geist kommen zur Ruhe.'
            : 'Eine kurze Pause — genug, um wieder in die Gänge zu kommen.';
        const hungerNote    = hungerReduce > 0
          ? ` · 🍞 Hunger: −${hungerReduce}%`
          : '';
        return `
      <div class="action-card" style="width:260px;">
        <div class="action-card-icon">😮‍💨</div>
        <div class="action-card-name">${name}</div>
        <p class="action-card-desc">${desc}</p>
        <button class="action-btn" onclick="ausruhen()">Pause einlegen</button>
        <div class="action-card-effect">🕐 Spielzeit: +${mins} Min · 😴 Müdigkeit: −${recovery}%${hungerNote}</div>
      </div>`;
      })()}`;
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

          <div class="progress-container${busy ? '' : ' hidden'}" id="progress-container">
            <div class="progress-bar" id="progress-bar" style="width: ${workProgress}%"></div>
            <span class="progress-label" id="progress-label">${pctStr}</span>
          </div>

          <button
            class="action-btn action-btn-primary work-btn"
            id="btn-work"
            onclick="startWork()"
            ${busy || gameFlags.mustEatBread ? 'disabled' : ''}
          >
            ${normalBusy ? '⏳ Am Schuften…' : busy ? '⏳ Am Schuften…' : '⚒ Schuften'}
          </button>
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

  const blockedByHunger = gameFlags.mustEatBread;
  const blockedByTiredness = needs.tiredness >= 100;
  const blocked = blockedByHunger || blockedByTiredness;
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
        ${blockedByHunger ? `<p class="action-card-warning">🍞 Zu schwach vor Hunger — erst Brot vom Marktplatz essen.</p>` : ''}
        ${blockedByTiredness ? `<p class="action-card-warning">😴 Zu erschöpft zum Sammeln — erst schlafen gehen.</p>` : ''}
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
          <button class="action-btn" onclick="showContent('${CONTENT.SCHLAFPLATZ}')">🛏 Schlafen (Qualität ${qualityTier})</button>
          ${meta.hasSmith
            ? `<button class="action-btn" onclick="showContent('${CONTENT.SCHMIEDE}')">⚒ Zur Schmiede</button>`
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

  // Auf der Straße ist anfangs die einzige sichtbare Option — die Absteige
  // erscheint erst, nachdem die Figur weiß, wie schlecht sich das anfühlt
  // (siehe SLEEP_OPTIONS, `requiresFlag`).
  const visibleOptions = SLEEP_OPTIONS.filter(o =>
    (!o.requiresFlag || gameFlags[o.requiresFlag]) &&
    (!o.requiresMeta  || meta[o.requiresMeta])
  );
  const cards = visibleOptions.map(o => {
    const penalty      = getNightWatchRecoveryPenalty(o);
    const recoveryMult = nightFlags.recoveryDebuff ? (1 - penalty) : 1;
    const qualityTier  = getSleepQualityTier(o);
    const reliefPct    = night ? Math.round(100 * recoveryMult * getSleepQualityFactor(o)) : Math.round(100 * getSleepQualityFactor(o));
    const canAfford    = resources.gold >= o.cost;
    const hungerEffect = o.hungerPenalty ? `🍞 Hunger +${o.hungerPenalty}%` : '🍞 Hunger ±0%';
    const reliefLabel  = Math.round(100 * getSleepQualityFactor(o));
    const qualityBadge = `<div class="sleep-quality-badge">Schlafqualität ${qualityTier} ` +
      `<span class="info-hint" tabindex="0" title="Höhere Schlafqualität → mehr regenerierte Müdigkeit. Aktuell: −${reliefLabel}% Müdigkeit pro Schlaf.">ⓘ</span></div>`;
    const debuffNote   = night && nightFlags.recoveryDebuff && penalty > 0
      ? `<p class="action-card-warning">⚠ Nach der Nachtwache erhole ich mich heute −${Math.round(penalty * 100)}% schlechter.</p>`
      : '';

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
        ${debuffNote}
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
      <div class="action-grid">
        ${cards}

        ${!meta.hasHome ? `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">🔒</div>
          <div class="action-card-name">Im eigenen Bett schlafen</div>
          <p class="action-card-desc">???</p>
          <div class="action-card-cost">Erfordert ein eigenes Zuhause</div>
          <button class="action-btn btn-disabled" disabled>Gesperrt</button>
        </div>` : ''}

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
          <button class="tab-btn ${historyFilter === HISTORY_FILTER.TOASTS ? 'active' : ''}" onclick="setHistoryFilter('${HISTORY_FILTER.TOASTS}')">Meldungen (${toastHistory.length})</button>
          <button class="tab-btn ${historyFilter === HISTORY_FILTER.DIALOGE ? 'active' : ''}" onclick="setHistoryFilter('${HISTORY_FILTER.DIALOGE}')">Dialoge (${dialogHistory.length})</button>
        </div>
        <div class="history-panel">
          ${historyFilter === HISTORY_FILTER.TOASTS
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
        <div class="settings-section-title">🎵 Audio</div>
        <div class="settings-audio-row">
          <label class="settings-audio-label">Musik</label>
          <div class="audio-control">
            <input type="checkbox" id="music-toggle"
              ${audioSettings.musicEnabled ? 'checked' : ''}
              onchange="setMusicEnabled(this.checked)">
            <input type="range" min="0" max="1" step="0.05"
              value="${audioSettings.musicVolume}"
              oninput="setMusicVolume(parseFloat(this.value))"
              ${!audioSettings.musicEnabled ? 'disabled' : ''}>
            <span class="audio-volume-label">${Math.round(audioSettings.musicVolume * 100)}%</span>
          </div>
        </div>
        <div class="settings-audio-row">
          <label class="settings-audio-label">Soundeffekte</label>
          <div class="audio-control">
            <input type="checkbox" id="sfx-toggle"
              ${audioSettings.sfxEnabled ? 'checked' : ''}
              onchange="setSfxEnabled(this.checked)">
            <input type="range" min="0" max="1" step="0.05"
              value="${audioSettings.sfxVolume}"
              oninput="setSfxVolume(parseFloat(this.value))"
              ${!audioSettings.sfxEnabled ? 'disabled' : ''}>
            <span class="audio-volume-label">${Math.round(audioSettings.sfxVolume * 100)}%</span>
          </div>
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
            <span class="info-value">${GAME_VERSION}</span>
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
      <button class="action-btn" onclick="showContent('${p.id}')">Hingehen</button>
    </div>`).join('');

  const wildkrautCount = questItems.wildkraut || 0;
  const kraeuter = quests.varenaErstkontakt?.state === QUEST_STATE.ACTIVE ? `
    <div class="action-card">
      <div class="action-card-icon">🌿</div>
      <div class="action-card-name">Wildkraut sammeln</div>
      <p class="action-card-desc">Am Waldrand wächst das seltene Wildkraut, das Varena sucht. ${wildkrautCount}/5 gesammelt.</p>
      <div class="action-card-effect">🌿 +1 Wildkraut · 😴 +5% · 🍞 +3%</div>
      ${wildkrautCount >= 5 ? '<div class="action-card-effect" style="color:var(--c-reward)">✓ Genug gesammelt — zu Varena!</div>' : ''}
      <button class="action-btn" onclick="sammleWildkraut()" ${wildkrautCount >= 5 ? 'disabled' : ''}>Sammeln</button>
    </div>` : '';

  const valdrisSpurenCards = (() => {
    const qs = quests.valdrisSpuren?.state;
    if (!qs || qs === 'unstarted' || qs === 'rewarded') return '';
    const done1 = qs !== 'ort1';
    const done2 = !['ort1','ort2'].includes(qs);
    const done3 = !['ort1','ort2','ort3'].includes(qs);
    return `
      <div class="action-card ${done1 ? 'quest-card-done' : ''}">
        <div class="action-card-icon">🔍</div>
        <div class="action-card-name">Valdris' Spur: Taverne</div>
        <p class="action-card-desc">In der Taverne soll jemand Informationen hinterlassen haben.</p>
        <button class="action-btn" onclick="untersucheValdrisOrt(1)" ${done1 ? 'disabled' : ''}>${done1 ? 'Untersucht' : 'Untersuchen'}</button>
      </div>
      <div class="action-card ${done2 ? 'quest-card-done' : ''}" style="${qs === 'ort1' ? 'opacity:0.5' : ''}">
        <div class="action-card-icon">🔍</div>
        <div class="action-card-name">Valdris' Spur: Markt</div>
        <p class="action-card-desc">Ein Stand am Markt soll regelmäßige Gäste gehabt haben, die keine Waren kauften.</p>
        <button class="action-btn" onclick="untersucheValdrisOrt(2)" ${done2 || qs === 'ort1' ? 'disabled' : ''}>${done2 ? 'Untersucht' : qs === 'ort1' ? 'Gesperrt' : 'Untersuchen'}</button>
      </div>
      <div class="action-card ${done3 ? 'quest-card-done' : ''}" style="${['ort1','ort2'].includes(qs) ? 'opacity:0.5' : ''}">
        <div class="action-card-icon">🔍</div>
        <div class="action-card-name">Valdris' Spur: Stadtrand</div>
        <p class="action-card-desc">Am Nordrand liegt ein verlassenes Lagerhaus — Berichte über merkwürdige Aktivitäten.</p>
        <button class="action-btn" onclick="untersucheValdrisOrt(3)" ${done3 || ['ort1','ort2'].includes(qs) ? 'disabled' : ''}>${done3 ? 'Untersucht' : ['ort1','ort2'].includes(qs) ? 'Gesperrt' : 'Untersuchen'}</button>
      </div>`;
  })();

  const raidCard = gameFlags.chapter3StoryComplete ? (() => {
    if (gameFlags.valdrisOperationRaided) {
      return `
        <div class="action-card quest-card-done">
          <div class="action-card-icon">🏚</div>
          <div class="action-card-name">Valdris' Lager</div>
          <p class="action-card-desc">Ich war bereits drin. Es war leer — aber nicht ohne Spuren.</p>
          <button class="action-btn btn-disabled" disabled>Erkundet</button>
        </div>`;
    }
    return `
      <div class="action-card">
        <div class="action-card-icon">🏚</div>
        <div class="action-card-name">Valdris' Lager</div>
        <p class="action-card-desc">Am Nordrand der Stadt, zwischen zwei Lagerhäusern. Pereth, Thessa, Varena — alle drei wissen, wo es ist. Niemand ist hingegangen.</p>
        <button class="action-btn" onclick="raidValdrisLager()">Erkunden</button>
      </div>`;
  })() : '';

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Lethkar</div>
      <p class="location-card-desc" style="margin-bottom:12px;">Eine alte Gelehrtenstadt im Norden. Pflastersteine statt Feldwege, Türme statt Kirchendächer — und überall dieser Geruch von Kräutern und heißem Metall.</p>
      <div class="action-grid">${cards}${kraeuter}${valdrisSpurenCards}${raidCard}</div>
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
  const nightClosed = isNight();

  // Alchemisten-Werkzeug: einmaliger Kauf, +50% Alchemie-Tempo
  const werkzeugCost = 5000;
  const werkzeugOwned = meta.alchemieWerkzeug;
  const canBuyWerkzeug = !werkzeugOwned && resources.gold >= werkzeugCost && !nightClosed;

  // Lethkarer Rationen — aus market.js (LETHKAR_FOOD_ITEMS)
  const LETHKAR_FOOD = LETHKAR_FOOD_ITEMS;

  const werkzeugCard = `
    <div class="action-card${werkzeugOwned ? ' quest-card-done' : ''}">
      <div class="action-card-icon">⚗</div>
      <div class="action-card-name">Alchemisten-Werkzeug</div>
      <p class="action-card-desc">Präzise Tiegel, fein justierte Waagen, speziell beschichtete Glaskolben. Einmaliger Kauf.</p>
      <div class="action-card-effect">+50 % Alchemie-Tempo (permanent, dauerhaft)</div>
      ${werkzeugOwned
        ? `<button class="action-btn btn-disabled" disabled>Erworben ✓</button>`
        : `<div class="action-card-cost ${canBuyWerkzeug ? 'cost-ok' : 'cost-too-high'}">${werkzeugCost} Gold</div>
           <button class="action-btn ${canBuyWerkzeug ? '' : 'btn-disabled'}"
             onclick="buyAlchemieWerkzeug()"
             ${canBuyWerkzeug ? '' : 'disabled'}>
             ${nightClosed ? 'Markt geschlossen' : resources.gold < werkzeugCost ? `Nicht genug Gold (${werkzeugCost}g)` : 'Kaufen'}
           </button>`
      }
    </div>`;

  const foodCards = LETHKAR_FOOD.map(item => {
    const owned = resources.inventory[item.id] || 0;
    const canBuy = resources.gold >= item.cost && !nightClosed;
    const effectParts = [];
    if (item.hungerRelief)    effectParts.push(`🍞 Hunger −${item.hungerRelief}%`);
    if (item.tirednessRelief) effectParts.push(`😴 Müdigkeit −${item.tirednessRelief}%`);
    return `
      <div class="action-card">
        <div class="action-card-icon">${item.icon}</div>
        <div class="action-card-name">${item.name}${owned ? ` <span class="inventory-count">×${owned} im Inventar</span>` : ''}</div>
        <p class="action-card-desc">${item.desc}</p>
        <div class="action-card-effect">${effectParts.join(' · ')}</div>
        <div class="action-card-cost ${canBuy ? 'cost-ok' : 'cost-too-high'}">${item.cost} Gold</div>
        <button class="action-btn ${canBuy ? '' : 'btn-disabled'}"
          onclick="buyLethkarFood('${item.id}',${item.cost})"
          ${canBuy ? '' : 'disabled'}>
          ${nightClosed ? 'Markt geschlossen' : 'Kaufen'}
        </button>
      </div>`;
  }).join('');

  const traded = quests.lethkarMarkt?.goldTraded || 0;
  const questActive = quests.lethkarMarkt?.state === 'active';
  const canSell = !nightClosed;
  const sellCard = `
    <div class="action-card">
      <div class="action-card-icon">🪙</div>
      <div class="action-card-name">Waren anbieten</div>
      <p class="action-card-desc">Mitgebrachtes feilbieten — Rohstoffe, Kräuter, was die Wildnis hergibt.</p>
      <div class="action-card-effect">+15–30 Gold · 😴 Müdigkeit +8 % · 🍞 Hunger +5 %</div>
      ${questActive ? `<div class="action-card-warning">Handelsvolumen: ${traded}/200 Gold</div>` : ''}
      <button class="action-btn ${canSell ? '' : 'btn-disabled'}"
        onclick="lethkarHandel()"
        ${canSell ? '' : 'disabled'}>
        ${nightClosed ? 'Markt geschlossen' : 'Verkaufen'}
      </button>
    </div>`;

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Markt der Zutaten</div>
      <p class="location-card-desc" style="margin-bottom:12px;">Alchemistische Rohstoffe, hochwertige Waren, Dinge die man in Treutheim nicht findet.</p>
      <div class="market-section-label">Waren verkaufen</div>
      <div class="action-grid">${sellCard}</div>
      <div class="market-section-label" style="margin-top:16px;">Alchemie-Ausrüstung</div>
      <div class="action-grid">${werkzeugCard}</div>
      <div class="market-section-label" style="margin-top:16px;">Verpflegung</div>
      <div class="action-grid">${foodCards}</div>
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
    const penalty      = getNightWatchRecoveryPenalty(opt);
    const recoveryMult = nightFlags.recoveryDebuff ? (1 - penalty) : 1;
    const canAfford    = resources.gold >= opt.cost;
    const effectiveTier = getSleepQualityTier(opt);
    const reliefPct    = Math.round(100 * recoveryMult * getSleepQualityFactor(opt));
    const debuffNote   = nightFlags.recoveryDebuff && penalty > 0
      ? `<p class="action-card-warning">⚠ Nach der Nachtwache erhole ich mich heute −${Math.round(penalty * 100)}% schlechter.</p>`
      : '';
    return `
      <div class="action-card">
        <div class="action-card-icon">${opt.icon}</div>
        <div class="action-card-name">${opt.name}</div>
        <p class="action-card-desc">${opt.desc}</p>
        ${debuffNote}
        <div class="action-card-effect">😴 Müdigkeit −${reliefPct}% · Schlafqualität ${effectiveTier} · Kosten: ${opt.cost} Gold</div>
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

/* ══════════════════════════════════════════════════════════════
   Kapitel 4 — Velmark
   ══════════════════════════════════════════════════════════════ */

/* ── Ruf-Fähigkeiten (Kap-2-Prestige) ───────────────────────────── */
function renderRufFaehigkeiten(el) {
  const skills = RUF_SKILL_DEFS.map(def => {
    const owned   = !!rufSkills[def.id];
    const canBuy  = !owned && ruf >= def.cost;
    const locked  = !owned && !canBuy;
    return `
      <div class="action-card${owned ? ' quest-card-done' : locked ? ' action-card-locked' : ''}">
        <div class="action-card-name">${def.name}</div>
        <p class="action-card-desc">${def.desc}</p>
        <div class="action-card-effect">${owned ? '✓ Erworben' : `Kosten: ${def.cost} Ruf`}</div>
        ${owned
          ? `<button class="action-btn btn-disabled" disabled>Freigeschaltet ✓</button>`
          : `<button class="action-btn ${canBuy ? '' : 'btn-disabled'}"
               onclick="buyRufSkill('${def.id}')"
               ${canBuy ? '' : 'disabled'}>
               ${locked ? `${ruf}/${def.cost} Ruf` : 'Freischalten'}
             </button>`
        }
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Erfahrung als Veteran</div>
      <div class="alchemie-header" style="margin-bottom:12px;">
        <span class="alchemie-berufsstufe">Ruf</span>
        <span class="alchemie-wissensdurst">⚔ ${ruf} Ruf verfügbar</span>
      </div>
      <p style="color:var(--text-mid);font-size:0.85em;margin-bottom:14px;">
        Erworben durch wiederholtes Abschließen des zweiten Abschnitts. Permanente Kampf-Boni, die bei keinem Reset verloren gehen.
      </p>
      <div class="action-grid">${skills}</div>
    </div>`;
}

function renderVelmark(el) {
  const frakPlaces = [
    { id: CONTENT.VELMARK_FRAKTIONEN, icon: '🤝', name: 'Fraktionen',
      desc: 'Händlergilde, Eiserne Bruderschaft, Stadtarchiv — drei Kräfte, die diese Stadt zusammenhalten.' },
    { id: CONTENT.VELMARK_JAGDGEBIET, icon: '⚔', name: 'Velmarks Unterwelt',
      desc: 'In den Gassen und Lagerhäusern patrouillieren Valdris\' Leute. Ein riskanter Ort — aber mit Einfluss zu gewinnen.' },
    { id: CONTENT.VELMARK_MARKT, icon: '🏪', name: 'Der Große Markt',
      desc: 'Größer als alles in Lethkar. Informationen, Waffen, Alchemie-Rohmaterialien.' },
    { id: CONTENT.VELMARK_HAFEN, icon: '⚓', name: 'Velmarks Hafen',
      desc: 'Der Hafen schläft nie — Waren, Gerüchte und Arbeit fließen hier rund um die Uhr.' }
  ];

  const perethCard = gameFlags.perethFoundInVelmark ? '' : `
    <div class="action-card">
      <div class="action-card-icon">🕵</div>
      <div class="action-card-name">Ein bekanntes Gesicht</div>
      <p class="action-card-desc">Am Westkai sitzt jemand, den ich aus Lethkar kenne. Ich sollte ihn ansprechen.</p>
      <button class="action-btn" onclick="findPerethInVelmark()">Ansprechen</button>
    </div>`;

  const cards = frakPlaces.map(p => `
    <div class="action-card">
      <div class="action-card-icon">${p.icon}</div>
      <div class="action-card-name">${p.name}</div>
      <p class="action-card-desc">${p.desc}</p>
      <button class="action-btn" onclick="showContent('${p.id}')">Hingehen</button>
    </div>`).join('');

  const einflussInfo = `
    <div class="alchemie-header" style="margin-bottom:12px;">
      <span class="alchemie-berufsstufe">Velmark</span>
      <span class="alchemie-wissensdurst">⚜ ${einfluss.points} Einfluss <span style="color:var(--text-lo);font-size:0.8em;">(${einfluss.totalEarned} gesamt)</span></span>
    </div>`;

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Velmark</div>
      ${einflussInfo}
      <div class="action-grid">
        ${perethCard}
        ${cards}
      </div>
    </div>`;
}

function renderVelmarkFraktionen(el) {
  const fraktionenDefs = [
    {
      id: 'haendlergilde', icon: '💰', name: 'Händlergilde',
      desc: 'Die älteste Institution Velmarks. Wer in dieser Stadt handelt, handelt mit ihrer Erlaubnis.',
      voraussetzung: () => resources.gold >= 500,
      vorausText: `${resources.gold}/500 Gold verfügbar`,
      kontaktFlag: 'gildekontaktGeknuepft',
      npcId: 'gildenmeisterin'
    },
    {
      id: 'bruderschaft', icon: '⚔', name: 'Eiserne Bruderschaft',
      desc: 'Söldner, Wachen, Männer mit Muskeln und kurzen Gedächtnissen. Sie hören auf Stärke.',
      voraussetzung: () => mut.points >= 5,
      vorausText: `${mut.points}/5 Mut ⚔`,
      kontaktFlag: 'bruderschaftkontaktGeknuepft',
      npcId: 'hauptmann_gorr'
    },
    {
      id: 'archiv', icon: '📜', name: 'Stadtarchiv',
      desc: 'Die leiseste der drei Kräfte — und wahrscheinlich die mächtigste. Aufzeichnungen sind dauerhafte Waffen.',
      voraussetzung: () => einsicht.totalEarned >= 10,
      vorausText: `${einsicht.totalEarned}/10 Wissensdurst ✦ gesamt`,
      kontaktFlag: 'archivkontaktGeknuepft',
      npcId: 'archivarin_sele'
    }
  ];

  const cards = fraktionenDefs.map(f => {
    const rep = fraktionen[f.id];
    const repLabel = rep >= 80 ? 'Vollverbündet' : rep >= 60 ? 'Verbündet' : rep >= 30 ? 'Bekannt' : 'Unbekannt';
    const repColor = rep >= 80 ? 'var(--c-reward)' : rep >= 60 ? 'var(--c-event)' : rep >= 30 ? 'var(--c-purchase)' : 'var(--text-lo)';
    const met     = !!gameFlags[f.kontaktFlag];
    const canMeet = !met && f.voraussetzung();
    const locked  = !met && !canMeet;
    return `
      <div class="action-card${locked ? ' action-card-locked' : ''}">
        <div class="action-card-icon">${f.icon}</div>
        <div class="action-card-name">${f.name}
          ${met ? `<span style="color:${repColor};font-size:0.8em;margin-left:6px;">${repLabel} (${rep}/100)</span>` : ''}
        </div>
        <p class="action-card-desc">${f.desc}</p>
        ${met
          ? `<div class="xp-track" title="${rep}/100 Reputation">
               <div class="xp-bar" style="width:${rep}%;background:${repColor}"></div>
             </div>
             <button class="action-btn" onclick="openNpcDialog('${f.npcId}')">Sprechen</button>`
          : locked
            ? `<div class="action-card-effect" style="color:var(--text-lo)">Voraussetzung: ${f.vorausText}</div>
               <button class="action-btn btn-disabled" disabled>Noch nicht zugänglich</button>`
            : `<div class="action-card-effect">Voraussetzung erfüllt: ${f.vorausText}</div>
               <button class="action-btn" onclick="kontaktKnuepfen('${f.id}')">Kontakt aufnehmen</button>`
        }
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Fraktionen</div>
      <p style="color:var(--text-mid);font-size:0.85em;margin-bottom:12px;">
        ⚜ ${einfluss.points} Einfluss verfügbar · Reputation ≥ 80 bei allen drei Fraktionen für den Abschluss benötigt.
      </p>
      <div class="action-grid">${cards}</div>
    </div>`;
}

function renderVelmarkJagdgebiet(el) {
  if (combat.active) {
    renderKampf(el);
    return;
  }

  const lvlData  = getStrengthLevelData(strength.xp);
  const progress = getStrengthLevelProgress(strength.xp);
  const hpColor  = playerStats.hp > playerStats.maxHp * 0.4 ? '' : 'style="color:var(--accent)"';

  const tier3Monsters = MONSTER_DEFS.filter(m => m.tier === 3);
  const monsterCards = tier3Monsters.map(m => {
    const isDeep  = m.zone === 'velmark_tief';
    const blocked = isDeep && getStrengthLevel(strength.xp) < 3;
    const blockNote = blocked ? '<div class="hunt-blocked">Erfordert Stärke-Stufe 3 (Erfahrener Kämpfer).</div>' : '';
    const btnAttr   = blocked ? 'disabled' : `onclick="startCombat('${m.id}')"`;
    return `
      <div class="monster-card ${blocked ? 'monster-locked' : ''}">
        <div class="monster-icon">${m.icon}</div>
        <div class="monster-info">
          <div class="monster-name">${m.name}</div>
          <div class="monster-desc">${m.desc}</div>
          <div class="monster-stats">
            HP: ${m.maxHp} · Schaden: ${m.damage[0]}–${m.damage[1]}
            · XP: ${m.xpReward} · Gold: ${m.goldReward[0]}–${m.goldReward[1]}
            ${m.mutReward > 0 ? ` · Mut: ${m.mutReward}` : ''}
            ${m.einsichtReward > 0 ? ` · ✦ ${m.einsichtReward}` : ''}
            ${m.einflussReward > 0 ? ` · ⚜ ${m.einflussReward}` : ''}
          </div>
          ${blockNote}
        </div>
        <button class="action-btn hunt-btn" ${btnAttr}>Jagen</button>
      </div>`;
  }).join('');

  const progressBar = progress.span > 0
    ? `<div class="strength-progress-bar"><div class="strength-progress-fill" style="width:${progress.pct.toFixed(1)}%"></div></div>
       <div class="strength-progress-label">${progress.into}/${progress.span} XP bis zur nächsten Stufe</div>`
    : `<div class="strength-progress-label">Höchste Stufe erreicht!</div>`;

  el.innerHTML = `
    <div class="feature-stage-label">Velmarks Unterwelt</div>

    <div class="hunt-player-card">
      <div class="hunt-player-row">
        <span class="hunt-label">Lebenspunkte</span>
        <span class="hunt-value" ${hpColor}>${playerStats.hp} / ${playerStats.maxHp} HP</span>
      </div>
      <div class="hunt-hp-bar">
        <div class="hunt-hp-fill" style="width:${Math.round(playerStats.hp / playerStats.maxHp * 100)}%"></div>
      </div>
      <div class="hunt-player-row">
        <span class="hunt-label">Stärke-Stufe</span>
        <span class="hunt-value">${lvlData.label} (Lvl ${progress.level})</span>
      </div>
      ${progressBar}
      <div class="hunt-player-row" style="margin-top:6px">
        <span class="hunt-label">Einfluss</span>
        <span class="hunt-value">${einfluss.points} ⚜ (gesamt: ${einfluss.totalEarned})</span>
      </div>
    </div>

    <div class="hunt-info-text">
      Kämpfe in Velmarks Schatten bringen Einfluss ⚜ — und treiben Valdris' Söldner aus der Stadt.
      Im Kampf besiegt zu werden kostet 20 % deines Goldes. Schlafen stellt HP wieder her.
    </div>

    <div class="hunt-monster-list">
      ${monsterCards}
    </div>
  `;
}

function renderVelmarkMarkt(el) {
  const nightClosed = isNight();

  // ── Velmarker Kettenrüstung (permanent, −5 Kampfschaden)
  const ruestungCost   = 8000;
  const ruestungOwned  = meta.velmarkRuestung;
  const canBuyRuestung = !ruestungOwned && resources.gold >= ruestungCost && !nightClosed;
  const ruestungCard   = `
    <div class="action-card${ruestungOwned ? ' quest-card-done' : ''}">
      <div class="action-card-icon">🛡</div>
      <div class="action-card-name">Velmarker Kettenrüstung</div>
      <p class="action-card-desc">Geschmiedet in den unterirdischen Schmieden Velmarks. Schwerer als alles, was ich bisher getragen habe — aber auch widerstandsfähiger.</p>
      <div class="action-card-effect">−5 Kampfschaden (dauerhaft, jeder Kampf)</div>
      ${ruestungOwned
        ? `<button class="action-btn btn-disabled" disabled>Erworben ✓</button>`
        : `<div class="action-card-cost ${canBuyRuestung ? 'cost-ok' : 'cost-too-high'}">${ruestungCost} Gold</div>
           <button class="action-btn ${canBuyRuestung ? '' : 'btn-disabled'}"
             onclick="buyVelmarkRuestung()"
             ${canBuyRuestung ? '' : 'disabled'}>
             ${nightClosed ? 'Markt geschlossen' : resources.gold < ruestungCost ? `Nicht genug Gold (${ruestungCost}g)` : 'Kaufen'}
           </button>`
      }
    </div>`;

  // ── Netzwerk-Ausbau (Informanten-Max 5 → 8, kostet 20 ⚜)
  const netzwerkOwned  = meta.netzwerkErweitert;
  const netzwerkCost   = 20;
  const canBuyNetzwerk = !netzwerkOwned && einfluss.points >= netzwerkCost && gameFlags.informantenNetzFreigeschaltet;
  const netzwerkCard   = gameFlags.informantenNetzFreigeschaltet ? `
    <div class="action-card${netzwerkOwned ? ' quest-card-done' : ''}">
      <div class="action-card-icon">🕸</div>
      <div class="action-card-name">Geheimes Netzwerk</div>
      <p class="action-card-desc">Pereths tiefster Kontakt — Vermittler die selbst nie in einem Datenbuch auftauchen. Drei weitere Informanten können auf dieser Basis angeworben werden.</p>
      <div class="action-card-effect">Informanten-Maximum: 5 → 8</div>
      ${netzwerkOwned
        ? `<button class="action-btn btn-disabled" disabled>Erworben ✓</button>`
        : `<div class="action-card-cost ${canBuyNetzwerk ? 'cost-ok' : 'cost-too-high'}">${netzwerkCost} ⚜ Einfluss</div>
           <button class="action-btn ${canBuyNetzwerk ? '' : 'btn-disabled'}"
             onclick="buyNetzwerkAusbau()"
             ${canBuyNetzwerk ? '' : 'disabled'}>
             ${einfluss.points < netzwerkCost ? `${einfluss.points}/${netzwerkCost} ⚜` : 'Kaufen'}
           </button>`
      }
    </div>` : '';

  // ── Verpflegung
  const foodCards = VELMARK_FOOD_ITEMS.map(item => {
    const owned  = resources.inventory[item.id] || 0;
    const canBuy = resources.gold >= item.cost && !nightClosed;
    const effectParts = [];
    if (item.hungerRelief)    effectParts.push(`🍞 Hunger −${item.hungerRelief}%`);
    if (item.tirednessRelief) effectParts.push(`😴 Müdigkeit −${item.tirednessRelief}%`);
    return `
      <div class="action-card">
        <div class="action-card-icon">${item.icon}</div>
        <div class="action-card-name">${item.name}${owned ? ` <span class="inventory-count">×${owned} im Inventar</span>` : ''}</div>
        <p class="action-card-desc">${item.desc}</p>
        <div class="action-card-effect">${effectParts.join(' · ')}</div>
        <div class="action-card-cost ${canBuy ? 'cost-ok' : 'cost-too-high'}">${item.cost} Gold</div>
        <button class="action-btn ${canBuy ? '' : 'btn-disabled'}"
          onclick="buyVelmarkFood('${item.id}',${item.cost})"
          ${canBuy ? '' : 'disabled'}>
          ${nightClosed ? 'Markt geschlossen' : 'Kaufen'}
        </button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Der Große Markt</div>
      <p class="location-card-desc" style="margin-bottom:12px;">Velmarks Handelszentrum: hier endet jede Route, die durch diese Stadt führt.</p>
      <div class="market-section-label">Kampfausrüstung</div>
      <div class="action-grid">${ruestungCard}</div>
      ${netzwerkCard ? `<div class="market-section-label" style="margin-top:16px;">Untergrundkontakte</div>
      <div class="action-grid">${netzwerkCard}</div>` : ''}
      <div class="market-section-label" style="margin-top:16px;">Verpflegung</div>
      <div class="action-grid">${foodCards}</div>
    </div>`;
}

function renderVelmarkSchlafplatz(el) {
  if (!isNight()) {
    const tiredness = needs.tiredness;
    const tier = getTirednessTier(tiredness);
    const msg = tier.id === 'fresh' || tier.id === 'tired'
      ? 'Die Sonne steht noch hoch. Schlafen wäre vertane Zeit.'
      : 'Erschöpft — aber der Tag läuft noch. Ich muss die Stunden nutzen.';
    el.innerHTML = `<div class="feature-stage"><div class="feature-stage-label">Schlafplatz</div><p class="location-card-desc">${msg}</p></div>`;
    return;
  }

  const VELMARK_SLEEP_OPTIONS = [
    {
      id: 'velmark_pension', name: 'Hafenpension "Morgenwind"', icon: '🛏', cost: 12, qualityTier: 2,
      desc: 'Eine ruhige Kammer mit Blick aufs Wasser. Geräuschloser als das Hafen-Treiben unten.'
    },
    {
      id: 'velmark_suite', name: 'Herrschaftliche Suite', icon: '🏨', cost: 40, qualityTier: 3,
      desc: 'Für Leute, die sich das leisten können. Weiche Matratze, keine Nachbarn, keine Fragen.'
    }
  ];

  const cards = VELMARK_SLEEP_OPTIONS.map(opt => {
    const penalty      = getNightWatchRecoveryPenalty(opt);
    const recoveryMult = nightFlags.recoveryDebuff ? (1 - penalty) : 1;
    const canAfford    = resources.gold >= opt.cost;
    const effectiveTier = getSleepQualityTier(opt);
    const reliefPct    = Math.round(100 * recoveryMult * getSleepQualityFactor(opt));
    const debuffNote   = nightFlags.recoveryDebuff && penalty > 0
      ? `<p class="action-card-warning">⚠ Nach der Nachtwache erhole ich mich heute −${Math.round(penalty * 100)}% schlechter.</p>`
      : '';
    return `
      <div class="action-card">
        <div class="action-card-icon">${opt.icon}</div>
        <div class="action-card-name">${opt.name}</div>
        <p class="action-card-desc">${opt.desc}</p>
        ${debuffNote}
        <div class="action-card-effect">😴 Müdigkeit −${reliefPct}% · Schlafqualität ${effectiveTier} · Kosten: ${opt.cost} Gold</div>
        <button class="action-btn ${canAfford ? '' : 'btn-disabled'}"
          onclick="sleepAt('${opt.id}',${opt.cost},${opt.qualityTier})"
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

function renderVelmarkHafen(el) {
  const einflussPoints = einfluss.points || 0;

  const hafenCard = gameFlags.isHafenarbeit ? `
    <div class="action-card">
      <div class="action-card-icon">⚓</div>
      <div class="action-card-name">Hafenarbeit</div>
      <p class="action-card-desc">Waren schleppen, Boote vertäuen, Ladungen prüfen. Harte Arbeit — aber Velmark-Verdienst.</p>
      <div class="xp-track"><div class="xp-bar" id="hafen-progress-bar" style="width:0%"></div></div>
      <div class="action-card-effect" id="hafen-progress-label" style="margin-top:4px">0%</div>
    </div>` : `
    <div class="action-card">
      <div class="action-card-icon">⚓</div>
      <div class="action-card-name">Hafenarbeit</div>
      <p class="action-card-desc">Waren schleppen, Boote vertäuen, Ladungen prüfen. Harte Arbeit — aber Velmark-Verdienst.</p>
      <div class="action-card-effect">💰 +30–60 Gold · ⚜ +1–2 Einfluss · 😴 +12% · 🍞 +8%</div>
      ${!gameFlags.hafenarbeitUnlocked ? '<div class="action-card-warning">Freigeschaltet durch Hafen-Quests</div>' : ''}
      <button class="action-btn" onclick="hafenarbeit()" ${!gameFlags.hafenarbeitUnlocked || isNight() ? 'disabled' : ''}>
        ${!gameFlags.hafenarbeitUnlocked ? 'Noch nicht verfügbar' : isNight() ? 'Nachts geschlossen' : 'Arbeiten'}
      </button>
    </div>`;

  const harroCard = `
    <div class="action-card">
      <div class="action-card-icon">😓</div>
      <div class="action-card-name">Harro</div>
      <p class="action-card-desc">Ein nervöser Mann am Kai. Weiß mehr, als er zeigt.</p>
      <button class="action-btn" onclick="openVelmarkNpcDialog('harro')">Ansprechen</button>
    </div>`;

  const stadtwacheCard = gameFlags.velmarkStadtwacheUnlocked
    ? (gameFlags.isVelmarkWache ? `
    <div class="action-card">
      <div class="action-card-icon">🛡</div>
      <div class="action-card-name">Velmark-Stadtwache</div>
      <p class="action-card-desc">Gelegentliche Schicht mit der Stadtwache — seriöser als Hafenarbeit, solider Verdienst.</p>
      <div class="xp-track"><div class="xp-bar" id="velmarkwache-progress-bar" style="width:0%"></div></div>
      <div class="action-card-effect" id="velmarkwache-progress-label" style="margin-top:4px">0%</div>
    </div>` : `
    <div class="action-card">
      <div class="action-card-icon">🛡</div>
      <div class="action-card-name">Velmark-Stadtwache</div>
      <p class="action-card-desc">Gelegentliche Schicht mit der Stadtwache — seriöser als Hafenarbeit, solider Verdienst.</p>
      <div class="action-card-effect">💰 +40–80 Gold · ⚜ +1 Einfluss · 😴 +15% · 🍞 +10%</div>
      <button class="action-btn" onclick="velmarkStadtwache()" ${isNight() ? 'disabled' : ''}>
        ${isNight() ? 'Nachts geschlossen' : 'Schicht übernehmen'}
      </button>
    </div>`) : '';

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Velmarks Hafen</div>
      <div style="margin-bottom:10px;color:var(--text-mid);font-size:0.9em;">
        ⚜ Einfluss: <strong>${einflussPoints}</strong>
      </div>
      <div class="action-grid">
        ${hafenCard}
        ${harroCard}
        ${stadtwacheCard}
      </div>
    </div>`;

  if (gameFlags.isHafenarbeit)  _scheduleHafenarbeit();
  if (gameFlags.isVelmarkWache) _scheduleVelmarkWache();
}

function renderValdrisProfil(el) {
  const felder = [
    { key: 'herkunft', label: 'Herkunft', icon: '📍', desc: 'Woher kommt Valdris — und was hat ihn geformt?' },
    { key: 'netzwerk', label: 'Netzwerk', icon: '🕸', desc: 'Wer arbeitet für ihn — und wie tief geht das Netz?' },
    { key: 'motive', label: 'Motive', icon: '🎯', desc: 'Was will Valdris wirklich?' },
    { key: 'kontakte', label: 'Schlüsselkontakte', icon: '👥', desc: 'Die wichtigsten Personen in seiner Struktur.' },
    { key: 'schwaeche', label: 'Schwäche', icon: '⚡', desc: 'Jede Struktur hat eine Schwachstelle — welche hat er?' },
    { key: 'aufenthaltsort', label: 'Aufenthaltsort', icon: '🗺', desc: 'Wo befindet sich Valdris?' },
  ];

  const entries = felder.map(f => {
    const known = valdrisProfil[f.key];
    return `
      <div class="action-card" style="${known ? '' : 'opacity:0.6'}">
        <div class="action-card-icon">${f.icon}</div>
        <div class="action-card-name">${f.label}</div>
        <p class="action-card-desc">${known ? f.desc : '???'}</p>
        ${known ? '<div class="action-card-effect" style="color:var(--c-reward)">✓ Aufgedeckt</div>' : ''}
      </div>`;
  }).join('');

  const knownCount = Object.values(valdrisProfil).filter(Boolean).length;

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Valdris — Profil</div>
      <p style="margin-bottom:12px;color:var(--text-mid);font-size:0.9em;">
        ${knownCount}/6 Informationen aufgedeckt.
      </p>
      <div class="action-grid">${entries}</div>
      ${knownCount >= 5 && !gameFlags.valdrisFinaleStarted ? `
        <div style="margin-top:16px;padding:12px;background:var(--bg-card);border:1px solid var(--c-reward);border-radius:8px;">
          <strong style="color:var(--c-reward);">Bereit für die Konfrontation</strong>
          <p style="margin:8px 0;font-size:0.9em;">Ich kenne genug über Valdris. Die drei Fraktionen stehen hinter mir.</p>
          <button class="action-btn action-btn-primary" onclick="showContent('${CONTENT.VALDRIS_FINALE}')">Die Konfrontation vorbereiten</button>
        </div>` : ''}
    </div>`;
}

function renderValdrisFinale(el) {
  const haendlerRuf = fraktionen.haendlergilde || 0;
  const bruderRuf   = fraktionen.bruderschaft   || 0;
  const archivRuf   = fraktionen.archiv          || 0;
  const allReady    = haendlerRuf >= 60 && bruderRuf >= 60 && archivRuf >= 60;
  const dokGefunden = gameFlags.valdrisDokumentGefunden;

  if (gameFlags.valdrisFinaleStarted) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Die Konfrontation</div>
        <p style="color:var(--text-mid);">Die Vorbereitungen laufen. Es ist Zeit zu handeln.</p>
        <button class="action-btn action-btn-primary" onclick="launchValdrisKonfrontation()">Valdris stellen</button>
      </div>`;
    return;
  }

  const requirements = [
    { label: 'Händlergilde (min. 60 Ruf)', done: haendlerRuf >= 60, current: haendlerRuf },
    { label: 'Eiserne Bruderschaft (min. 60 Ruf)', done: bruderRuf >= 60, current: bruderRuf },
    { label: 'Stadtarchiv (min. 60 Ruf)', done: archivRuf >= 60, current: archivRuf },
    { label: 'Valdris-Dokument gesichert', done: dokGefunden },
  ];

  const reqList = requirements.map(r => `
    <div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
      <span style="color:${r.done ? 'var(--c-reward)' : 'var(--text-lo)'}">${r.done ? '✓' : '○'}</span>
      <span style="${r.done ? '' : 'color:var(--text-mid)'}">${r.label}${r.current !== undefined ? ` (${r.current}/60)` : ''}</span>
    </div>`).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Die Konfrontation</div>
      <p style="margin-bottom:12px;font-size:0.9em;color:var(--text-mid);">
        Alles, was ich in Velmark getan habe, läuft auf diesen Moment zu.
      </p>
      <div style="background:var(--bg-card);padding:12px;border-radius:8px;margin-bottom:16px;">
        <strong>Voraussetzungen:</strong>
        ${reqList}
      </div>
      ${allReady && dokGefunden ? `
        <button class="action-btn action-btn-primary" onclick="startValdrisFinale()">Finale einleiten</button>
      ` : `
        <button class="action-btn" disabled>Noch nicht bereit</button>
        <p style="font-size:0.8em;color:var(--text-lo);margin-top:8px;">Erfülle alle Voraussetzungen, um Valdris zu stellen.</p>
      `}
    </div>`;
}
