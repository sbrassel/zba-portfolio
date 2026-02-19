
import React, { useState } from 'react';
import { BookOpen, Hammer, Briefcase, Calendar, GraduationCap, Lock } from 'lucide-react';
import { Sector, StudentProfile } from '../types';
import { LABELS } from '../labels';

interface NavigationProps {
  currentSector: Sector;
  setSector: (sector: Sector) => void;
  profile: StudentProfile;
}

const TEACHER_PIN = '1234';

export const Navigation: React.FC<NavigationProps> = ({ currentSector, setSector, profile }) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);

  const navItems = [
    { 
      id: Sector.COMPASS, 
      label: LABELS.nav.logbuch, 
      icon: <BookOpen className="w-4 h-4" strokeWidth={1.5} /> 
    },
    { 
      id: Sector.WORKSHOP, 
      label: LABELS.nav.werkstatt, 
      icon: <Hammer className="w-4 h-4" strokeWidth={1.5} /> 
    },
    { 
      id: Sector.SHOWCASE, 
      label: LABELS.nav.showcase, 
      icon: <Briefcase className="w-4 h-4" strokeWidth={1.5} /> 
    },
    { 
      id: Sector.CALENDAR, 
      label: LABELS.nav.calendar, 
      icon: <Calendar className="w-4 h-4" strokeWidth={1.5} /> 
    },
  ];

  const handleTeacherClick = () => {
    if (teacherUnlocked) {
      setSector(Sector.TEACHER);
    } else {
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === TEACHER_PIN) {
      setTeacherUnlocked(true);
      setShowPinModal(false);
      setSector(Sector.TEACHER);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-16 lg:w-56 bg-white h-screen flex-col border-r border-slate-200 sticky top-0 left-0 z-50 shadow-sm transition-all duration-300">
        {/* Brand */}
        <div className="p-4 flex items-center justify-center lg:justify-start gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Stadt_Basel_Logo.svg/1200px-Stadt_Basel_Logo.svg.png" 
               alt="ZBA Logo" 
               className="w-full h-full object-contain"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs">BS</div>';
               }}
             />
          </div>
          <div className="hidden lg:block">
             <h1 className="font-['Space_Grotesk'] font-bold text-sm text-slate-900 leading-none tracking-tight">{LABELS.nav.title}</h1>
             <span className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold">{LABELS.nav.subtitle}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 py-4" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSector(item.id)}
              aria-label={`${item.label} öffnen`}
              aria-current={currentSector === item.id ? 'page' : undefined}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group relative ${
                currentSector === item.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className={`transition-transform duration-200 ${currentSector === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {item.icon}
              </div>
              <div className="hidden lg:block text-left">
                <p className={`font-medium text-xs leading-tight ${currentSector === item.id ? 'text-blue-900 font-bold' : 'text-slate-600'}`}>
                  {item.label}
                </p>
              </div>
              {currentSector === item.id && (
                 <div className="absolute right-2 w-1 h-1 rounded-full bg-blue-600 lg:hidden"></div>
              )}
            </button>
          ))}

          <div className="pt-3 mt-3 border-t border-slate-100">
             <button
              onClick={handleTeacherClick}
              aria-label="Lehreransicht öffnen"
              aria-current={currentSector === Sector.TEACHER ? 'page' : undefined}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group ${
                currentSector === Sector.TEACHER
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              {teacherUnlocked ? (
                <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Lock className="w-4 h-4" strokeWidth={1.5} />
              )}
              <div className="hidden lg:block text-left">
                <p className="font-bold text-[9px] uppercase tracking-wider">{LABELS.nav.teacher}</p>
              </div>
            </button>
          </div>
        </nav>

        {/* User */}
        <div className="p-3 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 font-bold font-['Space_Grotesk'] text-xs shadow-sm">
              {profile.name.charAt(0)}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="font-bold text-xs text-slate-900 truncate leading-tight">{profile.name}</p>
              <p className="text-[8px] text-slate-500 uppercase tracking-wider">{profile.class}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg safe-area-bottom">
        <nav className="flex items-center justify-around px-2 py-1" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSector(item.id)}
              aria-label={`${item.label} öffnen`}
              aria-current={currentSector === item.id ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all min-w-[56px] ${
                currentSector === item.id
                  ? 'text-blue-600'
                  : 'text-slate-400'
              }`}
            >
              <div className={currentSector === item.id ? 'text-blue-600' : 'text-slate-400'}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold leading-tight ${
                currentSector === item.id ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
              {currentSector === item.id && (
                <div className="w-4 h-0.5 rounded-full bg-blue-600 mt-0.5"></div>
              )}
            </button>
          ))}
          <button
            onClick={handleTeacherClick}
            aria-label="Lehreransicht öffnen"
            aria-current={currentSector === Sector.TEACHER ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all min-w-[56px] ${
              currentSector === Sector.TEACHER
                ? 'text-slate-900'
                : 'text-slate-400'
            }`}
          >
            {teacherUnlocked ? (
              <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Lock className="w-4 h-4" strokeWidth={1.5} />
            )}
            <span className="text-[9px] font-bold leading-tight">LP</span>
          </button>
        </nav>
      </div>

      {/* PIN Modal for Teacher Access */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 text-center">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">{LABELS.nav.teacher}</h3>
              <p className="text-xs text-slate-500 mt-1">PIN eingeben für Zugang</p>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="PIN"
                autoFocus
                className={`w-full text-center text-2xl font-bold tracking-[0.5em] bg-slate-50 border rounded-xl p-4 outline-none transition-colors ${
                  pinError ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {pinError && (
                <p className="text-xs text-red-500 text-center font-medium">Falscher PIN. Bitte erneut versuchen.</p>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors rounded-lg"
              >
                Abbrechen
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pinInput.length < 4}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-40"
              >
                Entsperren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
