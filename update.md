# Update: produktiv weiterarbeiten

Stand: 2026-07-09

## Ziel

Das Repo bleibt öffentlich sichtbar und arbeitsfähig. Es wird nicht wieder versteckt oder privat gemacht. Private Altlasten werden sauber entschärft, ohne den produktiven Workflow zu blockieren.

## Command-Namensregel

Alle sichtbaren OpenCode-Commands sollen mit `bkg-` beginnen und klar sagen, was sie tun. Keine Zahlencodes, keine Insider-Witze, keine doppeldeutigen Kurzformen. Menschen haben schon genug Probleme mit Benennung, da muss die Maschine nicht auch noch mitmachen.

Neue Hauptcommands:

- `/bkg-project-check` — Projekt, Repo, Docs und Startkontext prüfen
- `/bkg-memory` — Memory lesen, schreiben und validieren
- `/bkg-git` — Git-Status, Pull, Commit und Push bewusst ausführen
- `/bkg-tasks` — Tasks anlegen, anzeigen, starten und aktualisieren
- `/bkg-rules` — Workflow-Regeln, Done-Kriterien und Release-Gates prüfen
- `/bkg-debate` — Team-Debatten, Rat-Sessions, Votes und Delegation starten

Alte Kurzcommands bleiben nicht als Hauptcommands erhalten und sollen nicht mehr dokumentiert werden.

## Was das Plugin jetzt leisten soll

- BKG/OpenCode-Assets installieren
- `opencode.json` mit Plugin-Referenz aktualisieren
- lokale Dashboard-Oberfläche bereitstellen
- Blocker erfassen
- Rat-Sessions starten
- Votes speichern und auswerten
- User-Entscheidungen über approve, reject und revise entgegennehmen
- Short-Term-Memory schreiben
- Runtime-Adapter für BitShit bereitstellen
- Subagent-Output lokal sichtbar machen

## Harte nächste Tasks

### 1. Runtime-State-Pfad korrigieren

Erledigt. Neuer Runtime-State geht nach `bkg-oc-plugin-bkg-dfma`. Env-Override `BKG_OC_PLUGIN_STATE_DIR` bleibt erhalten.

### 2. Commands auf klare `bkg-` Namen normalisieren

Erledigt als Hauptmodell:

- alte `/0ero`, `/1brain`, `/2hit`, `/3some`, `/4ever`, `/4ucker` entfernt
- kurze Zwischenformen `/bkg-zero`, `/bkg-brain`, `/bkg-hit`, `/bkg-some`, `/bkg-ever`, `/bkg-fucker` entfernt
- neue sprechende Commands in README, Rules, Orchestrator und Installer eingetragen

### 3. README ehrlich halten

Erledigt für den aktuellen Stand:

- Approve, reject und revise sind aktuelle Review-Gate-Funktionen
- Annotationen sind als geplant markiert, solange keine echte Annotation-API/Implementierung vorhanden ist

### 4. Postinstall bewusst halten

Für private Nutzung darf `postinstall` die Assets automatisch installieren und `opencode.json` aktualisieren.

Vor einem öffentlichen Release muss entschieden werden:

- entweder bewusst so lassen und klar dokumentieren
- oder per Env-Gate absichern
- oder nur eine Install-Notice ausgeben und `npm run install:assets` explizit verlangen

### 5. Produktiv-Gate

Nach Änderungen muss mindestens laufen:

- `npm run ci`
- `npm ls --depth=0`
- `git diff --check`

## Arbeitsmodus ab jetzt

Keine neuen Großideen in diesen Release-Zweig kippen.

Erst prüfen:

1. Commands sichtbar
2. CI grün
3. State-Pfad korrekt
4. README ehrlich
5. Produktiver Start möglich

Danach kann produktiv weitergebaut werden, ohne das Repo wieder zu verstecken oder in privaten Chaos-Nebel zu schieben.
