/**
 * Achievements / Erfolge - Gamification System
 * Alle Erfolge mit Unlock-Bedingungen und XP/Level-Logik
 */

import { Achievement, AchievementCategory, AchievementTier, StudentRecord, StudentProfile } from './types';

// ===== Level-System =====

/** XP-Schwellen für Level-Aufstiege */
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  500,    // Level 2
  1200,   // Level 3
  2500,   // Level 4
  4500,   // Level 5
  7000,   // Level 6
  10000,  // Level 7
  15000,  // Level 8 (Max)
];

/** Berechnet das Level basierend auf XP */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/** Berechnet XP für nächstes Level */
export function getNextLevelXp(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]; // Max Level
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/** Vergibt XP und aktualisiert Level */
export function awardXP(profile: StudentProfile, amount: number): { profile: StudentProfile; leveledUp: boolean; newLevel: number } {
  const oldLevel = profile.level;
  const newXp = profile.xp + amount;
  const newLevel = calculateLevel(newXp);
  const nextLevelXp = getNextLevelXp(newLevel);
  
  return {
    profile: {
      ...profile,
      xp: newXp,
      level: newLevel,
      nextLevelXp,
    },
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}

// ===== Achievement-Konfiguration =====

interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  xpValue: number;
  secret?: boolean;
  /** Zielwert für Fortschritts-Erfolge */
  target?: number;
  /** Prüft ob Erfolg freigeschaltet werden soll */
  checkUnlock: (data: StudentRecord) => boolean;
  /** Berechnet Fortschritt (0-target) */
  getProgress?: (data: StudentRecord) => number;
}

/** Alle Erfolge mit Unlock-Bedingungen */
export const ACHIEVEMENTS_CONFIG: AchievementConfig[] = [
  // ===== KATEGORIE: ERSTE SCHRITTE (Bronze) =====
  {
    id: 'welcome',
    title: 'Willkommen',
    description: 'Profil ausgefüllt',
    icon: '👋',
    category: 'start',
    tier: 'bronze',
    xpValue: 50,
    checkUnlock: (data) => !!data.profile.bio?.trim() && data.profile.bio.length > 10,
  },
  {
    id: 'first_project',
    title: 'Erster Schritt',
    description: 'Erstes Projekt erstellt',
    icon: '🚀',
    category: 'start',
    tier: 'bronze',
    xpValue: 100,
    checkUnlock: (data) => data.projects.length >= 1,
  },
  {
    id: 'first_diary',
    title: 'Tagebuch-Start',
    description: 'Erster Tagebuch-Eintrag',
    icon: '📝',
    category: 'start',
    tier: 'bronze',
    xpValue: 75,
    checkUnlock: (data) => data.projects.some(p => p.entries.length > 0),
  },
  {
    id: 'first_mood',
    title: 'Stimmungs-Check',
    description: 'Erste Stimmung erfasst',
    icon: '😊',
    category: 'start',
    tier: 'bronze',
    xpValue: 50,
    checkUnlock: (data) => data.profile.mood?.some(m => m > 0) ?? false,
  },
  {
    id: 'first_application',
    title: 'Bewerber',
    description: 'Erste Bewerbung erfasst',
    icon: '✉️',
    category: 'start',
    tier: 'bronze',
    xpValue: 100,
    checkUnlock: (data) => data.applications.length >= 1,
  },
  {
    id: 'first_reflection',
    title: 'Nachgedacht',
    description: 'Erste Reflexion geschrieben',
    icon: '💭',
    category: 'start',
    tier: 'bronze',
    xpValue: 75,
    checkUnlock: (data) => data.reflections.length >= 1,
  },

  // ===== KATEGORIE: PROJEKTE (Silber/Gold) =====
  {
    id: 'project_manager',
    title: 'Projektmanager',
    description: '3 Projekte erstellt',
    icon: '📋',
    category: 'projects',
    tier: 'silver',
    xpValue: 200,
    target: 3,
    checkUnlock: (data) => data.projects.length >= 3,
    getProgress: (data) => Math.min(data.projects.length, 3),
  },
  {
    id: 'milestone_hunter',
    title: 'Meilenstein-Jäger',
    description: '10 Schritte erledigt',
    icon: '🎯',
    category: 'projects',
    tier: 'silver',
    xpValue: 250,
    target: 10,
    checkUnlock: (data) => {
      const total = data.projects.reduce((sum, p) => sum + p.milestones.filter(m => m.completed).length, 0);
      return total >= 10;
    },
    getProgress: (data) => {
      const total = data.projects.reduce((sum, p) => sum + p.milestones.filter(m => m.completed).length, 0);
      return Math.min(total, 10);
    },
  },
  {
    id: 'first_completion',
    title: 'Abschluss',
    description: 'Erstes Projekt abgeschlossen',
    icon: '✅',
    category: 'projects',
    tier: 'silver',
    xpValue: 300,
    checkUnlock: (data) => data.projects.some(p => p.status === 'completed'),
  },
  {
    id: 'masterpiece',
    title: 'Meisterstück',
    description: 'Passion Project abgeschlossen',
    icon: '🏆',
    category: 'projects',
    tier: 'gold',
    xpValue: 500,
    checkUnlock: (data) => data.projects.some(p => p.type === 'passion' && p.status === 'completed'),
  },
  {
    id: 'hard_worker',
    title: 'Fleissig',
    description: '5 Projekte abgeschlossen',
    icon: '💪',
    category: 'projects',
    tier: 'gold',
    xpValue: 750,
    target: 5,
    checkUnlock: (data) => data.projects.filter(p => p.status === 'completed').length >= 5,
    getProgress: (data) => Math.min(data.projects.filter(p => p.status === 'completed').length, 5),
  },

  // ===== KATEGORIE: REFLEXION (Silber) =====
  {
    id: 'reflective',
    title: 'Reflektiert',
    description: '5 Reflexionen geschrieben',
    icon: '🪞',
    category: 'reflection',
    tier: 'silver',
    xpValue: 200,
    target: 5,
    checkUnlock: (data) => data.reflections.length >= 5,
    getProgress: (data) => Math.min(data.reflections.length, 5),
  },
  {
    id: 'diary_pro',
    title: 'Tagebuch-Profi',
    description: '10 Tagebuch-Einträge',
    icon: '✍️',
    category: 'reflection',
    tier: 'silver',
    xpValue: 300,
    target: 10,
    checkUnlock: (data) => {
      const total = data.projects.reduce((sum, p) => sum + p.entries.length, 0);
      return total >= 10;
    },
    getProgress: (data) => {
      const total = data.projects.reduce((sum, p) => sum + p.entries.length, 0);
      return Math.min(total, 10);
    },
  },
  {
    id: 'self_analyst',
    title: 'Selbst-Analyst',
    description: '25 Reflexionen geschrieben',
    icon: '🧠',
    category: 'reflection',
    tier: 'gold',
    xpValue: 500,
    target: 25,
    checkUnlock: (data) => data.reflections.length >= 25,
    getProgress: (data) => Math.min(data.reflections.length, 25),
  },

  // ===== KATEGORIE: GEWOHNHEITEN & STREAKS (Gold) =====
  {
    id: 'daily_done',
    title: 'Dranbleiben',
    description: '5/5 Tages-Aufgaben erledigt',
    icon: '🔥',
    category: 'habits',
    tier: 'silver',
    xpValue: 150,
    checkUnlock: (data) => data.profile.weeklyHabits?.every(h => h) ?? false,
  },
  {
    id: 'mood_tracker',
    title: 'Stimmungs-Tracker',
    description: '5 Tage Stimmung erfasst',
    icon: '📊',
    category: 'habits',
    tier: 'silver',
    xpValue: 200,
    target: 5,
    checkUnlock: (data) => (data.profile.mood?.filter(m => m > 0).length ?? 0) >= 5,
    getProgress: (data) => data.profile.mood?.filter(m => m > 0).length ?? 0,
  },
  {
    id: 'week_winner',
    title: 'Wochensieger',
    description: 'Alle Aufgaben 2 Wochen erledigt',
    icon: '🏅',
    category: 'habits',
    tier: 'gold',
    xpValue: 400,
    // Vereinfacht: Prüft ob alle Habits erledigt sind (für Demo)
    checkUnlock: (data) => {
      const allDone = data.profile.weeklyHabits?.every(h => h) ?? false;
      const allMoods = (data.profile.mood?.filter(m => m > 0).length ?? 0) >= 5;
      return allDone && allMoods;
    },
  },

  // ===== KATEGORIE: BEWERBUNGEN (Silber/Gold) =====
  {
    id: 'active_applicant',
    title: 'Aktiv Bewerben',
    description: '3 Bewerbungen gesendet',
    icon: '📮',
    category: 'applications',
    tier: 'silver',
    xpValue: 250,
    target: 3,
    checkUnlock: (data) => data.applications.filter(a => a.status !== 'rejected').length >= 3,
    getProgress: (data) => Math.min(data.applications.filter(a => a.status !== 'rejected').length, 3),
  },
  {
    id: 'persistent',
    title: 'Hartnäckig',
    description: '5 Bewerbungen gesendet',
    icon: '💼',
    category: 'applications',
    tier: 'silver',
    xpValue: 400,
    target: 5,
    checkUnlock: (data) => data.applications.length >= 5,
    getProgress: (data) => Math.min(data.applications.length, 5),
  },
  {
    id: 'invited',
    title: 'Eingeladen',
    description: 'Erste Einladung erhalten',
    icon: '🎉',
    category: 'applications',
    tier: 'gold',
    xpValue: 300,
    checkUnlock: (data) => data.applications.some(a => ['shortlist', 'interview', 'trial', 'offer'].includes(a.status)),
  },
  {
    id: 'trial_day',
    title: 'Schnuppertag',
    description: 'Schnupperlehre absolviert',
    icon: '🏢',
    category: 'applications',
    tier: 'gold',
    xpValue: 350,
    checkUnlock: (data) => data.applications.some(a => a.status === 'trial' || a.status === 'offer'),
  },
  {
    id: 'goal_reached',
    title: 'Ziel erreicht!',
    description: 'Lehrstellen-Angebot erhalten',
    icon: '🎓',
    category: 'applications',
    tier: 'platinum',
    xpValue: 1000,
    checkUnlock: (data) => data.applications.some(a => a.status === 'offer'),
  },

  // ===== KATEGORIE: GEHEIME ERFOLGE (Platin) =====
  {
    id: 'night_owl',
    title: 'Nachtarbeiter',
    description: 'Eintrag nach 22 Uhr erstellt',
    icon: '🦉',
    category: 'secret',
    tier: 'platinum',
    xpValue: 100,
    secret: true,
    checkUnlock: (data) => {
      const hour = new Date().getHours();
      // Prüft ob aktuell nach 22 Uhr und kürzlich ein Eintrag gemacht wurde
      return hour >= 22 && data.reflections.length > 0;
    },
  },
  {
    id: 'early_bird',
    title: 'Frühaufsteher',
    description: 'Eintrag vor 7 Uhr erstellt',
    icon: '🌅',
    category: 'secret',
    tier: 'platinum',
    xpValue: 100,
    secret: true,
    checkUnlock: (data) => {
      const hour = new Date().getHours();
      return hour < 7 && data.reflections.length > 0;
    },
  },
  {
    id: 'perfectionist',
    title: 'Perfektionist',
    description: 'Alle Schritte eines Projekts erledigt',
    icon: '⭐',
    category: 'secret',
    tier: 'gold',
    xpValue: 300,
    secret: true,
    checkUnlock: (data) => data.projects.some(p => 
      p.milestones.length >= 3 && p.milestones.every(m => m.completed)
    ),
  },
  {
    id: 'collector',
    title: 'Sammler',
    description: '5 Dokumente hochgeladen',
    icon: '📁',
    category: 'secret',
    tier: 'silver',
    xpValue: 250,
    secret: true,
    target: 5,
    checkUnlock: (data) => data.documents.length >= 5,
    getProgress: (data) => Math.min(data.documents.length, 5),
  },
  {
    id: 'networker',
    title: 'Netzwerker',
    description: '3 verschiedene Firmen kontaktiert',
    icon: '🤝',
    category: 'secret',
    tier: 'silver',
    xpValue: 200,
    secret: true,
    target: 3,
    checkUnlock: (data) => {
      const uniqueCompanies = new Set(data.applications.map(a => a.company));
      return uniqueCompanies.size >= 3;
    },
    getProgress: (data) => {
      const uniqueCompanies = new Set(data.applications.map(a => a.company));
      return Math.min(uniqueCompanies.size, 3);
    },
  },
];

// ===== Achievement Check Logic =====

/** Erstellt ein Achievement-Objekt aus der Config */
function createAchievement(config: AchievementConfig, data: StudentRecord): Achievement {
  const unlocked = config.checkUnlock(data);
  const progress = config.getProgress?.(data) ?? (unlocked ? (config.target ?? 1) : 0);
  
  return {
    id: config.id,
    title: config.title,
    description: config.description,
    icon: config.icon,
    category: config.category,
    tier: config.tier,
    xpValue: config.xpValue,
    unlocked,
    dateUnlocked: unlocked ? new Date().toLocaleDateString('de-CH') : undefined,
    progress,
    target: config.target,
    secret: config.secret,
  };
}

/** Prüft alle Achievements und gibt neu freigeschaltete zurück */
export function checkAchievements(
  data: StudentRecord,
  currentAchievements: Achievement[]
): { 
  updated: Achievement[]; 
  newlyUnlocked: Achievement[];
  totalXpAwarded: number;
} {
  const newlyUnlocked: Achievement[] = [];
  let totalXpAwarded = 0;
  
  const updated = ACHIEVEMENTS_CONFIG.map(config => {
    const existing = currentAchievements.find(a => a.id === config.id);
    const wasUnlocked = existing?.unlocked ?? false;
    
    const achievement = createAchievement(config, data);
    
    // War vorher gesperrt und ist jetzt freigeschaltet
    if (!wasUnlocked && achievement.unlocked) {
      // Behalte das ursprüngliche Freischaltdatum falls vorhanden
      achievement.dateUnlocked = new Date().toLocaleDateString('de-CH');
      newlyUnlocked.push(achievement);
      totalXpAwarded += achievement.xpValue;
    } else if (existing?.dateUnlocked) {
      // Behalte existierendes Datum
      achievement.dateUnlocked = existing.dateUnlocked;
    }
    
    return achievement;
  });
  
  return { updated, newlyUnlocked, totalXpAwarded };
}

/** Initialisiert Achievements für einen neuen Schüler */
export function initializeAchievements(data: StudentRecord): Achievement[] {
  return ACHIEVEMENTS_CONFIG.map(config => createAchievement(config, data));
}

/** Holt Achievements nach Kategorie */
export function getAchievementsByCategory(achievements: Achievement[], category: AchievementCategory): Achievement[] {
  return achievements.filter(a => a.category === category);
}

/** Zählt freigeschaltete Achievements */
export function countUnlockedAchievements(achievements: Achievement[]): { unlocked: number; total: number } {
  return {
    unlocked: achievements.filter(a => a.unlocked).length,
    total: achievements.length,
  };
}

/** Berechnet Gesamt-XP aus freigeschalteten Achievements */
export function calculateTotalXpFromAchievements(achievements: Achievement[]): number {
  return achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.xpValue, 0);
}

/** Tier-Farben für UI */
export const TIER_COLORS: Record<AchievementTier, { bg: string; border: string; text: string }> = {
  bronze: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
  silver: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600' },
  gold: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
  platinum: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
};

/** Kategorie-Icons für UI */
export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  start: '🌟',
  projects: '📋',
  reflection: '💭',
  habits: '🔥',
  applications: '💼',
  secret: '🔮',
};
