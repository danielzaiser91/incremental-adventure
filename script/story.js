/* ══════════════════════════════════════════════════════════════
   story.js — Story-Registry
   Jeder Eintrag ist sowohl Quelle für den einmaligen Dialog-Popup
   als auch für den späteren Nachlese-Eintrag in der Chronik.
   Alle Texte sind aus der Ich-Perspektive der Spielfigur geschrieben —
   es handelt sich um ihre eigenen Gedanken/Erinnerungen, nie um eine
   "Du"-Anrede.
   Freischaltung über EINES von zwei Feldern:
   - unlockState: Eintrag erscheint, sobald storyState >= unlockState.
   - unlockFlag:  Eintrag erscheint, sobald die Funktion true liefert
     (für Ereignisse, die nicht an storyState hängen, z.B. "erster Schlaf").
   ══════════════════════════════════════════════════════════════ */

'use strict';

const STORY_ENTRIES = [
  {
    id:          '1.1',
    title:       'Das Stadttor',
    unlockState: 10101,
    text: [
      'Der Hof meiner Familie gab nie mehr her als Mehltau im Korn und einen Vater, der mehr fluchte als hoffte. Sechzehn Jahre habe ich davon geträumt, hier wegzukommen.',
      'Jetzt ist es so weit! Reichtum, Ruhm, Macht — ich will das alles. Raus aus dem Acker, hinein in ein Leben, das wirklich mir gehört. Ich kann es kaum erwarten.',
      'Treutheim liegt vor mir — die erste Stadt auf meinem Weg. Hier beginnt es: ein Job, etwas Gold, und der erste Schritt zum Abenteurer.'
    ]
  },
  {
    id:          '1.2',
    title:       'Zwielichtige Begegnung',
    unlockState: 10102,
    text: [
      'Ein Mann tritt aus dem Schatten einer Gasse.',
      'Seinen Namen kenne ich nicht. Aber seinen Blick werde ich nicht vergessen — er klebt an meinem Geldbeutel, nicht an meinem Gesicht.',
      'Er sagt kein Wort. Muss er auch nicht. Ab jetzt halte ich mein Gold dichter bei mir.'
    ]
  },
  {
    id:         '1.3',
    title:      'Die erste Nacht',
    unlockFlag: () => gameFlags.firstSleepTriggered,
    text: [
      'Jeder Knochen schwer. Der erste Tag ist vorbei. Nur der erste.',
      'Ehrlich? Hässlicher, als ich dachte. Schuften für ein paar Münzen, die kaum für Brot reichen.',
      'War es das, wofür ich mein Zuhause verlassen habe?',
      'Aber zuhause wartet derselbe Acker. Derselbe Tag, der sich wiederholt, bis er einen aufreibt.',
      'Nein. Ich will mehr sein als ein Paar müde Hände. Ich will ein Abenteurer werden.',
      'Manchmal, wenn ich erschöpft genug bin, spüre ich etwas Unerklärliches. Ein Kribbeln, das mehr verspricht, als ich mir einbilden sollte.',
      'Morgen geht es weiter. Wenn niemand es für mich ändert, ändere ich es selbst.'
    ]
  },
  {
    id:          '1.4',
    title:       'Der erste Raub',
    unlockState: 10103,
    text: [
      'Der Griff kommt, bevor ich ihn höre. Eine Hand um mein Handgelenk, ein Ruck — ich bin in der Gasse, Rücken gegen Stein, bevor mein Gehirn aufgeholt hat.',
      'Der Fremde steht vor mir. Ruhig. Er hat nicht mal die Kapuze hochgezogen.',
      '»Hübsche Summe für einen Neuankömmling«, sagt er. Nimmt den Geldbeutel von meiner Hüfte, als würde er ihm gehören.',
      'Ich will etwas sagen. Tue es nicht. Er ist schon auf halbem Weg aus der Gasse.',
      '»Bis bald«, sagt er über die Schulter. Dann ist er weg.',
      'Meine Hände zittern. Nicht aus Angst. Aus blankem Unglauben.',
      'Das passiert mir kein zweites Mal.'
    ]
  },
  {
    id:          '1.5',
    title:       'Der zweite Raub',
    unlockState: 10104,
    text: [
      'Der Marktplatz, Mittag — hundert Menschen, Stimmen, Geruch nach gebratenem Fleisch. Diesmal halte ich den Geldbeutel unter dem Arm.',
      'Nicht fest genug.',
      'Ein Ellenbogen in meine Seite. Eine Drehung. Er ist schon drei Schritte weg, bevor ich aufgehört habe zu stolpern.',
      'Er dreht sich einmal um. Sieht mich direkt an — und zwinkert.',
      'Volles Tageslicht. Hundert Zeugen. Er hat sich nicht mal die Mühe gemacht, sein Gesicht zu verbergen.',
      'Ich kann mich nicht rühren vor Wut. Er kennt mich. Er weiß, wann ich komme.'
    ]
  },
  {
    id:          '1.6',
    title:       'Der dritte Raub',
    unlockState: 10105,
    text: [
      'Ich höre das Rascheln einen Atemzug zu spät.',
      'Ein Stoß in meinen Rücken — ich taumle, Schulter gegen Mauerstein. Als ich mich umdrehe, ist er weg.',
      'Kein Griff, kein Wort, nicht mal Augenkontakt. Nur eine Geste, so beiläufig wie das Aufheben einer Münze vom Boden.',
      'Ich lehne gegen die Wand. Warte, bis die Hände aufhören zu zittern.',
      'Er hat mich nicht mal für würdig befunden, ihn anzusehen.',
      'Das ist nicht Pech. Das ist System. Jemand weiß, wo ich bin — wann ich komme, wie viel ich trage.',
      'Das nächste Mal lasse ich ihn nicht entkommen.'
    ]
  },
  {
    id:          '1.7',
    title:       'Der vierte Raub',
    unlockState: 10106,
    text: [
      'Er wartet auf mich. Offen. Unverdeckt. Lehnt an der Mauer, Arme verschränkt, als hätte er die ganze Zeit gewusst, dass ich hier entlangkomme.',
      '»Langsam lernst du«, sagt er, bevor ich auch nur stehenbleibe. »Aber noch nicht schnell genug.«',
      'Er macht einen Schritt auf mich zu. Ich weiche zurück. Ich — ich weiche zurück.',
      'Er nimmt das Gold. Ohne Eile. Ohne Gerangel. Als wäre es längst beschlossene Sache.',
      '»Bis zum nächsten Mal.«',
      'Er dreht sich um und geht. Einfach geht. Als wäre ich keine Bedrohung. Als wäre ich nichts.',
      'Nein. Nicht noch einmal. Ich fange anders an — mit dem Kopf, nicht mit den Händen.'
    ]
  },
  {
    id:          '1.8',
    title:       'Paranoid',
    unlockFlag:  () => skills.paranoid >= 1,
    text: [
      'Jedes Geräusch. Jede Schulter, die sich zu früh dreht. Jeder Schatten, der einen Moment zu lang steht.',
      'Ja — ich bin paranoid. Ich sage es mir laut vor, manchmal. Als würde es dadurch irgendwie besser.',
      'Aber es macht mich schärfer. Ich sehe jetzt Muster, die ich früher für Zufall gehalten hätte.',
      'Ich fange von vorn an — nicht weil ich muss. Weil ich es will. Klüger diesmal.'
    ]
  },

  /* ══ KAPITEL 2: Die Spur des Diebs ════════════════════════ */

  {
    id:          '2.1',
    title:       'Erstes Blut',
    unlockState: 20101,
    text: [
      'Das Rascheln hinter mir — ich wirbele herum, bevor ich denke.',
      'Alles passiert zu schnell für Angst. Ein Hieb, ein Taumel, Staub in meinem Mund. Dann Stille.',
      'Ich stehe über dem gestürzten Räuber und merke erst jetzt, wie laut mein Atem ist.',
      'Das erste Mal. Ich hatte erwartet, mich schlechter zu fühlen.',
      'Stattdessen: eine merkwürdige, klare Ruhe. Und eine Erkenntnis — ich bin nicht mehr derselbe, der in Treutheim ankam.',
      'Dieser hier hat sich gewehrt. Ich auch.'
    ]
  },
  {
    id:          '2.2',
    title:       'Korbins Geheimnis',
    unlockFlag:  () => gameFlags.korbinChapter2Talked,
    text: [
      'Korbin zieht mich nah an sich heran, sein Atem riecht nach Bier und Vorsicht.',
      '"Drei Neue in diesem Monat. Immer dasselbe: ankommen, schuften, beraubt werden. Du bist nicht der Erste, Fremder."',
      '"Es gibt jemanden in dieser Stadt, den alle hier den Schatten nennen. Er wählt die Neuen aus. Jemanden, dem er vertraut, schickt er vor — einen Beobachter. Der entscheidet, ob jemand lohnend genug ist."',
      'Mir wird kalt, obwohl die Taverne warm ist.'
    ]
  },
  {
    id:          '2.3',
    title:       'Eine Spur im Dunkeln',
    unlockFlag:  () => gameFlags.theftClueFoundInJagdgebiet,
    text: [
      'Zwischen den armseligen Habseligkeiten eines Räubers, den ich eben niedergestreckt habe, finde ich etwas.',
      'Eine Münze. Meine Münze — ich erkenne den eingestanzten Kratzer, den ich selbst einmal durch einen Sturz verursacht habe.',
      'Der Dieb hat das Gold nicht behalten. Er hat es weitergegeben — an jemanden hier draußen, der mit diesen Räubern in Verbindung steht.',
      'Das ist kein einfacher Straßenraub. Das ist ein Netzwerk.'
    ]
  },
  {
    id:          '2.4',
    title:       'Miras wahres Gesicht',
    unlockFlag:  () => gameFlags.miraRevealedInfo,
    text: [
      'Mira lächelt nicht mehr. Zum ersten Mal seit ich sie kenne, fühlt sich das Gespräch mit ihr wie eines unter Gleichen an.',
      '"Der Brief, den ich dir für Brakka gegeben habe — es war eine Warnung. Brakka weiß, wer der Schatten ist. Er hat nur nie geredet."',
      '"Ich auch nicht. Weil es gefährlich ist, zu reden. Aber du fragst. Und das verändert etwas."',
      'Sie dreht sich weg, als könnte sie es bereuen, wenn sie mich noch länger ansieht.'
    ]
  },
  {
    id:          '2.5',
    title:       'Brakkas Schweigen bricht',
    unlockFlag:  () => gameFlags.brakkaRevealedSuspect,
    text: [
      'Brakka stellt den Hammer ab. Das erste Mal, seit ich ihn kenne.',
      '"Der Mann, der immer in der Taverne sitzt — er ist kein Dieb. Er ist der Voraussucher. Er beobachtet, er wählt aus, er meldet zurück."',
      '"Ich kenne dieses Gesicht seit Jahren. Er hat immer zugeschaut. Ich war zu feige, etwas zu sagen."',
      'Er sieht mich an, schwer wie Eisen. "Wenn du das beenden willst — hab etwas in der Hand, wenn du ihn stellst."'
    ]
  },
  {
    id:          '2.6',
    title:       'Die Konfrontation',
    unlockFlag:  () => gameFlags.fremderConfronted,
    text: [
      'Ich lege die Münze auf den Tisch zwischen uns. Der Fremde rührt sich nicht.',
      '"Du bist nicht wie die anderen", sagt er schließlich, leiser als ich erwartet hatte. "Die anderen haben aufgehört. Du nicht."',
      '"Ich habe dich ausgewählt. Nicht nur, um dich auszurauben — um zu sehen, was du daraus machst."',
      'Er schiebt die Münze zurück zu mir. "Der Schatten wird wissen wollen, wer du bist. Ich werde ihm sagen, dass du jemand bist, mit dem man rechnen muss."',
      'Ich nehme die Münze. Kein Sieg. Keine Niederlage. Nur: eine neue Rechnung, offen.'
    ]
  },
  {
    id:          '2.7',
    title:       'Das Ende des Anfangs',
    unlockState: 20200,
    text: [
      'Ich sitze auf den Stufen vor der Taverne und denke nach.',
      'Ich bin angekommen als Niemand. Ein Bauernjunge mit leeren Taschen und vollen Träumen.',
      'Jetzt? Ich habe Blut vergossen, Gold verdient und verloren, Freunde gemacht und Feinde entdeckt, die ich nicht mal gesucht hatte.',
      'Treutheim ist nicht das Ziel. Es war immer nur die erste Station.',
      'Der Schatten ist noch da draußen. Und er weiß, dass ich existiere.',
      'Das ist kein Ende. Das ist der Beginn von etwas viel Größerem.'
    ]
  },

  /* ── Kapitel 3: Lethkar ──────────────────────────────────── */
  {
    id:          '3.0',
    title:       'Lethkar',
    unlockFlag:  () => gameFlags.lethkarUnlocked,
    text: [
      'Drei Tage Weg. Keine Räuber — aber auch keine Gastfreundschaft.',
      'Lethkar ist größer als Treutheim. Andere Gerüche, andere Gesichter. Hier weiß niemand, wer ich bin.',
      'Das ist ein Vorteil. Vielleicht.',
      'Die Adresse aus dem Brief liegt nördlich des Markts. Aber ich gehe nicht hin. Noch nicht.'
    ]
  },
  {
    id:          '3.1',
    title:       'Erste Schritte in Lethkar',
    unlockFlag:  () => gameFlags.varenaMetFirst,
    text: [
      'In der Taverne sitzt eine Frau mit einem Alchemistenabzeichen und schaut mich so an, als hätte sie erwartet, dass ich komme.',
      '"Du siehst aus wie jemand, der aus Treutheim kommt." Ich frage mich, was man mir ansieht.',
      'Varena. Ihr Name bleibt hängen. Und die Art, wie sie redet — präzise. Kein Wort zu viel.'
    ]
  },
  {
    id:          '3.2',
    title:       'Der entschlüsselte Brief',
    unlockFlag:  () => gameFlags.varenaDecodedBrief,
    text: [
      '"Valdris." Der Name liegt jetzt in der Luft, nicht mehr auf Papier.',
      'Ich weiß, wo das Haus ist. Ich weiß, dass ich nicht allein hingehen soll.',
      'Mira hat mir mehr mitgegeben als ich dachte. Ich hoffe, dass sie weiß, was sie getan hat.'
    ]
  },
  {
    id:          '3.3',
    title:       'Das Laboratorium',
    unlockFlag:  () => alchemie.unlocked,
    text: [
      'Es riecht nach Schwefel, nassen Steinen und irgendwas Süßlichem, das ich nicht einordnen kann.',
      'Varena zeigt mir die fünf Aspekte. Feuer, Wasser, Erde, Luft — und Äther.',
      '"Das hier ist kein Handwerk." Sie tippt auf den Tisch. "Das ist Verstehen."',
      'Ich glaube ihr. Das bedeutet nicht, dass ich es schon tue.'
    ]
  },
  {
    id:          '3.4',
    title:       'Thessa und ihre Bücher',
    unlockFlag:  () => gameFlags.thessaTrustGained,
    text: [
      '"Du weißt mehr als du zeigst", sagt Thessa. "Das ist gut."',
      'Sie schiebt mir ein Buch über den Tisch — Aufzeichnungen über Lethkarer Händler-Netzwerke. Namen, Verbindungen, Schulden.',
      'Valdris\' Name taucht dreimal auf. Immer als Gläubiger. Nie als Schuldner.',
      'Das erklärt einiges. Und macht es komplizierter.'
    ]
  },
  {
    id:          '3.5',
    title:       'Pereth und das Lagerhaus',
    unlockFlag:  () => gameFlags.perethQuestStarted,
    text: [
      '"Du bist der Typ, der aus Treutheim kommt und Fragen über Valdris stellt." Pereth ist direkter als ich erwartet hatte.',
      '"Ich hab für ihn gearbeitet. Einmal reicht." Er lehnt sich zurück. "Das Lagerhaus am Südtor gehört einem seiner Strohleute."',
      '"Was da drin ist, weiß ich nicht. Aber ich will es wissen. Und du kannst rein, ohne aufzufallen."',
      'Ich sage ja. Ich bin mir nicht sicher, ob das klug war.'
    ]
  },
  {
    id:          '3.6',
    title:       'Die Schatten-Organisation',
    unlockFlag:  () => gameFlags.chapter3StoryComplete,
    text: [
      'Es ergibt jetzt ein Bild. Kein vollständiges — aber genug.',
      'Valdris ist kein Söldnerführer. Er ist ein Knotenpunkt. Informationen, Geld, Leute — alles fließt durch ihn.',
      '"Der Schatten" ist größer als ich gedacht hatte. Valdris ist nur ein Name.',
      'Hinter ihm steckt mehr. Und es weiß, dass ich hier bin.'
    ]
  },
  {
    id:          '3.7',
    title:       'Einsicht I',
    unlockFlag:  () => gameFlags.valdrisOperationRaided,
    text: [
      'Das Lager ist leer. Zu leer — jemand wusste, dass ich komme. Oder sie sind von sich aus gegangen.',
      'Aber ich finde, was sie zurückgelassen haben: Listen. Routen. Quittungen für Dienste, die keine Namen tragen.',
      'Und überall dasselbe Muster. Nicht Raub — Kontrolle. Schulden, Geheimnisse, Loyalitäten.',
      'Valdris baut kein Netzwerk von Verbrechern. Er baut ein Netz aus Menschen, die ihm etwas schulden.',
      'Das ist schwerer zu zerstören als eine Bande. Viel schwerer.'
    ]
  },
  {
    id:          '3.8',
    title:       'Der Name',
    unlockFlag:  () => gameFlags.varenaRevealedValdrisIdent,
    text: [
      '"Du hast das Lager gefunden." Varena sagt es ohne Überraschung. "Das bedeutet, er zieht sich zurück."',
      '"Valdris ist nicht von hier. Er kommt aus dem Osten — aus einer Stadt, die auf Handelsrouten gebaut wurde."',
      '"Was er hier macht, ist ein Vorposten. Lethkar ist nicht sein Ziel. Es ist sein Sprungbrett."',
      'Ich frage, wohin er springt. Sie schüttelt den Kopf.',
      '"Das ist die Frage, die du beantworten musst. Ich kenne nur den Namen — und dass er nicht aufhört."'
    ]
  },
  {
    id:          '3.9',
    title:       'Einsicht II',
    unlockFlag:  () => gameFlags.alchemieGeselleReached,
    text: [
      'Ich sitze über den Aspekten und merke plötzlich: ich denke anders.',
      'Nicht nur über Alchemie. Über Verbindungen. Wie Wasser durch Risse fließt. Wie Feuer Formen annimmt.',
      'Pereth hat Gold genommen und Wissen gegeben. Varena hat Namen getauscht gegen Vertrauen. Thessa hat Bücher gegen Zeit geöffnet.',
      'Valdris tut dasselbe — nur in die andere Richtung. Er nimmt Loyalität und gibt Schulden zurück.',
      'Ich verstehe jetzt, womit ich es zu tun habe. Und das ist mehr wert als jede Waffe.'
    ]
  },
  {
    id:          '3.10',
    title:       'Der nächste Horizont',
    unlockFlag:  () => gameFlags.kap3Complete,
    text: [
      'Lethkar hat mich verändert. Nicht auf die Art, die ich erwartet hatte.',
      'Ich bin stärker — aber das war vorhersehbar. Ich bin klüger — das auch.',
      'Was ich nicht erwartet hatte: ich habe aufgehört, Valdris zu fürchten.',
      'Er ist real. Er ist gefährlich. Aber er ist kein Schatten mehr — er ist ein Mensch mit einem Plan.',
      'Und ich bin jemand, der Pläne lesen kann.',
      'Der Weg führt weiter nach Osten. Dorthin, woher er kommt.',
      'Ich weiß noch nicht, was mich dort erwartet. Aber ich weiß, wer ich bin, wenn ich ankomme.'
    ]
  },

  /* ── Kapitel 4: Velmark ──────────────────────────────────── */
  {
    id:          '4.1',
    title:       'Velmark',
    unlockFlag:  () => gameFlags.velmarkUnlocked,
    text: [
      'Velmark. Größer als Lethkar. Lauter. Mehr Stimmen, mehr Gerüche, mehr Menschen die nichts voneinander wissen wollen.',
      'Niemand kennt mich hier.',
      'Gut. Ich kenne auch niemanden.',
      'Zum ersten Mal seit Treutheim bin ich wieder ein Niemand — aber diesmal weiß ich, was das bedeutet.',
      'Es bedeutet: Ich kann wählen, wer ich hier werde.'
    ]
  },
  {
    id:          '4.2',
    title:       'Drei Säulen',
    unlockFlag:  () => gameFlags.gildekontaktGeknuepft || gameFlags.bruderschaftkontaktGeknuepft || gameFlags.archivkontaktGeknuepft,
    text: [
      'Velmark wird von drei Kräften zusammengehalten.',
      'Die Händlergilde: wer zahlt, hat Recht. Alte Logik, aber sie funktioniert.',
      'Die Eiserne Bruderschaft: Söldner, Wachen, Männer mit Muskeln und kurzen Gedächtnissen. Aber sie hören auf Stärke.',
      'Das Stadtarchiv: Aufzeichnungen, Legitimität, Geschichte. Die leiseste der drei — und wahrscheinlich die mächtigste.',
      'Und irgendwo in allen dreien: Valdris. Nicht sichtbar. Aber spürbar.'
    ]
  },
  {
    id:          '4.3',
    title:       'Pereth, wieder',
    unlockFlag:  () => gameFlags.perethFoundInVelmark,
    text: [
      'Er sitzt in einer Taverne am Westkai, als wäre er nie weg gewesen.',
      '"Ich hab mich gefragt, wann du auftauchst." Kein Hallo. Kein Überraschung.',
      'Er ist nicht mehr für Valdris tätig — er ist ihm einen Schritt voraus. Und einen hinter mir.',
      'Er kennt diese Stadt. Er hat hier für Valdris Kontakte aufgebaut.',
      '"Jetzt weiß ich, wie sein Netz funktioniert. Das macht mich nützlich für dich. Und gefährlich für ihn."'
    ]
  },
  {
    id:          '4.4',
    title:       'Der erste Schritt',
    unlockFlag:  () => gameFlags.ersteAllianzGeknuepft,
    text: [
      'Ich habe angefangen, ein Gesicht zu werden in dieser Stadt.',
      'Die erste Fraktion ist aufgetaut — langsam, vorsichtig, wie alles hier.',
      'Es fühlt sich anders an als in Treutheim oder Lethkar.',
      'Dort bin ich gewachsen. Hier muss ich etwas anderes sein: überzeugend.',
      'Vertrauen hier ist keine Frage der Kraft oder des Wissens. Es ist eine Frage der Zeit.'
    ]
  },
  {
    id:          '4.5',
    title:       'Der Brief',
    unlockFlag:  () => gameFlags.valdrisBriefErhalten,
    text: [
      'Ein Brief. Kein Absender. Aber die Handschrift kenne ich nicht — und trotzdem weiß ich sofort, von wem er ist.',
      '"Ich habe bemerkt, dass du in Velmark angekommen bist. Kein Zufall, nehme ich an."',
      '"Wir könnten reden, wenn du möchtest. Unverbindlich."',
      'Er weiß, dass ich hier bin. Er fragt nicht, was ich will — er setzt voraus, dass wir dasselbe wollen.',
      'Das ist die gefährlichste Art von Feind: einer, der nicht falsch liegt.'
    ]
  },
  {
    id:          '4.6',
    title:       'Zwei Säulen',
    unlockFlag:  () => gameFlags.zweiAllianzGekuepft,
    text: [
      'Zwei von drei.',
      'Die Stadt beginnt, mich anders anzusehen — nicht mehr als Fremden, sondern als jemanden, der bleibt.',
      'Valdris macht Gegenzüge. Kleine Dinge: ein Lieferant der nicht kommt, ein Gespräch das abgebrochen wird.',
      'Er weiß, was ich tue. Aber er kann es noch nicht stoppen.',
      'Ein Netz, das auf Schulden gebaut ist, hat eine Schwäche: Die Schulden müssen auch irgendwann vergessen werden.'
    ]
  },
  {
    id:          '4.7',
    title:       'Das Angebot',
    unlockFlag:  () => gameFlags.valdrisAngebotGemacht,
    text: [
      'Er sitzt mir gegenüber. Zum ersten Mal.',
      'Er ist jünger als ich dachte. Ruhiger. Kein Messer, kein Wächter in Sichtweite.',
      '"Ich baue etwas Dauerhaftes", sagt er. "Du auch. Das sieht man."',
      '"Warum nicht zusammen? Du bekommst, was du willst — und ich bekomme, was ich will."',
      'Ich habe keine Antwort. Nicht sofort.',
      'Das ist das härteste Gespräch meines Lebens.'
    ]
  },
  {
    id:          '4.8',
    title:       'Keine Kompromisse',
    unlockFlag:  () => gameFlags.valdrisAngebotAbgelehnt,
    text: [
      'Ich habe Nein gesagt.',
      'Nicht weil ich ein besserer Mensch bin. Nicht wegen irgendeiner Moral.',
      'Sondern weil sein "Dauerhaftes" auf anderen liegt — und das wäre bald auf mir.',
      'Er hat nichts gesagt. Er ist gegangen.',
      'Jetzt ist es kein Gespräch mehr. Jetzt ist es etwas anderes.'
    ]
  },
  {
    id:          '4.9',
    title:       'Das Netz steht',
    unlockFlag:  () => gameFlags.allianzKomplett,
    text: [
      'Alle drei.',
      'Es hat länger gedauert als gedacht. Manches hat mich Dinge gekostet, die ich nicht zurückbekomme.',
      'Aber das Netz steht — meines, nicht seines.',
      'Valdris ist eingekreist. Nicht militärisch. Politisch.',
      'Er kann nirgends mehr hin, ohne jemanden zu verraten, der jetzt bei mir steht.'
    ]
  },
  {
    id:          '4.10',
    title:       'Das Ende des Weges',
    unlockFlag:  () => gameFlags.kap4Complete,
    text: [
      'Er wusste es natürlich.',
      'Das letzte Gespräch war kurz. Kürzer als ich erwartet hatte.',
      'Er hat nicht gezögert, nicht gefeilscht. Er hat die Lage gesehen — und gezogen.',
      'Velmark gehört wieder sich selbst. Das Netz ist zerschnitten.',
      'Treutheim, Lethkar, Velmark.',
      'Ich bin nicht mehr derselbe, der dort an diesem Stadttor gestanden hat.',
      'Gut so.'
    ]
  }
];

/** Findet einen Story-Eintrag per ID. */
function getStoryEntry(id) {
  return STORY_ENTRIES.find(e => e.id === id);
}

/** Prüft, ob ein Story-Eintrag laut seinem Freischalt-Kriterium sichtbar ist. */
function isStoryEntryUnlocked(entry) {
  if (entry.unlockState !== undefined) return storyState >= entry.unlockState;
  if (entry.unlockFlag) return entry.unlockFlag();
  return false;
}

/** Liefert alle Einträge, die bereits freigeschaltet sind, sortiert nach ID. */
function getUnlockedStoryEntries() {
  return STORY_ENTRIES
    .filter(isStoryEntryUnlocked)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/**
 * Zeigt den Dialog zu einem Story-Eintrag genau einmal an (beim ersten Freischalten).
 * @param {string} id
 * @param {Function} [onClose] - wird nach dem Schließen aufgerufen
 */
function maybeShowStoryDialog(id, onClose) {
  if (shownDialogs.includes(id)) {
    if (onClose) onClose();
    return;
  }
  const entry = getStoryEntry(id);
  if (!entry) {
    if (onClose) onClose();
    return;
  }
  shownDialogs.push(id);

  // Macht den Chronik-Button + den neuen Eintrag in der Chronik-Liste
  // hervorgehoben, bis der Spieler sie jeweils bemerkt (siehe state.js).
  // render() erneut aufrufen, weil der vorausgehende Aufruf (z.B. in
  // enterCity()) bereits VOR diesen Flags lief — der Dialog selbst stört
  // dabei nicht, er liegt als eigenes Overlay über der Zielleiste.
  chronikButtonUnseen = true;
  if (!chronikUnseenEntryIds.includes(id)) chronikUnseenEntryIds.push(id);
  render();

  showStoryEntryDialog(entry, onClose);
}

/**
 * Öffnet den Dialog eines Story-Eintrags. Jeder Absatz aus `entry.text` wird
 * als eigene, kurze Dialog-Seite gezeigt ("Weiter" blättert um) statt als
 * ein langer Textblock — das hält Spannung und Lesbarkeit hoch (siehe
 * SKILL.md, "Story-Dialoge: kurz und mehrstufig").
 */
function showStoryEntryDialog(entry, onClose) {
  const pages = Array.isArray(entry.text) ? entry.text : [entry.text];
  showPaginatedDialog(entry.title, splitLongDialogPages(pages), [
    { label: 'Weiter', onClick: () => closeDialog(onClose) }
  ]);
}
