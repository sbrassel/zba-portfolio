# Bewerbungs-Webseite (druckoptimiert)

Standalone, druckoptimierte Bewerbungsseite im Swiss International Style. Basierend auf dem Blueprint (Phase 1).

## Öffnen

- **Lokal mit Server (empfohlen):** Im Projektroot `npx serve bewerbung-web` ausführen, dann im Browser `http://localhost:3000` öffnen. So wird `data.json` geladen und die Seite dynamisch befüllt.
- **Ohne Server:** `bewerbung-web/index.html` direkt im Browser öffnen. Die Seite zeigt dann den statischen HTML-Inhalt (ohne JSON-Befüllung).
- **Im ZBA-Portfolio:** Falls `bewerbung-web` in `public/` kopiert wird, unter z. B. `http://localhost:5173/bewerbung-web/` erreichbar.

## Druck / PDF

Im Browser **Strg+P** (bzw. Cmd+P) → „Als PDF speichern“ wählen. Print-CSS sorgt für saubere Umbrüche und sichtbare Hintergründe.

## Anpassen

- **Inhalte:** `data.json` bearbeiten. Beim nächsten Laden (mit Server) werden die Daten übernommen.
- **Layout/Farben:** `styles.css` (inkl. `@media print`) anpassen.
