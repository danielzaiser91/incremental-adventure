/* ══════════════════════════════════════════════════════════════
   quests.js — Quest-Registry + Übersichtsseite
   Liest nur aus dem `quests`-State (state.js); Statusänderungen
   passieren bei den NPCs (npc.js) bzw. den Aktionen, die sie
   abschließen (z.B. nightWatch() in actions.js).
   ══════════════════════════════════════════════════════════════ */

'use strict';

const QUEST_DEFS = [
  {
    id:    'nightWatch',
    title: 'Nachtwache für Brakka',
    icon:  '🌙',
    descByState: {
      unstarted: 'Noch nicht begonnen. Vielleicht weiß jemand in der Taverne mehr über die Nachtwache.',
      active:    'Angenommen: Heute Nacht Wache vor dem Stadttor halten — dann zu Brakka zurückkehren.',
      done:      'Nachtwache gehalten! Erst zu Brakka in der Taverne zurückkehren, um zu berichten — vorher geht es nicht erneut.',
      rewarded:  'Abgeschlossen — Brakka hat sich bedankt. Ich kann von nun an jede Nacht als Stadtwache arbeiten.'
    }
  },
  {
    id:    'miraLetter',
    title: 'Ein Brief für Brakka',
    icon:  '✉',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Mira hat mir einen versiegelten Brief für Brakka mitgegeben. Ich sollte ihn in der Taverne abgeben.',
      delivered: 'Brief bei Brakka abgegeben. Ich sollte Mira davon berichten.',
      rewarded:  'Abgeschlossen — Mira weiß, dass der Brief angekommen ist.'
    }
  },
  {
    id:    'foremanRaise',
    title: 'Ein gutes Wort beim Vorarbeiter',
    icon:  '🍺',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Der Vorarbeiter hat mich heute Abend in die Taverne eingeladen.',
      rewarded:  'Abgeschlossen — mein Lohn ist dauerhaft gestiegen.'
    }
  },
  {
    id:    'kraemerinBusiness',
    title: 'Gretas Geschäftsidee',
    icon:  '🧺',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      invited:   'Greta hat mich in die Taverne eingeladen, um über eine Geschäftsidee zu reden.',
      active:    'Greta braucht je 5 Holz, Stein und Wildkraut vom Sammelplatz, um ihr Sortiment zu erweitern.',
      rewarded:  'Abgeschlossen — Greta verkauft jetzt Rohstoffe und neue Ausrüstung.'
    }
  },
  {
    id:    'guildRegistration',
    title: 'Der Weg zur Abenteurergilde',
    icon:  '⚔',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Brakka erklärt, was es für die Registrierung als Abenteurer braucht. Mit ihm sprechen, wenn ich bereit bin.',
      rewarded:  'Abgeschlossen — vorerst. Mehr dazu in einem zukünftigen Update.'
    }
  },
  {
    id:    'commanderTraining',
    title: 'Lehrgang beim Kommandanten',
    icon:  '🎖',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Kommandant Roswald hat mich in die Taverne eingeladen, um über die Nachtwache zu reden.',
      rewarded:  'Abgeschlossen — ich kann jetzt für die Nachtwache aufleveln (siehe Erfahrung).'
    }
  },
  {
    id:    'oswinsAuftrag',
    title: 'Oswins stiller Auftrag',
    icon:  '🍻',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Oswin will, dass ich Brakka etwas ausrichte — diskret. Brakka in der Taverne ansprechen.',
      done:      'Brakka hat nickt. Jetzt Oswin Bescheid geben.',
      rewarded:  'Abgeschlossen — Oswin schuldet mir was. Und Brakka kennt mich jetzt anders.'
    }
  },
  {
    id:    'erstesZuhause',
    title: 'Ein Dach über dem Kopf',
    icon:  '🏠',
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Dreimal auf der Straße zu schlafen zieht die Aufmerksamkeit der Katze auf mich. Aber ich brauche ein echtes Bett.',
      rewarded:  'Abgeschlossen — ein ordentlicher Schlafplatz ist mehr wert, als man denkt.'
    }
  },
  {
    id:    'theftInvestigation',
    title: 'Die Spur des Diebs',
    icon:  '🔍',
    descByState: {
      unstarted:      'Noch nicht begonnen.',
      active:         'Korbin erzählte von einer Serie von Raubüberfällen in Treutheim. Ich sollte das Jagdgebiet erkunden und die Augen offen halten.',
      investigating:  'Meine eigene Münze zwischen Räuber-Habe — das ist kein Zufall. Mit Mira reden.',
      mira_consulted: 'Mira hat mehr verraten, als sie wollte. Brakka soll den Täter kennen.',
      brakka_consulted: 'Brakka hat gesprochen: Der Mann in der Taverne ist der Voraussucher des Schattens. Stark genug werden, um ihn zu konfrontieren.',
      confronted:     'Die Konfrontation liegt hinter mir. Die Spur ist kälter als gedacht — und reicher.',
      rewarded:       'Abgeschlossen — ich kenne die Wahrheit hinter dem Raub. Was ich damit anfange, liegt bei mir.'
    }
  },
  // ── Kapitel 2 ─────────────────────────────────────────────
  {
    id:    'gildePruefung',
    title: 'Die Gildenprüfung',
    icon:  '⚔',
    chapter: 2,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    () => {
        const done = Math.min(killStats.total - (quests.gildePruefung.killsAtStart || 0), 5);
        return `Roswald will Taten sehen. Fünf Kämpfe in der Wildnis bestehen (${done}/5) und dann zu ihm zurückkehren.`;
      },
      done:      'Fünf Kämpfe bestanden. Zu Roswald in der Taverne zurückkehren.',
      rewarded:  'Abgeschlossen — das tiefere Jagdgebiet ist zugänglich. Und mein Ruf in der Gilde ist gefestigt.'
    }
  },
  {
    id:    'fremderGeheimnis',
    title: 'Der Fremde in der Ecke',
    icon:  '🎭',
    chapter: 2,
    descByState: {
      unstarted:      'Noch nicht begonnen.',
      curious:        'Dieser Mann sitzt jede Nacht in derselben Ecke. Dreimal habe ich ihn jetzt beobachtet. Ich will wissen, wer er ist.',
      asking_around:  'Mira könnte ihn kennen. Oswin mit Sicherheit. Ich frage beide.',
      identity_known: 'Ich weiß jetzt, wer er ist — oder zumindest, woher er kommt. Den Fremden ein letztes Mal ansprechen.',
      rewarded:       'Abgeschlossen — er ist kein gewöhnlicher Durchreisender. Sein Name ist in Lethkar bekannt.'
    }
  },
  {
    id:    'miraSuche',
    title: 'Miras Nachforschungen',
    icon:  '📜',
    chapter: 2,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Mira hat mir einen verschlüsselten Brief mitgegeben und gebeten, mich nach dem Namen "Valdris" umzuhören.',
      rewarded:  'Abgeschlossen — der Brief führt nach Lethkar. Was auch immer Valdris dort tut, Mira will es wissen.'
    }
  },
  {
    id:    'kampfRoutine',
    title: 'Roswalds Kampftraining',
    icon:  '🎖',
    chapter: 2,
    descByState: {
      unstarted:  'Noch nicht begonnen.',
      active:     'Roswald hat Potenzial in mir gesehen. Zweimal Stadtwache + fünf weitere Kämpfe beweisen es.',
      half_done:  'Stadtwache geleistet. Jetzt noch fünf Kämpfe.',
      rewarded:   'Abgeschlossen — dauerhaft robuster. Und Roswald sieht mich jetzt anders an.'
    }
  },
  {
    id:    'waldtrollJagd',
    title: 'Das Ungeheuer im Tiefjagd',
    icon:  '👹',
    chapter: 2,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Brakka hat Gerüchte gehört — ein schwerfälliges Wesen im tiefen Wald. Ich soll es finden.',
      done:      'Der Waldtroll liegt am Boden. Brakka Bericht erstatten.',
      rewarded:  'Abgeschlossen — das tiefe Jagdgebiet ist jetzt sicher. Brakka hat sich bedankt.'
    }
  },
  {
    id:    'gildaAufstieg',
    title: 'Der Gildenaufstieg',
    icon:  '🏅',
    chapter: 2,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Gildenvorsteher Torben erwartet mich in der Taverne. Der Diebstahl-Fall und die bewiesene Stärke haben sich herumgesprochen.',
      done:      'Torben hat mich offiziell aufgenommen. Das Kapitel schließt sich.',
      rewarded:  'Abgeschlossen — ich bin jetzt vollwertiges Gildenmitglied. Der Weg nach Norden liegt offen.'
    }
  },
  {
    id:    'brennenderMut',
    title: 'Drei Nächte, keine Ausreden',
    icon:  '🌙',
    chapter: 2,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    () => `Brakka hat mich herausgefordert: Drei Nächte Stadtwache ohne Unterbrechung. (${quests.brennenderMut?.count ?? 0}/3)`,
      rewarded:  'Abgeschlossen — Brakka vertraut mir jetzt anders. Und ich vertraue mir selbst.'
    }
  },
  {
    id:    'kapitel2Finale',
    title: 'Der nächste Schritt',
    icon:  '🧭',
    chapter: 2,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Der Fremde hat mich ein letztes Mal aufgesucht. Er kennt einen Namen — Lethkar — und will, dass ich gehe.',
      done:      'Er hat mir Koordinaten gegeben. Ich muss die Weltkarte öffnen.',
      rewarded:  'Abgeschlossen — Treutheim ist Vergangenheit. Der Weg nach Lethkar liegt vor mir.'
    }
  },
  // ── Kapitel 3 ─────────────────────────────────────────────
  {
    id:    'varenaErstkontakt',
    title: 'Varenas Bitte',
    icon:  '🌿',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Varena benötigt fünf Büschel Wildkraut für ihre Arbeit. In der Umgebung von Lethkar sammeln.',
      done:      'Fünf Büschel Wildkraut gesammelt. Zu Varena zurückkehren.',
      rewarded:  'Abgeschlossen — die Alchemie-Grundlagen sind gelernt. Varena zeigt mir mehr, wenn ich bereit bin.'
    }
  },
  {
    id:    'alchemieInitiierung',
    title: 'Der erste Aspekt',
    icon:  '⚗',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Varena will, dass ich einen Alchemie-Aspekt auf Stufe 5 bringe. Die Elemente reagieren auf meine Konzentration.',
      rewarded:  'Abgeschlossen — der erste Wissensdurst-Skill ist zugänglich. Ich begreife, was diese Kunst bedeutet.'
    }
  },
  {
    id:    'thessaGeheimnis',
    title: 'Thessas Schweigen',
    icon:  '🤫',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      talk1:     'Thessa hat etwas auf dem Herzen — das merkt man. Morgen wieder ansprechen.',
      talk2:     'Schon zwei Gespräche. Sie prüft mich noch. Ein letztes Gespräch sollte es klären.',
      rewarded:  'Abgeschlossen — Thessa hat mir verraten, was sie über Valdris weiß. Wenig, aber genug.'
    }
  },
  {
    id:    'tier2Boss',
    title: 'Die Meisterprüfung',
    icon:  '🐻‍❄️',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Varena nennt ihn den "Silberbären" — den Nordbär. Ein Tier, das kein gewöhnlicher Kämpfer besiegt. Es soll mein Maßstab werden.',
      rewarded:  'Abgeschlossen — der Nordbär liegt besiegt. Varena hat mir gesagt, was das bedeutet: Ich bin kein Anfänger mehr.'
    }
  },
  {
    id:    'wissensdurst10',
    title: 'Zehn Funken Erkenntnis',
    icon:  '✦',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    () => `Varena hat mich gebeten, zehn Wissensdurst-Punkte zu sammeln. (${einsicht?.totalEarned ?? 0}/10 ✦)`,
      rewarded:  'Abgeschlossen — der zweite Wissensdurst-Skill ist zugänglich. Varena ist beeindruckt.'
    }
  },
  {
    id:    'valdrisSpuren',
    title: 'Valdris\' Fußabdrücke',
    icon:  '🔎',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      ort1:      'Erster Hinweis in der Taverne. Noch zwei Orte zu untersuchen: Markt und Stadtrand.',
      ort2:      'Zweiter Hinweis am Markt. Noch ein Ort: der Stadtrand von Lethkar.',
      ort3:      'Alle drei Orte untersucht. Mit Varena sprechen — sie soll das einordnen.',
      rewarded:  'Abgeschlossen — Valdris\' Netzwerk ist real und aktiv. Die Spur führt nach Velmark.'
    }
  },
  {
    id:    'lethkarMarkt',
    title: 'Handel in der Kälte',
    icon:  '🏪',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    () => {
        const traded = quests.lethkarMarkt?.goldTraded || 0;
        return `Den Lethkar-Markt richtig nutzen — kaufen oder Ressourcen für mindestens 200 Gold verkaufen (${traded}/200 Gold).`;
      },
      rewarded:  'Abgeschlossen — die Händler kennen mich jetzt. Kleine Rabatte, aber doch.'
    }
  },
  {
    id:    'perethKontakt',
    title: 'Der Mann namens Pereth',
    icon:  '🕵',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Varena erwähnte einen Händler, der diskret arbeitet — Pereth. Er soll ab und zu in Lethkar auftauchen. Augen offen halten.',
      done:      'Pereth gefunden. Er weiß von Velmark und bietet an, mir den Weg zu zeigen.',
      rewarded:  'Abgeschlossen — Pereth ist mehr als ein Händler. Er wartet auf mich in Velmark.'
    }
  },
  {
    id:    'alchemieGeselle',
    title: 'Der Alchemie-Geselle',
    icon:  '🔬',
    chapter: 3,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Zehn Alchemie-Level gesamt — das ist Varenas Messlatte für einen Gesellen. Aspekte weitertreiben.',
      done:      'Zehn Level erreicht. Varena soll es wissen.',
      rewarded:  'Abgeschlossen — Varena nennt mich jetzt Geselle. Das Alchemie-Tempo steigt dauerhaft.'
    }
  },
  {
    id:    'kapitel3Abschluss',
    title: 'Abschied von Lethkar',
    icon:  '🌅',
    chapter: 3,
    descByState: {
      unstarted:       'Noch nicht begonnen.',
      abschied_varena: 'Varena verabschieden — sie verdient ein letztes Gespräch.',
      abschied_thessa: 'Thessa verabschieden. Dann ist der Weg nach Velmark frei.',
      rewarded:        'Abgeschlossen — Lethkar liegt hinter mir. Velmark wartet.'
    }
  },
  // ── Kapitel 4 ─────────────────────────────────────────────
  {
    id:    'gildeSchulden',
    title: 'Yeva\'s Schuldner',
    icon:  '💰',
    chapter: 4,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    () => `Yeva will, dass ich Harro zur Zahlung bewege. Drei Dienste in Velmark leisten, bevor er redet. (${quests.gildeSchulden?.wacheCount ?? 0}/3)`,
      done:      'Drei Dienste geleistet. Harro konfrontieren.',
      rewarded:  'Abgeschlossen — Harro hat bezahlt. Die Händlergilde respektiert mich jetzt.'
    }
  },
  {
    id:    'gildeInvestition',
    title: 'Yevas Handelsnetz',
    icon:  '📈',
    chapter: 4,
    descByState: {
      unstarted:  'Noch nicht begonnen.',
      active:     'Yeva schlägt eine Investition vor: 500 Gold in ihr Handelsnetz. Einen Spieltag warten.',
      invested:   'Investition getätigt. Warten, dass das Netz Früchte trägt.',
      waiting:    'Das Handelsnetz arbeitet. Morgen Yeva ansprechen, um die Rendite abzuholen.',
      rewarded:   'Abgeschlossen — 800 Gold zurück und ein dauerhafter Händlerbonus.'
    }
  },
  {
    id:    'gildeKorruption',
    title: 'Die unsauberen Hände',
    icon:  '🕵',
    chapter: 4,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Valdris hat einen Buchhalter bestochen. Beweis liegt beim Stadtarchiv — Sele um Hilfe bitten.',
      done:      'Das Dokument ist gesichert. Yeva aufsuchen und die Beweise übergeben.',
      rewarded:  'Abgeschlossen — die Händlergilde ist vollständig auf meiner Seite.'
    }
  },
  {
    id:    'bruderschaftBeweis',
    title: 'Der Beweis aus Blut',
    icon:  '⚔',
    chapter: 4,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    () => `Gorr will Taten sehen. Drei Tier-3-Gegner besiegen. (${quests.bruderschaftBeweis?.killCount ?? 0}/3)`,
      rewarded:  'Abgeschlossen — die Bruderschaft respektiert mich. Gorr spricht jetzt direkt mit mir.'
    }
  },
  {
    id:    'gorrsVergangenheit',
    title: 'Gorrs altes Leben',
    icon:  '🍺',
    chapter: 4,
    descByState: {
      unstarted:  'Noch nicht begonnen.',
      active:     'Gorr will abends reden — wenn die anderen weg sind. Bei Nacht wieder zu ihm.',
      night_talk: 'Gorr hat gesprochen. Er kannte Valdris früher. Etwas davon klären.',
      rewarded:   'Abgeschlossen — Gorrs Vergangenheit ist Valdris\' Schwachstelle. Das Profil wird klarer.'
    }
  },
  {
    id:    'gorrsEid',
    title: 'Gorrs Versprechen',
    icon:  '🤝',
    chapter: 4,
    descByState: {
      unstarted:  'Noch nicht begonnen.',
      active:     'Gorr fordert ein Duell — er muss sicher sein, dass ich Valdris gegenüber nicht einknicke. Der stärkste Söldner wartet.',
      duell_won:  'Duell gewonnen. Gorr leistet den Eid. Zurück zu ihm.',
      rewarded:   'Abgeschlossen — die Bruderschaft sperrt Velmarks Südtor ab. Valdris hat keinen Fluchtweg mehr.'
    }
  },
  {
    id:    'archivRecherche',
    title: 'Dokumente aus dem Staub',
    icon:  '📚',
    chapter: 4,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    () => `Sele braucht drei Hinweis-Dokumente. Das Archiv durchsuchen kostet Einfluss, gibt aber Erkenntnisse. (${quests.archivRecherche?.dokCount ?? 0}/3)`,
      dok1:      'Erstes Dokument gefunden.',
      dok2:      'Zweites Dokument gefunden.',
      dok3:      'Alle drei Dokumente. Sele Bericht erstatten.',
      rewarded:  'Abgeschlossen — Valdris\' Herkunft ist bekannt. Sele schaut mich anders an.'
    }
  },
  {
    id:    'seleWissen',
    title: 'Seles Prüfung',
    icon:  '🦋',
    chapter: 4,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    `Sele testet meine Alchemie-Kenntnisse. Einen Aspekt auf Stufe 15 bringen.`,
      rewarded:  'Abgeschlossen — Sele ist beeindruckt. Zwei weitere Wissensdurst-Skills sind zugänglich.'
    }
  },
  {
    id:    'dasDokument',
    title: 'Das letzte Dokument',
    icon:  '📄',
    chapter: 4,
    descByState: {
      unstarted:     'Noch nicht begonnen.',
      active:        'Sele hat das finale Dokument gefunden — Valdris\' Name und Aufenthaltsort. Sie braucht eine Nacht zum Übersetzen.',
      waiting_night: 'Sele übersetzt. Über Nacht warten, dann zu ihr zurückkehren.',
      rewarded:      'Abgeschlossen — das Valdris-Profil ist vollständig. Die Konfrontation ist möglich.'
    }
  },
  {
    id:    'dieKonfrontation',
    title: 'Die Konfrontation',
    icon:  '⚜',
    chapter: 4,
    descByState: {
      unstarted: 'Noch nicht begonnen.',
      active:    'Alle drei Fraktionen stehen hinter mir. Es ist Zeit, Valdris zu stellen.',
      step1:     'Valdris hat sich gestellt. Er redet.',
      step2:     'Sein letztes Wort liegt hinter mir. Die Entscheidung ist gefallen.',
      rewarded:  'Abgeschlossen — die Chroniken des vergessenen Weges sind vollständig.'
    }
  }
];

/* Questgegenstände — bewusst getrennt vom normalen Spielerinventar
   dargestellt (siehe inventory.js): sie zählen nicht gegen
   INVENTORY_SLOT_COUNT und verschwinden automatisch nach Quest-Abgabe. */
const QUEST_ITEMS = [
  {
    id: 'sealedLetter', name: 'Versiegelter Brief', icon: '✉',
    desc: 'Mira hat mir diesen Brief anvertraut — er ist für Brakka bestimmt, niemand sonst.'
  },
  {
    id: 'miras_brief', name: 'Miras verschlüsselter Brief', icon: '🔒',
    desc: () => gameFlags.mirasBriefDecoded
      ? 'Inhalt: Valdris. Ein Name. Und eine Adresse in Lethkar. Varena weiß mehr.'
      : 'Mira gab ihn mir, bevor ich Treutheim verließ. Verschlüsselt — ich verstehe ihn nicht. Irgendwo findet sich jemand, der das kann.'
  },
  {
    id: 'hundespur',     name: 'Hundespur',          icon: '🐾',
    desc: 'Eine Fell-Spur aus dem Tiefjagdgebiet — ein junger Hund folgt ihr. Greta wüsste, was damit anzufangen ist.'
  },
  {
    id: 'rabenfeder',    name: 'Rabenfeder',          icon: '🪶',
    desc: 'Eine ungewöhnlich große, glänzende Feder. Ein Rabe streift durch diese Gegend. Greta wüsste, was damit anzufangen ist.'
  },
  {
    id: 'hasenspur',     name: 'Hasenspur',           icon: '🌿',
    desc: 'Frische Spuren im Erdreich — ein flinker Hase, größer als üblich. Greta wüsste, was damit anzufangen ist.'
  },
  {
    id: 'eichhoernchennuss', name: 'Angebissene Nuss', icon: '🌰',
    desc: 'Frisch angeknabbert, eindeutig von einem Eichhörnchen. Das Tier ist noch in der Nähe. Greta wüsste, was damit anzufangen ist.'
  }
];

const QUEST_STATE_LABELS = {
  unstarted:        'Unbekannt',
  invited:          'Einladung erhalten',
  active:           'In Arbeit',
  investigating:    'Spur gefunden',
  mira_consulted:   'Mira befragt',
  brakka_consulted: 'Brakka befragt',
  confronted:       'Konfrontiert',
  delivered:        'Rückmeldung ausstehend',
  done:             'Bereit zur Abgabe',
  rewarded:         'Abgeschlossen',
  curious:          'Erste Beobachtungen',
  asking_around:    'Nachfragen',
  identity_known:   'Identität bekannt',
  half_done:        'Halbzeit',
  talk1:            'Erster Eindruck',
  talk2:            'Zweites Gespräch',
  abschied_varena:  'Abschied steht bevor',
  abschied_thessa:  'Fast fertig',
  invested:         'Investiert',
  waiting:          'Warten auf Ergebnis',
  waiting_night:    'Übersetzung läuft',
  hinweis1:         '1/3 Hinweise',
  hinweis2:         '2/3 Hinweise',
  dok1:             '1/3 Dokumente',
  dok2:             '2/3 Dokumente',
  dok3:             'Abgabe ausstehend',
  ort1:             'Ort 1/3 untersucht',
  ort2:             'Ort 2/3 untersucht',
  ort3:             'Alle Orte untersucht',
  night_talk:       'Gespräch im Dunkeln',
  duell_won:        'Duell gewonnen',
  step1:            'Valdris stellt sich',
  step2:            'Das letzte Wort',
};

/** Gibt den beschreibenden Text einer Quest zurück — unterstützt Funktionen. */
function getQuestDesc(q) {
  const state = quests[q.id]?.state;
  if (!state) return '';
  const raw = q.descByState[state];
  return typeof raw === 'function' ? raw() : (raw || '');
}

/** Rendert die Quest-Übersicht gruppiert nach Kapitel. */
function renderQuests(el) {
  const started = QUEST_DEFS.filter(q => quests[q.id] && quests[q.id].state !== 'unstarted');

  if (started.length === 0) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Aufgaben</div>
        <p class="chronik-empty">Noch keine Aufgaben erhalten.</p>
      </div>
    `;
    return;
  }

  const chapters = [
    { num: undefined, label: 'Treutheim', icon: '🏘' },
    { num: 2, label: 'Treutheim — Schatten & Gilde', icon: '⚔' },
    { num: 3, label: 'Lethkar', icon: '⚗' },
    { num: 4, label: 'Velmark', icon: '⚜' },
  ];

  let html = '';
  for (const ch of chapters) {
    const chQuests = started.filter(q => q.chapter === ch.num);
    if (chQuests.length === 0) continue;

    const cards = chQuests.map(q => {
      const state    = quests[q.id].state;
      const desc     = getQuestDesc(q);
      const isDone   = state === 'rewarded';
      const doneClass = isDone ? ' quest-card-done' : '';
      const label    = QUEST_STATE_LABELS[state] || state;
      return `
        <div class="action-card${doneClass}">
          <div class="action-card-icon">${q.icon}</div>
          <div class="action-card-name">${q.title}</div>
          <p class="action-card-desc">${desc}</p>
          <div class="quest-status quest-status-${state}">${label}</div>
        </div>`;
    }).join('');

    html += `
      <div class="feature-stage">
        <div class="feature-stage-label">${ch.icon} ${ch.label}</div>
        <div class="action-grid">${cards}</div>
      </div>`;
  }

  el.innerHTML = html || `<div class="feature-stage"><p class="chronik-empty">Keine aktiven Aufgaben.</p></div>`;
}

/** Prüft Quest-Trigger nach jeder Spieler-Aktion. Hier ausschließlich
    automatische Freischaltungen (kein manueller Spieler-Schritt nötig). */
function checkQuestTriggers() {
  // Kap 1: Erstes Zuhause — Aktivierung
  if (quests.erstesZuhause.state === 'unstarted' && streetCatProgress.sleepCount >= 3) {
    quests.erstesZuhause.state = 'active';
    showToast('Neue Aufgabe: Ein Dach über dem Kopf.', TOAST.EVENT);
  }
  // Kap 1: Erstes Zuhause — Abschluss (auch retroaktiv für alte Saves)
  if (quests.erstesZuhause.state === 'active' && meta.hasHome) {
    quests.erstesZuhause.state = 'rewarded';
    showToast('Quest abgeschlossen: Ein Dach über dem Kopf!', TOAST.REWARD);
  }
  // Kap 2: Gildeprüfung nach guildRegistration
  if (quests.gildePruefung.state === 'unstarted' && quests.guildRegistration.state === 'rewarded') {
    quests.gildePruefung.state = 'active';
    quests.gildePruefung.killsAtStart = killStats.total;
    showToast('Neue Aufgabe: Die Gildenprüfung — fünf Kämpfe für Roswald.', TOAST.EVENT);
  }
  // Kap 2: Gildeprüfung — Fallback falls Kills bereits erfüllt (ohne Monolog)
  if (quests.gildePruefung.state === 'active' &&
      killStats.total - (quests.gildePruefung.killsAtStart || 0) >= 5) {
    quests.gildePruefung.state = 'done';
    showToast('Gildenprüfung bestanden — zu Roswald zurückkehren.', TOAST.REWARD);
  }
  // Kap 2: Fremder-Geheimnis — nach 3 Gesprächen
  if (quests.fremderGeheimnis.state === 'unstarted' && npcFlags.fremderTalkCount >= 3 && gameFlags.kapitel2Unlocked) {
    quests.fremderGeheimnis.state = 'curious';
    showToast('Der Fremde in der Ecke — wer ist er wirklich?', TOAST.EVENT);
  }
  // Kap 2: Mira-Suche nach miraLetter rewarded
  if (quests.miraSuche.state === 'unstarted' && quests.miraLetter.state === 'rewarded') {
    quests.miraSuche.state = 'active';
    showToast('Neue Aufgabe: Mira braucht Hilfe bei ihrer Nachforschung.', TOAST.EVENT);
  }
  // Kap 2: kampfRoutine — Stadtwache-Bedingung prüfen
  if (quests.kampfRoutine.state === 'active' && stadtwacheStats.count >= 2) {
    quests.kampfRoutine.state = 'half_done';
  }
  if (quests.kampfRoutine.state === 'half_done' && killStats.total >= 5) {
    quests.kampfRoutine.state = 'done';
    showToast('Kampftraining abgeschlossen — zu Roswald zurückkehren.', TOAST.REWARD);
  }
  // Kap 2: Waldtroll-Quest nach gildePruefung + deepHuntingUnlocked
  if (quests.waldtrollJagd.state === 'unstarted' && quests.gildePruefung.state === 'rewarded' && gameFlags.deepHuntingUnlocked) {
    quests.waldtrollJagd.state = 'active';
    showToast('Neue Aufgabe: Das Ungeheuer im Tiefjagd.', TOAST.EVENT);
  }
  // Kap 2: Waldtroll besiegt
  if (quests.waldtrollJagd.state === 'active' && gameFlags.waldtrollKilled) {
    quests.waldtrollJagd.state = 'done';
    showToast('Waldtroll besiegt — Brakka Bericht erstatten.', TOAST.REWARD);
  }
  // Kap 2: GildaAufstieg nach theftInvestigation
  if (quests.gildaAufstieg.state === 'unstarted' && quests.theftInvestigation.state === 'rewarded') {
    quests.gildaAufstieg.state = 'active';
    showToast('Neue Aufgabe: Der Gildenaufstieg — Torben in der Taverne.', TOAST.EVENT);
  }
  // Kap 2: Kapitel-2-Finale
  if (quests.kapitel2Finale.state === 'unstarted' &&
      quests.gildaAufstieg.state === 'rewarded' &&
      quests.waldtrollJagd.state === 'rewarded') {
    quests.kapitel2Finale.state = 'active';
    gameFlags.kapitel2FinaleStarted = true;
    showToast('Neue Aufgabe: Der nächste Schritt — der Fremde hat etwas zu sagen.', TOAST.EVENT);
  }
  // Kap 3: alchemieInitiierung
  if (quests.alchemieInitiierung.state === 'unstarted' && quests.varenaErstkontakt.state === 'rewarded') {
    quests.alchemieInitiierung.state = 'active';
    showToast('Neue Aufgabe: Der erste Aspekt — Alchemie auf Stufe 5 bringen.', TOAST.EVENT);
  }
  // Kap 3: alchemieInitiierung abgeschlossen
  if (quests.alchemieInitiierung.state === 'active') {
    const maxLevel = Math.max(...Object.values(alchemie.levels));
    if (maxLevel >= 5) {
      quests.alchemieInitiierung.state = 'rewarded';
      showToast('Erster Aspekt gemeistert! Wissensdurst-Fähigkeit freigeschaltet.', TOAST.REWARD);
      if (!wissensdurstSkills.forschungsinstinkt) {
        wissensdurstSkills.forschungsinstinkt = true;
      }
    }
  }
  // Kap 3: wissensdurst10
  if (quests.wissensdurst10.state === 'unstarted' && einsicht.totalEarned >= 5 && gameFlags.lethkarUnlocked) {
    quests.wissensdurst10.state = 'active';
    showToast('Neue Aufgabe: Zehn Funken Erkenntnis sammeln.', TOAST.EVENT);
  }
  if (quests.wissensdurst10.state === 'active' && einsicht.totalEarned >= 10) {
    quests.wissensdurst10.state = 'rewarded';
    showToast('Zehn Wissensdurst ✦ erreicht!', TOAST.REWARD);
    if (!wissensdurstSkills.wissensspeicher) wissensdurstSkills.wissensspeicher = true;
  }
  // Kap 3: tier2Boss
  if (quests.tier2Boss.state === 'unstarted' && gameFlags.lethkarUnlocked && quests.varenaErstkontakt.state === 'rewarded') {
    quests.tier2Boss.state = 'active';
  }
  if (quests.tier2Boss.state === 'active' && gameFlags.firstTier2Kill) {
    quests.tier2Boss.state = 'rewarded';
    showToast('Meisterprüfung bestanden! +3 Mut, doppelte Tier-2-Drops.', TOAST.REWARD);
    mut.points += 3; mut.totalEarned += 3;
  }
  // Kap 3: lethkarMarkt
  if (quests.lethkarMarkt.state === 'unstarted' && gameFlags.lethkarUnlocked) {
    quests.lethkarMarkt.state = 'active';
  }
  if (quests.lethkarMarkt.state === 'active' && (quests.lethkarMarkt.goldTraded || 0) >= 200) {
    quests.lethkarMarkt.state = 'done';
    showToast('Lethkarer Handel gemeistert — Varena aufsuchen.', TOAST.REWARD);
  }
  if (quests.lethkarMarkt.state === 'done') {
    quests.lethkarMarkt.state = 'rewarded';
    resources.gold = (resources.gold || 0) + 30;
    gameFlags.lethkarHaendlerRabatt = true;
  }
  // Kap 3: valdrisSpuren freigeschaltet nach thessaGeheimnis
  if (quests.valdrisSpuren.state === 'unstarted' && quests.thessaGeheimnis?.state === 'rewarded') {
    quests.valdrisSpuren.state = 'ort1';
    gameFlags.valdrisSpurenGefunden = true;
    showToast('Neue Aufgabe: Valdris\' Spuren in Lethkar — drei Orte untersuchen.', TOAST.EVENT);
  }
  // Kap 3: alchemieGeselle
  if (quests.alchemieGeselle.state === 'unstarted' && alchemie.unlocked) {
    const totalLevels = Object.values(alchemie.levels).reduce((s, v) => s + v, 0);
    if (totalLevels >= 10) quests.alchemieGeselle.state = 'active';
  }
  if (quests.alchemieGeselle.state === 'active') {
    const totalLevels = Object.values(alchemie.levels).reduce((s, v) => s + v, 0);
    if (totalLevels >= 10) quests.alchemieGeselle.state = 'done';
  }
  // Kap 3: perethKontakt done → rewarded (NPC hat Belohnung gegeben)
  if (quests.perethKontakt.state === 'done' && gameFlags.perethKontaktLethkar) {
    quests.perethKontakt.state = 'rewarded';
  }
  // Kap 3: alchemieGeselle rewarded → Story-Flag setzen
  if (quests.alchemieGeselle.state === 'rewarded' && !gameFlags.alchemieGeselleReached) {
    gameFlags.alchemieGeselleReached = true;
    gameFlags.varenaRevealedValdrisIdent = true;
    maybeShowStoryDialog('3.9');
  }
  // Kap 3: valdrisSpuren rewarded → Story-Flag
  if (quests.valdrisSpuren?.state === 'rewarded' && !gameFlags.valdrisOperationRaided) {
    gameFlags.valdrisOperationRaided = true;
    maybeShowStoryDialog('3.7');
  }
  // Kap 3: kapitel3Abschluss
  if (quests.kapitel3Abschluss.state === 'unstarted' &&
      quests.perethKontakt.state === 'rewarded' &&
      quests.alchemieGeselle.state === 'rewarded' &&
      quests.valdrisSpuren?.state === 'rewarded') {
    quests.kapitel3Abschluss.state = 'abschied_varena';
    showToast('Neue Aufgabe: Abschied von Lethkar nehmen.', TOAST.EVENT);
  }
  // Kap 3: kapitel3Abschluss rewarded → kap3Complete
  if (quests.kapitel3Abschluss.state === 'rewarded' && !gameFlags.kap3Complete) {
    gameFlags.kap3Complete = true;
    maybeShowStoryDialog('3.10');
  }
  // Kap 4: gildeSchulden starten (durch Yeva-Kontakt oder harroSchuldenBezahlt)
  if (quests.gildeSchulden.state === 'unstarted' && (gameFlags.yevaMetFirst || gameFlags.gildekontaktGeknuepft)) {
    quests.gildeSchulden.state = 'active';
    gameFlags.velmarkStadtwacheUnlocked = true;
    if (!gameFlags.hafenarbeitUnlocked) gameFlags.hafenarbeitUnlocked = true;
    showToast('Neue Aufgabe: Yeva\'s Schuldner — Harro am Hafen aufsuchen.', TOAST.EVENT);
  }
  // Kap 4: bruderschaftBeweis
  if (quests.bruderschaftBeweis.state === 'unstarted' && (gameFlags.bruderschaftkontaktGeknuepft || gameFlags.gorrMet)) {
    quests.bruderschaftBeweis.state = 'active';
    showToast('Neue Aufgabe: Gorr will Taten sehen — einen Hafenwächter besiegen.', TOAST.EVENT);
  }
  // Kap 4: bruderschaftBeweis — Tier-3-Kill
  if (quests.bruderschaftBeweis.state === 'active' && gameFlags.firstTier3Kill) {
    quests.bruderschaftBeweis.state = 'done';
    showToast('Beweise erbracht — zu Gorr zurückkehren.', TOAST.REWARD);
  }
  // Kap 4: archivRecherche starten
  if (quests.archivRecherche.state === 'unstarted' && (gameFlags.archivkontaktGeknuepft || gameFlags.seleMet)) {
    quests.archivRecherche.state = 'active';
    gameFlags.archivDurchsuchenUnlocked = true;
    showToast('Neue Aufgabe: Dokumente aus dem Staub — Archiv durchsuchen (3x).', TOAST.EVENT);
  }
  // Kap 4: archivRecherche 3 Einträge
  if (quests.archivRecherche.state === 'active' && (quests.archivRecherche.count || 0) >= 3) {
    quests.archivRecherche.state = 'done';
    showToast('Alle drei Dokumente gefunden — Sele Bericht erstatten.', TOAST.REWARD);
  }
  // Kap 4: seleWissen — nach archivRecherche rewarded
  if (quests.seleWissen.state === 'unstarted' && quests.archivRecherche.state === 'rewarded') {
    quests.seleWissen.state = 'active';
    showToast('Neue Aufgabe: Seles Wissen — valdris\' Kontakte aufdecken.', TOAST.EVENT);
  }
  // Kap 4: dasDokument nach seleWissen
  if (quests.dasDokument.state === 'unstarted' && quests.seleWissen.state === 'rewarded') {
    quests.dasDokument.state = 'active';
    showToast('Neue Aufgabe: Das Dokument — das letzte Beweismittel sichern.', TOAST.EVENT);
  }
  // Kap 4: dieKonfrontation — alle Fraktionen ≥ 80
  if (quests.dieKonfrontation.state === 'unstarted' &&
      (fraktionen?.haendlergilde ?? 0) >= 80 &&
      (fraktionen?.bruderschaft  ?? 0) >= 80 &&
      (fraktionen?.archiv        ?? 0) >= 80) {
    gameFlags.allianzKomplett = true;
    quests.dieKonfrontation.state = 'active';
    showToast('Alle Fraktionen vereint. Die Konfrontation ist möglich.', TOAST.EVENT);
  }
  // Kap 4: gorrsEid nach gorrsVergangenheit rewarded + bruderschaft >= 60
  if (quests.gorrsEid.state === 'unstarted' &&
      quests.gorrsVergangenheit.state === 'rewarded' &&
      (fraktionen?.bruderschaft ?? 0) >= 60) {
    quests.gorrsEid.state = 'active';
    showToast('Neue Aufgabe: Gorrs Versprechen — das Duell annehmen.', TOAST.EVENT);
  }
  // Kap 4: gildeInvestition nach gildeSchulden rewarded
  if (quests.gildeInvestition.state === 'unstarted' && quests.gildeSchulden.state === 'rewarded') {
    quests.gildeInvestition.state = 'active';
    showToast('Neue Aufgabe: Yevas Handelsnetz — 500 Gold investieren.', TOAST.EVENT);
  }
  // Kap 4: gildeInvestition Wartezeit prüfen
  if (quests.gildeInvestition.state === 'waiting') {
    if (gameClock.day > quests.gildeInvestition.investDay) {
      quests.gildeInvestition.state = 'done';
      showToast('Das Handelsnetz hat Früchte getragen — zu Yeva.', TOAST.REWARD);
    }
  }
  // Kap 4: gildeKorruption nach gildeInvestition rewarded
  if (quests.gildeKorruption.state === 'unstarted' && quests.gildeInvestition.state === 'rewarded') {
    quests.gildeKorruption.state = QUEST_STATE.ACTIVE;
    showToast('Neue Aufgabe: Valdris hat einen Buchhalter bestochen — Beweis beschaffen.', TOAST.EVENT);
  }
  // Kap 4: gildeKorruption — Beweis liegt vor sobald dasDokument abgeschlossen
  if (quests.gildeKorruption.state === QUEST_STATE.ACTIVE && quests.dasDokument?.state === QUEST_STATE.REWARDED) {
    quests.gildeKorruption.state = QUEST_STATE.DONE;
    showToast('Beweis gesichert — zu Yeva.', TOAST.REWARD);
  }
  // Kap 4: unterweltVerhandlung nach bruderschaftBeweis
  if (!gameFlags.unterweltVerhandlungUnlocked && quests.bruderschaftBeweis.state === 'rewarded') {
    gameFlags.unterweltVerhandlungUnlocked = true;
    showToast('Neue Fähigkeit: Söldner anwerben (Unterwelt-Verhandlung).', TOAST.EVENT);
  }
  // Kap 4: gorrsVergangenheit nach bruderschaftBeweis rewarded + bruderschaft ≥ 30
  if (quests.gorrsVergangenheit.state === 'unstarted' &&
      quests.bruderschaftBeweis.state === 'rewarded' &&
      (fraktionen?.bruderschaft ?? 0) >= 30) {
    quests.gorrsVergangenheit.state = 'active';
    showToast('Neue Aufgabe: Gorrs altes Leben — ihn abends aufsuchen.', TOAST.EVENT);
  }
}
