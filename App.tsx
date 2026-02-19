
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { Compass } from './components/Compass';
import { Workshop } from './components/Workshop';
import { Showcase } from './components/Showcase';
import { Calendar } from './components/Calendar';
import { TeacherView } from './components/TeacherView';
import { Sector, Project, ProjectResource, ProjectPhase, Milestone, CalendarEvent, TimetableEntry, Notification, Goal, ApplicationLog, DossierDocument, ReflectionEntry, AppData, StudentRecord, LogbuchTile, LogbuchTileType, LogbuchTileSize, TeacherNotification, Achievement } from './types';
import { INITIAL_PROFILE, INITIAL_SKILLS } from './constants';
import { clearAppData, loadAppData, saveAppData, needsAchievementsMigration, markAchievementsMigrated, exportAppDataAsJson, importAppDataFromJson } from './storage';
import { checkAchievements, awardXP, initializeAchievements } from './achievements';
import { LABELS } from './labels';

const APPDATA_VERSION = 1;

function prefixIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  return items.map((i) => ({ ...i, id: `${prefix}_${i.id}` }));
}

/** Migriert Projekt-Ressourcen von string zu ProjectResource[]. */
function migrateProjectResources(project: Project & { resources?: unknown }): Project {
  const resources: ProjectResource[] = Array.isArray(project.resources)
    ? project.resources
    : typeof project.resources === 'string' && project.resources
      ? [{ id: `res_${project.id}_0`, title: project.resources, type: 'note' }]
      : [];
  return { ...project, resources };
}

function migrateProjectPhase(project: Project): Project {
  if (project.currentPhase) return project;
  const phase: ProjectPhase =
    project.status === 'completed' ? 'Abschluss' :
    project.status === 'active' ? 'Umsetzung' : 'Planen';
  const milestones: Milestone[] = project.milestones.map((m, i) => ({
    ...m,
    id: (m as any).id || `${project.id}_m${i}`,
    phase: (m as any).phase,
  }));
  return { ...project, currentPhase: phase, milestones };
}

function migrateStudentsProjects(data: AppData): AppData {
  return {
    ...data,
    students: data.students.map((s) => ({
      ...s,
      projects: s.projects
        .map((p) => migrateProjectResources(p as Project & { resources?: unknown }))
        .map(migrateProjectPhase),
    })),
  };
}

// Erstellt 5 leere Schülerprofile für echte Testschüler
function createEmptyStudents(count: number = 5): StudentRecord[] {
  const mkId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  
  return Array.from({ length: count }, (_, idx) => {
    const sid = `student_${idx + 1}`;
    return {
      id: sid,
      profile: {
        name: `Schüler ${idx + 1}`,
        class: 'ZBA',
        zbaProfile: 'Kombiniert' as const,
        bio: '',
        strengths: [],
        interests: [],
        values: [],
        jobTargets: [],
        currentPhase: 'Orientieren',
        weeklyFocus: '',
        mood: [0, 0, 0, 0, 0],
        weeklyHabits: [false, false, false, false, false],
        level: 1,
        xp: 0,
        nextLevelXp: 500,
        achievements: [],
      },
      skills: [
        { subject: 'Teamfähigkeit', value: 5, fullMark: 10 },
        { subject: 'IT-Skills', value: 5, fullMark: 10 },
        { subject: 'Selbstorganisation', value: 5, fullMark: 10 },
        { subject: 'Kommunikation', value: 5, fullMark: 10 },
      ],
      grades: [],
      goals: [],
      projects: [],
      reflections: [],
      documents: [],
      applications: [],
      notifications: [{
        id: mkId('n'),
        title: 'Willkommen!',
        message: 'Dein ZBA Portfolio ist bereit. Starte mit deinem Profil im Logbuch.',
        date: 'Heute',
        read: false,
        type: 'info' as const,
      }],
      logbuchTiles: [],
      calendarEvents: [],
      timetable: [],
    };
  });
}

function createDemoStudents(): StudentRecord[] {
  const names = [
    'Frodo Beutlin',
    'Samweis Gamdschie',
    'Aragorn',
    'Legolas Grünblatt',
    'Gimli',
    'Gandalf',
  ];

  const mkId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const demoClass = 'ZBA-Mittelerde (10. SJ)';

  const baseSkills = [
    { subject: 'Teamfähigkeit', value: 7, fullMark: 10 },
    { subject: 'IT-Skills', value: 5, fullMark: 10 },
    { subject: 'Selbstorganisation', value: 6, fullMark: 10 },
    { subject: 'Kommunikation', value: 7, fullMark: 10 },
  ];

  const lotrProfiles: Array<Pick<StudentRecord['profile'], 'name' | 'bio' | 'strengths' | 'interests' | 'values' | 'jobTargets' | 'currentPhase' | 'weeklyFocus'>> = [
    {
      name: 'Frodo Beutlin',
      bio: 'Ruhig, zuverlässig und ausdauernd. Ich will etwas Sinnvolles machen und dranbleiben – auch wenn es schwierig wird.',
      strengths: ['Ausdauer', 'Zuverlässigkeit', 'Ruhiges Arbeiten', 'Reflexionsfähigkeit'],
      interests: ['Natur & Umwelt', 'Storytelling', 'Fotografie', 'Karten & Orientierung'],
      values: ['Verantwortung', 'Respekt', 'Durchhalten'],
      jobTargets: ['Mediamatiker:in EFZ', 'Kaufmann/Kauffrau EFZ (E-Profil)'],
      currentPhase: 'Bewerben',
      weeklyFocus: 'Bewerbungen sauber abschließen (CV + Motivationsschreiben)',
    },
    {
      name: 'Samweis Gamdschie',
      bio: 'Praktisch, hilfsbereit und bodenständig. Ich mag klare Aufgaben, Handwerkliches und Teamarbeit.',
      strengths: ['Hilfsbereitschaft', 'Praktisches Denken', 'Durchhaltewille', 'Teamplayer'],
      interests: ['Garten/Natur', 'Kochen', 'Technik im Alltag', 'Service & Kundenkontakt'],
      values: ['Loyalität', 'Fleiß', 'Ehrlichkeit'],
      jobTargets: ['Fachmann Betriebsunterhalt EFZ', 'Detailhandelsfachmann/-frau EFZ'],
      currentPhase: 'Orientieren',
      weeklyFocus: 'Schnuppertermine organisieren & nachfassen',
    },
    {
      name: 'Aragorn',
      bio: 'Ich kann Verantwortung übernehmen und ruhig bleiben. Ich möchte später eine Lehre mit Perspektive und Abwechslung.',
      strengths: ['Führung', 'Verantwortung', 'Krisenruhe', 'Kommunikation'],
      interests: ['Sport', 'Outdoor', 'Organisation', 'Sicherheit/Logistik'],
      values: ['Verlässlichkeit', 'Mut', 'Gerechtigkeit'],
      jobTargets: ['Logistiker:in EFZ', 'Fachmann Sicherheit & Bewachung EFZ'],
      currentPhase: 'Bewerben',
      weeklyFocus: 'Lernzielkontrolle vorbereiten + Bewerbungsgespräche üben',
    },
    {
      name: 'Legolas Grünblatt',
      bio: 'Schnell im Kopf, visuell stark. Ich mag präzises Arbeiten und digitale Tools.',
      strengths: ['Konzentration', 'Visuelles Denken', 'Schnelles Lernen', 'Kreativität'],
      interests: ['Design', 'Video', 'Coding', 'Fotografie'],
      values: ['Qualität', 'Ästhetik', 'Weiterentwicklung'],
      jobTargets: ['Informatiker:in EFZ (Applikationsentwicklung)', 'Mediamatiker:in EFZ'],
      currentPhase: 'Bewerben',
      weeklyFocus: 'Portfolio-Seite verbessern + Lernzielkontrolle Informatik',
    },
    {
      name: 'Gimli',
      bio: 'Direkt, ehrlich und belastbar. Ich mag klare Resultate und handfeste Projekte.',
      strengths: ['Belastbarkeit', 'Genauigkeit', 'Durchziehen', 'Handwerkliches Geschick'],
      interests: ['Metall/Mechanik', 'Werkzeuge', 'Mathe praktisch', 'Technik'],
      values: ['Respekt', 'Stolz auf Arbeit', 'Fairness'],
      jobTargets: ['Konstrukteur:in EFZ', 'Polymechaniker:in EFZ'],
      currentPhase: 'Orientieren',
      weeklyFocus: 'Mathe festigen (Brüche/Prozent) – für Aufnahme-Tests',
    },
    {
      name: 'Gandalf',
      bio: 'Ich sehe das große Ganze und kann motivieren. Ich will eine Lehre, bei der ich Menschen und Ideen zusammenbringe.',
      strengths: ['Coaching', 'Präsentation', 'Kreatives Denken', 'Planung'],
      interests: ['Bildung', 'Medien', 'Technologie', 'Projektleitung'],
      values: ['Neugier', 'Haltung', 'Selbstwirksamkeit'],
      jobTargets: ['Kaufmann/Kauffrau EFZ', 'Mediamatiker:in EFZ'],
      currentPhase: 'Bewerben',
      weeklyFocus: 'Präsentation für Mini-Lektion vorbereiten',
    },
  ];

  const makeCommonNotifications = (studentName: string): Notification[] => [
    {
      id: mkId('n'),
      title: 'Lernzielkontrolle angekündigt',
      message: 'ABU: Nächste Woche Lernzielkontrolle “Argumentieren & Quellen”. Bitte Lernziele im Logbuch abhaken.',
      date: 'Heute',
      read: false,
      type: 'alert',
    },
    {
      id: mkId('n'),
      title: 'Auftrag',
      message: `Auftrag: ${studentName} – aktualisiere dein Bewerbungsdossier (CV + 1 Motivationsschreiben) bis Freitag.`,
      date: 'Diese Woche',
      read: true,
      type: 'info',
    },
  ];

  const makeBaselApplications = (targets: string[]): ApplicationLog[] => {
    // bewusst Basel / Region Basel, ohne Roche & Novartis
    const pool: Array<Pick<ApplicationLog, 'company' | 'role' | 'status' | 'note'>> = [
      { company: 'Baloise', role: 'Kaufmann/Kauffrau EFZ', status: 'sent', note: 'Bewerbung über Website eingereicht. Nächster Schritt: Nachfassen in 7 Tagen.' },
      { company: 'Basler Kantonalbank', role: 'Kaufmann/Kauffrau EFZ', status: 'shortlist', note: 'Einladung zum Online-Test erhalten. Vorbereitung: Deutsch/Mathe.' },
      { company: 'IWB Basel', role: 'Informatiker:in EFZ', status: 'interview', note: 'Gespräch bestätigt. Fragen: Motivation, Projekte, Teamarbeit.' },
      { company: 'BVB (Basler Verkehrs-Betriebe)', role: 'Logistiker:in EFZ', status: 'sent', note: 'Unterlagen komplett. Warten auf Rückmeldung.' },
      { company: 'Universität Basel', role: 'Informatiker:in EFZ', status: 'rejected', note: 'Resilienz-Check: Mehr eigene Projekte/Portfolio zeigen. Nächstes Mal GitHub-Link.' },
      { company: 'Kanton Basel-Stadt', role: 'Kaufmann/Kauffrau EFZ', status: 'trial', note: 'Schnuppertermin angefragt/vereinbart. Ziele: Auftreten & Pünktlichkeit.' },
      { company: 'Theater Basel', role: 'Mediamatiker:in EFZ', status: 'sent', note: 'Portfolio-Link ergänzt. Fokus: Video/Foto-Proben.' },
      { company: 'Coop Region Basel', role: 'Detailhandelsfachmann/-frau EFZ', status: 'interview', note: 'Vorstellungsgespräch: Kundenkontakt & Zuverlässigkeit betonen.' },
      { company: 'Migros Basel', role: 'Detailhandelsfachmann/-frau EFZ', status: 'shortlist', note: 'Rückmeldung positiv, evtl. Schnuppern.' },
      { company: 'Endress+Hauser (Reinach)', role: 'Polymechaniker:in EFZ', status: 'sent', note: 'Motivation auf Technik/Präzision ausgerichtet.' },
      { company: 'Sutter Begg', role: 'Detailhandelsfachmann/-frau EFZ', status: 'trial', note: 'Schnuppern: Hygiene, Tempo, Team.' },
      { company: 'MCH Group (Basel)', role: 'Logistiker:in EFZ', status: 'sent', note: 'Bewerbung mit Fokus “Organisation/Events”.' },
    ];

    // einfache Auswahl passend zu Jobzielen
    const pick = (needle: string) => pool.filter((p) => p.role.toLowerCase().includes(needle));
    const byTarget =
      targets.some((t) => t.toLowerCase().includes('informatiker'))
        ? pick('informatiker')
        : targets.some((t) => t.toLowerCase().includes('mediamatiker'))
          ? pick('mediamatiker').concat(pick('kaufmann'))
          : targets.some((t) => t.toLowerCase().includes('logistiker'))
            ? pick('logistiker').concat(pick('sicherheit'))
            : targets.some((t) => t.toLowerCase().includes('detailhandel'))
              ? pick('detailhandel')
              : pool;

    const fallback = pool.slice(0, 3);
    const chosen = (byTarget.length ? byTarget : fallback).slice(0, 3);

    return chosen.map((c) => ({
      id: mkId('app'),
      company: c.company,
      role: c.role,
      status: c.status,
      date: new Date().toLocaleDateString('de-CH'),
      note: c.note,
    }));
  };

  const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const makeGrades = (focus: 'sprachlich' | 'mathe' | 'digital', studentIdx: number): StudentRecord['grades'] => {
    const base = [
      { subject: 'Deutsch', value: randomBetween(4.0, 5.8), date: '2025-10-18', type: 'Prüfung' as const },
      { subject: 'Allgemeinbildung', value: randomBetween(4.2, 5.9), date: '2025-11-05', type: 'Projekt' as const },
      { subject: 'Mathematik', value: randomBetween(3.8, 5.5), date: '2025-11-22', type: 'Prüfung' as const },
      { subject: 'Sport', value: randomBetween(4.5, 6.0), date: '2025-12-06', type: 'Vortrag' as const },
      { subject: 'B-MOT', value: randomBetween(4.0, 5.7), date: '2026-01-10', type: 'Projekt' as const },
    ];
    // Leichte Anpassung basierend auf Focus
    if (focus === 'sprachlich') return base.map((g) => (g.subject === 'Deutsch' ? { ...g, value: Math.min(6.0, g.value + randomBetween(0.2, 0.8)) } : g));
    if (focus === 'mathe') return base.map((g) => (g.subject === 'Mathematik' ? { ...g, value: Math.min(6.0, g.value + randomBetween(0.3, 0.9)) } : g));
    return base.map((g) => (g.subject === 'B-MOT' ? { ...g, value: Math.min(6.0, g.value + randomBetween(0.2, 0.7)) } : g));
  };

  const makeProjects = (studentName: string, archetype: 'story' | 'hands' | 'leader' | 'digital' | 'mechanic' | 'mentor', studentIdx: number): Project[] => {
    const passion: Project = {
      id: mkId('p'),
      title:
        archetype === 'digital'
          ? 'Passion Project: Mini-Portfolio Website'
          : archetype === 'mechanic'
            ? 'Passion Project: Werkstück & Dokumentation'
            : archetype === 'hands'
              ? 'Passion Project: “Gutes Team im Alltag”'
              : archetype === 'leader'
                ? 'Passion Project: Organisations-Plan (Event/Projekt)'
                : archetype === 'mentor'
                  ? 'Passion Project: Lern-Coaching Guide'
                  : 'Passion Project: Storytelling-Portfolio',
      type: 'passion',
      status: 'active',
      currentPhase: 'Umsetzung',
      passionQuestion:
        archetype === 'digital'
          ? 'Wie zeige ich meine Skills so, dass Betriebe sofort verstehen, was ich kann?'
          : archetype === 'mechanic'
            ? 'Wie beweise ich Präzision & Planung – Schritt für Schritt?'
            : archetype === 'hands'
              ? 'Wie bleibe ich zuverlässig und helfe anderen, ohne mich zu überfordern?'
              : archetype === 'leader'
                ? 'Wie plane ich Aufgaben so, dass ein Team wirklich ins Ziel kommt?'
                : archetype === 'mentor'
                  ? 'Wie kann ich anderen helfen, zu lernen – ohne Druck?'
                  : 'Wie erzähle ich meine Lernreise so, dass sie authentisch wirkt?',
      subjects: ['Deutsch', 'ABU'],
      milestones: [
        { id: mkId('m'), week: 3, text: 'Ziel definieren + Plan machen', completed: true },
        { id: mkId('m'), week: 4, text: 'Ersten Prototyp bauen', completed: randomInt(0, 1) === 1 },
        { id: mkId('m'), week: 5, text: 'Feedback holen & verbessern', completed: false },
      ],
      resources: [{ id: mkId('res'), title: 'Checkliste, Beispiele, Feedback', type: 'note' }],
      entries: [
        {
          id: mkId('e'),
          date: '22.01.2026',
          phase: 'Umsetzung',
          content: `${studentName}: Heute habe ich den nächsten Schritt geplant und ein Feedback notiert.`,
          teacherFeedback: 'Guter Fokus – als Nächstes: konkretes Beispiel ergänzen.',
        },
      ],
      lastUpdated: '2026-01-22',
    };

    const miniLesson: Project = {
      id: mkId('p'),
      title:
        archetype === 'digital'
          ? 'Mini-Lektion: KI als Lernhilfe (Prompting Basics)'
          : archetype === 'mechanic'
            ? 'Mini-Lektion: Prozentrechnen im Alltag (Material/Kosten)'
            : archetype === 'hands'
              ? 'Mini-Lektion: Hygieneregeln & Arbeitsabläufe'
              : archetype === 'leader'
                ? 'Mini-Lektion: Kommunikation im Team (klar & respektvoll)'
                : archetype === 'mentor'
                  ? 'Mini-Lektion: Lernstrategien (Spaced Repetition)'
                  : 'Mini-Lektion: Argumentieren (ABU) in 15 Minuten',
      type: 'mini',
      status: randomInt(0, 1) === 0 ? 'planning' : 'active',
      currentPhase: 'Planen',
      passionQuestion: 'Wie erkläre ich ein Thema so, dass es andere sofort verstehen?',
      subjects: ['Deutsch', 'B-MOT'],
      milestones: [
        { id: mkId('m'), week: 6, text: 'Kurz-Input strukturieren (3 Punkte)', completed: randomInt(0, 1) === 1 },
        { id: mkId('m'), week: 6, text: '1 Übung + 1 Mini-Check vorbereiten', completed: false },
      ],
      resources: [{ id: mkId('res'), title: 'Notizen, Beispiele, 1 Seite Handout', type: 'note' }],
      entries: [],
      lastUpdated: '2026-01-20',
    };

    const lzkAnnouncement: Project = {
      id: mkId('p'),
      title: 'LZK: ABU “Quellen & Argumente”',
      type: 'exam',
      status: 'planning',
      passionQuestion: 'Wie bereite ich mich gezielt vor statt “einfach alles” zu lernen?',
      currentPhase: 'Planen',
      subjects: ['ABU', 'Deutsch'],
      milestones: [
        { id: mkId('m'), week: 5, text: 'Lernziele prüfen & 10 Karteikarten', completed: randomInt(0, 1) === 1 },
        { id: mkId('m'), week: 5, text: '1 Übungsaufsatz (45min)', completed: false },
      ],
      resources: [{ id: mkId('res'), title: 'Lernziele, Musterlösung', type: 'note' }],
      entries: [],
      lastUpdated: '2026-01-18',
    };

    // Zusätzliche Projekte für Vielfalt
    const additionalProjects: Project[] = [];
    
    // Bewerbungsprojekt (70% Chance)
    if (randomInt(0, 2) !== 0) {
      const companies = ['Baloise', 'IWB Basel', 'Theater Basel', 'Kanton Basel-Stadt', 'Coop Region Basel', 'Migros Basel', 'BVB', 'Universität Basel'];
      additionalProjects.push({
        id: mkId('p'),
        title: `Bewerbung: ${companies[randomInt(0, companies.length - 1)]}`,
        type: 'application',
        status: ['planning', 'active'][randomInt(0, 1)] as 'planning' | 'active',
        currentPhase: 'Umsetzung',
        passionQuestion: 'Wie überzeuge ich mit meinem Motivationsschreiben?',
        subjects: ['Deutsch'],
        milestones: [
          { id: mkId('m'), week: 7, text: 'CV aktualisieren', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 8, text: 'Motivationsschreiben verfassen', completed: false },
        ],
        resources: [{ id: mkId('res'), title: 'Vorlagen, Portfolio', type: 'note' }],
        entries: [],
        lastUpdated: '2026-01-25',
      });
    }

    // Schnupperlehre (60% Chance)
    if (randomInt(0, 2) !== 0) {
      const berufe = ['Mediamatik', 'Informatik', 'Detailhandel', 'Logistik', 'Polymechanik', 'Grafik'];
      additionalProjects.push({
        id: mkId('p'),
        title: 'Schnupperlehre: ' + berufe[randomInt(0, berufe.length - 1)],
        type: 'trial',
        status: randomInt(0, 1) === 0 ? 'planning' : 'completed',
        currentPhase: 'Recherche',
        passionQuestion: 'Passt dieser Beruf wirklich zu mir?',
        subjects: ['BO'],
        milestones: [
          { id: mkId('m'), week: 4, text: 'Termin vereinbaren', completed: true },
          { id: mkId('m'), week: 5, text: 'Schnuppern absolvieren', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 6, text: 'Reflexion schreiben', completed: false },
        ],
        resources: [{ id: mkId('res'), title: 'Fragenliste, Notizblock', type: 'note' }],
        entries: randomInt(0, 1) === 1 ? [{
          id: mkId('e'),
          date: '15.01.2026',
          phase: 'Abschluss',
          content: `${studentName}: Schnuppern war sehr aufschlussreich.`,
        }] : [],
        lastUpdated: '2026-01-15',
      });
    }

    // Gruppenarbeit (50% Chance)
    if (randomInt(0, 1) === 1) {
      const groupTopics = ['Präsentation: Nachhaltigkeit', 'Projekt: Schulzeitung', 'Workshop: Teamwork', 'Event: Abschlussfeier'];
      additionalProjects.push({
        id: mkId('p'),
        title: groupTopics[randomInt(0, groupTopics.length - 1)],
        type: 'group',
        status: ['planning', 'active', 'completed'][randomInt(0, 2)] as 'planning' | 'active' | 'completed',
        currentPhase: 'Umsetzung',
        passionQuestion: 'Wie arbeite ich erfolgreich im Team?',
        subjects: ['B-MOT', 'Deutsch'],
        milestones: [
          { id: mkId('m'), week: 2, text: 'Team bilden & Rollen klären', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 3, text: 'Aufgaben verteilen', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 4, text: 'Zwischenpräsentation', completed: false },
        ],
        resources: [{ id: mkId('res'), title: 'Team-Chat, Trello', type: 'note' }],
        entries: randomInt(0, 1) === 1 ? [{
          id: mkId('e'),
          date: '20.01.2026',
          phase: 'Umsetzung',
          content: `${studentName}: Team-Meeting war produktiv.`,
        }] : [],
        lastUpdated: '2026-01-20',
      });
    }

    // Reflexionsprojekt (40% Chance)
    if (randomInt(0, 2) !== 0) {
      additionalProjects.push({
        id: mkId('p'),
        title: 'Reflexion: Meine Lernreise',
        type: 'reflection',
        status: ['planning', 'active'][randomInt(0, 1)] as 'planning' | 'active',
        currentPhase: 'Recherche',
        passionQuestion: 'Was habe ich bisher gelernt und wie kann ich mich weiterentwickeln?',
        subjects: ['ABU'],
        milestones: [
          { id: mkId('m'), week: 6, text: 'Stärken & Schwächen analysieren', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 7, text: 'Ziele für nächste Phase setzen', completed: false },
        ],
        resources: [{ id: mkId('res'), title: 'Reflexionsfragen, Logbuch', type: 'note' }],
        entries: [],
        lastUpdated: '2026-01-24',
      });
    }

    // Todo/Termin-Projekt (50% Chance)
    if (randomInt(0, 1) === 1) {
      const todos = ['Vorbereitung: Aufnahmeprüfung', 'Termin: Berufsberatung', 'Deadline: Portfolio-Abgabe', 'Event: Berufsmesse'];
      additionalProjects.push({
        id: mkId('p'),
        title: todos[randomInt(0, todos.length - 1)],
        type: 'todo',
        status: ['planning', 'active'][randomInt(0, 1)] as 'planning' | 'active',
        currentPhase: 'Planen',
        passionQuestion: 'Wie organisiere ich mich für wichtige Termine?',
        subjects: ['BO', 'B-MOT'],
        milestones: [
          { id: mkId('m'), week: 3, text: 'Termin notieren & vorbereiten', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 4, text: 'Materialien sammeln', completed: false },
        ],
        resources: [{ id: mkId('res'), title: 'Kalender, Checkliste', type: 'note' }],
        entries: [],
        lastUpdated: '2026-01-23',
      });
    }

    // Zusätzliche Prüfung (30% Chance)
    if (randomInt(0, 2) === 0) {
      const exams = ['LZK: Mathematik', 'Prüfung: Deutsch', 'Test: Allgemeinbildung'];
      additionalProjects.push({
        id: mkId('p'),
        title: exams[randomInt(0, exams.length - 1)],
        type: 'exam',
        status: 'planning',
        currentPhase: 'Planen',
        passionQuestion: 'Wie bereite ich mich effizient vor?',
        subjects: [['Mathematik', 'Deutsch', 'Allgemeinbildung'][randomInt(0, 2)]],
        milestones: [
          { id: mkId('m'), week: 5, text: 'Lernplan erstellen', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 6, text: 'Übungsaufgaben lösen', completed: false },
        ],
        resources: [{ id: mkId('res'), title: 'Altprüfungen, Formelsammlung', type: 'note' }],
        entries: [],
        lastUpdated: '2026-01-19',
      });
    }

    // Zusätzliches Passion Project (30% Chance)
    if (randomInt(0, 2) === 0) {
      const passionTopics = [
        'Passion Project: Video-Tutorial erstellen',
        'Passion Project: Blog über Hobby',
        'Passion Project: Praktische Anwendung (z.B. Reparatur)',
        'Passion Project: Kreatives Werk'
      ];
      additionalProjects.push({
        id: mkId('p'),
        title: passionTopics[randomInt(0, passionTopics.length - 1)],
        type: 'passion',
        status: ['planning', 'active'][randomInt(0, 1)] as 'planning' | 'active',
        currentPhase: 'Umsetzung',
        passionQuestion: 'Wie zeige ich meine Leidenschaft praktisch?',
        subjects: ['B-MOT', 'Deutsch'],
        milestones: [
          { id: mkId('m'), week: 4, text: 'Konzept entwickeln', completed: randomInt(0, 1) === 1 },
          { id: mkId('m'), week: 5, text: 'Umsetzung starten', completed: false },
        ],
        resources: [{ id: mkId('res'), title: 'Inspiration, Tools', type: 'note' }],
        entries: [],
        lastUpdated: '2026-01-21',
      });
    }

    return [passion, miniLesson, lzkAnnouncement, ...additionalProjects];
  };

  const makeGoals = (archetype: string): Goal[] => {
    const goals: Goal[] = [
      { id: mkId('g'), text: '2 Bewerbungen finalisieren (CV + MS)', type: 'short', completed: false },
      { id: mkId('g'), text: 'Lernzielkontrolle: 2× üben', type: 'short', completed: false },
      { id: mkId('g'), text: '1 Passion Project Schritt pro Woche', type: 'long', completed: false },
    ];
    if (archetype === 'mechanic') goals.unshift({ id: mkId('g'), text: 'Mathe: Prozent/Brüche wiederholen', type: 'short', completed: true });
    if (archetype === 'hands') goals.unshift({ id: mkId('g'), text: 'Pünktlichkeit 5/5 Tage', type: 'short', completed: false });
    return goals;
  };

  const makeDocuments = (studentName: string): DossierDocument[] => [
    { id: mkId('d'), title: `Lebenslauf_${studentName.replaceAll(' ', '_')}.pdf`, type: 'pdf', date: 'Jan 26', size: '0.9 MB' },
    { id: mkId('d'), title: `Motivationsschreiben_${studentName.replaceAll(' ', '_')}.pdf`, type: 'pdf', date: 'Jan 26', size: '0.7 MB' },
    { id: mkId('d'), title: `Zeugnisse_2025.pdf`, type: 'pdf', date: 'Dez 25', size: '2.0 MB' },
  ];

  const makeReflections = (studentName: string): ReflectionEntry[] => [
    { id: mkId('r'), date: '27.01.2026', content: `${studentName}: Heute habe ich gemerkt, dass ich mit einem Plan schneller bin als mit Stress.` },
    { id: mkId('r'), date: '23.01.2026', content: 'Ich habe Feedback angenommen und 1 Sache konkret verbessert.' },
  ];

  const archetypes: Array<'story' | 'hands' | 'leader' | 'digital' | 'mechanic' | 'mentor'> = [
    'story',
    'hands',
    'leader',
    'digital',
    'mechanic',
    'mentor',
  ];

  return names.map((name, idx) => {
    const sid = `s${idx + 1}`;
    const p = lotrProfiles[idx];
    const archetype = archetypes[idx];
    // Randomisierte Stimmung (1-5, 0 = nicht gesetzt)
    const moodValues = Array.from({ length: 5 }, () => {
      const rand = randomInt(0, 10);
      if (rand === 0) return 0; // Manchmal nicht gesetzt
      return randomInt(1, 5);
    });

    // Randomisierte Habits (variiert pro Student)
    const habits = Array.from({ length: 5 }, () => randomInt(0, 1) === 1);

    const profile = {
      ...INITIAL_PROFILE,
      name: p.name,
      class: demoClass,
      bio: p.bio,
      strengths: p.strengths,
      interests: p.interests,
      values: p.values,
      jobTargets: p.jobTargets,
      currentPhase: p.currentPhase,
      weeklyFocus: p.weeklyFocus,
      mood: moodValues,
      weeklyHabits: habits,
      level: randomInt(2, 5),
      xp: randomInt(400, 1100),
      nextLevelXp: 1200,
      achievements: [], // Wird durch Migration mit 25+ Erfolgen gefüllt
    };

    const gradesFocus = archetype === 'mechanic' ? 'mathe' : archetype === 'digital' ? 'digital' : 'sprachlich';

    // Randomisierte Skills
    const randomizedSkills = baseSkills.map((s) => ({
      ...s,
      value: randomInt(3, 9),
    }));

    const defaultTiles: LogbuchTile[] = [
      { id: mkId('t'), type: 'project', size: 'large', order: 0 },
      { id: mkId('t'), type: 'competency', size: 'medium', order: 1 },
      { id: mkId('t'), type: 'mood', size: 'small', order: 2 },
      { id: mkId('t'), type: 'profile', size: 'medium', order: 3 },
      { id: mkId('t'), type: 'focus', size: 'medium', order: 4 },
      { id: mkId('t'), type: 'grades', size: 'small', order: 5 },
      { id: mkId('t'), type: 'achievements', size: 'large', order: 6 },
    ];

    return {
      id: sid,
      profile,
      skills: randomizedSkills as any,
      grades: makeGrades(gradesFocus, idx),
      goals: makeGoals(archetype),
      projects: makeProjects(name, archetype, idx),
      reflections: makeReflections(name),
      documents: makeDocuments(name),
      applications: makeBaselApplications(p.jobTargets || []),
      notifications: makeCommonNotifications(name),
      logbuchTiles: defaultTiles,
      calendarEvents: [
        { id: mkId('ev'), title: 'LZK: ABU Quellen & Argumente', type: 'pruefung', date: '2026-02-15', allDay: true },
        { id: mkId('ev'), title: 'Portfolio-Abgabe', type: 'deadline', date: '2026-02-28', allDay: true },
      ],
      timetable: [
        { weekday: 0, slotIndex: 0, title: 'Deutsch' },
        { weekday: 0, slotIndex: 1, title: 'Mathematik' },
        { weekday: 2, slotIndex: 0, title: 'ABU' },
      ],
    };
  });
}

function createDefaultAppData(): AppData {
  const students = createDemoStudents();
  return {
    version: APPDATA_VERSION,
    selectedStudentId: students[0]?.id || 's1',
    students,
    teacherNotifications: [],
  };
}

// Migrates old achievements to the new 25+ achievement system
function migrateAchievements(data: AppData, forceMigration: boolean = false): AppData {
  const result = {
    ...data,
    students: data.students.map(student => {
      const achievements = student.profile.achievements ?? [];
      // Check if achievements need migration (old format has <20 items or missing 'category')
      const needsMigration = 
        forceMigration ||
        achievements.length < 20 || 
        !achievements[0]?.category;
      
      if (needsMigration) {
        console.log(`[Migration] Upgrading achievements for ${student.profile.name}: ${achievements.length} -> 25+`);
        const newAchievements = initializeAchievements(student);
        return {
          ...student,
          profile: {
            ...student.profile,
            achievements: newAchievements,
          }
        };
      }
      return student;
    }),
  };
  
  // Mark migration as complete
  markAchievementsMigrated();
  return result;
}

const App: React.FC = () => {
  const [currentSector, setCurrentSector] = useState<Sector>(Sector.COMPASS);

  const [appData, setAppData] = useState<AppData>(() => {
    const loaded = loadAppData();
    const forceMigration = needsAchievementsMigration();
    const data = !loaded
      ? migrateAchievements(createDefaultAppData(), forceMigration)
      : migrateAchievements(loaded, forceMigration);
    if (data.teacherNotifications == null) data.teacherNotifications = [];
    return migrateStudentsProjects(data);
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentStudent = useMemo(() => {
    return appData.students.find((s) => s.id === appData.selectedStudentId) || appData.students[0];
  }, [appData.selectedStudentId, appData.students]);

  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const updateStudent = (studentId: string, updater: (s: StudentRecord) => StudentRecord) => {
    setAppData((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === studentId ? updater(s) : s)),
    }));
  };

  // Derived “current” data for components
  const profile = currentStudent.profile;
  const skills = currentStudent.skills;
  const goals = currentStudent.goals;
  const projects = currentStudent.projects;
  const grades = currentStudent.grades;
  const notifications = currentStudent.notifications;
  const reflections = currentStudent.reflections;
  const documents = currentStudent.documents;
  const applicationLogs = currentStudent.applications;
  const mainProjectId = currentStudent.mainProjectId;
  const competencyData = currentStudent.competencyData;
  const logbuchTiles = currentStudent.logbuchTiles ?? [];
  const calendarEvents = currentStudent.calendarEvents ?? [];
  const timetable = currentStudent.timetable ?? [];

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // ===== Achievement System State =====
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Achievement[]>([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState<{ show: boolean; newLevel: number }>({ show: false, newLevel: 0 });
  const [xpGained, setXpGained] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });

  // ===== Achievement Checking =====
  const checkAndUpdateAchievements = useCallback((studentId: string) => {
    setAppData((prev) => {
      const student = prev.students.find(s => s.id === studentId);
      if (!student) return prev;
      
      // Initialize achievements if empty
      const currentAchievements = student.profile.achievements.length > 0 
        ? student.profile.achievements 
        : initializeAchievements(student);
      
      // Check for newly unlocked achievements
      const result = checkAchievements(student, currentAchievements);
      
      if (result.newlyUnlocked.length > 0) {
        // Award XP for newly unlocked achievements
        const xpResult = awardXP(student.profile, result.totalXpAwarded);
        
        // Schedule UI updates (outside of setState)
        setTimeout(() => {
          setNewlyUnlockedAchievements(result.newlyUnlocked);
          setXpGained({ amount: result.totalXpAwarded, show: true });
          
          if (xpResult.leveledUp) {
            setTimeout(() => {
              setShowLevelUpModal({ show: true, newLevel: xpResult.newLevel });
            }, 1500);
          }
          
          // Trigger confetti
          (window as any).confetti?.({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 100);
        
        // Update student with new achievements and XP
        return {
          ...prev,
          students: prev.students.map(s => 
            s.id === studentId 
              ? { 
                  ...s, 
                  profile: {
                    ...xpResult.profile,
                    achievements: result.updated,
                  }
                }
              : s
          ),
        };
      }
      
      // Update achievements (for progress tracking) even if nothing unlocked
      return {
        ...prev,
        students: prev.students.map(s => 
          s.id === studentId 
            ? { 
                ...s, 
                profile: {
                  ...s.profile,
                  achievements: result.updated,
                }
              }
            : s
        ),
      };
    });
  }, []);

  // Clear achievement notifications after display
  const clearAchievementNotification = useCallback(() => {
    setNewlyUnlockedAchievements([]);
  }, []);

  const clearXpNotification = useCallback(() => {
    setXpGained({ amount: 0, show: false });
  }, []);

  const closeLevelUpModal = useCallback(() => {
    setShowLevelUpModal({ show: false, newLevel: 0 });
  }, []);

  const handleUpdateLogbuchTiles = (tiles: LogbuchTile[]) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, logbuchTiles: tiles }));
  };

  const handleUpdateCompetencyData = (data: { categories: import('./types').CompetencyCategory[] }) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, competencyData: data }));
  };

  const handleExportBackup = () => {
    exportAppDataAsJson(appData);
  };

  const [importError, setImportError] = useState(false);

  const handleImportBackup = async (file: File) => {
    const text = await file.text();
    const imported = importAppDataFromJson(text);
    if (!imported) {
      setImportError(true);
      setTimeout(() => setImportError(false), 3000);
      return;
    }
    setAppData(imported);
  };

  const handleUpdateProjectStatus = (projectId: string, newStatus: Project['status']) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const currentPhase: ProjectPhase = newStatus === 'completed' ? 'Abschluss' : newStatus === 'active' ? (p.currentPhase === 'Planen' ? 'Umsetzung' : p.currentPhase) : p.currentPhase;
        return { ...p, status: newStatus, currentPhase, lastUpdated: new Date().toISOString().split('T')[0] };
      }),
    }));
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    const withTimestamp = { ...updatedProject, lastUpdated: new Date().toISOString().split('T')[0] };
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === withTimestamp.id ? withTimestamp : p)),
    }));
    // Check achievements (milestone completion, diary entries)
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleAddProject = (newProject: Project) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, projects: [...s.projects, newProject] }));
    // Check achievements for first/multiple projects
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleDeleteProject = (projectId: string) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      projects: s.projects.filter((p) => p.id !== projectId),
      mainProjectId: s.mainProjectId === projectId ? undefined : s.mainProjectId,
    }));
  };

  // Goal Logic (Lifted from Compass)
  const handleToggleGoal = (id: string) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
    }));
  };

  const handleAddGoal = (text: string) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      text,
      type: 'short',
      completed: false
    };
    updateStudent(currentStudent.id, (s) => ({ ...s, goals: [...s.goals, newGoal] }));
  };

  // Reflection Logic
  const handleAddReflection = (content: string) => {
      const newReflection: ReflectionEntry = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('de-CH'),
          content
      };
      updateStudent(currentStudent.id, (s) => ({ ...s, reflections: [newReflection, ...s.reflections] }));
      // Check achievements for reflections
      setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  // Showcase Handlers
  const handleAddApplication = (newApp: ApplicationLog) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, applications: [...s.applications, newApp] }));
    // Check achievements for applications
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleUpdateApplicationStatus = (id: string, status: ApplicationLog['status']) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      applications: s.applications.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
    // Check achievements (invited, trial, offer)
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleUpdateApplicationNote = (id: string, note: string) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      applications: s.applications.map((a) => (a.id === id ? { ...a, note } : a)),
    }));
  };

  const handleAddDocument = (newDoc: DossierDocument) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, documents: [...s.documents, newDoc] }));
    // Check achievements for documents
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleUpdateDocument = (updatedDoc: DossierDocument) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      documents: s.documents.map((d) => d.id === updatedDoc.id ? updatedDoc : d)
    }));
  };

  const handleDeleteDocument = (id: string) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, documents: s.documents.filter((d) => d.id !== id) }));
  };

  const handleReorderDocuments = (orderedDocs: DossierDocument[]) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, documents: orderedDocs }));
  };

  const handleUpdateCalendarEvents = (events: CalendarEvent[]) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, calendarEvents: events }));
  };

  const handleUpdateTimetable = (entries: TimetableEntry[]) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, timetable: entries }));
  };

  // Teacher Handlers
  const handleSendNotification = (newNotif: Notification) => {
      updateStudent(currentStudent.id, (s) => ({ ...s, notifications: [newNotif, ...s.notifications] }));
      // Optional: Auto open notifications to show result
      if (currentSector !== Sector.TEACHER) {
          setIsNotifOpen(true);
      }
  };

  const handleDeleteNotification = (notifId: string) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      notifications: s.notifications.filter((n) => n.id !== notifId),
    }));
  };

  const markAllRead = () => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    setIsNotifOpen(false);
  };

  const handleSetProfile = (nextProfile: any) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, profile: nextProfile }));
    // Check achievements (bio filled, mood tracked, habits completed)
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleAddGrade = (grade: { subject: string; value: number; date: string; type: 'Prüfung' | 'Vortrag' | 'Projekt' }) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, grades: [...s.grades, grade] }));
    setTimeout(() => checkAndUpdateAchievements(currentStudent.id), 100);
  };

  const handleUpdateGrade = (index: number, grade: { subject: string; value: number; date: string; type: 'Prüfung' | 'Vortrag' | 'Projekt' }) => {
    updateStudent(currentStudent.id, (s) => {
      const newGrades = [...s.grades];
      newGrades[index] = grade;
      return { ...s, grades: newGrades };
    });
  };

  const handleDeleteGrade = (index: number) => {
    updateStudent(currentStudent.id, (s) => ({
      ...s,
      grades: s.grades.filter((_, i) => i !== index),
    }));
  };

  const handleSetMainProject = (projectId: string) => {
    updateStudent(currentStudent.id, (s) => ({ ...s, mainProjectId: projectId }));
  };

  const handleSelectStudent = (id: string) => {
    setAppData((prev) => ({ ...prev, selectedStudentId: id }));
    setIsNotifOpen(false);
  };

  const handleResetDemo = () => {
    clearAppData();
    setAppData(createDefaultAppData());
    setIsNotifOpen(false);
    setCurrentSector(Sector.COMPASS);
  };

  const handleStartFresh = (studentCount: number = 5) => {
    clearAppData();
    const emptyStudents = createEmptyStudents(studentCount);
    const freshData: AppData = {
      version: APPDATA_VERSION,
      selectedStudentId: emptyStudents[0]?.id || 'student_1',
      students: emptyStudents,
      teacherNotifications: [],
    };
    setAppData(freshData);
    setIsNotifOpen(false);
    setCurrentSector(Sector.COMPASS);
  };

  const handleMoodMessageForTeacher = (message: string, moodValue: number) => {
    const teacherNotifications: TeacherNotification[] = appData.teacherNotifications ?? [];
    const newNotif: TeacherNotification = {
      id: `tn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      studentId: currentStudent.id,
      studentName: currentStudent.profile.name,
      title: 'Stimmungs-Nachricht',
      message,
      date: new Date().toLocaleDateString('de-CH') + ' ' + new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'mood_message',
      moodValue,
    };
    setAppData((prev) => ({
      ...prev,
      teacherNotifications: [newNotif, ...(prev.teacherNotifications ?? [])],
    }));
  };

  const renderContent = () => {
    switch (currentSector) {
      case Sector.COMPASS:
        return (
          <Compass 
            skills={skills} 
            goals={goals} 
            onToggleGoal={handleToggleGoal}
            onAddGoal={handleAddGoal}
            profile={profile} 
            setProfile={handleSetProfile} 
            grades={grades}
            onAddGrade={handleAddGrade}
            onUpdateGrade={handleUpdateGrade}
            onDeleteGrade={handleDeleteGrade}
            onNavigate={setCurrentSector}
            projects={projects}
            mainProjectId={mainProjectId}
            reflections={reflections}
            onAddReflection={handleAddReflection}
            notifications={notifications}
            isNotifOpen={isNotifOpen}
            onToggleNotif={() => setIsNotifOpen(!isNotifOpen)}
            onMarkAllRead={markAllRead}
            onDeleteNotification={handleDeleteNotification}
            logbuchTiles={logbuchTiles}
            onUpdateLogbuchTiles={handleUpdateLogbuchTiles}
            applications={applicationLogs}
            documents={documents}
            onAddApplication={handleAddApplication}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onUpdateApplicationNote={handleUpdateApplicationNote}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onMoodMessageForTeacher={handleMoodMessageForTeacher}
            competencyData={competencyData}
            onUpdateCompetencyData={handleUpdateCompetencyData}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            newlyUnlockedAchievements={newlyUnlockedAchievements}
            onClearAchievementNotification={clearAchievementNotification}
            xpGained={xpGained}
            onClearXpNotification={clearXpNotification}
            showLevelUpModal={showLevelUpModal}
            onCloseLevelUpModal={closeLevelUpModal}
          />
        );
      case Sector.WORKSHOP:
        return (
          <Workshop 
            projects={projects} 
            onUpdateStatus={handleUpdateProjectStatus} 
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            mainProjectId={mainProjectId}
            onSetMainProject={handleSetMainProject}
            notifications={notifications}
            isNotifOpen={isNotifOpen}
            onToggleNotif={() => setIsNotifOpen(!isNotifOpen)}
            onMarkAllRead={markAllRead}
            onDeleteNotification={handleDeleteNotification}
          />
        );
      case Sector.SHOWCASE:
        return (
          <Showcase 
            projects={projects}
            documents={documents}
            applications={applicationLogs}
            profile={profile}
            skills={skills}
            grades={grades}
            competencyData={competencyData}
            onAddApplication={handleAddApplication}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onUpdateApplicationNote={handleUpdateApplicationNote}
            onAddDocument={handleAddDocument}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument}
            onReorderDocuments={handleReorderDocuments}
            notifications={notifications}
            isNotifOpen={isNotifOpen}
            onToggleNotif={() => setIsNotifOpen(!isNotifOpen)}
            onMarkAllRead={markAllRead}
            onDeleteNotification={handleDeleteNotification}
          />
        );
      case Sector.CALENDAR:
        return (
          <Calendar
            calendarEvents={calendarEvents}
            timetable={timetable}
            onUpdateCalendarEvents={handleUpdateCalendarEvents}
            onUpdateTimetable={handleUpdateTimetable}
            projects={projects}
          />
        );
      case Sector.TEACHER:
        return (
          <TeacherView 
            students={appData.students}
            selectedStudentId={appData.selectedStudentId}
            onSelectStudent={handleSelectStudent}
            onSendNotification={handleSendNotification}
            onNavigate={setCurrentSector}
            onResetDemo={handleResetDemo}
            onStartFresh={handleStartFresh}
            teacherNotifications={appData.teacherNotifications ?? []}
            onMarkTeacherNotificationRead={(id) => {
              setAppData((prev) => ({
                ...prev,
                teacherNotifications: (prev.teacherNotifications ?? []).map((n) => n.id === id ? { ...n, read: true } : n),
              }));
            }}
            onMarkAllTeacherNotificationsRead={() => {
              setAppData((prev) => ({
                ...prev,
                teacherNotifications: (prev.teacherNotifications ?? []).map((n) => ({ ...n, read: true })),
              }));
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold">
        Zum Inhalt springen
      </a>
      <Navigation 
        currentSector={currentSector} 
        setSector={setCurrentSector} 
        profile={profile}
      />
      
      <main id="main-content" role="main" className="flex-1 overflow-x-hidden overflow-y-auto h-screen relative scroll-smooth" aria-label="Hauptinhalt">
        {importError && (
          <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-lg bg-red-600 text-white flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 text-sm font-medium" role="alert">
            {LABELS.backup.importError}
          </div>
        )}
        <div className="relative z-10 p-4 md:p-8 lg:p-12 pb-24 md:pb-8 max-w-[1600px] mx-auto min-h-full">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;