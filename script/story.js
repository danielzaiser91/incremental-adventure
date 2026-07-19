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

/* Puffer, um den Seitenanfang/-ende beim Wort-Highlighting-Prototyp VOR den
   jeweiligen Alignment-Zeitstempel gezogen werden (siehe
   showStoryEntryDialog()) — Erfahrungswerte, keine exakt gemessenen Werte. */
const STORY_AUDIO_PAGE_START_BUFFER_S = 0.15;
const STORY_AUDIO_PAGE_END_BUFFER_S   = 0.65;

/* Vorab-Lade-Cache für Wort-Zeitstempel: id -> word_segments[] oder `null`
   (kein Alignment für diesen Eintrag vorhanden). Wird von
   prefetchAllStoryWords() (main.js, beim Spielstart) im Hintergrund gefüllt,
   BEVOR der Spieler den ersten Story-Dialog überhaupt erreicht — dadurch
   liest showStoryEntryDialog() synchron aus dem Cache statt mitten im Klick
   auf ein `fetch()` zu warten (siehe Begründung dort). */
const _storyWordsCache = {};

async function prefetchAllStoryWords() {
  await Promise.all(STORY_ENTRIES.map(entry =>
    fetch(getStoryWordsSrc(entry.id))
      .then(res => (res.ok ? res.json() : null))
      .then(data => { _storyWordsCache[entry.id] = (data && Array.isArray(data.word_segments)) ? data.word_segments : null; })
      .catch(() => { _storyWordsCache[entry.id] = null; })
  ));
}

const STORY_ENTRIES = [
  {
    id:          '1.1',
    title:       'Das Stadttor',
    unlockState: 10101,
    text: [
      'Der Hof meiner Familie gab nie mehr her als Mehltau im Korn und einen Vater, der lieber fluchte als hoffte.',
      'Sechzehn Jahre lang habe ich davon geträumt, von hier fortzugehen. Heute wurde der Acker mit jedem Schritt kleiner hinter mir.',
      'Vor mir liegt Treutheim. Die erste Stadt, der erste Atemzug eines Lebens, das endlich mir gehören soll.'
    ]
  },
  {
    id:          '1.2',
    title:       'Ein Blick aus dem Schatten',
    unlockState: 10102,
    text: [
      'Aus dem Dunkel einer Gasse löst sich ein Mann, als hätte der Schatten ihn ausgespuckt.',
      'Seinen Namen kenne ich nicht. Doch sein Blick brennt sich ein — er liegt auf meinem Geldbeutel, nicht auf meinem Gesicht.',
      'Kein Wort fällt. Es braucht auch keines. Von nun an trage ich mein Gold dichter am Leib.'
    ]
  },
  {
    id:         '1.3',
    title:      'Die erste Nacht',
    unlockFlag: () => gameFlags.firstSleepTriggered,
    text: [
      'Jeder Knochen liegt mir schwer im Leib. Der erste Tag ist vorüber — und es war nur der erste.',
      'Ehrlich gesagt: rauer, als ich es mir ausgemalt hatte. Schuften für ein paar Münzen, die kaum das Brot decken.',
      'War es das, wofür ich mein Zuhause hinter mir gelassen habe?',
      'Doch dort wartet nur derselbe Acker. Derselbe Tag, der sich dreht und dreht, bis er einen Menschen ganz verbraucht.',
      'Nein. Ich will mehr sein als ein Paar müder Hände. Ich will weiter, hinaus, hinauf.',
      'Und manchmal, tief in der Erschöpfung, regt sich etwas in mir. Ein Kribbeln, das mehr verspricht, als ich zu glauben wage.',
      'Morgen geht es weiter. Ändert es niemand für mich, dann ändere ich es selbst.'
    ]
  },
  {
    id:          '1.4',
    title:       'Der erste Raub',
    unlockState: 10103,
    text: [
      'Der Griff kommt, bevor ich ihn höre. Eine Hand am Handgelenk, ein Ruck — und schon stehe ich in der Gasse, den Rücken am kalten Stein, ehe mein Verstand begreift, was geschieht.',
      'Der Fremde steht vor mir, ruhig, gelassen. Nicht einmal die Kapuze hat er hochgezogen.',
      '»Eine hübsche Summe für einen Neuankömmling«, sagt er und löst den Beutel von meiner Hüfte, als gehörte er ihm.',
      'Ich will etwas erwidern und schweige doch. Er ist schon halb aus der Gasse hinaus.',
      '»Bis bald«, wirft er über die Schulter. Dann verschluckt ihn die Stadt.',
      'Meine Hände zittern. Nicht vor Angst — vor blankem Unglauben.',
      'Ein zweites Mal lasse ich das nicht geschehen.'
    ]
  },
  {
    id:          '1.5',
    title:       'Der zweite Raub',
    unlockState: 10104,
    text: [
      'Marktplatz, Mittagsstunde. Hundert Stimmen, der Geruch von gebratenem Fleisch. Diesmal klemme ich den Beutel fest unter dem Arm.',
      'Nicht fest genug.',
      'Ein Ellenbogen in die Seite, eine Drehung — und er ist schon drei Schritte fort, ehe ich mein Stolpern abgefangen habe.',
      'Einmal dreht er sich um. Sieht mich an. Und zwinkert.',
      'Helles Tageslicht, hundert Zeugen. Nicht einmal die Mühe macht er sich, sein Gesicht zu verbergen.',
      'Vor Wut bin ich wie versteinert. Er kennt mich. Er weiß genau, wann ich komme.'
    ]
  },
  {
    id:          '1.6',
    title:       'Der dritte Raub',
    unlockState: 10105,
    text: [
      'Das Rascheln höre ich einen Atemzug zu spät.',
      'Ein Stoß in den Rücken — ich taumle, die Schulter prallt gegen den Mauerstein. Als ich mich umwende, ist er fort.',
      'Kein Griff, kein Wort, nicht einmal ein Blick. Nur ein Handgriff, beiläufig wie das Aufheben einer Münze vom Pflaster.',
      'Ich lehne mich an die Wand und warte, bis das Zittern aus den Händen weicht.',
      'Nicht einmal eines Blickes hat er mich für würdig gehalten.',
      'Das ist kein Pech mehr. Das ist Plan. Jemand weiß, wo ich bin, wann ich komme, wie viel ich trage.',
      'Beim nächsten Mal entkommt er mir nicht.'
    ]
  },
  {
    id:          '1.7',
    title:       'Der vierte Raub',
    unlockState: 10106,
    text: [
      'Diesmal wartet er auf mich. Offen, mit verschränkten Armen an die Mauer gelehnt, als hätte er von jeher gewusst, dass mein Weg hier entlangführt.',
      '»Du lernst«, sagt er, ehe ich auch nur stehenbleibe. »Nur noch nicht schnell genug.«',
      'Er tritt einen Schritt auf mich zu. Und ich weiche zurück. Ich — weiche zurück.',
      'Ohne Eile nimmt er das Gold. Kein Gerangel. Als wäre alles längst entschieden.',
      '»Bis zum nächsten Mal.«',
      'Er wendet sich ab und geht. Einfach geht. Als wäre ich keine Gefahr. Als wäre ich nichts.',
      'Nein. Nicht noch einmal. Ich beginne von vorn — diesmal mit dem Kopf, nicht mit den Händen.'
    ]
  },
  {
    id:          '1.8',
    title:       'Wachsam',
    unlockFlag:  () => skills.paranoid >= 1,
    text: [
      'Jedes Geräusch. Jede Schulter, die sich zu früh dreht. Jeder Schatten, der einen Lidschlag zu lange steht.',
      'Ja, ich bin misstrauisch geworden. Manchmal sage ich es mir laut vor, als würde es dadurch leichter zu tragen.',
      'Doch es schärft den Blick. Ich erkenne jetzt Muster, wo ich früher nur Zufall sah.',
      'Also fange ich von vorn an — nicht, weil ich muss, sondern weil ich will. Klüger diesmal.'
    ]
  },

  /* ══ KAPITEL 2: Die Spur des Diebs ════════════════════════ */

  {
    id:          '2.1',
    title:       'Erstes Blut',
    unlockState: 20101,
    text: [
      'Ein Rascheln hinter mir — und ich wirbele herum, ehe ein Gedanke mich daran hindern kann.',
      'Es geht zu schnell für Angst. Ein Hieb, ein Taumel, Staub auf den Lippen. Dann Stille.',
      'Ich stehe über dem gestürzten Räuber und höre erst jetzt, wie laut mein eigener Atem geht.',
      'Das erste Mal. Ich hätte erwartet, mich schlechter zu fühlen.',
      'Stattdessen eine seltsame, klare Ruhe. Und die Gewissheit: Ich bin nicht mehr der, der einst durch dieses Stadttor kam.',
      'Dieser hier hat sich gewehrt. Ich auch.'
    ]
  },
  {
    id:          '2.2',
    title:       'Korbins Geheimnis',
    unlockFlag:  () => gameFlags.korbinChapter2Talked,
    text: [
      'Korbin zieht mich nah zu sich heran. Sein Atem riecht nach Bier und nach Vorsicht.',
      '»Drei Neue allein in diesem Monat. Immer dasselbe: ankommen, schuften, beraubt werden. Du bist nicht der Erste, Fremder.«',
      '»Es gibt einen in dieser Stadt, den alle nur den Schatten nennen. Er sucht sich die Neuen aus. Einen, dem er traut, schickt er vor — einen, der beobachtet und entscheidet, ob die Beute sich lohnt.«',
      'Mir wird kalt, obwohl die Wärme der Taverne mich umfängt.'
    ]
  },
  {
    id:          '2.3',
    title:       'Eine Spur im Dunkeln',
    unlockFlag:  () => gameFlags.theftClueFoundInJagdgebiet,
    text: [
      'Zwischen der armseligen Habe eines Räubers, den ich eben niedergestreckt habe, liegt etwas, das nicht hierhergehört.',
      'Eine Münze. Meine Münze — ich erkenne den Kratzer, den ich ihr selbst einst bei einem Sturz beigebracht habe.',
      'Der Dieb hat das Gold nicht behalten. Er hat es weitergereicht, hinaus zu jemandem, der mit diesen Räubern unter einer Decke steckt.',
      'Das ist kein gewöhnlicher Straßenraub. Das ist ein Netz.'
    ]
  },
  {
    id:          '2.4',
    title:       'Miras wahres Gesicht',
    unlockFlag:  () => gameFlags.miraRevealedInfo,
    text: [
      'Mira lächelt nicht mehr. Zum ersten Mal, seit ich sie kenne, sprechen wir wie zwei, die einander ebenbürtig sind.',
      '»Der Brief, den ich dir für Brakka mitgab — er war eine Warnung. Brakka weiß, wer der Schatten ist. Er hat nur nie ein Wort verloren.«',
      '»Ich auch nicht. Weil Reden gefährlich ist. Aber du fragst. Und das verändert etwas.«',
      'Sie wendet sich ab, als fürchtete sie, es zu bereuen, sähe sie mich noch länger an.'
    ]
  },
  {
    id:          '2.5',
    title:       'Brakkas Schweigen bricht',
    unlockFlag:  () => gameFlags.brakkaRevealedSuspect,
    text: [
      'Brakka legt den Hammer aus der Hand. Zum ersten Mal, seit ich ihn kenne.',
      '»Der Mann, der immer in der Taverne hockt — er ist kein Dieb. Er ist der Späher. Er beobachtet, er wählt aus, er meldet weiter.«',
      '»Dieses Gesicht kenne ich seit Jahren. Immer hat er nur zugesehen. Und ich war zu feige, den Mund aufzumachen.«',
      'Sein Blick liegt schwer wie Eisen auf mir. »Willst du dem ein Ende setzen, dann halte etwas in der Hand, wenn du ihn stellst.«'
    ]
  },
  {
    id:          '2.6',
    title:       'Die Konfrontation',
    unlockFlag:  () => gameFlags.fremderConfronted,
    text: [
      'Ich lege die Münze auf den Tisch, zwischen uns beide. Der Fremde rührt sich nicht.',
      '»Du bist nicht wie die anderen«, sagt er endlich, leiser, als ich erwartet hatte. »Die anderen haben aufgegeben. Du nicht.«',
      '»Ich habe dich ausgewählt. Nicht nur, um dich zu bestehlen — sondern um zu sehen, was du daraus machst.«',
      'Er schiebt die Münze zu mir zurück. »Der Schatten wird wissen wollen, wer du bist. Ich werde ihm sagen, dass man mit dir rechnen muss.«',
      'Ich nehme die Münze. Kein Sieg, keine Niederlage. Nur eine neue Rechnung, die offenbleibt.'
    ]
  },
  {
    id:          '2.7',
    title:       'Das Ende des Anfangs',
    unlockState: 20200,
    text: [
      'Ich sitze auf den Stufen vor der Taverne, und meine Gedanken gehen den Weg zurück, den ich gekommen bin.',
      'Als Niemand bin ich hier eingetroffen. Ein Bauernjunge mit leeren Taschen und Träumen, die kein Maß kannten.',
      'Und nun? Ich habe Blut vergossen, Gold gewonnen und verloren, Freunde gefunden und Feinde, nach denen ich nie gesucht habe.',
      'Treutheim war nie das Ziel. Immer nur die erste Station.',
      'Der Schatten ist noch dort draußen. Und er weiß, dass es mich gibt.',
      'Das ist kein Ende. Das ist der Anfang von etwas weit Größerem.'
    ]
  },

  /* ── Kapitel 3: Lethkar ──────────────────────────────────── */
  {
    id:          '3.0',
    title:       'Lethkar',
    unlockFlag:  () => gameFlags.lethkarUnlocked,
    text: [
      'Drei Tage Weg liegen hinter mir. Keine Räuber — aber auch keine Hand, die sich mir entgegenstreckte.',
      'Lethkar ist größer als Treutheim. Fremde Gerüche, fremde Gesichter. Hier weiß niemand, wer ich bin.',
      'Das ist ein Vorteil. Vielleicht.',
      'Die Adresse aus dem Brief liegt nördlich des Marktes. Doch ich gehe nicht hin. Noch nicht.'
    ]
  },
  {
    id:          '3.1',
    title:       'Erste Schritte in Lethkar',
    unlockFlag:  () => gameFlags.varenaMetFirst,
    text: [
      'In der Taverne sitzt eine Frau mit dem Abzeichen der Alchemisten und sieht mich an, als hätte sie auf mein Kommen gewartet.',
      '»Du siehst aus wie einer, der aus Treutheim kommt.« Ich frage mich, was mein Gesicht ihr verrät.',
      'Varena. Ihr Name bleibt haften. Und die Art, wie sie spricht — genau, klar, kein Wort zu viel.'
    ]
  },
  {
    id:          '3.2',
    title:       'Der entschlüsselte Brief',
    unlockFlag:  () => gameFlags.varenaDecodedBrief,
    text: [
      '»Valdris.« Nun liegt der Name in der Luft, nicht mehr nur auf dem Papier.',
      'Ich weiß, wo das Haus steht. Und ich weiß, dass ich nicht allein dorthin gehen soll.',
      'Mira hat mir mehr mitgegeben, als ich ahnte. Ich hoffe nur, sie weiß selbst, was sie damit getan hat.'
    ]
  },
  {
    id:          '3.3',
    title:       'Das Laboratorium',
    unlockFlag:  () => alchemie.unlocked,
    text: [
      'Es riecht nach Schwefel, nach nassem Stein und nach etwas Süßlichem, das ich nicht zu benennen weiß.',
      'Varena zeigt mir die fünf Aspekte: Feuer, Wasser, Erde, Luft — und Äther.',
      '»Das hier ist kein Handwerk.« Sie tippt auf die Tischplatte. »Das ist Verstehen.«',
      'Ich glaube ihr. Was nicht heißt, dass ich es schon verstehe.'
    ]
  },
  {
    id:          '3.4',
    title:       'Thessa und ihre Bücher',
    unlockFlag:  () => gameFlags.thessaTrustGained,
    text: [
      '»Du weißt mehr, als du zeigst«, sagt Thessa. »Das ist gut.«',
      'Sie schiebt mir ein Buch über den Tisch — Aufzeichnungen über die Händlernetze von Lethkar. Namen, Verbindungen, Schulden.',
      'Valdris\' Name steht dreimal darin. Stets als Gläubiger. Niemals als Schuldner.',
      'Das erklärt manches. Und macht alles verwickelter.'
    ]
  },
  {
    id:          '3.5',
    title:       'Pereth und das Lagerhaus',
    unlockFlag:  () => gameFlags.perethQuestStarted,
    text: [
      '»Du bist der aus Treutheim, der Fragen über Valdris stellt.« Pereth ist geradliniger, als ich erwartet hatte.',
      '»Ich habe für ihn gearbeitet. Einmal genügt.« Er lehnt sich zurück. »Das Lagerhaus am Südtor gehört einem seiner Strohmänner.«',
      '»Was darin liegt, weiß ich nicht. Aber ich will es wissen. Und du kommst hinein, ohne aufzufallen.«',
      'Ich sage ja. Ob es klug war, weiß ich nicht.'
    ]
  },
  {
    id:          '3.6',
    title:       'Die Schatten-Organisation',
    unlockFlag:  () => gameFlags.chapter3StoryComplete,
    text: [
      'Langsam fügt sich ein Bild. Kein vollständiges — aber genug.',
      'Valdris ist kein Söldnerführer. Er ist ein Knotenpunkt. Nachrichten, Gold, Menschen — alles läuft durch seine Hände.',
      'Der Schatten ist größer, als ich es mir vorgestellt habe. Valdris ist nur ein Name darin.',
      'Hinter ihm steht mehr. Und es weiß, dass ich hier bin.'
    ]
  },
  {
    id:          '3.7',
    title:       'Einsicht I',
    unlockFlag:  () => gameFlags.valdrisOperationRaided,
    text: [
      'Das Lager ist leer. Zu leer. Jemand wusste, dass ich komme — oder sie sind aus eigenem Antrieb gegangen.',
      'Doch ich finde, was sie zurückließen: Listen, Routen, Quittungen für Dienste, die keinen Namen tragen.',
      'Und überall dasselbe Muster. Kein Raub — Beherrschung. Schulden, Geheimnisse, erkaufte Treue.',
      'Valdris baut kein Netz aus Verbrechern. Er baut ein Netz aus Menschen, die ihm etwas schulden.',
      'Das lässt sich schwerer zerschlagen als eine Bande. Weit schwerer.'
    ]
  },
  {
    id:          '3.8',
    title:       'Der Name',
    unlockFlag:  () => gameFlags.varenaRevealedValdrisIdent,
    text: [
      '»Du hast das Lager gefunden.« Varena sagt es ohne Überraschung. »Das heißt, er zieht sich zurück.«',
      '»Valdris ist nicht von hier. Er stammt aus dem Osten, aus einer Stadt, die auf Handelswegen errichtet wurde.«',
      '»Was er hier betreibt, ist nur ein Vorposten. Lethkar ist nicht sein Ziel — es ist sein Sprungbrett.«',
      'Ich frage, wohin er springt. Sie schüttelt den Kopf.',
      '»Das ist die Frage, die du beantworten musst. Ich kenne nur den Namen — und weiß, dass er nicht innehält.«'
    ]
  },
  {
    id:          '3.9',
    title:       'Einsicht II',
    unlockFlag:  () => gameFlags.alchemieGeselleReached,
    text: [
      'Ich sitze über den Aspekten, und mit einem Mal merke ich: Ich denke anders als zuvor.',
      'Nicht nur über Alchemie. Über das Geflecht der Dinge. Wie Wasser durch jeden Riss seinen Weg findet. Wie Feuer Gestalt annimmt.',
      'Pereth nahm Gold und gab Wissen. Varena tauschte Namen gegen Vertrauen. Thessa öffnete ihre Bücher gegen Zeit.',
      'Valdris tut dasselbe — nur umgekehrt. Er nimmt Treue und gibt Schuld zurück.',
      'Jetzt begreife ich, womit ich es zu tun habe. Und das wiegt schwerer als jede Waffe.'
    ]
  },
  {
    id:          '3.10',
    title:       'Der nächste Horizont',
    unlockFlag:  () => gameFlags.kap3Complete,
    text: [
      'Lethkar hat mich verändert. Nicht auf die Weise, die ich erwartet hatte.',
      'Stärker bin ich geworden — doch das war abzusehen. Klüger auch.',
      'Was ich nicht erwartet hatte: Ich habe aufgehört, Valdris zu fürchten.',
      'Er ist wirklich, er ist gefährlich. Aber kein Schatten mehr — ein Mensch mit einem Plan.',
      'Und ich bin einer, der Pläne zu lesen versteht.',
      'Der Weg führt weiter nach Osten. Dorthin, woher er gekommen ist.',
      'Was mich dort erwartet, weiß ich nicht. Doch ich weiß, wer ich sein werde, wenn ich ankomme.'
    ]
  },

  /* ── Kapitel 4: Velmark ──────────────────────────────────── */
  {
    id:          '4.1',
    title:       'Velmark',
    unlockFlag:  () => gameFlags.velmarkUnlocked,
    text: [
      'Velmark. Größer als Lethkar, lauter dazu. Mehr Stimmen, mehr Gerüche, mehr Menschen, die nichts voneinander wissen wollen.',
      'Niemand kennt mich hier.',
      'Gut so. Ich kenne hier ebenso wenig jemanden.',
      'Zum ersten Mal seit Treutheim bin ich wieder ein Niemand — doch diesmal weiß ich, was das bedeutet.',
      'Es bedeutet: Ich darf wählen, wer ich hier werde.'
    ]
  },
  {
    id:          '4.2',
    title:       'Drei Säulen',
    unlockFlag:  () => gameFlags.gildekontaktGeknuepft || gameFlags.bruderschaftkontaktGeknuepft || gameFlags.archivkontaktGeknuepft,
    text: [
      'Drei Kräfte halten Velmark zusammen.',
      'Die Händlergilde: Wer zahlt, hat recht. Eine alte Wahrheit, aber sie trägt.',
      'Die Eiserne Bruderschaft: Söldner und Wächter, Männer mit breiten Schultern und kurzem Gedächtnis. Doch sie hören auf Stärke.',
      'Das Stadtarchiv: Aufzeichnungen, Recht, Geschichte. Die stillste der drei — und wohl die mächtigste.',
      'Und in allen dreien, irgendwo verborgen: Valdris. Nicht zu sehen. Aber zu spüren.'
    ]
  },
  {
    id:          '4.3',
    title:       'Pereth, wieder',
    unlockFlag:  () => gameFlags.perethFoundInVelmark,
    text: [
      'Er sitzt in einer Taverne am Westkai, als wäre er nie fort gewesen.',
      '»Ich habe mich gefragt, wann du auftauchst.« Kein Gruß. Keine Überraschung.',
      'Für Valdris arbeitet er nicht mehr — er ist ihm einen Schritt voraus. Und mir einen hinterher.',
      'Er kennt diese Stadt. Hier hat er einst für Valdris die Fäden geknüpft.',
      '»Jetzt weiß ich, wie sein Netz gewoben ist. Das macht mich nützlich für dich. Und gefährlich für ihn.«'
    ]
  },
  {
    id:          '4.4',
    title:       'Der erste Schritt',
    unlockFlag:  () => gameFlags.ersteAllianzGeknuepft,
    text: [
      'Langsam werde ich zu einem Gesicht in dieser Stadt.',
      'Die erste Fraktion ist aufgetaut — behutsam, zögernd, so wie hier alles geschieht.',
      'Es ist anders als in Treutheim oder Lethkar.',
      'Dort bin ich gewachsen. Hier muss ich etwas anderes sein: überzeugend.',
      'Vertrauen ist hier weder eine Frage der Kraft noch des Wissens. Es ist eine Frage der Zeit.'
    ]
  },
  {
    id:          '4.5',
    title:       'Der Brief',
    unlockFlag:  () => gameFlags.valdrisBriefErhalten,
    text: [
      'Ein Brief, ohne Absender. Die Handschrift ist mir fremd — und doch weiß ich auf der Stelle, von wem er stammt.',
      '»Es ist mir nicht entgangen, dass du in Velmark eingetroffen bist. Kein Zufall, vermute ich.«',
      '»Wir könnten reden, wenn du magst. Ganz unverbindlich.«',
      'Er weiß, dass ich hier bin. Er fragt nicht, was ich will — er nimmt einfach an, dass wir dasselbe begehren.',
      'Das ist die gefährlichste Art von Feind: einer, der nicht irrt.'
    ]
  },
  {
    id:          '4.6',
    title:       'Zwei Säulen',
    unlockFlag:  () => gameFlags.zweiAllianzGekuepft,
    text: [
      'Zwei von drei.',
      'Die Stadt sieht mich mit anderen Augen an — nicht mehr als Fremden, sondern als einen, der bleibt.',
      'Valdris setzt zum Gegenzug an. Kleine Dinge: ein Lieferant, der ausbleibt, ein Gespräch, das jäh verstummt.',
      'Er weiß, was ich treibe. Aufhalten kann er es noch nicht.',
      'Ein Netz aus Schulden hat eine Schwäche: Auch Schulden geraten irgendwann in Vergessenheit.'
    ]
  },
  {
    id:          '4.7',
    title:       'Das Angebot',
    unlockFlag:  () => gameFlags.valdrisAngebotGemacht,
    text: [
      'Er sitzt mir gegenüber. Zum ersten Mal.',
      'Jünger ist er, als ich dachte. Ruhiger. Kein Messer, kein Wächter in Sichtweite.',
      '»Ich baue etwas, das Bestand hat«, sagt er. »Du auch. Das sieht man dir an.«',
      '»Warum nicht gemeinsam? Du erhältst, was du suchst — und ich, was ich suche.«',
      'Ich habe keine Antwort. Jedenfalls nicht sogleich.',
      'Es ist das schwerste Gespräch meines Lebens.'
    ]
  },
  {
    id:          '4.8',
    title:       'Keine Kompromisse',
    unlockFlag:  () => gameFlags.valdrisAngebotAbgelehnt,
    text: [
      'Ich habe Nein gesagt.',
      'Nicht, weil ich der bessere Mensch wäre. Nicht aus irgendeiner Moral heraus.',
      'Sondern weil sein Bauwerk auf den Schultern anderer ruht — und bald auf meinen ruhen würde.',
      'Er hat nichts erwidert. Er ist gegangen.',
      'Jetzt ist es kein Gespräch mehr. Jetzt ist es etwas anderes.'
    ]
  },
  {
    id:          '4.9',
    title:       'Das Netz steht',
    unlockFlag:  () => gameFlags.allianzKomplett,
    text: [
      'Alle drei.',
      'Es hat länger gedauert als gedacht. Manches hat mich Dinge gekostet, die mir niemand zurückgibt.',
      'Doch das Netz steht — meines, nicht seines.',
      'Valdris ist eingekreist. Nicht mit Waffen. Mit Macht und Bündnissen.',
      'Er kann sich nirgends mehr hinwenden, ohne einen zu verraten, der jetzt zu mir hält.'
    ]
  },
  {
    id:          '4.10',
    title:       'Das Ende des Weges',
    unlockFlag:  () => gameFlags.kap4Complete,
    text: [
      'Er hat es natürlich gewusst.',
      'Das letzte Gespräch war kurz. Kürzer, als ich erwartet hatte.',
      'Kein Zögern, kein Feilschen. Er hat die Lage erkannt — und ist gegangen.',
      'Velmark gehört wieder sich selbst. Das Netz ist zerschnitten.',
      'Treutheim, Lethkar, Velmark.',
      'Ich bin nicht mehr der, der einst an jenem Stadttor stand.',
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
 *
 * PROTOTYP Wort-Highlighting (siehe tts/PLAN.md): lädt vorab die
 * Wort-Zeitstempel (falls für diesen Eintrag vorhanden, siehe
 * tts/align/align.py) und baut pro Seite Wort-`<span>`s statt reinem Text —
 * dialog.js hebt dann per timeupdate das gerade gesprochene Wort hervor.
 * Fehlt die Datei (noch nicht ausgerichteter Eintrag), fällt alles auf den
 * bisherigen reinen Text-Modus zurück, ganz ohne Sonderfall im Aufrufer.
 */
function showStoryEntryDialog(entry, onClose) {
  const rawPages = Array.isArray(entry.text) ? entry.text : [entry.text];
  const pages = splitLongDialogPages(rawPages);
  const audioSrc = getStoryAudioSrc(entry.id);
  // WICHTIG: synchron aus dem Vorab-Lade-Cache lesen (siehe
  // prefetchAllStoryWords(), main.js) statt hier `await fetch(...)` zu
  // machen. Ein `await` VOR dem ersten `play()` kostet die "echte
  // Nutzerinteraktion", die Browser fürs automatische Abspielen mit Ton
  // verlangen — der Klick auf "Weiter"/"Betreten" landet dann außerhalb der
  // Gesten-Kette, Autoplay wird lautlos vom Browser blockiert (Bug, User-
  // Feedback 19.07.2026). Ist der Cache für diesen Eintrag ausnahmsweise noch
  // nicht gefüllt (Eintrag erreicht, bevor der Prefetch fertig ist), fällt
  // alles auf reinen Text ohne Highlighting zurück — kein Fehler, nur kein
  // Wort-Highlighting für dieses eine Mal.
  const words = _storyWordsCache[entry.id] || null;
  const pageWordSlices = words ? sliceWordsIntoPages(words, pages) : null;

  let i = 0;
  const showPage = () => {
    const isLast = i === pages.length - 1;
    const slice = pageWordSlices ? pageWordSlices[i] : null;
    const html = slice && slice.length ? wordSliceToHtml(slice) : `<p>${pages[i]}</p>`;
    // Seite 0 startet bei echtem Nullpunkt (Anfang der Datei, inkl. eventueller
    // Anfangsstille), nicht beim Zeitstempel des ersten Worts — sonst würde
    // der allererste Ton-Bruchteil der Datei übersprungen. Für alle weiteren
    // Seiten zieht STORY_AUDIO_PAGE_START_BUFFER_S den Startpunkt etwas VOR
    // den gemeldeten Wort-Zeitstempel — Whisper-Alignment markiert den
    // Wortanfang laut Höreindruck (User-Feedback 19.07.2026) tendenziell
    // etwas zu spät, sonst klingt der erste Laut des Wortes abgeschnitten.
    // Symmetrisch zieht STORY_AUDIO_PAGE_END_BUFFER_S das Seitenende etwas
    // VOR den Zeitstempel des letzten Worts — zusätzliche Sicherheitsmarge
    // zum präzisen Stopp-Timer (dialog.js), falls Wörter sehr knapp aneinander
    // anschließen (z.B. nur 20ms Lücke zwischen zwei Seiten). NICHT auf die
    // LETZTE Seite anwenden — dort gibt es kein nächstes Wort, vor dem
    // geschützt werden müsste, und der Puffer hätte nur das letzte Wort
    // selbst abgeschnitten (Bug, User-Feedback 19.07.2026: "mir ge..." statt
    // "gehören soll.").
    const pageStart = slice && slice.length
      ? (i === 0 ? 0 : Math.max(0, slice[0].start - STORY_AUDIO_PAGE_START_BUFFER_S))
      : undefined;
    const pageEnd = slice && slice.length
      ? (isLast
          ? slice[slice.length - 1].end
          : Math.max(pageStart || 0, slice[slice.length - 1].end - STORY_AUDIO_PAGE_END_BUFFER_S))
      : undefined;

    let armed = false;
    if (isLast) setTimeout(() => { armed = true; }, 250);

    showDialog({
      title: entry.title,
      text: [pages[i]],
      html,
      audioSrc,
      audioPageStart: pageStart,
      audioPageEnd: pageEnd,
      buttons: [{
        label: 'Weiter',
        onClick: () => {
          if (isLast) { if (armed) closeDialog(onClose); return; }
          i += 1;
          showPage();
        }
      }]
    });

    if (slice && slice.length) bindWordHighlight(slice);
  };
  showPage();
}

/** Verteilt die flache Wortliste (Ausrichtungs-Reihenfolge = Lesereihenfolge)
    auf die angezeigten Dialogseiten, rein über Wort-ANZAHL pro Seite (kein
    Text-Fuzzy-Match nötig): `splitLongDialogPages()` regruppiert Sätze nur
    innerhalb eines Absatzes, fügt nie Wörter hinzu/entfernt sie nie — die
    Summe der Wortzahlen aller Seiten entspricht daher exakt der Gesamtzahl
    ausgerichteter Wörter. */
function sliceWordsIntoPages(words, pages) {
  let cursor = 0;
  return pages.map(page => {
    const count = (page.match(/\S+/g) || []).length;
    const slice = words.slice(cursor, cursor + count);
    cursor += count;
    return slice;
  });
}

/** Baut das HTML einer Dialogseite mit einem `<span>` pro Wort. */
function wordSliceToHtml(slice) {
  const spans = slice.map(w =>
    `<span class="dialog-word">${w.word.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`
  ).join(' ');
  return `<p>${spans}</p>`;
}

/** Verknüpft die gerade gerenderten Wort-`<span>`s mit ihren Zeitstempeln
    und übergibt sie an dialog.js zur Hervorhebung während der Wiedergabe. */
function bindWordHighlight(slice) {
  const spanEls = document.querySelectorAll('#dialog-text .dialog-word');
  const paired = slice.map((w, idx) => ({ el: spanEls[idx], start: w.start, end: w.end }))
    .filter(w => w.el);
  setActiveWordSpans(paired);
}

/**
 * Pfad zur (eventuell noch nicht vorhandenen) Vertonung eines Story-Eintrags.
 * Reine Namenskonvention, identisch zur ID-Umwandlung in
 * tts/extract-manifest.js (`story-${id.replace(/\./g, '-')}`) — KEINE
 * Garantie, dass die Datei existiert. dialog.js' updateDialogAudio()
 * versteckt den Vorlese-Button automatisch, falls das Laden fehlschlägt
 * (noch nicht vertonter Eintrag, siehe tts/progress.json).
 */
function getStoryAudioSrc(id) {
  return `tts/output/story-${id.replace(/\./g, '-')}.wav`;
}

/** Pfad zu den (eventuell noch nicht vorhandenen) Wort-Zeitstempeln eines
    Story-Eintrags, siehe tts/align/align.py. */
function getStoryWordsSrc(id) {
  return `tts/output/story-${id.replace(/\./g, '-')}.words.json`;
}
