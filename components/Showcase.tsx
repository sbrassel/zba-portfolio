
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Project, ApplicationLog, DossierDocument, Notification, StudentProfile, Skill, Grade, DossierSection, CompetencyData } from '../types';
import { Download, ExternalLink, FileText, Calendar, CheckCircle, XCircle, Clock, Trash2, Plus, Loader2, Star, Eye, Edit2, Save, X, Share2, Check, BrainCircuit, HeartCrack, Bell, Upload, GripVertical, FolderOpen, Send, MessageCircle, PartyPopper, Lightbulb } from 'lucide-react';
import { NotificationsPanel } from './NotificationsPanel';
import { jsPDF } from 'jspdf';
import { mergeDossier, downloadPdf } from '../pdfUtils';
import { LABELS } from '../labels';
import { PROJECT_IMAGE_BY_TYPE, COMPETENCY_DATA } from '../constants';
import { drawCompetencyRadarToCanvas } from '../competencyRadarCanvas';

interface ShowcaseProps {
  projects: Project[];
  documents: DossierDocument[];
  applications: ApplicationLog[];
  profile: StudentProfile;
  skills: Skill[];
  grades: Grade[];
  onAddApplication: (app: ApplicationLog) => void;
  onUpdateApplicationStatus: (id: string, status: ApplicationLog['status']) => void;
  onUpdateApplicationNote: (id: string, note: string) => void;
  onAddDocument: (doc: DossierDocument) => void;
  onUpdateDocument: (doc: DossierDocument) => void;
  onDeleteDocument: (id: string) => void;
  onReorderDocuments?: (orderedDocs: DossierDocument[]) => void;
  notifications: Notification[];
  isNotifOpen: boolean;
  onToggleNotif: () => void;
  onMarkAllRead: () => void;
  competencyData?: CompetencyData;
}

export const Showcase: React.FC<ShowcaseProps> = ({ 
  projects, documents, applications, profile, skills, grades,
  onAddApplication, onUpdateApplicationStatus, onUpdateApplicationNote, 
  onAddDocument, onUpdateDocument, onDeleteDocument, onReorderDocuments, 
  notifications, isNotifOpen, onToggleNotif, onMarkAllRead,
  competencyData
}) => {
  const bestOfProjects = projects.filter(p => p.status === 'completed' || p.status === 'active').slice(0, 3);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  
  // Basic modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Dossier Builder
  const [isDossierBuilderOpen, setIsDossierBuilderOpen] = useState(false);
  const [dossierSections, setDossierSections] = useState<DossierSection[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isDossierExporting, setIsDossierExporting] = useState(false);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedAppForRejection, setSelectedAppForRejection] = useState<string | null>(null);
  const [resilienceNote, setResilienceNote] = useState('');

  const [exportConfig, setExportConfig] = useState({
    cover: true,
    profile: true,
    competencies: true,
    projects: true,
    documents: false,
    applications: false
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleShareClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(LABELS.toast.linkCopied, 'success');
    } catch {
      showToast(LABELS.toast.copyFailed, 'error');
    }
  };

  // Hochgeladene PDF-Dokumente (mit pdfData); Deckblatt separat
  const uploadedPdfs = useMemo(() => documents.filter(d => d.pdfData && !d.isCover), [documents]);
  const coverDocument = useMemo(() => documents.find(d => d.isCover && d.pdfData), [documents]);

  // ========== PDF UPLOAD ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Bitte eine PDF-Datei auswählen');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newDoc: DossierDocument = {
        id: Date.now().toString(),
        title: file.name,
        type: 'pdf',
        date: new Date().toLocaleDateString('de-CH', { month: 'short', year: '2-digit' }),
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        pdfData: base64
      };
      onAddDocument(newDoc);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Bitte eine PDF-Datei auswählen');
      return;
    }
    if (coverDocument) onDeleteDocument(coverDocument.id);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newDoc: DossierDocument = {
        id: Date.now().toString(),
        title: file.name,
        type: 'pdf',
        date: new Date().toLocaleDateString('de-CH', { month: 'short', year: '2-digit' }),
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        pdfData: base64,
        isCover: true
      };
      onAddDocument(newDoc);
    };
    reader.readAsDataURL(file);
    if (coverFileInputRef.current) coverFileInputRef.current.value = '';
  };

  // ========== DOSSIER BUILDER ==========
  const openDossierBuilder = () => {
    // Initialisiere Sektionen: eigenes Deckblatt oder generiertes
    const coverSection: DossierSection = coverDocument
      ? { id: `up-cover-${coverDocument.id}`, type: 'uploaded', sectionType: 'cover', label: 'Deckblatt (eigen)', sourceId: coverDocument.id, enabled: true, order: 0 }
      : { id: 'gen-cover', type: 'generated', sectionType: 'cover', label: 'Deckblatt', enabled: true, order: 0 };

    // Dokumente in der Reihenfolge der Liste (uploadedPdfs), dann generierte Sektionen
    const initialSections: DossierSection[] = [
      coverSection,
      ...uploadedPdfs.map((d, i) => ({
        id: `up-${d.id}`,
        type: 'uploaded' as const,
        sectionType: 'uploaded' as const,
        label: d.title,
        sourceId: d.id,
        enabled: true,
        order: 1 + i,
      })),
      { id: 'gen-profile', type: 'generated', sectionType: 'profile', label: 'Profil & Kompetenzen', enabled: true, order: 20 },
      { id: 'gen-competencyRadar', type: 'generated', sectionType: 'competencyRadar', label: 'Kompetenzradar', enabled: true, order: 25 },
      { id: 'gen-projects', type: 'generated', sectionType: 'projects', label: 'Projekte', enabled: true, order: 30 },
      { id: 'gen-grades', type: 'generated', sectionType: 'grades', label: 'Noten', enabled: false, order: 40 },
    ];

    // Deduplizieren nach ID
    const uniqueSections = initialSections.filter((s, i, arr) => 
      arr.findIndex(x => x.id === s.id) === i
    );

    setDossierSections(uniqueSections.sort((a, b) => a.order - b.order));
    setSelectedProjects(projects.filter(p => p.status === 'completed').map(p => p.id));
    setIsDossierBuilderOpen(true);
  };

  // Wenn im Dossier-Builder ein Deckblatt hochgeladen/entfernt wird, erste Sektion aktualisieren
  useEffect(() => {
    if (!isDossierBuilderOpen || dossierSections.length === 0) return;
    setDossierSections(prev => {
      const rest = prev.filter(s => s.sectionType !== 'cover');
      const coverSection: DossierSection = coverDocument
        ? { id: `up-cover-${coverDocument.id}`, type: 'uploaded', sectionType: 'cover', label: 'Deckblatt (eigen)', sourceId: coverDocument.id, enabled: true, order: 0 }
        : { id: 'gen-cover', type: 'generated', sectionType: 'cover', label: 'Deckblatt', enabled: true, order: 0 };
      return [coverSection, ...rest.map((s, i) => ({ ...s, order: i + 1 }))];
    });
  }, [isDossierBuilderOpen, coverDocument?.id]);

  const toggleDossierSection = (id: string) => {
    setDossierSections(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleDragStart = (id: string) => {
    setDraggedSection(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;

    setDossierSections(prev => {
      const sections = [...prev];
      const draggedIdx = sections.findIndex(s => s.id === draggedSection);
      const targetIdx = sections.findIndex(s => s.id === targetId);
      
      if (draggedIdx === -1 || targetIdx === -1) return prev;
      
      const [dragged] = sections.splice(draggedIdx, 1);
      sections.splice(targetIdx, 0, dragged);
      
      // Update order
      return sections.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  const handleDocDragStart = (id: string) => setDraggedDocId(id);
  const handleDocDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDocDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!onReorderDocuments || !draggedDocId || draggedDocId === targetId) {
      setDraggedDocId(null);
      return;
    }
    const fromIdx = documents.findIndex((d) => d.id === draggedDocId);
    const toIdx = documents.findIndex((d) => d.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedDocId(null);
      return;
    }
    const newDocs = [...documents];
    const [removed] = newDocs.splice(fromIdx, 1);
    newDocs.splice(toIdx, 0, removed);
    onReorderDocuments(newDocs);
    setDraggedDocId(null);
  };
  const handleDocDragEnd = () => setDraggedDocId(null);

  const exportDossier = async () => {
    setIsDossierExporting(true);
    try {
      let competencyRadarImage: string | undefined;
      const hasRadarSection = dossierSections.some(s => s.enabled && s.sectionType === 'competencyRadar');
      if (hasRadarSection) {
        const size = 400;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        drawCompetencyRadarToCanvas(canvas, competencyData?.categories ?? COMPETENCY_DATA.categories);
        competencyRadarImage = canvas.toDataURL('image/png');
      }
      const pdfBytes = await mergeDossier({
        sections: dossierSections,
        documents,
        profile,
        skills,
        projects,
        grades,
        selectedProjectIds: selectedProjects,
        competencyRadarImage
      });
      
      downloadPdf(pdfBytes, `Bewerbungsdossier_${profile.name.replace(/\s+/g, '_')}.pdf`);
      
      setTimeout(() => {
        setIsDossierExporting(false);
        setIsDossierBuilderOpen(false);
      }, 500);
    } catch (error) {
      console.error('Dossier Export Fehler:', error);
      setIsDossierExporting(false);
      alert('Fehler beim Erstellen des Dossiers');
    }
  };

  // ========== SIMPLE PDF EXPORT (bestehendes Feature) ==========
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const addNewPageIfNeeded = (neededSpace: number = 30) => {
      if (y + neededSpace > 270) {
        doc.addPage();
        y = 20;
      }
    };

    if (exportConfig.cover) {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 100, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('ZBA Portfolio', margin, 50);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.text(profile.name, margin, 65);
      doc.setFontSize(12);
      doc.text(`Klasse: ${profile.class} | Profil: ${profile.zbaProfile}`, margin, 80);
      doc.setTextColor(0, 0, 0);
      y = 120;
      if (profile.bio) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        const bioLines = doc.splitTextToSize(`"${profile.bio}"`, pageWidth - 2 * margin);
        doc.text(bioLines, margin, y);
        y += bioLines.length * 6 + 10;
      }
    }

    if (exportConfig.profile) {
      addNewPageIfNeeded(60);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 10, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Mein Profil', margin, y + 3);
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      if (profile.strengths?.length) {
        doc.setFont('helvetica', 'bold');
        doc.text('Stärken:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(profile.strengths.join(', '), margin + 25, y);
        y += 8;
      }
      if (profile.interests?.length) {
        doc.setFont('helvetica', 'bold');
        doc.text('Interessen:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(profile.interests.join(', '), margin + 25, y);
        y += 8;
      }
      y += 10;
    }

    if (exportConfig.competencies && skills?.length) {
      addNewPageIfNeeded(50);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 10, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Kompetenzen', margin, y + 3);
      y += 20;
      doc.setFontSize(10);
      skills.forEach((skill) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`${skill.subject}:`, margin, y);
        const barWidth = 80;
        const barHeight = 6;
        const barX = margin + 50;
        const fillWidth = (skill.value / skill.fullMark) * barWidth;
        doc.setFillColor(226, 232, 240);
        doc.rect(barX, y - 4, barWidth, barHeight, 'F');
        doc.setFillColor(59, 130, 246);
        doc.rect(barX, y - 4, fillWidth, barHeight, 'F');
        doc.text(`${skill.value}/${skill.fullMark}`, barX + barWidth + 5, y);
        y += 12;
      });
      y += 10;
    }

    if (exportConfig.projects && projects.length) {
      addNewPageIfNeeded(40);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin - 5, y - 5, pageWidth - 2 * margin + 10, 10, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Projekte', margin, y + 3);
      y += 20;
      const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'active');
      completedProjects.forEach((project) => {
        addNewPageIfNeeded(35);
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 3, 3, 'FD');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(project.title, margin + 5, y + 8);
        const statusColors: Record<string, number[]> = {
          'completed': [34, 197, 94],
          'active': [59, 130, 246],
          'planning': [156, 163, 175],
        };
        const color = statusColors[project.status] || [156, 163, 175];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(pageWidth - margin - 25, y + 3, 20, 6, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(project.status === 'completed' ? 'Fertig' : project.status === 'active' ? 'Aktiv' : 'Planung', pageWidth - margin - 23, y + 7);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const questionText = doc.splitTextToSize(project.passionQuestion || '', pageWidth - 2 * margin - 10);
        doc.text(questionText.slice(0, 2), margin + 5, y + 16);
        const completedMilestones = project.milestones.filter(m => m.completed).length;
        doc.text(`${completedMilestones}/${project.milestones.length} Schritte`, margin + 5, y + 26);
        y += 38;
      });
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Erstellt am ${new Date().toLocaleDateString('de-CH')} | ZBA Portfolio`, margin, 285);
    doc.save(`Portfolio_${profile.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportClick = () => {
    setIsExportModalOpen(true);
    setExportSuccess(false);
  };

  const performExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        generatePDF();
        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => {
          setIsExportModalOpen(false);
          setExportSuccess(false);
        }, 1500);
      } catch (error) {
        console.error('PDF Export Fehler:', error);
        setIsExporting(false);
        alert('Fehler beim Erstellen des PDFs');
      }
    }, 500);
  };

  const toggleExportOption = (key: keyof typeof exportConfig) => {
    setExportConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const submitApplication = () => {
    if (!newCompany.trim() || !newRole.trim()) return;
    onAddApplication({
      id: Date.now().toString(),
      company: newCompany,
      role: newRole,
      status: 'sent',
      date: new Date().toLocaleDateString('de-CH'),
      note: 'Neu erstellt'
    });
    setIsAppModalOpen(false);
    setNewCompany('');
    setNewRole('');
  };

  const submitDocument = () => {
    if (!newDocTitle.trim()) return;
    onAddDocument({
      id: Date.now().toString(),
      title: newDocTitle.endsWith('.pdf') ? newDocTitle : `${newDocTitle}.pdf`,
      type: 'pdf',
      date: new Date().toLocaleDateString('de-CH', { month: 'short', year: '2-digit' }),
      size: '1.5 MB'
    });
    setIsDocModalOpen(false);
    setNewDocTitle('');
  };

  const APPLICATION_STATUSES: ApplicationLog['status'][] = ['sent', 'shortlist', 'interview', 'trial', 'offer', 'rejected'];

  const handleStatusChange = (logId: string, newStatus: ApplicationLog['status']) => {
    if (newStatus === 'rejected') {
      setSelectedAppForRejection(logId);
      setRejectionModalOpen(true);
      setResilienceNote('');
    } else {
      onUpdateApplicationStatus(logId, newStatus);
    }
  };

  const submitRejectionAnalysis = () => {
    if (selectedAppForRejection) {
      onUpdateApplicationStatus(selectedAppForRejection, 'rejected');
      onUpdateApplicationNote(selectedAppForRejection, resilienceNote ? `Resilienz-Check: ${resilienceNote}` : 'Keine Analyse.');
      setRejectionModalOpen(false);
      setSelectedAppForRejection(null);
      setResilienceNote('');
    }
  };

  const startEditingNote = (log: ApplicationLog) => {
    setEditingNoteId(log.id);
    setTempNote(log.note || '');
  };

  const saveNote = (id: string) => {
    onUpdateApplicationNote(id, tempNote);
    setEditingNoteId(null);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setTempNote('');
  };

  return (
    <div className="animate-fade-in pb-12 relative">
      <NotificationsPanel
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={onToggleNotif}
        onMarkAllRead={onMarkAllRead}
      />

      {/* Toast für Copy-to-Clipboard */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : null}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="application/pdf" 
        className="hidden" 
      />

      {/* Header */}
      <div className="bg-white rounded-2xl p-8 md:p-12 mb-10 border border-slate-200 shadow-sm relative overflow-visible">
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-['Space_Grotesk'] mb-2 tracking-tight">Showcase</h2>
            <p className="text-slate-500 max-w-xl text-lg font-medium">Dein professioneller Auftritt für die Berufswelt.</p>
          </div>
          <div className="flex flex-wrap gap-3 relative">
            <button onClick={onToggleNotif} className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all relative shadow-sm group">
              <Bell size={18} className="group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>}
            </button>
            <button 
              onClick={handleShareClick}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-lg font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2 shadow-sm text-sm"
              aria-label="Link kopieren"
            >
              <Share2 className="w-4 h-4" /> Teilen
            </button>
            <button 
              onClick={handleExportClick}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-lg font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2 shadow-sm text-sm"
            >
              <Download className="w-4 h-4" /> Portfolio
            </button>
            <button 
              onClick={openDossierBuilder}
              className="bg-slate-900 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm text-sm"
            >
              <FolderOpen className="w-4 h-4" /> Bewerbungsdossier
            </button>
          </div>
        </div>
      </div>

      {/* Top Projekte */}
      <div className="mb-12">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 px-1 border-b border-slate-200 pb-2">Top Projekte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestOfProjects.map((project) => {
            const imgUrl = PROJECT_IMAGE_BY_TYPE[project.type];
            return (
            <div key={project.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img 
                  src={imgUrl} 
                  alt={project.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="p-6">
                <h4 className="font-bold text-lg text-slate-900 font-['Space_Grotesk'] mb-2 leading-tight">{project.title}</h4>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{project.passionQuestion}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{project.type}</span>
                  <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all border border-slate-100"><ExternalLink className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Bewerbungsdossier & Lehrstellen-Check */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bewerbungsdossier */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600"><FileText className="w-4 h-4" /></div>
              <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">{LABELS.tiles.documents}</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-8 h-8 flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title="PDF hochladen"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsDocModalOpen(true)} 
                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600 transition-colors"
                title="Platzhalter hinzufügen"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Lade PDFs hoch (Lebenslauf, Zeugnis, etc.)</p>
              </div>
            ) : (
              documents.map((item) => (
                <div
                  key={item.id}
                  draggable={!!onReorderDocuments}
                  onDragStart={() => handleDocDragStart(item.id)}
                  onDragOver={handleDocDragOver}
                  onDrop={(e) => handleDocDrop(e, item.id)}
                  onDragEnd={handleDocDragEnd}
                  className={`group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-400 transition-all ${onReorderDocuments ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${draggedDocId === item.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {onReorderDocuments && (
                      <div className="text-slate-300 group-hover:text-slate-500 shrink-0" aria-hidden>
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${item.pdfData ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'} group-hover:text-blue-600 transition-colors`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.size}
                        {item.pdfData && <span className="ml-2 text-blue-600">PDF</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono uppercase hidden sm:block">{item.date}</span>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteDocument(item.id); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
            {onReorderDocuments && documents.length > 1 && (
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <GripVertical className="w-3 h-3" /> Reihenfolge im Bewerbungsdossier per Ziehen anpassen
              </p>
            )}
          </div>
        </div>

        {/* Lehrstellen-Check */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-50 rounded flex items-center justify-center text-purple-600"><Calendar className="w-4 h-4" /></div>
            <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">{LABELS.tiles.applications}</h3>
          </div>
          <div className="space-y-6">
            {applications.map((log) => (
              <div key={log.id} className="relative pl-6 border-l border-slate-200 last:border-0 pb-2">
                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${log.status === 'rejected' ? 'bg-red-400' : log.status === 'offer' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{log.company}</h4>
                  <select
                    value={log.status}
                    onChange={(e) => handleStatusChange(log.id, e.target.value as ApplicationLog['status'])}
                    className="text-[10px] font-bold uppercase rounded border bg-white px-2 py-1 pr-7 cursor-pointer appearance-none bg-no-repeat bg-right focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-0"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundSize: '10px',
                      backgroundPosition: 'right 4px center'
                    }}
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>{(LABELS.applicationStatus as Record<string, string>)[s] ?? s}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500 mb-2">{log.role}</p>
                {log.status === 'rejected' ? (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2 flex gap-3">
                    <HeartCrack className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-1">{LABELS.resilience.logTitle}</p>
                      <p className="text-xs text-red-800 leading-tight italic">"{log.note?.replace('Resilienz-Check: ', '')}"</p>
                    </div>
                  </div>
                ) : (
                  editingNoteId === log.id ? (
                    <div className="bg-slate-50 p-2 rounded border border-blue-200">
                      <input value={tempNote} onChange={(e) => setTempNote(e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs mb-2 outline-none focus:border-blue-500" autoFocus />
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelEditNote} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                        <button onClick={() => saveNote(log.id)} className="text-green-600 hover:text-green-700"><Save className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="group/note bg-slate-50 p-2 rounded text-xs text-slate-500 font-mono border border-slate-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                      <span className="line-clamp-2">{log.note || 'Keine Bemerkung'}</span>
                      <button onClick={() => startEditingNote(log)} className="text-slate-300 hover:text-blue-500 opacity-0 group-hover/note:opacity-100 transition-opacity"><Edit2 className="w-3 h-3" /></button>
                    </div>
                  )
                )}
              </div>
            ))}
            <button onClick={() => setIsAppModalOpen(true)} className="w-full py-3 mt-4 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 uppercase tracking-widest hover:text-blue-600 hover:border-blue-400 transition-colors font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Neue Lehrstelle</button>
          </div>
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Dossier Builder Modal */}
      {isDossierBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl font-['Space_Grotesk'] text-slate-900">Bewerbungsdossier erstellen</h3>
                <p className="text-xs text-slate-500 mt-1">Wähle Inhalte aus und ordne sie per Drag & Drop</p>
              </div>
              <button onClick={() => setIsDossierBuilderOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Eigenes Deckblatt hochladen */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Eigenes Deckblatt</h4>
                {coverDocument ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm font-medium text-slate-900 truncate">{coverDocument.title}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <input ref={coverFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleCoverUpload} />
                      <button type="button" onClick={() => coverFileInputRef.current?.click()} className="text-xs font-bold text-blue-600 hover:text-blue-700">Ersetzen</button>
                      <button type="button" onClick={() => onDeleteDocument(coverDocument.id)} className="text-xs font-bold text-slate-500 hover:text-red-600">Entfernen</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input ref={coverFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleCoverUpload} />
                    <button type="button" onClick={() => coverFileInputRef.current?.click()} className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> Deckblatt-PDF hochladen
                    </button>
                  </>
                )}
                <p className="text-xs text-slate-400 mt-2">Optional. Ohne Upload wird ein Deckblatt aus deinem Profil erzeugt.</p>
              </div>

              {/* Sektionen-Liste mit Drag & Drop */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Reihenfolge & Auswahl</h4>
                <div className="space-y-2">
                  {dossierSections.map((section) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-move transition-all ${
                        section.enabled 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-slate-200 bg-white'
                      } ${draggedSection === section.id ? 'opacity-50 scale-95' : ''}`}
                    >
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      <button
                        onClick={() => toggleDossierSection(section.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          section.enabled 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {section.enabled && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${section.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                          {section.label}
                        </span>
                        <span className={`ml-2 text-[10px] uppercase ${section.type === 'uploaded' ? 'text-blue-600' : 'text-slate-400'}`}>
                          {section.type === 'uploaded' ? 'PDF' : 'Generiert'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projekt-Auswahl (wenn Projekte aktiviert) */}
              {dossierSections.find(s => s.sectionType === 'projects' && s.enabled) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Projekte auswählen</h4>
                  <div className="space-y-2">
                    {projects.filter(p => p.status === 'completed' || p.status === 'active').map((project) => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProjects(prev => 
                          prev.includes(project.id) 
                            ? prev.filter(id => id !== project.id)
                            : [...prev, project.id]
                        )}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedProjects.includes(project.id)
                            ? 'border-green-200 bg-green-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          selectedProjects.includes(project.id)
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-white border-slate-300'
                        }`}>
                          {selectedProjects.includes(project.id) && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-900">{project.title}</span>
                          <span className={`ml-2 text-[10px] uppercase ${project.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                            {project.status === 'completed' ? 'Fertig' : 'Aktiv'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hinweis wenn keine PDFs */}
              {uploadedPdfs.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-bold mb-1">Tipp: Lade PDFs hoch!</p>
                  <p className="text-xs">Für ein vollständiges Dossier lade Lebenslauf, Motivationsschreiben und Zeugnisse als PDF hoch.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-white">
              <div className="text-xs text-slate-500">
                {dossierSections.filter(s => s.enabled).length} Sektionen ausgewählt
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDossierBuilderOpen(false)} 
                  className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={exportDossier}
                  disabled={isDossierExporting || dossierSections.filter(s => s.enabled).length === 0}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDossierExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isDossierExporting ? 'Erstelle...' : 'Dossier exportieren'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resilienz Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-red-50 border-b border-red-100 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3 mx-auto"><BrainCircuit className="w-6 h-6" /></div>
              <h3 className="font-bold text-lg text-red-900 font-['Space_Grotesk']">{LABELS.resilience.title}</h3>
              <p className="text-xs text-red-700 mt-1">{LABELS.resilience.subtitle}</p>
            </div>
            <div className="p-6 space-y-4">
              <textarea value={resilienceNote} onChange={(e) => setResilienceNote(e.target.value)} placeholder="Woran lag es? Was kannst du nächstes Mal besser machen?" className="w-full h-24 bg-slate-50 border border-slate-200 rounded p-3 text-sm outline-none focus:border-red-500 resize-none" />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => setRejectionModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700">Abbrechen</button>
              <button onClick={submitRejectionAnalysis} disabled={!resilienceNote.trim()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50">Loggen</button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg font-['Space_Grotesk'] text-slate-900">Portfolio-Übersicht (PDF)</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              {['profile', 'competencies', 'projects'].map((opt) => (
                <div key={opt} onClick={() => toggleExportOption(opt as any)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${exportConfig[opt as keyof typeof exportConfig] ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${exportConfig[opt as keyof typeof exportConfig] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>{exportConfig[opt as keyof typeof exportConfig] && <Check className="w-3 h-3" />}</div>
                    <span className="font-bold text-sm text-slate-900 capitalize">{opt === 'competencies' ? 'Kompetenzen' : opt === 'profile' ? 'Profil' : 'Projekte'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
              {exportSuccess ? (
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Check className="w-4 h-4" /> PDF fertig!</button>
              ) : (
                <button onClick={performExport} className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isExporting ? 'Erstelle...' : 'Download PDF'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* App Modal */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Neue Lehrstelle</h3>
            <input value={newCompany} onChange={e => setNewCompany(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-3 mb-3 text-sm outline-none focus:border-blue-500" placeholder="Firma" />
            <input value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-3 mb-6 text-sm outline-none focus:border-blue-500" placeholder="Beruf" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAppModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 font-bold">Abbrechen</button>
              <button onClick={submitApplication} className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-bold">Hinzufügen</button>
            </div>
          </div>
        </div>
      )}

      {/* Doc Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Platzhalter-Dokument</h3>
            <p className="text-xs text-slate-500 mb-4">Für echte PDFs nutze den Upload-Button.</p>
            <input value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-3 mb-6 text-sm outline-none focus:border-blue-500" placeholder="Name (z.B. Lebenslauf)" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsDocModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 font-bold">Abbrechen</button>
              <button onClick={submitDocument} className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-bold">Hinzufügen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
