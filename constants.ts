
import { Skill, StudentProfile, Project, ProjectResource, Goal, CompetencyData, Grade, ApplicationLog, Notification, Resource, DossierDocument, ReflectionEntry, Achievement, Milestone } from './types';
import type { ProjectType } from './types';

/** Feste Unterrichtszeiten (Stundenplan-Slots) */
export const TIMETABLE_SLOTS = [
  { start: '08:30', end: '10:00' },
  { start: '10:30', end: '12:00' },
  { start: '13:00', end: '14:30' },
  { start: '14:45', end: '16:15' },
] as const;

/** Bild-URLs pro Projekttyp (Picsum – stabile Platzhalter, thematisch unterschiedlich) */
export const PROJECT_IMAGE_BY_TYPE: Record<ProjectType, string> = {
  passion: 'https://picsum.photos/seed/passion-story/1200/800',
  mini: 'https://picsum.photos/seed/mini-presentation/1200/800',
  trial: 'https://picsum.photos/seed/trial-office/1200/800',
  application: 'https://picsum.photos/seed/application-docs/1200/800',
  group: 'https://picsum.photos/seed/group-team/1200/800',
  exam: 'https://picsum.photos/seed/exam-study/1200/800',
  reflection: 'https://picsum.photos/seed/reflection-diary/1200/800',
  todo: 'https://picsum.photos/seed/todo-plan/1200/800',
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Erster Schritt', description: 'Erstes Projekt gestartet', icon: '🚀', unlocked: true, dateUnlocked: '10.08.2023', xpValue: 100 },
  { id: 'a2', title: 'Tagebuch-Profi', description: '5 Tagebucheinträge verfasst', icon: '✍️', unlocked: true, dateUnlocked: '15.09.2023', xpValue: 200 },
  { id: 'a3', title: 'Reflektiert', description: 'Erste Wochenreflexion abgeschlossen', icon: '🪞', unlocked: true, dateUnlocked: '20.08.2023', xpValue: 150 },
  { id: 'a4', title: 'Drranbleiben', description: '7 Tage Habit-Streak erreicht', icon: '🔥', unlocked: false, xpValue: 500 },
  { id: 'a5', title: 'Meisterstück', description: 'Passion Project abgeschlossen', icon: '🏆', unlocked: false, xpValue: 1000 },
  { id: 'a6', title: 'Netzwerker', description: 'Bewerbung versendet', icon: '💼', unlocked: true, dateUnlocked: '01.11.2023', xpValue: 300 },
];

export const INITIAL_PROFILE: StudentProfile = {
  name: "Luca Müller",
  class: "S02",
  zbaProfile: 'Kombiniert',
  bio: "Kreativer Kopf mit Flair für digitale Lösungen. Ich suche eine Lehrstelle, in der ich Technik und Design verbinden kann.",
  strengths: ["Lösungsorientiertes Denken", "Digitale Gestaltungskraft", "Soziale Wahrnehmung", "Pünktlichkeit"],
  interests: ["User Experience (UX) Design", "Nachhaltige Technologien", "Visuelles Storytelling", "Basketball", "Gaming-Setup Bau", "Fotografie"],
  values: ["Authentizität", "Verlässlichkeit", "Stetige Weiterentwicklung"],
  jobTargets: ["Mediamatiker:in EFZ", "Grafiker:in EFZ"],
  currentPhase: "Bewerben",
  weeklyFocus: "Pünktlichkeit & Fokus",
  mood: [4, 3, 5, 4, 0],
  weeklyHabits: [true, true, false, false, false],
  level: 3,
  xp: 750,
  nextLevelXp: 1200,
  achievements: INITIAL_ACHIEVEMENTS
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Budget 1. Wohnung',
    type: 'passion',
    status: 'active',
    currentPhase: 'Umsetzung',
    passionQuestion: 'Wie viel kostet das Leben wirklich, damit ich nicht in Schulden gerate?',
    subjects: ['Mathe', 'ABU'],
    milestones: [
      { id: 'm1_1', week: 1, text: 'Wohnungsanzeigen analysieren', completed: true, phase: 'Recherche' },
      { id: 'm1_2', week: 2, text: 'Tabelle erstellen', completed: true, phase: 'Umsetzung' },
      { id: 'm1_3', week: 3, text: 'Reflexion schreiben', completed: false, phase: 'Abschluss' },
    ],
    resources: [{ id: 'p1_res1', title: 'Excel, Comparis', type: 'note' }] as ProjectResource[],
    lastUpdated: '2023-10-15',
    entries: [
      { id: 'e1', date: '02.10.2023', phase: 'Recherche', content: 'Mieten in Basel sind hoch!', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800', teacherFeedback: 'Guter Start!' }
    ]
  },
  {
    id: 'p2',
    title: 'Mini-Lektion: Origami',
    type: 'mini',
    status: 'planning',
    currentPhase: 'Planen',
    passionQuestion: 'Wie bringe ich meiner Klasse in 15 Minuten bei, einen Kranich zu falten?',
    subjects: ['Deutsch', 'Gestalten'],
    milestones: [
      { id: 'm2_1', week: 5, text: 'Anleitung zeichnen', completed: false, phase: 'Umsetzung' },
      { id: 'm2_2', week: 6, text: 'Test-Lektion mit Coach', completed: false, phase: 'Abschluss' }
    ],
    resources: [{ id: 'p2_res1', title: 'Papier, YouTube Tutorials', type: 'note' }] as ProjectResource[],
    lastUpdated: '2023-11-01',
    entries: []
  },
  {
    id: 'p3',
    title: 'Schnuppern Mediamatik',
    type: 'trial',
    status: 'completed',
    currentPhase: 'Abschluss',
    passionQuestion: 'Passt der Beruf Mediamatiker wirklich zu meinem Alltag?',
    subjects: ['BO'],
    milestones: [
      { id: 'm3_1', week: 2, text: 'Lehrstelle finden', completed: true, phase: 'Recherche' },
      { id: 'm3_2', week: 4, text: 'Schnupperbericht', completed: true, phase: 'Abschluss' }
    ],
    resources: [{ id: 'p3_res1', title: 'Notizblock, Kamera', type: 'note' }] as ProjectResource[],
    lastUpdated: '2023-09-20',
    entries: [
      { id: 'e2', date: '15.09.2023', phase: 'Abschluss', content: 'War mega cool, durfte ein Video schneiden.', teacherFeedback: 'Super, nimm das in dein Showcase auf!' }
    ]
  },
  {
    id: 'p4',
    title: 'Bewerbung Roche',
    type: 'application',
    status: 'active',
    currentPhase: 'Umsetzung',
    passionQuestion: 'Kann ich meine Stärken im Motivationsschreiben überzeugend darstellen?',
    subjects: ['Deutsch'],
    milestones: [
      { id: 'm4_1', week: 8, text: 'CV Update', completed: true, phase: 'Umsetzung' },
      { id: 'm4_2', week: 9, text: 'Absenden', completed: false, phase: 'Abschluss' }
    ],
    resources: [{ id: 'p4_res1', title: 'Portfolio, Zeugnisse', type: 'note' }] as ProjectResource[],
    lastUpdated: '2023-11-10',
    entries: []
  }
];

export const INITIAL_GRADES: Grade[] = [
  { subject: 'Deutsch', value: 5.0, date: '2023-10-15', type: 'Prüfung' },
  { subject: 'Allgemeinbildung', value: 5.5, date: '2023-10-20', type: 'Projekt' },
  { subject: 'Mathematik', value: 4.5, date: '2023-11-05', type: 'Prüfung' },
  { subject: 'Sport', value: 6.0, date: '2023-11-12', type: 'Vortrag' },
  { subject: 'B-MOT', value: 5.5, date: '2023-12-01', type: 'Projekt' },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Neues Feedback', message: 'Herr Weber hat dein Projekt kommentiert.', date: 'Heute', read: false, type: 'info' },
];

export const INITIAL_RESOURCES: Resource[] = [
  { id: 'r1', title: 'Projekt-Canvas', type: 'pdf', category: 'Planung', url: '#' },
  { id: 'r2', title: 'Lebenslauf Modern', type: 'link', category: 'Bewerbung', url: '#' },
];

export const INITIAL_SKILLS: Skill[] = [
  { subject: 'Teamfähigkeit', value: 8, fullMark: 10 },
  { subject: 'IT-Skills', value: 6, fullMark: 10 },
];

export const INITIAL_GOALS: Goal[] = [
  { id: '1', text: 'Lehrstelle finden', type: 'long', completed: false },
];

export const INITIAL_APPLICATION_LOGS: ApplicationLog[] = [
  { id: '1', company: 'Novartis', role: 'Mediamatiker EFZ', status: 'rejected', date: '2023-09-10', note: 'Resilienz-Check: Mathe-Noten waren noch zu schwach.' },
  { id: '2', company: 'Roche', role: 'Mediamatiker EFZ', status: 'interview', date: '2023-11-05', note: 'Vorstellungsgespräch am 20.11. um 14:00 Uhr.' },
  { id: '3', company: 'Swisscom', role: 'Informatiker EFZ', status: 'sent', date: '2023-11-12', note: 'Bewerbung via Portal eingereicht.' },
  { id: '4', company: 'IWB Basel', role: 'Grafiker EFZ', status: 'shortlist', date: '2023-10-28', note: 'Portfolio kam gut an, warte auf Rückmeldung.' },
];

export const INITIAL_DOCUMENTS: DossierDocument[] = [
  { id: '1', title: 'Lebenslauf_Luca_2024.pdf', type: 'pdf', date: 'Okt 23', size: '1.2 MB' },
  { id: '2', title: 'Motivationsschreiben_Roche.pdf', type: 'pdf', date: 'Nov 23', size: '0.8 MB' },
  { id: '3', title: 'Zeugnis_Sek_P2.pdf', type: 'pdf', date: 'Aug 23', size: '2.1 MB' },
  { id: '4', title: 'Bestätigung_Schnuppern_Mediamatik.pdf', type: 'pdf', date: 'Sep 23', size: '1.5 MB' },
];

export const INITIAL_REFLECTIONS: ReflectionEntry[] = [
    { id: 'r1', date: '25.10.2023', content: 'Heute habe ich gelernt, dass Planung alles ist.' },
];

export const COMPETENCY_DATA: CompetencyData = {
    categories: [
        { name: "Selbst", fullName: "Selbstkompetenz", icon: "👤", color: "#3498db", competencies: [{ id: "sk1", name: "Selbstständ.", icon: "🎯", level: 3 }, { id: "sk2", name: "Reflexion", icon: "🪞", level: 3 }] },
        { name: "Sozial", fullName: "Soziale Kompetenz", icon: "👥", color: "#2ecc71", competencies: [{ id: "so1", name: "Empathie", icon: "❤️", level: 4 }, { id: "so2", name: "Teamarbeit", icon: "🤝", level: 3 }] },
        { name: "Sprache", fullName: "Sprache", icon: "💭", color: "#1abc9c", competencies: [{ id: "sp1", name: "Sprechen", icon: "🗣️", level: 3 }, { id: "sp2", name: "Schreiben", icon: "✍️", level: 2 }] },
        { name: "Mathe", fullName: "Mathematik", icon: "🔢", color: "#e67e22", competencies: [{ id: "ma1", name: "Zahlen", icon: "➕", level: 3 }, { id: "ma2", name: "Logik", icon: "🧩", level: 4 }] },
        { name: "MINT", fullName: "MINT", icon: "🔬", color: "#e74c3c", competencies: [{ id: "mi1", name: "Technik", icon: "⚙️", level: 4 }, { id: "mi2", name: "Natur", icon: "🌿", level: 3 }] },
        { name: "Digital", fullName: "Digital", icon: "💻", color: "#9b59b6", competencies: [{ id: "di1", name: "Recherche", icon: "🔍", level: 4 }, { id: "di2", name: "Tools", icon: "🖥️", level: 3 }] }
    ]
};
