
export enum Sector {
  COMPASS = 'COMPASS',
  WORKSHOP = 'WORKSHOP',
  SHOWCASE = 'SHOWCASE',
  CALENDAR = 'CALENDAR',
  TEACHER = 'TEACHER',
}

export interface Skill {
  subject: string;
  value: number; // 1-10
  fullMark: number;
}

export interface Grade {
  subject: string;
  value: number; // 1-6
  date: string;
  type: 'Prüfung' | 'Vortrag' | 'Projekt';
}

export interface Goal {
  id: string;
  text: string;
  type: 'short' | 'long';
  completed: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  image?: string;
  phase: 'Recherche' | 'Prototyping' | 'Umsetzung' | 'Abschluss';
  teacherFeedback?: string; // New: Feedback field
}

export type ProjectType = 
  | 'passion'      // Passion Project
  | 'mini'         // Mini-Lektion
  | 'trial'        // Schnupperlehre (New)
  | 'application'  // Bewerbung (New)
  | 'group'        // Gruppenarbeit (New)
  | 'exam'         // Prüfung
  | 'reflection'   // Reflexion (New)
  | 'todo';        // Termin/To Do

/** Pro-Projekt-Ressource (Link, PDF oder Notiz) */
export interface ProjectResource {
  id: string;
  title: string;
  type: 'link' | 'pdf' | 'note';
  url?: string; // bei note optional
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType; 
  status: 'planning' | 'active' | 'completed';
  passionQuestion: string; 
  subjects: string[];
  milestones: { week: number; text: string; completed: boolean }[];
  resources: ProjectResource[];
  entries: DiaryEntry[];
  lastUpdated: string;
}

// ===== Gamification / Achievement System =====

/** Erfolg-Kategorie */
export type AchievementCategory = 
  | 'start'        // Erste Schritte
  | 'projects'     // Projekte
  | 'reflection'   // Reflexion & Tagebuch
  | 'habits'       // Gewohnheiten & Streaks
  | 'applications' // Bewerbungen
  | 'secret';      // Geheime Erfolge

/** Erfolg-Rang (für Badge-Farbe) */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  category: AchievementCategory;
  tier: AchievementTier;
  xpValue: number;
  unlocked: boolean;
  dateUnlocked?: string;
  /** Fortschritt (z.B. 3 von 5 Projekten) */
  progress?: number;
  /** Zielwert für Fortschritt */
  target?: number;
  /** Geheime Erfolge zeigen "???" bis freigeschaltet */
  secret?: boolean;
}

export type ZBAProfileType = 'Kombiniert' | 'Schulisch' | 'Integrativ';

export interface StudentProfile {
  name: string;
  class: string;
  zbaProfile: ZBAProfileType; // New: Specific ZBA Profile
  bio?: string; // New: Elevator Pitch
  strengths: string[];
  interests: string[];
  values: string[];
  jobTargets?: string[]; // New: Desired jobs
  currentPhase?: string; // New: Current status (e.g. Bewerben)
  weeklyFocus?: string; // New: Focus of the week
  mood?: number[]; // Mood tracker (1-5) for the last 5 days
  moodMessages?: (string | undefined)[]; // Optional short message per day (for teacher)
  weeklyHabits?: boolean[]; // Status of the 5 days (true = done)
  level: number; // Gamification Level
  xp: number; // Current Experience Points
  nextLevelXp: number; // XP needed for next level
  achievements: Achievement[];
}

export interface ReflectionEntry {
  id: string;
  date: string;
  content: string;
}

export interface ApplicationLog {
  id: string;
  company: string;
  role: string;
  status: 'sent' | 'shortlist' | 'interview' | 'trial' | 'rejected' | 'offer';
  date: string;
  note?: string;
  resilienceLog?: string; // New: Analysis of rejection/success
}

export interface DossierDocument {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'img';
  date: string;
  size?: string;
  // Base64-Daten des hochgeladenen PDFs
  pdfData?: string;
  /** Hochgeladenes PDF als Deckblatt im Bewerbungsdossier verwenden (max. eines) */
  isCover?: boolean;
}

// Dossier-Sektion für den Bewerbungsdossier-Builder
export type DossierSectionType = 'cover' | 'profile' | 'competencyRadar' | 'projects' | 'grades' | 'uploaded';

export interface DossierSection {
  id: string;
  type: 'uploaded' | 'generated';
  sectionType: DossierSectionType;
  label: string;
  // Für uploaded: documentId, für generated projects: projectId
  sourceId?: string;
  enabled: boolean;
  order: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'alert' | 'success' | 'improve';
}

/** Notification for the teacher (e.g. student mood message). */
export interface TeacherNotification {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'mood_message';
  moodValue?: number; // 1-5
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link';
  category: string;
  url: string;
}

// Competency Wheel Types
export interface Competency {
  id: string;
  name: string;
  icon: string;
  level: number; // 0-4
}

export interface CompetencyCategory {
  name: string;
  fullName: string;
  icon: string;
  color: string;
  competencies: Competency[];
}

export interface CompetencyData {
  categories: CompetencyCategory[];
}

// ===== Logbuch Dashboard Tiles =====
export type LogbuchTileType =
  | 'project'      // Aktuelles Projekt
  | 'competency'  // Kompetenzrad
  | 'mood'        // Moodboard
  | 'profile'     // Profil
  | 'focus'       // Wochenfokus + Habits + Reflexionen
  | 'grades'      // Noten
  | 'achievements'// Erfolge
  | 'applications'// Lehrstellen-Check
  | 'documents';  // Bewerbungsdossier

export type LogbuchTileSize = 'small' | 'medium' | 'large';

export interface LogbuchTile {
  id: string;
  type: LogbuchTileType;
  size: LogbuchTileSize;
  order: number;
}

// ===== Kalender & Stundenplan =====
export type CalendarEventType = 'termin' | 'deadline' | 'arbeit' | 'pruefung' | 'sonstiges';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  note?: string;
  projectId?: string;
}

export interface TimetableEntry {
  weekday: number; // 0 = Mo … 4 = Fr
  slotIndex: number; // 0–3
  title: string;
  subject?: string;
}

// ===== App Data Model (Prototype) =====
export interface StudentRecord {
  id: string;
  profile: StudentProfile;
  competencyData?: CompetencyData;
  skills: Skill[];
  grades: Grade[];
  goals: Goal[];
  projects: Project[];
  mainProjectId?: string;
  reflections: ReflectionEntry[];
  documents: DossierDocument[];
  applications: ApplicationLog[];
  notifications: Notification[];
  logbuchTiles?: LogbuchTile[];
  calendarEvents?: CalendarEvent[];
  timetable?: TimetableEntry[];
}

export interface AppData {
  version: number;
  selectedStudentId: string;
  students: StudentRecord[];
  /** Notifications for the teacher (e.g. student mood messages). */
  teacherNotifications?: TeacherNotification[];
}
