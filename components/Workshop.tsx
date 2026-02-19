
import React, { useState, useRef, useCallback } from 'react';
import { Project, ProjectType, ProjectResource, DiaryEntry, Notification, ProjectPhase, PROJECT_PHASES, Milestone } from '../types';
import { Plus, Book, LayoutTemplate, ArrowLeft, CheckCircle2, Clock, Wrench, FileText, Download, ExternalLink, X, Trash2, Bell, Star, Footprints, Link, Image, GripVertical, Pencil, MessageSquare, Eye, ChevronRight, Calendar } from 'lucide-react';
import { INITIAL_RESOURCES } from '../constants';
import { NotificationsPanel } from './NotificationsPanel';
import { LABELS } from '../labels';

interface WorkshopProps {
  projects: Project[];
  onUpdateStatus: (id: string, status: Project['status']) => void;
  onAddProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (project: Project) => void;
  mainProjectId?: string;
  onSetMainProject: (id: string) => void;
  notifications: Notification[];
  isNotifOpen: boolean;
  onToggleNotif: () => void;
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void;
}

async function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

const PHASE_COLORS: Record<ProjectPhase, { bg: string; text: string; border: string; dot: string }> = {
  Planen: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Recherche: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  Umsetzung: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Abschluss: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
};

function PhaseStepper({ currentPhase, onSetPhase }: { currentPhase: ProjectPhase; onSetPhase: (p: ProjectPhase) => void }) {
  const currentIdx = PROJECT_PHASES.indexOf(currentPhase);
  return (
    <div className="flex items-center gap-1 w-full py-3">
      {PROJECT_PHASES.map((phase, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const colors = PHASE_COLORS[phase];
        return (
          <React.Fragment key={phase}>
            <button
              onClick={() => { if (idx <= currentIdx + 1) onSetPhase(phase); }}
              disabled={idx > currentIdx + 1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                active ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-current` :
                done ? `${colors.bg} ${colors.text} opacity-80` :
                'bg-slate-100 text-slate-400'
              } ${idx > currentIdx + 1 ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
            >
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className={`w-2 h-2 rounded-full ${active ? colors.dot : 'bg-slate-300'}`} />}
              {(LABELS.phases as Record<string, string>)[phase] ?? phase}
            </button>
            {idx < PROJECT_PHASES.length - 1 && (
              <ChevronRight className={`w-3 h-3 shrink-0 ${idx < currentIdx ? 'text-slate-400' : 'text-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export const Workshop: React.FC<WorkshopProps> = ({ projects, onUpdateStatus, onAddProject, onDeleteProject, onUpdateProject, mainProjectId, onSetMainProject, notifications, isNotifOpen, onToggleNotif, onMarkAllRead, onDeleteNotification }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'diary' | 'overview'>('canvas');
  const [viewMode, setViewMode] = useState<'board' | 'toolbox'>('board');
  const [isDragging, setIsDragging] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectQuestion, setNewProjectQuestion] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('passion');

  const SUBJECT_OPTIONS = ['Deutsch', 'Mathematik', 'Sport', 'Englisch', 'Projektfach', 'Wahlpflichtfach', 'Lernatelier'];
  const [newSubject, setNewSubject] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<ProjectResource['type']>('link');
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [newMilestoneWeek, setNewMilestoneWeek] = useState(1);
  const [newMilestonePhase, setNewMilestonePhase] = useState<ProjectPhase | ''>('');
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');

  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryPhase, setNewEntryPhase] = useState<ProjectPhase>('Umsetzung');
  const [newEntryImage, setNewEntryImage] = useState<string | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneText, setEditMilestoneText] = useState('');
  const [editMilestoneWeek, setEditMilestoneWeek] = useState(1);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editEntryContent, setEditEntryContent] = useState('');

  const [dragMilestoneId, setDragMilestoneId] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: Project['status']) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    if (projectId) {
      onUpdateStatus(projectId, status);
      if (status === 'completed') {
        (window as any).confetti?.({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
    setIsDragging(false);
  };

  const submitNewProject = () => {
    if (!newProjectTitle.trim() || !newProjectQuestion.trim()) return;
    const newProject: Project = {
        id: Date.now().toString(),
        title: newProjectTitle,
        type: newProjectType,
        status: 'planning',
        currentPhase: 'Planen',
        passionQuestion: newProjectQuestion,
        subjects: [],
        milestones: [],
        resources: [],
        entries: [],
        lastUpdated: new Date().toISOString().split('T')[0]
    };
    onAddProject(newProject);
    setIsNewProjectModalOpen(false);
    setNewProjectTitle('');
    setNewProjectQuestion('');
    setNewProjectType('passion');
  };

  const handleAddSubject = () => {
    if (!selectedProject || !newSubject.trim()) return;
    onUpdateProject({ ...selectedProject, subjects: [...selectedProject.subjects, newSubject.trim()] });
    setNewSubject('');
  };

  const handleRemoveSubject = (sub: string) => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, subjects: selectedProject.subjects.filter(s => s !== sub) });
  };

  const resourcesList: ProjectResource[] = Array.isArray(selectedProject?.resources) ? selectedProject.resources : [];

  const handleAddResource = () => {
    if (!selectedProject || !newResourceTitle.trim()) return;
    if ((newResourceType === 'link' || newResourceType === 'pdf') && !newResourceUrl.trim()) return;
    const newRes: ProjectResource = {
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: newResourceTitle.trim(),
      type: newResourceType,
      ...(newResourceType !== 'note' && newResourceUrl.trim() ? { url: newResourceUrl.trim() } : {}),
    };
    onUpdateProject({ ...selectedProject, resources: [...resourcesList, newRes] });
    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceType('link');
  };

  const handleRemoveResource = (resourceId: string) => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, resources: resourcesList.filter((r) => r.id !== resourceId) });
  };

  const openResourceUrl = (r: ProjectResource) => {
    if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleMilestone = (milestoneId: string) => {
    if (!selectedProject) return;
    const updatedMilestones = selectedProject.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    onUpdateProject({ ...selectedProject, milestones: updatedMilestones });
  };

  const handleAddMilestone = () => {
    if (!selectedProject || !newMilestoneText.trim()) return;
    const newM: Milestone = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      week: newMilestoneWeek,
      text: newMilestoneText,
      completed: false,
      phase: newMilestonePhase || undefined,
    };
    onUpdateProject({ ...selectedProject, milestones: [...selectedProject.milestones, newM] });
    setNewMilestoneText('');
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, milestones: selectedProject.milestones.filter(m => m.id !== milestoneId) });
  };

  const handleSaveMilestoneEdit = (milestoneId: string) => {
    if (!selectedProject || !editMilestoneText.trim()) return;
    const updatedMilestones = selectedProject.milestones.map(m =>
      m.id === milestoneId ? { ...m, text: editMilestoneText, week: editMilestoneWeek } : m
    );
    onUpdateProject({ ...selectedProject, milestones: updatedMilestones });
    setEditingMilestoneId(null);
  };

  const handleMilestoneDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('milestoneId', id);
    setDragMilestoneId(id);
  };

  const handleMilestoneDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!selectedProject) return;
    const dragId = e.dataTransfer.getData('milestoneId');
    if (!dragId || dragId === targetId) return;
    const ms = [...selectedProject.milestones];
    const fromIdx = ms.findIndex(m => m.id === dragId);
    const toIdx = ms.findIndex(m => m.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = ms.splice(fromIdx, 1);
    ms.splice(toIdx, 0, moved);
    onUpdateProject({ ...selectedProject, milestones: ms });
    setDragMilestoneId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setImageError('Bild darf max. 5 MB gross sein.'); return; }
    setImageError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string);
      setNewEntryImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const submitNewEntry = () => {
      if (!selectedProject || !newEntryContent.trim()) return;
      const newEntry: DiaryEntry = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('de-CH'),
          content: newEntryContent,
          phase: newEntryPhase,
          image: newEntryImage,
      };
      onUpdateProject({ ...selectedProject, entries: [newEntry, ...selectedProject.entries] });
      setIsNewEntryModalOpen(false);
      setNewEntryContent('');
      setNewEntryImage(undefined);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, entries: selectedProject.entries.filter(e => e.id !== entryId) });
    setDeleteEntryId(null);
  };

  const handleSaveEntryEdit = (entryId: string) => {
    if (!selectedProject || !editEntryContent.trim()) return;
    onUpdateProject({
      ...selectedProject,
      entries: selectedProject.entries.map(e => e.id === entryId ? { ...e, content: editEntryContent } : e),
    });
    setEditingEntryId(null);
  };

  const handleSetPhase = (phase: ProjectPhase) => {
    if (!selectedProject) return;
    const status: Project['status'] = phase === 'Abschluss' ? 'completed' : phase === 'Planen' ? 'planning' : 'active';
    onUpdateProject({ ...selectedProject, currentPhase: phase, status });
  };

  const getCategoryBadgeStyle = (type: ProjectType) => {
      switch (type) {
          case 'passion': return 'bg-indigo-100 text-indigo-700';
          case 'mini': return 'bg-orange-100 text-orange-700';
          case 'trial': return 'bg-blue-100 text-blue-700';
          case 'application': return 'bg-pink-100 text-pink-700';
          case 'group': return 'bg-green-100 text-green-700';
          case 'exam': return 'bg-red-100 text-red-700';
          case 'reflection': return 'bg-amber-100 text-amber-700';
          case 'todo': return 'bg-cyan-100 text-cyan-700';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  // ==================== PROJECT DETAIL VIEW ====================
  if (selectedProject) {
    const done = selectedProject.milestones.filter(m => m.completed).length;
    const total = selectedProject.milestones.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const phaseColors = PHASE_COLORS[selectedProject.currentPhase];

    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => { setSelectedProjectId(null); setViewMode('board'); }} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-bold text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm hover:border-blue-200 group">
            <ArrowLeft className="w-3.5 h-3.5" /> {LABELS.project.board}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetMainProject(selectedProject.id)}
              className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                mainProjectId === selectedProject.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              {mainProjectId === selectedProject.id ? LABELS.project.mainProject : LABELS.project.setAsMain}
            </button>
            <button
              onClick={() => setDeleteConfirmId(selectedProject.id)}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Projekt löschen"
            >
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
            {/* Title + Phase Stepper */}
            <div className="px-6 pt-5 pb-2 border-b border-slate-100">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase mb-1.5 ${getCategoryBadgeStyle(selectedProject.type)}`}>
                    {(LABELS.projectTypes as Record<string, string>)[selectedProject.type] ?? selectedProject.type}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">{selectedProject.title}</h2>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${phaseColors.bg} ${phaseColors.text}`}>
                  {(LABELS.phases as Record<string, string>)[selectedProject.currentPhase]}
                </span>
              </div>
              <p className="text-xs text-slate-500 italic mb-2">"{selectedProject.passionQuestion}"</p>
              <PhaseStepper currentPhase={selectedProject.currentPhase} onSetPhase={handleSetPhase} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button onClick={() => setActiveTab('canvas')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'canvas' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-800'}`}>
                <LayoutTemplate className="w-3.5 h-3.5" /> {LABELS.projectTabs.canvas}
              </button>
              <button onClick={() => setActiveTab('diary')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'diary' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-800'}`}>
                <Book className="w-3.5 h-3.5" /> {LABELS.projectTabs.diary}
              </button>
              <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'overview' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-800'}`}>
                <Eye className="w-3.5 h-3.5" /> {LABELS.projectTabs.overview}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {/* ===== CANVAS TAB ===== */}
              {activeTab === 'canvas' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Fächer</h3>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                           {selectedProject.subjects.map(s => (
                             <span key={s} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-[10px] font-medium text-slate-700 flex items-center gap-1.5 shadow-sm">
                               {s} <button onClick={() => handleRemoveSubject(s)}><X className="w-2.5 h-2.5" /></button>
                             </span>
                           ))}
                        </div>
                        {(() => {
                          const available = SUBJECT_OPTIONS.filter(s => !selectedProject.subjects.includes(s));
                          return available.length > 0 ? (
                            <div className="flex gap-1.5">
                              <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="bg-white border border-slate-200 text-[10px] p-1.5 rounded flex-1 outline-none">
                                <option value="">Fach wählen...</option>
                                {available.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button onClick={handleAddSubject} disabled={!newSubject} className="bg-slate-200 p-1.5 rounded disabled:opacity-40"><Plus className="w-3.5 h-3.5"/></button>
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-400 italic">Alle Fächer hinzugefügt</p>
                          );
                        })()}
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Material</h3>
                        <div className="space-y-2 mb-3">
                          {resourcesList.map((r) => (
                            <div key={r.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 group">
                              <button
                                type="button"
                                onClick={() => r.url && openResourceUrl(r)}
                                className={`flex-1 flex items-center gap-2 min-w-0 text-left ${r.url ? 'cursor-pointer hover:text-blue-600' : ''}`}
                                title={r.url ? 'Öffnen' : undefined}
                              >
                                {r.type === 'link' && <Link className="w-3 h-3 shrink-0 text-slate-400" />}
                                {r.type === 'pdf' && <Download className="w-3 h-3 shrink-0 text-slate-400" />}
                                {r.type === 'note' && <FileText className="w-3 h-3 shrink-0 text-slate-400" />}
                                <span className="text-[10px] font-medium text-slate-700 truncate">{r.title}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveResource(r.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Entfernen"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {resourcesList.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">Keine Ressourcen.</p>
                          )}
                        </div>
                        <div className="border-t border-slate-200 pt-2 space-y-1.5">
                          <input value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} placeholder="Titel" className="w-full bg-white border border-slate-200 text-[10px] p-1.5 rounded outline-none focus:border-blue-400" />
                          <select value={newResourceType} onChange={(e) => setNewResourceType(e.target.value as ProjectResource['type'])} className="w-full bg-white border border-slate-200 text-[10px] p-1.5 rounded outline-none">
                            <option value="link">Link</option>
                            <option value="pdf">PDF</option>
                            <option value="note">Notiz</option>
                          </select>
                          {(newResourceType === 'link' || newResourceType === 'pdf') && (
                            <input value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} placeholder="https://..." type="url" className="w-full bg-white border border-slate-200 text-[10px] p-1.5 rounded outline-none focus:border-blue-400" />
                          )}
                          <button onClick={handleAddResource} disabled={!newResourceTitle.trim() || ((newResourceType === 'link' || newResourceType === 'pdf') && !newResourceUrl.trim())} className="w-full text-[9px] bg-slate-900 text-white py-1.5 rounded font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                            Ressource hinzufügen
                          </button>
                        </div>
                     </div>
                  </div>
                    
                  {/* Milestones with progress bar */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                     <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Footprints size={10} /> {LABELS.milestones.title}</h3>
                          <span className="text-[9px] font-bold text-slate-500">{done}/{total} ({pct}%)</span>
                        </div>
                        {total > 0 && (
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                     </div>
                     <div className="divide-y divide-slate-100">
                        {selectedProject.milestones.map((m) => (
                          editingMilestoneId === m.id ? (
                            <div key={m.id} className="flex items-center gap-2 p-3 bg-blue-50/50">
                              <input value={editMilestoneText} onChange={(e) => setEditMilestoneText(e.target.value)} className="flex-1 text-[11px] bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400" onKeyDown={(e) => e.key === 'Enter' && handleSaveMilestoneEdit(m.id)} />
                              <input type="number" value={editMilestoneWeek} onChange={(e) => setEditMilestoneWeek(parseInt(e.target.value) || 1)} min="1" max="52" className="w-14 text-[10px] bg-white border border-slate-200 rounded px-2 py-1 text-center outline-none" />
                              <button onClick={() => handleSaveMilestoneEdit(m.id)} className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">OK</button>
                              <button onClick={() => setEditingMilestoneId(null)} className="text-[9px] font-bold text-slate-400 px-2 py-1">X</button>
                            </div>
                          ) : (
                           <div
                             key={m.id}
                             draggable
                             onDragStart={(e) => handleMilestoneDragStart(e, m.id)}
                             onDragOver={(e) => e.preventDefault()}
                             onDrop={(e) => handleMilestoneDrop(e, m.id)}
                             className={`flex items-center gap-2 p-3 hover:bg-slate-50 group ${dragMilestoneId === m.id ? 'opacity-50' : ''}`}
                           >
                              <GripVertical className="w-3 h-3 text-slate-300 cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <button onClick={() => handleToggleMilestone(m.id)} className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${m.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 hover:border-blue-400'}`}>
                                {m.completed && <CheckCircle2 className="w-3 h-3" />}
                              </button>
                              <p className={`text-[11px] flex-1 ${m.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{m.text}</p>
                              {m.phase && (
                                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${PHASE_COLORS[m.phase].bg} ${PHASE_COLORS[m.phase].text}`}>
                                  {(LABELS.phases as Record<string, string>)[m.phase]}
                                </span>
                              )}
                              <span className="text-[9px] font-mono text-slate-400">KW {m.week}</span>
                              <button onClick={() => { setEditingMilestoneId(m.id); setEditMilestoneText(m.text); setEditMilestoneWeek(m.week); }} className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3" /></button>
                              <button onClick={() => handleDeleteMilestone(m.id)} className="p-1 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                           </div>
                          )
                        ))}
                     </div>
                     <div className="p-3 border-t border-slate-100 bg-slate-50">
                        <div className="flex gap-2">
                          <input
                            value={newMilestoneText}
                            onChange={(e) => setNewMilestoneText(e.target.value)}
                            placeholder={LABELS.milestones.newPlaceholder}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] focus:border-blue-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                          />
                          <input
                            type="number"
                            value={newMilestoneWeek}
                            onChange={(e) => setNewMilestoneWeek(parseInt(e.target.value) || 1)}
                            min="1" max="52"
                            className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] focus:border-blue-500 outline-none text-center"
                            placeholder="KW"
                          />
                          <select
                            value={newMilestonePhase}
                            onChange={(e) => setNewMilestonePhase(e.target.value as ProjectPhase | '')}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none"
                          >
                            <option value="">Phase...</option>
                            {PROJECT_PHASES.map(p => <option key={p} value={p}>{(LABELS.phases as Record<string, string>)[p]}</option>)}
                          </select>
                          <button
                            onClick={handleAddMilestone}
                            disabled={!newMilestoneText.trim()}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* ===== DIARY TAB ===== */}
              {activeTab === 'diary' && (
                <div className="max-w-xl mx-auto space-y-6">
                   <div className="flex justify-between items-center">
                     <h3 className="text-lg font-bold font-['Space_Grotesk']">{LABELS.projectTabs.diary}</h3>
                     <button onClick={() => setIsNewEntryModalOpen(true)} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100">{LABELS.diary.newEntry}</button>
                   </div>
                   {selectedProject.entries.length === 0 && (
                     <div className="text-center py-12">
                       <Book className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                       <p className="text-sm text-slate-400">{LABELS.diary.noEntries}</p>
                     </div>
                   )}
                   <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                      {selectedProject.entries.map((entry) => {
                        const entryPhaseColors = PHASE_COLORS[entry.phase] || PHASE_COLORS.Umsetzung;
                        return (
                         <div key={entry.id} className="relative pl-8 group/entry">
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 ${entryPhaseColors.border} flex items-center justify-center z-10`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${entryPhaseColors.dot}`} />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                               <div className="flex items-start justify-between mb-1">
                                 <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${entryPhaseColors.bg} ${entryPhaseColors.text}`}>
                                   {(LABELS.phases as Record<string, string>)[entry.phase] ?? entry.phase} • {entry.date}
                                 </span>
                                 <div className="flex gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity">
                                   <button onClick={() => { setEditingEntryId(entry.id); setEditEntryContent(entry.content); }} className="p-1 text-slate-300 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                                   <button onClick={() => setDeleteEntryId(entry.id)} className="p-1 text-slate-300 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                 </div>
                               </div>
                               {editingEntryId === entry.id ? (
                                 <div className="mt-2">
                                   <textarea value={editEntryContent} onChange={(e) => setEditEntryContent(e.target.value)} className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none resize-none" rows={3} />
                                   <div className="flex gap-2 mt-1.5">
                                     <button onClick={() => handleSaveEntryEdit(entry.id)} className="text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">Speichern</button>
                                     <button onClick={() => setEditingEntryId(null)} className="text-[9px] font-bold text-slate-400 px-3 py-1">Abbrechen</button>
                                   </div>
                                 </div>
                               ) : (
                                 <p className="text-slate-600 text-[11px] leading-relaxed mt-1">{entry.content}</p>
                               )}
                               {entry.image && <img src={entry.image} alt="Tagebuch-Bild" className="mt-2 rounded-lg border border-slate-200 max-h-48 object-cover" />}
                               {entry.teacherFeedback && (
                                 <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                   <div className="flex items-center gap-1.5 mb-1">
                                     <MessageSquare className="w-3 h-3 text-blue-600" />
                                     <span className="text-[9px] font-bold text-blue-700 uppercase">{LABELS.diary.teacherFeedback}</span>
                                   </div>
                                   <p className="text-[11px] text-blue-800 leading-relaxed">{entry.teacherFeedback}</p>
                                 </div>
                               )}
                            </div>
                         </div>
                        );
                      })}
                   </div>
                </div>
              )}

              {/* ===== OVERVIEW TAB ===== */}
              {activeTab === 'overview' && (
                <div className="max-w-xl mx-auto space-y-6">
                  {/* Progress */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">{LABELS.projectOverview.progress}</h3>
                    <div className="flex items-end gap-4 mb-3">
                      <span className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900">{pct}%</span>
                      <span className="text-xs text-slate-500 mb-1">{done} / {total} {LABELS.milestones.title}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Current Phase */}
                    <div className={`rounded-xl p-4 border ${phaseColors.border} ${phaseColors.bg}`}>
                      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">{LABELS.projectOverview.currentPhase}</h3>
                      <span className={`text-lg font-bold font-['Space_Grotesk'] ${phaseColors.text}`}>
                        {(LABELS.phases as Record<string, string>)[selectedProject.currentPhase]}
                      </span>
                    </div>

                    {/* Last Activity */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">{LABELS.projectOverview.lastActivity}</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{selectedProject.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  {/* Latest diary entry */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">{LABELS.projectOverview.lastEntry}</h3>
                    {selectedProject.entries.length > 0 ? (
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{selectedProject.entries[0].date} • {(LABELS.phases as Record<string, string>)[selectedProject.entries[0].phase]}</span>
                        <p className="text-sm text-slate-700 mt-1 line-clamp-3">{selectedProject.entries[0].content}</p>
                        {selectedProject.entries[0].image && <img src={selectedProject.entries[0].image} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">{LABELS.projectOverview.noEntries}</p>
                    )}
                  </div>

                  {/* Subjects & Resources */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Fächer</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProject.subjects.map(s => (
                          <span key={s} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-[10px] font-medium text-slate-700">{s}</span>
                        ))}
                        {selectedProject.subjects.length === 0 && <span className="text-[10px] text-slate-400 italic">Keine</span>}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Material</h3>
                      <div className="space-y-1">
                        {resourcesList.map(r => (
                          <div key={r.id} className="flex items-center gap-1.5">
                            {r.type === 'link' ? <Link className="w-3 h-3 text-slate-400" /> : r.type === 'pdf' ? <Download className="w-3 h-3 text-slate-400" /> : <FileText className="w-3 h-3 text-slate-400" />}
                            <span className="text-[10px] text-slate-700 truncate">{r.title}</span>
                          </div>
                        ))}
                        {resourcesList.length === 0 && <span className="text-[10px] text-slate-400 italic">Keine</span>}
                      </div>
                    </div>
                  </div>

                  {/* Complete project button */}
                  {selectedProject.currentPhase === 'Abschluss' && selectedProject.status !== 'completed' && (
                    <button
                      onClick={() => { onUpdateStatus(selectedProject.id, 'completed'); (window as any).confetti?.({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> {LABELS.projectOverview.completeProject}
                    </button>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900 mb-2">{LABELS.confirm.deleteProject}</h3>
                <p className="text-sm text-slate-500">{LABELS.confirm.deleteProjectDesc}</p>
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors rounded-lg">{LABELS.buttons.cancel}</button>
                <button onClick={() => { onDeleteProject(deleteConfirmId); setSelectedProjectId(null); setDeleteConfirmId(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">{LABELS.buttons.delete}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Entry Confirmation Modal */}
        {deleteEntryId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900 mb-2">{LABELS.diary.deleteEntry}</h3>
                <p className="text-sm text-slate-500">{LABELS.diary.deleteEntryDesc}</p>
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-2">
                <button onClick={() => setDeleteEntryId(null)} className="flex-1 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors rounded-lg">{LABELS.buttons.cancel}</button>
                <button onClick={() => handleDeleteEntry(deleteEntryId)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">{LABELS.buttons.delete}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: New Diary Entry */}
        {isNewEntryModalOpen && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">Tagebucheintrag</h3>
                    <p className="text-xs text-slate-500">{selectedProject.title}</p>
                  </div>
                </div>
                <button onClick={() => setIsNewEntryModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Phase</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PROJECT_PHASES.map((phase) => {
                      const colors = PHASE_COLORS[phase];
                      return (
                        <button
                          key={phase}
                          onClick={() => setNewEntryPhase(phase)}
                          className={`py-2 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                            newEntryPhase === phase
                              ? `${colors.bg} ${colors.text} ${colors.border}`
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {(LABELS.phases as Record<string, string>)[phase] ?? phase}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Eintrag</label>
                  <textarea
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                    placeholder="Was hast du heute gemacht? Welche Erkenntnisse hattest du?"
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Bild (optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                      <Image size={14} /> Bild wählen
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {newEntryImage && (
                      <div className="relative">
                        <img src={newEntryImage} alt="Vorschau" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                        <button onClick={() => setNewEntryImage(undefined)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]" aria-label="Bild entfernen"><X size={10} /></button>
                      </div>
                    )}
                  </div>
                  {imageError && <p className="text-xs text-red-500 mt-2 font-medium">{imageError}</p>}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button onClick={() => setIsNewEntryModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors">{LABELS.buttons.cancel}</button>
                <button onClick={submitNewEntry} disabled={!newEntryContent.trim()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">{LABELS.buttons.save}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== BOARD VIEW ====================
  return (
    <div className="space-y-4 h-full flex flex-col relative">
      <NotificationsPanel
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={onToggleNotif}
        onMarkAllRead={onMarkAllRead}
        onDeleteNotification={onDeleteNotification}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">{LABELS.nav.werkstatt}</h2>
          <p className="text-slate-500 text-xs font-medium">{LABELS.project.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onToggleNotif} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all relative shadow-sm group">
            <Bell size={16} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>
          <button onClick={() => setViewMode(viewMode === 'toolbox' ? 'board' : 'toolbox')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Wrench size={14} /> {viewMode === 'toolbox' ? LABELS.project.board : LABELS.project.toolbox}
          </button>
          <button onClick={() => setIsNewProjectModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><Plus size={14} /> {LABELS.project.newLabel}</button>
        </div>
      </div>

      {viewMode === 'toolbox' ? (
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">{LABELS.project.toolbox}</h3>
              <p className="text-xs text-slate-500 font-medium">{LABELS.project.resources} ({LABELS.general.demo})</p>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{INITIAL_RESOURCES.length} {LABELS.general.entries}</span>
          </div>
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <span className="font-medium">{LABELS.project.toolboxDemoHint}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_RESOURCES.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{r.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{r.category} • {r.type}</p>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <button className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-white transition-colors flex items-center justify-center cursor-not-allowed opacity-75" aria-label="Öffnen (Demo)" title={LABELS.project.toolboxDemoHint}>
                      {r.type === 'pdf' ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button onClick={() => setFilterType('all')} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${filterType === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Alle</button>
            {(['passion', 'mini', 'exam', 'trial', 'application', 'group', 'reflection', 'todo'] as ProjectType[]).filter(t => projects.some(p => p.type === t)).map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${filterType === t ? `${getCategoryBadgeStyle(t)} border-current` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                {(LABELS.projectTypes as Record<string, string>)[t] ?? t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 h-full min-w-[800px]">
              <KanbanColumn title={LABELS.projectColumns.ideas} status="planning" projects={(filterType === 'all' ? projects : projects.filter(p => p.type === filterType)).filter(p => p.status === 'planning')} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onSelectProject={setSelectedProjectId} color="border-t-slate-300" getBadgeStyle={getCategoryBadgeStyle} />
              <KanbanColumn title={LABELS.projectColumns.active} status="active" projects={(filterType === 'all' ? projects : projects.filter(p => p.type === filterType)).filter(p => p.status === 'active')} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onSelectProject={setSelectedProjectId} color="border-t-blue-500" getBadgeStyle={getCategoryBadgeStyle} />
              <KanbanColumn title={LABELS.projectColumns.done} status="completed" projects={(filterType === 'all' ? projects : projects.filter(p => p.type === filterType)).filter(p => p.status === 'completed')} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onSelectProject={setSelectedProjectId} color="border-t-green-500" getBadgeStyle={getCategoryBadgeStyle} />
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Project */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Plus size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">{LABELS.project.newProject}</h3>
                  <p className="text-xs text-slate-500">{LABELS.project.newProjectDesc}</p>
                </div>
              </div>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400" aria-label="Schliessen"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Titel</label>
                <input value={newProjectTitle} onChange={(e) => setNewProjectTitle(e.target.value)} placeholder="z.B. Passion Project: Website" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Leitfrage</label>
                <textarea value={newProjectQuestion} onChange={(e) => setNewProjectQuestion(e.target.value)} placeholder="Was ist die zentrale Frage deines Projekts?" className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Typ</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['passion', 'mini', 'exam', 'trial', 'application', 'group', 'reflection', 'todo'] as ProjectType[]).map((type) => (
                    <button key={type} onClick={() => setNewProjectType(type)} className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${newProjectType === type ? `${getCategoryBadgeStyle(type)} border-current` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      {(LABELS.projectTypes as Record<string, string>)[type] ?? type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsNewProjectModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors">{LABELS.buttons.cancel}</button>
              <button onClick={submitNewProject} disabled={!newProjectTitle.trim() || !newProjectQuestion.trim()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">{LABELS.project.create}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== KANBAN COLUMN ====================
interface KanbanColumnProps {
  title: string;
  status: Project['status'];
  projects: Project[];
  onDragStart: (e: React.DragEvent, projectId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Project['status']) => void;
  onSelectProject: (id: string) => void;
  color: string;
  getBadgeStyle: (type: Project['type']) => string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, projects, onDragStart, onDragOver, onDrop, onSelectProject, color, getBadgeStyle }) => {
  return (
    <div className="flex-1 bg-slate-100/50 rounded-xl flex flex-col border border-slate-200" onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
      <div className={`p-3 border-b border-slate-200 bg-white rounded-t-xl border-t-3 ${color} flex justify-between items-center`}>
        <h3 className="font-bold text-xs text-slate-900">{title}</h3>
        <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold">{projects.length}</span>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        {projects.map((p) => {
          const done = p.milestones.filter(m => m.completed).length;
          const total = p.milestones.length;
          const phaseColors = PHASE_COLORS[p.currentPhase] || PHASE_COLORS.Planen;
          const lastEntry = p.entries[0];
          return (
            <div key={p.id} draggable onDragStart={(e) => onDragStart(e, p.id)} onClick={() => onSelectProject(p.id)} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all group relative">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${getBadgeStyle(p.type)}`}>{(LABELS.projectTypes as Record<string, string>)[p.type] ?? p.type}</span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-bold ${phaseColors.bg} ${phaseColors.text}`}>{(LABELS.phases as Record<string, string>)[p.currentPhase]}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-[11px] leading-tight mb-1.5">{p.title}</h4>
              {lastEntry && (
                <p className="text-[9px] text-slate-400 line-clamp-1 mb-1.5 italic">"{lastEntry.content}"</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                 <div className="flex items-center gap-1 text-[9px] text-slate-400"><Clock className="w-2.5 h-2.5" /><span>{done}/{total} {LABELS.general.steps}</span></div>
                 <span className="text-[8px] text-slate-300">{p.lastUpdated}</span>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && <div className="h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[8px] uppercase font-bold tracking-widest">{LABELS.general.empty}</div>}
      </div>
    </div>
  );
};
