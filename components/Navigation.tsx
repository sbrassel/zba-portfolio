
import React from 'react';
import { BookOpen, Hammer, Briefcase, Calendar, GraduationCap } from 'lucide-react';
import { Sector, StudentProfile } from '../types';
import { LABELS } from '../labels';

interface NavigationProps {
  currentSector: Sector;
  setSector: (sector: Sector) => void;
  profile: StudentProfile;
}

export const Navigation: React.FC<NavigationProps> = ({ currentSector, setSector, profile }) => {
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

  return (
    <div className="w-full md:w-16 lg:w-56 bg-white h-screen flex flex-col border-r border-slate-200 sticky top-0 left-0 z-50 shadow-sm transition-all duration-300">
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
            onClick={() => setSector(Sector.TEACHER)}
            aria-label="Lehreransicht öffnen"
            aria-current={currentSector === Sector.TEACHER ? 'page' : undefined}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group ${
              currentSector === Sector.TEACHER
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
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
  );
};
