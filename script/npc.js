/* ══════════════════════════════════════════════════════════════
   npc.js — Taverne: NPC-Registry + Dialog-Baum-Engine
   Jeder NPC hat einen Einstiegsknoten (statisch oder als Funktion für
   zustandsabhängige Startpunkte, z.B. Quest-Fortschritt) und einen
   Graphen aus Knoten mit Text + Antwortoptionen.

   Wichtige Regel: Kosten/Bedingungen einer Option dürfen NIE nur im
   Tooltip stehen. `cost` (Goldkosten) wird immer in den Button-Text
   geschrieben; `reason` (Sperrgrund) wird zusätzlich zum Tooltip auch
   im Button-Text angezeigt, solange die Option gesperrt ist.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/** Baut den sichtbaren Haupt-Button-Text einer Dialogoption (nie nur Tooltip).
    Der Sperrgrund (falls gesperrt) wird separat als `reason` übergeben und von
    dialog.js als eigene, mit Schloss-Symbol markierte Zeile gerendert — nie in
    diesen Haupttext gequetscht (siehe SKILL.md, "Tooltip-Regel"). */
function buildOptionLabel(opt) {
  let label = opt.label;
  if (opt.cost) label += ` (${opt.cost} Gold)`;
  return label;
}

const NPCS = {
  wirt: {
    name: 'Korbin, der Wirt', icon: '🍺',
    tagline: 'Herzlich, aber wachsam gegenüber Fremden.',
    // Ausrufezeichen-Badge, solange das aktuelle Ziel "Sprich mit dem Wirt"
    // ist (siehe objective.js) — analog zu Brakkas questId-Badge, aber ohne
    // eigene Quest-State-Machine, weil die Jobvermittlung ein einmaliger
    // Flag-Übergang ist, keine mehrstufige Quest.
    hasHint: () => gameFlags.tavernVisited && !gameFlags.jobUnlocked,
    // Vor der Jobvermittlung steigt jedes Gespräch über den Job-Hinweis ein,
    // danach ganz normal über den Smalltalk-Knoten.
    start: () => (!gameFlags.jobUnlocked ? 'jobAdvice' : 'greet'),
    nodes: {
      jobAdvice: {
        text: [
          'Korbin lacht trocken. "Reich werden? Hier in Treutheim?"',
          '"Das hier ist kaum mehr als ein Dorf mit Stadtmauer. Arbeit ist Mangelware."',
          '"Aber die Felder vor dem Tor suchen immer Hände. Jeder fängt mal klein an, Fremder."'
        ],
        options: [
          {
            label: 'Dann eben das Feld.',
            next: null,
            action: () => {
              gameFlags.jobUnlocked = true;
              showToast('Job gefunden: Feldarbeit vor dem Stadttor.', 'event');
            }
          }
        ]
      },
      greet: {
        text: ['Korbin wischt ein Glas trocken und nickt mir zu. "Setz dich, Fremder. Was kann ich für dich tun?"'],
        options: [
          { label: 'Was gibt es Neues in Treutheim?', next: 'gossip' },
          { label: 'Nichts, ich schaue nur.', next: null }
        ]
      },
      gossip: {
        text: ['"Nichts Gutes", murmelt er und senkt die Stimme. "Seit der Raubserie reden alle nur noch über Vorsicht. Pass auf dein Gold auf, hörst du?"'],
        options: [
          { label: 'Danke für die Warnung.', next: null }
        ]
      }
    }
  },

  mira: {
    name: 'Mira', icon: '💃',
    tagline: 'Charmant und gewitzt — weiß immer mehr, als sie zugibt.',
    locked: () => !gameFlags.firstNightDialogShown,
    questId: 'miraLetter',
    questAvailable: () => npcFlags.miraDrinkGiven && meta.resets >= 1,
    start: () => {
      if (quests.miraLetter.state === 'active') return 'letterReminder';
      if (!npcFlags.miraDrinkGiven) return 'greet';
      if (meta.resets >= 1 && quests.miraLetter.state === 'unstarted') return 'letterOffer';
      return 'friendly';
    },
    nodes: {
      greet: {
        text: ['Mira lehnt sich über ihren Krug und lächelt mich an. "Na, ein neues Gesicht. Und was für eines."'],
        options: [
          {
            label: 'Lade sie auf einen Drink ein.',
            cost: 3,
            next: 'drink',
            locked: () => resources.gold < 3,
            reason: 'Nicht genug Gold',
            action: () => {
              resources.gold -= 3;
              grantItem('brot', 1);
              npcFlags.miraDrinkGiven = true;
              showToast('Drink für Mira ausgegeben (−3 Gold). Sie schiebt dir ein Brot zu.', 'purchase');
            }
          },
          { label: 'Nur Smalltalk.', next: 'smalltalk' }
        ]
      },
      drink: {
        text: ['Sie nimmt einen Schluck und grinst. "Na siehst du, du bist gar nicht so verloren, wie du aussiehst." Beim Abschied drückt sie mir ein Stück Brot in die Hand.'],
        options: [{ label: 'Auf Wiedersehen.', next: null }]
      },
      smalltalk: {
        text: ['"Smalltalk also", seufzt sie gespielt enttäuscht. "Schade. Vielleicht ein anderes Mal."'],
        options: [{ label: 'Vielleicht.', next: null }]
      },
      friendly: {
        text: ['Mira lächelt, als ich näherkomme. "Na, mein Spendierfreund ist zurück. Was gibt\'s?"'],
        options: [{ label: 'Nur Smalltalk.', next: 'smalltalk' }]
      },
      letterOffer: {
        text: [
          'Mira zieht mich kurz zur Seite, ihre sonst so spöttische Stimme wird leiser. "Du kommst doch öfter mit Brakka klar, oder?"',
          '"Gib ihm das hier — aber lass es niemand anderen sehen." Sie drückt mir einen versiegelten Brief in die Hand.'
        ],
        options: [
          {
            label: 'Ich kümmere mich darum.',
            next: null,
            action: () => {
              questItems.sealedLetter = (questItems.sealedLetter || 0) + 1;
              quests.miraLetter.state = 'active';
              showToast('Quest erhalten: Ein Brief für Brakka.', 'event');
            }
          },
          { label: 'Lieber nicht.', next: null }
        ]
      },
      letterReminder: {
        text: ['Mira hebt nur kurz die Augenbraue — eine stumme Erinnerung an den Brief in meiner Tasche.'],
        options: [{ label: 'Ich kümmere mich darum.', next: null }]
      }
    }
  },

  oswin: {
    name: 'Oswin', icon: '🎩',
    tagline: 'Hochnäsig — spricht nur mit denen, die etwas vorzuweisen haben.',
    start: 'greet',
    nodes: {
      greet: {
        text: ['Oswin mustert mich von oben bis unten und verzieht das Gesicht. "Wer hat dich hereingelassen?"'],
        options: [
          {
            label: 'Sprich über Geschäfte.',
            next: 'business',
            locked: () => resources.gold < 100,
            reason: 'Erfordert 100 Gold'
          },
          { label: 'Ignoriere ihn.', next: null }
        ]
      },
      business: {
        text: ['Er hebt eine Augenbraue, fast beeindruckt. "Nun gut. Vielleicht bist du doch nicht völlig wertlos."'],
        options: [{ label: 'Wie schmeichelhaft.', next: null }]
      }
    }
  },

  brakka: {
    name: 'Brakka, der Schmied', icon: '🔨',
    tagline: 'Trockener Humor, ein Herz aus Eisen — und Eisen für alle anderen.',
    questId: 'nightWatch', // steuert das Ausrufezeichen-Badge, solange die Quest unstarted ist
    questAvailable: () => gameClock.day >= 2,
    // Zweites/drittes, unabhängiges Signal fürs Ausrufezeichen: die
    // Gilden-Quest (siehe experience.js, Skill "guildPrep") UND "Nachtwache
    // bereits gehalten, muss noch berichtet werden" — beide unabhängig von
    // der questId-basierten "neue Aufgabe verfügbar"-Logik oben.
    hasHint: () => quests.guildRegistration.state === 'active' || quests.nightWatch.state === 'done',
    start: () => {
      if (quests.miraLetter.state === 'active' && (questItems.sealedLetter || 0) > 0) return 'receiveLetter';
      if (quests.guildRegistration.state === 'active') {
        return gameFlags.guildExplainedByBrakka ? 'guildReadyCheck' : 'guildExplain';
      }
      if (quests.guildRegistration.state === 'rewarded') return 'guildFinished';
      switch (quests.nightWatch.state) {
        case 'unstarted': return gameClock.day >= 2 ? 'offer' : 'tooSoon';
        case 'active':    return 'waiting';
        case 'done':      return 'turnIn';
        default:          return 'idle';
      }
    },
    nodes: {
      tooSoon: {
        text: ['Brakka nickt mir knapp zu, ohne den Hammer aus der Hand zu legen. "Lern erst die Stadt kennen, Fremder. Wir reden noch."'],
        options: [{ label: 'Verstanden.', next: null }]
      },
      offer: {
        text: [
          'Brakka stellt seinen Krug ab und betrachtet mich nachdenklich. "Du willst dir wohl auch beim Waffenschmied die Klinge ansehen, hm? Vergiss es — der verkauft nur an registrierte Abenteurer."',
          '"Willst du wissen, wie man das wird?"'
        ],
        options: [
          { label: 'Wie werde ich ein registrierter Abenteurer?', next: 'explain' },
          { label: 'Ein andermal.', next: null }
        ]
      },
      explain: {
        text: [
          '"Beweise erstmal, dass du wach bleiben kannst, wenn es drauf ankommt", sagt er trocken. ' +
          '"Halte heute Nacht Wache vor dem Stadttor. Schaffst du das, sprich wieder mit mir."',
          '"Und komm nicht zu früh — die Wachen wechseln erst um 22 Uhr, wenn die Nacht richtig einbricht. Vorher lässt dich am Tor sowieso keiner ran."'
        ],
        options: [
          {
            label: 'Ich nehme die Aufgabe an.',
            next: null,
            action: () => {
              quests.nightWatch.state = 'active';
              showToast('Aufgabe angenommen: Halte heute Nacht Wache.', 'event');
            }
          },
          { label: 'Vielleicht ein anderes Mal.', next: null }
        ]
      },
      waiting: {
        text: ['"Nun?", fragt Brakka und hebt eine Augenbraue. "Hast du heute Nacht schon Wache gehalten?"'],
        options: [{ label: 'Noch nicht.', next: null }]
      },
      turnIn: {
        text: [
          '"Du hast es tatsächlich getan", sagt Brakka und nickt anerkennend. "Nicht schlecht für jemanden, der vor ein paar Tagen noch durch das Stadttor gestolpert ist."',
          'Er drückt mir ein paar Münzen in die Hand. "Hier — und weil du dich nicht gleich in die Hose gemacht hast: Die Wachen lassen dich ab jetzt jede Nacht ans Tor. Mach was draus, oder lass es. Mir ist es gleich, solang du nicht schnarchst."'
        ],
        options: [
          {
            label: 'Danke, Brakka.',
            next: null,
            action: () => {
              resources.gold            += NIGHTWATCH_QUEST_REWARD;
              resources.totalGoldEarned += NIGHTWATCH_QUEST_REWARD;
              quests.nightWatch.state = 'rewarded';
              checkMilestones(); // Gold-Gewinne außerhalb von completeWork()/nightWatch() müssen denselben Check auslösen
              showToast(`Aufgabe abgeschlossen: Nachtwache (+${NIGHTWATCH_QUEST_REWARD} Gold). Ab jetzt jede Nacht möglich.`, 'reward');
            }
          }
        ]
      },
      idle: {
        text: ['Brakka hebt seinen Krug, ohne aufzusehen. "Schon wieder wach geblieben letzte Nacht? Du wirst noch zur Eule, Fremder."'],
        options: [
          { label: 'Und die Sache mit der Abenteurergilde?', next: 'guildPending' },
          { label: 'Vielleicht.', next: null }
        ]
      },
      guildPending: {
        text: ['Brakka winkt ab. "Eine Sache nach der anderen. Du merkst schon, wann es Zeit ist — vorher kann ich dir auch nicht weiterhelfen."'],
        options: [{ label: 'Na gut.', next: null }]
      },
      guildExplain: {
        text: [
          'Brakka stellt seinen Krug ab, diesmal ohne den üblichen Spott. "Du willst also wirklich zur Gilde."',
          '"Dann hör zu: die nehmen niemanden, der nicht zumindest ordentliche Ausrüstung mitbringt — und den Kopf klar genug hat, um nicht beim ersten Auftrag zu sterben."',
          '"Beschaff dir, was du brauchst. Bereite dich vor — wirklich vorbereiten, nicht nur einen Tag früher aufstehen. Wenn du meinst, dass es Zeit ist, komm wieder zu mir."'
        ],
        options: [{
          label: 'Verstanden.',
          next: null,
          action: () => {
            gameFlags.guildExplainedByBrakka = true;
            showToast('Aufgabe: Bereite dich auf die Gildenprüfung vor — sprich wieder mit Brakka, wenn du bereit bist.', 'event');
          }
        }]
      },
      guildReadyCheck: {
        text: ['Brakka mustert dich von oben bis unten. "Na? Bereit, oder verschwendest du nur meine Zeit?"'],
        options: [
          { label: 'Noch nicht.', next: null },
          {
            label: 'Ja. Ich bin bereit.',
            next: 'guildEnd',
            action: () => { quests.guildRegistration.state = 'rewarded'; }
          }
        ]
      },
      guildEnd: {
        text: [
          'Brakka nickt knapp. "Dann ist es Zeit, Fremder. Die Gilde wird von dir hören."',
          '— Hier endet die Geschichte vorerst. Mehr vom Weg zur Abenteurergilde folgt in einem zukünftigen Update. Danke, dass du bis hierher gespielt hast! Neuigkeiten zu kommenden Updates gibt es bald auch auf unserem Discord (Link folgt). —'
        ],
        options: [{ label: 'Zur Kenntnis genommen.', next: null }]
      },
      guildFinished: {
        text: ['Brakka hebt sein Glas. "Geh und mach uns stolz, Fremder."'],
        options: [{ label: 'Werde ich.', next: null }]
      },
      receiveLetter: {
        text: [
          'Ich reiche Brakka den versiegelten Brief. Er liest ihn kurz, sein Grinsen verschwindet für einen Moment.',
          '"Sag Mira, ich kümmere mich drum." Er steckt den Brief weg und drückt mir zum Dank ein paar Münzen in die Hand.'
        ],
        options: [
          {
            label: 'Gern geschehen.',
            next: null,
            action: () => {
              questItems.sealedLetter = Math.max(0, (questItems.sealedLetter || 0) - 1);
              quests.miraLetter.state = 'rewarded';
              resources.gold            += 6;
              resources.totalGoldEarned += 6;
              checkMilestones();
              showToast('Brief überbracht (+6 Gold).', 'reward');
            }
          }
        ]
      }
    }
  },

  vorarbeiter: {
    name: 'Der Vorarbeiter', icon: '👷',
    tagline: 'Wortkarg, aber fair — wer ordentlich schuftet, hat seinen Respekt.',
    questId: 'foremanRaise',
    badgeOnActive: true, // Badge zeigt hier "geh hin, er wartet", nicht "neue Aufgabe verfügbar"
    // Er hat den Spieler ausdrücklich für ABENDS in die Taverne eingeladen
    // (siehe maybeTriggerForemanBonusDialog()) — tagsüber ist er auf dem Feld.
    locked: () => quests.foremanRaise.state === 'unstarted' || !isNight(),
    start: () => (quests.foremanRaise.state === 'active' ? 'praise' : 'idle'),
    nodes: {
      praise: {
        text: [
          'Der Vorarbeiter winkt mich zu seinem Tisch und stellt sein Bier ab. "Da bist du ja. Setz dich."',
          'Er hebt sein Glas. "Du schuftest ordentlich, ohne zu meckern. Das sieht man nicht oft."',
          '"Die meisten hier jammern beim ersten Sonnenbrand oder schleichen sich davon, sobald keiner hinsieht. Du nicht. Verlässliche Leute sind selten — und die bezahle ich auch dafür, dass sie bleiben." Er grinst kurz. "Ab jetzt gibt\'s ein, zwei Groschen mehr pro Stunde für dich."'
        ],
        options: [{
          label: 'Danke, das weiß ich zu schätzen.',
          next: 'praiseFarewell',
          action: () => {
            gameFlags.foremanBonusGiven = true;
            resources.gold            += FOREMAN_BONUS_GOLD;
            resources.totalGoldEarned += FOREMAN_BONUS_GOLD;
            quests.foremanRaise.state = 'rewarded';
            checkMilestones();
            showToast(`+${FOREMAN_BONUS_GOLD} Gold und dauerhaft +1 Gold pro Feldarbeit.`, 'reward');
          }
        }]
      },
      praiseFarewell: {
        text: ['Er hebt sein Glas mir zu. "Bis morgen auf dem Feld. Und lass dir die Münzen nicht gleich wieder abnehmen."'],
        options: [{ label: 'Bis morgen.', next: null }]
      },
      idle: {
        text: ['Der Vorarbeiter nickt mir knapp zu und trinkt in Ruhe weiter.'],
        options: [{ label: 'Nicken.', next: null }]
      }
    }
  },

  greta: {
    name: 'Greta, die Krämerin', icon: '🧺',
    tagline: 'Geschäftstüchtig und freundlich — hat immer eine neue Idee im Kopf.',
    questId: 'kraemerinBusiness',
    badgeOnActive: true,
    locked: () => quests.kraemerinBusiness.state === 'unstarted',
    start: () => {
      switch (quests.kraemerinBusiness.state) {
        case 'invited': return 'offer';
        case 'active':  return hasEnoughResourcesForQuest() ? 'turnIn' : 'reminder';
        default:        return 'idle'; // 'rewarded'
      }
    },
    nodes: {
      offer: {
        text: [
          '"Da bist du ja!" Greta rückt einen Hocker zurecht. "Also, meine Idee: Ich will mein Sortiment erweitern — Werkzeug, bessere Ausrüstung, solche Sachen."',
          '"Dafür brauche ich Rohstoffe: Holz, Stein und ein paar Kräuter. Sammelst du mir davon je fünf, helfe ich dir dafür weiter."',
          '"Werkzeug dafür findest du bei mir im Laden, sobald du weißt, wonach du suchst."'
        ],
        options: [{
          label: 'Ich kümmere mich darum.',
          next: null,
          action: () => {
            quests.kraemerinBusiness.state = 'active';
            gameFlags.resourceGatheringUnlocked = true;
            navUnseen.rohstoffe = true;
            showToast('Quest erhalten: Rohstoffe für Greta sammeln.', 'event');
          }
        }]
      },
      reminder: {
        text: () => [`"Na, schon was gesammelt?" ${kraemerinProgressText()}`],
        options: [{ label: 'Ich bin dran.', next: null }]
      },
      turnIn: {
        text: [
          'Greta strahlt, als du ihr die Rohstoffe zeigst. "Genau richtig! Damit kann ich arbeiten."',
          '"Ich verkaufe das an ein paar Handwerker, die mir dafür fertige Ware machen — und die verkaufe ich dann an dich weiter. Schau ab und zu wieder bei mir vorbei."'
        ],
        options: [{
          label: 'Bin gespannt.',
          next: null,
          action: () => {
            Object.entries(KRAEMERIN_QUEST_NEED).forEach(([id, qty]) => {
              resources.inventory[id] = Math.max(0, (resources.inventory[id] || 0) - qty);
            });
            quests.kraemerinBusiness.state = 'rewarded';
            showToast('Rohstoffe abgegeben. Greta erweitert ihr Sortiment.', 'reward');
          }
        }]
      },
      idle: {
        text: ['Greta nickt dir zu. "Bring mir gerne mal wieder ein paar Rohstoffe — ich kauf sie dir ab."'],
        options: [{ label: 'Mach ich.', next: null }]
      }
    }
  },

  kommandant: {
    name: 'Kommandant Roswald', icon: '🎖',
    tagline: 'Stramm, diszipliniert — und nicht großzügig mit Lob, wenn es nicht verdient ist.',
    questId: 'commanderTraining',
    badgeOnActive: true,
    locked: () => quests.commanderTraining.state === 'unstarted',
    start: () => (quests.commanderTraining.state === 'active' ? 'offer' : 'idle'),
    nodes: {
      offer: {
        text: [
          'Roswald nickt mir knapp zu, ohne aufzustehen. "Drei Nächte Wache, ohne dass mir jemand was Schlechtes über dich erzählt hat. Das ist mehr, als ich von den meisten Neuen sage."',
          '"Ich kann dir zeigen, wie man es richtig macht — wo man hinschaut, wann man die Runde wechselt. Das spart dir Kraft UND bringt dir mehr Lohn. Interesse?"'
        ],
        options: [
          {
            label: 'Zeig es mir.',
            next: null,
            action: () => {
              quests.commanderTraining.state = 'rewarded';
              showToast('Roswald hat dir die Grundlagen gezeigt. Im Erfahrungsbaum kannst du jetzt für die Nachtwache aufleveln.', 'event');
            }
          },
          { label: 'Vielleicht ein anderes Mal.', next: null }
        ]
      },
      idle: {
        text: ['Roswald hebt zwei Finger zum Gruß, mehr nicht. Männer wie er verschwenden keine Worte.'],
        options: [{ label: 'Verstanden.', next: null }]
      }
    }
  },

  fremder: {
    name: 'Ein zwielichtiger Mann', icon: '🥷',
    tagline: 'Sitzt allein am Rand des Schankraums, sein Blick wandert ständig.',
    locked: () => storyState < 10102,
    start: 'greet',
    nodes: {
      greet: {
        text: [
          'Aus der Nähe wirkt er noch zwielichtiger. Er nickt mir knapp zu, ohne wirklich herzusehen. "Suchst du was?"',
          'Sein Blick streift kurz meinen Geldbeutel — dann wieder mein Gesicht, als wäre nichts gewesen.'
        ],
        options: [
          { label: '"Nur einen Drink."', next: null },
          { label: '"Wer bist du?"', next: 'who' },
          { label: '"Du beobachtest mich. Warum?"', next: 'watching' }
        ]
      },
      who: {
        text: [
          'Er grinst schief. "Niemand Wichtiges. Noch nicht." Er lässt das Wort einen Moment in der Luft hängen, als wollte er sehen, ob ich verstehe, was er meint.'
        ],
        options: [
          { label: '"Was soll das heißen?"', next: 'cryptic' },
          { label: '...', next: null }
        ]
      },
      cryptic: {
        text: [
          '"Manche Leute laufen durch diese Stadt und merken gar nicht, wie viel Aufmerksamkeit sie erregen", sagt er leise, ohne mich anzusehen.',
          '"Pass besser auf, was du mit dir herumträgst. Nicht jeder hier ist so... gesprächig wie ich."'
        ],
        options: [
          { label: '"War das ein Rat — oder eine Drohung?"', next: 'threat' },
          { label: '...', next: null }
        ]
      },
      threat: {
        text: ['Er lacht trocken, kein Funken Wärme darin. "Nenn es, wie du willst. Ich hab nur gesagt, was ich gesehen habe."'],
        options: [{ label: 'Ich werde es nicht vergessen.', next: null }]
      },
      watching: {
        text: [
          'Er hebt beide Hände, gespielt unschuldig. "Beobachten? Ich sitze hier und trinke. Weiter nichts."',
          'Aber sein Blick sagt etwas anderes — und er senkt ihn keine Sekunde zu früh.'
        ],
        options: [{ label: 'Wenn du meinst.', next: null }]
      }
    }
  }
};

/** Ermittelt den Start-Knoten eines NPC (statisch oder zustandsabhängig). */
function getNpcStartNode(npc) {
  return typeof npc.start === 'function' ? npc.start() : npc.start;
}

/**
 * Öffnet/aktualisiert das Dialogfenster für einen NPC an einem Knoten.
 * @param {string} npcId
 * @param {string} [nodeId] - Standard: Start-Knoten des NPC
 */
function openNpcDialog(npcId, nodeId) {
  const npc = NPCS[npcId];
  if (!npc) return;
  if (typeof npc.locked === 'function' && npc.locked()) return;

  const id   = nodeId || getNpcStartNode(npc);
  const node = npc.nodes[id];
  if (!node) { closeDialog(); return; }

  const options = node.options || [];
  const buttons = options.length
    ? options.map(opt => {
        const locked = typeof opt.locked === 'function' ? opt.locked() : !!opt.locked;
        return {
          label:    buildOptionLabel(opt),
          disabled: locked,
          reason:   locked ? opt.reason : undefined,
          onClick: () => {
            if (opt.action) opt.action();
            render(); // Stats (z.B. Gold) sofort aktualisieren, auch während der Dialog offen bleibt
            if (opt.next) openNpcDialog(npcId, opt.next);
            else closeDialog();
          }
        };
      })
    : [{ label: 'Tschüss', onClick: closeDialog }];

  // Jeder Absatz wird zu einer eigenen Seite (statt alle gleichzeitig zu
  // stapeln) — das hält die Dialogbox unabhängig davon, wie viele/lange
  // Absätze ein Knoten hat, in einer ähnlichen Höhe. Die eigentlichen
  // Antwortoptionen erscheinen erst auf der letzten Seite.
  const rawText    = typeof node.text === 'function' ? node.text() : node.text;
  const paragraphs = Array.isArray(rawText) ? rawText : [rawText];
  showPaginatedDialog(npc.name, splitLongDialogPages(paragraphs), buttons);
}

/* ── Taverne: Ortsansicht mit anklickbaren NPCs ──────────────── */
/* Gäste, deren Bedingung (noch) nicht erfüllt ist, erscheinen gar nicht
   erst — kein "Nicht ansprechbar"-Platzhalter mehr (Progressive
   Disclosure, siehe philosophie.md Punkt 6). Der Moment, in dem ein Gast
   neu hinzukommt, wird stattdessen über die Nav-Hervorhebung der Taverne
   selbst signalisiert (siehe `navUnseen.taverne`, gesetzt an den
   jeweiligen Freischalt-Stellen in actions.js). */
function renderTaverne(el) {
  const visibleNpcs = Object.entries(NPCS).filter(([, npc]) =>
    !(typeof npc.locked === 'function' ? npc.locked() : !!npc.locked));

  const cards = visibleNpcs.map(([id, npc]) => {
    const hasOfferableQuest = npc.questId && quests[npc.questId].state === 'unstarted' &&
      (typeof npc.questAvailable !== 'function' || npc.questAvailable());
    const hasPendingQuest = npc.questId && npc.badgeOnActive && quests[npc.questId].state === 'active';
    const hasHint = typeof npc.hasHint === 'function' && npc.hasHint();
    const badge = (hasOfferableQuest || hasPendingQuest || hasHint)
      ? `<div class="npc-quest-badge" title="Hat eine Aufgabe für mich">❗</div>`
      : '';
    return `
      <div class="action-card" style="position: relative;">
        ${badge}
        <div class="action-card-icon">${npc.icon}</div>
        <div class="action-card-name">${npc.name}</div>
        <p class="action-card-desc">${npc.tagline}</p>
        <button class="action-btn" onclick="openNpcDialog('${id}')">Ansprechen</button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Taverne — Zum Müden Wanderer</div>
      <div class="action-grid">${cards}</div>
    </div>
  `;
}
