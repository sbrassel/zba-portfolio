
import React, { useState, useMemo, useEffect } from 'react';
import { Target, TrendingUp, Plus, Edit2, Save, ArrowUpRight, Layout, Archive, X, User, Briefcase, PenLine, Check, History, ArrowLeft, ChevronDown, Trophy, Bell, Star, GraduationCap, Flame, AlertCircle, Activity, Trash2, Calendar, FileText, Settings2, Maximize2, Minimize2, Smile, Send, FolderOpen, Award, Lock, Sparkles, Zap, Download, Upload } from 'lucide-react';
import { Skill, Goal, StudentProfile, Grade, Sector, ReflectionEntry, Notification, Project, LogbuchTile, LogbuchTileType, LogbuchTileSize, ApplicationLog, DossierDocument, Achievement, AchievementCategory, CompetencyData } from '../types';
import { CompetencyWheel } from './CompetencyWheel';
import { COMPETENCY_DATA, PROJECT_IMAGE_BY_TYPE } from '../constants';
import { NotificationsPanel } from './NotificationsPanel';
import { LABELS } from '../labels';
import { TIER_COLORS, CATEGORY_ICONS, countUnlockedAchievements, getAchievementsByCategory } from '../achievements';

const TILE_LABELS: Record<LogbuchTileType, string> = {
  project: LABELS.tiles.project,
  competency: LABELS.tiles.competency,
  mood: LABELS.tiles.mood,
  profile: LABELS.tiles.profile,
  focus: LABELS.tiles.focus,
  grades: LABELS.tiles.grades,
  achievements: LABELS.tiles.achievements,
  applications: LABELS.tiles.applications,
  documents: LABELS.tiles.documents,
};

const SIZE_TO_SPAN: Record<LogbuchTileSize, number> = { small: 4, medium: 6, large: 12 };

function getDefaultTiles(): LogbuchTile[] {
  return [
    { id: `t_${Date.now()}_1`, type: 'project', size: 'large', order: 0 },
    { id: `t_${Date.now()}_2`, type: 'competency', size: 'medium', order: 1 },
    { id: `t_${Date.now()}_3`, type: 'mood', size: 'small', order: 2 },
    { id: `t_${Date.now()}_4`, type: 'profile', size: 'medium', order: 3 },
    { id: `t_${Date.now()}_5`, type: 'focus', size: 'medium', order: 4 },
    { id: `t_${Date.now()}_6`, type: 'grades', size: 'small', order: 5 },
    { id: `t_${Date.now()}_7`, type: 'achievements', size: 'large', order: 6 },
  ];
}

interface CompassProps {
  skills: Skill[];
  goals: Goal[];
  onToggleGoal: (id: string) => void;
  onAddGoal: (text: string) => void;
  profile: StudentProfile;
  setProfile: (profile: StudentProfile) => void;
  grades: Grade[];
  onNavigate: (sector: Sector) => void;
  projects: Project[];
  mainProjectId?: string;
  reflections: ReflectionEntry[];
  onAddReflection: (content: string) => void;
  notifications: Notification[];
  isNotifOpen: boolean;
  onToggleNotif: () => void;
  onMarkAllRead: () => void;
  logbuchTiles: LogbuchTile[];
  onUpdateLogbuchTiles: (tiles: LogbuchTile[]) => void;
  applications?: ApplicationLog[];
  documents?: DossierDocument[];
  onAddApplication?: (app: ApplicationLog) => void;
  onUpdateApplicationStatus?: (id: string, status: ApplicationLog['status']) => void;
  onUpdateApplicationNote?: (id: string, note: string) => void;
  onAddDocument?: (doc: DossierDocument) => void;
  onDeleteDocument?: (id: string) => void;
  onMoodMessageForTeacher?: (message: string, moodValue: number) => void;
  competencyData?: CompetencyData;
  onUpdateCompetencyData?: (data: CompetencyData) => void;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
  // Achievement System Props
  newlyUnlockedAchievements?: Achievement[];
  onClearAchievementNotification?: () => void;
  xpGained?: { amount: number; show: boolean };
  onClearXpNotification?: () => void;
  showLevelUpModal?: { show: boolean; newLevel: number };
  onCloseLevelUpModal?: () => void;
}

interface MoodboardCardProps {
  mood: number[];
  moodMessages?: (string | undefined)[];
  onSaveMood: (dayIndex: number, moodValue: number, message?: string) => void;
  onMoodMessageForTeacher?: (message: string, moodValue: number) => void;
}

type MoodOption = { value: number; icon: string; label: string };

const MoodboardCard: React.FC<MoodboardCardProps> = ({ mood, moodMessages = [], onSaveMood, onMoodMessageForTeacher }) => {
  const [selectedMoodOption, setSelectedMoodOption] = useState<MoodOption | null>(null);
  const [moodMessage, setMoodMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 4 : Math.min(today - 1, 4); // Mo=0, Di=1, ..., Fr=4

  const moodGroups = [
    { label: LABELS.mood.categoryPositive, moods: [
      { value: 5, icon: '🤩', label: LABELS.mood.super },
      { value: 5, icon: '😊', label: LABELS.mood.good },
      { value: 5, icon: '💪', label: LABELS.mood.motivated },
      { value: 4, icon: '😌', label: LABELS.mood.calm },
      { value: 4, icon: '🌟', label: LABELS.mood.hopeful },
    ]},
    { label: LABELS.mood.categoryNeutral, moods: [
      { value: 3, icon: '😐', label: LABELS.mood.okay },
      { value: 2, icon: '🥱', label: LABELS.mood.tired },
      { value: 2, icon: '😣', label: LABELS.mood.nervous },
    ]},
    { label: LABELS.mood.categoryChallenge, moods: [
      { value: 1, icon: '😕', label: LABELS.mood.difficult },
      { value: 1, icon: '😰', label: LABELS.mood.stressed },
      { value: 1, icon: '😢', label: LABELS.mood.sad },
      { value: 1, icon: '😠', label: LABELS.mood.angry },
    ]}
  ];

  const getMoodIcon = (value: number) => {
    if (value >= 5) return '🤩';
    if (value >= 4) return '😊';
    if (value >= 3) return '😐';
    if (value >= 2) return '🥱';
    if (value >= 1) return '😕';
    return '😶';
  };

  const handleSave = () => {
    if (!selectedMoodOption) return;
    const message = moodMessage.trim() || undefined;
    onSaveMood(todayIndex, selectedMoodOption.value, message);
    if (message && onMoodMessageForTeacher) {
      onMoodMessageForTeacher(message, selectedMoodOption.value);
    }
    setIsSaved(true);
    setMoodMessage('');
    setTimeout(() => { setIsSaved(false); setSelectedMoodOption(null); }, 2000);
  };

  const isOptionSelected = (m: MoodOption) =>
    selectedMoodOption?.icon === m.icon && selectedMoodOption?.label === m.label;

  if (isSaved) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><Check size={20} /></div>
        <h3 className="text-sm font-bold text-slate-900 mb-1 font-['Space_Grotesk']">{LABELS.mood.saved}</h3>
        <p className="text-slate-500 text-[11px]">{LABELS.mood.savedDesc}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden transition-all">
      <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20">
        <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smile size={12} className="text-blue-500" /> {LABELS.tiles.mood}</h3>
        <button onClick={() => setShowHistory(!showHistory)} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">{showHistory ? <ArrowLeft size={14}/> : <History size={14}/>}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {showHistory ? (
             <div className="space-y-2">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Diese Woche</p>
                 {mood.map((m, idx) => (
                     <div key={idx} className="flex gap-3 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                         <span className="text-xl shrink-0">{m > 0 ? getMoodIcon(m) : '➖'}</span>
                         <div className="min-w-0 flex-1">
                             <p className="text-[8px] font-bold text-slate-400 uppercase">{dayNames[idx]}</p>
                             <p className="text-[11px] text-slate-600 leading-snug">{m > 0 ? `Stimmung: ${m}/5` : 'Nicht erfasst'}</p>
                             {moodMessages[idx] && <p className="text-[10px] text-slate-500 italic mt-0.5">"{moodMessages[idx]}"</p>}
                         </div>
                     </div>
                 ))}
             </div>
        ) : (
            <div className="space-y-3">
                <p className="text-[10px] text-slate-500 mb-2">Wie fühlst du dich heute ({dayNames[todayIndex]})?</p>
                <div className="relative">
                    <button onClick={() => setIsPickerOpen(!isPickerOpen)} className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white transition-all group">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-lg shadow-sm">{selectedMoodOption?.icon ?? (mood[todayIndex] > 0 ? getMoodIcon(mood[todayIndex]) : '😶')}</div>
                            <span className={`text-xs font-bold ${selectedMoodOption ? 'text-slate-900' : 'text-slate-400'}`}>{selectedMoodOption?.label ?? (mood[todayIndex] > 0 ? LABELS.mood.alreadyRecorded : LABELS.mood.selectMood)}</span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isPickerOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl p-2 z-30 animate-in fade-in zoom-in-95 max-h-56 overflow-y-auto custom-scrollbar">
                            {moodGroups.map((group, idx) => (
                                <div key={idx} className="mb-3 last:mb-0">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1 border-l-2 border-slate-200 ml-1 pl-1.5">{group.label}</p>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {group.moods.map((m, i) => (
                                            <button key={`${m.value}-${m.label}-${i}`} onClick={() => { setSelectedMoodOption(m); setIsPickerOpen(false); }} className={`aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-slate-50 transition-all border border-transparent ${isOptionSelected(m) ? 'bg-blue-50 border-blue-500' : ''}`}>
                                                <span className="text-lg">{m.icon}</span>
                                                <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase truncate w-full text-center px-1">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{LABELS.mood.messageLabel}</label>
                    <textarea
                        value={moodMessage}
                        onChange={(e) => setMoodMessage(e.target.value)}
                        placeholder={LABELS.mood.messagePlaceholder}
                        className="w-full min-h-[60px] bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] focus:border-blue-500 outline-none resize-none placeholder:text-slate-400"
                        maxLength={300}
                    />
                </div>
            </div>
        )}
      </div>
      {!showHistory && (
        <div className="p-4 pt-0 bg-white"><button onClick={handleSave} disabled={!selectedMoodOption} className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors disabled:opacity-30 shadow-sm">{LABELS.buttons.save}</button></div>
      )}
    </div>
  );
};

const GradesBracket: React.FC<{ grades: Grade[] }> = ({ grades }) => {
    const requestedSubjects = ['Deutsch', 'Allgemeinbildung', 'Mathematik', 'Sport', 'B-MOT'];
    const filteredGrades = grades.filter(g => requestedSubjects.includes(g.subject));
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><GraduationCap size={12} className="text-indigo-500" /> Noten</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredGrades.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">{g.subject.substring(0, 3).toUpperCase()}</div>
                            <div className="min-w-0"><p className="text-[11px] font-bold text-slate-900 truncate">{g.subject}</p><p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-tighter">{g.type}</p></div>
                        </div>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold font-['Space_Grotesk'] text-xs shadow-sm ${g.value >= 5 ? 'bg-green-500 text-white' : g.value >= 4 ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'}`}>{g.value.toFixed(1)}</div>
                    </div>
                ))}
            </div>
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-60">Schnitt</span>
                <span className="text-sm font-bold font-['Space_Grotesk'] tracking-tight">{(filteredGrades.reduce((a,b)=>a+b.value,0)/filteredGrades.length || 0).toFixed(2)}</span>
            </div>
        </div>
    );
};

export const Compass: React.FC<CompassProps> = ({
  goals, onToggleGoal, onAddGoal, profile, setProfile, grades, onNavigate, projects, mainProjectId, reflections, onAddReflection,
  notifications, isNotifOpen, onToggleNotif, onMarkAllRead, logbuchTiles, onUpdateLogbuchTiles,
  applications = [], documents = [], onAddApplication, onUpdateApplicationStatus, onUpdateApplicationNote, onAddDocument, onDeleteDocument,
  onMoodMessageForTeacher,
  competencyData, onUpdateCompetencyData,
  onExportBackup, onImportBackup,
  newlyUnlockedAchievements = [], onClearAchievementNotification, xpGained, onClearXpNotification, showLevelUpModal, onCloseLevelUpModal,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<StudentProfile>(profile);
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [tempFocus, setTempFocus] = useState(profile.weeklyFocus || '');
  const [isWritingReflection, setIsWritingReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState<AchievementCategory | 'all'>('all');

  const tiles = useMemo(() => (logbuchTiles.length > 0 ? [...logbuchTiles].sort((a, b) => a.order - b.order) : getDefaultTiles()), [logbuchTiles]);

  useEffect(() => {
    if (logbuchTiles.length === 0) {
      onUpdateLogbuchTiles(getDefaultTiles());
    }
  }, [logbuchTiles.length, onUpdateLogbuchTiles]);

  const currentKW = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }, []);

  const handleProfileSave = () => { setProfile(tempProfile); setIsEditingProfile(false); };
  const handleFocusSave = () => { setProfile({ ...profile, weeklyFocus: tempFocus }); setIsEditingFocus(false); };
  
  const handleAddTag = (type: 'strengths' | 'interests', value: string) => {
      if (!value.trim()) return;
      const updatedTags = [...(tempProfile[type] || []), value.trim()];
      setTempProfile({ ...tempProfile, [type]: updatedTags });
      if (type === 'strengths') setNewStrength('');
      else setNewInterest('');
  };

  const handleRemoveTag = (type: 'strengths' | 'interests', idx: number) => {
      const updatedTags = (tempProfile[type] || []).filter((_, i) => i !== idx);
      setTempProfile({ ...tempProfile, [type]: updatedTags });
  };

  const handleToggleHabit = (idx: number) => {
    const habits = profile.weeklyHabits ? [...profile.weeklyHabits] : [false, false, false, false, false];
    habits[idx] = !habits[idx];
    setProfile({ ...profile, weeklyHabits: habits });
    if (habits.every(h => h)) { (window as any).confetti?.({ particleCount: 50, spread: 40, origin: { y: 0.7, x: 0.8 } }); }
  };

  const handleSaveMood = (dayIndex: number, moodValue: number, message?: string) => {
    const moods = profile.mood ? [...profile.mood] : [0, 0, 0, 0, 0];
    moods[dayIndex] = moodValue;
    const messages = profile.moodMessages ? [...profile.moodMessages] : [undefined, undefined, undefined, undefined, undefined];
    messages[dayIndex] = message;
    setProfile({ ...profile, mood: moods, moodMessages: messages });
  };

  const xpPercent = (profile.xp / profile.nextLevelXp) * 100;
  const unreadCount = notifications.filter(n => !n.read).length;
  const activeProject = projects.find(p => p.status === 'active') || projects[0] || null;
  const mainProject = (mainProjectId && projects.find(p => p.id === mainProjectId)) || null;

  return (
    <div className="animate-fade-in pb-8 space-y-6 max-w-[1400px] mx-auto">
      <NotificationsPanel
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={onToggleNotif}
        onMarkAllRead={onMarkAllRead}
      />
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
           <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] tracking-tight text-slate-900 mb-1 italic">ZBA Portfolio</h1>
           <p className="text-slate-400 font-medium tracking-wide uppercase text-[8px]">Zentrum für Brückenangebote Basel</p>
           <p className="mt-1 text-[10px] text-slate-500">{new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
           {mainProject && (
             <p className="mt-2 inline-flex items-center gap-2 text-[10px] font-medium text-slate-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
               <Star size={10} className="text-blue-500" />
               Hauptprojekt: <span className="font-semibold">{mainProject.title}</span>
             </p>
           )}
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsLayoutModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 text-xs font-bold transition-colors shadow-sm">
              <Settings2 size={14} /> {LABELS.general.layout}
            </button>
            <div className="bg-white rounded-2xl border border-slate-200 p-2 pl-4 pr-3 shadow-sm flex items-center gap-4 border-b-2 border-b-blue-600">
                <div className="min-w-[80px]">
                    <div className="flex justify-between items-end mb-0.5"><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{LABELS.general.level}</span><span className="text-sm font-bold font-['Space_Grotesk'] text-slate-900">{profile.level}</span></div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-20"><div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${xpPercent}%` }}></div></div>
                </div>
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold font-['Space_Grotesk'] text-sm shadow-inner">{profile.level}</div>
            </div>
            <button onClick={onToggleNotif} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all relative shadow-sm group">
              <Bell size={16} className="group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>}
            </button>
        </div>
      </div>

      {/* DYNAMIC TILE GRID */}
      <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(280px,auto)]">
        {tiles.map((tile) => {
          const span = SIZE_TO_SPAN[tile.size];
          return (
            <div key={tile.id} className="min-h-[280px] flex flex-col" style={{ gridColumn: `span ${Math.min(span, 12)}` }}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[280px] overflow-hidden relative group/tile">
                {tile.type === 'project' && (() => {
                  const imgUrl = activeProject ? PROJECT_IMAGE_BY_TYPE[activeProject.type] : PROJECT_IMAGE_BY_TYPE.passion;
                  return (
                  <>
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-1000 grayscale-[30%]" style={{ backgroundImage: `url(${imgUrl})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <div className="absolute top-4 right-4"><button onClick={() => onNavigate(Sector.WORKSHOP)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all border border-white/20"><ArrowUpRight size={18} /></button></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {activeProject ? (
                        <><span className="bg-blue-600 text-white text-[8px] font-bold px-2 py-1 uppercase rounded tracking-widest shadow-lg">{LABELS.projectStatus.projectActive}</span>
                        <h2 className="text-xl font-bold text-white font-['Space_Grotesk'] leading-tight">{activeProject.title}</h2>
                        <div className="max-w-[200px] bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/10"><div className="flex justify-between text-[8px] font-bold text-slate-200 uppercase mb-1.5 tracking-widest"><span>{LABELS.projectStatus.status}</span><span>60%</span></div><div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[60%]" /></div></div></>
                      ) : (
                        <><span className="bg-slate-600 text-white text-[8px] font-bold px-2 py-1 uppercase rounded tracking-widest shadow-lg">{LABELS.projectStatus.noProject}</span><h2 className="text-xl font-bold text-white font-['Space_Grotesk'] leading-tight">{LABELS.project.createFirst}</h2><p className="text-sm text-slate-200">{LABELS.projectStatus.goToWorkshop}</p></>
                      )}
                    </div>
                  </>
                  );
                })()}
                {tile.type === 'competency' && (
                  <div className="p-4 flex flex-col h-full">
                    <div className="mb-1"><h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target size={12} className="text-indigo-500" /> {LABELS.tiles.competency}</h3></div>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]"><CompetencyWheel initialData={competencyData || COMPETENCY_DATA} onUpdateCategories={(cats) => onUpdateCompetencyData?.({ categories: cats })} /></div>
                  </div>
                )}
                {tile.type === 'mood' && <div className="h-full"><MoodboardCard mood={profile.mood || [0,0,0,0,0]} moodMessages={profile.moodMessages} onSaveMood={handleSaveMood} onMoodMessageForTeacher={onMoodMessageForTeacher} /></div>}
                {tile.type === 'profile' && (
                  <div className="p-6 flex flex-col h-full relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4"><h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} className="text-blue-500"/> {LABELS.tiles.profile}</h3><button onClick={() => { setTempProfile(profile); setIsEditingProfile(!isEditingProfile); }} className="text-[9px] font-bold text-blue-600 uppercase hover:bg-blue-50 px-2 py-0.5 rounded">{isEditingProfile ? LABELS.buttons.cancel : LABELS.buttons.edit}</button></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                      {isEditingProfile ? (
                        <div className="space-y-3"><textarea value={tempProfile.bio} onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] focus:border-blue-500 outline-none resize-none h-20 font-medium" /><div className="flex gap-1.5"><input value={newStrength} onChange={(e) => setNewStrength(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag('strengths', newStrength)} placeholder="Stärke..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-[10px] focus:border-blue-500 outline-none" /><button onClick={() => handleAddTag('strengths', newStrength)} className="bg-slate-200 p-1 rounded-lg text-slate-600"><Plus size={14}/></button></div><button onClick={handleProfileSave} className="w-full bg-slate-900 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-blue-600 transition-all">{LABELS.buttons.save}</button></div>
                      ) : (
                        <div className="space-y-4"><p className="text-[12px] font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-3">"{profile.bio}"</p><div className="flex flex-wrap gap-1">{profile.strengths.slice(0, 5).map((s, i) => <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[8px] font-bold uppercase border border-blue-100">{s}</span>)}</div></div>
                      )}
                    </div>
                  </div>
                )}
                {tile.type === 'focus' && (
                  <div className="p-6 flex flex-col justify-between h-full border-t-4 border-t-orange-500 overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center mb-4"><h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Flame size={12} className="text-orange-500" /> {LABELS.tiles.focus}</h3><span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{LABELS.milestones.week} {currentKW}</span></div>
                      {isEditingFocus ? (<div className="space-y-2"><input value={tempFocus} onChange={(e) => setTempFocus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:border-orange-500 outline-none" autoFocus /><div className="flex gap-1.5"><button onClick={handleFocusSave} className="flex-1 bg-slate-900 text-white py-1.5 rounded-md text-[10px] font-bold">OK</button><button onClick={() => setIsEditingFocus(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">X</button></div></div>) : (<div className="group cursor-pointer mb-4" onClick={() => { setTempFocus(profile.weeklyFocus || ''); setIsEditingFocus(true); }}><h4 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] mb-2 tracking-tight group-hover:text-orange-600 flex items-center gap-2">{profile.weeklyFocus || "Ziel..."} <Edit2 size={12} className="opacity-0 group-hover:opacity-100" /></h4><p className="text-[11px] text-slate-400 leading-relaxed font-medium">Was ist deine Priorität diese Woche?</p></div>)}
                      <div className="flex gap-1.5 mb-4">{['M', 'D', 'M', 'D', 'F'].map((day, i) => (<button key={i} onClick={() => handleToggleHabit(i)} className={`flex-1 h-12 rounded-xl border flex flex-col items-center justify-center transition-all ${profile.weeklyHabits?.[i] ? 'bg-orange-500 border-orange-500 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-orange-300'}`}><span className="text-[8px] font-bold mb-0.5 opacity-60">{day}</span>{profile.weeklyHabits?.[i] ? <Check size={10} strokeWidth={4} /> : <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />}</button>))}</div>
                      {reflections.length > 0 && (<div className="mb-4"><h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><PenLine size={10} className="text-orange-500" /> {LABELS.reflection.lastEntries}</h4><div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">{reflections.slice(0, 3).map((r) => (<div key={r.id} className="bg-slate-50 border border-slate-100 rounded-lg p-2"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{r.date}</p><p className="text-[10px] text-slate-600 leading-snug line-clamp-2">{r.content}</p></div>))}</div></div>)}
                    </div>
                    <button onClick={() => setIsWritingReflection(true)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"><PenLine size={12} /> Reflexion</button>
                  </div>
                )}
                {tile.type === 'grades' && <div className="h-full"><GradesBracket grades={grades} /></div>}
                {tile.type === 'achievements' && (() => {
                  const stats = countUnlockedAchievements(profile.achievements);
                  return (
                    <div className="p-6 flex flex-col h-full overflow-hidden">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Trophy size={12} className="text-amber-500"/> Erfolge</h3>
                        <button onClick={() => setIsAchievementsModalOpen(true)} className="text-[9px] font-bold text-amber-600 hover:bg-amber-50 px-2 py-0.5 rounded">{stats.unlocked} / {stats.total}</button>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-3 flex-1 overflow-y-auto custom-scrollbar p-1">
                        {profile.achievements.slice(0, 12).map(a => {
                          const tier = a.tier ?? 'bronze';
                          const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
                          const isSecret = a.secret && !a.unlocked;
                          const tip = a.secret && !a.unlocked ? 'Geheimer Erfolg' : a.target != null ? `${a.title}: ${a.description} (${a.progress ?? 0}/${a.target})` : `${a.title}: ${a.description}`;
                          return (
                            <div 
                              key={a.id} 
                              onClick={() => setIsAchievementsModalOpen(true)}
                              title={tip}
                              className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all aspect-square cursor-pointer hover:scale-105 ${
                                a.unlocked 
                                  ? `${tierColor.bg} ${tierColor.border} shadow-sm` 
                                  : 'bg-slate-50 border-slate-100 opacity-40 grayscale'
                              }`}
                            >
                              <span className="text-xl mb-0.5">{isSecret ? '🔒' : a.icon}</span>
                              <p className={`text-[6px] font-bold text-center uppercase tracking-wider leading-tight ${a.unlocked ? tierColor.text : 'text-slate-400'}`}>
                                {isSecret ? '???' : a.title}
                              </p>
                              {a.target && !a.unlocked && (
                                <div className="w-full mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((a.progress || 0) / a.target) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {profile.achievements.length > 12 && (
                        <button onClick={() => setIsAchievementsModalOpen(true)} className="mt-3 text-[10px] font-bold text-amber-600 hover:underline">
                          Alle {profile.achievements.length} Erfolge anzeigen →
                        </button>
                      )}
                    </div>
                  );
                })()}
                {tile.type === 'applications' && (
                  <div className="p-4 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-3"><h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Send size={12} className="text-purple-500" /> {LABELS.tiles.applications}</h3><button onClick={() => onNavigate(Sector.SHOWCASE)} className="text-[9px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded">{LABELS.nav.showcase}</button></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                      {applications.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex justify-between items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="min-w-0"><p className="text-[11px] font-bold text-slate-900 truncate">{log.company}</p><p className="text-[9px] text-slate-500 truncate">{log.role}</p></div>
                          {onUpdateApplicationStatus && (
                            <select
                              value={log.status}
                              onChange={(e) => onUpdateApplicationStatus(log.id, e.target.value as ApplicationLog['status'])}
                              className="shrink-0 px-2 py-0.5 rounded text-[8px] font-bold bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer appearance-none bg-no-repeat pr-6 focus:outline-none"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundSize: '8px', backgroundPosition: 'right 2px center' }}
                            >
                              {(['sent', 'shortlist', 'interview', 'trial', 'offer', 'rejected'] as ApplicationLog['status'][]).map((s) => (
                                <option key={s} value={s}>{(LABELS.applicationStatus as Record<string, string>)[s] ?? s}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                      {applications.length === 0 && <p className="text-[11px] text-slate-400">Keine Bewerbungen. Im Showcase hinzufügen.</p>}
                    </div>
                  </div>
                )}
                {tile.type === 'documents' && (
                  <div className="p-4 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-3"><h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><FolderOpen size={12} className="text-blue-500" /> {LABELS.tiles.documents}</h3><button onClick={() => onNavigate(Sector.SHOWCASE)} className="text-[9px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded">{LABELS.nav.showcase}</button></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                      {documents.slice(0, 5).map((item) => (<div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[11px] font-bold text-slate-900 truncate flex-1">{item.title}</p>{onDeleteDocument && <button onClick={() => onDeleteDocument(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>}</div>))}
                      {documents.length === 0 && <p className="text-[11px] text-slate-400">Keine Dokumente. Im Showcase hinzufügen.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LAYOUT MODAL */}
      {isLayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="layout-modal-title" onKeyDown={(e) => e.key === 'Escape' && setIsLayoutModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 id="layout-modal-title" className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">{LABELS.general.logbookLayout}</h3>
              <button onClick={() => setIsLayoutModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-slate-400" aria-label="Schliessen"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-500">Kacheln anpassen: entfernen, Grösse ändern (Klein / Mittel / Gross) oder neue Kacheln hinzufügen.</p>
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktuelle Kacheln</h4>
                {tiles.map((t, idx) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-sm font-medium text-slate-900 truncate">{TILE_LABELS[t.type]}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {(['small', 'medium', 'large'] as LogbuchTileSize[]).map((sz) => (
                        <button key={sz} onClick={() => { const next = tiles.map(tile => tile.id === t.id ? { ...tile, size: sz } : tile); onUpdateLogbuchTiles(next); }} className={`px-2 py-1 rounded text-[10px] font-bold ${t.size === sz ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{sz === 'small' ? 'S' : sz === 'medium' ? 'M' : 'L'}</button>
                      ))}
                      <button onClick={() => { const next = tiles.filter(tile => tile.id !== t.id).map((tile, i) => ({ ...tile, order: i })); onUpdateLogbuchTiles(next); }} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Entfernen"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kachel hinzufügen</h4>
                <div className="flex flex-wrap gap-2">
                  {(['project', 'competency', 'mood', 'profile', 'focus', 'grades', 'achievements', 'applications', 'documents'] as LogbuchTileType[]).filter(typ => !tiles.some(t => t.type === typ)).map((typ) => (
                    <button key={typ} onClick={() => { const newTile: LogbuchTile = { id: `t_${Date.now()}_${typ}`, type: typ, size: 'medium', order: tiles.length }; onUpdateLogbuchTiles([...tiles, newTile]); }} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">{TILE_LABELS[typ]}</button>
                  ))}
                  {tiles.length >= 9 && <span className="text-[10px] text-slate-400">Max. Kacheln erreicht.</span>}
                </div>
              </div>
              {(onExportBackup || onImportBackup) && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{LABELS.backup.exportDesc}</h4>
                  <div className="flex gap-2">
                    {onExportBackup && (
                      <button onClick={() => { onExportBackup(); setIsLayoutModalOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        <Download size={14} /> {LABELS.backup.export}
                      </button>
                    )}
                    {onImportBackup && (
                      <>
                        <input type="file" accept=".json" className="hidden" id="backup-import" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onImportBackup(f); setIsLayoutModalOpen(false); } e.target.value = ''; }} />
                        <label htmlFor="backup-import" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                          <Upload size={14} /> {LABELS.backup.import}
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsLayoutModalOpen(false)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all">{LABELS.buttons.done}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REFLECTION */}
      {isWritingReflection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><PenLine size={20} /></div><div><h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">Tages-Reflexion</h3></div></div>
                      <button onClick={() => setIsWritingReflection(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400"><X size={18}/></button>
                  </div>
                  <div className="p-8"><textarea value={reflectionText} onChange={(e) => setReflectionText(e.target.value)} placeholder="Heute habe ich..." className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs focus:border-blue-500 outline-none resize-none font-medium custom-scrollbar" /></div>
                  <div className="p-6 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/50">
                      <button onClick={() => setIsWritingReflection(false)} className="px-6 py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">Abbrechen</button>
                      <button onClick={() => { onAddReflection(reflectionText); setIsWritingReflection(false); setReflectionText(''); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">Log speichern</button>
                  </div>
              </div>
          </div>
      )}

      {/* ACHIEVEMENTS MODAL */}
      {isAchievementsModalOpen && (() => {
        const categories: (AchievementCategory | 'all')[] = ['all', 'start', 'projects', 'reflection', 'habits', 'applications', 'secret'];
        const categoryLabels: Record<AchievementCategory | 'all', string> = {
          all: 'Alle',
          start: 'Erste Schritte',
          projects: 'Projekte',
          reflection: 'Reflexion',
          habits: 'Gewohnheiten',
          applications: 'Bewerbungen',
          secret: 'Geheim',
        };
        const filteredAchievements = achievementFilter === 'all' 
          ? profile.achievements 
          : getAchievementsByCategory(profile.achievements, achievementFilter);
        const stats = countUnlockedAchievements(profile.achievements);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] max-h-[700px] overflow-hidden border border-slate-200 flex flex-col">
              {/* Header - kompakt */}
              <div className="shrink-0 p-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-['Space_Grotesk'] text-slate-900">Erfolge & Trophäen</h3>
                      <p className="text-[11px] text-slate-500">
                        <span className="font-bold text-amber-600">{stats.unlocked}</span> von {stats.total}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsAchievementsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/80 text-slate-400">
                    <X size={18} />
                  </button>
                </div>
                {/* XP / Level - eine Zeile */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-[10px]">{profile.level}</div>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${(profile.xp / profile.nextLevelXp) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-400 w-14 text-right">{profile.xp}/{profile.nextLevelXp}</span>
                </div>
              </div>
              
              {/* Category Tabs */}
              <div className="shrink-0 px-3 py-1.5 border-b border-slate-100 bg-slate-50/50 flex gap-1 overflow-x-auto">
                {categories.map(cat => {
                  const count = cat === 'all' 
                    ? profile.achievements.filter(a => a.unlocked).length 
                    : getAchievementsByCategory(profile.achievements, cat).filter(a => a.unlocked).length;
                  const total = cat === 'all' 
                    ? profile.achievements.length 
                    : getAchievementsByCategory(profile.achievements, cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setAchievementFilter(cat)}
                      className={`px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap flex items-center gap-1 ${
                        achievementFilter === cat 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
                      }`}
                    >
                      {cat !== 'all' && <span>{CATEGORY_ICONS[cat]}</span>}
                      {categoryLabels[cat]}
                      <span className={achievementFilter === cat ? 'text-amber-200' : 'text-slate-400'}>{count}/{total}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Achievements Grid - kein Scroll, feste Zeilenanzahl */}
              <div className="flex-1 min-h-0 p-3 overflow-hidden flex flex-col">
                {(() => {
                  const cols = 6; // Spalten (lg)
                  const rows = Math.max(1, Math.ceil(filteredAchievements.length / cols));
                  return (
                <div 
                  className="grid gap-2 h-full w-full"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                  }}
                >
                  {filteredAchievements.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 text-slate-400 text-sm">
                    <Trophy size={32} className="mb-2 opacity-30" />
                    Keine Erfolge in dieser Kategorie
                  </div>
                  ) : (
                  filteredAchievements.map(a => {
                    const tier = a.tier ?? 'bronze';
                    const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
                    const isSecret = a.secret && !a.unlocked;
                    const tierLabel = { bronze: 'B', silver: 'S', gold: 'G', platinum: 'P' }[tier] ?? 'B';
                    const hasProgress = a.target && !a.unlocked;
                    
                    return (
                      <div 
                        key={a.id} 
                        className={`group/card relative rounded-lg border transition-all min-h-0 flex flex-col ${
                          a.unlocked 
                            ? `${tierColor.bg} ${tierColor.border}` 
                            : 'bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        {/* Tooltip: Was du brauchst */}
                        {!isSecret && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover/card:opacity-100 transition-opacity z-20 w-[140px] text-center whitespace-pre-line">
                            <span className="font-bold text-amber-300 block mb-1">Was du brauchst:</span>
                            {a.description}
                            {a.target != null && (
                              <span className="block mt-1.5 text-slate-300">
                                Aktuell: {a.progress ?? 0} von {a.target}
                              </span>
                            )}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                          </div>
                        )}
                        <div className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold ${
                          a.unlocked ? `${tierColor.text} bg-white/70` : 'text-slate-400 bg-slate-100'
                        }`}>
                          {tierLabel}
                        </div>
                        <div className="p-2 flex flex-col items-center text-center flex-1 min-h-0 justify-between pt-3">
                          <span className={`text-2xl shrink-0 ${!a.unlocked && !isSecret ? 'grayscale opacity-50' : ''}`}>
                            {isSecret ? '🔒' : a.icon}
                          </span>
                          <h4 className={`text-[10px] font-bold leading-tight truncate w-full mt-0.5 ${a.unlocked ? tierColor.text : 'text-slate-400'}`}>
                            {isSecret ? '???' : a.title}
                          </h4>
                          {hasProgress && (
                            <div className="w-full mt-0.5">
                              <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((a.progress || 0) / a.target!) * 100}%` }} />
                              </div>
                              <p className="text-[7px] text-slate-400">{a.progress || 0}/{a.target}</p>
                            </div>
                          )}
                          <div className={`text-[8px] font-bold mt-auto pt-0.5 ${a.unlocked ? 'text-amber-600' : 'text-slate-400'}`}>
                            +{a.xpValue}
                          </div>
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>
                  );
                })()}
              </div>
              
              {/* Footer */}
              <div className="shrink-0 p-2 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button onClick={() => setIsAchievementsModalOpen(false)} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-amber-600">
                  Schliessen
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ACHIEVEMENT UNLOCK TOAST */}
      {newlyUnlockedAchievements.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-5 fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {newlyUnlockedAchievements[0].icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Erfolg freigeschaltet!</p>
                <h4 className="text-sm font-bold text-slate-900 truncate">{newlyUnlockedAchievements[0].title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{newlyUnlockedAchievements[0].description}</p>
                {newlyUnlockedAchievements.length > 1 && (
                  <p className="text-[10px] text-amber-600 mt-2">+{newlyUnlockedAchievements.length - 1} weitere Erfolge</p>
                )}
              </div>
              <button onClick={onClearAchievementNotification} className="text-slate-300 hover:text-slate-500">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XP GAINED ANIMATION */}
      {xpGained?.show && xpGained.amount > 0 && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-in zoom-in fade-in duration-300">
          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-2xl flex items-center gap-3">
            <Sparkles size={28} />
            +{xpGained.amount} XP
          </div>
        </div>
      )}

      {/* LEVEL UP MODAL */}
      {showLevelUpModal?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-b from-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-8 max-w-md text-center text-white animate-in zoom-in-95">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star size={48} className="text-yellow-300" />
            </div>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-2">Level Up!</h2>
            <p className="text-lg opacity-90 mb-4">Du hast Level {showLevelUpModal.newLevel} erreicht!</p>
            <div className="w-20 h-20 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 font-bold text-4xl shadow-lg">
              {showLevelUpModal.newLevel}
            </div>
            <p className="text-sm opacity-75 mb-6">Weiter so! Schliesse mehr Aufgaben ab, um neue Erfolge freizuschalten.</p>
            <button 
              onClick={() => { onCloseLevelUpModal?.(); (window as any).confetti?.({ particleCount: 150, spread: 90, origin: { y: 0.6 } }); }}
              className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-lg"
            >
              Super!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
