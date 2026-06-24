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
        text: ['Korbin nickt mir knapp zu. "Du siehst wie jemand aus, der Antworten sucht. Was ist?"'],
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
              showToast('Drink für Mira ausgegeben (−3 Gold). Sie schiebt mir ein Brot zu.', TOAST.PURCHASE);
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
            showToast('Mira hat mir einen verschlüsselten Brief gegeben. Er wartet auf eine Übersetzung — in Lethkar.', TOAST.EVENT);
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
      if (quests.oswinsAuftrag?.state === QUEST_STATE.UNSTARTED && gameClock.day >= 2 && gameFlags.jobUnlocked) return 'oswinsAuftragOffer';
      if (quests.oswinsAuftrag?.state === QUEST_STATE.DONE) return 'oswinsAuftragDone';
      if (quests.fremderGeheimnis?.state === QUEST_STATE.ASKING_AROUND) return 'fremderHint';
      if (meta.hasHome) return 'greetHomeOwner';
      return 'greet';
    },
    nodes: {
      oswinsAuftragOffer: {
        text: [
          'Oswin schaut mich an — und dann schaut er zur Seite, als würde er prüfen, ob jemand zuhört.',
          '"Du bist der Neue. Unbekannt, kein Ruf, keine Verbindungen." Eine Pause. "Das ist nützlich."',
          '"Richte Brakka aus, dass ich... ein Gespräch möchte. Diskret. Kein großes Ding. Einfach sagen: Oswin bittet um seine Zeit."'
        ],
        options: [
          {
            label: '"Das mache ich."',
            next: null,
            action: () => {
              quests.oswinsAuftrag.state = QUEST_STATE.ACTIVE;
              showToast('Neue Aufgabe: Oswins stiller Auftrag — Brakka ausrichten.', TOAST.EVENT);
            }
          },
          { label: '"Ich bin nicht dein Bote."', next: 'oswinsAbweis' }
        ]
      },
      oswinsAbweis: {
        text: ['"Wie du willst." Er wendet sich ab. "Ich habe andere Wege."'],
        options: [{ label: 'Gut.', next: null }]
      },
      oswinsAuftragDone: {
        text: [
          'Oswin hebt die Augenbraue, kaum merklich.',
          '"Ah. Du hast es tatsächlich getan." Er nickt, kurz und knapp.',
          '"Hier. Du hast dir das verdient. Und — ich merke mir das."',
          'Zum ersten Mal sieht er mich an, als wäre ich ein Mensch.'
        ],
        reward: () => '✨ <strong>+15 Gold</strong> · Oswin merkt sich deinen Namen',
        options: [{
          label: 'Gern geschehen.',
          next: null,
          action: () => {
            quests.oswinsAuftrag.state = QUEST_STATE.REWARDED;
            resources.gold += 15; resources.totalGoldEarned += 15;
            checkMilestones();
            showToast('Oswins Auftrag abgeschlossen! +15 Gold.', TOAST.REWARD);
          }
        }]
      },
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
              showToast('Das Haus gehört mir. "Mein Haus" ist jetzt in der Navigation verfügbar.', TOAST.EVENT);
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
      fremderHint: {
        text: [
          'Oswin hebt eine Augenbraue. "Der Mann in der Ecke?" Er senkt die Stimme.',
          '"Er nennt sich Serin. Zumindest in manchen Kreisen. Früher Informationshandel — jetzt... weicher in der Außendarstellung, sagen Leute."',
          '"Ich würde ihn fragen. Direkt. Er respektiert Direktheit — im Gegensatz zu den meisten."'
        ],
        options: [{
          label: 'Danke.',
          next: null,
          action: () => {
            if (quests.fremderGeheimnis?.state === QUEST_STATE.ASKING_AROUND)
              quests.fremderGeheimnis.state = QUEST_STATE.IDENTITY_KNOWN;
          }
        }]
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
      quests.theftInvestigation.state === QUEST_STATE.MIRA_CONSULTED ||
      quests.gildePruefung?.state === QUEST_STATE.DONE ||
      quests.waldtrollJagd?.state === QUEST_STATE.DONE ||
      quests.brennenderMut?.state === QUEST_STATE.REWARDED,
    start: () => {
      if (quests.miraLetter.state === QUEST_STATE.ACTIVE && (questItems.sealedLetter || 0) > 0) return 'receiveLetter';
      if (quests.theftInvestigation.state === QUEST_STATE.MIRA_CONSULTED) return 'detectiveReveal';
      if (quests.gildePruefung?.state === QUEST_STATE.DONE) return 'gildePruefungTurnIn';
      if (quests.waldtrollJagd?.state === QUEST_STATE.DONE) return 'waldtrollTurnIn';
      if (quests.brennenderMut?.state === QUEST_STATE.UNSTARTED && quests.nightWatch.state === QUEST_STATE.REWARDED && gameFlags.kapitel2Unlocked) return 'brennenderMutOffer';
      if (quests.guildRegistration.state === QUEST_STATE.ACTIVE) {
        return gameFlags.guildExplainedByBrakka ? 'guildReadyCheck' : 'guildExplain';
      }
      if (quests.guildRegistration.state === QUEST_STATE.REWARDED) return 'guildFinished';
      if (quests.oswinsAuftrag?.state === QUEST_STATE.ACTIVE) return 'oswinsNachricht';
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
        options: [
          { label: 'Verstanden.', next: null },
          {
            label: '"Oswin bittet um deine Zeit."',
            next: 'oswinsNachricht',
            visible: () => quests.oswinsAuftrag?.state === QUEST_STATE.ACTIVE
          }
        ]
      },
      oswinsNachricht: {
        text: [
          'Ich trete einen Schritt näher, die Stimme gesenkt. "Brakka — Oswin bittet um deine Zeit."',
          'Brakka hält inne. Für einen Moment ist sein Gesicht schwer zu lesen.',
          '"Oswin." Er seufzt kurz. "Gut. Sag ihm, ich komme."',
          '"Und dir — danke, dass du diskret warst."'
        ],
        options: [{
          label: 'Ich richte es aus.',
          next: null,
          action: () => {
            quests.oswinsAuftrag.state = QUEST_STATE.DONE;
            showToast('Brakka hat zugestimmt — Oswin Bescheid geben.', TOAST.EVENT);
          }
        }]
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
        reward: () => `✨ <strong>+${NIGHTWATCH_QUEST_REWARD} Gold</strong> · Nachtwache steht ab jetzt jede Nacht zur Verfügung`,
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
            showToast('Gildenprüfung vorbereiten — dann wieder mit Brakka sprechen.', TOAST.EVENT);
          }
        }]
      },
      guildReadyCheck: {
        text: ['Brakka mustert mich von oben bis unten. "Na? Bereit, oder verschwendest du nur meine Zeit?"'],
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
        options: [
          { label: 'Werde ich.', next: null },
          { label: '"Hast du Gerüchte über das tiefe Waldgebiet gehört?"', next: 'waldtrollRumor',
            visible: () => quests.gildePruefung?.state === QUEST_STATE.REWARDED }
        ]
      },
      waldtrollRumor: {
        text: [
          'Brakka senkt die Stimme. "Das Tiefjagdgebiet? Ja. Gerüchte gibt es da immer."',
          '"Sie sagen, da draußen streift etwas — groß, grau, langsam wie Fels und hart wie Eisen."',
          '"Wenn du es suchst, dann geh rein. Aber sag mir hinterher Bescheid — damit wir wissen, was wirklich dort ist."'
        ],
        options: [{
          label: '"Ich werde es finden."',
          next: null,
          action: () => {
            if (quests.waldtrollJagd?.state === QUEST_STATE.UNSTARTED) {
              quests.waldtrollJagd.state = QUEST_STATE.ACTIVE;
              showToast('Neue Aufgabe: Das Ungeheuer im Tiefjagd.', TOAST.EVENT);
            }
          }
        }]
      },
      gildePruefungTurnIn: {
        text: [
          'Brakka schaut mich ruhig an, während ich erzähle. Fünf Kämpfe.',
          '"Na gut", sagt er schließlich. "Du hast bewiesen, dass du kämpfen kannst. Nicht nur zuhören."',
          '"Das tiefe Jagdgebiet ist dir jetzt zugänglich. Und hier — fünfzehn Gold dafür, dass du mich nicht enttäuscht hast."'
        ],
        reward: () => '✨ <strong>+15 Gold</strong> · Tiefjagdgebiet jetzt zugänglich',
        options: [{
          label: 'Danke, Brakka.',
          next: null,
          action: () => {
            quests.gildePruefung.state = QUEST_STATE.REWARDED;
            resources.gold += 15; resources.totalGoldEarned += 15;
            gameFlags.deepHuntingUnlocked = true;
            checkMilestones();
            showToast('Gildenprüfung abgeschlossen! Tiefjagdgebiet freigeschaltet.', TOAST.REWARD);
          }
        }]
      },
      waldtrollTurnIn: {
        text: [
          'Brakka starrt mich an. Dann lacht er — kurz, aber echt.',
          '"Den Waldtroll. Du hast ihn tatsächlich besiegt."',
          '"Ich dachte, du kommst irgendwann zurück und sagst mir, du hast ihn nicht mal gefunden." Er schiebt mir Gold zu.',
          '"Gut gemacht, Fremder. Du bist kein Fremder mehr."'
        ],
        reward: () => '✨ <strong>+25 Gold</strong> · Brakka nennt dich nicht mehr "Fremder"',
        options: [{
          label: 'Das bedeutet mir viel.',
          next: null,
          action: () => {
            quests.waldtrollJagd.state = QUEST_STATE.REWARDED;
            resources.gold += 25; resources.totalGoldEarned += 25;
            checkMilestones();
            showToast('Waldtroll-Quest abgeschlossen! +25 Gold.', TOAST.REWARD);
          }
        }]
      },
      brennenderMutOffer: {
        text: [
          'Brakka lehnt sich zurück und betrachtet mich mit einem Ausdruck, den ich noch nicht an ihm kenne. Ernsthaft. Fast respektvoll.',
          '"Ich kenne Leute, die kommen einmal zur Wache und denken, sie haben etwas bewiesen."',
          '"Drei Nächte hintereinander. Ohne Ausreden. Wenn du das schaffst, vertraue ich dir — und das bedeutet in Treutheim mehr, als du ahnst."'
        ],
        options: [
          {
            label: '"Drei Nächte. Abgemacht."',
            next: null,
            action: () => {
              quests.brennenderMut.state = QUEST_STATE.ACTIVE;
              quests.brennenderMut.count = 0;
              showToast('Neue Aufgabe: Drei Nächte Stadtwache hintereinander.', TOAST.EVENT);
            }
          },
          { label: '"Noch nicht bereit."', next: null }
        ]
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
        reward: () => `✨ Dauerhafter Bonus: <strong>+1 Gold</strong> pro Feldarbeit freigeschaltet · +${FOREMAN_BONUS_GOLD} Gold erhalten`,
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
          'Greta strahlt, als ich ihr die Rohstoffe zeige. "Genau richtig! Damit kann ich arbeiten."',
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
        text: ['Greta nickt mir zu. "Bring mir gerne mal wieder ein paar Rohstoffe — ich kauf sie dir ab."'],
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
              showToast('Roswald hat mir die Grundlagen gezeigt. Im Erfahrungsbaum kann ich jetzt für die Nachtwache aufleveln.', TOAST.EVENT);
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
              showToast('Roswald nickt. Ab jetzt bin ich Teil der Stadtwache.', TOAST.EVENT);
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
        options: [
          { label: 'Verstanden.', next: null },
          {
            label: '"Ich habe mich im Kampf bewiesen. Kannst du mir zeigen, wie ich noch besser werde?"',
            next: 'kampfRoutineOffer',
            visible: () => quests.kampfRoutine?.state === QUEST_STATE.UNSTARTED && quests.nightWatch.state === QUEST_STATE.REWARDED && killStats.total >= 3
          },
          {
            label: '"Das Kampftraining ist abgeschlossen."',
            next: 'kampfRoutineTurnIn',
            visible: () => quests.kampfRoutine?.state === QUEST_STATE.DONE
          }
        ]
      },
      kampfRoutineOffer: {
        text: [
          'Roswald legt seinen Stift nieder. Betrachtet mich.',
          '"Du hast gelernt, einen Treffer zu landen. Das ist mehr als die meisten." Eine Pause.',
          '"Zwei Schichten Stadtwache, fünf weitere Kämpfe. Dann reden wir wieder."'
        ],
        options: [{
          label: '"Ich werde es tun."',
          next: null,
          action: () => {
            quests.kampfRoutine.state = QUEST_STATE.ACTIVE;
            showToast('Neue Aufgabe: Roswalds Kampftraining gestartet.', TOAST.EVENT);
          }
        }]
      },
      kampfRoutineTurnIn: {
        text: [
          'Roswald schaut mich kurz an. Dann nickt er.',
          '"Du hast die Bedingungen erfüllt. Ich sehe es." Er steht auf, legt mir kurz die Hand auf die Schulter — dann nimmt er sie sofort wieder weg.',
          '"Du bist robuster geworden. Das hält an."'
        ],
        reward: () => '✨ <strong>+10 Max-HP dauerhaft</strong> · Roswald nennt dich seinen Schüler',
        options: [{
          label: 'Das werde ich nicht vergessen.',
          next: null,
          action: () => {
            quests.kampfRoutine.state = QUEST_STATE.REWARDED;
            gameFlags.kampfTrainingDone = true;
            playerStats.maxHp += 10;
            playerStats.hp = Math.min(playerStats.hp + 10, playerStats.maxHp);
            showToast('Kampftraining abgeschlossen! +10 Max-HP dauerhaft.', TOAST.REWARD);
          }
        }]
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
        gameFlags.waldtrollKilled && getStrengthLevel(strength.xp) >= 3) ||
      quests.fremderGeheimnis?.state === QUEST_STATE.IDENTITY_KNOWN ||
      quests.kapitel2Finale?.state === QUEST_STATE.ACTIVE,
    start: () => {
      if (quests.kapitel2Finale?.state === QUEST_STATE.ACTIVE) return 'finaleDialog';
      if (quests.theftInvestigation.state === QUEST_STATE.BRAKKA_CONSULTED &&
          gameFlags.waldtrollKilled && getStrengthLevel(strength.xp) >= 3) {
        return 'confrontation';
      }
      if (quests.theftInvestigation.state === QUEST_STATE.CONFRONTED || gameFlags.fremderConfronted) {
        if (quests.fremderGeheimnis?.state === QUEST_STATE.IDENTITY_KNOWN) return 'identityReveal';
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
          // handled: true → openNpcDialog ruft nach der Aktion weder closeDialog()
          // noch openNpcDialog(next) auf; maybeShowStoryDialog('2.6') übernimmt
          // das Dialog-Lifecycle selbst (inklusive des Sieg-Callbacks).
          handled: true,
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
        options: [
          { label: 'Er ist weg.', next: null },
          {
            label: '"Ich will wissen, wer er wirklich ist."',
            next: 'fremderGeheimnisCue',
            visible: () => quests.fremderGeheimnis?.state === QUEST_STATE.CURIOUS && !gameFlags.fremderIdentityKnown
          }
        ]
      },
      fremderGeheimnisCue: {
        text: [
          'Der leere Stuhl. Ich denke nach.',
          'Oswin hat ihn einmal erwähnt — eine "Investition in Informationen". Mira war nervös, als ich von ihm sprach.',
          'Jemand hier kennt ihn. Ich muss nur fragen.'
        ],
        options: [{
          label: 'Ich fange an, nachzufragen.',
          next: null,
          action: () => {
            if (quests.fremderGeheimnis?.state === QUEST_STATE.CURIOUS)
              quests.fremderGeheimnis.state = QUEST_STATE.ASKING_AROUND;
          }
        }]
      },
      identityReveal: {
        text: [
          'Er sitzt wieder. Natürlich sitzt er wieder.',
          'Als ich mich setze, schaut er mich anders an. "Du hast gefragt. Ich habe es gehört."',
          '"Mein Name ist nicht wichtig. Aber Lethkar..." Er lächelt, kaum sichtbar. "...dort kennt man mich. Und bald wirst du es auch tun."'
        ],
        options: [{
          label: '"Warum mir das sagen?"',
          next: 'identityReveal2'
        }]
      },
      identityReveal2: {
        text: [
          '"Weil du nicht aufgehört hast nachzufragen. Das bedeutet, dass du bereit bist."',
          'Er steht auf. Legt ein kleines gefaltetes Papier auf den Tisch. "Das ist eine Adresse in Lethkar. Finde sie. Nenn meinen Namen: Serin."',
          '"Bis dahin — viel Erfolg. Du wirst es brauchen."'
        ],
        options: [{
          label: 'Ich nehme das Papier.',
          next: null,
          action: () => {
            quests.fremderGeheimnis.state = QUEST_STATE.REWARDED;
            gameFlags.fremderIdentityKnown = true;
            showToast('Der Fremde heißt Serin — und er kennt Lethkar.', TOAST.REWARD);
          }
        }]
      },
      finaleDialog: {
        text: [
          'Er sitzt an seinem üblichen Platz. Aber heute kommt er mir entgegen, bevor ich ihn ansprich.',
          '"Du hast dir einen Ruf gemacht, Serin... verzeiht. Alten Reflex."',
          '"Treutheim hat dir alles gegeben, was es hat. Der Rest liegt woanders."',
          '"Lethkar. Nördlich, durch den Bergpass. Du wirst nicht leicht hinkommen — aber du wirst ankommen."',
          'Er schiebt mir ein kleines, gefaltetes Stück Pergament zu. Keine Worte mehr.'
        ],
        options: [{
          label: 'Ich nehme das Pergament.',
          next: null,
          action: () => {
            quests.kapitel2Finale.state = QUEST_STATE.DONE;
            gameFlags.lethkarUnlocked = true;
            navUnseen.lethkar = true;
            showToast('Lethkar ist jetzt auf der Weltkarte freigeschaltet!', TOAST.REWARD);
            quests.kapitel2Finale.state = QUEST_STATE.REWARDED;
            render();
          }
        }]
      }
    }
  },

  torben: {
    name: 'Torben, Gildenvorsteher', icon: '🏅',
    tagline: 'Er hat jeden kommen und gehen sehen. Nicht jeder bleibt.',
    availability: 'always', availabilityText: 'Er wartet.',
    locked: () => quests.gildaAufstieg?.state === QUEST_STATE.UNSTARTED,
    start: () => {
      if (quests.gildaAufstieg?.state === QUEST_STATE.ACTIVE) return 'willkommen';
      if (quests.gildaAufstieg?.state === QUEST_STATE.REWARDED) return 'idle';
      return 'willkommen';
    },
    nodes: {
      willkommen: {
        text: [
          'Ein älterer Mann mit ruhigen Augen und einem grünen Gilden-Abzeichen auf dem Revers steht auf, als ich eintrete.',
          '"Du bist es, von dem Brakka gesprochen hat." Nicht ganz ein Lächeln. Aber fast.',
          '"Ich bin Torben. Ich führe die Gilde in Treutheim seit zwanzig Jahren. Ich habe viele kommen und gehen sehen."',
          '"Ich höre, du bist jemand, der bleibt."'
        ],
        options: [{
          label: '"Ich versuche es."',
          next: 'aufnahme',
        }]
      },
      aufnahme: {
        text: [
          '"Gut genug." Er öffnet ein altes Buch und trägt etwas ein — meinen Namen, schätze ich.',
          '"Mit diesem Eintrag bist du Gildenmitglied. Kein Rang, kein Titel. Nur die Zugehörigkeit und was du daraus machst."',
          '"Die Welt ist größer als Treutheim. Wenn der Weg dich ruft — folg ihm. Das ist alles, was die Gilde von dir erwartet."',
          'Er reicht mir dreißig Gold. "Startkapital."'
        ],
        reward: () => '✨ <strong>+30 Gold</strong> · Gildenmitglied — dauerhaft',
        options: [{
          label: 'Danke, Torben.',
          next: null,
          action: () => {
            quests.gildaAufstieg.state = QUEST_STATE.REWARDED;
            resources.gold += 30; resources.totalGoldEarned += 30;
            checkMilestones();
            showToast('Gildenaufstieg abgeschlossen! +30 Gold. Gildenmitglied.', TOAST.REWARD);
          }
        }]
      },
      idle: {
        text: ['"Die Gilde ist stolz auf dich, Abenteurer. Geh und mach weiter so."'],
        options: [{ label: 'Danke.', next: null }]
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
  if (typeof NPCS_VELMARK !== 'undefined') {
    const velmarkNpc = NPCS_VELMARK.find(n => n.id === npcId);
    if (velmarkNpc) return velmarkNpc;
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
            if (opt.handled) return; // Aktion hat das Dialog-Lifecycle selbst übernommen
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
  const rewardRaw  = node.reward;
  const rewardText = typeof rewardRaw === 'function' ? rewardRaw() : rewardRaw;
  const rewardHtml = rewardText ? `<div class="dialog-reward">${rewardText}</div>` : null;
  showPaginatedDialog(npc.name, splitLongDialogPages(paragraphs), buttons, rewardHtml);
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
      if (quests.varenaErstkontakt?.state === QUEST_STATE.DONE) return 'varenaErstkontaktTurnIn';
      if (quests.varenaErstkontakt?.state === QUEST_STATE.UNSTARTED && alchemie.unlocked) return 'varenaQuestOffer';
      if (quests.alchemieGeselle?.state === QUEST_STATE.DONE) return 'alchemieGeselleTurnIn';
      if (quests.valdrisSpuren?.state === QUEST_STATE.ORT3 || quests.valdrisSpuren?.state === 'ort3') return 'valdrisSpurenDeuten';
      if (quests.kapitel3Abschluss?.state === QUEST_STATE.UNSTARTED && quests.perethKontakt?.state === QUEST_STATE.REWARDED) return 'abschiedVarena';
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
            label: '"Ich suche jemanden, der mir einen Brief entschlüsseln kann."',
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
        text: ['"Einen verschlüsselten Brief?" Sie sieht mich an. "Zeig ihn mir. Wenn es ein Treutheimer Chiffre ist, kenne ich ihn."'],
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
            showToast('Alchemie freigeschaltet! Das Laboratorium wartet auf mich.', TOAST.REWARD);
          }
        }]
      },
      varenaQuestOffer: {
        text: [
          'Varena wischt die Hände ab. "Du lernst schnell. Ich habe eine Aufgabe für dich, wenn du Interesse hast."',
          '"Im Wald nordwestlich wächst ein seltenes Wildkraut. Ich brauche fünf davon für meine Forschung. Bring sie mir."',
          '"Als Gegenleistung zeige ich dir, wie man etwas Wertvolles daraus macht."'
        ],
        options: [{
          label: '"Ich bringe sie dir."',
          next: null,
          action: () => {
            quests.varenaErstkontakt.state = QUEST_STATE.ACTIVE;
            showToast('Neue Quest: Varenas Erstauftrag — 5x Wildkraut sammeln.', TOAST.QUEST);
          }
        }, { label: '"Vielleicht später."', next: null }]
      },
      varenaErstkontaktTurnIn: {
        text: [
          'Varena sieht die Kräuter. Nickt zufrieden.',
          '"Gut. Diese hier sind frisch — du weißt, wie man sucht." Sie beginnt sofort mit der Verarbeitung.',
          '"Ich schulde dir etwas. Was möchtest du wissen?"'
        ],
        options: [{
          label: '"Lehr mich mehr über Alchemie."',
          next: 'varenaTeachBonus',
          action: () => {
            if ((questItems.wildkraut || 0) >= 5) {
              questItems.wildkraut = (questItems.wildkraut || 0) - 5;
              quests.varenaErstkontakt.state = QUEST_STATE.REWARDED;
              alchemie.speed = Math.max(alchemie.speed - 0.1, 0.5);
              showToast('Quest abgeschlossen! Alchemie-Geschwindigkeit +10%.', TOAST.REWARD);
            }
          }
        }]
      },
      varenaTeachBonus: {
        text: ['"Guter Instinkt." Sie zeigt mir einen Griff am Brennkolben. "Hier. Das spart Zeit."'],
        options: [{ label: 'Danke.', next: null }]
      },
      alchemieGeselleTurnIn: {
        text: [
          'Varena schaut auf meine Arbeit. Lange. Dann: "Du hast das wirklich verstanden."',
          '"Das ist mehr als die meisten Lehrlinge in einem Monat schaffen." Sie lächelt — selten für sie.',
          '"Jetzt bist du kein Schüler mehr. Ein Geselle. Nicht von mir ernannt — das hast du dir erarbeitet."',
          '"Nimm das hier. Selten. Nützlich." Sie reicht mir einen kleinen Beutel Essenzen.'
        ],
        options: [{
          label: 'Danke, Varena.',
          next: null,
          action: () => {
            quests.alchemieGeselle.state = QUEST_STATE.REWARDED;
            resources.gold = (resources.gold || 0) + 40;
            showToast('Quest abgeschlossen! Alchemie-Geselle: +40 Gold, Prestige-Bonus freigeschaltet.', TOAST.REWARD);
          }
        }]
      },
      valdrisSpurenDeuten: {
        text: [
          'Varena hört zu, während ich ihr erzähle, was ich gefunden habe.',
          '"Drei Orte, alle mit Valdris\' Handschrift." Sie kreuzt die Arme. "Das ist systematisch — kein Zufall."',
          '"Er baut ein Netzwerk auf. Wahrscheinlich Velmark als Basis. Du musst dahin." Sie zieht eine Karte hervor.',
          '"Aber nicht blind. Geh zu Thessa in der Taverne. Sie weiß Dinge, die ich nicht weiß."'
        ],
        options: [{
          label: '"Ich tue das."',
          next: null,
          action: () => {
            if (quests.valdrisSpuren?.state === QUEST_STATE.ORT3 || quests.valdrisSpuren?.state === 'ort3') {
              quests.valdrisSpuren.state = QUEST_STATE.REWARDED;
              valdrisProfil.aufenthaltsort = true;
              showToast('Valdris\' Spur führt nach Velmark. Thessa hat mehr Informationen.', TOAST.REWARD);
            }
          }
        }]
      },
      abschiedVarena: {
        text: [
          'Varena räumt still ihre Becher weg, als ich reinkomme.',
          '"Du gehst bald, oder?" Keine Frage — eine Feststellung.',
          '"Velmark ist die nächste Stufe. Für dich und für mich." Sie pause. "Ich schicke dir Informationen, wenn ich sie habe."',
          '"Du hast hier gut gelernt. Vergiss nicht: Alchemie ist Geduld — nicht Schnelligkeit."'
        ],
        options: [{
          label: '"Ich vergesse es nicht. Danke."',
          next: null,
          action: () => {
            if (quests.kapitel3Abschluss?.state === QUEST_STATE.UNSTARTED) {
              quests.kapitel3Abschluss.state = QUEST_STATE.ABSCHIED_VARENA;
              showToast('Varena hat mich verabschiedet. Ich sollte auch Thessa Lebewohl sagen.', TOAST.EVENT);
            }
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
      if (quests.kapitel3Abschluss?.state === QUEST_STATE.ABSCHIED_VARENA) return 'abschiedThessa';
      if (quests.thessaGeheimnis?.state === QUEST_STATE.TALK1) return 'talk2';
      if (quests.thessaGeheimnis?.state === QUEST_STATE.TALK2) return 'talk3';
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
                showToast('Thessa vertraut mir jetzt. Ihr Wissen über Lethkar steht mir offen.', TOAST.EVENT);
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
        options: [{
          label: 'Danke.',
          next: null,
          action: () => {
            if (quests.thessaGeheimnis?.state === QUEST_STATE.UNSTARTED)
              quests.thessaGeheimnis.state = QUEST_STATE.TALK1;
          }
        }]
      },
      talk2: {
        text: [
          'Thessa hebt kurz den Blick. "Du bist wieder hier." Eine Pause. "Gut."',
          '"Ich habe Valdris\' Namen in den letzten sechs Monaten dreimal gehört — von verschiedenen Leuten, alle in Eile. Das bedeutet etwas."',
          '"Komm morgen nochmals. Ich habe mehr."'
        ],
        options: [{
          label: '"Bis morgen."',
          next: null,
          action: () => {
            if (quests.thessaGeheimnis?.state === QUEST_STATE.TALK1)
              quests.thessaGeheimnis.state = QUEST_STATE.TALK2;
          }
        }]
      },
      talk3: {
        text: [
          'Thessa legt das Buch beiseite. Zum ersten Mal ohne Vorbehalt.',
          '"Valdris hat Velmark unterwandert — drei Fraktionen, alle zu einem Grad unter seiner Kontrolle. Er hat Yeva in der Händlergilde eingeschüchtert, aber sie kämpft noch."',
          '"Finde sie. Sag, dass Thessa dich geschickt hat. Und — pass auf dich auf."'
        ],
        options: [{
          label: '"Ich mache das."',
          next: null,
          action: () => {
            quests.thessaGeheimnis.state = QUEST_STATE.REWARDED;
            if (!gameFlags.thessaTrustGained) gameFlags.thessaTrustGained = true;
            showToast('Thessa vertraut mir. Yeva in Velmark — das ist mein nächster Schritt.', TOAST.REWARD);
          }
        }]
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
      },
      abschiedThessa: {
        text: [
          '"Du gehst." Keine Frage. Thessa klappt ihr Buch zu.',
          '"Velmark ist anders als Lethkar. Größer, lauter — und die Menschen dort haben gelernt, nichts zu zeigen."',
          '"Du hast hier etwas Wichtiges gelernt: Fragen sind Vertrauen. Und du hast meins verdient."',
          '"Viel Erfolg. Ich lese von dir — in irgendeinem Bericht, irgendwann."'
        ],
        options: [{
          label: '"Danke, Thessa. Wirklich."',
          next: null,
          action: () => {
            if (quests.kapitel3Abschluss?.state === QUEST_STATE.ABSCHIED_VARENA) {
              quests.kapitel3Abschluss.state = QUEST_STATE.REWARDED;
              gameFlags.velmarkUnlocked = true;
              navUnseen.velmark = true;
              showToast('Lethkar liegt hinter mir. Velmark ist jetzt auf der Weltkarte freigeschaltet!', TOAST.REWARD);
            }
          }
        }]
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
      if (quests.perethKontakt?.state === QUEST_STATE.ACTIVE && !gameFlags.perethKontaktLethkar) return 'perethKontaktOffer';
      if (quests.kapitel3Abschluss?.state === QUEST_STATE.UNSTARTED && gameFlags.thessaTrustGained) {
        if (quests.perethKontakt?.state === QUEST_STATE.UNSTARTED) quests.perethKontakt.state = QUEST_STATE.ACTIVE;
      }
      if (gameFlags.chapter3StoryComplete) return 'afterQuest';
      if (gameFlags.lagerhausVisited) return 'reportBack';
      if (gameFlags.perethQuestStarted) return 'questUpdate';
      return 'idle';
    },
    nodes: {
      firstMeet: {
        text: [
          'Der Mann am Tischende hat sein Bein auf dem Stuhl neben ihm. Als ob er weiß, dass ich komme.',
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
      perethKontaktOffer: {
        text: [
          'Pereth nickt, als er mich kommen sieht. "Du bist hartnäckig. Gut."',
          '"Ich war in Velmark. Ich weiß, wie es läuft. Wenn du ernst machst mit Valdris — dann ist Velmark der nächste Schritt."',
          '"Ich gehe nächste Woche. Du kommst mit, oder du kommst nach."'
        ],
        options: [{
          label: '"Ich komme nach. Velmark ist mein Ziel."',
          next: null,
          action: () => {
            quests.perethKontakt.state = QUEST_STATE.DONE;
            gameFlags.perethKontaktLethkar = true;
            showToast('Pereth erwartet dich in Velmark.', TOAST.EVENT);
          }
        }]
      },
      afterQuest: {
        text: [
          '"Weißt du, was das Interessante an Valdris ist?" Er dreht seinen Becher.',
          '"Er weiß, dass du hier bist. Wahrscheinlich schon seit du in Lethkar bist. Das ist jetzt der Stand der Dinge."',
          '"Jetzt weißt du es auch."'
        ],
        options: [
          { label: '"Ich hab\'s verstanden."', next: null },
          {
            label: '"Pereth — kannst du mir von Velmark erzählen?"',
            next: 'perethVelmarkHint',
            visible: () => quests.perethKontakt?.state === QUEST_STATE.UNSTARTED
          }
        ]
      },
      perethVelmarkHint: {
        text: [
          '"Velmark." Er pfeift kurz. "Küstenstadt, drei rivalisierende Fraktionen, ein Mann der alle kontrolliert."',
          '"Valdris hat seine Basis dort aufgebaut — Händler, Söldner, ein Archiv. Alle arbeiten für ihn, die meisten ohne es zu wissen."',
          '"Willst du dahin? Dann brauchst du mich." Er schaut mich direkt an. "Ich bin nächste Woche weg. Sag mir jetzt Bescheid."'
        ],
        options: [{
          label: '"Ich will mit."',
          next: null,
          action: () => {
            quests.perethKontakt.state = QUEST_STATE.DONE;
            gameFlags.perethKontaktLethkar = true;
            showToast('Pereth erwartet dich in Velmark.', TOAST.EVENT);
          }
        }]
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

/* ══════════════════════════════════════════════════════════════
   VELMARK-NPCs (Kapitel 4)
   ══════════════════════════════════════════════════════════════ */

const NPCS_VELMARK = [
  {
    id: 'pereth_velmark',
    name: 'Pereth', icon: '🗡',
    tagline: 'Derselbe Pereth. Andere Stadt. Noch entspannter.',
    location: CONTENT.VELMARK,
    start: () => {
      if ((fraktionen?.haendlergilde||0) > 60 && (fraktionen?.bruderschaft||0) > 60 && (fraktionen?.archiv||0) > 60) return 'alleFraktionenStark';
      if ((fraktionen?.haendlergilde||0) > 50 || (fraktionen?.bruderschaft||0) > 50 || (fraktionen?.archiv||0) > 50) return 'rufMehr50';
      if (!gameFlags.perethFoundInVelmark) return 'firstMeet';
      return 'idle';
    },
    nodes: {
      firstMeet: {
        text: [
          '"Du?" Pereth hebt eine Augenbraue — das erste Mal, dass er wirklich überrascht wirkt.',
          '"Velmark. Ich hätte gedacht, du steckst noch in Lethkar, irgendwo zwischen Büchern und Alchemie-Qualm."',
          '"Sitz. Ich hab Informationen, die du brauchst — und ich brauche jemanden, dem ich vertraue."'
        ],
        options: [{
          label: '"Was weißt du über Valdris in Velmark?"',
          next: 'valdrisVelmark',
          action: () => {
            gameFlags.perethFoundInVelmark = true;
            maybeShowStoryDialog('4.3');
          }
        }]
      },
      valdrisVelmark: {
        text: [
          '"Er hat drei Stützen hier: die Händlergilde hält sein Geld sauber, die Bruderschaft schützt seine Leute, das Stadtarchiv vergraben seine Spuren."',
          '"Du brauchst alle drei auf deiner Seite, wenn du gegen ihn stehen willst. Einer reicht nicht. Zwei auch nicht."',
          '"Ich kann dir Türen öffnen. Aber du musst selbst durchgehen."'
        ],
        options: [
          { label: '"Wie komme ich an die Gilde?"', next: 'gildeTipp' },
          { label: '"Wie ist dein Informantennetz?"', next: 'netzwerkTipp' },
          { label: '"Danke. Ich fang an."', next: null }
        ]
      },
      gildeTipp: {
        text: [
          '"Die Gilde? Gold. Schlicht und einfach. Die reden mit jedem, der genug davon mitbringt."',
          '"Fünfhundert mindestens. Zeig ihnen, dass du kein Bettler bist, und die Tür öffnet sich."'
        ],
        options: [{ label: 'Verstanden.', next: null }]
      },
      netzwerkTipp: {
        text: [
          '"Das aufzubauen dauert. Aber jeder Kontakt bringt dich näher an Valdris ran."',
          '"Informanten reden — wenn du ihnen genug Einfluss gibst. Und der Einfluss wächst, wenn du seine Leute in der Unterwelt aufmischst."'
        ],
        options: [{
          label: '"Ich verstehe. Danke."',
          next: null,
          action: () => {
            if (!gameFlags.informantenNetzFreigeschaltet) {
              gameFlags.informantenNetzFreigeschaltet = true;
              informanten.count = 1;
              informanten.lastTick = Date.now();
              showToast('Informantennetz aufgebaut — ein erster Kontakt ist aktiv.', TOAST.EVENT);
              setupInformantenTick();
            }
          }
        }]
      },
      rufMehr50: {
        text: ['Pereths Mundwinkel bewegen sich kaum. "Dein Ruf in dieser Stadt wächst. Die Leute reden über dich."'],
        options: [
          { text: 'Was sagen sie?', label: 'Was sagen sie?', next: 'stadtGeruechte' },
          { text: 'Gut.', label: 'Gut.', next: null }
        ]
      },
      stadtGeruechte: {
        text: [
          '"Dass du methodisch vorgehst. Kein Söldner, kein Gaukler — sondern jemand mit einem Ziel. Das macht manche nervös."'
        ],
        options: [
          { label: 'Auch Valdris?', next: 'valdrisNervoes' },
          { label: 'Gut so.', next: null }
        ]
      },
      valdrisNervoes: {
        text: [
          '"Valdris ist nie nervös. Aber er beobachtet dich. Ich habe seine Leute gesehen."'
        ],
        options: [{ label: 'Dann muss ich schneller sein.', next: null }]
      },
      alleFraktionenStark: {
        text: [
          '"Drei Fraktionen — alle auf deiner Seite." Pereth lehnt sich zurück. "Ich hab sowas noch nicht gesehen."',
          '"Valdris wird das wissen."'
        ],
        options: [{ label: '"Dann ist es Zeit."', next: null }]
      },
      idle: {
        text: ['"Alles im Plan? Brauchst du noch etwas?"'],
        options: [
          { label: '"Alles gut. Danke."', next: null },
          { label: '"Was weißt du über die Fraktionen?"', next: 'gildeTipp' },
          { label: '"Das Informantennetz?"', next: 'netzwerkTipp' }
        ]
      }
    }
  },

  // ── Fraktions-NPCs ───────────────────────────────────────────
  {
    id: 'harro',
    name: 'Harro', icon: '😓',
    tagline: 'Schuldner. Weiß mehr, als er zugeben will.',
    location: CONTENT.VELMARK_HAFEN,
    start: () => {
      if (!gameFlags.harroMet) return 'firstMeet';
      if (quests.gildeSchulden?.state === QUEST_STATE.DONE) return 'schuldenHinweis';
      if (quests.gildeSchulden?.state === QUEST_STATE.REWARDED) return 'dankbar';
      return 'nervous';
    },
    nodes: {
      firstMeet: {
        text: [
          'Ein Mann um die vierzig lehnt gegen die Hafenmauer. Er zuckt zusammen, als er mich sieht.',
          '"Ich kenne dich nicht. Du kennst mich nicht. So bleibts am besten."',
          'Er dreht sich weg. Dann: "Außer... du hast Gold. Dann könnte ich etwas vergessen."'
        ],
        options: [{
          label: '"Was willst du vergessen?"',
          next: 'harroOffert',
          action: () => { gameFlags.harroMet = true; }
        }, { label: 'Nicht mein Problem.', next: null, action: () => { gameFlags.harroMet = true; } }]
      },
      harroOffert: {
        text: [
          '"Die Gilde — Yeva — ich schulde ihr. Viel." Er schluckt. "Und sie lässt mich dafür... Dienste erbringen."',
          '"Ihr wisst. Beobachten. Berichten. Was ich sehe am Hafen." Er schaut sich um. "Wenn jemand meine Schulden übernimmt — ich rede. Über Valdris. Über das, was ich gesehen habe."'
        ],
        options: [
          { label: '"Ich übernehme deine Schulden."', next: 'schuldenUebernehmen',
            locked: () => (resources.gold || 0) < 300,
            reason: 'Erfordert 300 Gold',
            action: () => {
              if ((resources.gold || 0) >= 300) {
                resources.gold -= 300;
                quests.gildeSchulden.state = QUEST_STATE.ACTIVE;
                gameFlags.harroSchuldenBezahlt = true;
                showToast('Harrос Schulden übernommen (−300 Gold). Yeva erwartet mich.', TOAST.EVENT);
              }
            }
          },
          { label: '"Zu teuer. Vielleicht später."', next: null }
        ]
      },
      schuldenUebernehmen: {
        text: [
          'Harro atmet aus. Langsam. Erleichtert.',
          '"Valdris\' Lager. Nordufer. Nach Mitternacht kommen Boote." Er drückt mir einen gefalteten Zettel in die Hand.',
          '"Das ist alles, was ich habe. Jetzt bin ich quitt."'
        ],
        options: [{
          label: 'Danke.',
          next: null,
          action: () => {
            valdrisProfil.netzwerk = true;
            if (quests.gildeSchulden?.state === QUEST_STATE.ACTIVE)
              quests.gildeSchulden.state = QUEST_STATE.DONE;
          }
        }]
      },
      schuldenHinweis: {
        text: ['"Yeva musst du noch aufsuchen. Die übernimmt gerne — wenn du ihr mehr bringst als Gold."'],
        options: [{ label: 'Ich weiß.', next: null }]
      },
      dankbar: {
        text: ['"Ich... danke. Ernsthaft. Du hast mir das hier erspart." Er zeigt auf die Hafenmauer hinter ihm. "Vergiss mich. Das meine ich freundlich."'],
        options: [{ label: 'Kein Problem.', next: null }]
      },
      nervous: {
        text: ['"Ich hab nichts mehr zu sagen." Er weicht aus. "Nicht heute."'],
        options: [{ label: 'In Ordnung.', next: null }]
      }
    }
  },

  {
    id: 'gildenmeisterin',
    name: 'Gildenmeisterin Yeva', icon: '💰',
    tagline: 'Sie kauft und verkauft Allianzen wie andere Leute Gemüse.',
    location: CONTENT.VELMARK_FRAKTIONEN,
    start: () => {
      if (!gameFlags.yevaMetFirst) return 'greet';
      if (gameFlags.harroSchuldenBezahlt && quests.gildeSchulden?.state === QUEST_STATE.DONE) return 'schuldenTurnIn';
      if (quests.gildeInvestition?.state === QUEST_STATE.DONE) return 'investitionTurnIn';
      if (quests.gildeKorruption?.state === QUEST_STATE.AKTIV) return 'korruptionDialog';
      if (quests.gildeKorruption?.state === QUEST_STATE.DONE) return 'korruptionTurnIn';
      if (quests.gildeInvestition?.state === QUEST_STATE.UNSTARTED && quests.gildeSchulden?.state === QUEST_STATE.REWARDED) return 'investitionOffer';
      if (gameFlags.thessaTrustGained) return 'thessaEmpfehlung';
      return 'idle';
    },
    nodes: {
      greet: {
        text: [
          '"Ein neues Gesicht." Sie legt die Feder hin. "Thessa hat mich vorgewarnt — das ist gut. Unkündigte Besucher stören."',
          '"Du suchst Valdris. Ich weiß, was er tut." Sie verschränkt die Arme. "Die Frage ist: was bietest du der Gilde?"'
        ],
        options: [
          { label: '"Arbeit. Loyalität. Ergebnisse."', next: 'erstesBedingung',
            action: () => {
              gameFlags.yevaMetFirst = true;
              if (quests.gildeSchulden?.state === QUEST_STATE.UNSTARTED) quests.gildeSchulden.state = QUEST_STATE.ACTIVE;
            }
          },
          { label: '"Ich komme wieder, wenn ich bereit bin."', next: null, action: () => { gameFlags.yevaMetFirst = true; } }
        ]
      },
      erstesBedingung: {
        text: [
          '"Harro schuldet uns Geld. Er sitzt am Hafen und tut so, als wäre er unsichtbar." Sie lächelt dünn.',
          '"Bring das in Ordnung — wie du willst — und wir reden weiter."'
        ],
        options: [{ label: '"Ich kümmere mich darum."', next: null }]
      },
      thessaEmpfehlung: {
        text: [
          '"Thessa empfiehlt dich. Das ist kein kleines Ding." Yeva steht auf, schaut aus dem Fenster.',
          '"Ich habe ein Problem: Jemand schuldet der Gilde Geld. Er weigert sich zu zahlen. Du kannst helfen?"'
        ],
        options: [{
          label: '"Wer ist es?"',
          next: 'harroHinweis',
          action: () => {
            gameFlags.yevaMetFirst = true;
            if (quests.gildeSchulden?.state === QUEST_STATE.UNSTARTED) quests.gildeSchulden.state = QUEST_STATE.ACTIVE;
          }
        }]
      },
      harroHinweis: {
        text: ['"Harro. Am Hafen. Er wird reden — er redet immer, wenn es sich lohnt."'],
        options: [{ label: 'Ich finde ihn.', next: null }]
      },
      schuldenTurnIn: {
        text: [
          '"Harro." Ein kurzes Nicken. "Du hast das schnell geregelt." Sie schiebt einen Beutel über den Tisch.',
          '"Hier — deine Provision. Und mein Vertrauen. Das ist mehr wert als das Gold."'
        ],
        options: [{
          label: '"Danke, Yeva."',
          next: null,
          action: () => {
            resources.gold = (resources.gold || 0) + 150;
            fraktionen.haendlergilde = Math.min(100, (fraktionen.haendlergilde || 0) + 20);
            quests.gildeSchulden.state = QUEST_STATE.REWARDED;
            showToast('Quest abgeschlossen! +150 Gold, Händlergilde +20 Ruf.', TOAST.REWARD);
          }
        }]
      },
      investitionOffer: {
        text: [
          '"Du hast Potential. Ich will es testen." Yeva öffnet ein Konto-Buch.',
          '"Investier 500 Gold in die Gilde. Ich vervielfache es — und gleichzeitig sehen wir, ob du uns wirklich traust."',
          '"Rendite: sechzig Prozent nach einer Woche Arbeit. Für dich und für uns."'
        ],
        options: [{
          label: '"Deal."',
          next: null,
          locked: () => (resources.gold || 0) < 500,
          reason: 'Erfordert 500 Gold',
          action: () => {
            if ((resources.gold || 0) >= 500) {
              resources.gold -= 500;
              quests.gildeInvestition.state = QUEST_STATE.ACTIVE;
              showToast('500 Gold investiert. Yeva erwartet Ergebnisse.', TOAST.EVENT);
            }
          }
        }, { label: '"Noch nicht bereit."', next: null }]
      },
      investitionTurnIn: {
        text: [
          '"Du hast gearbeitet. Das Ergebnis spricht für sich." Yeva legt einen schweren Beutel auf den Tisch.',
          '"Achthundert. Sechzig Prozent Rendite — wie vereinbart." Sie lehnt sich zurück. "Ich habe noch eine Aufgabe."'
        ],
        options: [{
          label: '"Ich höre."',
          next: 'korruptionIntro',
          action: () => {
            resources.gold = (resources.gold || 0) + 800;
            fraktionen.haendlergilde = Math.min(100, (fraktionen.haendlergilde || 0) + 15);
            quests.gildeInvestition.state = QUEST_STATE.REWARDED;
            showToast('Quest abgeschlossen! +800 Gold, Händlergilde +15 Ruf.', TOAST.REWARD);
          }
        }]
      },
      korruptionIntro: {
        text: [
          '"Valdris hat einen unserer Buchhalter bestochen. Er hat Zugang zu unseren Konten."',
          '"Ich brauche Beweis dafür — etwas, das ich vor dem Stadtrat vorzeigen kann. Damit er fliegt, ohne dass ich die Schuld trage."',
          '"Das Stadtarchiv hat Unterlagen. Sele kann dir helfen — wenn du ihr gibst, was sie will."'
        ],
        options: [{
          label: '"Ich beschaffe dir den Beweis."',
          next: null,
          action: () => { quests.gildeKorruption.state = QUEST_STATE.AKTIV; }
        }]
      },
      korruptionDialog: {
        text: ['"Du hast noch nicht alles. Das Archiv, Sele — hast du sie schon aufgesucht?"'],
        options: [{ label: '"Ich bin daran."', next: null }]
      },
      korruptionTurnIn: {
        text: [
          'Yeva schaut die Dokumente durch. Einmal. Zweimal.',
          '"Das reicht." Sie klappt den Ordner zu. "Du hast getan, worum ich gebeten habe. Mehr als das."',
          '"Die Händlergilde steht hinter dir. Vollständig." Sie streckt die Hand aus.'
        ],
        options: [{
          label: 'Ich schlage ein.',
          next: null,
          action: () => {
            fraktionen.haendlergilde = Math.min(100, (fraktionen.haendlergilde || 0) + 25);
            quests.gildeKorruption.state = QUEST_STATE.REWARDED;
            gameFlags.valdrisDokumentGefunden = true;
            showToast('Händlergilde vollständig verbündet! Valdris-Dokument gesichert.', TOAST.REWARD);
          }
        }]
      },
      idle: {
        text: ['"Was gibt es?"'],
        options: [
          { label: '"Wie läuft es mit der Gilde?"', next: 'gildeStatus' },
          { label: '"Nichts. Nur vorbeigeschaut."', next: null }
        ]
      },
      gildeStatus: {
        text: ['"Valdris bremst uns. Solange er operiert, verlieren wir täglich. Deswegen bin ich froh, dass du hier bist."'],
        options: [{ label: 'Ich arbeite daran.', next: null }]
      }
    }
  },

  {
    id: 'hauptmann_gorr',
    name: 'Hauptmann Gorr', icon: '⚔',
    tagline: 'Eiserne Faust, wenig Geduld, kein Interesse an Erklärungen.',
    location: CONTENT.VELMARK_FRAKTIONEN,
    start: () => {
      if (!gameFlags.gorrMet) return 'greet';
      if (quests.gorrsVergangenheit?.state === QUEST_STATE.DONE) return 'vergangenheitTurnIn';
      if (quests.gorrsEid?.state === QUEST_STATE.DONE) return 'eidTurnIn';
      if (quests.bruderschaftBeweis?.state === QUEST_STATE.DONE) return 'beweisAnnehmen';
      if (quests.bruderschaftBeweis?.state === QUEST_STATE.UNSTARTED) return 'beweisOffer';
      return 'kampfIdle';
    },
    nodes: {
      greet: {
        text: [
          'Er dreht sich um. Kein Lächeln. "Du willst zur Bruderschaft."',
          '"Dann zeig mir, dass du kämpfen kannst. Reden reicht mir nicht."'
        ],
        options: [{
          label: '"Ich habe mich genug bewiesen."',
          next: 'mutCheck',
          action: () => { gameFlags.gorrMet = true; }
        }, { label: '"Später."', next: null, action: () => { gameFlags.gorrMet = true; } }]
      },
      mutCheck: {
        text: ['"Treutheim, Lethkar — ich kenne die Berichte. Waldtroll. Valdris\' Lager. Das reicht als Referenz."',
          '"Bring mir etwas, das ich dem Rat vorzeigen kann. Einen Beweis, dass du handeln kannst — nicht nur reden."'],
        options: [{
          label: '"Was für ein Beweis?"',
          next: null,
          action: () => {
            if (quests.bruderschaftBeweis?.state === QUEST_STATE.UNSTARTED)
              quests.bruderschaftBeweis.state = QUEST_STATE.ACTIVE;
          }
        }]
      },
      beweisOffer: {
        text: ['"Ich brauche einen konkreten Beweis für deine Eignung. Besieg einen von Valdris\' Wächtern am Hafen — und komm zurück."'],
        options: [{ label: '"Ich mache das."', next: null }]
      },
      beweisAnnehmen: {
        text: [
          'Gorr schaut die Beute an. Schweigt. Dann nickt er.',
          '"Gut. Die Bruderschaft steht hinter dir. Was brauchst du?"'
        ],
        options: [{
          label: '"Deine Geschichte, Gorr. Woher kommst du wirklich?"',
          next: 'vergangenheitBegin',
          action: () => {
            fraktionen.bruderschaft = Math.min(100, (fraktionen.bruderschaft || 0) + 15);
            quests.bruderschaftBeweis.state = QUEST_STATE.REWARDED;
            quests.gorrsVergangenheit.state = QUEST_STATE.ACTIVE;
            showToast('Bruderschaft-Beitritt bestätigt! Gorrs Vergangenheit — eine neue Quest.', TOAST.REWARD);
          }
        }, { label: '"Danke. Dann arbeiten wir."', next: null,
          action: () => {
            fraktionen.bruderschaft = Math.min(100, (fraktionen.bruderschaft || 0) + 15);
            quests.bruderschaftBeweis.state = QUEST_STATE.REWARDED;
          }
        }]
      },
      vergangenheitBegin: {
        text: [
          'Gorr zieht einen Stuhl heran. Setzt sich — zum ersten Mal entspannt.',
          '"Ich war nicht immer hier. Vor zehn Jahren: Bruderschaft des Nordens. Wir schützten Karawanen." Er pause.',
          '"Dann kam Valdris. Kaufte unsere Leute. Einer nach dem anderen. Bis wir kaum noch wir waren."',
          '"Ich bin desertiert. Einer von dreien, die nicht verkauft wurden."'
        ],
        options: [{ label: '"Und die anderen beiden?"', next: 'vergangenheitBrüder' }]
      },
      vergangenheitBrüder: {
        text: [
          '"Einer ist tot. Der andere — ich weiß es nicht." Er schaut weg.',
          '"Das ist mein Grund, hier zu sein. Nicht Velmark. Valdris."',
          '"Komm morgen Nacht. Ich zeige dir das Netz, das er spannt."'
        ],
        options: [{
          label: '"Ich bin da."',
          next: null,
          action: () => {
            quests.gorrsVergangenheit.state = QUEST_STATE.DONE;
            valdrisProfil.herkunft = true;
          }
        }]
      },
      vergangenheitTurnIn: {
        text: [
          '"Du bist zurück." Gorr sieht mich nicht an — er starrt auf eine Karte. "Ich habe Valdris\' Routen markiert."',
          '"Aber ich brauche mehr als Informationen." Er dreht sich um. "Ich brauche deinen Eid."',
          '"Nicht für die Bruderschaft — für das hier." Er zeigt auf die Karte. "Schwör mir, dass du das bis zum Ende durchziehst."'
        ],
        options: [{
          label: '"Ich schwöre es."',
          next: 'eidGeleistet',
          action: () => {
            quests.gorrsVergangenheit.state = QUEST_STATE.REWARDED;
            quests.gorrsEid.state = QUEST_STATE.ACTIVE;
            fraktionen.bruderschaft = Math.min(100, (fraktionen.bruderschaft || 0) + 15);
          }
        }]
      },
      eidGeleistet: {
        text: ['"Dann sind wir Bruderschaft. Beide." Er streckt die Hand aus.'],
        options: [{
          label: 'Ich schlage ein.',
          next: null,
          action: () => {
            gameFlags.gorrsEidGeleistet = true;
            valdrisProfil.motive = true;
            showToast('Gorrs Eid geschworen. Die Bruderschaft steht fest hinter mir.', TOAST.EVENT);
          }
        }]
      },
      eidTurnIn: {
        text: [
          '"Du hast es durchgezogen." Gorr nickt. Einmal. Das ist viel für ihn.',
          '"Die Bruderschaft ist hinter dir. Vollständig. Kein Vorbehalt mehr."'
        ],
        options: [{
          label: '"Danke, Gorr."',
          next: null,
          action: () => {
            fraktionen.bruderschaft = Math.min(100, (fraktionen.bruderschaft || 0) + 25);
            quests.gorrsEid.state = QUEST_STATE.REWARDED;
            showToast('Quest abgeschlossen! Bruderschaft vollständig verbündet.', TOAST.REWARD);
          }
        }]
      },
      kampfIdle: {
        text: ['"Wie läuft es? Die Hafenwächter geben nach?"'],
        options: [
          { label: '"Ich arbeite daran."', next: null },
          { label: '"Fast."', next: null }
        ]
      }
    }
  },

  {
    id: 'archivarin_sele',
    name: 'Archivarin Sele', icon: '📜',
    tagline: 'Weiß alles. Sagt es nur, wenn es sich lohnt.',
    location: CONTENT.VELMARK_FRAKTIONEN,
    start: () => {
      if (!gameFlags.seleMet) return 'greet';
      if (quests.archivRecherche?.state === QUEST_STATE.DONE) return 'rechercheTurnIn';
      if (quests.seleWissen?.state === QUEST_STATE.DONE) return 'wisseTurnIn';
      if (quests.dasDokument?.state === QUEST_STATE.DONE) return 'dokumentTurnIn';
      if (quests.archivRecherche?.state === QUEST_STATE.UNSTARTED) return 'recherchOffer';
      return 'archivIdle';
    },
    nodes: {
      greet: {
        text: [
          '"Das Stadtarchiv ist kein Gasthaus." Sie sieht mich über ihre Akten hinweg an.',
          '"Aber du bist interessant. Jemand, der Valdris jagt und dabei Alchemie lernt — das klingt nach einem Buch, das ich lesen möchte."',
          '"Was bietest du mir?"'
        ],
        options: [{
          label: '"Zugang zu Informationen, die du noch nicht hast."',
          next: 'erstesAngebot',
          action: () => {
            gameFlags.seleMet = true;
            if (quests.archivRecherche?.state === QUEST_STATE.UNSTARTED) quests.archivRecherche.state = QUEST_STATE.ACTIVE;
          }
        }, { label: '"Ich komme wieder."', next: null, action: () => { gameFlags.seleMet = true; } }]
      },
      erstesAngebot: {
        text: [
          '"Interessant." Sie legt die Feder hin. "Ich mache dir ein Gegenangebot."',
          '"Hilf mir, das Archiv zu durchsuchen — wir haben Dokumente aus den letzten zwanzig Jahren, alle ungeordnet. Ich brauche jemanden mit frischem Blick."',
          '"Wenn du findest, was ich vermute — dann reden wir über Valdris."'
        ],
        options: [{ label: '"Ich fange an."', next: null }]
      },
      recherchOffer: {
        text: ['"Das Archiv wartet. Findest du die Zeit?"'],
        options: [{ label: '"Ich bin dabei."', next: null }]
      },
      rechercheTurnIn: {
        text: [
          '"Du hast mehr gefunden als erwartet." Sele blättert durch die Stapel.',
          '"Diese Buchführung — das ist Valdris\' Handschrift. Er hat das Archiv schon vor Jahren unterwandert."',
          '"Ich schulde dir das. Was willst du wissen?"'
        ],
        options: [{
          label: '"Alles über Valdris\' Kontakte."',
          next: 'wissensTransfer',
          action: () => {
            fraktionen.archiv = Math.min(100, (fraktionen.archiv || 0) + 15);
            quests.archivRecherche.state = QUEST_STATE.REWARDED;
            quests.seleWissen.state = QUEST_STATE.ACTIVE;
            showToast('Quest abgeschlossen! Archiv +15 Ruf. Seles Wissen — neue Quest.', TOAST.REWARD);
          }
        }]
      },
      wissensTransfer: {
        text: [
          '"Valdris hat vier Hauptkontakte in Velmark. Einen Buchhalter — bereits kompromittiert. Einen Söldnerführer. Einen Stadtratsmitglieder."',
          '"Und einen vierten — ich kenne seinen Namen nicht. Aber ich kenne seine Schrift." Sie reicht mir ein Blatt.',
          '"Das ist für dich. Aber ich brauche noch etwas: ein Dokument aus dem Keller. Gesperrt. Nur du kannst da rein, ohne Aufsehen zu erregen."'
        ],
        options: [{
          label: '"Ich beschaffe es."',
          next: null,
          action: () => {
            valdrisProfil.kontakte = true;
            quests.seleWissen.state = QUEST_STATE.DONE;
          }
        }]
      },
      wisseTurnIn: {
        text: ['"Das Dokument ist verschlossen." Eine Pause. "Du weißt, wie man das umgeht?"'],
        options: [{ label: '"Ich finde einen Weg."', next: null }]
      },
      dokumentTurnIn: {
        text: [
          'Sele öffnet das Dokument. Liest. Sieht mich an.',
          '"Das ist es." Ihre Stimme ist ruhiger als erwartet — zu ruhig. "Das ist der Beweis, den wir brauchen."',
          '"Valdris\' vollständige Operationsstruktur. Unterschriften, Kontostände, Namen." Sie klappt es zu.',
          '"Das Archiv steht hinter dir. Vollständig. Und ich persönlich schulde dir mehr als Dank."'
        ],
        options: [{
          label: '"Das ist genug."',
          next: null,
          action: () => {
            fraktionen.archiv = Math.min(100, (fraktionen.archiv || 0) + 25);
            quests.dasDokument.state = QUEST_STATE.REWARDED;
            valdrisProfil.schwaeche = true;
            showToast('Das Dokument gesichert! Archiv vollständig verbündet. Valdris\' Schwäche bekannt.', TOAST.REWARD);
          }
        }]
      },
      archivIdle: {
        text: ['"Was gibt es? Neue Informationen?"'],
        options: [
          { label: '"Noch nicht. Ich arbeite daran."', next: null },
          { label: '"Was weißt du über die Unterwelt?"', next: 'unterweltHinweis' }
        ]
      },
      unterweltHinweis: {
        text: ['"Die Unterwelt in Velmark ist kein Ort — es ist ein Netzwerk. Informanten, Händler, Schulden." Eine Pause.',
          '"Wenn du Einfluss aufbaust, reden sie mit dir. Nicht vorher."'],
        options: [{ label: 'Verstanden.', next: null }]
      }
    }
  }
];

/** Öffnet einen NPC-Dialog anhand einer NPC-Definition (statt ID-String).
 *  Ermöglicht Aufrufe direkt aus Aktions-Callbacks, die bereits die Def haben. */
function openNpcDialogWithDef(npc, nodeId) {
  openNpcDialog(npc.id, nodeId);
}

/** Öffnet einen Lethkar-NPC-Dialog (wrapper für openNpcDialog). */
function openLethkarNpcDialog(npcId) {
  const npc = NPCS_LETHKAR.find(n => n.id === npcId);
  if (!npc) return;
  const startNode = typeof npc.start === 'function' ? npc.start() : npc.start;
  openNpcDialogWithDef(npc, startNode);
}

/** Öffnet einen Velmark-NPC-Dialog (wrapper für openNpcDialog). */
function openVelmarkNpcDialog(npcId) {
  const npc = NPCS_VELMARK.find(n => n.id === npcId);
  if (!npc) return;
  const startNode = typeof npc.start === 'function' ? npc.start() : npc.start;
  openNpcDialogWithDef(npc, startNode);
}
