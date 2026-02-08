# ZBA Portfolio – Nächste Schritte im Plan

## ✅ Bereits umgesetzt
- Logbuch (Compass): Profil, Kompetenzrad, Noten, Wochenfokus, Habits, Reflexionen, Erfolge
- Werkstatt: Kanban, Projekt-Canvas, Tagebuch, Meilensteine, Modals (Neu, Eintrag)
- Showcase: Top-Projekte, Bewerbungsdossier, Lehrstellen-Check, Resilienz-Check, PDF-Export (Demo)
- Lehrer-Cockpit: Schülerauswahl, Feedback senden (Info, Lob, **Verbessern**, Wichtig)
- Demo-Daten: randomisierte Noten, Stimmung, Habits, viele Projekte (Passion, Mini, LZK, Bewerbung, Schnupperlehre, Gruppenarbeit, Reflexion, Todo)
- Speicherung: localStorage (AppData)

---

## Nächste Schritte (Priorität)

### 1. Kurzfristig (UX & Feinschliff)
- [ ] **Placeholder im Lehrer-Cockpit**: "Deine Nachricht an Luca..." dynamisch mit aktuellem Schülernamen ersetzen
- [ ] **Link teilen (Showcase)**: Statt `alert("Link kopiert!")` echten Copy-to-Clipboard + kurze Erfolgsmeldung (Toast/Snackbar)
- [ ] **Toolbox (Werkstatt)**: Statt `alert('Demo: Öffnen/Download...')` entweder echten Download-Link oder dezente Hinweis-Box

### 2. Mittelfristig (Funktionen)
- [ ] **PDF-Export vertiefen**: Export-Modal mit echten Optionen (Cover, Profil, Kompetenzen, Projekte) – ggf. mit Library (z. B. jsPDF / html2pdf) oder Server-Route
- [ ] **Kompetenzrad persistieren**: Kompetenz-Level aus `CompetencyWheel` in `StudentRecord` speichern (aktuell nur in Komponenten-State)
- [ ] **Ziele im Compass**: Anzeige der Goals + Toggle/Neu (falls noch nicht vollständig sichtbar)

### 3. Optional (Backend & Skalierung)
- [ ] **Backend/API**: Daten in DB (z. B. Supabase, Firebase) statt nur localStorage für Multi-Device & Lehrer-Zugriff
- [ ] **Auth**: Login für Schüler vs. Lehrperson (optional Rollen)

### 4. Qualität & Deployment
- [ ] **Responsive/Barrierefreiheit**: Fokus-States, Keyboard-Navigation, ARIA-Labels prüfen
- [ ] **Lighthouse/Performance**: Ladezeiten, Bilder optimieren
- [ ] **Deployment**: z. B. Vercel/Netlify mit `npm run build` + Preview-URL dokumentieren

---

## Empfehlung für „Jetzt weitermachen“
1. **Placeholder + Link kopieren** (schnell, sichtbarer Gewinn)
2. **Kompetenzrad persistieren** (wichtig für echten Mehrwert)
3. **PDF-Export** schärfen oder klar als „Demo“ kennzeichnen

Wenn du sagst, welchen Schritt du als Nächstes angehen willst, können wir ihn konkret im Code umsetzen.
