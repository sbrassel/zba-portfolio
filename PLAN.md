# ZBA Portfolio – Nächste Schritte im Plan

## ✅ Bereits umgesetzt
- Logbuch (Compass): Profil, Kompetenzrad, Noten, Wochenfokus, Habits, Reflexionen, Erfolge
- Werkstatt: Kanban, Projekt-Canvas, Tagebuch, Meilensteine, Modals (Neu, Eintrag)
- Showcase: Top-Projekte, Bewerbungsdossier, Lehrstellen-Check, Resilienz-Check, PDF-Export
- Lehrer-Cockpit: Schülerauswahl, Feedback senden (Info, Lob, **Verbessern**, Wichtig)
- Demo-Daten: randomisierte Noten, Stimmung, Habits, viele Projekte
- Speicherung: localStorage (AppData)
- **Mobile Navigation**: Bottom-Nav für Smartphones/Tablets mit Safe Area
- **Lehrer-PIN**: Einfacher PIN-Schutz (Standard: 1234) für den Lehrer-Bereich
- **Responsive Tiles**: Logbuch-Kacheln passen sich an Bildschirmgrösse an (1-2 Spalten mobil)
- **Professionelle Dialoge**: Alle `alert()`/`confirm()` durch Modals/Toasts ersetzt
- **Korrekte Fortschrittsanzeige**: Projekt-Fortschritt basiert auf echten Meilenstein-Daten
- **Type-Safety**: KanbanColumn mit korrektem Interface statt `any`
- **Labels erweitert**: Bestätigungsdialoge, allgemeine Begriffe in `labels.ts`

---

## Nächste Schritte (Priorität)

### 1. Kurzfristig (für Unterrichtseinsatz)
- [x] **Link teilen (Showcase)**: Copy-to-Clipboard + Toast statt alert ✅
- [x] **Toolbox (Werkstatt)**: Dezente Hinweis-Box statt alert ✅
- [x] **Placeholder im Lehrer-Cockpit**: Dynamischer Schülername ✅
- [ ] **Offline-Stabilität**: PWA-Caching für zuverlässigen Einsatz im Schulnetz testen
- [ ] **Stundenplan vereinfachen**: Einfacheres Eingabeformat für Lehrpersonen

### 2. Mittelfristig (Funktionen)
- [ ] **Backend/API**: Daten in DB (z. B. Supabase, Firebase) statt nur localStorage für Multi-Device & Lehrer-Zugriff
- [ ] **Auth**: Echtes Login für Schüler vs. Lehrperson (ersetzt aktuellen PIN)
- [ ] **Ziele im Compass**: Anzeige der Goals + Toggle/Neu erweitern

### 3. Qualität & Deployment
- [x] **Responsive/Barrierefreiheit**: Mobile Navigation, Safe Area, Touch-Targets ✅
- [ ] **Lighthouse/Performance**: Ladezeiten, Bilder optimieren (externe Bilder ablösen)
- [ ] **Deployment**: z. B. Vercel/Netlify mit `npm run build` + Preview-URL dokumentieren
- [ ] **Externe Abhängigkeiten**: Basel-Logo und Projektbilder lokal einbetten statt von Wikipedia/Picsum
