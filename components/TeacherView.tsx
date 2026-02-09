
import React, { useMemo, useState } from 'react';
import { StudentRecord, Notification, Sector, TeacherNotification } from '../types';
import { Bell, Search, BarChart3, Clock, CheckCircle2, AlertCircle, Send, UserCheck, Smartphone, MoreHorizontal, ArrowUpRight, MessageSquare, Calendar, Users, User, X, Zap, TrendingDown, Activity, Heart, CheckSquare, Smile, Download } from 'lucide-react';
import { LABELS } from '../labels';

interface TeacherViewProps {
  students: StudentRecord[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onSendNotification: (notification: Notification) => void;
  onNavigate: (sector: Sector) => void;
  onResetDemo: () => void;
  onStartFresh?: (count: number) => void;
  teacherNotifications?: TeacherNotification[];
  onMarkTeacherNotificationRead?: (id: string) => void;
  onMarkAllTeacherNotificationsRead?: () => void;
}

// Typen für Student-Metriken
type StudentStatus = 'green' | 'yellow' | 'red';

interface StudentMetrics {
  student: StudentRecord;
  moodAvg: number;
  habitsDone: number;
  activeProjects: number;
  totalProjects: number;
  status: StudentStatus;
  statusPriority: number; // für Sortierung: rot=0, gelb=1, grün=2
}

// Berechnet Metriken für einen Schüler
function calculateStudentMetrics(student: StudentRecord): StudentMetrics {
  const profile = student.profile;
  const projects = student.projects;
  
  // Mood-Durchschnitt (nur Tage mit Einträgen)
  const validMoods = profile.mood?.filter(m => m > 0) || [];
  const moodAvg = validMoods.length > 0 
    ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length 
    : 0;
  
  // Habits
  const habitsDone = profile.weeklyHabits?.filter(h => h).length || 0;
  
  // Projekte
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalProjects = projects.length;
  
  // Status berechnen
  let status: StudentStatus = 'green';
  let statusPriority = 2;
  
  if (moodAvg > 0 && moodAvg < 2 || (totalProjects > 0 && activeProjects === 0)) {
    status = 'red';
    statusPriority = 0;
  } else if (moodAvg > 0 && moodAvg < 3 || habitsDone < 3) {
    status = 'yellow';
    statusPriority = 1;
  }
  
  return {
    student,
    moodAvg,
    habitsDone,
    activeProjects,
    totalProjects,
    status,
    statusPriority,
  };
}

// Schnellnachrichten-Vorlagen
const QUICK_MESSAGES = [
  { text: 'Gut gemacht! Weiter so.', type: 'success' as const },
  { text: 'Bitte melde dich bei mir.', type: 'alert' as const },
  { text: 'Wie geht es dir?', type: 'info' as const },
  { text: 'Denk an dein Projekt!', type: 'improve' as const },
];

export const TeacherView: React.FC<TeacherViewProps> = ({ students, selectedStudentId, onSelectStudent, onSendNotification, onNavigate, onResetDemo, onStartFresh, teacherNotifications = [], onMarkTeacherNotificationRead, onMarkAllTeacherNotificationsRead }) => {
  // View Mode: Dashboard oder Detail
  const [viewMode, setViewMode] = useState<'dashboard' | 'detail'>('dashboard');
  
  // Für Detail-Ansicht
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'alert' | 'success' | 'improve'>('info');
  const [isMessageSent, setIsMessageSent] = useState(false);
  
  // Für Dashboard
  const [sortBy, setSortBy] = useState<'attention' | 'name' | 'projects'>('attention');
  const [quickMessageStudentId, setQuickMessageStudentId] = useState<string | null>(null);
  const [teacherNotifOpen, setTeacherNotifOpen] = useState(false);
  
  const unreadTeacherCount = teacherNotifications.filter((n) => !n.read).length;

  // Metriken für alle Schüler berechnen
  const studentsWithMetrics = useMemo(() => {
    return students.map(calculateStudentMetrics);
  }, [students]);

  // Sortierte Schülerliste
  const sortedStudents = useMemo(() => {
    const sorted = [...studentsWithMetrics];
    switch (sortBy) {
      case 'attention':
        return sorted.sort((a, b) => a.statusPriority - b.statusPriority);
      case 'name':
        return sorted.sort((a, b) => a.student.profile.name.localeCompare(b.student.profile.name));
      case 'projects':
        return sorted.sort((a, b) => b.activeProjects - a.activeProjects);
      default:
        return sorted;
    }
  }, [studentsWithMetrics, sortBy]);

  // Statistiken für Header
  const classStats = useMemo(() => {
    const redCount = studentsWithMetrics.filter(s => s.status === 'red').length;
    const yellowCount = studentsWithMetrics.filter(s => s.status === 'yellow').length;
    const greenCount = studentsWithMetrics.filter(s => s.status === 'green').length;
    const avgMood = studentsWithMetrics.filter(s => s.moodAvg > 0).reduce((a, b) => a + b.moodAvg, 0) / studentsWithMetrics.filter(s => s.moodAvg > 0).length || 0;
    return { redCount, yellowCount, greenCount, avgMood, total: students.length };
  }, [studentsWithMetrics, students.length]);

  // CSV-Export der Klassen-Übersicht
  const exportAsCSV = () => {
    const header = ['Name', 'Status', 'Stimmung (Ø)', 'Aktive Projekte', 'Projekte Total', 'Noten (Ø)', 'Habits'];
    const rows = sortedStudents.map(m => {
      const gradeAvg = m.student.grades.length > 0 ? (m.student.grades.reduce((a, g) => a + g.value, 0) / m.student.grades.length).toFixed(2) : '-';
      return [
        m.student.profile.name,
        m.status,
        m.moodAvg > 0 ? m.moodAvg.toFixed(1) : '-',
        m.activeProjects.toString(),
        m.totalProjects.toString(),
        gradeAvg,
        m.habitsDone.toString(),
      ];
    });
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klassen-fortschritt_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF-Export der Klassen-Übersicht
  const exportAsPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Klassen-Fortschritt', 14, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-CH')}`, 14, 27);

    const headers = ['Name', 'Status', 'Stimmung', 'Aktive', 'Total', 'Noten (Ø)', 'Habits'];
    const colWidths = [50, 20, 25, 20, 20, 25, 20];
    let y = 38;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    headers.forEach((h, i) => {
      const x = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x, y);
    });
    y += 6;
    doc.setDrawColor(200);
    doc.line(14, y - 3, 280, y - 3);

    doc.setFont('helvetica', 'normal');
    sortedStudents.forEach(m => {
      if (y > 190) { doc.addPage(); y = 20; }
      const gradeAvg = m.student.grades.length > 0 ? (m.student.grades.reduce((a, g) => a + g.value, 0) / m.student.grades.length).toFixed(2) : '-';
      const row = [m.student.profile.name, m.status === 'green' ? 'OK' : m.status === 'yellow' ? 'Achtung' : 'Kritisch', m.moodAvg > 0 ? m.moodAvg.toFixed(1) : '-', m.activeProjects.toString(), m.totalProjects.toString(), gradeAvg, m.habitsDone.toString()];
      row.forEach((val, i) => {
        const x = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(val, x, y);
      });
      y += 5;
    });

    doc.save(`klassen-fortschritt_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Detail-Ansicht: Ausgewählter Schüler
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );
  const profile = selectedStudent.profile;
  const projects = selectedStudent.projects;
  const activeProjects = projects.filter(p => p.status === 'active');
  
  const moodAvg = profile.mood && profile.mood.length > 0 
    ? (profile.mood.filter(m => m > 0).reduce((a, b) => a + b, 0) / profile.mood.filter(m => m > 0).length).toFixed(1) 
    : 'N/A';
  const habitsDone = profile.weeklyHabits ? profile.weeklyHabits.filter(h => h).length : 0;

  const handleSend = () => {
    if (!messageText.trim()) return;
    const newNotification: Notification = {
        id: Date.now().toString(),
        title: 'Nachricht von Lehrperson',
        message: messageText,
        date: 'Jetzt',
        read: false,
        type: messageType
    };
    onSendNotification(newNotification);
    setIsMessageSent(true);
    setTimeout(() => {
        setIsMessageSent(false);
        setMessageText('');
    }, 2000);
  };

  // Schnellnachricht senden
  const handleQuickMessage = (studentId: string, message: string, type: 'info' | 'alert' | 'success' | 'improve') => {
    // Schüler auswählen, dann Nachricht senden
    onSelectStudent(studentId);
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: 'Nachricht von Lehrperson',
      message: message,
      date: 'Jetzt',
      read: false,
      type: type
    };
    onSendNotification(newNotification);
    setQuickMessageStudentId(null);
  };

  // Status-Badge Komponente
  const StatusBadge: React.FC<{ status: StudentStatus }> = ({ status }) => {
    const config: Record<StudentStatus, { bg: string; text: string; border: string; label: string }> = {
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: LABELS.studentStatus.green },
      yellow: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: LABELS.studentStatus.yellow },
      red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: LABELS.studentStatus.red },
    };
    const c = config[status] ?? config.green;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.bg} ${c.text} border ${c.border}`}>
        {c.label}
      </span>
    );
  };

  // Student Card für Dashboard
  const StudentCard: React.FC<{ metrics: StudentMetrics }> = ({ metrics }) => {
    const { student, moodAvg, habitsDone, activeProjects, totalProjects, status } = metrics;
    const isQuickMessageOpen = quickMessageStudentId === student.id;
    
    const statusColors = {
      green: 'border-l-green-500',
      yellow: 'border-l-amber-500',
      red: 'border-l-red-500',
    };

    return (
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${statusColors[status]} hover:shadow-md transition-all relative`}>
        {/* Quick Message Overlay */}
        {isQuickMessageOpen && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-4 flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-900">Schnellnachricht</h4>
              <button onClick={() => setQuickMessageStudentId(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-3 h-3" /></button>
            </div>
            <div className="flex-1 space-y-2">
              {QUICK_MESSAGES.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickMessage(student.id, msg.text, msg.type)}
                  className="w-full text-left p-2 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 transition-colors"
                >
                  {msg.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                {student.profile.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{student.profile.name}</h3>
                <p className="text-[10px] text-slate-400 truncate">{student.profile.class}</p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Metrics */}
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="text-sm font-bold text-slate-900">{moodAvg > 0 ? moodAvg.toFixed(1) : '–'}</div>
            <div className="text-[8px] text-slate-400 uppercase tracking-wider">{LABELS.metrics.mood}</div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="text-sm font-bold text-slate-900">{habitsDone}/5</div>
            <div className="text-[8px] text-slate-400 uppercase tracking-wider">{LABELS.metrics.habits}</div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <div className="text-sm font-bold text-slate-900">{activeProjects}</div>
            <div className="text-[8px] text-slate-400 uppercase tracking-wider">{LABELS.metrics.active}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => setQuickMessageStudentId(student.id)}
            className="flex-1 py-2 px-3 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-3 h-3" /> Nachricht
          </button>
          <button
            onClick={() => { onSelectStudent(student.id); setViewMode('detail'); }}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            <User className="w-3 h-3" /> Details
          </button>
        </div>
      </div>
    );
  };

  // ========== DASHBOARD VIEW ==========
  if (viewMode === 'dashboard') {
    return (
      <div className="animate-fade-in pb-12">
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 mb-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Users className="w-64 h-64 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded shadow-sm">
                  {LABELS.teacher.dashboard}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-white/10 px-2 py-1 rounded border border-white/10">
                  <UserCheck className="w-3 h-3 text-green-400" />
                  {classStats.total} Schüler
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] tracking-tight mb-2">
                Klassenübersicht
              </h1>
              <p className="text-slate-400 text-sm flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  {classStats.redCount} {LABELS.studentStatus.red}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {classStats.yellowCount} {LABELS.studentStatus.yellow}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {classStats.greenCount} {LABELS.studentStatus.green}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold font-['Space_Grotesk']">{classStats.avgMood > 0 ? classStats.avgMood.toFixed(1) : '–'}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Ø {LABELS.metrics.mood}</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-['Space_Grotesk']">{classStats.total}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Schüler</div>
                </div>
              </div>
              
              {teacherNotifications.length > 0 && (
                <button
                  onClick={() => { setTeacherNotifOpen(!teacherNotifOpen); setViewMode('detail'); }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 relative"
                >
                  <Bell className="w-4 h-4" /> Stimmungs-Nachrichten
                  {unreadTeacherCount > 0 && (
                    <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadTeacherCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setViewMode('detail')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" /> Einzelansicht
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sortieren:</span>
            <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setSortBy('attention')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${sortBy === 'attention' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <AlertCircle className="w-3 h-3 inline mr-1" /> Aufmerksamkeit
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${sortBy === 'name' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortBy('projects')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${sortBy === 'projects' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Projekte
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportAsCSV}
              className="text-[10px] font-bold uppercase tracking-widest text-green-600 hover:text-green-700 px-3 py-2 rounded-lg hover:bg-green-50 border border-green-200 flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button
              onClick={exportAsPDF}
              className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 border border-red-200 flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
            <button
              onClick={onResetDemo}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 border border-slate-200"
            >
              Demo Reset
            </button>
            {onStartFresh && (
              <button
                onClick={() => onStartFresh(5)}
                className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 border border-blue-200"
              >
                Neu (5 Schüler)
              </button>
            )}
          </div>
        </div>

        {/* Student Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStudents.map((metrics) => (
            <StudentCard key={metrics.student.id} metrics={metrics} />
          ))}
        </div>
      </div>
    );
  }

  // ========== DETAIL VIEW ==========
  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <BarChart3 className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded shadow-sm">
                Einzelansicht
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-white/10 px-2 py-1 rounded border border-white/10">
                <UserCheck className="w-3 h-3 text-green-400" />
                Verbunden
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] tracking-tight mb-2">
              {profile.name}
            </h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Klasse {profile.class} • Letzte Aktivität: Heute
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold font-['Space_Grotesk']">{moodAvg}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{LABELS.metrics.mood}</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center">
                <div className="text-2xl font-bold font-['Space_Grotesk']">{habitsDone}/5</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{LABELS.metrics.habits}</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center">
                <div className="text-2xl font-bold font-['Space_Grotesk']">{projects.length}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Projekte</div>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setTeacherNotifOpen(!teacherNotifOpen)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 relative"
              >
                <Bell className="w-4 h-4" /> Stimmungs-Nachrichten
                {unreadTeacherCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadTeacherCount}
                  </span>
                )}
              </button>
              {teacherNotifOpen && (
                <div className="absolute top-full right-0 mt-2 w-[320px] max-h-[400px] bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">Stimmungs-Nachrichten</span>
                    {unreadTeacherCount > 0 && onMarkAllTeacherNotificationsRead && (
                      <button onClick={() => { onMarkAllTeacherNotificationsRead(); }} className="text-[10px] font-bold text-blue-600 hover:underline">Alle gelesen</button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {teacherNotifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500">Keine Stimmungs-Nachrichten.</p>
                    ) : (
                      teacherNotifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{n.studentName}</p>
                              <p className="text-xs text-slate-800 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{n.date}</p>
                            </div>
                            {!n.read && onMarkTeacherNotificationRead && (
                              <button onClick={() => onMarkTeacherNotificationRead(n.id)} className="text-[10px] text-blue-600 font-bold shrink-0">Gelesen</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setViewMode('dashboard')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> {LABELS.teacher.dashboard}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Connection */}
        <div className="space-y-6">
          {/* Stimmung & Nachricht (dieser Schüler) */}
          {(() => {
            const mood = profile.mood ?? [];
            const moodMessages = profile.moodMessages ?? [];
            const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
            const today = new Date().getDay();
            const todayIndex = today === 0 ? 4 : Math.min(today - 1, 4);
            const lastFilledIndex = [...mood].map((m, i) => (m > 0 ? i : -1)).filter((i) => i >= 0).pop();
            const idx = lastFilledIndex ?? todayIndex;
            const hasMessage = moodMessages[idx];
            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-slate-400" /> Stimmung & Nachricht
                </h3>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0">
                    {mood[idx] >= 5 ? '🤩' : mood[idx] >= 4 ? '😊' : mood[idx] >= 3 ? '😐' : mood[idx] >= 2 ? '🥱' : mood[idx] >= 1 ? '😕' : '😶'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {dayNames[idx]} {mood[idx] > 0 ? `Stimmung: ${mood[idx]}/5` : 'Noch nicht erfasst'}
                    </p>
                    {hasMessage && (
                      <p className="text-xs text-slate-600 mt-2 italic border-l-2 border-slate-200 pl-3">"{hasMessage}"</p>
                    )}
                    {!hasMessage && mood[idx] > 0 && (
                      <p className="text-xs text-slate-400 mt-1">Keine Nachricht dazu.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Class Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Schüler
              </h3>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {students.map((s) => {
                const metrics = studentsWithMetrics.find(m => m.student.id === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectStudent(s.id)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors ${
                      s.id === selectedStudentId
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${metrics?.status === 'red' ? 'bg-red-500' : metrics?.status === 'yellow' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate">{s.profile.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {s.projects.filter(p => p.status === 'active').length} {LABELS.metrics.active}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400" /> Wochenfokus
            </h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">{profile.weeklyFocus || 'Nicht gesetzt'}</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Fokus dieser Woche.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">Aktuelle Projekte</h3>
              <button 
                onClick={() => onNavigate(Sector.WORKSHOP)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Alle ansehen <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {activeProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Keine Projekte in Arbeit.</div>
              ) : (
                activeProjects.map(p => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-12 rounded-full ${p.type === 'passion' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-0.5">{p.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-md">{p.passionQuestion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-700">{p.milestones.filter(m => m.completed).length} / {p.milestones.length}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{LABELS.milestones.title}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Communication Tool */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            {isMessageSent && (
              <div className="absolute inset-0 bg-green-50/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900">Nachricht gesendet!</h3>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{LABELS.teacher.sendFeedback}</h3>
                <p className="text-xs text-slate-500">{LABELS.teacher.message} {profile.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setMessageType('info')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${messageType === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Info
                </button>
                <button 
                  onClick={() => setMessageType('success')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Lob
                </button>
                <button 
                  onClick={() => setMessageType('improve')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${messageType === 'improve' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Verbessern
                </button>
                <button 
                  onClick={() => setMessageType('alert')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${messageType === 'alert' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Wichtig
                </button>
              </div>
              <textarea 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Deine Nachricht an ${profile.name}...`}
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:border-blue-500 outline-none resize-none transition-colors"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleSend}
                  disabled={!messageText.trim()}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="w-4 h-4" /> Senden
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
