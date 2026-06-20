# Notizen — Game Design (frei laufend)

Loses Sammelbecken für Entscheidungen, Begründungen und Ideen, die
nicht in `philosophie.md` (Grundprinzipien) oder `roadmap.md`
(geplante Features) passen.

## Namensgebung

- Stadt heißt **Aschenfurt** (vorher Platzhalter "Stadt 1"). Klingt
  nach einem abgelegenen, leicht heruntergekommenen Ort — passt zur
  Eingangsszene (staubig, Wachen misstrauisch).
- Marktplatz-Vendoren: **Krämer** (Verpflegung & Kleinkram — historisch
  korrekt ein Allround-Händler, nicht nur Lebensmittel) und
  **Schmiede** (schwere Ausrüstung). **Waffenschmied** als dritter
  Vendor angelegt, aber noch verschlossen.

## Warum Lederhandschuhe beim Krämer und nicht bei der Schmiede

Leichtes Lederzubehör passt thematisch eher zum Allround-Krämer als
zur Schmiede (die explizit für "schwere, kaum erschwingliche
Ausrüstung" positioniert ist). Schmiede bleibt dadurch ein Ort, an dem
aktuell nichts kaufbar ist außer dem (gesperrten) Schmiedeofen — das
ist beabsichtigt, kein Bug. Erzeugt Vorfreude auf das Haus-Feature.

## Warum kein Echtzeit-Uhr-Tick

Diskutiert und verworfen: ein `setInterval`, das die Spieluhr auch im
Hintergrund laufen lässt. Gründe gegen:
1. Macht Speicherstände komplizierter (Zeit zwischen Save und Load
   müsste irgendwie behandelt werden — vorspulen? ignorieren?).
2. Macht Tests flaky (zeitabhängige Assertions).
3. Inhaltlich passt es besser zu einem klick-getriebenen Incremental:
   Zeit ist eine Ressource, die durch *Handeln* verbraucht wird, nicht
   durch Warten.

Falls das später doch gewünscht wird: `setInterval` in `clock.js`
ergänzen, der `advanceClock(1)` z.B. alle 3 Sekunden aufruft, plus
einen `lastTickAt`-Timestamp im Save, um beim Laden die verstrichene
Realzeit nachzuholen (gecappt, sonst kann ein Spieler durch tagelanges
Save-Liegenlassen extreme Hunger-/Müdigkeitswerte bekommen).

## Müdigkeit: Hard-Block war ein Spiel-blockierender Bug, kein Feature

Die erste Müdigkeits-Implementierung (`isExhausted()` ab 100% →
Arbeiten-Button disabled) wirkte beim Entwerfen plausibel ("Erschöpfung
sollte etwas kosten"), erzeugte in der Praxis aber einen Soft-Lock: bei
+15 Müdigkeit pro Arbeit war der Spieler nach 7 Klicks blockiert — das
war gegen ca. 12:15 Uhr Spielzeit, weit vor Sonnenuntergang (22 Uhr).
Die Nachtwache (eines der zentralen neuen Features) war dadurch
praktisch unerreichbar. Lektion: bei Ressourcen, die *jede* relevante
Aktion blockieren können, immer durchrechnen, ob der Spieler den Rest
des vorgesehenen Spieltags noch erreichen kann — nicht nur, ob der
einzelne Mechanik-Baustein für sich plausibel klingt. Harte Blocker
sollten auf wirklich exklusive Zustände beschränkt bleiben (hier:
Nacht selbst), Bedürfniswerte sind besser als Effizienz-Kurve
modelliert.

## UI-Kontrast-Fix (Hintergrund)

Ursprüngliche `--text-lo: #484f58` auf `--bg: #0d1117` lag bei einem
Kontrastverhältnis von ca. 2:1 — deutlich unter WCAG-AA (4.5:1) für
Fließtext. Angehoben auf `#7d8590` (~4.6:1). Bei künftigen neuen
Text-/Hintergrundfarben: Kontrast grob überschlagen, nicht nur "sieht
am Monitor okay aus" — Monitor-Helligkeit/Blaulichtfilter verschleiern
echte Lesbarkeitsprobleme.
