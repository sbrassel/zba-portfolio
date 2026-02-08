
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CompetencyCategory, Competency } from '../types';
import { RefreshCw, ChevronLeft } from 'lucide-react';

interface CompetencyWheelProps {
  initialData: { categories: CompetencyCategory[] };
  onUpdateCategories?: (categories: CompetencyCategory[]) => void;
}

export const CompetencyWheel: React.FC<CompetencyWheelProps> = ({ initialData, onUpdateCategories }) => {
  const [categories, setCategories] = useState<CompetencyCategory[]>(initialData.categories);

  useEffect(() => {
    setCategories(initialData.categories);
  }, [initialData.categories]);
  const [expandedCategory, setExpandedCategory] = useState<CompetencyCategory | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [showModal, setShowModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getGlobalLevelInfo = useCallback(() => {
    let totalScore = 0;
    let totalCount = 0;
    categories.forEach(cat => {
        cat.competencies.forEach(comp => {
            totalScore += comp.level;
            totalCount++;
        });
    });
    const avg = totalCount > 0 ? totalScore / totalCount : 0;
    if (avg < 1.5) return { label: "Starter", level: 1 };
    if (avg < 2.5) return { label: "Entdecker", level: 2 };
    if (avg < 3.5) return { label: "Könner", level: 3 };
    return { label: "Profi", level: 4 };
  }, [categories]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    // Reduced outerRadius from 0.35 to 0.30 to prevent burst
    const outerRadius = size * 0.30;
    const innerRadius = size * 0.10;

    ctx.clearRect(0, 0, size, size);

    const items = expandedCategory === null ? categories : expandedCategory.competencies;
    const categoryAngle = (2 * Math.PI) / items.length;
    let currentAngle = -Math.PI / 2;
    
    items.forEach((item) => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + categoryAngle;
        
        let avgLevel;
        let color = '#2563EB';

        if (expandedCategory === null) {
            const cat = item as CompetencyCategory;
            color = cat.color;
            let totalLevel = 0;
            let count = 0;
            cat.competencies.forEach(comp => {
                totalLevel += comp.level;
                count++;
            });
            avgLevel = count > 0 ? totalLevel / count : 0;
        } else {
            const comp = item as Competency;
            color = expandedCategory.color;
            avgLevel = comp.level;
        }
        
        const minRadius = innerRadius;
        const maxRadius = outerRadius;
        const radiusRange = maxRadius - minRadius;
        const segmentRadius = minRadius + (radiusRange * (avgLevel / 4));
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, segmentRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        
        if (avgLevel > 0) {
            const rgb = hexToRgb(color);
            if (rgb) {
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.1 + (avgLevel / 4) * 0.6})`;
            } else {
                ctx.fillStyle = color;
            }
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
             ctx.fillStyle = '#F8FAFC';
             ctx.fill();
        }
        currentAngle += categoryAngle;
    });
    
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    const radiusRange = outerRadius - innerRadius;
    
    for (let i = 1; i <= 4; i++) {
        const radius = innerRadius + (radiusRange * (i / 4));
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    currentAngle = -Math.PI / 2;
    for (let i = 0; i < items.length; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(currentAngle) * innerRadius, centerY + Math.sin(currentAngle) * innerRadius);
        ctx.lineTo(centerX + Math.cos(currentAngle) * outerRadius, centerY + Math.sin(currentAngle) * outerRadius);
        ctx.stroke();
        currentAngle += categoryAngle;
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = expandedCategory ? expandedCategory.color : '#CBD5E1';
    ctx.lineWidth = expandedCategory ? 2 : 1;
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (expandedCategory) {
        ctx.fillStyle = expandedCategory.color;
        ctx.font = `bold ${size / 28}px Space Grotesk, sans-serif`;
        ctx.fillText(expandedCategory.name.substring(0, 4) + '.', centerX, centerY);
    } else {
        const levelInfo = getGlobalLevelInfo();
        ctx.fillStyle = '#64748B';
        ctx.font = `bold ${size / 42}px Inter, sans-serif`;
        ctx.fillText(`LVL ${levelInfo.level}`, centerX, centerY - size/50);
        ctx.fillStyle = '#0F172A';
        ctx.font = `bold ${size / 30}px Space Grotesk, sans-serif`;
        ctx.fillText(levelInfo.label, centerX, centerY + size/40);
    }
  }, [categories, expandedCategory, getGlobalLevelInfo]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !expandedCategory) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    const innerRadius = canvasRef.current.width * 0.10;
    const dx = x - centerX;
    const dy = y - centerY;
    if (Math.sqrt(dx * dx + dy * dy) < innerRadius) {
      setExpandedCategory(null);
    }
  };

  const handleIconClick = (item: CompetencyCategory | Competency) => {
    if (expandedCategory === null) {
      setExpandedCategory(item as CompetencyCategory);
    } else {
      setSelectedCompetency(item as Competency);
      setShowModal(true);
    }
  };

  const handleLevelSelect = (level: number) => {
    if (!selectedCompetency || !expandedCategory) return;
    const newCategories = [...categories];
    const catIndex = newCategories.findIndex(c => c.name === expandedCategory.name);
    if (catIndex !== -1) {
       const compIndex = newCategories[catIndex].competencies.findIndex(c => c.id === selectedCompetency.id);
       if (compIndex !== -1) {
           newCategories[catIndex].competencies[compIndex].level = level;
           setCategories(newCategories);
           setExpandedCategory({...newCategories[catIndex]});
           onUpdateCategories?.(newCategories);
       }
    }
    setShowModal(false);
  };

  const renderIcons = () => {
    const items = expandedCategory === null ? categories : expandedCategory.competencies;
    const angleStep = (2 * Math.PI) / items.length;
    
    return items.map((item, idx) => {
        const angle = -Math.PI / 2 + (angleStep * idx);
        // Reduced distance from 44% to 40% to prevent edge clipping
        const left = 50 + Math.cos(angle) * 40; 
        const top = 50 + Math.sin(angle) * 40;
        const isCategory = expandedCategory === null;
        const color = isCategory ? (item as CompetencyCategory).color : expandedCategory!.color;
        
        return (
            <div
                key={isCategory ? (item as CompetencyCategory).name : (item as Competency).id}
                className="absolute flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
                style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleIconClick(item);
                }}
            >
                <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm transition-all border bg-white"
                    style={{
                        borderColor: color,
                        color: color,
                    }}
                >
                    {item.icon}
                </div>
                <div 
                  className="mt-0.5 px-1.5 py-0.5 bg-white/90 backdrop-blur rounded-[4px] text-[7px] font-bold uppercase tracking-wider border border-slate-100 shadow-sm whitespace-nowrap"
                  style={{ color: '#64748B' }}
                >
                    {item.name}
                </div>
            </div>
        );
    });
  };

  return (
    <div className="flex flex-col items-center select-none w-full h-full justify-center">
      <div className="relative w-full max-w-[280px] aspect-square mx-auto" ref={containerRef}>
         <canvas 
            ref={canvasRef} 
            width={600} 
            height={600} 
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
         />
         {renderIcons()}
      </div>

      {expandedCategory && (
         <div className="flex gap-2 w-full mt-2 px-8">
             <button 
                onClick={() => setExpandedCategory(null)}
                className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-[10px] font-bold transition-colors"
             >
                <ChevronLeft className="w-3 h-3" /> ZURÜCK
             </button>
         </div>
      )}

      {showModal && selectedCompetency && expandedCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-[240px] overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-opacity-10" style={{ backgroundColor: `${expandedCategory.color}20`, color: expandedCategory.color }}>{selectedCompetency.icon}</div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">{selectedCompetency.name}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Stufe 1 - 4</p>
                </div>
             </div>
             <div className="p-4">
                 <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((level) => (
                        <button key={level} onClick={() => handleLevelSelect(level)} className="h-10 rounded-lg font-bold text-sm border transition-all" style={{ backgroundColor: selectedCompetency.level === level ? expandedCategory.color : '#FFFFFF', borderColor: selectedCompetency.level === level ? expandedCategory.color : '#E2E8F0', color: selectedCompetency.level === level ? '#FFFFFF' : '#94A3B8' }}>{level}</button>
                    ))}
                 </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
