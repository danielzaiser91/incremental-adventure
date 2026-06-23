/* ══════════════════════════════════════════════════════════════
   experience.js — Erfahrung (EP): manueller Neuanfang + Skillbaum
   Der Raub schaltet nur den Tab frei (siehe actions.js,
   checkMilestones()) — der eigentliche Neuanfang ist immer eine
   bewusste, vom Spieler ausgelöste Entscheidung, nie automatisch.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* Jeder Knoten: `requires` zeigt auf eine andere Skill-ID (Stufe ≥1 davon
   nötig) oder ist `null` (Wurzel, immer kaufbar). `costs[i]` ist der Preis
   für den Aufstieg von Stufe i auf i+1 — bei `maxLevel:1` also `costs[0]`. */
const EP_SKILL_TREE = [
  {
    id: 'jobLeveling', name: 'Lehrreiche Rückschläge', icon: '📘',
    requires: null, maxLevel: 1, costs: [1],
    desc: 'Was ich bei der Arbeit lerne, bleibt nicht wirkungslos.',
    effect: 'Schaltet das Job-Level-System frei — Feldarbeit wird mit Wiederholung besser.',
    learnDialogs: [
      'Ich wurde ausgeraubt. Was ich mir mühsam erarbeitet hatte — weg, in einem einzigen Augenblick. Ich stand da mit leeren Händen und dachte: Ist das jetzt das Ende?',
      'Nein. Der Fremde hat mein Gold, aber er hat mir etwas gelassen, das er nicht greifen kann: die Erfahrung. Jeder Rückschlag ist eine Lektion — ich muss sie nur nutzen.',
      'Ab jetzt gebe ich bei jeder Arbeit mein Bestes. Wer immer sein Bestes gibt, wird immer besser. Das ist mein Plan.'
    ]
  },
  {
    id: 'fieldworkMemory', name: 'Geschickte Hände', icon: '🤲',
    requires: 'jobLeveling', maxLevel: 1, costs: [3],
    visibleIf: () => getSkillLevel('paranoid') >= 1 || !gameFlags.newRobberySystemActive,
    desc: 'Was meine Hände einmal gelernt haben, vergessen sie nicht mehr.',
    effect: 'Mein Feldarbeits-Level übersteht künftig einen Neuanfang.',
    learnDialogs: [
      'Zweiter Anlauf. Neues Kapitel. Ich dachte, es wäre genauso zermürbend wie das erste Mal.',
      'Dann griff ich den Spaten und merkte: die Bewegungen sitzen. Meine Hände erinnern sich. Was ich einmal gelernt habe, nimmt mir keiner mehr.'
    ]
  },
  {
    id: 'ironWill', name: 'Eiserner Wille', icon: '🛡',
    requires: 'fieldworkMemory', maxLevel: 1, costs: [10],
    desc: 'Hunger raubt mir nicht mehr so schnell die letzten Kräfte.',
    effect: 'Hunger beschleunigt den Müdigkeitsaufbau nur noch halb so stark.',
    learnDialogs: [
      'Hunger. Wieder. Früher hätte er mir die Hände zittern lassen.',
      'Jetzt ist er nur noch Lärm im Hintergrund. Ich arbeite trotzdem. Nicht dagegen ankämpfen — einfach weitermachen. Das ist die Lektion.'
    ]
  },
  {
    // Bewusst eine zweite, eigene Spalte mit derselben Voraussetzung wie
    // "Eiserner Wille" (siehe EP_TREE_BRANCHES, vierter Ast beginnt erst
    // in Zeile 1) — eine echte Verzweigung direkt aus "Geschickte Hände"
    // heraus, kein verlängerter Ast.
    id: 'fieldPay', name: 'Überzeugungskraft', icon: '🤝',
    requires: 'fieldworkMemory', maxLevel: 1, costs: [10],
    desc: 'Ich weiß inzwischen, wie ich auch für einfache Arbeit ein bisschen mehr heraushole.',
    effect: '+1 Gold pro Feldarbeit, dauerhaft.',
    learnDialogs: [
      'Heute habe ich gewartet, bis der Vorarbeiter in der Nähe war — und dann ruhig gesagt, was ich verdiene. Ohne zu zögern, ohne zu bitten.',
      'Er hat kurz geschaut und genickt. Eine Münze mehr. Nicht weil ich gefordert habe, sondern weil ich überzeugt habe. Das ist ein Unterschied.'
    ]
  },
  {
    // `extraLock` ist eine zusätzliche Bedingung NEBEN der normalen
    // Ast-Voraussetzung — der Knoten ist (über `ironWill`) zwar sichtbar,
    // aber erst kaufbar, nachdem Kommandant Roswald den Lehrgang gegeben
    // hat (siehe npc.js, NPC "kommandant"). So bleibt die Sichtbarkeits-
    // Logik des Baums unverändert, während der Kauf selbst zusätzlich an
    // ein Story-Ereignis gebunden ist.
    id: 'nightWatchLeveling', name: 'Nächtliche Routine', icon: '🌒',
    requires: 'ironWill', maxLevel: 1, costs: [4],
    desc: 'Auch die Nacht lehrt mich etwas, wenn ich nur aufmerksam genug bin.',
    effect: 'Schaltet ein Erfahrungs-Level-System für die Nachtwache frei.',
    extraLock: () => quests.commanderTraining.state !== 'rewarded',
    extraLockReason: 'Erfordert die Unterweisung durch Kommandant Roswald',
    learnDialogs: [
      'Roswalds Unterweisung war kürzer als erwartet. „Die Nacht lehrt", hat er gesagt. „Aber nur den, der still genug ist, um zuzuhören."',
      'Ich fange an zu verstehen, was er meint. Jede Patrouille schärft die Sinne. Was ich hier lerne, ist mehr als Wachtposten-Routine — es ist Aufmerksamkeit als Handwerk.'
    ]
  },
  {
    id: 'inventoryKeeper', name: 'Fest verschnürt', icon: '🎒',
    requires: 'jobLeveling', maxLevel: 1, costs: [12],
    visibleIf: () => getSkillLevel('paranoid') >= 1 || !gameFlags.newRobberySystemActive,
    desc: 'Was ich mir mühsam zusammengetragen habe, lasse ich nicht einfach so zurück.',
    effect: 'Inventar UND Ausrüstung überstehen künftig einen Neuanfang.',
    learnDialogs: [
      'Ich habe meinen Rucksack ausgepackt und neu geordnet. Was vorne liegt, was hinten, was nah am Körper — nichts mehr dem Zufall überlassen.',
      'Wenn ich alles zurücklassen müsste, nähme ich wenigstens das Wichtigste mit. Kein zufälliges Sortiment mehr. Alles hat seinen Platz.'
    ]
  },
  {
    id: 'sleepLikeARock', name: 'Ich schlafe wie ein Stein', icon: '🪨',
    requires: 'inventoryKeeper', maxLevel: 1, costs: [10],
    desc: 'Man sagt mir nach, ich schlafe wie ein Stein — früher war das kein Kompliment. Inzwischen hilft es mir.',
    effect: '+1 Schlafqualitäts-Stufe an jedem Schlafplatz.',
    learnDialogs: [
      'Früher lag ich wach, die Gedanken kreisten, der Schlaf kam nicht. Heute: Kopf aufs Kissen, und die Welt ist weg.',
      'Es ist kein Talent. Ich habe gelernt abzuschalten, wenn der Tag vorbei ist. Sorgen, Pläne, offene Fragen — die können warten. Jetzt schläft der Körper.'
    ]
  },
  {
    id: 'thrift', name: 'Sparsamkeit', icon: '🪙',
    requires: 'jobLeveling', maxLevel: 2, costs: [4, 8],
    visibleIf: () => getSkillLevel('paranoid') >= 1 || !gameFlags.newRobberySystemActive,
    desc: 'Ich weiß inzwischen, wo man beim Krämer ein gutes Wort einlegt.',
    effect: 'Marktplatz-Preise −10 % je Stufe (max. −20 %).',
    learnDialogs: level => level === 1 ? [
      'Beim Krämer heute: doppelt so lange gehandelt wie nötig. Ergebnis: ein Brot billiger. Nicht spektakulär.',
      'Aber ich kenne jetzt die Preise. Wo ist Spielraum, wo nicht. Das nächste Mal weiß ich es schon beim Betreten des Ladens.'
    ] : [
      'Ich kenne inzwischen jeden Preis auf dem Marktplatz auswendig. Greta weiß das. Die Händler ahnen es.',
      'Ein ruhiges Lächeln, ein klarer Blick — der Preis gibt nach. Das ist keine Kunst mehr. Das ist Übung, die sich auszahlt.'
    ]
  },
  {
    // `visibleIf` ist ein zusätzliches, rein optisches Sichtbarkeits-
    // Kriterium NEBEN der normalen `requires`-Kette (siehe renderSkillTree())
    // — der Knoten existiert im Baum, taucht aber gar nicht erst auf, bevor
    // der Spieler überhaupt ein Haustier hat. Anders als `extraLock`
    // (sichtbar, aber gesperrt) ist er hier komplett unsichtbar, weil ein
    // Tierfreund-Skill ohne jedes Tier nur verwirren würde.
    id: 'petLover', name: 'Tierfreund', icon: '🐾',
    requires: 'jobLeveling', maxLevel: 1, costs: [8],
    visibleIf: () => Object.keys(pets).length > 0 && (getSkillLevel('paranoid') >= 1 || !gameFlags.newRobberySystemActive),
    desc: 'Was mir zuläuft, verdient meine volle Aufmerksamkeit.',
    effect: 'Haustiere können jetzt aufleveln und ihren Bonus verstärken (siehe Haustiere).',
    learnDialogs: [
      'Das Tier hat mich mehr gelehrt als mancher Mensch. Geduld. Beständigkeit. Vertrauen, das man sich verdienen muss — und das man nicht einfach fordert.',
      'Ich fange an zu verstehen, was es braucht. Keine Tricks, keine Befehle — nur Zeit und Aufmerksamkeit. Der Rest kommt von selbst.'
    ]
  },
  {
    id: 'longShift', name: 'Lange Schicht', icon: '⏰',
    requires: 'jobLeveling', maxLevel: 1, costs: [3],
    visibleIf: () => getSkillLevel('paranoid') >= 1 || !gameFlags.newRobberySystemActive,
    desc: 'Wenn ich schon auf dem Feld stehe, kann ich auch gleich doppelt so lange bleiben.',
    effect: 'Schaltet eine 2-Stunden-Feldarbeit frei — doppelter Ertrag, doppelte Kosten.',
    learnDialogs: [
      'Ich stehe auf dem Feld und schaue auf die Sonne. Heute bleibe ich länger. Weil ich es kann — und weil es sich lohnt.',
      'Zwei Stunden statt einer. Mehr Erschöpfung, mehr Gold, und das Gefühl: Heute habe ich wirklich etwas geschafft.'
    ]
  },
  {
    id: 'longerRest', name: 'Längere Pause', icon: '🛋',
    requires: 'ironWill', maxLevel: 4, costs: [4, 8, 12, 16],
    desc: 'Manchmal reicht eine kurze Verschnaufpause einfach nicht. Ich gönne mir mehr Zeit.',
    effect: 'Pausendauer: 15 → 30 Min (St. 1), → 60 Min (St. 3). Erholung ×1,2 / ×1,3 / ×1,3 / ×1,5. St. 4: −30 % Hunger.',
    learnDialogs: level => [
      [
        'Fünfzehn Minuten sind keine Pause. Ich habe das immer gedacht, aber nie zugegeben.',
        'Dreißig Minuten. Der Körper entspannt tatsächlich — die Schultern sinken, die Hände hören auf zu zittern. So soll eine Pause sein.'
      ],
      [
        'Ich habe angefangen, die Pause zu verfeinern. Weniger zappeln, mehr atmen. Die Erholung kommt tiefer.',
        'Es ist eine Fertigkeit, sich richtig auszuruhen. Ich übe sie — und es zahlt sich aus.'
      ],
      [
        'Eine Stunde. Manche würden sagen: zu lang. Ich sage: endlich genug.',
        'Ich schlafe nicht — aber ich lasse los. Gedanken, Anspannung, das ständige Rechnen im Kopf. Völlige Stille. Danach bin ich besser als vorher.'
      ],
      [
        'Der Körper hat gelernt, während der Pause effizienter zu regenerieren. Weniger Hunger danach — nicht weil ich gegessen habe.',
        'Echte Erholung verringert, wie dringend die Mahlzeit wird. Das ist kein Trick — das ist das Ergebnis langer Übung.'
      ]
    ][level - 1]
  },
  {
    id: 'jobXpBonus', name: 'Aufmerksamer Lehrling', icon: '📋',
    requires: 'jobLeveling', maxLevel: 1, costs: [2],
    visibleIf: () => getSkillLevel('paranoid') >= 1 || !gameFlags.newRobberySystemActive,
    desc: 'Ich beobachte, wie die Erfahreneren die Arbeit angehen. Irgendwann zahlt sich das aus.',
    effect: '+1 Job-Erfahrung pro Feldarbeit (Voraussetzung für "Schneller Lerner").',
    learnDialogs: [
      'Ich habe aufgehört, einfach nur zu schaufeln. Ich schaue jetzt, wie der Alte neben mir es macht — Handgelenk, Winkel, Rhythmus. Alles, was ich vorher übersehen hatte.',
      'Ein bisschen abgucken, ein bisschen ausprobieren. Die Arbeit geht leichter, die Fortschritte kommen schneller. Wer genau hinschaut, lernt doppelt.'
    ]
  },
  {
    // Jetzt Voraussetzung: jobXpBonus statt direkt jobLeveling — erst wenn
    // der Spieler gelernt hat aufmerksam zu sein, hilft ihm weiteres Üben.
    id: 'quickLearner', name: 'Schneller Lerner', icon: '🎯',
    requires: 'jobXpBonus', maxLevel: 5, costs: [1, 2, 3, 4, 5],
    desc: 'Jeder Handgriff sitzt beim nächsten Mal schon etwas sicherer.',
    effect: '+10 % Job-Erfahrung pro Feldarbeit je Stufe (max. +50 %).',
    learnDialogs: level => [
      ['Ich mache schneller Fortschritte als erwartet. Kein Talent — es ist Aufmerksamkeit, die sich endlich auszahlt.'],
      ['Die Kurve flacht sich ab. Aber ich kenne sie jetzt — weiß, wie ich durchkomme. Jeder Rückschlag ist nur der nächste Anlauf.'],
      ['Manchmal weiß ich schon, wie es geht, bevor ich es ausprobiert habe. Das Hirn füllt die Lücken selbst. Lernen beschleunigt das Lernen.'],
      ['Ich sehe den Abstand zwischen gestern und heute. Nicht dramatisch — aber stetig. Jede Schicht bringt mehr als die letzte.'],
      ['Ich bin kein Lehrling mehr. Die Arbeit sitzt tief — in den Händen, in der Haltung, in jedem Schritt. Ich merke es. Die anderen auch.']
    ][level - 1]
  },
  {
    id: 'clearMind', name: 'Klarer Kopf', icon: '🧠',
    requires: 'thrift', maxLevel: 1, costs: [8],
    desc: 'Je öfter ich neu anfange, desto klarer sehe ich, was wirklich zählt.',
    effect: '+1 Erfahrung bei jedem zukünftigen Neuanfang.',
    learnDialogs: [
      'Jedes Mal von vorn anfangen hat etwas in mir verändert. Die Aufregung der ersten Versuche ist weg — zurück bleibt Klarheit.',
      'Ich sehe jetzt, was wirklich zählt. Gold ist flüchtig. Was ich verstehe, bleibt. Beim nächsten Neuanfang nehme ich mehr mit als bisher.'
    ]
  },
  {
    id: 'goldBreakthrough', name: 'Weitblick', icon: '📈',
    requires: 'clearMind', maxLevel: 1, costs: [15],
    desc: 'Ich verstehe jetzt, dass mehr zurückgelassenes Gold auch mehr lehrt — nicht nur, OB ich eine Grenze überschritten habe.',
    effect: `Bei einem Neuanfang zählt jeder erreichte Gold-Meilenstein (${GOLD_MILESTONE_THRESHOLD}, ${GOLD_MILESTONE_THRESHOLD * 2}, ${GOLD_MILESTONE_THRESHOLD * 4}, …) als zusätzliche Erfahrung.`,
    learnDialogs: [
      'Ich dachte, ein Neuanfang ist immer gleich — alles weg, ein EP, von vorn. Aber das stimmt nicht ganz.',
      'Wie weit ich komme, bevor ich aufhöre, macht den Unterschied. Mehr riskiert, mehr zurückgelassen, mehr gelernt. Das ist keine Mystik — das ist eine Formel.'
    ]
  },
  {
    // Einziger Knoten, der BEIDE Äste als Voraussetzung hat (`requiresAll`
    // statt `requires`) UND zusätzlich Gold statt nur EP kostet
    // (`goldCosts`) — siehe buyNextSkillLevel()/epNodeCardHtml(). Schaltet
    // keinen Spielmechanik-Bonus frei, sondern eine Story-Konsequenz: Brakka
    // erklärt danach endlich den Weg zur Abenteurergilde (siehe npc.js).
    id: 'guildPrep', name: 'Vorbereitung auf die Gilde', icon: '⚔',
    requiresAll: ['nightWatchLeveling', 'goldBreakthrough'], maxLevel: 1, costs: [100], goldCosts: [1000],
    desc: 'Reichtum und Routine allein machen noch keinen Abenteurer — aber sie sind ein Anfang.',
    effect: 'Schaltet den Weg zur Abenteurergilde frei. Brakka weiß mehr darüber.',
    learnDialogs: [
      'Ich habe lange gewartet, bevor ich mich das getraut habe. Die Anforderungen waren real: Ausdauer, Kenntnisse, nachgewiesene Erfahrung. Keine Abkürzungen.',
      'Brakka wird sehen, dass ich bereit bin. Nicht weil ich es behaupte — sondern weil ich alles getan habe, was nötig war. Die Karten liegen auf dem Tisch.',
      'Die Gilde. Ein neues Kapitel. Ich weiß noch nicht genau, was mich erwartet. Aber ich bin vorbereitet — auf mehr als ich gedacht hatte.'
    ]
  },

  // ══ PARANOIDER AST — freigeschaltet nach dem 4. automatischen Raub ══════
  // Dieser Ast wächst parallel zum normalen Baum (eigene Spalte rechts).
  // Die Visualisierung erfolgt über renderParanoidTree() + PARANOID_BRANCHES.
  // buyNextSkillLevel() funktioniert für diese Knoten unverändert.
  {
    id: 'paranoid', name: 'Paranoid', icon: '👁',
    requires: null, maxLevel: 1, costs: [3],
    desc: 'Viermal ausgeraubt — und immer noch hier. Die Angst sitzt tief, aber sie macht mich wacher.',
    effect: 'Schaltet den manuellen Neuanfang frei. Gibt den restlichen Erfahrungs-Baum frei. Nachteil: +15 % Müdigkeit bei Feldarbeit (Dauerspannung).',
    learnDialogs: [
      'Viermal. Viermal ausgeraubt, viermal mit leeren Händen wieder aufgestanden. Ich kann nicht mehr so tun, als wäre das alles in Ordnung.',
      'Ich bin paranoid geworden. Jedes Geräusch, jeder Schatten. Aber vielleicht ist das gar nicht so falsch — wer ständig auf der Hut ist, übersieht weniger.',
      'Ich fange an, das alles anders zu sehen. Nicht blind schuften — sondern denken. Das kostet mich Nerven. Aber es bringt mich weiter.'
    ]
  },
  {
    id: 'aufmerksamkeit', name: 'Scharf beobachtet', icon: '👀',
    requires: 'paranoid', maxLevel: 1, costs: [5],
    desc: 'Die Anspannung lässt sich kanalisieren — wenn man weiß, wie.',
    effect: 'Hebt den Müdigkeitsmalus von Paranoid auf.',
    learnDialogs: [
      'Die Panik ist weg. Was bleibt, ist Wachheit — aber kontrolliert. Ich laufe nicht mehr davon.',
      'Ich habe gelernt, die Angst arbeiten zu lassen, statt gegen mich. Konzentration statt Verkrampfung. Die Arbeit geht leichter.'
    ]
  },
  {
    id: 'instinkt', name: 'Instinkt', icon: '🔍',
    requires: 'aufmerksamkeit', maxLevel: 1, costs: [8],
    desc: 'Was mich nicht umbringt, macht mich schärfer. Ich erkenne Gelegenheiten, die andere übersehen.',
    effect: '+1 Gold pro Feldarbeit. Die Paranoia ist zum Vorteil geworden.',
    learnDialogs: [
      'Nicht mehr wütend. Nicht mehr ängstlich. Ich sehe jetzt Möglichkeiten, die früher im Lärm der Angst untergingen.',
      'Der Fremde hat mich viermal ausgeraubt — und jedes Mal habe ich mehr mitgenommen als er mir lassen wollte. Den Instinkt kann er mir nicht stehlen.'
    ]
  },
  {
    id: 'kaltbluetig', name: 'Kaltblütig', icon: '🧊',
    requires: 'instinkt', maxLevel: 1, costs: [12],
    desc: 'Ich lasse mich nicht mehr aus der Ruhe bringen. Weder von Hunger noch von Schicksalsschlägen.',
    effect: '+1 Erfahrung bei jedem Neuanfang.',
    learnDialogs: [
      'Kalt. Klar. Unerschütterlich. Das bin ich jetzt.',
      'Nicht weil ich kein Herz mehr habe — sondern weil ich gelernt habe, es zu beherrschen. Jeder Neuanfang lehrt mich mehr als der letzte.'
    ]
  },
  {
    id: 'unzerstoerbar', name: 'Unzerstörbar', icon: '⛰',
    requires: 'kaltbluetig', maxLevel: 1, costs: [20],
    desc: 'Ich weiß, dass ich immer wieder aufstehen werde — egal wie oft ich falle. Das macht mich stärker als jeden, der nie gefallen ist.',
    effect: '+1 weiterer Erfahrungspunkt bei jedem Neuanfang (stapelt sich mit Kaltblütig und allen anderen Boni).',
    learnDialogs: [
      'Ich habe mehr verloren als die meisten Menschen hier je besitzen werden. Und ich stehe noch.',
      'Das ist keine Heldengeschichte. Das ist das, was passiert, wenn man immer wieder aufsteht, bis man es nicht mehr anders kann. Bis Weitermachen keine Entscheidung mehr ist — sondern wer man ist.'
    ]
  }
];

/* Die Äste des Baums, von der Wurzel "Lehrreiche Rückschläge" aus nach
   unten wachsend (siehe renderSkillTree()): Arbeit (links), Besitz
   (Mitte), Wirtschaft (rechts). Jeder Eintrag ist nur sichtbar, sobald
   sein Vorgänger erlernt wurde — die Wurzel selbst ist immer sichtbar.
   Äste dürfen unterschiedlich lang sein (siehe Mitte, nur 2 Einträge) —
   renderSkillTree() iteriert bis zur längsten Kette und lässt kürzere
   Äste einfach leer auslaufen. */
/* Jede innere Liste = ein sichtbarer Ast im Baum, von oben nach unten.
   `undefined` in einer Zeile bedeutet: dieser Ast hat hier keine Stufe
   (der Ast beginnt erst tiefer). EP_TREE_BRANCHES definiert NUR die
   Spaltenreihenfolge — die eigentlichen Voraussetzungen stehen im jeweiligen
   Knoten-Eintrag in EP_SKILL_TREE (`.requires`/`.requiresAll`). */
const EP_TREE_BRANCHES = [
  // Ast 0 — Arbeit: fieldworkMemory → ironWill → nightWatchLeveling
  ['fieldworkMemory', 'ironWill', 'nightWatchLeveling'],
  // Ast 1 — Überzeugung: DIREKT NEBEN ironWill (beide hängen an fieldworkMemory,
  // Zeile 0 = undefined, weil der Ast auf Tiefe 1 startet)
  [undefined, 'fieldPay'],
  // Ast 2 — Besitz: inventoryKeeper → sleepLikeARock
  ['inventoryKeeper', 'sleepLikeARock'],
  // Ast 3 — Wirtschaft: thrift → clearMind → goldBreakthrough
  ['thrift', 'clearMind', 'goldBreakthrough'],
  // Ast 4 — Lernen: jobXpBonus (Grundlage) → quickLearner (5 Stufen)
  ['jobXpBonus', 'quickLearner'],
  // Ast 5 — Haustier: petLover (bedingt, nur wenn Haustier vorhanden)
  ['petLover'],
  // Ast 6 — Ausdauer: longShift (direkt aus jobLeveling)
  ['longShift'],
  // Ast 7 — Erholung: longerRest (aus ironWill, Tiefe 2)
  [undefined, undefined, 'longerRest']
];

/* Äste des paranoiden Skillbaums — eine einzige Spalte, parallel zum
   normalen Baum. Die Wurzel "paranoid" wird separat als root-Reihe
   gerendert (analog zu jobLeveling im normalen Baum). */
const PARANOID_BRANCHES = [
  ['aufmerksamkeit', 'instinkt', 'kaltbluetig', 'unzerstoerbar']
];

/* ══════════════════════════════════════════════════════════════
   SUPER-SKILL-DEFINITIONEN (Lehrer-System)
   Jeder Eintrag gehört zu einem maxbaren Skill (forSkill) und beschreibt
   die Aufgabe, die der Spieler beim Lehrmeister abschließen muss, um die
   erweiterte Version dieses Skills zu erhalten.
   ══════════════════════════════════════════════════════════════ */

const SUPER_SKILL_DEFS = [
  {
    id: 'thrift_super', forSkill: 'thrift',
    name: 'Meisterhändler', icon: '🪙',
    shortDesc: 'Weitere −15 % Marktpreise (insgesamt −35 %).',
    questDesc: 'Verkaufe bei Greta insgesamt 30 Rohstoffe.',
    questProgress: () => `${Math.min(resources.totalResourcesSold, 30)}/30`,
    questDone: () => resources.totalResourcesSold >= 30
  },
  {
    id: 'quickLearner_super', forSkill: 'quickLearner',
    name: 'Natürliches Talent', icon: '🎯',
    shortDesc: '+25 % zusätzliche Job-Erfahrung.',
    questDesc: 'Absolviere 30 Feldarbeiten in einem Kapitel ohne Neuanfang.',
    questProgress: () => `${Math.min(workStats.count, 30)}/30`,
    questDone: () => workStats.count >= 30
  },
  {
    id: 'fieldPay_super', forSkill: 'fieldPay',
    name: 'Verhandlungskunst', icon: '🤝',
    shortDesc: '+1 zusätzliches Gold pro Feldarbeit (insgesamt +2).',
    questDesc: 'Verdiene in deinem Leben insgesamt 500 Gold.',
    questProgress: () => `${Math.min(resources.totalGoldEarned, 500)}/500`,
    questDone: () => resources.totalGoldEarned >= 500
  },
  {
    id: 'clearMind_super', forSkill: 'clearMind',
    name: 'Klarer Horizont', icon: '🌅',
    shortDesc: '+1 weitere EP bei jedem Neuanfang (insgesamt +2 mit Klarer Kopf).',
    questDesc: 'Beginne dreimal von vorn.',
    questProgress: () => `${Math.min(meta.resets, 3)}/3`,
    questDone: () => meta.resets >= 3
  },
  {
    // Straßennächte als Nachweis: wer 20 Mal auf dem Pflaster geschlafen
    // hat, hat seine Grenzen wirklich kennengelernt.
    id: 'sleepLikeARock_super', forSkill: 'sleepLikeARock',
    name: 'Traumloser Schlaf', icon: '🌙',
    shortDesc: '+1 weiterer Schlafqualitäts-Bonus überall (insgesamt +2 Stufen).',
    questDesc: 'Schlafe 20 Mal auf der Straße.',
    questProgress: () => `${Math.min(streetCatProgress.sleepCount, 20)}/20`,
    questDone: () => streetCatProgress.sleepCount >= 20
  },
  {
    id: 'ironWill_super', forSkill: 'ironWill',
    name: 'Stählerner Wille', icon: '⚔',
    shortDesc: 'Hunger hat keinen Einfluss mehr auf den Müdigkeitsaufbau.',
    questDesc: 'Absolviere 10 Feldarbeiten, während du hungrig bist (Hunger ≥ 80 %).',
    questProgress: () => `${Math.min(workStats.hungryWorkCount || 0, 10)}/10`,
    questDone: () => (workStats.hungryWorkCount || 0) >= 10
  },
  {
    id: 'longerRest_super', forSkill: 'longerRest',
    name: 'Natürliche Widerstandskraft', icon: '🌿',
    shortDesc: 'Hunger und Müdigkeit steigen dauerhaft 10 % langsamer an.',
    questDesc: 'Lege 20 Mal eine Lange Pause ein (Stufe 1 oder höher).',
    questProgress: () => `${Math.min(restStats.count || 0, 20)}/20`,
    questDone: () => (restStats.count || 0) >= 20
  },
  {
    id: 'fieldworkMemory_super', forSkill: 'fieldworkMemory',
    name: 'Muskelgedächtnis', icon: '🤲',
    shortDesc: 'Auch das Nachtwache-Level übersteht einen Neuanfang.',
    questDesc: 'Erreiche Feldarbeits-Stufe 3 (50 Feldarbeiten in einem Kapitel).',
    questProgress: () => `${Math.min(workStats.count, 50)}/50`,
    questDone: () => getWorkLevel(workStats.count) >= 3
  },
  {
    id: 'nightWatchLeveling_super', forSkill: 'nightWatchLeveling',
    name: 'Eiserne Wacht', icon: '🌒',
    shortDesc: 'Nachtwache verursacht keinen Schlaf-Debuff mehr.',
    questDesc: 'Absolviere 15 Nachtwachen.',
    questProgress: () => `${Math.min(nightWatchStats.count, 15)}/15`,
    questDone: () => nightWatchStats.count >= 15
  },
  {
    id: 'inventoryKeeper_super', forSkill: 'inventoryKeeper',
    name: 'Dicker Rucksack', icon: '🎒',
    shortDesc: '+3 Inventarplätze (12 → 15).',
    questDesc: 'Übersteht einen Neuanfang mit 12 oder mehr belegten Inventarplätzen.',
    questProgress: () => gameFlags.fullInventoryReset ? '1/1' : '0/1',
    questDone: () => !!gameFlags.fullInventoryReset
  }
];

/** Zeigt einmalig einen Monolog, der den Spieler auf Oswin in der Taverne
    hinweist — nur wenn noch nicht gesehen UND ein Super-Skill erreichbar ist. */
function maybeTriggerSuperSkillHint(node) {
  gameFlags.oswingSuperHintShown = true;
  showMonologue('Eine Grenze — oder doch nicht?', [
    `Ich habe bei "${node.name}" alles herausgeholt, was möglich scheint. Das Gefühl ist eigenartig — als hätte ich die Wand hinter einem Horizont berührt.`,
    'Aber vielleicht gibt es jemanden, der weiß, wie man das, was man kann, noch weiter treibt. Dieser Oswin in der Taverne — hochnäsig, das schon. Aber er steckt in teuren Stoffen und schaut einen so an, als wäre man für ihn lesbar wie ein Buch.',
    'Ich sollte ihn nach einem Lehrmeister fragen. Wenn er überhaupt redet.'
  ], render);
}

/* ──────────────────────────────────────────────────────────── */

/* Mindest-Gold für überhaupt irgendeine Erfahrung bei einem (nicht-ersten)
   Neuanfang — bewusst identisch mit der Raub-Schwelle (siehe state.js):
   wer so viel Gold hat wie der Räuber für einen Überfall braucht, hat
   genug riskiert, um daraus etwas zu lernen. Ohne "Weitblick" bleibt der
   Gewinn trotz mehr Gold bei genau 1 EP (+1 mit "Klarer Kopf") gekappt —
   erst der Skill macht aus zusätzlichem Gold zusätzliche Erfahrung, über
   exponentiell wachsende Meilensteine. */
const RESET_MIN_GOLD = GOLD_MILESTONE_THRESHOLD;
const EP_GOLD_BREAKPOINTS = [1, 2, 4, 8, 16, 32, 64, 128].map(f => GOLD_MILESTONE_THRESHOLD * f);

/** Liefert die aktuelle Stufe eines Skills (0 = noch nicht erlernt). */
function getSkillLevel(id) {
  return typeof skills[id] === 'number' ? skills[id] : (skills[id] ? 1 : 0);
}

function setSkillLevel(id, level) {
  if (typeof skills[id] === 'number') skills[id] = level;
  else skills[id] = level >= 1;
}

/** Marktplatz-Preis-Multiplikator durch den Skill "Sparsamkeit". */
function getThriftMult() {
  return 1 - getSkillLevel(SKILL_ID.THRIFT) * 0.10;
}

/** Pausendauer in Spielminuten (15 / 30 ab St.1 / 60 ab St.3). */
function getRestDurationMins() {
  const level = getSkillLevel(SKILL_ID.LONGER_REST);
  return level >= 3 ? 60 : level >= 1 ? 30 : 15;
}

/** Müdigkeitserholungs-Multiplikator der Pause (1.0 / 1.2 / 1.3 / 1.3 / 1.5). */
function getRestRecoveryMult() {
  const level = getSkillLevel(SKILL_ID.LONGER_REST);
  return level >= 4 ? 1.5 : level >= 2 ? 1.3 : level >= 1 ? 1.2 : 1.0;
}

/** Hunger-Reduktion durch die Pause in Prozentpunkten (0 oder 30 bei St.4). */
function getRestHungerReduction() {
  return getSkillLevel(SKILL_ID.LONGER_REST) >= 4 ? 30 : 0;
}

/** Multiplikator auf Hunger/Müdigkeitsaufbau durch den Super-Skill (0.9 oder 1.0). */
function getSuperRestMult() {
  return superSkills.longerRest_super ? 0.9 : 1.0;
}

/** Wendet den Sparsamkeits-Rabatt an und rundet auf min. 1 Gold. */
function applyThrift(cost) {
  return Math.max(1, Math.round(cost * getThriftMult()));
}

/** Liefert die Liste der Voraussetzungs-Skill-IDs eines Knotens — ein
    einzelner Ast normalerweise (`requires`), oder beide Äste bei einem
    Konvergenz-Knoten wie "guildPrep" (`requiresAll`). */
function getNodeRequirements(node) {
  return node.requiresAll || (node.requires ? [node.requires] : []);
}

/** Hat irgendein anderer Knoten diesen hier (mit-)zur Voraussetzung? Dient
    nur dem Hinweistext "schaltet weitere Fähigkeiten frei" — die
    eigentliche Sichtbarkeitslogik (renderSkillTree()) bleibt unberührt. */
function nodeUnlocksMoreSkills(id) {
  return EP_SKILL_TREE.some(n => getNodeRequirements(n).includes(id));
}

/** Kauft die nächste Stufe eines Skills, falls Voraussetzung(en) sowie EP
    (und ggf. Gold, siehe `goldCosts`) reichen. */
function buyNextSkillLevel(id) {
  const node = EP_SKILL_TREE.find(n => n.id === id);
  if (!node) return;

  const level = getSkillLevel(id);
  if (level >= node.maxLevel) return;
  if (getNodeRequirements(node).some(reqId => getSkillLevel(reqId) < 1)) return;
  if (typeof node.extraLock === 'function' && node.extraLock()) return;

  const epCost   = node.costs[level];
  const goldCost = node.goldCosts ? node.goldCosts[level] : 0;
  if (experience.points < epCost) {
    showToast(`Nicht genug Erfahrung — benötigt: ${epCost} EP.`, TOAST.ERROR);
    return;
  }
  if (resources.gold < goldCost) {
    showToast(`Nicht genug Gold — benötigt: ${goldCost} Gold.`, TOAST.ERROR);
    return;
  }

  experience.points -= epCost;
  resources.gold    -= goldCost;
  setSkillLevel(id, level + 1);

  // "guildPrep" hat keinen Spielmechanik-Effekt, sondern stößt direkt
  // Brakkas Gilden-Questkette an (siehe npc.js).
  if (id === 'guildPrep') {
    quests.guildRegistration.state = QUEST_STATE.ACTIVE;
  }

  const newLevel = level + 1;
  const levelNote = node.maxLevel > 1 ? ` (Stufe ${newLevel})` : '';
  showToast(`${node.name}${levelNote} erlernt.`, TOAST.EVENT);

  const afterLearnDialog = () => {
    if (newLevel >= node.maxLevel && !gameFlags.oswingSuperHintShown) {
      if (SUPER_SKILL_DEFS.some(s => s.forSkill === id)) maybeTriggerSuperSkillHint(node);
    }
    render();
  };

  const rawDialogs = node.learnDialogs;
  const pages = typeof rawDialogs === 'function' ? rawDialogs(newLevel) : rawDialogs;

  if (pages && pages.length > 0) {
    render();
    showMonologue(node.name, pages, afterLearnDialog);
  } else {
    afterLearnDialog();
  }
}

/** EP-Gewinn eines Neuanfangs. Der allererste gibt IMMER genau 1 EP,
    unabhängig vom gesammelten Gold. Danach gilt: unter RESET_MIN_GOLD gibt
    es nichts (geschenktes/zu wenig Gold lehrt nichts). Ab der Schwelle ist
    der Gewinn ohne "Weitblick" auf 1 EP gekappt, egal wie viel mehr Gold
    es ist — erst der Skill lässt jeden weiteren erreichten Meilenstein
    zusätzlich zählen. */
function computeEpGain(isFirstReset) {
  if (isFirstReset) return 1;
  if (resources.gold < RESET_MIN_GOLD) return 0;

  let gain = skills.goldBreakthrough
    ? EP_GOLD_BREAKPOINTS.filter(bp => resources.gold >= bp).length
    : 1;
  if (skills.clearMind) gain += 1;
  if (superSkills.clearMind_super) gain += 1;
  if (skills.kaltbluetig) gain += 1;
  if (skills.unzerstoerbar) gain += 1;
  return gain;
}

/** Ist gerade ein lohnender Neuanfang möglich? Identisch zur Bedingung
    des "Neu anfangen"-Buttons (siehe renderErfahrung()) — eigene Funktion,
    damit auch der Nav-Button (nav.js) ohne Codeverdoppelung danach fragen
    kann, ob er sich hervorheben soll. */
function canPerformManualReset() {
  return meta.resets === 0 || computeEpGain(false) > 0;
}

/** Nächste Gold-Schwelle, ab der ein Neuanfang einen zusätzlichen EP
    abwerfen würde — für die Anzeige im Erfahrungs-Tab. `null` heißt:
    entweder bereits der höchste Meilenstein erreicht, oder (ohne
    "Weitblick") schlicht gekappt, solange die Mindestschwelle erfüllt ist. */
function getNextEpGoldTarget() {
  if (resources.gold < RESET_MIN_GOLD) return RESET_MIN_GOLD;
  if (!skills.goldBreakthrough) return null;
  return EP_GOLD_BREAKPOINTS.find(bp => bp > resources.gold) ?? null;
}

/* Zweiteiliger Ich-Monolog für die bildschirmfüllende Übergangs-Animation
   beim Neuanfang (siehe playResetAnimation()) — bewusst kurz und ohne
   Klick-Interaktion, weil die Texte automatisch weiterlaufen sollen wie
   ein erzählter Moment, nicht wie ein weiterer Dialog. Erster Block:
   der Verlust. Zweiter Block: die positive Wendung (was bleibt). */
const RESET_ANIMATION_TEXTS = [
  'Mein Gold ist fort — in einem Atemzug, als hätte ich es nie besessen. Der Beutel leer, die Hände leer.',
  'Aber was ich unterwegs gelernt habe, kann mir niemand nehmen. Ich beginne nicht bei null. Ich beginne klüger.'
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Spielt die zweistufige Reset-Animation ab: blendet das Overlay ein,
    zeigt Textblock 1, blendet ihn aus, zeigt Textblock 2, blendet ihn
    wieder aus — und lässt das (bereits dunkle) Overlay anschließend
    sichtbar stehen, bis closeResetAnimation() es nach dem eigentlichen
    State-Reset wieder wegblendet (siehe runManualResetWithAnimation()).
    Ein `await wait(20)` vor dem ersten Klassenwechsel ist nötig, damit
    der Browser die `hidden`-Entfernung erst rendert, bevor die
    Opacity-Transition zur sichtbaren Klasse überhaupt etwas zu
    animieren hat (sonst springt es ohne Übergang direkt auf "sichtbar"). */
async function playResetAnimation() {
  const overlay = document.getElementById('reset-overlay');
  const textEl  = document.getElementById('reset-overlay-text');
  if (!overlay || !textEl) return;

  // Dieselbe Klasse, die auch das normale Dialog-Overlay setzt (siehe
  // dialog.js) — pausiert dadurch automatisch das Autosave-Intervall
  // (save.js, setupAutoSave()), ohne dass dieses extra wissen muss, dass
  // es gerade KEIN gewöhnlicher Dialog, sondern diese Animation ist.
  document.body.classList.add('dialog-open');
  overlay.classList.remove('hidden');
  await wait(20);
  overlay.classList.add('reset-overlay-visible');
  await wait(400);

  for (const text of RESET_ANIMATION_TEXTS) {
    textEl.textContent = text;
    textEl.classList.add('reset-overlay-text-visible');
    await wait(3400);
    textEl.classList.remove('reset-overlay-text-visible');
    await wait(600);
  }
}

/** Blendet das Reset-Overlay wieder aus (siehe playResetAnimation()). */
async function closeResetAnimation() {
  const overlay = document.getElementById('reset-overlay');
  if (!overlay) return;
  overlay.classList.remove('reset-overlay-visible');
  await wait(500);
  overlay.classList.add('hidden');
  document.body.classList.remove('dialog-open');
}

/** Spielt die Übergangs-Animation ab, vollzieht ERST DANACH den
    eigentlichen State-Reset (siehe performManualReset()) und blendet das
    Overlay erst dann wieder aus — der Spieler sieht den neuen Zustand
    (Gold weg, EP gutgeschrieben) also genau in dem Moment, in dem das
    Overlay verschwindet, nicht schon währenddessen dahinter aufblitzend. */
async function runManualResetWithAnimation() {
  if (!settings.showResetAnimation) {
    performManualReset();
    return;
  }
  gameFlags.resetAnimationSeen = true;
  await playResetAnimation();
  performManualReset();
  await closeResetAnimation();
}

/** Tauscht das gesamte Gold gegen Erfahrung und beginnt von vorn. */
function performManualReset() {
  const isFirstReset = meta.resets === 0;
  const epGain = computeEpGain(isFirstReset);

  meta.resets += 1;
  meta.fasterWorkUnlocked = true;
  experience.points      += epGain;
  experience.totalEarned += epGain;

  resources.gold = 0;
  if (!skills.fieldworkMemory) workStats.count = 0;
  workStats.hungryWorkCount = 0;
  if (!superSkills.fieldworkMemory_super) nightWatchStats.count = 0;
  if (getUsedInventorySlots() >= INVENTORY_SLOT_COUNT) gameFlags.fullInventoryReset = true;
  if (!skills.inventoryKeeper) {
    // Ausrüstung MUSS vor dem Leeren von resources.inventory abgelegt
    // werden, sonst zeigt equipment.* danach auf eine ID, die es im
    // (jetzt leeren) Inventar nie mehr gab — kein Bug, aber ein
    // inkonsistenter Zustand, den equipItem()/unequipItem() so nie
    // erzeugen würden.
    equipment = { hands: null, guertel: null };
    resources.inventory = {};
    overflowBag = {};
  }
  // Im neuen Raub-System bleiben die Auto-Resets in Kapitel 1 (storyState 10103–10106).
  // Kapitel 2 beginnt erst nach dem ersten MANUELLEN Reset (nach Kauf von Paranoid).
  if (storyState < 20100 && (!gameFlags.newRobberySystemActive || skills.paranoid >= 1)) {
    storyState = 20100;
  }
  playerStats.maxHp = getPlayerMaxHp();
  playerStats.hp    = playerStats.maxHp;
  currentContent = 'erfahrung';

  render();
  showToast(`+${epGain} Erfahrung gewonnen. Mein Gold ist fort, aber das Gelernte bleibt.`, TOAST.EVENT);
}

/** Startet den Neuanfang — beim allerersten Mal mit ausführlicher
    Erklärung, danach nur noch mit kurzer Bestätigung. */
function startManualReset() {
  const isFirstReset = meta.resets === 0;
  const epGain = computeEpGain(isFirstReset);

  const clearMindBonus = (skills.clearMind ? 1 : 0) + (superSkills.clearMind_super ? 1 : 0);
  const xpNote = clearMindBonus > 0
    ? `+${epGain} EP (davon +${clearMindBonus} durch Klarer Kopf)`
    : `+${epGain} EP`;
  const showConfirm = () => showDialog({
    title: 'Neu anfangen?',
    text: [
      epGain > 0
        ? `Ich lasse alles hinter mir — mein Gold, meinen Fortschritt. Dafür nehme ich ${xpNote} mit. Manches bleibt, manches geht. Neu anfangen.`
        : 'Noch nicht genug gesammelt, um daraus Erfahrung zu machen. Ich sollte zuerst mehr erreichen.'
    ],
    buttons: epGain > 0
      ? [
          { label: 'Doch nicht.', onClick: () => closeDialog() },
          { label: 'Ja. Neu anfangen.', onClick: () => closeDialog(runManualResetWithAnimation) }
        ]
      : [{ label: 'Verstanden.', onClick: () => closeDialog() }]
  });

  // Die ausführliche Erklärung kommt immer beim 1. Mal (Bildung, kein
  // Sicherheits-Schritt). Der eigentliche Bestätigungsdialog danach ist
  // optional — siehe Einstellungen, "Vor Neuanfang warnen".
  const proceed = () => {
    if (settings.warnBeforeReset.erfahrung) showConfirm();
    else runManualResetWithAnimation();
  };

  if (!gameFlags.firstManualResetExplained) {
    gameFlags.firstManualResetExplained = true;
    showMonologue('Ein neuer Anfang', [
      'Mein Gold ist weg, kaum dass ich es verdient hatte. Münzen kann man mir nehmen.',
      'Aber was ich gelernt habe — wie man zupackt, wie man durchhält — das bleibt. Vielleicht sollte ich genau darauf setzen.',
      'Wenn ich jetzt alles aufgebe, was ich besitze, und ganz neu anfange — bringt mich das weiter, als es das Gold je könnte?'
    ], proceed);
  } else {
    proceed();
  }
}

/** Schaltet um, ob vor einem Neuanfang dieser Reset-"Ebene" noch ein
    Bestätigungsdialog kommt (siehe Einstellungen). */
function toggleResetWarning(id) {
  settings.warnBeforeReset[id] = !settings.warnBeforeReset[id];
  render();
}

/** Schaltet die bildschirmfüllende Übergangs-Animation beim Neuanfang
    ein/aus (siehe Einstellungen — der Schalter selbst erscheint erst,
    nachdem `gameFlags.resetAnimationSeen` einmal gesetzt wurde, siehe
    runManualResetWithAnimation()). */
function setShowResetAnimation(enabled) {
  settings.showResetAnimation = enabled;
  render();
}

/** Setzt den ausgewählten Skill-Knoten und löst einen Re-Render aus.
    Wird von den kompakten Skill-Knoten-Buttons aufgerufen. */
function selectSkillNode(id) {
  selectedSkillId = (selectedSkillId === id) ? null : id;
  render();
}

/** Rendert den Detail-Panel für den aktuell ausgewählten Skill-Knoten.
    Erscheint am unteren Rand des Skill-Baum-Containers. Null = leer. */
function renderSkillDetailPanel() {
  if (!selectedSkillId) return `<div class="ep-detail-panel ep-detail-empty">↑ Skill anklicken für Details</div>`;
  const node = EP_SKILL_TREE.find(n => n.id === selectedSkillId);
  if (!node) return '';

  const level = getSkillLevel(node.id);
  const maxed = level >= node.maxLevel;
  const epCost   = maxed ? null : node.costs[level];
  const goldCost = maxed ? null : (node.goldCosts ? node.goldCosts[level] : 0);
  const extraLocked = !maxed && typeof node.extraLock === 'function' && node.extraLock();
  const canBuy = !maxed && !extraLocked && experience.points >= epCost && resources.gold >= (goldCost || 0);
  const levelLabel = node.maxLevel > 1 ? ` · Stufe ${level}/${node.maxLevel}` : '';
  const costLabel = goldCost ? `${epCost} EP + ${goldCost} Gold` : `${epCost} EP`;

  // Super-Skill-Anzeige im Detail-Panel
  const superDef = SUPER_SKILL_DEFS.find(s => s.forSkill === node.id);
  let superHtml = '';
  if (superDef) {
    const earned = !!superSkills[superDef.id];
    if (earned) {
      superHtml = `
        <div class="ep-detail-super ep-detail-super-done">
          <span class="ep-detail-super-title">★ ${superDef.name}</span>
          <span class="ep-detail-super-effect">${superDef.shortDesc}</span>
        </div>`;
    } else if (maxed) {
      superHtml = `
        <div class="ep-detail-super ep-detail-super-hint">
          <span class="ep-detail-super-title">✦ Eine tiefere Ebene — im Lehrhaus erlernbar</span>
        </div>`;
    }
  }

  let actionHtml;
  if (maxed) {
    actionHtml = `<span class="ep-detail-done">✓ Vollständig erlernt</span>`;
  } else if (extraLocked) {
    actionHtml = `<span class="ep-detail-locked">🔒 ${node.extraLockReason}</span>`;
  } else {
    actionHtml = `<button class="action-btn ${canBuy ? '' : 'btn-disabled'}"
      onclick="buyNextSkillLevel('${node.id}')" ${canBuy ? '' : 'disabled'}>
      Erlernen — ${costLabel}
    </button>`;
  }

  return `
    <div class="ep-detail-panel">
      <div class="ep-detail-header">
        <span class="ep-detail-icon">${node.icon}</span>
        <span class="ep-detail-name">${node.name}${levelLabel}</span>
      </div>
      <p class="ep-detail-desc">${node.desc}</p>
      <div class="ep-detail-effect">${node.effect}</div>
      ${superHtml}
      ${actionHtml}
    </div>`;
}

/** Baut den kompakten Skill-Knoten-Button (Icon-only). Zustand wird durch
    CSS-Klassen kommuniziert (maxed/available/locked/selected/super). */
function epNodeIconHtml(node) {
  if (!node) return `<div class="ep-node-slot"></div>`;
  const level = getSkillLevel(node.id);
  const maxed = level >= node.maxLevel;
  const extraLocked = !maxed && typeof node.extraLock === 'function' && node.extraLock();
  const epCost = maxed ? 0 : node.costs[level];
  const canBuy = !maxed && !extraLocked && experience.points >= epCost;
  const selected = selectedSkillId === node.id;

  const superDef = SUPER_SKILL_DEFS.find(s => s.forSkill === node.id);
  const superEarned    = superDef && !!superSkills[superDef.id];
  const superAvailable = superDef && maxed && !superEarned;

  let stateClass = '';
  if (maxed)            stateClass = 'ep-node-maxed';
  else if (canBuy)      stateClass = 'ep-node-available';
  else if (extraLocked) stateClass = 'ep-node-extralocked';
  else                  stateClass = 'ep-node-locked';
  if (selected)       stateClass += ' ep-node-selected';
  if (superEarned)    stateClass += ' ep-node-super-done';
  if (superAvailable) stateClass += ' ep-node-has-super';

  const levelPips = node.maxLevel > 1
    ? `<div class="ep-node-pips">${Array.from({length: node.maxLevel}, (_, i) =>
        `<span class="ep-node-pip ${i < level ? 'ep-node-pip-filled' : ''}"></span>`).join('')}</div>`
    : '';

  const superBadge = superEarned
    ? `<span class="ep-node-super-badge ep-node-super-badge-done">★</span>`
    : superAvailable
      ? `<span class="ep-node-super-badge">✦</span>`
      : '';

  return `<div class="ep-node-slot">
    <button class="ep-node ${stateClass}" onclick="selectSkillNode('${node.id}')"
      title="${node.name}">
      ${node.icon}
      ${levelPips}
      ${superBadge}
    </button>
  </div>`;
}

/** Mittelpunkt einer von `total` gleich breiten Spalten, in Prozent —
    einzige Stelle, die "wo sitzt Spalte i" in eine Koordinate übersetzt,
    damit Fork-/Kettenlinien und Konvergenz-Linien dieselbe Geometrie
    benutzen, unabhängig von der Anzahl der Äste. */
function columnCenterPct(index, total) {
  return ((index + 0.5) / total) * 100;
}

/**
 * Skillbaum — kompaktes Icon-Node-Layout.
 * Jeder Knoten ist ein kleiner quadratischer Button (Icon-only). Ein Klick
 * wählt ihn aus und zeigt sein Detail-Panel am unteren Rand des Containers.
 * Äste basieren auf EP_TREE_BRANCHES; Sichtbarkeit per `requires`-Kette UND
 * optionalem `visibleIf`. guildPrep (requiresAll) wird am Ende separat
 * eingehängt.
 */
function renderSkillTree() {
  const total = EP_TREE_BRANCHES.length;
  const root  = EP_SKILL_TREE.find(n => n.id === 'jobLeveling');
  let html = `<div class="skill-tree">
    <div class="skill-tree-row-root">${epNodeIconHtml(root)}</div>`;

  const maxRows = Math.max(...EP_TREE_BRANCHES.map(b => b.length));

  for (let row = 0; row < maxRows; row++) {
    const rowNodes = EP_TREE_BRANCHES.map(branch =>
      branch[row] ? EP_SKILL_TREE.find(n => n.id === branch[row]) : null);

    // Sichtbarkeit: Voraussetzungen erfüllt UND ggf. visibleIf() true.
    // Für Knoten ohne explizites `requires` (erster Knoten eines Asts, der
    // implizit von der Wurzel jobLeveling abzweigt) gilt: Wurzel gekauft?
    const visible = rowNodes.map((node, i) => {
      if (!node) return false;
      const req = node.requires;
      const reqsMet = req
        ? getSkillLevel(req) >= 1
        : getSkillLevel(SKILL_ID.JOB_LEVELING) >= 1;
      const visOk = typeof node.visibleIf !== 'function' || node.visibleIf();
      return reqsMet && visOk;
    });

    if (!visible.some(Boolean)) break;

    // ── Konnektor-Reihe ──────────────────────────────────────
    if (row === 0) {
      // Gabel von der Wurzel zu allen Ästen auf Tiefe 0
      const visibleCols = rowNodes.map((n, i) => visible[i] ? i : -1).filter(i => i >= 0);
      if (visibleCols.length) {
        const left  = columnCenterPct(visibleCols[0], total);
        const right = columnCenterPct(visibleCols[visibleCols.length - 1], total);
        const stems = visibleCols.map(i =>
          `<div class="stl-stem" style="left:${columnCenterPct(i, total)}%; top:11px; bottom:0;"></div>`).join('');
        html += `<div class="skill-connector">
          <div class="stl-stem" style="left:50%; top:0; height:11px;"></div>
          <div class="stl-bar"  style="left:${left}%; right:${100 - right}%; top:11px;"></div>
          ${stems}
        </div>`;
      }
    } else {
      // Tiefere Zeilen: einfache Stämme pro sichtbarer Spalte.
      // Sonderfall: fieldPay (Spalte 1, Zeile 1) hängt an fieldworkMemory
      // (Spalte 0, Zeile 1 = vorherige Zeile), nicht an einem unsichtbaren
      // Knoten in Zeile 0 / Spalte 1. Wir zeichnen dafür einen
      // Gabelarm vom vorherigen Spalten-Center herüber.
      const stemParts = rowNodes.map((node, i) => {
        if (!visible[i]) return '';
        const req = node.requires;
        if (!req) return `<div class="stl-stem" style="left:${columnCenterPct(i, total)}%;"></div>`;
        // Liegt der Elternteil in einer anderen Spalte in der SELBEN Zeile
        // (nicht in Zeile 0 = root)? → kreuzender Gabelarm
        const parentCol = EP_TREE_BRANCHES.findIndex(b => b[row - 1] === req || b[row] === req);
        if (parentCol >= 0 && parentCol !== i) {
          const from = columnCenterPct(parentCol, total);
          const to   = columnCenterPct(i, total);
          const barL = Math.min(from, to);
          const barR = 100 - Math.max(from, to);
          return `<div class="stl-stem" style="left:${from}%;"></div>
                  <div class="stl-bar" style="left:${barL}%; right:${barR}%; top:11px;"></div>
                  <div class="stl-stem" style="left:${to}%; top:11px; bottom:0;"></div>`;
        }
        return `<div class="stl-stem" style="left:${columnCenterPct(i, total)}%;"></div>`;
      }).join('');
      html += `<div class="skill-connector">${stemParts}</div>`;
    }

    const cells = rowNodes.map((node, i) =>
      `<div class="skill-tree-cell">${visible[i] ? epNodeIconHtml(node) : '<div class="ep-node-slot"></div>'}</div>`
    ).join('');
    html += `<div class="skill-tree-row" style="grid-template-columns: repeat(${total}, 1fr);">${cells}</div>`;
  }

  // ── Konvergenzknoten guildPrep (benötigt BEIDE Endpunkte) ────
  const guildNode = EP_SKILL_TREE.find(n => n.id === 'guildPrep');
  const guildReqs = getNodeRequirements(guildNode);
  if (guildReqs.every(reqId => getSkillLevel(reqId) >= 1)) {
    const idxA = EP_TREE_BRANCHES.findIndex(b => b.includes(guildReqs[0]));
    const idxB = EP_TREE_BRANCHES.findIndex(b => b.includes(guildReqs[1]));
    const pA = columnCenterPct(idxA, total);
    const pB = columnCenterPct(idxB, total);
    html += `<div class="skill-connector">
      <div class="stl-stem" style="left:${pA}%; top:0; height:11px;"></div>
      <div class="stl-stem" style="left:${pB}%; top:0; height:11px;"></div>
      <div class="stl-bar"  style="left:${pA}%; right:${100 - pB}%; top:11px;"></div>
      <div class="stl-stem" style="left:50%; top:11px; bottom:0;"></div>
    </div>
    <div class="skill-tree-row-root">${epNodeIconHtml(guildNode)}</div>`;
  }

  html += `</div>`;
  return html;
}

/** Rendert den paranoiden Einzel-Spalten-Baum rechts neben dem normalen Baum.
    Jeder Knoten wird erst sichtbar, wenn sein Vorgänger gekauft wurde.
    Nur angezeigt nach dem 4. Raub — der Beschreibungstext setzt das voraus. */
function renderParanoidTree() {
  if (!gameFlags.robbery4Triggered && skills.paranoid < 1) return '';
  const root = EP_SKILL_TREE.find(n => n.id === 'paranoid');
  if (!root) return '';

  let html = `<div class="skill-tree paranoid-skill-tree">
    <div class="skill-tree-row-root">${epNodeIconHtml(root)}</div>`;

  for (const id of PARANOID_BRANCHES[0]) {
    const node = EP_SKILL_TREE.find(n => n.id === id);
    if (!node) continue;
    if (getSkillLevel(node.requires) < 1) break;
    html += `<div class="skill-connector"><div class="stl-stem" style="left:50%;"></div></div>`;
    html += `<div class="skill-tree-row" style="grid-template-columns: 1fr;">
      <div class="skill-tree-cell">${epNodeIconHtml(node)}</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

/* ── Erfahrungs-Seite ─────────────────────────────────────── */
function renderErfahrung(el) {
  const isFirstReset = meta.resets === 0;
  const epGain = computeEpGain(isFirstReset);
  const canReset = isFirstReset || epGain > 0;

  let epEffectText;
  if (isFirstReset) {
    epEffectText = '+1 Erfahrung (erster Neuanfang)';
  } else if (resources.gold < RESET_MIN_GOLD) {
    epEffectText = `Noch ${RESET_MIN_GOLD - resources.gold} Gold bis zum ersten Erfahrungspunkt`;
  } else if (!skills.goldBreakthrough) {
    epEffectText = `+${epGain} Erfahrung — mehr Gold allein hilft mir ohne mehr Weitblick nicht weiter`;
  } else {
    const nextTarget = getNextEpGoldTarget();
    epEffectText = `+${epGain} Erfahrung` +
      (nextTarget ? ` — noch ${nextTarget - resources.gold} Gold bis zum nächsten Punkt` : ' (höchster Meilenstein erreicht)');
  }

  // "Neu anfangen"-Karte nur sichtbar wenn:
  // - Paranoid gekauft (neues System), ODER
  // - storyState bereits in Kapitel 2 (Altspeicherstand)
  const showResetCard = skills.paranoid >= 1 || storyState >= 20100 || !gameFlags.newRobberySystemActive;

  const resetCard = showResetCard ? `
    <div class="action-card action-card-primary">
      <div class="action-card-icon">✦</div>
      <div class="action-card-name">Neu anfangen</div>
      <p class="action-card-desc">
        Ich gebe alles auf, was ich besitze — und behalte trotzdem, was ich daraus gelernt habe.
      </p>
      <div class="action-card-effect">${epEffectText}</div>
      <button class="action-btn action-btn-primary ${canReset ? '' : 'btn-disabled'}" onclick="startManualReset()" ${canReset ? '' : 'disabled'}>
        Neu anfangen
      </button>
    </div>` : '';

  const hasTree    = meta.resets > 0;
  const hasLessons = gameFlags.foremanBonusGiven;

  const lifeLessonsHtml = () => `
    <p class="erfahrung-section-intro">Was das Leben mich gelehrt hat, ganz ohne bewusste Entscheidung.</p>
    <div class="action-grid">
      <div class="action-card quest-card-done">
        <div class="action-card-icon">🍺</div>
        <div class="action-card-name">Anerkennung des Vorarbeiters</div>
        <p class="action-card-desc">Harte Arbeit ist dem Vorarbeiter aufgefallen — und er hat ein gutes Wort für mich eingelegt.</p>
        <div class="action-card-effect">+1 Gold pro Feldarbeit, dauerhaft</div>
      </div>
    </div>`;

  // Beide Bäume nebeneinander + gemeinsames Detail-Panel darunter.
  // Der paranoide Baum erscheint nur wenn resetLayerUnlocked (nach Raub 1).
  const skillTreeWithIntro = () => {
    const paranoidHtml = renderParanoidTree();
    const wrapperClass = paranoidHtml ? 'skill-trees-container skill-trees-dual' : 'skill-trees-container';
    return `
      <p class="erfahrung-section-intro">Was ich mir bewusst beigebracht habe, und mir niemand mehr nehmen kann.</p>
      <div class="${wrapperClass}">
        <div class="skill-tree-column">${renderSkillTree()}</div>
        ${paranoidHtml ? `<div class="skill-tree-column skill-tree-paranoid-column">${paranoidHtml}</div>` : ''}
      </div>
      ${renderSkillDetailPanel()}`;
  };

  // Beide Bereiche gleichzeitig sichtbar → echte Tabs zum Umschalten
  // (siehe erfahrungTab, state.js). Ist nur einer der beiden relevant,
  // braucht es keine Tab-Leiste — eine einzelne Sektion reicht.
  let lowerSection = '';
  if (hasTree && hasLessons) {
    lowerSection = `
      <div class="tab-bar">
        <button class="tab-btn ${erfahrungTab === EP_TAB.SKILLS ? 'active' : ''}" onclick="setErfahrungTab('${EP_TAB.SKILLS}')">Skillbaum</button>
        <button class="tab-btn ${erfahrungTab === EP_TAB.LESSONS ? 'active' : ''}" onclick="setErfahrungTab('${EP_TAB.LESSONS}')">Lektionen</button>
</div>
      <div class="tab-panel">${erfahrungTab === EP_TAB.SKILLS ? skillTreeWithIntro() : lifeLessonsHtml()}</div>`;
  } else if (hasTree) {
    lowerSection = skillTreeWithIntro();
  } else if (hasLessons) {
    lowerSection = lifeLessonsHtml();
  }

  const sidebar = meta.resets >= 1 ? `
    <div class="erfahrung-sidebar">
      <div class="feature-stage-label">Erfahrung</div>
      <p class="location-card-desc">
        Was nützt mir noch Gold, das mir ohnehin gestohlen werden kann? Vielleicht sollte ich
        lieber in mich selbst investieren — Fähigkeiten, die mir niemand wegnehmen kann.
      </p>
      <div class="reward-info">Erfahrung: <span class="gold-amount">${experience.points} EP</span></div>
      ${resetCard}
    </div>` : '';

  el.innerHTML = `
    <div class="feature-stage erfahrung-page">
      <div class="erfahrung-layout">
        ${sidebar}
        <div class="erfahrung-main">${lowerSection}</div>
      </div>
    </div>
  `;
}

/** Wechselt zwischen Skillbaum und "Was das Leben mich gelehrt hat". */
function setErfahrungTab(tab) {
  erfahrungTab = tab;
  render();
}
