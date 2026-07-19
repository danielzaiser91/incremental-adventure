# Chroniken des vergessenen Weges

Ein textbasiertes Incremental-RPG im Browser — kein Download, kein Login.

**[▶ Jetzt spielen](https://danielzaiser91.github.io/incremental-adventure/)**

---

## Was ist das?

Du spielst einen mittellosen Fremden, der in der Stadt Treutheim strandet und sich von ganz unten hocharbeiten muss. Über mehrere Kapitel hinweg entfaltet sich eine Handlung über Schulden, Gilden, Korruption und eine Bruderschaft von Söldnern — alles erzählt durch NPC-Dialoge, Ich-Perspektiv-Monologe und Chronik-Einträge.

Das Spiel folgt dem Incremental-Genre: Ressourcen sammeln, Fähigkeiten ausbauen, Story-Fortschritt freischalten — im eigenen Tempo.

## Features

- **4 Kapitel** mit NPCs, Quests und story-getriebenen Entscheidungen
- **Arbeit & Ressourcen** — Schuften, Feldarbeit, Stadtwache, Alchemie, Handwerk
- **Kampfsystem** mit Ausrüstung, Gegnern und Fraktions-Einfluss
- **Bedürfnisse** — Hunger und Müdigkeit beeinflussen Arbeitsleistung
- **Errungenschaften & Skillbaum** — permanente Boni über Prestige-Resets
- **Vollständiger Speicherstand** im Browser (localStorage)
- **Hintergrundmusik** pro Kontext (Taverne, Kampf, Ambient)

## Technik

Kein Build-Step, kein Framework. Reines HTML + CSS + JavaScript — läuft direkt aus dem Browser über GitHub Pages.

```
index.html          → Einstiegspunkt
script/             → Spiellogik (state, content, npc, quests, combat, …)
style/              → CSS
patchnotes/         → Versionshistorie + Discord-Automatisierung
.github/workflows/  → Auto-Deploy + Discord-Benachrichtigungen
```

## Entwicklung

```bash
# Lokal starten — kein Server nötig (file:// reicht)
# Einfach index.html im Browser öffnen
```

Dev-Modus: `d` → `a` → `n` → `i` → `e` → `l` eintippen (im laufenden Spiel).

## Discord

**[Server beitreten](https://discord.gg/QuMTbDAfPd)** — Bug-Reports, Feedback und Patchnotes.

## Lizenz

Alle Rechte vorbehalten. Kein kommerzieller Einsatz ohne Genehmigung.
