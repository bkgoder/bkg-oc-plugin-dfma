# Update: produktiv weiterarbeiten

Stand: 2026-07-09

## Ziel

Das Repo bleibt öffentlich sichtbar und arbeitsfähig. Es wird nicht wieder versteckt oder privat gemacht. Private Altlasten werden sauber entschärft, ohne den produktiven Workflow zu blockieren.

## Neue Doku-Lage

Relevante Einstiegsdokumente:

- `README.md` — Überblick und Links
- `docs/commands.md` — aktuelle Slash-Commands und Wartungstools
- `docs/install.md` — Installation, `postinstall`, Update-Check, Sync, lokale Prüfung
- `docs/plugin-ready-plan.md` — Architektur und Runtime-Flows
- `docs/tasks.md` — produktive Task-Liste
- `docs/release-readiness.md` — private und öffentliche Release-Gates
- `docs/agent-lane-prompts.md` — Agent-Aufträge
- `docs/agent-work-contract.md` — Agent-Regeln

## Command-Namensregel

Alle sichtbaren OpenCode-Commands sollen mit `bkg-` beginnen und klar sagen, was sie tun. Keine Zahlencodes, keine Insider-Witze, keine doppeldeutigen Kurzformen.

Neue Hauptcommands:

- `/bkg-project-check` — Projekt, Repo, Docs und Startkontext prüfen
- `/bkg-memory` — Memory lesen, schreiben und validieren
- `/bkg-git` — Git-Status, Pull, Commit und Push bewusst ausführen
- `/bkg-tasks` — Tasks anlegen, anzeigen, starten und aktualisieren
- `/bkg-rules` — Workflow-Regeln, Done-Kriterien und Release-Gates prüfen
- `/bkg-debate` — Team-Debatten, Council-Sessions, Votes und Delegation starten

Alte Kurzcommands bleiben nicht als Hauptcommands erhalten und sollen nicht mehr dokumentiert werden.

## Agent-Namensregel

Alle sichtbaren Agent-Dateinamen sollen klar sagen, welche Rolle sie haben.

Aktive Agent-Familien:

- `bkg-workflow-*`
- `bkg-debate-*`
- `bkg-council-*`
- `bkg-vote-*`

Aktive Hauptagenten:

- `bkg-workflow-orchestrator`
- `bkg-debate-implementation`
- `bkg-debate-review`
- `bkg-debate-product`
- `bkg-council-architecture`
- `bkg-council-implementation`
- `bkg-council-risk-review`
- `bkg-council-product`
- `bkg-council-contrarian`
- `bkg-council-communication`
- `bkg-vote-chair`
- `bkg-vote-recorder`
- `bkg-vote-auditor`

Legacy-Agenten wie `bkg-six-main-orchestrator`, `bkg-4ucker-*` und `bkg-rat-*` sind nicht mehr aktiv.

## Was das Plugin jetzt leisten soll

- BKG/OpenCode-Assets installieren
- `opencode.json` mit Plugin-Referenz aktualisieren
- lokale Dashboard-Oberfläche bereitstellen
- Blocker erfassen
- Council-Sessions starten
- Votes speichern und auswerten
- User-Entscheidungen über approve, reject und revise entgegennehmen
- Short-Term-Memory schreiben
- Runtime-Adapter für BitShit bereitstellen
- Subagent-Output lokal sichtbar machen
- Update-Checks ohne automatische Config-Mutation anbieten
- Sync nur sichtbar und konfiguriert ausführen

## Harte nächste Tasks

### 1. Runtime-State-Pfad korrigieren

Erledigt. Neuer Runtime-State geht nach `bkg-oc-plugin-bkg-dfma`. Env-Override `BKG_OC_PLUGIN_STATE_DIR` bleibt erhalten.

### 2. Commands auf klare `bkg-` Namen normalisieren

Erledigt als Hauptmodell:

- alte `/0ero`, `/1brain`, `/2hit`, `/3some`, `/4ever`, `/4ucker` entfernt
- kurze Zwischenformen `/bkg-zero`, `/bkg-brain`, `/bkg-hit`, `/bkg-some`, `/bkg-ever`, `/bkg-fucker` entfernt
- neue sprechende Commands in README, Rules, Orchestrator und Installer eingetragen
- Command-Referenz in `docs/commands.md` ergänzt

### 3. Agents auf klare Namen normalisieren

Erledigt als Hauptmodell:

- `bkg-six-main-orchestrator` ersetzt durch `bkg-workflow-orchestrator`
- `bkg-4ucker-*` ersetzt durch `bkg-debate-*`
- `bkg-rat-*` ersetzt durch `bkg-council-*`
- Commands verweisen auf `bkg-workflow-orchestrator`
- Debate command verweist auf die neuen Debate-, Council- und Vote-Agenten

### 4. README ehrlich halten

Erledigt für den aktuellen Stand:

- Approve, reject und revise sind aktuelle Review-Gate-Funktionen
- Annotationen sind als geplant markiert, solange keine echte Annotation-API/Implementierung vorhanden ist

### 5. Install-Doku und Postinstall bewusst halten

Ergänzt in `docs/install.md` und `docs/release-readiness.md`.

Für private Nutzung darf `postinstall` die Assets automatisch installieren und `opencode.json` aktualisieren.

Vor einem öffentlichen Release muss entschieden werden:

- entweder bewusst so lassen und klar dokumentieren
- oder per Env-Gate absichern
- oder nur eine Install-Notice ausgeben und `npm run install:assets` explizit verlangen

### 6. Produktiv-Gate

Nach Änderungen muss mindestens laufen:

- `npm run ci`
- `npm ls --depth=0`
- `git diff --check`
- lokaler OpenCode-Neustart mit `/` Command-Prüfung
- lokale Agent-Liste auf Legacy-Dateien prüfen

## Arbeitsmodus ab jetzt

Keine neuen Großideen in diesen Release-Zweig kippen.

Erst prüfen:

1. Commands sichtbar
2. Agent-Namen sauber
3. CI grün
4. State-Pfad korrekt
5. README ehrlich
6. Produktiver Start möglich

Danach kann produktiv weitergebaut werden, ohne das Repo wieder zu verstecken oder in privaten Chaos-Nebel zu schieben.
