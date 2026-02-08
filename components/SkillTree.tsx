
import React, { useState } from 'react';
import { CompetencyCategory, Competency } from '../types';
import { ChevronLeft, Lock, Star } from 'lucide-react';
import { LABELS } from '../labels';

interface SkillTreeProps {
  data: { categories: CompetencyCategory[] };
}

export const SkillTree: React.FC<SkillTreeProps> = ({ data }) => {
  const [selectedNode, setSelectedNode] = useState<Competency | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CompetencyCategory | null>(null);

  // Layout calculation helper
  // Root is at center. Categories branch out. Competencies branch from categories.
  const centerX = 400;
  const centerY = 300;
  const categoryRadius = 160;
  const competencyRadius = 100;

  const handleNodeClick = (category: CompetencyCategory, competency: Competency) => {
    setSelectedCategory(category);
    setSelectedNode(competency);
  };

  const renderConnections = () => {
    return data.categories.map((cat, catIdx) => {
      const catAngle = (Math.PI * 2 * catIdx) / data.categories.length - Math.PI / 2;
      const catX = centerX + Math.cos(catAngle) * categoryRadius;
      const catY = centerY + Math.sin(catAngle) * categoryRadius;

      // Line from Center to Category
      const toCenter = (
        <path
          key={`conn-center-${catIdx}`}
          d={`M${centerX},${centerY} L${catX},${catY}`}
          stroke="#CBD5E1"
          strokeWidth="2"
          className="animate-in fade-in duration-1000"
        />
      );

      // Lines from Category to Competencies
      const competencyLines = cat.competencies.map((comp, compIdx) => {
          // Spread competencies in a fan shape around the category node, pointing outwards
          const spreadAngle = Math.PI / 3; // 60 degrees spread
          const startAngle = catAngle - spreadAngle / 2;
          const compAngle = startAngle + (spreadAngle * compIdx) / (cat.competencies.length - 1);
          
          const compX = catX + Math.cos(compAngle) * competencyRadius;
          const compY = catY + Math.sin(compAngle) * competencyRadius;

          return (
             <path
                key={`conn-${comp.id}`}
                d={`M${catX},${catY} L${compX},${compY}`}
                stroke={comp.level > 0 ? cat.color : '#E2E8F0'}
                strokeWidth={comp.level > 0 ? 2 : 1}
                strokeDasharray={comp.level > 0 ? '0' : '5,5'}
                className="transition-colors duration-500"
             />
          );
      });

      return <g key={`group-${catIdx}`}>{toCenter}{competencyLines}</g>;
    });
  };

  const renderNodes = () => {
    return data.categories.map((cat, catIdx) => {
      const catAngle = (Math.PI * 2 * catIdx) / data.categories.length - Math.PI / 2;
      const catX = centerX + Math.cos(catAngle) * categoryRadius;
      const catY = centerY + Math.sin(catAngle) * categoryRadius;

      // Category Node
      const categoryNode = (
        <g key={`cat-node-${catIdx}`} className="cursor-default">
           <circle cx={catX} cy={catY} r={24} fill="white" stroke={cat.color} strokeWidth="3" />
           <text x={catX} y={catY} dy="5" textAnchor="middle" fontSize="16">{cat.icon}</text>
           <text x={catX} y={catY + 40} textAnchor="middle" fill="#64748B" fontSize="10" fontWeight="bold" className="uppercase tracking-wider">{cat.name}</text>
        </g>
      );

      // Competency Nodes
      const competencyNodes = cat.competencies.map((comp, compIdx) => {
        const spreadAngle = Math.PI / 3;
        const startAngle = catAngle - spreadAngle / 2;
        const compAngle = startAngle + (spreadAngle * compIdx) / (cat.competencies.length - 1);
        
        const compX = catX + Math.cos(compAngle) * competencyRadius;
        const compY = catY + Math.sin(compAngle) * competencyRadius;

        const isLocked = comp.level === 0;
        const isMaxed = comp.level === 4;

        return (
            <g 
                key={comp.id} 
                onClick={() => handleNodeClick(cat, comp)}
                className="cursor-pointer hover:scale-110 transition-transform duration-200"
            >
                {/* Node Circle */}
                <circle 
                    cx={compX} 
                    cy={compY} 
                    r={18} 
                    fill={isLocked ? '#F1F5F9' : 'white'} 
                    stroke={isLocked ? '#CBD5E1' : cat.color} 
                    strokeWidth={isMaxed ? 3 : 2} 
                />
                
                {/* Inner Icon */}
                {isLocked ? (
                     <Lock x={compX-7} y={compY-7} size={14} className="text-slate-300" />
                ) : (
                    <text x={compX} y={compY} dy="4" textAnchor="middle" fontSize="12">{comp.icon}</text>
                )}

                {/* Level Stars (Tiny dots around) */}
                {!isLocked && (
                    <g>
                        {[...Array(comp.level)].map((_, i) => (
                             <circle 
                                key={i}
                                cx={compX + Math.cos(Math.PI/2 + i*0.5) * 24}
                                cy={compY + Math.sin(Math.PI/2 + i*0.5) * 24}
                                r={2}
                                fill={cat.color}
                             />
                        ))}
                    </g>
                )}
            </g>
        );
      });

      return <g key={`nodes-${catIdx}`}>{competencyNodes}{categoryNode}</g>;
    });
  };

  return (
    <div className="flex flex-col items-center w-full relative">
       {/* SVG Layer */}
       <div className="relative w-full overflow-auto md:overflow-visible">
            <svg width="800" height="600" viewBox="0 0 800 600" className="mx-auto select-none">
                {/* Connecting Lines */}
                {renderConnections()}
                
                {/* Center "Me" Node */}
                <circle cx={centerX} cy={centerY} r={35} fill="#0F172A" className="shadow-xl" />
                <text x={centerX} y={centerY} dy="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">ME</text>

                {/* Nodes */}
                {renderNodes()}
            </svg>
       </div>

       {/* Detail Modal / Overlay for Selected Node */}
       {selectedNode && selectedCategory && (
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-72 animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-50 border border-slate-100">
                           {selectedNode.icon}
                       </div>
                       <div>
                           <h4 className="font-bold text-slate-900 leading-tight">{selectedNode.name}</h4>
                           <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: selectedCategory.color }}>{selectedCategory.name}</span>
                       </div>
                   </div>
                   <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
               </div>
               
               <div className="space-y-3 mt-3">
                   <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                       <span>{LABELS.general.level} {selectedNode.level} / 4</span>
                       <span className="text-blue-600">{selectedNode.level === 4 ? LABELS.skillTree.maxed : LABELS.skillTree.nextXp}</span>
                   </div>
                   {/* Level Progress Bar */}
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full transition-all duration-500" 
                         style={{ width: `${(selectedNode.level / 4) * 100}%`, backgroundColor: selectedCategory.color }}
                       ></div>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed">
                       {selectedNode.level === 0 ? "Dieser Bereich ist noch nicht freigeschaltet. Schließe Projekte ab, um Punkte zu sammeln." : 
                        "Du hast Grundlagen in diesem Bereich gezeigt. Nutze sie in weiteren Projekten für die nächste Stufe."}
                   </p>
               </div>
           </div>
       )}
    </div>
  );
};