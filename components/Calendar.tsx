import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CalendarClock,
  FileText,
  ClipboardList,
  AlertCircle,
  BookOpen,
  MoreHorizontal,
  Upload,
} from 'lucide-react';
import { CalendarEvent, CalendarEventType, TimetableEntry, Project } from '../types';
import { TIMETABLE_SLOTS } from '../constants';
import { LABELS } from '../labels';

interface CalendarProps {
  calendarEvents: CalendarEvent[];
  timetable: TimetableEntry[];
  onUpdateCalendarEvents: (events: CalendarEvent[]) => void;
  onUpdateTimetable: (entries: TimetableEntry[]) => void;
  projects: Project[];
}

const WEEKDAYS = [LABELS.calendar.mo, LABELS.calendar.di, LABELS.calendar.mi, LABELS.calendar.do, LABELS.calendar.fr, 'Sa', 'So'];

function getMonthDays(year: number, month: number): { date: Date; dateStr: string; isCurrentMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7; // Monday = 0
  const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLast = new Date(prevYear, prevMonth + 1, 0).getDate();
  for (let i = 0; i < startPad; i++) {
    const d = prevLast - startPad + 1 + i;
    const date = new Date(prevYear, prevMonth, d);
    days.push({
      date,
      dateStr: date.toISOString().slice(0, 10),
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      dateStr: date.toISOString().slice(0, 10),
      isCurrentMonth: true,
    });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({
      date,
      dateStr: date.toISOString().slice(0, 10),
      isCurrentMonth: false,
    });
  }
  return days;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const EVENT_TYPE_ICON: Record<CalendarEventType, React.ReactNode> = {
  termin: <CalendarClock className="w-3 h-3" />,
  deadline: <AlertCircle className="w-3 h-3" />,
  arbeit: <ClipboardList className="w-3 h-3" />,
  pruefung: <BookOpen className="w-3 h-3" />,
  sonstiges: <MoreHorizontal className="w-3 h-3" />,
};

const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  termin: LABELS.calendar.addTermin,
  deadline: LABELS.calendar.addDeadline,
  arbeit: LABELS.calendar.addArbeit,
  pruefung: LABELS.calendar.addPruefung,
  sonstiges: LABELS.calendar.addSonstiges,
};

const EVENT_TYPE_CLASS: Record<CalendarEventType, string> = {
  termin: 'bg-blue-100 text-blue-800',
  deadline: 'bg-amber-100 text-amber-800',
  arbeit: 'bg-green-100 text-green-800',
  pruefung: 'bg-red-100 text-red-800',
  sonstiges: 'bg-slate-100 text-slate-700',
};

export const Calendar: React.FC<CalendarProps> = ({
  calendarEvents,
  timetable,
  onUpdateCalendarEvents,
  onUpdateTimetable,
  projects,
}) => {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  const [activeTab, setActiveTab] = useState<'calendar' | 'stundenplan'>('calendar');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [eventModal, setEventModal] = useState<{ mode: 'add' | 'edit'; event?: CalendarEvent; defaultDate?: string } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const monthDays = useMemo(
    () => getMonthDays(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month]
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    calendarEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    Object.keys(map).forEach((d) => map[d].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
    return map;
  }, [calendarEvents]);

  const upcomingEvents = useMemo(() => {
    const todayStr = toDateStr(today);
    return calendarEvents
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
      .slice(0, 10);
  }, [calendarEvents, today]);

  const selectedDayEvents = selectedDateStr ? eventsByDate[selectedDateStr] || [] : [];

  const goPrevMonth = () => {
    setViewMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }));
  };
  const goNextMonth = () => {
    setViewMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }));
  };

  const monthLabel = `${new Date(viewMonth.year, viewMonth.month).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}`;

  const handleSaveEvent = (event: CalendarEvent) => {
    const list = eventModal?.mode === 'edit' && eventModal.event
      ? calendarEvents.map((e) => (e.id === event.id ? event : e))
      : [...calendarEvents, event];
    onUpdateCalendarEvents(list);
    setEventModal(null);
  };

  const handleDeleteEvent = (id: string) => {
    onUpdateCalendarEvents(calendarEvents.filter((e) => e.id !== id));
    setEventModal(null);
  };

  const getTimetableEntry = (weekday: number, slotIndex: number): TimetableEntry | undefined =>
    timetable.find((e) => e.weekday === weekday && e.slotIndex === slotIndex);

  const setTimetableCell = (weekday: number, slotIndex: number, title: string, subject?: string) => {
    const rest = timetable.filter((e) => !(e.weekday === weekday && e.slotIndex === slotIndex));
    if (title.trim()) {
      onUpdateTimetable([...rest, { weekday, slotIndex, title: title.trim(), subject: subject?.trim() || undefined }]);
    } else {
      onUpdateTimetable(rest);
    }
  };

  const parseImport = () => {
    const lines = importText.trim().split(/\r?\n/).map((l) => l.split(/\t/));
    const entries: TimetableEntry[] = [];
    for (let row = 0; row < Math.min(5, lines.length); row++) {
      for (let col = 0; col < Math.min(4, (lines[row] || []).length); col++) {
        const cell = (lines[row] || [])[col]?.trim();
        if (cell) entries.push({ weekday: row, slotIndex: col, title: cell });
      }
    }
    onUpdateTimetable(entries);
    setImportText('');
    setImportModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">{LABELS.calendar.title}</h2>
          <p className="text-slate-500 text-xs font-medium">{LABELS.calendar.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
              activeTab === 'calendar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Kalender
          </button>
          <button
            onClick={() => setActiveTab('stundenplan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
              activeTab === 'stundenplan' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> {LABELS.calendar.stundenplan}
          </button>
        </div>
      </div>

      {activeTab === 'calendar' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
              <button onClick={goPrevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Vorheriger Monat">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-sm text-slate-900 capitalize">{monthLabel}</span>
              <button onClick={goNextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Nächster Monat">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 flex-1 min-h-[280px]">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="p-1 text-center text-[10px] font-bold text-slate-500 border-b border-slate-100">
                  {wd}
                </div>
              ))}
              {monthDays.map(({ date, dateStr, isCurrentMonth }) => {
                const dayEvents = eventsByDate[dateStr] || [];
                const isSelected = selectedDateStr === dateStr;
                const isToday = dateStr === toDateStr(today);
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`p-1 border-b border-r border-slate-100 text-left overflow-hidden flex flex-col min-h-[60px] ${
                      !isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white hover:bg-slate-50'
                    } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''} ${isToday ? 'bg-blue-50/50' : ''}`}
                  >
                    <span className={`text-[11px] font-bold ${isToday ? 'text-blue-600' : ''}`}>{date.getDate()}</span>
                    <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className={`text-[9px] truncate px-1 py-0.5 rounded ${EVENT_TYPE_CLASS[e.type]}`}
                          title={e.title}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setEventModal({ mode: 'edit', event: e });
                          }}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <span className="text-[8px] text-slate-400">+{dayEvents.length - 3}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setEventModal({ mode: 'add', defaultDate: selectedDateStr || toDateStr(today) })}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> {LABELS.calendar.addEvent}
              </button>
            </div>
          </div>

          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{LABELS.calendar.upcoming}</h3>
              <ul className="space-y-2">
                {upcomingEvents.length === 0 ? (
                  <li className="text-[11px] text-slate-400">{LABELS.calendar.noEvents}</li>
                ) : (
                  upcomingEvents.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setEventModal({ mode: 'edit', event: e })}
                    >
                      <span className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${EVENT_TYPE_CLASS[e.type]}`}>
                        {EVENT_TYPE_ICON[e.type]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{e.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {e.date} {e.startTime && ` ${e.startTime}`}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
            {selectedDateStr && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  {selectedDateStr} {selectedDayEvents.length > 0 && `(${selectedDayEvents.length})`}
                </h3>
                <ul className="space-y-2">
                  {selectedDayEvents.length === 0 ? (
                    <li className="text-[11px] text-slate-400">{LABELS.calendar.noEvents}</li>
                  ) : (
                    selectedDayEvents.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setEventModal({ mode: 'edit', event: e })}
                      >
                        <span className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${EVENT_TYPE_CLASS[e.type]}`}>
                          {EVENT_TYPE_ICON[e.type]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-900 truncate">{e.title}</p>
                          {e.startTime && <p className="text-[10px] text-slate-500">{e.startTime} – {e.endTime || ''}</p>}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{LABELS.calendar.stundenplan}</h3>
              <p className="text-xs text-slate-500">{LABELS.calendar.stundenplanSubtitle}</p>
            </div>
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Upload className="w-4 h-4" /> {LABELS.calendar.importStundenplan}
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-200 p-2 text-left text-xs font-bold text-slate-500 w-28"></th>
                  {[0, 1, 2, 3, 4].map((weekday) => (
                    <th key={weekday} className="border border-slate-200 p-2 text-center text-xs font-bold text-slate-600 w-32">
                      {WEEKDAYS[weekday]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMETABLE_SLOTS.map((slot, slotIndex) => (
                  <tr key={slotIndex}>
                    <td className="border border-slate-200 p-2 text-xs font-bold text-slate-600 bg-slate-50/50 whitespace-nowrap">
                      {slot.start} – {slot.end}
                    </td>
                    {[0, 1, 2, 3, 4].map((weekday) => {
                      const entry = getTimetableEntry(weekday, slotIndex);
                      return (
                        <td key={weekday} className="border border-slate-200 p-0 align-top">
                          <input
                            type="text"
                            value={entry?.title || ''}
                            onChange={(ev) => setTimetableCell(weekday, slotIndex, ev.target.value)}
                            placeholder="Fach / Lektion"
                            className="w-full h-14 px-2 text-xs border-0 rounded-none focus:ring-2 focus:ring-blue-400 focus:ring-inset outline-none"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event modal */}
      {eventModal && (
        <EventModal
          mode={eventModal.mode}
          event={eventModal.event}
          defaultDate={eventModal.defaultDate}
          projects={projects}
          onSave={handleSaveEvent}
          onDelete={eventModal.mode === 'edit' && eventModal.event ? () => handleDeleteEvent(eventModal.event!.id) : undefined}
          onClose={() => setEventModal(null)}
        />
      )}

      {/* Import modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">{LABELS.calendar.importStundenplan}</h3>
              <button onClick={() => { setImportModalOpen(false); setImportText(''); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={LABELS.calendar.importPlaceholder}
                className="w-full h-40 p-3 border border-slate-200 rounded-xl text-sm font-mono resize-none outline-none focus:border-blue-500"
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => { setImportModalOpen(false); setImportText(''); }} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg">
                Abbrechen
              </button>
              <button onClick={parseImport} className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700">
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EventModalProps {
  mode: 'add' | 'edit';
  event?: CalendarEvent;
  defaultDate?: string;
  projects: Project[];
  onSave: (event: CalendarEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ mode, event, defaultDate, projects, onSave, onDelete, onClose }) => {
  const todayStr = toDateStr(new Date());
  const [title, setTitle] = useState(event?.title ?? '');
  const [type, setType] = useState<CalendarEventType>(event?.type ?? 'termin');
  const [date, setDate] = useState(event?.date ?? defaultDate ?? todayStr);
  const [startTime, setStartTime] = useState(event?.startTime ?? '');
  const [endTime, setEndTime] = useState(event?.endTime ?? '');
  const [allDay, setAllDay] = useState(event?.allDay ?? true);
  const [note, setNote] = useState(event?.note ?? '');
  const [projectId, setProjectId] = useState(event?.projectId ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newEvent: CalendarEvent = {
      id: event?.id ?? `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      type,
      date,
      allDay: allDay || (!startTime && !endTime),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(note.trim() && { note: note.trim() }),
      ...(projectId && { projectId }),
    };
    onSave(newEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{mode === 'add' ? LABELS.calendar.addEvent : 'Eintrag bearbeiten'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{LABELS.calendar.eventTitle}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
              placeholder="z.B. Abgabe Projekt"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{LABELS.calendar.eventType}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CalendarEventType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
            >
              {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((t) => (
                <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{LABELS.calendar.date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded border-slate-300" />
            <span className="text-xs font-medium text-slate-700">{LABELS.calendar.allDay}</span>
          </label>
          {!allDay && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{LABELS.calendar.startTime}</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{LABELS.calendar.endTime}</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{LABELS.calendar.note}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none outline-none focus:border-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{LABELS.calendar.linkProject}</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
            >
              <option value="">— Keins —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            {mode === 'edit' && onDelete && (
              <button type="button" onClick={onDelete} className="px-4 py-2 text-red-600 font-bold text-sm hover:bg-red-50 rounded-lg">
                {LABELS.calendar.delete}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg">
              Abbrechen
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700">
              {LABELS.calendar.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
