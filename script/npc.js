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
    availability: 'always', availabilityText: 'Ohne ihn läuft hier nix.',
    // Badge sobald Detektiv-Quest startbereit ist (Spieler in Kapitel 2, Quest noch unstarted)
    hasHint: () => (gameFlags.tavernVisited && !gameFlags.jobUnlocked) ||
      (gameFlags.kapitel2Unlocked && quests.theftInvestigation.state === QUEST_STATE.UNSTARTED && storyState >= 20101),
    start: () => {
      if (!gameFlags.jobUnlocked) return 'jobAdvice';
      if (gameFlags.kapitel2Unlocked && quests.theftInvestigation.state === QUEST_STATE.UNSTARTED && storyState >= 20101) return 'chapter2intro';
      if (gameFlags.kapitel2Unlocked && storyState >= 20101) return 'chapter2greet';
      return 'greet';
    },
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
              showToast('Job gefunden: Feldarbeit vor dem Stadttor.', TOAST.EVENT);
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
      },
      chapter2intro: {
        text: [
          'Korbin zieht mich nah heran, als ich die Taverne betrete, sein Blick fliegt kurz zur Tür.',
          '"Ich hab dich draußen kämpfen sehen, Fremder. Du bist nicht mehr das, was du warst, als du ankamst."',
          '"Ich kenn dich noch, als du frisch hereingekommen bist. Du warst ein leichtes Ziel."',
          '"Weißt du, du bist nicht der Erste, dem das passiert ist. Es gibt jemanden in dieser Stadt..."'
        ],
        options: [
          {
            label: '"Erzähl mir mehr."',
            next: 'chapter2reveal',
          },
          { label: '"Ich weiß Bescheid."', next: null }
        ]
      },
      chapter2reveal: {
        text: [
          '"Drei Neue in diesem Monat. Immer dasselbe — ankommen, schuften, beraubt werden."',
          '"Es gibt jemanden, den alle hier nur den Schatten nennen. Er wählt die Neuen aus. Er schickt jemanden vor — einen Beobachter, der entscheidet, ob der Neue lohnend genug ist."',
          '"Und wenn er es ist, holt er sich sein Teil." Korbin tippt auf mein leeres Glas. "Du weißt, wovon ich rede."',
          '"Wenn du herausfinden willst, wer dahintersteckt — ich rate dir: frag die, die länger hier sind als ich. Fang im Jagdgebiet an. Die Räuber dort sind keine Zufälle."'
        ],
        options: [{
          label: 'Das ist die Spur, die ich brauche.',
          next: null,
          action: () => {
            if (quests.theftInvestigation.state === QUEST_STATE.UNSTARTED) {
              quests.theftInvestigation.state = QUEST_STATE.ACTIVE;
              gameFlags.korbinChapter2Talked = true;
              storyState = 20102;
              navUnseen.quests = true;
              render();
              maybeShowStoryDialog('2.2');
              showToast('Quest erhalten: Die Spur des Diebs.', TOAST.EVENT);
            }
          }
        }]
      },
      chapter2greet: {
        text: ['Korbin nickt dir knapp zu. "Du siehst wie jemand aus, der Antworten sucht. Was ist?"'],
        options: [
          { label: 'Wie läuft das Geschäft?', next: 'chapter2idle' },
          { label: 'Nichts, ich schaue nur.', next: null }
        ]
      },
      chapter2idle: {
        text: ['"Besser, seit du angefangen hast, die Räuber dort draußen auszudünnen", sagt er trocken. "Die Leute trauen sich wieder raus."'],
        options: [{ label: 'Gut zu wissen.', next: null }]
      }
    }
  },

  mira: {
    name: 'Mira', icon: '💃',
    tagline: 'Charmant und gewitzt — weiß immer mehr, als sie zugibt.',
    availability: 'evening', availabilityText: 'Habe sie bisher nur abends gesehen.',
    locked: () => !gameFlags.firstNightDialogShown,
    questId: 'miraLetter',
    questAvailable: () => npcFlags.miraDrinkGiven && meta.resets >= 1,
    hasHint: () => (!npcFlags.miraDrinkGiven && gameFlags.firstNightDialogShown) ||
      quests.miraLetter.state === QUEST_STATE.DELIVERED ||
      quests.theftInvestigation.state === QUEST_STATE.INVESTIGATING,
    start: () => {
      if (quests.miraLetter.state === QUEST_STATE.DELIVERED) return 'letterDelivered';
      if (quests.miraLetter.state === QUEST_STATE.ACTIVE) return 'letterReminder';
      if (quests.theftInvestigation.state === QUEST_STATE.INVESTIGATING) return 'detectiveAsk';
      if (!npcFlags.miraDrinkGiven) return 'greet';
      if (meta.resets >= 1 && quests.miraLetter.state === QUEST_STATE.UNSTARTED) return 'letterOffer';
      if (gameFlags.miraRevealedInfo && !gameFlags.mirasBriefGiven) return 'givesBrief';
      if (gameFlags.miraRevealedInfo) return 'friendlyAfterReveal';
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
              showToast('Drink für Mira ausgegeben (−3 Gold). Sie schiebt dir ein Brot zu.', TOAST.PURCHASE);
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
              quests.miraLetter.state = QUEST_STATE.ACTIVE;
              showToast('Quest erhalten: Ein Brief für Brakka.', TOAST.EVENT);
            }
          },
          { label: '"Warum kannst du den Brief nicht selbst bringen?"', next: 'letterWhyNot' },
          { label: 'Lieber nicht.', next: null }
        ]
      },
      letterWhyNot: {
        text: [
          'Mira wird kurz still. Kein Lächeln — nur ein kurzer, prüfender Blick.',
          '"Weil man mich hier kennt. Zu gut. Wenn ich selbst zu Brakka gehe, sieht das jemand — und dann weiß der Falsche, dass wir miteinander reden."',
          '"Du bist neu hier. Unbekannt. Du kannst hingehen, ohne dass jemand eine Verbindung zieht."',
          '"Deshalb du. Nicht weil es für dich sicherer ist. Weil es für uns beide klüger ist."'
        ],
        options: [
          {
            label: 'Verstanden. Ich nehme den Brief.',
            next: null,
            action: () => {
              questItems.sealedLetter = (questItems.sealedLetter || 0) + 1;
              quests.miraLetter.state = QUEST_STATE.ACTIVE;
              showToast('Quest erhalten: Ein Brief für Brakka.', TOAST.EVENT);
            }
          },
          { label: 'Das klingt riskant. Lieber nicht.', next: null }
        ]
      },
      letterReminder: {
        text: ['Mira hebt nur kurz die Augenbraue — eine stumme Erinnerung an den Brief in meiner Tasche.'],
        options: [{ label: 'Ich kümmere mich darum.', next: null }]
      },
      letterDelivered: {
        text: ['Mira lehnt sich zurück, als ich ihr von Brakka berichte. "Na siehst du. Hat doch geklappt." Ihr Grinsen wirkt für einen Moment fast aufrichtig.'],
        options: [{
          label: 'War mir ein Vergnügen.',
          next: null,
          action: () => {
            quests.miraLetter.state = QUEST_STATE.REWARDED;
            showToast('Mira ist erleichtert — die Sache mit dem Brief ist erledigt.', TOAST.EVENT);
          }
        }]
      },
      detectiveAsk: {
        text: [
          'Mira sieht mich an — diesmal kein Lächeln, kein Spiel. Sie hat mein Gesicht gerade genug gelesen.',
          '"Du fragst nach dem Schatten."',
          'Es ist keine Frage.'
        ],
        options: [
          { label: '"Ich habe Beweise. Und Fragen."', next: 'detectiveReveal' },
          { label: '"Ich schaue nur."', next: null }
        ]
      },
      detectiveReveal: {
        text: [
          '"Der Brief, den ich dir für Brakka gegeben habe?" Sie trinkt einen Schluck, langsamer als nötig. "Es war eine Warnung. Brakka weiß, wer der Schatten ist. Er weiß es seit Jahren."',
          '"Ich auch. Aber Wissen ohne Schutz ist gefährlich. Du bist jetzt stark genug. Er wird reden, wenn du ihn fragst."',
          '"Geh zu Brakka. Sag ihm, dass ich dich geschickt habe."'
        ],
        options: [{
          label: '"Danke, Mira."',
          next: null,
          action: () => {
            if (!gameFlags.miraRevealedInfo) {
              gameFlags.miraRevealedInfo = true;
              quests.theftInvestigation.state = QUEST_STATE.MIRA_CONSULTED;
              storyState = 20104;
              render();
              maybeShowStoryDialog('2.4');
              showToast('Mira hat geredet. Brakka als nächstes.', TOAST.EVENT);
            }
          }
        }]
      },
      givesBrief: {
        text: [
          'Mira wartet, bis niemand mehr in Hörweite ist.',
          '"Ich habe lange gezögert, ob ich dir das gebe. Aber du hast die Wahrheit gefunden, als andere weggeschaut haben." Sie schiebt mir einen gefalteten Brief zu.',
          '"Er ist verschlüsselt. Ich kann ihn nicht lesen. Aber jemand in Lethkar kann — Varena, am Hafen. Sie ist eine alte Bekannte. Sag ihr, du kommst von mir."',
          '"Tu mir einen Gefallen: Vergiss nicht, was darin steht."'
        ],
        options: [{
          label: '"Ich vergesse es nicht."',
          next: null,
          action: () => {
            gameFlags.mirasBriefGiven = true;
            questItems.miras_brief    = (questItems.miras_brief || 0) + 1;
            navUnseen.inventar        = true;
            showToast('Mira hat dir einen verschlüsselten Brief gegeben. Er wartet auf eine Übersetzung — in Lethkar.', TOAST.EVENT);
          }
        }]
      },
      friendlyAfterReveal: {
        text: ['Mira nickt mir zu, als ich näherkomme. Keine Spielchen mehr. "Wie läuft die Sache?"'],
        options: [
          { label: '"Ich bin dran."', next: null },
          { label: '"Gut. Danke."', next: null }
        ]
      }
    }
  },

  oswin: {
    name: 'Oswin', icon: '🎩',
    tagline: 'Hochnäsig — spricht nur mit denen, die etwas vorzuweisen haben.',
    availability: 'day', availabilityText: 'Habe ihn tagsüber gesehen.',
    hasHint: () =>
      (resources.gold >= 100 && !npcFlags.oswingBusinessSeen) ||
      (gameFlags.oswingSuperHintShown && !gameFlags.lehrerUnlocked) ||
      (!meta.hasHome && storyState >= 20100 && resources.gold >= 2000),
    start: () => {
      if (meta.hasHome) return 'greetHomeOwner';
      return 'greet';
    },
    nodes: {
      greet: {
        text: ['Oswin mustert mich von oben bis unten und verzieht das Gesicht. "Wer hat dich hereingelassen?"'],
        options: [
          {
            label: 'Ich suche ein Haus in Treutheim.',
            next: 'houseOffer',
            visible: () => storyState >= 20100 && !meta.hasHome,
            locked: () => resources.gold < 2000,
            reason: 'Erfordert 2000 Gold'
          },
          {
            label: 'Sprich über Geschäfte.',
            next: 'business',
            locked: () => resources.gold < 100,
            reason: 'Erfordert 100 Gold',
            action: () => { npcFlags.oswingBusinessSeen = true; }
          },
          { label: 'Ignoriere ihn.', next: null }
        ]
      },
      houseOffer: {
        text: [
          'Oswin hebt eine Augenbraue. Das ist die erste echte Reaktion, die ich bei ihm sehe.',
          '"Ein Haus." Er trommelt mit dem Finger auf die Theke. "Weißt du, wie viele Leute hierherkommen und nach einem Haus fragen? Und wie viele davon tatsächlich zahlen können?"',
          '"Am Westrand steht eines. Leerstand seit zwei Jahren. Der Vorbesitzer ist... gegangen." Er schiebt mir ein Schriftstück zu.',
          '"Zweitausend Gold. Kein Feilschen."'
        ],
        options: [
          {
            label: '"Abgemacht."',
            next: 'houseBought',
            locked: () => resources.gold < 2000,
            reason: 'Erfordert 2000 Gold',
            action: () => {
              resources.gold -= 2000;
              meta.hasHome    = true;
              navUnseen.meinhaus = true;
              showToast('Das Haus gehört dir. "Mein Haus" ist jetzt in der Navigation verfügbar.', TOAST.EVENT);
            }
          },
          { label: '"Ich überlege es mir."', next: null }
        ]
      },
      houseBought: {
        text: [
          'Oswin nimmt das Gold, ohne es zu zählen. Er faltet das Papier zusammen und schiebt es mir zu.',
          '"Glückwunsch. Du bist jetzt Hauseigentümer." Eine kurze Pause. "Treutheim gewinnt mit jedem Tag."',
          'Ich glaube, das war sein Versuch eines Witzes.'
        ],
        options: [{ label: 'Danke.', next: null }]
      },
      greetHomeOwner: {
        text: ['Oswin nickt mir knapp zu. "Der Hauseigentümer." So nennt er mich jetzt. Nicht Name — Kategorie.'],
        options: [
          {
            label: 'Kann ich die Schmiede ausbauen?',
            next: 'smithOffer',
            visible: () => !meta.hasSmith
          },
          {
            label: 'Ich suche jemanden, der mir zeigen kann, wie man das Können noch weiter treibt.',
            next: 'teacherHint',
            visible: () => gameFlags.oswingSuperHintShown && !gameFlags.lehrerUnlocked
          },
          { label: 'Nur Smalltalk.', next: null }
        ]
      },
      smithOffer: {
        text: [
          '"Schmieden." Oswin lehnt sich zurück. "Das ist keine Hobbybastelei. Du brauchst einen Amboss, einen Ofen, richtiges Werkzeug."',
          '"Ein Schlosser aus der Süderstraße macht sowas. Zwölfhundert Gold. Nicht billig, aber sauber gebaut."',
          '"Willst du das?"'
        ],
        options: [
          {
            label: '"Machen wir es."',
            next: 'smithBought',
            locked: () => resources.gold < 1200,
            reason: 'Erfordert 1200 Gold',
            action: () => {
              resources.gold -= 1200;
              meta.hasSmith   = true;
              navUnseen.schmiede = true;
              showToast('Die Schmiede ist fertig. Sie ist jetzt in "Mein Haus" verfügbar.', TOAST.EVENT);
            }
          },
          { label: '"Noch nicht."', next: null }
        ]
      },
      smithBought: {
        text: ['"Schön", sagt Oswin. "Hast du jetzt eine Schmiede." Eine weitere Pause. "Du wirst es brauchen."'],
        options: [{ label: 'Danke.', next: null }]
      },
      business: {
        text: () => gameFlags.lehrerUnlocked
          ? ['"Darüber haben wir doch bereits geredet." Oswin schaut mich mit kaum verhüllter Ungeduld an. "Hast du das etwa vergessen? Das Lehrhaus. Dort findest du, was du suchst."']
          : ['Er hebt eine Augenbraue, fast beeindruckt. "Nun gut. Vielleicht bist du doch nicht völlig wertlos."'],
        options: [
          {
            label: 'Ich suche jemanden, der mir zeigen kann, wie man das Können noch weiter treibt.',
            next: 'teacherHint',
            visible: () => gameFlags.oswingSuperHintShown && !gameFlags.lehrerUnlocked
          },
          { label: 'Wie schmeichelhaft.', next: null, visible: () => !gameFlags.lehrerUnlocked },
          { label: 'Entschuldigung. Ich gehe dann.', next: null, visible: () => !!gameFlags.lehrerUnlocked }
        ]
      },
      teacherHint: {
        text: [
          '"Jemanden, der weiter bringt?" Oswin lehnt sich zurück und lacht einmal, kurz und trocken. "Du hast tatsächlich mehr Mumm, als du aussiehst."',
          '"Es gibt eine Person. Alt, still, wenig redselig. Manche nennen sie die Lehrmeisterin. Ich nenne sie... eine seltene Investition. Sie taucht gelegentlich im alten Lehrhaus am Stadtrand auf — wenn es ihr gerade beliebt."',
          '"Wenn du wirklich aus dem herausholen willst, was du schon kannst — dann weißt du jetzt, wo du suchen musst. Aber blamier mich nicht, wenn du dort auftauchst."'
        ],
        options: [{
          label: 'Das Lehrhaus. Ich werde nachschauen.',
          next: null,
          action: () => {
            gameFlags.lehrerUnlocked = true;
            navUnseen.lehrer = true;
            showToast('Das Lehrhaus ist jetzt in der Navigation freigeschaltet.', TOAST.EVENT);
          }
        }]
      }
    }
  },

  brakka: {
    name: 'Brakka, der Schmied', icon: '🔨',
    tagline: 'Trockener Humor, ein Herz aus Eisen — und Eisen für alle anderen.',
    availability: 'day', availabilityText: 'Habe ihn tagsüber gesehen.',
    questId: 'nightWatch',
    questAvailable: () => gameClock.day >= 2 && gameFlags.waffenschmiedRejected,
    hasHint: () => quests.guildRegistration.state === QUEST_STATE.ACTIVE || quests.nightWatch.state === QUEST_STATE.DONE ||
      (quests.miraLetter.state === QUEST_STATE.ACTIVE && (questItems.sealedLetter || 0) > 0) ||
      quests.theftInvestigation.state === QUEST_STATE.MIRA_CONSULTED,
    start: () => {
      if (quests.miraLetter.state === QUEST_STATE.ACTIVE && (questItems.sealedLetter || 0) > 0) return 'receiveLetter';
      if (quests.theftInvestigation.state === QUEST_STATE.MIRA_CONSULTED) return 'detectiveReveal';
      if (quests.guildRegistration.state === QUEST_STATE.ACTIVE) {
        return gameFlags.guildExplainedByBrakka ? 'guildReadyCheck' : 'guildExplain';
      }
      if (quests.guildRegistration.state === QUEST_STATE.REWARDED) return 'guildFinished';
      switch (quests.nightWatch.state) {
        case QUEST_STATE.UNSTARTED: return (gameClock.day >= 2 && gameFlags.waffenschmiedRejected) ? 'offer' : 'tooSoon';
        case QUEST_STATE.ACTIVE:    return 'waiting';
        case QUEST_STATE.DONE:      return 'turnIn';
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
              quests.nightWatch.state = QUEST_STATE.ACTIVE;
              showToast('Aufgabe angenommen: Halte heute Nacht Wache.', TOAST.EVENT);
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
              quests.nightWatch.state = QUEST_STATE.REWARDED;
              checkMilestones(); // Gold-Gewinne außerhalb von completeWork()/nightWatch() müssen denselben Check auslösen
              showToast(`Aufgabe abgeschlossen: Nachtwache (+${NIGHTWATCH_QUEST_REWARD} Gold). Ab jetzt jede Nacht möglich.`, TOAST.REWARD);
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
            showToast('Aufgabe: Bereite dich auf die Gildenprüfung vor — sprich wieder mit Brakka, wenn du bereit bist.', TOAST.EVENT);
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
            action: () => {
              quests.guildRegistration.state = QUEST_STATE.REWARDED;
              gameFlags.kapitel2Unlocked   = true;
              gameFlags.jagdgebietUnlocked = true;
              navUnseen.jagdgebiet = true;
            }
          }
        ]
      },
      guildEnd: {
        text: [
          'Brakka nickt knapp. "Dann ist es Zeit, Fremder. Die Gilde wird von dir hören."',
          '"Aber erst zeig mir, dass du dich schlägst. Südlich der Stadt gibt es ein Jagdgebiet — lass die Wölfe dort deine Visitenkarte sein. Komm zurück, wenn du weißt, was du drauf hast."',
          'Er dreht sich um. Kein Händeschütteln. Keine Umarmung. Nur ein neuer Weg.'
        ],
        options: [{ label: 'Das Jagdgebiet. Ich verstehe.', next: null }]
      },
      guildFinished: {
        text: ['Brakka hebt sein Glas. "Geh und mach uns stolz, Fremder."'],
        options: [{ label: 'Werde ich.', next: null }]
      },
      detectiveReveal: {
        text: [
          'Brakka legt den Hammer nieder. Langsam. Ich habe ihn das noch nie tun sehen.',
          '"Mira hat dich geschickt." Es ist keine Frage.',
          '"Der Mann in der Taverne — er ist kein Dieb. Er ist schlimmer. Er wählt aus, wer beraubt wird. Ich kenne sein Gesicht seit Jahren. Er war schon hier, als ich jung war."',
          '"Ich habe nie geredet. Weil ich zu feige war, oder weil es mir nicht passiert ist. Ich weiß selbst nicht mehr, was der Unterschied ist."',
          '"Wenn du ihn stellen willst — erst musst du stärker sein als er erwartet. Er ist kein Mann der Gewalt. Aber er hat Leute, die es für ihn sind."'
        ],
        options: [{
          label: '"Ich bin bereit."',
          next: null,
          action: () => {
            if (!gameFlags.brakkaRevealedSuspect) {
              gameFlags.brakkaRevealedSuspect = true;
              quests.theftInvestigation.state = QUEST_STATE.BRAKKA_CONSULTED;
              storyState = 20105;
              render();
              maybeShowStoryDialog('2.5');
              showToast('Brakka hat gesprochen. Jetzt: Stärke-Lvl 3 + Waldtroll besiegen — dann den Fremden stellen.', TOAST.EVENT);
            }
          }
        }]
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
              quests.miraLetter.state = QUEST_STATE.DELIVERED;
              resources.gold            += 6;
              resources.totalGoldEarned += 6;
              checkMilestones();
              showToast('Brief überbracht (+6 Gold). Mira sollte davon erfahren.', TOAST.REWARD);
            }
          },
          { label: '"Warum hat Mira den Brief nicht selbst gebracht?"', next: 'whyMiraSent' }
        ]
      },
      whyMiraSent: {
        text: [
          'Brakka hebt kaum die Augenbraue — als hätte er die Frage erwartet.',
          '"Weil Mira klug ist", sagt er knapp. "Sie weiß, wen man sieht — und wen man sich merkt."',
          '"Ein Fremder fällt auf. Mira merkt man sich. Das ist der Unterschied zwischen einer Botschaft, die ankommt, und einem Problem, das sich von selbst löst."',
          'Er faltet den Brief. "Verstanden?"'
        ],
        options: [
          {
            label: 'Ja. Ich gebe ihr Bescheid.',
            next: null,
            action: () => {
              questItems.sealedLetter = Math.max(0, (questItems.sealedLetter || 0) - 1);
              quests.miraLetter.state = QUEST_STATE.DELIVERED;
              resources.gold            += 6;
              resources.totalGoldEarned += 6;
              checkMilestones();
              showToast('Brief überbracht (+6 Gold). Mira sollte davon erfahren.', TOAST.REWARD);
            }
          }
        ]
      }
    }
  },

  vorarbeiter: {
    name: 'Der Vorarbeiter', icon: '👷',
    tagline: 'Wortkarg, aber fair — wer ordentlich schuftet, hat seinen Respekt.',
    availability: 'evening', availabilityText: 'Habe ihn bisher nur abends gesehen.',
    questId: 'foremanRaise',
    // Nur nachts antreffbar — hasHint schließt die Tageszeit ein, damit der
    // Taverne-Tab nicht schon tagsüber nach dem Einladungs-Dialog leuchtet.
    hasHint: () => quests.foremanRaise.state === QUEST_STATE.ACTIVE && isNight(),
    locked: () => quests.foremanRaise.state === QUEST_STATE.UNSTARTED || !isNight(),
    start: () => (quests.foremanRaise.state === QUEST_STATE.ACTIVE ? 'praise' : 'idle'),
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
            quests.foremanRaise.state = QUEST_STATE.REWARDED;
            checkMilestones();
            showToast(`+${FOREMAN_BONUS_GOLD} Gold und dauerhaft +1 Gold pro Feldarbeit.`, TOAST.REWARD);
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
    availability: 'day', availabilityText: 'Habe sie tagsüber gesehen.',
    questId: 'kraemerinBusiness',
    badgeOnActive: true,
    badgeOnActiveIf: () => hasEnoughResourcesForQuest(),
    hasHint: () => quests.kraemerinBusiness.state === QUEST_STATE.INVITED,
    locked: () => quests.kraemerinBusiness.state === QUEST_STATE.UNSTARTED,
    start: () => {
      switch (quests.kraemerinBusiness.state) {
        case QUEST_STATE.INVITED: return 'offer';
        case QUEST_STATE.ACTIVE:  return hasEnoughResourcesForQuest() ? 'turnIn' : 'reminder';
        default: {
          // Nach Quest-Abschluss: Tier-Drop-Items einlösen?
          const drops = ['hundespur','rabenfeder','hasenspur','eichhoernchennuss'];
          if (drops.some(d => (questItems[d] || 0) > 0)) return 'petCatch';
          return 'idle';
        }
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
            quests.kraemerinBusiness.state = QUEST_STATE.ACTIVE;
            gameFlags.resourceGatheringUnlocked = true;
            navUnseen.rohstoffe = true;
            showToast('Quest erhalten: Rohstoffe für Greta sammeln.', TOAST.EVENT);
          }
        }]
      },
      reminder: {
        text: () => [`"Na, schon was gesammelt?"${kraemerinQuestListHtml()}`],
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
            quests.kraemerinBusiness.state = QUEST_STATE.REWARDED;
            showToast('Rohstoffe abgegeben. Greta erweitert ihr Sortiment.', TOAST.REWARD);
          }
        }]
      },
      petCatch: {
        text: () => {
          const dropMap = {
            hundespur:         { name: 'Hundespur',      animal: 'ein junger Hund', type: 'hund' },
            rabenfeder:        { name: 'Rabenfeder',     animal: 'ein wilder Rabe', type: 'rabe' },
            hasenspur:         { name: 'Hasenspur',      animal: 'ein flinker Hase', type: 'hase' },
            eichhoernchennuss: { name: 'Angebissene Nuss', animal: 'ein Eichhörnchen', type: 'eichhoernchen' }
          };
          const found = Object.entries(dropMap).find(([id]) => (questItems[id] || 0) > 0);
          if (!found) return ['"Was darf\'s heute sein?"'];
          const [, info] = found;
          return [
            `"Warte mal — ist das eine ${info.name}?" Greta beugt sich vor und nimmt sie in die Hand.`,
            `"Da draußen streift ${info.animal} rum. Ich kenn da eine Methode, solche Tiere zu locken — die Spur ist frisch genug."`,
            '"Willst du, dass ich dir das beibring?"'
          ];
        },
        options: [
          {
            label: '"Ja, zeig es mir."',
            next: null,
            action: () => {
              const dropToType = {
                hundespur:         'hund',
                rabenfeder:        'rabe',
                hasenspur:         'hase',
                eichhoernchennuss: 'eichhoernchen'
              };
              const icons = { hund: '🐕', rabe: '🐦', hase: '🐇', eichhoernchen: '🐿' };
              const names = { hund: 'Hund', rabe: 'Rabe', hase: 'Hase', eichhoernchen: 'Eichhörnchen' };
              for (const [itemId, type] of Object.entries(dropToType)) {
                if ((questItems[itemId] || 0) > 0 && !wildPets.some(p => p.type === type)) {
                  questItems[itemId] = 0;
                  wildPets.push({ type, level: 1 });
                  navUnseen.pets = true;
                  showToast(`${icons[type]} ${names[type]} gefangen! Er wartet unter "Haustiere".`, TOAST.EVENT);
                  break;
                }
              }
            }
          },
          { label: '"Vielleicht ein anderes Mal."', next: null }
        ]
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
    availability: 'evening', availabilityText: 'Habe ihn bisher nur abends gesehen.',
    questId: 'commanderTraining',
    badgeOnActive: true,
    hasHint: () => gameFlags.commanderRecruitmentShown && !gameFlags.stadtwacheAccepted,
    locked: () => quests.commanderTraining.state === QUEST_STATE.UNSTARTED,
    start: () => {
      if (quests.commanderTraining.state === QUEST_STATE.ACTIVE) return 'offer';
      if (gameFlags.commanderRecruitmentShown && !gameFlags.stadtwacheAccepted) return 'recruit';
      if (gameFlags.stadtwacheAccepted) return 'accepted';
      return 'idle';
    },
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
              quests.commanderTraining.state = QUEST_STATE.REWARDED;
              showToast('Roswald hat dir die Grundlagen gezeigt. Im Erfahrungsbaum kannst du jetzt für die Nachtwache aufleveln.', TOAST.EVENT);
            }
          },
          { label: 'Vielleicht ein anderes Mal.', next: null }
        ]
      },
      recruit: {
        text: () => {
          const base = [
            'Roswald sitzt allein am Tisch, ein Becher vor ihm, den er nicht anrührt. Er wartet.',
            '"Den Waldtroll erlegt", sagt er, ohne aufzublicken. "Hab\'s gehört. Zweimal."',
            '"Stadtwache ist kein Job für jeden. Ich nehme nur Leute, die ich kenne — oder die mir jemand empfiehlt. Du hast beides nicht."',
            'Jetzt schaut er mich an. "Aber wer einen Waldtroll übersteht, hat Respekt verdient. Ich mach eine Ausnahme. Einmalig."',
            '"Was sagst du?"'
          ];
          if (gameFlags.stadtwacheDeclined) {
            return ['"Hast du es dir nochmal überlegt?"'];
          }
          return base;
        },
        options: [
          {
            label: 'Ich bin dabei.',
            next: 'recruitAccepted',
            action: () => {
              gameFlags.stadtwacheAccepted = true;
              gameFlags.stadtwacheDeclined = false;
              navUnseen.stadtwache = true;
              showToast('Roswald nickt. Ab jetzt bist du Teil der Stadtwache.', TOAST.EVENT);
            }
          },
          {
            label: 'Das ist mir gerade zu viel.',
            next: 'recruitDeclined',
            action: () => { gameFlags.stadtwacheDeclined = true; }
          }
        ]
      },
      recruitAccepted: {
        text: [
          'Roswald steht auf, ohne die Hand zu reichen — Männer wie er brauchen das nicht.',
          '"Schichtbeginn bei Sonnenaufgang. Kein Zu-Spät-Kommen."',
          'Er geht. Das Gespräch ist vorbei.'
        ],
        options: [{ label: 'Verstanden.', next: null }]
      },
      recruitDeclined: {
        text: ['"Meinetwegen. Ich frage nochmal, wenn du bereit bist."'],
        options: [{ label: 'Danke.', next: null }]
      },
      accepted: {
        text: ['Roswald hebt zwei Finger zum Gruß. "Schicht läuft gut?" Keine Antwort erwartet.'],
        options: [{ label: 'Läuft.', next: null }]
      },
      idle: {
        text: ['Roswald hebt zwei Finger zum Gruß, mehr nicht. Männer wie er verschwenden keine Worte.'],
        options: [{ label: 'Verstanden.', next: null }]
      }
    }
  },

  strassenkehrer: {
    name: 'Ein alter Straßenkehrer', icon: '🧹',
    tagline: 'Kennt jede Gasse und jeden Schatten der Stadt — und redet gern darüber.',
    availability: 'day', availabilityText: 'Habe ihn tagsüber gesehen.',
    locked: () => gameClock.day < 5,
    start: 'greet',
    nodes: {
      greet: {
        text: [
          'Der alte Mann lehnt an seinem Besen und mustert mich kurz, bevor er weiterkehrt. "Bist du neu hier? Man sieht’s noch an dir."',
          '"Ich kehr diese Gassen seit dreißig Jahren. Weißt du, was einem auffällt, wenn man so lange draußen ist, bevor die Stadt aufwacht? Die Leute in ihren warmen Betten denken, Treutheim ist eine Stadt. Ich sag dir: bei Nacht gehören die Gassen jemand anderem."',
          '"Ich hab Dinge gesehen, die kein Wirt und kein Händler je zu Gesicht kriegen. Manche scheu. Manche klug. Manche — wenn man ihnen Zeit lässt und sie nicht erschreckt — kommen sogar von selbst näher."',
          'Er kehrt weiter, ohne mich noch einmal anzusehen. "Aber das ist nichts für Ungeduldige."'
        ],
        options: [{
          label: 'Interessant. Ich werde die Augen offen halten.',
          next: null,
          action: () => { gameFlags.streetSweeperTalked = true; }
        }]
      }
    }
  },

  fremder: {
    name: 'Ein zwielichtiger Mann', icon: '🥷',
    tagline: 'Sitzt allein am Rand des Schankraums, sein Blick wandert ständig.',
    availability: 'always', availabilityText: 'Scheint immer hier zu sein.',
    locked: () => storyState < 10102,
    hasHint: () =>
      (storyState >= 10102 && npcFlags.fremderTalkCount === 0) ||
      (quests.theftInvestigation.state === QUEST_STATE.BRAKKA_CONSULTED &&
        gameFlags.waldtrollKilled && getStrengthLevel(strength.xp) >= 3),
    start: () => {
      // Konfrontation (Bedingungen: Quest in 'brakka_consulted', Stärke 3+, Waldtroll besiegt)
      if (quests.theftInvestigation.state === QUEST_STATE.BRAKKA_CONSULTED &&
          gameFlags.waldtrollKilled && getStrengthLevel(strength.xp) >= 3) {
        return 'confrontation';
      }
      if (quests.theftInvestigation.state === QUEST_STATE.CONFRONTED || gameFlags.fremderConfronted) {
        return 'postConfrontation';
      }
      return 'greet';
    },
    nodes: {
      greet: {
        text: [
          'Aus der Nähe wirkt er noch zwielichtiger. Er nickt mir knapp zu, ohne wirklich herzusehen. "Suchst du was?"',
          'Sein Blick streift kurz meinen Geldbeutel — dann wieder mein Gesicht, als wäre nichts gewesen.'
        ],
        options: [
          { label: '"Nur einen Drink."', next: null, action: () => { npcFlags.fremderTalkCount += 1; } },
          { label: '"Wer bist du?"', next: 'who', action: () => { npcFlags.fremderTalkCount += 1; } },
          { label: '"Du beobachtest mich. Warum?"', next: 'watching', action: () => { npcFlags.fremderTalkCount += 1; } }
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
      },
      confrontation: {
        text: [
          'Ich lege die Münze mit dem eingestanzten Kratzer auf den Tisch zwischen uns.',
          'Der zwielichtige Mann betrachtet sie lange. Sein Gesicht verrät nichts. Dann: "Du bist nicht wie die anderen."',
          '"Die anderen haben nach dem Raub aufgehört. Haben die Stadt verlassen oder geschwiegen. Du nicht."',
          '"Ich habe dich ausgewählt. Nicht nur wegen des Goldes — um zu sehen, was du daraus machst. Du hast Stärke gezeigt. Im Jagdgebiet. Im Gespräch. Sogar hier, jetzt."',
          '"Der Schatten will wissen, wer du bist. Ich werde ihm sagen, dass du jemand bist, mit dem man rechnet."',
          'Er schiebt die Münze zu mir zurück. "Behalte sie. Als Erinnerung."'
        ],
        options: [{
          label: '"Und das Gold, das du gestohlen hast?"',
          next: 'confrontationEnd'
        }]
      },
      confrontationEnd: {
        text: [
          '"Das Gold?" Er lacht leise. "Das ist längst weg. Aber du bist hier, und das ist mehr wert."',
          '"Leb gut, Fremder. Wir werden uns wiedersehen." Er erhebt sich und verlässt die Taverne — langsam, ohne Eile, als wäre er nie bedroht gewesen.'
        ],
        options: [{
          label: 'Ich lasse ihn gehen.',
          next: null,
          action: () => {
            if (!gameFlags.fremderConfronted) {
              gameFlags.fremderConfronted = true;
              quests.theftInvestigation.state = QUEST_STATE.CONFRONTED;
              storyState = 20106;
              render();
              maybeShowStoryDialog('2.6', () => {
                // Kurze Pause, dann Sieg-Dialog anzeigen
                setTimeout(triggerChapter2Victory, 800);
              });
              showToast('Die Konfrontation ist vorbei. Die Spur des Diebs — abgeschlossen.', TOAST.EVENT);
            }
          }
        }]
      },
      postConfrontation: {
        text: ['Der zwielichtige Mann ist nicht mehr hier. Nur sein leerer Stuhl erinnert an das Gespräch.'],
        options: [{ label: 'Er ist weg.', next: null }]
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
function findNpcDef(npcId) {
  if (NPCS[npcId]) return NPCS[npcId];
  if (typeof NPCS_LETHKAR !== 'undefined') {
    const lethkarNpc = NPCS_LETHKAR.find(n => n.id === npcId);
    if (lethkarNpc) return lethkarNpc;
  }
  return null;
}

function openNpcDialog(npcId, nodeId) {
  const npc = findNpcDef(npcId);
  if (!npc) return;
  if (typeof npc.locked === 'function' && npc.locked()) return;

  const id   = nodeId || getNpcStartNode(npc);
  const node = npc.nodes[id];
  if (!node) { closeDialog(); return; }

  const options = (node.options || []).filter(opt =>
    typeof opt.visible !== 'function' || opt.visible()
  );
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

/** Gibt true zurück, wenn mindestens ein Treutheim-NPC etwas Quest-Relevantes
    zu sagen hat. Wird jedes Render-Frame in nav.js berechnet — kein manuelles
    navUnseen.taverne = true mehr nötig. */
function isTaverneTabNew() {
  return Object.values(NPCS).some(npc => {
    if (typeof npc.locked === 'function' ? npc.locked() : !!npc.locked) return false;
    const hasOfferableQuest = npc.questId && quests[npc.questId]?.state === QUEST_STATE.UNSTARTED &&
      (typeof npc.questAvailable !== 'function' || npc.questAvailable());
    const hasPendingQuest = npc.questId && npc.badgeOnActive && quests[npc.questId]?.state === QUEST_STATE.ACTIVE &&
      (typeof npc.badgeOnActiveIf !== 'function' || npc.badgeOnActiveIf());
    const hasHint = typeof npc.hasHint === 'function' && npc.hasHint();
    return hasOfferableQuest || hasPendingQuest || hasHint;
  });
}

/* ── Taverne: Ortsansicht mit anklickbaren NPCs ──────────────── */
/* Gäste, deren Bedingung (noch) nicht erfüllt ist, erscheinen gar nicht
   erst — kein "Nicht ansprechbar"-Platzhalter mehr (Progressive
   Disclosure). */
function renderTaverne(el) {
  const visibleNpcs = Object.entries(NPCS).filter(([, npc]) =>
    !(typeof npc.locked === 'function' ? npc.locked() : !!npc.locked));

  const cards = visibleNpcs.map(([id, npc]) => {
    const hasOfferableQuest = npc.questId && quests[npc.questId].state === QUEST_STATE.UNSTARTED &&
      (typeof npc.questAvailable !== 'function' || npc.questAvailable());
    const hasPendingQuest = npc.questId && npc.badgeOnActive && quests[npc.questId].state === QUEST_STATE.ACTIVE;
    const hasHint = typeof npc.hasHint === 'function' && npc.hasHint();
    const badge = (hasOfferableQuest || hasPendingQuest || hasHint)
      ? `<div class="npc-quest-badge" title="Hat eine Aufgabe für mich">❗</div>`
      : '';
    const availDot = npc.availability
      ? `<div class="npc-avail-dot npc-avail-${npc.availability}"><div class="npc-avail-tip">${npc.availabilityText}</div></div>`
      : '';
    return `
      <div class="action-card" style="position: relative;">
        ${badge}
        ${availDot}
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

/* ══════════════════════════════════════════════════════════════
   LETHKAR-NPCs (Kapitel 3)
   ══════════════════════════════════════════════════════════════ */

const NPCS_LETHKAR = [
  {
    id: 'varena',
    name: 'Varena', icon: '⚗',
    tagline: 'Alchemistin. Spricht wenig — und wenn, dann präzise.',
    location: CONTENT.TAVERNE,
    start: () => {
      if (!gameFlags.varenaMetFirst) return 'firstMeet';
      if ((questItems.miras_brief || 0) > 0 && !gameFlags.varenaDecodedBrief) return 'offerDecode';
      if (gameFlags.varenaDecodedBrief && !alchemie.unlocked) return 'teachAlchemie';
      if (alchemie.unlocked) return 'alchemieIdle';
      return 'idle';
    },
    nodes: {
      firstMeet: {
        text: [
          '"Du siehst aus wie jemand, der aus Treutheim kommt." Keine Frage. Eine Feststellung.',
          '"Ich bin Varena. Ich lehre Alchemie — für die, die es ernst nehmen. Was willst du hier in Lethkar?"'
        ],
        options: [
          {
            label: '"Ich suche jemandem, der mir einen Brief entschlüsseln kann."',
            next: 'briefHint',
            action: () => { gameFlags.varenaMetFirst = true; }
          },
          {
            label: '"Ich bin einfach durchgereist."',
            next: 'idle',
            action: () => { gameFlags.varenaMetFirst = true; }
          }
        ]
      },
      briefHint: {
        text: ['"Einen verschlüsselten Brief?" Sie sieht dich an. "Zeig ihn mir. Wenn es ein Treutheimer Chiffre ist, kenne ich ihn."'],
        options: [
          {
            label: 'Den Brief zeigen.',
            next: 'checkBrief',
            locked: () => !(questItems.miras_brief > 0),
            reason: 'Ich habe den Brief nicht dabei.'
          },
          { label: 'Später vielleicht.', next: null }
        ]
      },
      checkBrief: {
        text: [
          'Varena überfliegt den Brief. Ihre Augen wandern ruhig über die Zeilen.',
          '"Ja. Das ist ein alter Lethkarer Buchstabenverschieber — die Söldner aus dem Norden haben ihn genutzt." Sie faltet ihn zusammen.',
          '"Valdris. Der Name. Ich kenne das Haus — nördlich des Markts. Geh dorthin nicht allein."'
        ],
        options: [{
          label: '"Was weißt du über Valdris?"',
          next: 'valdrisInfo',
          action: () => {
            gameFlags.varenaDecodedBrief = true;
            gameFlags.mirasBriefDecoded  = true;
            questItems.miras_brief       = 0;
            navUnseen.inventar           = true;
            showToast('Der Brief ist entschlüsselt. Inhalt jetzt im Inventar lesbar.', TOAST.EVENT);
          }
        }]
      },
      valdrisInfo: {
        text: [
          '"Valdris ist kein Name, den man laut ausspricht. Händler, Söldner, Informanten — er hat überall Augen."',
          '"Wenn deine Freundin diesen Namen aufgeschrieben hat, dann weiß sie mehr als sie zeigt. Sei vorsichtig."'
        ],
        options: [
          {
            label: '"Kannst du mir Alchemie beibringen?"',
            next: 'teachAlchemie'
          },
          { label: 'Danke. Ich denke nach.', next: null }
        ]
      },
      offerDecode: {
        text: ['"Den Brief noch dabei?" Sie nickt. "Bring ihn her."'],
        options: [{ label: 'Den Brief zeigen.', next: 'checkBrief' }]
      },
      teachAlchemie: {
        text: [
          '"Du willst lernen." Keine Frage, wieder. "Gut. Dann fangen wir mit dem Einfachsten an."',
          '"Feuer, Wasser, Erde, Luft — und Äther, das Fünfte. Du wirst Jahre brauchen. Vielleicht dein Leben. Aber du wirst etwas verstehen, das wenige sehen."',
          '"Das Laboratorium neben dem Markt. Morgen früh. Bring nichts mit außer dir selbst."'
        ],
        options: [{
          label: '"Ich bin dabei."',
          next: null,
          action: () => {
            alchemie.unlocked = true;
            alchemie.lastTick = Date.now();
            startAlchemieTick();
            navUnseen.alchemie = true;
            showToast('Alchemie freigeschaltet! Das Laboratorium wartet auf dich.', TOAST.REWARD);
          }
        }]
      },
      alchemieIdle: {
        text: ['"Wie läuft es mit dem Studium?" Sie schaut kurz hoch von ihrem Becher.'],
        options: [
          { label: '"Langsam. Aber ich lerne."', next: null },
          { label: '"Fragen zur Alchemie habe ich keine."', next: null }
        ]
      },
      idle: {
        text: ['"Wenn du Fragen zur Alchemie hast — ich bin abends hier."'],
        options: [{ label: 'Verstanden.', next: null }]
      }
    }
  },

  {
    id: 'thessa',
    name: 'Thessa', icon: '📜',
    tagline: 'Archivarin. Kennt Lethkar besser als sich selbst.',
    location: CONTENT.TAVERNE,
    start: () => {
      if (!gameFlags.thessaMetFirst) return 'firstMeet';
      if (gameFlags.thessaTrustGained) return 'trusted';
      return 'cautious';
    },
    nodes: {
      firstMeet: {
        text: [
          'Die Frau am Tisch blättert in einem dicken Buch, ohne aufzusehen.',
          '"Du bist neu hier. Erkennbar." Sie schaut jetzt hoch. Braune Augen, prüfend. "Thessa. Archivarin."',
          '"Was du brauchst: nicht fragen, bevor du weißt, wen du fragst."'
        ],
        options: [
          {
            label: '"Ich suche Informationen über jemanden namens Valdris."',
            next: 'valdrisCaution',
            action: () => { gameFlags.thessaMetFirst = true; }
          },
          {
            label: '"Nur neugierig. Guter Rat."',
            next: null,
            action: () => { gameFlags.thessaMetFirst = true; }
          }
        ]
      },
      valdrisCaution: {
        text: [
          'Thessa hält inne. Klappt das Buch zu.',
          '"Das ist kein Name für eine erste Unterhaltung." Sie spricht leiser. "Verdien dir das Vertrauen. Dann reden wir weiter."'
        ],
        options: [{ label: 'Verstanden.', next: null }]
      },
      cautious: {
        text: ['"Du wartest auf Vertrauen? Das ist klug." Sie deutet auf den freien Stuhl. "Erzähl mir etwas, das ich noch nicht weiß."'],
        options: [
          {
            label: gameFlags.varenaDecodedBrief
              ? '"Valdris\' Adresse ist nördlich des Markts — das hat mir eine Alchemistin bestätigt."'
              : '"Ich arbeite daran."',
            next: gameFlags.varenaDecodedBrief ? 'trustEarned' : null,
            action: () => {
              if (gameFlags.varenaDecodedBrief) {
                gameFlags.thessaTrustGained = true;
                showToast('Thessa vertraut dir jetzt. Ihr Wissen über Lethkar steht dir offen.', TOAST.EVENT);
              }
            }
          }
        ]
      },
      trustEarned: {
        text: [
          'Thessa nickt langsam. "Das stimmt. Und Varena redet selten." Sie schiebt ein Buch über den Tisch.',
          '"Lethkar hat Augen — und Ohren. Die meisten Bewohner wissen, wer Valdris ist. Sie reden nur nicht. Du weißt jetzt genug, um die richtigen Fragen zu stellen."'
        ],
        options: [{ label: 'Danke.', next: null }]
      },
      trusted: {
        text: ['"Was willst du wissen?" Sie klingt immer noch vorsichtig — aber nicht mehr abweisend.'],
        options: [
          { label: '"Wer schützt Valdris?"', next: 'valdrisProtection' },
          { label: '"Nichts gerade. Danke."', next: null }
        ]
      },
      valdrisProtection: {
        text: [
          '"Keiner schützt ihn direkt. Das wäre zu sichtbar." Thessa lehnt sich zurück.',
          '"Er kauft Loyalität. Söldner, Händler, manchmal Stadtrat-Mitglieder. Du bräuchtest Beweise — und einen Ort, wo du sie sicher aufbewahren kannst."',
          '"Komm wieder, wenn du etwas in der Hand hast."'
        ],
        options: [{ label: 'Ich arbeite daran.', next: null }]
      }
    }
  },

  {
    id: 'pereth',
    name: 'Pereth', icon: '🗡',
    tagline: 'Söldner. Tischbein-Kippend. Zu entspannt für diese Stadt.',
    location: CONTENT.TAVERNE,
    start: () => {
      if (!gameFlags.perethMetFirst) return 'firstMeet';
      if (gameFlags.chapter3StoryComplete) return 'afterQuest';
      if (gameFlags.lagerhausVisited) return 'reportBack';
      if (gameFlags.perethQuestStarted) return 'questUpdate';
      return 'idle';
    },
    nodes: {
      firstMeet: {
        text: [
          'Der Mann am Tischende hat sein Bein auf dem Stuhl neben ihm. Als ob er weiß, dass du kommst.',
          '"Pereth." Er hebt den Becher. "Söldner. Derzeit ohne Auftrag, was gut ist." Eine kurze Pause.',
          '"Du siehst aus wie jemand, der Ärger sucht. Das find ich gut. Setz dich."'
        ],
        options: [
          {
            label: 'Hinsetzen.',
            next: 'offerHelp',
            action: () => { gameFlags.perethMetFirst = true; }
          }
        ]
      },
      offerHelp: {
        text: [
          '"Es gibt was, das ich brauche — jemand ohne Geschichte in dieser Stadt." Er senkt die Stimme.',
          '"Ein Lagerhaus am Südtor. Zwei Wachen, normaler Zeitplan. Ich brauche jemanden, der reinschaut und sagt, was da drin ist."',
          '"Kein Stehlen, kein Kämpfen. Nur anschauen. Dafür: 300 Gold und ein paar nützliche Informationen."'
        ],
        options: [
          {
            label: '"Ich mache das."',
            next: null,
            action: () => {
              gameFlags.perethQuestStarted = true;
              showToast('Neuer Auftrag: Das Lagerhaus am Südtor erkunden.', TOAST.EVENT);
            }
          },
          { label: '"Zu riskant. Vielleicht später."', next: null }
        ]
      },
      questUpdate: {
        text: ['"Das Lagerhaus? Noch nicht durch damit?" Er schaut amüsiert. "Kein Druck. Aber das Angebot gilt nur noch eine Weile."'],
        options: [
          {
            label: '"Ich war im Lagerhaus. Hier ist, was ich gefunden habe."',
            next: null,
            action: () => {
              gameFlags.lagerhausVisited = true;
              render();
              showMonologue('Das Lagerhaus am Südtor', [
                'Das Schloss am Südtor ist neu. Die Wache dreht Runden wie nach Uhr — zu gleichmäßig für echte Wachsamkeit.',
                'Ich gehe von hinten rein. Ein Fenster, das nie richtig zugezogen wird. Lagerhäuser, die niemand offiziell besitzt, werden nie fertig gebaut.',
                'Drinnen: Kisten. Tücher. Staub. Und ganz hinten — ein Tisch mit Papieren, die sorgfältiger aussehen als alles andere hier.',
                'Namen, die ich aus Thessas Büchern kenne. Routen. Zahlen. Und überall dasselbe Siegel — drei Linien, ein Kreis.',
                'Ich nehme nichts. Ich merke mir alles. Das hier gehört jemandem, dem man keine Spuren hinterlässt.'
              ], () => {
                const npc = NPCS_LETHKAR.find(n => n.id === 'pereth');
                openNpcDialogWithDef(npc, 'reportBack');
              });
            }
          },
          { label: '"Noch nicht bereit."', next: null },
          { label: '"Was weißt du über Valdris?"', next: 'valdrisPereth' }
        ]
      },
      reportBack: {
        text: [
          '"Du warst wirklich drin." Er schaut mich lange an. Dann nickt er einmal, langsam. "Und du hast nichts mitgenommen. Gut."',
          '"Das Siegel — kenn ich. Valdris benutzt das für Transporte, die offiziell nicht existieren. Überall. Seit Jahren."',
          '"Du hast mehr rausgefunden als ich in drei Monaten zusammen. Hier." Er schiebt drei Münzbeutel über den Tisch. "300 Gold. Und pass auf, wem du das erzählst."'
        ],
        options: [{
          label: '"Danke. Ich pass auf mich auf."',
          next: null,
          action: () => {
            resources.gold += 300;
            resources.totalGoldEarned += 300;
            gameFlags.chapter3StoryComplete = true;
            showToast('+300 Gold — Pereths Auftrag erfüllt', TOAST.REWARD);
            render();
            setTimeout(() => maybeShowStoryDialog('3.6', () => {}), 400);
          }
        }]
      },
      afterQuest: {
        text: [
          '"Weißt du, was das Interessante an Valdris ist?" Er dreht seinen Becher.',
          '"Er weiß, dass du hier bist. Wahrscheinlich schon seit du in Lethkar bist. Das ist jetzt der Stand der Dinge."',
          '"Jetzt weißt du es auch."'
        ],
        options: [{ label: '"Ich hab\'s verstanden."', next: null }]
      },
      valdrisPereth: {
        text: [
          'Pereth setzt das Bein vom Stuhl. Zum ersten Mal ernst.',
          '"Valdris." Er schaut sich kurz um. "Ich hab für ihn gearbeitet — einmal, vor Jahren. Der Typ zahlt gut und fragt schlecht."',
          '"Was du wissen willst: er hat eine Basis nördlich des Markts. Aber er ist selten dort. Komm nicht ohne Plan hin."'
        ],
        options: [{ label: 'Danke. Ich pass auf mich auf.', next: null }]
      },
      idle: {
        text: ['"Alles gut? Brauchst du was?"'],
        options: [
          { label: '"Alles gut. Danke."', next: null },
          { label: '"Was weißt du über Valdris?"', next: 'valdrisPereth' }
        ]
      }
    }
  }
];

/** Öffnet einen Lethkar-NPC-Dialog (wrapper für openNpcDialog). */
function openLethkarNpcDialog(npcId) {
  const npc = NPCS_LETHKAR.find(n => n.id === npcId);
  if (!npc) return;
  const startNode = typeof npc.start === 'function' ? npc.start() : npc.start;
  openNpcDialogWithDef(npc, startNode);
}
