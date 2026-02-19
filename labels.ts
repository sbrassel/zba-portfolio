// Zentrale Labels für die App - Einfache Sprache (A2-B1)
// Alle Texte an einem Ort für einfache Anpassung

export const LABELS = {
  // Navigation
  nav: {
    logbuch: 'Übersicht',
    werkstatt: 'Projekte',
    showcase: 'Bewerbung',
    calendar: 'Kalender',
    teacher: 'Lehrer-Bereich',
    title: 'ZBA Portfolio',
    subtitle: 'Brückenangebote',
  },

  // Logbuch-Kacheln (Compass)
  tiles: {
    project: 'Aktuelles Projekt',
    competency: 'Meine Stärken',
    mood: 'Meine Stimmung',
    profile: 'Über mich',
    focus: 'Diese Woche',
    grades: 'Noten',
    achievements: 'Erfolge',
    applications: 'Meine Bewerbungen',
    documents: 'Bewerbungsmappe',
  },

  // Stimmung (Mood)
  mood: {
    title: 'Meine Stimmung',
    thisWeek: 'Diese Woche',
    howAreYou: 'Wie geht es dir heute',
    saved: 'Gespeichert!',
    savedDesc: 'Deine Stimmung wurde erfasst.',
    notRecorded: 'Noch nicht erfasst',
    alreadyRecorded: 'Schon erfasst',
    selectMood: 'Wähle aus...',
    messagePlaceholder: 'Kurze Nachricht an Lehrperson (optional)',
    messageLabel: 'Nachricht',
    // Mehr Optionen (für Picker)
    super: 'Super',
    good: 'Gut',
    okay: 'Okay',
    tired: 'Müde',
    difficult: 'Schwierig',
    motivated: 'Motiviert',
    stressed: 'Gestresst',
    sad: 'Traurig',
    angry: 'Wütend',
    calm: 'Ruhig',
    nervous: 'Nervös',
    hopeful: 'Zuversichtlich',
    categoryPositive: 'Positiv',
    categoryNeutral: 'Neutral',
    categoryChallenge: 'Schwierig',
  },

  // Reflexion
  reflection: {
    title: 'Tagebuch',
    dailyTitle: 'Tages-Eintrag',
    placeholder: 'Heute habe ich...',
    save: 'Speichern',
    cancel: 'Abbrechen',
    lastEntries: 'Letzte Einträge',
    positive: 'Positiv',
    neutral: 'Neutral',
    challenge: 'Schwierig',
  },

  // Wochenfokus
  focus: {
    title: 'Diese Woche',
    placeholder: 'Was ist wichtig?',
    goal: 'Mein Ziel...',
  },

  // Projekte (Workshop)
  project: {
    title: 'Projekte',
    subtitle: 'Deine Arbeit',
    newProject: 'Neues Projekt',
    newProjectDesc: 'Starte ein neues Projekt',
    titleLabel: 'Titel',
    questionLabel: 'Worum geht es?',
    questionPlaceholder: 'Was ist die Hauptfrage deines Projekts?',
    typeLabel: 'Art',
    create: 'Erstellen',
    mainProject: 'Hauptprojekt',
    setAsMain: 'Als Hauptprojekt',
    noProject: 'Noch kein Projekt',
    createFirst: 'Erstelle dein erstes Projekt',
    goToWorkshop: 'Zu den Projekten',
    board: 'Pinnwand',
    projectCanvas: 'Projektplan',
    toolbox: 'Ressourcen',
    phasePlanning: 'Planung',
    process: 'Prozess',
    resources: 'Ressourcen',
    newLabel: 'Neu',
    toolboxDemoHint: 'Öffnen/Download der Ressourcen ist in der Demo noch nicht verfügbar.',
  },

  // Kalender
  calendar: {
    title: 'Kalender',
    subtitle: 'Termine, Deadlines und Stundenplan',
    addEvent: 'Eintrag hinzufügen',
    addTermin: 'Termin',
    addDeadline: 'Deadline',
    addArbeit: 'Arbeit',
    addPruefung: 'Prüfung',
    addSonstiges: 'Sonstiges',
    eventTitle: 'Titel',
    eventType: 'Art',
    date: 'Datum',
    startTime: 'Von',
    endTime: 'Bis',
    allDay: 'Ganztägig',
    note: 'Notiz',
    linkProject: 'Projekt verknüpfen',
    save: 'Speichern',
    delete: 'Löschen',
    noEvents: 'Keine Einträge',
    upcoming: 'Kommende Termine',
    stundenplan: 'Stundenplan',
    stundenplanSubtitle: 'Unterrichtszeiten',
    importStundenplan: 'Importieren',
    importPlaceholder: 'Tab-getrennt: Zeile = Wochentag (Mo–Fr), Spalten = Slots 1–4',
    mo: 'Mo',
    di: 'Di',
    mi: 'Mi',
    do: 'Do',
    fr: 'Fr',
  },

  // Projekt-Status
  projectStatus: {
    planning: 'Noch nicht gestartet',
    active: 'In Arbeit',
    completed: 'Erledigt',
    projectActive: 'In Arbeit',
    noProject: 'Kein Projekt',
    createFirstProject: 'Erstelle dein erstes Projekt',
    goToWorkshop: 'Gehe zur Werkstatt',
    status: 'Stand',
  },

  // Projekt-Spalten (Kanban)
  projectColumns: {
    ideas: 'Ideen',
    active: 'In Arbeit',
    done: 'Erledigt',
  },

  // Projekt-Typen
  projectTypes: {
    passion: 'Mein Projekt',
    mini: 'Kurz-Projekt',
    trial: 'Schnuppern',
    application: 'Bewerbung',
    group: 'Team-Projekt',
    exam: 'Test',
    reflection: 'Tagebuch',
    todo: 'Aufgabe',
  },

  // Meilensteine
  milestones: {
    title: 'Schritte',
    newPlaceholder: 'Neuer Schritt...',
    week: 'Woche',
  },

  // Projekt-Phasen
  phases: {
    Planen: 'Planen',
    Recherche: 'Recherche',
    Umsetzung: 'Umsetzung',
    Abschluss: 'Abschluss',
  },

  // Tagebuch (Projekt)
  diary: {
    title: 'Tagebuch',
    newEntry: '+ Eintrag',
    placeholder: 'Was hast du heute gemacht?',
    save: 'Speichern',
    teacherFeedback: 'Feedback Lehrperson',
    noEntries: 'Noch keine Einträge',
    deleteEntry: 'Eintrag löschen?',
    deleteEntryDesc: 'Dieser Eintrag wird unwiderruflich gelöscht.',
  },

  // Projekt-Detail Tabs
  projectTabs: {
    canvas: 'Projektplan',
    diary: 'Tagebuch',
    overview: 'Übersicht',
  },

  // Projekt-Übersicht Tab
  projectOverview: {
    progress: 'Fortschritt',
    currentPhase: 'Aktuelle Phase',
    lastEntry: 'Letzter Eintrag',
    lastActivity: 'Letzte Aktivität',
    completeProject: 'Projekt abschliessen',
    noEntries: 'Noch keine Tagebucheinträge',
  },

  // Toast / Benachrichtigungen
  toast: {
    linkCopied: 'Link kopiert!',
    copyFailed: 'Kopieren fehlgeschlagen',
  },

  // Bewerbung (Showcase)
  showcase: {
    title: 'Bewerbung',
    subtitle: 'Zeig was du kannst!',
    topProjects: 'Beste Projekte',
    dossier: 'Bewerbungsmappe',
    applications: 'Meine Bewerbungen',
    newApplication: 'Neue Bewerbung',
    share: 'Teilen',
    portfolio: 'Portfolio',
    exportDossier: 'Bewerbungsmappe',
  },

  // Bewerbungs-Status
  applicationStatus: {
    sent: 'Gesendet',
    shortlist: 'Eingeladen',
    interview: 'Gespräch',
    trial: 'Schnuppertag',
    offer: 'Geschafft!',
    rejected: 'Leider nein',
  },

  // Resilienz (bei Absage)
  resilience: {
    title: 'Was lerne ich?',
    subtitle: 'Absagen sind normal. Was nimmst du mit?',
    logTitle: 'Meine Erkenntnis',
    placeholder: 'Was kann ich nächstes Mal besser machen?',
    save: 'Speichern',
  },

  // Dossier-Builder
  dossierBuilder: {
    title: 'Bewerbungsmappe erstellen',
    subtitle: 'Wähle aus und ordne per Drag & Drop',
    orderTitle: 'Reihenfolge',
    selectProjects: 'Projekte wählen',
    export: 'Mappe exportieren',
    exporting: 'Wird erstellt...',
    sectionsSelected: 'Teile ausgewählt',
    tip: 'Tipp: Lade PDFs hoch!',
    tipDesc: 'Lebenslauf, Motivationsschreiben und Zeugnisse als PDF hochladen.',
  },

  // Lehrer-Bereich
  teacher: {
    dashboard: 'Klassen-Übersicht',
    singleView: 'Einzelansicht',
    students: 'Schüler',
    sortBy: 'Sortieren nach',
    sortAttention: 'Wer braucht Hilfe',
    sortName: 'Name A-Z',
    sortProjects: 'Projekte',
    message: 'Nachricht',
    details: 'Details',
    demoReset: 'Demo zurücksetzen',
    newStudents: 'Neu (5 Schüler)',
    sendFeedback: 'Nachricht senden',
    messageTypes: {
      info: 'Info',
      success: 'Lob',
      improve: 'Tipp',
      alert: 'Wichtig',
    },
  },

  // Lehrer-Status
  studentStatus: {
    green: 'Alles gut',
    yellow: 'Aufpassen',
    red: 'Braucht Hilfe',
  },

  // Metriken
  metrics: {
    mood: 'Stimmung',
    habits: 'Aufgaben',
    projects: 'Projekte',
    active: 'aktiv',
  },

  // Allgemeine Buttons
  buttons: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    add: 'Hinzufügen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    close: 'Schliessen',
    back: 'Zurück',
    next: 'Weiter',
    done: 'Fertig',
    open: 'Öffnen',
    upload: 'Hochladen',
    download: 'Herunterladen',
    send: 'Senden',
  },

  // Backup / Export
  backup: {
    export: 'Daten sichern',
    import: 'Daten laden',
    exportSuccess: 'Backup heruntergeladen',
    importSuccess: 'Daten wiederhergestellt',
    importError: 'Fehler: Ungültige Datei',
    exportDesc: 'JSON-Backup herunterladen',
    importDesc: 'JSON-Backup hochladen',
  },

  // Allgemeine Texte
  general: {
    noData: 'Noch nichts da',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Geschafft!',
    today: 'Heute',
    week: 'Woche',
    level: 'Stufe',
    xp: 'Punkte',
    layout: 'Anordnung',
    logbookLayout: 'Kacheln anordnen',
    empty: 'Leer',
    demo: 'Demo',
    entries: 'Einträge',
    average: 'Schnitt',
    subjects: 'Fächer',
    material: 'Material',
    steps: 'Schritte',
  },

  // Bestätigungen
  confirm: {
    deleteProject: 'Projekt löschen?',
    deleteProjectDesc: 'Dieses Projekt und alle Einträge werden unwiderruflich gelöscht.',
    deleteGrade: 'Note löschen?',
    wrongPin: 'Falscher PIN. Bitte erneut versuchen.',
    pinPrompt: 'PIN eingeben für Zugang',
    unlock: 'Entsperren',
  },

  // SkillTree / Kompetenzen
  skillTree: {
    level: 'Stufe',
    maxed: 'Max.',
    nextXp: 'Nächste Stufe',
    locked: 'Noch nicht freigeschaltet.',
    unlocked: 'Du hast Grundlagen gezeigt.',
  },

  // Erfolge / Gamification
  achievements: {
    title: 'Erfolge & Trophäen',
    unlocked: 'freigeschaltet',
    locked: 'Noch nicht freigeschaltet',
    secret: 'Geheimer Erfolg',
    progress: 'Fortschritt',
    xpAwarded: 'Punkte erhalten',
    levelUp: 'Level Up!',
    levelReached: 'Du hast Level {level} erreicht!',
    keepGoing: 'Weiter so! Schliesse Aufgaben ab, um neue Erfolge freizuschalten.',
    showAll: 'Alle Erfolge anzeigen',
    // Kategorien
    categories: {
      all: 'Alle',
      start: 'Erste Schritte',
      projects: 'Projekte',
      reflection: 'Reflexion',
      habits: 'Gewohnheiten',
      applications: 'Bewerbungen',
      secret: 'Geheim',
    },
    // Ränge (Tiers)
    tiers: {
      bronze: 'Bronze',
      silver: 'Silber',
      gold: 'Gold',
      platinum: 'Platin',
    },
    // Toast-Nachrichten
    toast: {
      unlocked: 'Erfolg freigeschaltet!',
      moreUnlocked: 'weitere Erfolge',
    },
  },
};

// Typ für Labels
export type Labels = typeof LABELS;
