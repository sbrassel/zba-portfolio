
import React, { useState } from 'react';
import { Project, ProjectType, ProjectResource, DiaryEntry, Notification } from '../types';
import { Plus, Book, LayoutTemplate, ArrowLeft, CheckCircle2, Clock, Wrench, FileText, Download, ExternalLink, X, Trash2, Bell, Star, Footprints, Link } from 'lucide-react';
import { INITIAL_RESOURCES } from '../constants';
import { NotificationsPanel } from './NotificationsPanel';
import { LABELS } from '../labels';

interface WorkshopProps {
  projects: Project[];
  onUpdateStatus: (id: string, status: Project['status']) => void;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  mainProjectId?: string;
  onSetMainProject: (id: string) => void;
  notifications: Notification[];
  isNotifOpen: boolean;
  onToggleNotif: () => void;
  onMarkAllRead: () => void;
}

export const Workshop: React.FC<WorkshopProps> = ({ projects, onUpdateStatus, onAddProject, onUpdateProject, mainProjectId, onSetMainProject, notifications, isNotifOpen, onToggleNotif, onMarkAllRead }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'diary'>('canvas');
  const [viewMode, setViewMode] = useState<'board' | 'toolbox'>('board');
  const [isDragging, setIsDragging] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectQuestion, setNewProjectQuestion] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('passion');

  const [newSubject, setNewSubject] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<ProjectResource['type']>('link');
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [newMilestoneWeek, setNewMilestoneWeek] = useState(1);

  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryPhase, setNewEntryPhase] = useState<DiaryEntry['phase']>('Umsetzung');

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

  const handleToggleMilestone = (index: number) => {
    if (!selectedProject) return;
    const updatedMilestones = [...selectedProject.milestones];
    updatedMilestones[index].completed = !updatedMilestones[index].completed;
    onUpdateProject({ ...selectedProject, milestones: updatedMilestones });
  };

  const handleAddMilestone = () => {
    if (!selectedProject || !newMilestoneText.trim()) return;
    onUpdateProject({ ...selectedProject, milestones: [...selectedProject.milestones, { week: newMilestoneWeek, text: newMilestoneText, completed: false }] });
    setNewMilestoneText('');
  };

  const submitNewEntry = () => {
      if (!selectedProject || !newEntryContent.trim()) return;
      const newEntry: DiaryEntry = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('de-CH'),
          content: newEntryContent,
          phase: newEntryPhase
      };
      onUpdateProject({ ...selectedProject, entries: [newEntry, ...selectedProject.entries] });
      setIsNewEntryModalOpen(false);
      setNewEntryContent('');
  };

  const getCategoryBadgeStyle = (type: ProjectType) => {
      switch (type) {
          case 'passion': return 'bg-indigo-100 text-indigo-700';
          case 'mini': return 'bg-orange-100 text-orange-700';
          case 'trial': return 'bg-blue-100 text-blue-700';
          case 'application': return 'bg-pink-100 text-pink-700';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  if (selectedProject) {
    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => { setSelectedProjectId(null); setViewMode('board'); }} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-bold text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm hover:border-blue-200 group">
            <ArrowLeft className="w-3.5 h-3.5" /> {LABELS.project.board}
          </button>
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
        </div>
        
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button onClick={() => setActiveTab('canvas')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'canvas' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-800'}`}>
                <LayoutTemplate className="w-3.5 h-3.5" /> {LABELS.project.projectCanvas}
              </button>
              <button onClick={() => setActiveTab('diary')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'diary' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-800'}`}>
                <Book className="w-3.5 h-3.5" /> {LABELS.diary.title}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {activeTab === 'canvas' ? (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="border-l-3 border-slate-200 pl-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase mb-2 ${getCategoryBadgeStyle(selectedProject.type)}`}>
                      {LABELS.project.phasePlanning}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] mb-1">{selectedProject.title}</h2>
                    <p className="text-sm text-slate-600 leading-relaxed italic border-l-3 border-blue-200 pl-3">"{selectedProject.passionQuestion}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Fächer</h3>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                           {selectedProject.subjects.map(s => (
                             <span key={s} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-[10px] font-medium text-slate-700 flex items-center gap-1.5 shadow-sm">
                               {s} <button onClick={() => handleRemoveSubject(s)}><X className="w-2.5 h-2.5" /></button>
                             </span>
                           ))}
                        </div>
                        <div className="flex gap-1.5">
                            <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Add..." className="bg-white border border-slate-200 text-[10px] p-1.5 rounded flex-1 outline-none" />
                            <button onClick={handleAddSubject} className="bg-slate-200 p-1.5 rounded"><Plus className="w-3.5 h-3.5"/></button>
                        </div>
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
                            <p className="text-[10px] text-slate-400 italic">Keine Ressourcen. Unten hinzufügen.</p>
                          )}
                        </div>
                        <div className="border-t border-slate-200 pt-2 space-y-1.5">
                          <input
                            value={newResourceTitle}
                            onChange={(e) => setNewResourceTitle(e.target.value)}
                            placeholder="Titel"
                            className="w-full bg-white border border-slate-200 text-[10px] p-1.5 rounded outline-none focus:border-blue-400"
                          />
                          <select
                            value={newResourceType}
                            onChange={(e) => setNewResourceType(e.target.value as ProjectResource['type'])}
                            className="w-full bg-white border border-slate-200 text-[10px] p-1.5 rounded outline-none"
                          >
                            <option value="link">Link</option>
                            <option value="pdf">PDF</option>
                            <option value="note">Notiz</option>
                          </select>
                          {(newResourceType === 'link' || newResourceType === 'pdf') && (
                            <input
                              value={newResourceUrl}
                              onChange={(e) => setNewResourceUrl(e.target.value)}
                              placeholder="https://..."
                              type="url"
                              className="w-full bg-white border border-slate-200 text-[10px] p-1.5 rounded outline-none focus:border-blue-400"
                            />
                          )}
                          <button
                            onClick={handleAddResource}
                            disabled={!newResourceTitle.trim() || ((newResourceType === 'link' || newResourceType === 'pdf') && !newResourceUrl.trim())}
                            className="w-full text-[9px] bg-slate-900 text-white py-1.5 rounded font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Ressource hinzufügen
                          </button>
                        </div>
                     </div>
                  </div>
                    
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                     <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Footprints size={10} /> {LABELS.milestones.title}</h3>
                     </div>
                     <div className="divide-y divide-slate-100">
                        {selectedProject.milestones.map((m, idx) => (
                           <div key={idx} onClick={() => handleToggleMilestone(idx)} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'}`}>{m.completed && <CheckCircle2 className="w-3 h-3" />}</div>
                              <p className={`text-[11px] flex-1 ${m.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{m.text}</p>
                              <span className="text-[9px] font-mono text-slate-400">KW {m.week}</span>
                           </div>
                        ))}
                     </div>
                     <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
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
                          min="1"
                          max="52"
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] focus:border-blue-500 outline-none text-center"
                          placeholder="KW"
                        />
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
              ) : (
                <div className="max-w-xl mx-auto space-y-6">
                   <div className="flex justify-between items-center"><h3 className="text-lg font-bold font-['Space_Grotesk']">{LABELS.project.process}</h3><button onClick={() => setIsNewEntryModalOpen(true)} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">{LABELS.diary.newEntry}</button></div>
                   <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                      {selectedProject.entries.map((entry) => (
                         <div key={entry.id} className="relative pl-8">
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div></div>
                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                               <span className="text-[8px] font-bold uppercase text-slate-400 mb-0.5 block">{(LABELS.phases as Record<string, string>)[entry.phase] ?? entry.phase} • {entry.date}</span>
                               <p className="text-slate-600 text-[11px] leading-relaxed">{entry.content}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      <NotificationsPanel
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={onToggleNotif}
        onMarkAllRead={onMarkAllRead}
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
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {INITIAL_RESOURCES.length} {LABELS.general.entries}
            </span>
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {r.category} • {r.type}
                    </p>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <button
                      className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-white transition-colors flex items-center justify-center cursor-not-allowed opacity-75"
                      aria-label="Öffnen (Demo)"
                      title={LABELS.project.toolboxDemoHint}
                    >
                      {r.type === 'pdf' ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 h-full min-w-[800px]">
            <KanbanColumn title={LABELS.projectColumns.ideas} status="planning" projects={projects.filter(p => p.status === 'planning')} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onSelectProject={setSelectedProjectId} color="border-t-slate-300" getBadgeStyle={getCategoryBadgeStyle} />
            <KanbanColumn title={LABELS.projectColumns.active} status="active" projects={projects.filter(p => p.status === 'active')} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onSelectProject={setSelectedProjectId} color="border-t-blue-500" getBadgeStyle={getCategoryBadgeStyle} />
            <KanbanColumn title={LABELS.projectColumns.done} status="completed" projects={projects.filter(p => p.status === 'completed')} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onSelectProject={setSelectedProjectId} color="border-t-green-500" getBadgeStyle={getCategoryBadgeStyle} />
          </div>
        </div>
      )}

      {/* Modal: Neues Projekt */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">{LABELS.project.newProject}</h3>
                  <p className="text-xs text-slate-500">{LABELS.project.newProjectDesc}</p>
                </div>
              </div>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400" aria-label="Schliessen">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Titel</label>
                <input
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="z.B. Passion Project: Website"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Leitfrage</label>
                <textarea
                  value={newProjectQuestion}
                  onChange={(e) => setNewProjectQuestion(e.target.value)}
                  placeholder="Was ist die zentrale Frage deines Projekts?"
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Typ</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['passion', 'mini', 'exam'] as ProjectType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewProjectType(type)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        newProjectType === type
                          ? `${getCategoryBadgeStyle(type)} border-current`
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'passion' ? LABELS.projectTypes.passion : type === 'mini' ? LABELS.projectTypes.mini : LABELS.projectTypes.exam}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={submitNewProject}
                disabled={!newProjectTitle.trim() || !newProjectQuestion.trim()}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Neuer Tagebucheintrag */}
      {isNewEntryModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">Tagebucheintrag</h3>
                  <p className="text-xs text-slate-500">{selectedProject.title}</p>
                </div>
              </div>
              <button onClick={() => setIsNewEntryModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Phase</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Recherche', 'Prototyping', 'Umsetzung', 'Abschluss'] as DiaryEntry['phase'][]).map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setNewEntryPhase(phase)}
                      className={`py-2 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                        newEntryPhase === phase
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {(LABELS.phases as Record<string, string>)[phase] ?? phase}
                    </button>
                  ))}
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
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsNewEntryModalOpen(false)}
                className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={submitNewEntry}
                disabled={!newEntryContent.trim()}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KanbanColumn: React.FC<any> = ({ title, status, projects, onDragStart, onDragOver, onDrop, onSelectProject, color, getBadgeStyle }) => {
  return (
    <div className="flex-1 bg-slate-100/50 rounded-xl flex flex-col border border-slate-200" onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
      <div className={`p-3 border-b border-slate-200 bg-white rounded-t-xl border-t-3 ${color} flex justify-between items-center`}>
        <h3 className="font-bold text-xs text-slate-900">{title}</h3>
        <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold">{projects.length}</span>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        {projects.map((p: any) => (
          <div key={p.id} draggable onDragStart={(e) => onDragStart(e, p.id)} onClick={() => onSelectProject(p.id)} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all group relative">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-bold uppercase mb-1.5 ${getBadgeStyle(p.type)}`}>{(LABELS.projectTypes as Record<string, string>)[p.type] ?? p.type}</span>
            <h4 className="font-bold text-slate-900 text-[11px] leading-tight mb-2">{p.title}</h4>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
               <div className="flex items-center gap-1 text-[9px] text-slate-400"><Clock className="w-2.5 h-2.5" /><span>KW {p.milestones.length}</span></div>
               {p.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
            </div>
          </div>
        ))}
        {projects.length === 0 && <div className="h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[8px] uppercase font-bold tracking-widest">{LABELS.general.empty}</div>}
      </div>
    </div>
  );
};
