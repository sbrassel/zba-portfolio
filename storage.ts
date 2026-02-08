import type { AppData } from './types';

const STORAGE_KEY = 'zba_portfolio_appdata_v1';
const MIGRATION_KEY = 'zba_achievements_migrated_v2';

export function loadAppData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppData;
  } catch {
    return null;
  }
}

/** Check if achievements migration is needed */
export function needsAchievementsMigration(): boolean {
  return !localStorage.getItem(MIGRATION_KEY);
}

/** Mark achievements migration as done */
export function markAchievementsMigrated(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

export function saveAppData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore (quota / private mode)
  }
}

export function clearAppData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Export AppData als JSON-Datei (Download) */
export function exportAppDataAsJson(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zba-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import AppData aus JSON-Datei */
export function importAppDataFromJson(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json) as AppData;
    if (parsed.version == null || !Array.isArray(parsed.students)) return null;
    return parsed;
  } catch {
    return null;
  }
}

