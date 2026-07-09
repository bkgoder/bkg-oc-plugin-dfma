# Update: produktiv weiterarbeiten

Stand: 2026-07-09

## Ziel

Das Repo bleibt öffentlich sichtbar und arbeitsfähig. Es wird nicht wieder versteckt oder privat gemacht. Private Altlasten werden sauber entschärft, ohne den produktiven Workflow zu blockieren.

## Command-Namensregel

Alle sichtbaren OpenCode-Commands sollen mit `bkg-` beginnen, damit sie unter `/` einheitlich auffindbar sind.

Neue Hauptcommands:

- `/bkg-zero`
- `/bkg-brain`
- `/bkg-hit`
- `/bkg-some`
- `/bkg-ever`
- `/bkg-fucker`

Alte Kurzcommands bleiben höchstens als interne/temporäre Kompatibilität erhalten und sollen nicht mehr als primärer Weg dokumentiert werden.

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

Aktuell darf kein neuer Runtime-State mehr unter dem alten Paketnamen landen.

Soll-Ziel:

- alter Pfad raus: `bkg-oc-plugin-stop-4uck-m3-agen1s`
- neuer Pfad rein: `bkg-oc-plugin-bkg-dfma`
- Env-Override `BKG_OC_PLUGIN_STATE_DIR` bleibt erhalten

### 2. Commands auf `bkg-` normalisieren

Alle command-Dateien und Doku-Verweise prüfen:

- alte `/0ero`, `/1brain`, `/2hit`, `/3some`, `/4ever`, `/4ucker` nicht mehr als Hauptcommands führen
- neue `/bkg-zero`, `/bkg-brain`, `/bkg-hit`, `/bkg-some`, `/bkg-ever`, `/bkg-fucker` als primäre Commands setzen
- README, docs und Assets angleichen

### 3. README ehrlich halten

README darf nur aktuelle Fähigkeiten als fertig verkaufen.

- Approve, reject und revise sind aktuelle Review-Gate-Funktionen
- Annotationen nur als geplant markieren, solange keine echte Annotation-API/Implementierung vorhanden ist

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

Erst fertig machen:

1. State-Pfad
2. Command-Namen
3. README-Wahrheit
4. Tasks aktualisieren
5. CI grün

Danach kann produktiv weitergebaut werden, ohne das Repo wieder zu verstecken oder in privaten Chaos-Nebel zu schieben.
